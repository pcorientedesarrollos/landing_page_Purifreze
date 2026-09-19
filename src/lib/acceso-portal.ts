/**
 * Lo que la landing necesita saber del acceso al portal.
 *
 * Acá no se valida nada. Antes sí: el enlace traía el token en la URL y el
 * servidor de la landing preguntaba al ERP si servía antes de renderizar. Con
 * el código eso desapareció —la pantalla de captura tiene que ser pública, o el
 * botón no lleva a ningún lado—, así que lo único que queda de este lado son
 * las rutas y a qué ERP le habla el navegador del cliente.
 */

/** Donde el cliente teclea su código. Pública. */
export const RUTA_ACTIVAR = '/activar';

/** El portal. Sin sesión en el navegador, se sale solo hacia /activar. */
export const RUTA_PORTAL = '/purifreze-suscripcion';

/** Carpeta desde la que se sirven los assets compilados del portal. */
export const RUTA_ASSETS = '/portal-app';

/**
 * Dónde guarda el portal Angular su sesión. /activar escribe exactamente eso:
 * la sesión nace en la landing y el portal la encuentra ya hecha.
 */
export const CLAVE_SESION = 'portal_purifreze_sesion';

/** A dónde le pega el navegador cuando no hay ninguna variable puesta. */
const ERP_POR_OMISION = 'http://localhost:3001';

/**
 * El ERP al que le pega el NAVEGADOR del cliente, y de dónde salió esa URL.
 *
 * No es necesariamente el mismo al que llegaría el servidor de Astro: en Railway
 * el servidor puede alcanzar al ERP por la red privada, que desde el navegador
 * del cliente no existe. Por eso la variable propia va primero.
 *
 * process.env y no import.meta.env: import.meta se resuelve EN EL BUILD, así
 * que una variable puesta en Railway no se vería.
 */
export function erpDelNavegador(): { url: string; origen: string } {
  const propia = process.env['PORTAL_API_URL_PUBLICA'];
  if (propia) return { url: propia, origen: 'PORTAL_API_URL_PUBLICA' };

  const compartida = process.env['PORTAL_API_URL'];
  if (compartida) return { url: compartida, origen: 'PORTAL_API_URL' };

  return { url: ERP_POR_OMISION, origen: 'sin variable (localhost)' };
}

export function urlDelErp(): string {
  return erpDelNavegador().url;
}
