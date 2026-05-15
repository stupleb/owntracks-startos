import { readCaCert } from '../certs'
import { i18n } from '../i18n'
import { sdk } from '../sdk'

export const downloadCaCert = sdk.Action.withoutInput(
  'download-ca-cert',
  async () => ({
    name: i18n('Download CA Certificate'),
    description: i18n(
      "Return the StartOS root CA certificate. The MQTT broker's TLS cert is signed by this CA. Most phones that already trust the StartOS UI will already have this CA installed; phones that don't access StartOS in the browser need it installed once.",
    ),
    warning: null,
    allowedStatuses: 'any',
    group: null,
    visibility: 'enabled',
  }),
  async ({ effects }) => {
    const pem = await readCaCert(effects)
    return {
      version: '1',
      title: i18n('CA Certificate'),
      message: i18n(
        'Install this CA on every phone that does not already trust the StartOS root CA. Save the text below as a .crt file and send it to your device.',
      ),
      result: {
        type: 'single',
        name: i18n('CA Certificate (PEM)'),
        description: null,
        value: pem,
        masked: false,
        copyable: true,
        qr: false,
      },
    }
  },
)
