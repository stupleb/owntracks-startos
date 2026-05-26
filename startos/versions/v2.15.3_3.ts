import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const v_2_15_3_3 = VersionInfo.of({
  version: '2.15.3:3',
  releaseNotes: {
    en_US: `- Simplified the MQTT (WebSocket) interface so a public custom domain assigned to it now lands on port 443 with a Let's Encrypt cert. Phones connect at \`wss://yourdomain/\` directly — no port suffix, no CA install, no extra iOS toggles.
- Phone setup instructions reorganized into iOS- and Android-specific sections with a public-domain "smoothest path" tip up front.
- Clearer descriptions on the MQTT (TLS) and MQTT (WebSocket) interfaces.
- Documented OwnTracks HTTP mode as an explicit non-goal (broker-enforced MQTT auth is strictly better for a self-hosted home setup).
- Bumped start-sdk to 1.5.2.`,
    es_ES: `- Simplificada la interfaz MQTT (WebSocket): un dominio público asignado a ella ahora termina en el puerto 443 con un certificado de Let's Encrypt. Los teléfonos se conectan directamente en \`wss://tudominio/\` — sin sufijo de puerto, sin instalar CA y sin ajustes adicionales en iOS.
- Instrucciones de configuración del teléfono reorganizadas en secciones específicas para iOS y Android, con un consejo destacado sobre la "ruta más sencilla" vía dominio público.
- Descripciones más claras en las interfaces MQTT (TLS) y MQTT (WebSocket).
- Modo HTTP de OwnTracks documentado como un no-objetivo explícito (la autenticación MQTT por el broker es estrictamente mejor para configuraciones domésticas autoalojadas).
- Actualizado start-sdk a 1.5.2.`,
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
