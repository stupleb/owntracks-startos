export const DEFAULT_LANG = 'en_US'

const dict = {
  // main.ts
  'Starting OwnTracks': 0,
  'MQTT Broker': 1,
  'The MQTT broker is ready': 2,
  'The MQTT broker is not ready': 3,
  Recorder: 4,
  'The recorder is ready': 5,
  'The recorder is not ready': 6,
  'Web Interface': 7,
  'The web interface is ready': 8,
  'The web interface is not ready': 9,

  // interfaces.ts
  'Web UI': 10,
  'Map view of every device that has published a location': 11,
  'MQTT (TLS)': 12,
  'MQTT endpoint for OwnTracks phone apps. Install the CA certificate from the Actions tab on each device before connecting.': 13,
  'MQTT (WebSocket)': 36,
  'MQTT-over-WebSocket endpoint. Use this if your client supports WebSocket transport (most OwnTracks apps do) and you want the .local hostname to work over IPv6.': 37,

  // actions/downloadCaCert.ts
  'Download CA Certificate': 14,
  "Return the StartOS root CA certificate. The MQTT broker's TLS cert is signed by this CA. Most phones that already trust the StartOS UI will already have this CA installed; phones that don't access StartOS in the browser need it installed once.": 15,
  'CA Certificate': 16,
  'Install this CA on every phone that does not already trust the StartOS root CA. Save the text below as a .crt file and send it to your device.': 17,
  'CA Certificate (PEM)': 18,

  // actions/addDevice.ts
  'Add Device': 19,
  'A unique identifier for this phone. Used as the MQTT username and as the device segment in OwnTracks topic paths. Letters, digits, dash, and underscore only.': 20,
  'Device Name': 21,
  'Create a new device credential. Returns a username and password to enter into the OwnTracks phone app.': 22,
  'Device Created': 23,
  'Enter these credentials in the OwnTracks app on the phone. The MQTT host and port come from the MQTT (TLS) interface.': 24,
  Username: 25,
  Password: 26,

  // actions/removeDevice.ts
  'Remove Device': 27,
  'Delete a device credential. The phone using it will be unable to publish on the next mosquitto restart.': 28,
  Device: 29,
  'Which device credential to remove.': 30,
  'No devices registered yet. Cancel this dialog and run "Add Device" first.': 38,

  // actions/listDevices.ts
  'List Devices': 31,
  'Show every device credential currently registered with the broker, including passwords.': 32,
  Devices: 33,
  'No devices registered yet. Use "Add Device" to create one.': 34,
  'These credentials are accepted by the MQTT broker. Each row is a username and password pair.': 35,
} as const

/**
 * Plumbing. DO NOT EDIT.
 */
export type I18nKey = keyof typeof dict
export type LangDict = Record<(typeof dict)[I18nKey], string>
export default dict
