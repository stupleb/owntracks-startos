import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const v_2_15_3_0 = VersionInfo.of({
  version: '2.15.3:0',
  releaseNotes: {
    en_US: `- Initial release of OwnTracks on StartOS.
- Bundles Mosquitto MQTT broker, OwnTracks Recorder, and OwnTracks Frontend.`,
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
