import { sdk } from '../sdk'
import { addDevice } from './addDevice'
import { downloadCaCert } from './downloadCaCert'
import { listDevices } from './listDevices'
import { removeDevice } from './removeDevice'

export const actions = sdk.Actions.of()
  .addAction(downloadCaCert)
  .addAction(addDevice)
  .addAction(removeDevice)
  .addAction(listDevices)
