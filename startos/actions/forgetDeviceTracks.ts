import { storeJson } from '../fileModels/store.json'
import { i18n } from '../i18n'
import { sdk } from '../sdk'
import { mqttPlainPort } from '../utils'

const { InputSpec, Value } = sdk

type Effects = Parameters<Parameters<typeof sdk.setupMain>[0]>[0]['effects']

const STORE_MOUNTPOINT = '/store'

// Subtopics OwnTracks phones may have set with the retain flag. Publishing
// an empty payload with `-r` to each clears the broker's retained state so
// subscribers (other phones, the recorder, etc.) won't be re-served the
// stale data on their next connect.
const OWNTRACKS_SUBTOPICS = [
  '',
  '/info',
  '/event',
  '/status',
  '/step',
  '/dump',
  '/waypoints',
]

// Walk the recorder's /store/last directory to find every user/device pair
// that has ever published a location. Runs in a temporary read-only
// recorder subcontainer so we don't perturb the running daemon.
async function listRecordedPairs(
  effects: Effects,
): Promise<Array<{ user: string; device: string }>> {
  const pairs: Array<{ user: string; device: string }> = []
  await sdk.SubContainer.withTemp(
    effects,
    { imageId: 'recorder' },
    sdk.Mounts.of().mountVolume({
      volumeId: 'main',
      subpath: 'recorder/store',
      mountpoint: STORE_MOUNTPOINT,
      readonly: true,
    }),
    'list-recorded-pairs',
    async (sub) => {
      const res = await sub.exec(
        [
          'find',
          `${STORE_MOUNTPOINT}/last`,
          '-mindepth',
          '2',
          '-maxdepth',
          '2',
          '-type',
          'd',
        ],
        { user: 'root' },
      )
      if (res.exitCode !== 0) return
      const lines = (res.stdout?.toString() ?? '')
        .trim()
        .split('\n')
        .filter(Boolean)
      const prefix = `${STORE_MOUNTPOINT}/last/`
      for (const line of lines) {
        if (!line.startsWith(prefix)) continue
        const parts = line.slice(prefix.length).split('/')
        if (parts.length === 2 && parts[0] && parts[1]) {
          pairs.push({ user: parts[0], device: parts[1] })
        }
      }
    },
  )
  return pairs.sort((a, b) =>
    a.user === b.user
      ? a.device.localeCompare(b.device)
      : a.user.localeCompare(b.user),
  )
}

// Defensive validation before passing user/device into the rm command —
// the values come from a dropdown populated by listRecordedPairs, but
// constraining them explicitly closes off any path-traversal surface.
function safePathSegment(s: string): boolean {
  return (
    s.length > 0 &&
    !s.includes('/') &&
    !s.includes('..') &&
    !s.includes('\0')
  )
}

export const forgetDeviceTracks = sdk.Action.withInput(
  'forget-device-tracks',
  {
    name: i18n('Forget Device Tracks'),
    description: i18n(
      'Permanently delete all stored tracks for a recorded user/device pair. Useful for clearing stale entries after a phone reinstall changes the device ID.',
    ),
    warning: null,
    allowedStatuses: 'any',
    group: null,
    visibility: 'enabled',
  },
  async ({ effects }) => {
    const pairs = await listRecordedPairs(effects)
    const values: Record<string, string> = {}
    if (pairs.length === 0) {
      values[''] = i18n('(no recorded devices)')
    } else {
      for (const p of pairs) {
        values[`${p.user}/${p.device}`] = `${p.user}  /  ${p.device}`
      }
    }
    return InputSpec.of({
      target: Value.select({
        name: i18n('Recorded Device'),
        description: i18n(
          'User and device-id pair to forget. Both the last-known location and the full history are removed.',
        ),
        values,
        default: pairs[0] ? `${pairs[0].user}/${pairs[0].device}` : '',
        warning: i18n(
          'This deletes all tracks for the selected device. Irreversible.',
        ),
      }),
    })
  },
  async () => ({}),
  async ({ effects, input }) => {
    if (!input.target || !input.target.includes('/')) {
      throw new Error('No recorded device selected.')
    }
    const [user, device] = input.target.split('/')
    if (!safePathSegment(user) || !safePathSegment(device)) {
      throw new Error(`Invalid user/device pair: ${input.target}`)
    }
    await sdk.SubContainer.withTemp(
      effects,
      { imageId: 'recorder' },
      sdk.Mounts.of().mountVolume({
        volumeId: 'main',
        subpath: 'recorder/store',
        mountpoint: STORE_MOUNTPOINT,
        readonly: false,
      }),
      'forget-recorded',
      async (sub) => {
        await sub.execFail(
          [
            'rm',
            '-rf',
            `${STORE_MOUNTPOINT}/last/${user}/${device}`,
            `${STORE_MOUNTPOINT}/rec/${user}/${device}`,
          ],
          { user: 'root' },
        )
      },
    )

    // Clear the broker's retained-message cache for the device. Otherwise
    // other phones subscribed to owntracks/+/+ would be re-served the old
    // location on their next reconnect and the marker would reappear.
    const recorderUser =
      (await storeJson.read((s) => s.recorderMqttUser).once()) ?? 'recorder'
    const recorderPassword =
      (await storeJson.read((s) => s.recorderMqttPassword).once()) ?? ''
    await sdk.SubContainer.withTemp(
      effects,
      { imageId: 'mosquitto' },
      sdk.Mounts.of(),
      'clear-retained',
      async (sub) => {
        for (const suffix of OWNTRACKS_SUBTOPICS) {
          const topic = `owntracks/${user}/${device}${suffix}`
          await sub.exec(
            [
              'mosquitto_pub',
              '-h',
              '127.0.0.1',
              '-p',
              String(mqttPlainPort),
              '-u',
              recorderUser,
              '-P',
              recorderPassword,
              '-t',
              topic,
              '-r',
              '-n',
            ],
            { user: 'root' },
          )
        }
      },
    )

    return {
      version: '1' as const,
      title: i18n('Tracks Deleted'),
      message: i18n(
        'Removed the recorder history and cleared the broker retention for this device. Other phones may need to force-stop and reopen the OwnTracks app for the marker to disappear.',
      ),
      result: {
        type: 'group' as const,
        value: [
          {
            type: 'single' as const,
            name: i18n('User'),
            description: null,
            value: user,
            masked: false,
            copyable: false,
            qr: false,
          },
          {
            type: 'single' as const,
            name: i18n('Device ID'),
            description: null,
            value: device,
            masked: false,
            copyable: false,
            qr: false,
          },
        ],
      },
    }
  },
)
