/** Marcas que acepta el portal. Carnet queda fuera mientras no esté habilitada en Openpay. */
type Marca = 'visa' | 'mastercard' | 'amex';

const MARCAS: Record<Marca, { nombre: string; logo: string }> = {
  visa: { nombre: 'Visa', logo: 'assets/openpay/visa.png' },
  mastercard: { nombre: 'Mastercard', logo: 'assets/openpay/mastercard.png' },
  amex: { nombre: 'American Express', logo: 'assets/openpay/amex.png' },
};

/** La tarjeta como se muestra en la confirmación: "Visa •••• 2774". */
export interface TarjetaAConfirmar {
  nombre: string;
  /** null cuando la marca no se reconoce: se muestra solo el texto. */
  logo: string | null;
  ultimos4: string;
}

/**
 * La tarjeta que se va a registrar, a partir del número que escribió el cliente.
 *
 * Se saca del número y no del token de Openpay: tokenizar solo para abrir la
 * confirmación la retrasaría una llamada y dejaría un token sin usar cada vez
 * que el cliente toca "Regresar".
 */
export function tarjetaAConfirmar(numero: string): TarjetaAConfirmar {
  const digitos = numero.replace(/\D/g, '');
  const marca = marcaDe(digitos);
  return {
    nombre: marca ? MARCAS[marca].nombre : 'Tarjeta',
    logo: marca ? MARCAS[marca].logo : null,
    ultimos4: digitos.slice(-4),
  };
}

/** Por los primeros dígitos: Visa 4, American Express 34/37, Mastercard 51-55 y 2221-2720. */
function marcaDe(digitos: string): Marca | null {
  if (/^4/.test(digitos)) return 'visa';
  if (/^3[47]/.test(digitos)) return 'amex';
  if (/^5[1-5]/.test(digitos)) return 'mastercard';
  const prefijo = Number(digitos.slice(0, 4));
  if (digitos.length >= 4 && prefijo >= 2221 && prefijo <= 2720) return 'mastercard';
  return null;
}
