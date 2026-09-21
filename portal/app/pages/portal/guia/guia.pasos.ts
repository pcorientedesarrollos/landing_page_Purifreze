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

/**
 * El recorrido completo, en el orden en que se recorre la pantalla única:
 * escribir la tarjeta, revisar lo que se va a cobrar, aceptar y activar.
 *
 * Antes eran dos recorridos —uno por pantalla— y el corte lo imponía la
 * navegación, no la tarea. Con todo a la vista el recorrido es uno solo.
 *
 * Una acción por paso, no un paso por campo: los cuatro datos de la tarjeta se
 * escriben de corrido, y pedir "Siguiente" entre cada uno cansa antes de
 * terminar.
 *
 * @param alDejarLosCampos Se llama cuando el recorrido abandona el primer paso.
 *   El ejemplo de la tarjeta sirve para enseñar dónde va cada dato; del segundo
 *   paso en adelante ya explicó lo suyo y estorba, porque el resto de la guía
 *   habla de lo que el cliente va a autorizar de verdad.
 */
export function pasosPago(alDejarLosCampos?: () => void): DriveStep[] {
  return [
    // Hay tarjetas que no traen los datos impresos: el número y el CVV viven en
    // la app del banco.
    //
    // El paso señala la tarjeta dibujada junto a los cuatro campos, y la
    // pantalla la llena con un ejemplo mientras dura: ver el número tomando
    // forma en el plástico dice dónde va cada dato mejor que cualquier frase.
    {
      ...paso(
        'campos',
        'Escribe los datos de tu tarjeta',
        'Nombre, número, vigencia y CVV, tal como vienen en tu tarjeta. ' +
          'Si no vienen impresos, búscalos en la app de tu banco.<br><br>' +
          'Arriba va un <strong>ejemplo</strong>: se borra en cuanto toques un campo.'
      ),
      onDeselected: alDejarLosCampos,
    },
    paso(
      'servicio',
      'Revisa lo que se va a cobrar',
      'Confirma que sean tus contratos, tu monto y tu fecha. Si algo no coincide, no sigas y llama a Purifreze.'
    ),
    paso(
      'aceptar',
      'Marca la casilla de autorización',
      'Es tu permiso para que el cargo se haga solo cada mes. Sin ella no se puede activar.'
    ),
    paso('registrar', 'Toca “Activar pago automático”', 'Con eso queda listo y te confirmamos en pantalla.'),
  ];
}

function paso(guia: string, title: string, description: string): DriveStep {
  return { element: `[data-guia="${guia}"]`, popover: { title, description } };
}
