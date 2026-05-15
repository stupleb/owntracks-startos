import { writeFile, mkdir } from 'node:fs/promises'
import { TLS_DIR, writeBrokerTls } from './certs'
import { Device, storeJson } from './fileModels/store.json'
import { i18n } from './i18n'
import { sdk } from './sdk'
import {
  frontendPort,
  mqttPlainPort,
  mqttTlsPort,
  mqttWsPort,
  recorderPort,
} from './utils'

// Mosquitto config: a loopback plain listener for the bundled recorder, and
// a public TLS listener on 0.0.0.0 for phones. Both require auth. TLS cert
// and key are fetched from the platform CA and written to rootfs each start.
// Four listeners. The plain loopback listener (1883) is for the recorder;
// the v4 and v6 TLS listeners on 8883 are for direct MQTT clients (raw TCP);
// the WebSocket listener on 8884 sits behind StartOS's HTTP reverse proxy,
// which terminates TLS at the edge and gives us dual-stack routing for free.
// password_file and acl_file are global (they can only appear once);
// certfile/keyfile are listener-scoped — the WebSocket listener has neither
// because the proxy handles TLS.
const mosquittoConf = `
allow_anonymous false
password_file /mosquitto/config/auth/passwd
acl_file /mosquitto/config/auth/acl
persistence true
persistence_location /mosquitto/data/
log_dest stdout

listener ${mqttPlainPort} 127.0.0.1

listener ${mqttTlsPort} 0.0.0.0
socket_domain ipv4
certfile ${TLS_DIR}/server-fullchain.pem
keyfile ${TLS_DIR}/server-key.pem

listener ${mqttTlsPort} ::
socket_domain ipv6
certfile ${TLS_DIR}/server-fullchain.pem
keyfile ${TLS_DIR}/server-key.pem

listener ${mqttWsPort} 0.0.0.0
protocol websockets
`

// Build the ACL file body. Every authenticated user — the bundled recorder
// and every registered device — gets read+write on the owntracks/# subtree.
// We tried scoping each device to owntracks/<device-name>/# but the OwnTracks
// phone apps publish under their own "Username" field (a setting independent
// from the MQTT auth username), so a per-prefix ACL silently denies legitimate
// publishes. The MQTT password is the security boundary; topic-prefix
// isolation would require the user to align two separate fields in the app
// and is more confusion than it's worth.
function aclBody(recorderUser: string, devices: Device[]): string {
  const users = [recorderUser, ...devices.map((d) => d.name)]
  return users
    .flatMap((u) => [`user ${u}`, `topic readwrite owntracks/#`, ''])
    .join('\n')
}

function seedScript(
  recorderUser: string,
  recorderPassword: string,
  devices: Device[],
): string {
  // Device names/passwords are validated to a safe charset (see store.json.ts
  // and the add-device action), so single-quoting is sufficient and there is
  // no shell-injection surface here.
  const passwdCommands = [
    `mosquitto_passwd -b -c /mosquitto/config/auth/passwd ${recorderUser} '${recorderPassword}'`,
    ...devices.map(
      (d) =>
        `mosquitto_passwd -b /mosquitto/config/auth/passwd ${d.name} '${d.password}'`,
    ),
  ].join('\n')

  // mosquitto 2.x emits a deprecation warning unless the passwd/acl files
  // are owned by root and not world-readable. Owner root, group mosquitto,
  // mode 0640: root rw, mosquitto user r via group membership, others none.
  // The auth/ directory itself needs 0750 so the mosquitto user can traverse.
  return `set -e
cat > /mosquitto/config/auth/acl <<'ACL_EOF'
${aclBody(recorderUser, devices)}
ACL_EOF
${passwdCommands}
chown root:mosquitto /mosquitto/config/auth /mosquitto/config/auth/acl /mosquitto/config/auth/passwd
chmod 0750 /mosquitto/config/auth
chmod 0640 /mosquitto/config/auth/acl /mosquitto/config/auth/passwd
chown -R mosquitto:mosquitto /mosquitto/data /mosquitto/logs
`
}

