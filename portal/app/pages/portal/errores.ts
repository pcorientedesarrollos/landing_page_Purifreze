/**
 * Traducción de errores a mensajes que el cliente pueda entender y accionar.
 *
 * Regla de fondo: nunca mostrarle a un cliente un mensaje técnico. Un
 * "Unknown column 'contacto' in 'field list'" no solo es incomprensible —
 * además revela el esquema interno de la base de datos a cualquiera que abra
 * el portal.
 */

/** Señales de que un mensaje viene de la base de datos o del motor, no del negocio. */
const PATRONES_TECNICOS = [
  /unknown column/i,
  /er_[a-z_]+/i,
  /sqlmessage/i,
  /econnrefused/i,
  /etimedout/i,
  /enotfound/i,
  /cannot read propert/i,
  /is not a function/i,
  /undefined/i,
  /\bnull\b/i,
  /syntax error/i,
  /at [A-Za-z]+\./,
  /node_modules/i,
  // El mensaje que arma Angular cuando la petición falla. No viene del negocio y
  // además muestra la URL del backend en pantalla.
  /http failure response/i,
];

function esTecnico(mensaje: string): boolean {
  return PATRONES_TECNICOS.some(p => p.test(mensaje));
}

const GENERICO =
  'Tuvimos un problema al procesar tu solicitud. Intenta de nuevo en unos minutos.';

/**
 * Convierte cualquier error en un mensaje presentable.
 *
 * @param err       lo que haya lanzado HttpClient o el SDK de Openpay
 * @param respaldo  mensaje propio del contexto, si el error no aporta nada útil
 * @param soloRespaldo  descarta el detalle del servidor y usa siempre el respaldo.
 *   Para el alta de tarjeta: el motivo exacto del rechazo lo decide el banco y
 *   decirlo en pantalla es tanto ruido para el cliente como pista para quien
 *   esté probando tarjetas ajenas.
 */
export function mensajeParaCliente(
  err: any,
  respaldo?: string,
  soloRespaldo = false
): string {
  // Sin respuesta del servidor: el problema es de red, no del sistema.
  if (err?.status === 0) {
    return 'No pudimos conectar. Revisa tu conexión a internet e intenta de nuevo.';
  }

  if (err?.status === 401) {
    return 'Tu sesión expiró. Solicita un código nuevo.';
  }

  // 409 del portal: conflictos de negocio con mensaje ya redactado para el
  // cliente —límite de tarjetas alcanzado, cuenta sin correo registrado—.
  // Son accionables tal cual, así que se muestran sin tocar.
  if (err?.status === 409 && typeof err?.error?.message === 'string') {
    return err.error.message;
  }

  if (err?.status === 429) {
    const segundos = Number(err?.error?.retryAfter);
    if (segundos > 0) {
      const minutos = Math.ceil(segundos / 60);
      return `Demasiados intentos. Espera ${minutos} ${minutos === 1 ? 'minuto' : 'minutos'} e intenta de nuevo.`;
    }
    return err?.error?.message ?? 'Demasiados intentos. Espera unos minutos e intenta de nuevo.';
  }

  // Pasados los casos que el propio portal redacta, el detalle del servidor se
  // descarta: queda en consola para diagnóstico, no en pantalla.
  if (soloRespaldo) {
    const detalle = err?.error?.message ?? err?.message;
    if (detalle) console.error('[portal] error silenciado:', err?.error?.errorCode ?? '', detalle);
    return respaldo ?? GENERICO;
  }

  const delServidor = err?.error?.message ?? err?.message;

  if (typeof delServidor === 'string' && delServidor.trim()) {
    // Un error técnico que se filtró hasta acá se reemplaza y se registra, para
    // que el problema quede visible en consola sin exponerlo en pantalla.
    if (esTecnico(delServidor)) {
      console.error('[portal] error técnico recibido del servidor:', delServidor);
      return respaldo ?? GENERICO;
    }
    return delServidor;
  }

  if (err?.status >= 500) return respaldo ?? GENERICO;

  return respaldo ?? GENERICO;
}
