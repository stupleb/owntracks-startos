import { utils } from '@start9labs/start-sdk'
import {
  DEVICE_NAME_REGEX,
  DEVICE_NAME_RESERVED,
  DEVICE_PASSWORD_LENGTH,
  storeJson,
} from '../fileModels/store.json'
import { i18n } from '../i18n'
import { sdk } from '../sdk'

const { InputSpec, Value } = sdk

const inputSpec = InputSpec.of({
  name: Value.text({
    name: i18n('Device Name'),
    description: i18n(
      'A unique identifier for this phone. Used as the MQTT username and as the device segment in OwnTracks topic paths. Letters, digits, dash, and underscore only.',
    ),
    required: true,
    default: null,
    minLength: 1,
    maxLength: 31,
    patterns: [
      {
        regex: DEVICE_NAME_REGEX.source,
        description:
          'Must start with a letter or digit; only letters, digits, dash, and underscore allowed.',
      },
    ],
    masked: false,
    placeholder: 'my-phone',
    inputmode: 'text',
  }),
})

export const addDevice = sdk.Action.withInput(
  'add-device',
  async () => ({
    name: i18n('Add Device'),
    description: i18n(
      'Create a new device credential. Returns a username and password to enter into the OwnTracks phone app.',
    ),
    warning: null,
    allowedStatuses: 'any',
    group: null,
    visibility: 'enabled',
  }),
  inputSpec,
  async () => ({}),
  async ({ effects, input }) => {
    const name = input.name.trim()
    if (!DEVICE_NAME_REGEX.test(name)) {
      throw new Error(
        `Invalid device name "${name}". Must be 1–31 chars: start with a letter or digit, then letters, digits, dash, or underscore.`,
      )
    }
    if (DEVICE_NAME_RESERVED.has(name)) {
      throw new Error(`Device name "${name}" is reserved.`)
    }
    const existing = (await storeJson.read((s) => s.devices).once()) ?? []
    if (existing.some((d) => d.name === name)) {
      throw new Error(`Device "${name}" already exists.`)
    }

    const password = utils.getDefaultString({
      charset: 'a-z,A-Z,0-9',
      len: DEVICE_PASSWORD_LENGTH,
    })

    await storeJson.merge(effects, {
      devices: [...existing, { name, password }],
    })

    return {
      version: '1',
      title: i18n('Device Created'),
      message: i18n(
        'Enter these credentials in the OwnTracks app on the phone. The MQTT host and port come from the MQTT (TLS) interface.',
      ),
      result: {
        type: 'group',
        value: [
          {
            type: 'single',
            name: i18n('Username'),
            description: null,
            value: name,
            masked: false,
            copyable: true,
            qr: false,
          },
          {
            type: 'single',
            name: i18n('Password'),
            description: null,
            value: password,
            masked: true,
            copyable: true,
            qr: false,
          },
        ],
      },
    }
  },
)
