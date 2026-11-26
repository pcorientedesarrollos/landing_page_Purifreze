import type { CobroProgramado } from '../../../services/portal/portal.service';

/**
 * Cómo se le explica al cliente una suscripción que Purifreze le programó en un
 * día fijo del mes.
 *
 * Funciones puras y aparte del componente: las frases son lo que el cliente
 * autoriza, así que se prueban sin montar la pantalla.
 */

/** Meses en español, para escribir la fecha como la lee una persona. */
export const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

/** "$1,250.00", igual que el resto del portal. */
export function formatoMXN(monto: number | null): string {
  if (monto === null || monto === undefined) return '—';
  return monto.toLocaleString('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
  });
}

/**
 * "3 de octubre de 2026".
 *
 * Partiendo la cadena y no con `new Date(fecha)`: esa forma la lee como UTC y
 * en Mérida devuelve el día anterior.
 */
export function fechaLarga(fecha: string): string {
  const [anio, mes, dia] = fecha.split('-').map(Number);
  return `${dia} de ${MESES[mes - 1]} de ${anio}`;
}

/** "Se te cobrarán $750.00 el día 10 de cada mes". */
export function fraseCobroProgramado(cobro: CobroProgramado): string {
  return `Se te cobrarán ${formatoMXN(cobro.monto)} el día ${cobro.diaCobro} de cada mes`;
}

/**
 * El aviso de la mensualidad que ya venció cuando el cliente registra la
 * tarjeta. Sólo avisa: esa mensualidad NO se cobra a la tarjeta, ni hoy ni
 * después, así que no puede leerse como un cargo.
 */
export function avisoMensualidadVencida(cobro: CobroProgramado | null): string | null {
  const vencida = cobro?.mensualidadVencida;
  if (!vencida) return null;
  return (
    `Tu mensualidad del ${fechaLarga(vencida.fecha)} (${formatoMXN(vencida.monto)}) ` +
    'ya venció y no se cobrará a esta tarjeta. Si aún no la pagas, comunícate con Purifreze.'
  );
}

/**
 * Lo que se autoriza a cobrar cada mes: lo programado cuando lo hay, y si no,
 * el total del servicio, como siempre.
 */
export function montoAutorizado(servicio: {
  total: number;
  cobroProgramado?: CobroProgramado | null;
} | null): number | null {
  if (!servicio) return null;
  return servicio.cobroProgramado?.monto ?? servicio.total;
}
