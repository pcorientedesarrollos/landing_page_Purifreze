/**
 * Validación del enlace de un solo uso con el que un cliente entra al portal.
 *
 * El enlace ES la credencial: no hay RFC, correo ni código detrás. Por eso la
 * regla vive en un solo lugar y la decide el backend del ERP, que es quien
 * conoce su vigencia (una hora) y si ya se consumió (al registrar la tarjeta).
 *
 * La landing nunca decide por su cuenta: ante cualquier duda —red caída,
 * respuesta rara, endpoint inexistente— devuelve false. Un portal que se abre
 * porque el validador falló es peor que un portal que no se abre.
 */

/**
 * process.env y no import.meta.env: esto corre en el servidor y la segunda se
 * resuelve EN EL BUILD, así que una variable definida en Railway no se vería.
 */
const API_URL =
  process.env['PORTAL_API_URL'] ??
  import.meta.env['PORTAL_API_URL'] ??
  'http://localhost:3001';

/** Milisegundos que se espera al ERP antes de darlo por no disponible. */
const TIMEOUT_MS = 5000;

export interface EnlaceValidado {
  valido: boolean;
  /** El token tal como viaja al portal, sólo cuando es válido. */
  token?: string;
}

export async function validarEnlace(token: string | null): Promise<EnlaceValidado> {
  if (!token || token.length < 16) return { valido: false };

  const control = new AbortController();
  const timeout = setTimeout(() => control.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${API_URL}/portal/enlace/validar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
      signal: control.signal,
    });
    if (!res.ok) return { valido: false };

    const cuerpo = await res.json().catch(() => null);
    return cuerpo?.data?.valido === true ? { valido: true, token } : { valido: false };
  } catch {
    // Incluye el caso de hoy: el endpoint todavía no existe, así que TODO
    // responde 404 y la ruta no queda publicada a medias.
    return { valido: false };
  } finally {
    clearTimeout(timeout);
  }
}

/** Ruta pública del portal. La usan el middleware y la página. */
export const RUTA_PORTAL = '/purifreze-suscripcion';

/** Carpeta desde la que se sirven los assets compilados del portal. */
export const RUTA_ASSETS = '/portal-app';

/** Lo que se muestra en lugar del portal cuando el enlace ya no sirve. */
export const RUTA_ENLACE_NO_DISPONIBLE = '/enlace-no-disponible';
