import { storeJson } from '../fileModels/store.json'
import { i18n } from '../i18n'
import { sdk } from '../sdk'

export const listDevices = sdk.Action.withoutInput(
  'list-devices',
  async () => ({
    name: i18n('List Devices'),
    description: i18n(
      'Show every device credential currently registered with the broker, including passwords.',
    ),
    warning: null,
    allowedStatuses: 'any',
    group: null,
    visibility: 'enabled',
  }),
  async ({ effects }) => {
    const devices = (await storeJson.read((s) => s.devices).once()) ?? []
    if (devices.length === 0) {
      return {
        version: '1',
        title: i18n('Devices'),
        message: i18n('No devices registered yet. Use "Add Device" to create one.'),
        result: null,
      }
    }
    return {
      version: '1',
      title: i18n('Devices'),
      message: i18n(
        'These credentials are accepted by the MQTT broker. Each row is a username and password pair.',
      ),
      result: {
        type: 'group',
        value: devices.flatMap((d) => [
          {
            type: 'single' as const,
            name: `${d.name} — ${i18n('Username')}`,
            description: null,
            value: d.name,
            masked: false,
            copyable: true,
            qr: false,
          },
          {
            type: 'single' as const,
            name: `${d.name} — ${i18n('Password')}`,
            description: null,
            value: d.password,
            masked: true,
            copyable: true,
            qr: false,
          },
        ]),
      },
    }
  },
)
