import { storeJson } from '../fileModels/store.json'
import { i18n } from '../i18n'
import { sdk } from '../sdk'

const { InputSpec, Value } = sdk

export const removeDevice = sdk.Action.withInput(
  'remove-device',
  // Static metadata — always 'enabled'. Dynamic visibility on this action
  // tripped a UI caching issue: the metadata function ran once at install
  // time, and the StartOS UI didn't re-render when the underlying device
  // list changed, leaving the action stuck disabled even after devices
  // were added. Keeping it always-enabled and validating in the handler
  // is more robust than fighting the cache.
  {
    name: i18n('Remove Device'),
    description: i18n(
      'Delete a device credential. The phone using it will be unable to publish on the next mosquitto restart.',
    ),
    warning: null,
    allowedStatuses: 'any',
    group: null,
    visibility: 'enabled',
  },
  async ({ effects }) => {
    const devices = (await storeJson.read((s) => s.devices).once()) ?? []
    if (devices.length === 0) {
      return InputSpec.of({
        name: Value.select({
          name: i18n('Device'),
          description: i18n(
            'No devices registered yet. Cancel this dialog and run "Add Device" first.',
          ),
          values: { '': '(no devices)' },
          default: '',
          warning: null,
        }),
      })
    }
    const values: Record<string, string> = {}
    for (const d of devices) values[d.name] = d.name
    return InputSpec.of({
      name: Value.select({
        name: i18n('Device'),
        description: i18n('Which device credential to remove.'),
        values,
        default: devices[0]?.name ?? '',
        warning: null,
      }),
    })
  },
  async () => ({}),
  async ({ effects, input }) => {
    const devices = (await storeJson.read((s) => s.devices).once()) ?? []
    if (devices.length === 0) {
      throw new Error('No devices registered. Run "Add Device" first.')
    }
    if (!devices.some((d) => d.name === input.name)) {
      throw new Error(`Device "${input.name}" no longer exists.`)
    }
    await storeJson.merge(effects, {
      devices: devices.filter((d) => d.name !== input.name),
    })
  },
)
