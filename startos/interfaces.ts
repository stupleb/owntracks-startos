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
      'MQTT endpoint for OwnTracks phone apps. Install the CA certificate from the Actions tab on each device before connecting.',
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
  // edge and proxies plain WebSocket frames to mosquitto's WS listener. This
  // gives clients an IPv6/.local-friendly path that bypasses the raw-TCP
  // routing limitation. Pinned to 28884 so it sits next to the raw-TCP
  // endpoint at 28883 in the UI — easier on the eye, same conflict semantics
  // as any preference.
  const wsMulti = sdk.MultiHost.of(effects, 'mqtt-ws-multi')
  const wsOrigin = await wsMulti.bindPort(mqttWsPort, {
    protocol: 'http',
    // Top-level preferredExternalPort applies to the plain-HTTP path; the
    // user-facing URL is HTTPS (StartOS terminates TLS at its dual-stack
    // edge), so the port the user actually sees comes from addSsl. Set
    // both for belt-and-suspenders.
    preferredExternalPort: 28884,
    addSsl: { preferredExternalPort: 28884 },
  })
  const mqttWs = sdk.createInterface(effects, {
    name: i18n('MQTT (WebSocket)'),
    id: 'mqtt-ws',
    description: i18n(
      'MQTT-over-WebSocket endpoint. Use this if your client supports WebSocket transport (most OwnTracks apps do) and you want the .local hostname to work over IPv6.',
    ),
    type: 'api',
    masked: false,
    schemeOverride: null,
    username: null,
    path: '/mqtt',
    query: {},
  })
  receipts.push(await wsOrigin.export([mqttWs]))

  return receipts
})
