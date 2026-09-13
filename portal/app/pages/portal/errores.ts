/**
 * Traducción de errores a mensajes que el cliente pueda entender y accionar.
 *
 * Regla de fondo: nunca mostrarle a un cliente un mensaje técnico. Un
 * "Unknown column 'contacto' in 'field list'" no solo es incomprensible —
 * además revela el esquema interno de la base de datos a cualquiera que abra
 * el portal.
 *
 * La excepción son los errores de Openpay: sus descripciones están escritas
 * para el usuario final ("fondos insuficientes", "tarjeta rechazada") y son
 * justo lo que la persona necesita leer para saber qué hacer.
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
 */
export function mensajeParaCliente(err: any, respaldo?: string): string {
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

  // Rechazo de Openpay: trae errorCode y una descripción pensada para el cliente.
  //
  // El body va PRIMERO. En un HttpErrorResponse de Angular, `err.message` es el
  // texto del framework ("Http failure response for .../portal/tarjeta: 400 Bad
  // Request") y el mensaje real del servidor vive en `err.error.message`. Con el
  // orden invertido, `err.message` —que siempre existe— ganaba siempre y el
  // cliente leía la URL del backend en vez de "The external_id already exists".
  if (err?.errorCode || err?.error?.errorCode) {
    const desc = err?.error?.message ?? err?.message;
    if (desc && !esTecnico(desc)) return desc;
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
