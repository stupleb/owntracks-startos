import { FileHelper, z } from '@start9labs/start-sdk'
import { sdk } from '../sdk'

export const deviceSchema = z.object({
  name: z.string(),
  password: z.string(),
})

export type Device = z.infer<typeof deviceSchema>

const shape = z.object({
  recorderMqttUser: z.string().catch('recorder'),
  recorderMqttPassword: z.string().optional().catch(undefined),
  devices: z.array(deviceSchema).catch([]),
})

export const storeJson = FileHelper.json(
  { base: sdk.volumes.main, subpath: 'store.json' },
  shape,
)

// Constraints shared by add/remove actions.
export const DEVICE_NAME_REGEX = /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,30}$/
export const DEVICE_NAME_RESERVED = new Set(['recorder', 'admin', 'root'])
export const DEVICE_PASSWORD_LENGTH = 24