export const main = sdk.setupMain(async ({ effects }) => {
  console.info(i18n('Starting OwnTracks'))

  const recorderUser =
    (await storeJson.read((s) => s.recorderMqttUser).const(effects)) ??
    'recorder'
  const recorderPassword =
    (await storeJson.read((s) => s.recorderMqttPassword).const(effects)) ?? ''
  const devices =
    (await storeJson.read((s) => s.devices).const(effects)) ?? []

  const mqttHostnames =
    (await sdk.serviceInterface
      .getOwn(effects, 'mqtt', (i) =>
        i?.addressInfo?.format('hostname-info').map((h) => h.hostname),
      )
      .const()) ?? []

  const mosquittoSub = await sdk.SubContainer.of(
    effects,
    { imageId: 'mosquitto' },
    sdk.Mounts.of()
      .mountVolume({
        volumeId: 'main',
        subpath: 'mosquitto/data',
        mountpoint: '/mosquitto/data',
        readonly: false,
      })
      .mountVolume({
        volumeId: 'main',
        subpath: 'mosquitto/logs',
        mountpoint: '/mosquitto/logs',
        readonly: false,
      })
      .mountVolume({
        volumeId: 'main',
        subpath: 'mosquitto/auth',
        mountpoint: '/mosquitto/config/auth',
        readonly: false,
      }),
    'mosquitto-sub',
  )
  await mkdir(`${mosquittoSub.rootfs}/mosquitto/config`, { recursive: true })
  await writeFile(
    `${mosquittoSub.rootfs}/mosquitto/config/mosquitto.conf`,
    mosquittoConf,
  )
  await writeBrokerTls(effects, mosquittoSub.rootfs, mqttHostnames)

  const recorderSub = await sdk.SubContainer.of(
    effects,
    { imageId: 'recorder' },
    sdk.Mounts.of()
      .mountVolume({
        volumeId: 'main',
        subpath: 'recorder/store',
        mountpoint: '/store',
        readonly: false,
      })
      .mountVolume({
        volumeId: 'main',
        subpath: 'recorder/config',
        mountpoint: '/config',
        readonly: false,
      }),
    'recorder-sub',
  )

  const frontendSub = await sdk.SubContainer.of(
    effects,
    { imageId: 'frontend' },
    sdk.Mounts.of(),
    'frontend-sub',
  )
  // The frontend image ships nginx with a try_files rule that loops
  // infinitely if /config/config.js is missing. Provide the upstream's
  // minimal example shim so nginx returns the file and the SPA's
  // window.owntracks.config namespace exists for the bundle to read.
  await mkdir(
    `${frontendSub.rootfs}/usr/share/nginx/html/config`,
    { recursive: true },
  )
  await writeFile(
    `${frontendSub.rootfs}/usr/share/nginx/html/config/config.js`,
    `window.owntracks = window.owntracks || {};\nwindow.owntracks.config = {};\n`,
  )

  return sdk.Daemons.of(effects)
    .addOneshot('seed-mosquitto-config', {
      subcontainer: mosquittoSub,
      exec: {
        command: [
          'sh',
          '-c',
          seedScript(recorderUser, recorderPassword, devices),
        ],
        user: 'root',
      },
      requires: [],
    })
    .addDaemon('mosquitto', {
      subcontainer: mosquittoSub,
      exec: { command: sdk.useEntrypoint() },
      ready: {
        display: i18n('MQTT Broker'),
        fn: () =>
          sdk.healthCheck.checkPortListening(effects, mqttPlainPort, {
            successMessage: i18n('The MQTT broker is ready'),
            errorMessage: i18n('The MQTT broker is not ready'),
          }),
      },
      requires: ['seed-mosquitto-config'],
    })
    .addDaemon('recorder', {
      subcontainer: recorderSub,
      exec: {
        command: sdk.useEntrypoint(),
        env: {
          OTR_HOST: '127.0.0.1',
          OTR_PORT: String(mqttPlainPort),
          OTR_USER: recorderUser,
          OTR_PASS: recorderPassword,
        },
      },
      ready: {
        display: i18n('Recorder'),
        fn: () =>
          sdk.healthCheck.checkPortListening(effects, recorderPort, {
            successMessage: i18n('The recorder is ready'),
            errorMessage: i18n('The recorder is not ready'),
          }),
      },
      requires: ['mosquitto'],
    })
    .addDaemon('frontend', {
      subcontainer: frontendSub,
      exec: {
        command: sdk.useEntrypoint(),
        env: {
          SERVER_HOST: '127.0.0.1',
          SERVER_PORT: String(recorderPort),
        },
      },
      ready: {
        display: i18n('Web Interface'),
        fn: () =>
          sdk.healthCheck.checkPortListening(effects, frontendPort, {
            successMessage: i18n('The web interface is ready'),
            errorMessage: i18n('The web interface is not ready'),
          }),
      },
      requires: ['recorder'],
    })
})
