import { utils } from '@start9labs/start-sdk'
import { storeJson } from '../fileModels/store.json'
import { sdk } from '../sdk'

export const initializeService = sdk.setupOnInit(async (effects, kind) => {
  await storeJson.merge(effects, {})

  if (kind === 'install') {
    await storeJson.merge(effects, {
      recorderMqttPassword: utils.getDefaultString({
        charset: 'a-z,A-Z,0-9',
        len: 32,
      }),
    })
  }
})
