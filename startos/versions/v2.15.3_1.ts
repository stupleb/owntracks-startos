import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const v_2_15_3_1 = VersionInfo.of({
  version: '2.15.3:1',
  releaseNotes: {
    en_US: `- Added "Forget Device Tracks" action — select a recorded (user, device-id) pair and permanently remove its location history from the recorder. Useful for clearing stale entries when a phone reinstall changes the device ID.
- Spanish (es_ES) translations.`,
    es_ES: `- Añadida la acción "Olvidar ubicaciones del dispositivo": selecciona un par (usuario, ID de dispositivo) registrado y elimina permanentemente su historial de ubicaciones del recorder. Útil para limpiar entradas obsoletas cuando una reinstalación del teléfono cambia el ID del dispositivo.
- Traducciones al español (es_ES).`,
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
