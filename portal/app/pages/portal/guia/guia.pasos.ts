import type { DriveStep } from 'driver.js';

/**
 * Pasos de la guía "¿Cómo funciona?" del portal.
 *
 * La guía es un tutorial, no una explicación: cada título es lo que la persona
 * tiene que hacer —Revisa, Escribe, Toca— y la descripción solo dice dónde
 * encontrar el dato o qué va a pasar. Una acción por paso y el nombre exacto de
 * cada campo y botón, pensando en quien casi no usa el celular.
 *
 * Driver.js escribe título y descripción como HTML: si algún paso llega a llevar
 * datos del servidor, hay que escaparlos antes.
 */

export function pasosServicio(): DriveStep[] {
  return [
    paso(
      'servicio',
      'Revisa tu servicio',
      'Confirma que sean tus contratos y tu monto. Si algo no coincide, no sigas y llama a Purifreze.'
    ),
    paso('continuar', 'Toca “Continuar”', 'Después te pediremos los datos de tu tarjeta.'),
  ];
}

/**
 * Una acción por paso, no un paso por campo: los cuatro datos de la tarjeta se
 * escriben de corrido, y pedir "Siguiente" entre cada uno cansa antes de terminar.
 * Qué se cobra y cuándo lo muestra la confirmación que abre el botón; la guía no
 * lo repite.
 */
export function pasosTarjeta(): DriveStep[] {
  return [
    // Hay tarjetas que no traen los datos impresos: el número y el CVV viven en
    // la app del banco.
    paso(
      'campos',
      'Escribe los datos de tu tarjeta',
      'Nombre, número, vigencia y CVV, tal como vienen en tu tarjeta. ' +
        'Si no vienen impresos, búscalos en la app de tu banco.'
    ),
    paso('registrar', 'Toca “Registrar tarjeta”', 'Verás el resumen de tu pago para confirmarlo.'),
  ];
}

function paso(guia: string, title: string, description: string): DriveStep {
  return { element: `[data-guia="${guia}"]`, popover: { title, description } };
}
