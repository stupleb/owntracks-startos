import { i18n } from './i18n'
import { sdk } from './sdk'
import { frontendPort, mqttTlsPort, mqttWsPort } from './utils'

export const setInterfaces = sdk.setupInterfaces(async ({ effects }) => {
  const receipts = []

  // Web UI — HTTP, StartOS terminates TLS at the edge.
  const uiMulti = sdk.MultiHost.of(effects, 'ui-multi')
  const uiOrigin = await uiMulti.bindPort(frontendPort, {
    protocol: 'http',
  })
  const ui = sdk.createInterface(effects, {
    name: i18n('Web UI'),
    id: 'ui',
    description: i18n('Map view of every device that has published a location'),
    type: 'ui',
    masked: false,
    schemeOverride: null,
    username: null,
    path: '',
    query: {},
  })
  receipts.push(await uiOrigin.export([ui]))

  // MQTT (TLS) — raw TCP, mosquitto terminates its own TLS. StartOS NATs
  // this only over IPv4; v6 clients hit ECONNREFUSED. The external port is
  // pinned to a non-standard high number so we don't squat on IANA 8883.
  const mqttMulti = sdk.MultiHost.of(effects, 'mqtt-multi')
  const mqttOrigin = await mqttMulti.bindPort(mqttTlsPort, {
    protocol: null,
    addSsl: null,
    preferredExternalPort: 28883,
    secure: { ssl: true },
  })
  const mqtt = sdk.createInterface(effects, {
    name: i18n('MQTT (TLS)'),
    id: 'mqtt',
    description: i18n(
      'MQTT endpoint for OwnTracks phone apps (typically Android, typically over LAN IP or local). Make sure to trust your StartOS Root CA (conveniently made available in the Actions tab) on each device before connecting.',
    ),
    type: 'api',
    masked: false,
    schemeOverride: { ssl: 'mqtts', noSsl: 'mqtts' },
    username: null,
    path: '',
    query: {},
  })
  receipts.push(await mqttOrigin.export([mqtt]))

  // MQTT (WebSocket) — HTTP-routed, StartOS terminates TLS at its dual-stack
  // edge and proxies plain WebSocket frames to mosquitto's WS listener.
  // Declared as a plain HTTP interface (no pinned external port, no addSsl
  // block) so StartOS handles port allocation, LE-cert issuance for custom
  // domains, and 443/SNI routing the same way it does for the Web UI.
  const wsMulti = sdk.MultiHost.of(effects, 'mqtt-ws-multi')
  const wsOrigin = await wsMulti.bindPort(mqttWsPort, {
    protocol: 'http',
  })
  const mqttWs = sdk.createInterface(effects, {
    name: i18n('MQTT (WebSocket)'),
    id: 'mqtt-ws',
    description: i18n(
      'MQTT-over-WebSocket endpoint. Use this in most cases – if you are using a public domain, if you are on iOS or if you want the .local hostname to work over IPv6.',
    ),
    type: 'api',
    masked: false,
    schemeOverride: null,
    username: null,
    path: '',
    query: {},
  })
  receipts.push(await wsOrigin.export([mqttWs]))

  return receipts
})
