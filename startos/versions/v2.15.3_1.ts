import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const v_2_15_3_1 = VersionInfo.of({
  version: '2.15.3:1',
  releaseNotes: {
    en_US: `- Added "Forget Device Tracks" action — select a recorded (user, device-id) pair and permanently remove its history from the recorder *and* clear the broker's retained-message cache for the device. Cleans up stale markers when a phone reinstall changes the device ID.
- Spanish (es_ES) translations.`,
    es_ES: `- Añadida la acción "Olvidar ubicaciones del dispositivo": selecciona un par (usuario, ID de dispositivo) registrado y elimina permanentemente su historial del recorder *y* limpia la caché de mensajes retenidos del broker para ese dispositivo. Útil para limpiar marcadores obsoletos cuando una reinstalación del teléfono cambia el ID del dispositivo.
- Traducciones al español (es_ES).`,
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
