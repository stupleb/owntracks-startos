import { LangDict } from './default'

export default {
  es_ES: {
    // main.ts
    0: 'Iniciando OwnTracks',
    1: 'Broker MQTT',
    2: 'El broker MQTT está listo',
    3: 'El broker MQTT no está listo',
    4: 'Recorder',
    5: 'El recorder está listo',
    6: 'El recorder no está listo',
    7: 'Interfaz web',
    8: 'La interfaz web está lista',
    9: 'La interfaz web no está lista',

    // interfaces.ts
    10: 'Interfaz web',
    11: 'Vista de mapa de cada dispositivo que ha publicado una ubicación',
    12: 'MQTT (TLS)',
    13: 'Endpoint MQTT para las apps de OwnTracks en el teléfono (normalmente Android, normalmente por IP de la red local o nombre .local). Asegúrate de confiar en la CA raíz de StartOS (disponible cómodamente en la pestaña Acciones) en cada dispositivo antes de conectarte.',
    36: 'MQTT (WebSocket)',
    37: 'Endpoint MQTT sobre WebSocket. Úsalo en la mayoría de los casos – si estás usando un dominio público, si estás en iOS o si quieres que el nombre .local funcione sobre IPv6.',

    // actions/downloadCaCert.ts
    14: 'Descargar certificado CA',
    15: 'Devuelve el certificado raíz de la CA de StartOS. El certificado TLS del broker MQTT está firmado por esta CA. La mayoría de los teléfonos que ya confían en la interfaz de StartOS ya tendrán esta CA instalada; los teléfonos que no acceden a StartOS desde el navegador necesitan instalarla una sola vez.',
    16: 'Certificado CA',
    17: 'Instala esta CA en cada teléfono que aún no confíe en la CA raíz de StartOS. Guarda el texto siguiente como un archivo .crt y envíalo a tu dispositivo.',
    18: 'Certificado CA (PEM)',

    // actions/addDevice.ts
    19: 'Añadir dispositivo',
    20: 'Un identificador único para este teléfono. Se usa como nombre de usuario MQTT y como el segmento del dispositivo en las rutas de topics de OwnTracks. Solo letras, dígitos, guión y guión bajo.',
    21: 'Nombre del dispositivo',
    22: 'Crea una nueva credencial de dispositivo. Devuelve un nombre de usuario y una contraseña para introducir en la app de OwnTracks del teléfono.',
    23: 'Dispositivo creado',
    24: 'Introduce estas credenciales en la app de OwnTracks del teléfono. El host y el puerto MQTT se obtienen de la interfaz MQTT (TLS).',
    25: 'Nombre de usuario',
    26: 'Contraseña',

    // actions/removeDevice.ts
    27: 'Eliminar dispositivo',
    28: 'Elimina una credencial de dispositivo. El teléfono que la use no podrá publicar tras el próximo reinicio de mosquitto.',
    29: 'Dispositivo',
    30: 'Qué credencial de dispositivo eliminar.',
    38: 'Aún no hay dispositivos registrados. Cancela este diálogo y ejecuta "Añadir dispositivo" primero.',

    // actions/listDevices.ts
    31: 'Listar dispositivos',
    32: 'Muestra todas las credenciales de dispositivo registradas actualmente en el broker, incluyendo las contraseñas.',
    33: 'Dispositivos',
    34: 'Aún no hay dispositivos registrados. Usa "Añadir dispositivo" para crear uno.',
    35: 'El broker MQTT acepta estas credenciales. Cada fila es un par de nombre de usuario y contraseña.',

    // actions/forgetDeviceTracks.ts
    39: 'Olvidar ubicaciones del dispositivo',
    40: 'Elimina permanentemente todas las ubicaciones guardadas para un par usuario/dispositivo registrado. Útil para limpiar entradas obsoletas cuando una reinstalación del teléfono cambia el ID del dispositivo.',
    41: 'Dispositivo registrado',
    42: 'Par usuario / ID de dispositivo a olvidar. Se eliminan tanto la última ubicación conocida como el historial completo.',
    43: 'Esto elimina todas las ubicaciones del dispositivo seleccionado. Acción irreversible.',
    44: '(sin dispositivos registrados)',
    45: 'Ubicaciones eliminadas',
    46: 'Eliminado el historial del recorder y limpiada la retención del broker para este dispositivo. Puede que otros teléfonos tengan que cerrar a la fuerza y reabrir la app de OwnTracks para que desaparezca el marcador.',
    47: 'Usuario',
    48: 'ID de dispositivo',
  },
} satisfies Record<string, LangDict>
