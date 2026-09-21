import { Injectable } from '@angular/core';
import { driver, type DriveStep, type Driver, type PopoverDOM } from 'driver.js';

/**
 * Abre la guía "¿Cómo funciona?" del portal. Es lo único que conoce Driver.js:
 * los pasos viven en guia.pasos.ts.
 *
 * Es un tutorial sobre la pantalla real: señala dónde tocar y deja hacerlo ahí
 * mismo, con la instrucción a la vista. Nunca se abre sola.
 */
@Injectable({ providedIn: 'root' })
export class PortalGuiaService {
  private activa: Driver | null = null;

  /**
   * @param alCerrar Se llama cuando la guía se va, sea por "Entendido", por
   *   "Omitir" o porque la pantalla la cerró. La pantalla puede montar algo
   *   mientras la guía corre —un ejemplo en los campos, por decir— y necesita un
   *   único lugar donde deshacerlo, pase lo que pase.
   */
  abrir(pasos: DriveStep[], alCerrar?: () => void): void {
    if (!pasos.length) return;
    this.cerrar();

    const guia: Driver = driver({
      steps: pasos,
      showProgress: pasos.length > 1,
      progressText: '{{current}} de {{total}}',
      nextBtnText: 'Siguiente',
      prevBtnText: 'Atrás',
      doneBtnText: 'Entendido',
      // Sin la "×": para quien no la reconoce es un símbolo más. Se sale con
      // "Omitir" o con "Entendido" al final.
      showButtons: ['next', 'previous'],
      // Tocar lo oscuro no cierra. Quien casi no usa el celular toca la pantalla
      // de abajo creyendo que sigue en ella, y perdería la guía sin querer.
      overlayClickBehavior: () => undefined,
      // Lo señalado se puede usar: la persona escribe en el campo con la
      // instrucción a la vista. Si su acción cambia de pantalla o abre los
      // términos, el componente cierra la guía.
      disableActiveInteraction: false,
      // Con el teclado activo, las flechas cambian de paso; mientras alguien
      // escribe en un campo tienen que mover el cursor.
      allowKeyboardControl: false,
      animate: !this.reducido,
      smoothScroll: !this.reducido,
      overlayOpacity: 0.6,
      stagePadding: 8,
      stageRadius: 12,
      popoverClass: 'pf-guia',
      onPopoverRender: (popover, { driver: d }) => this.armar(popover, d),
      onDestroyed: () => {
        if (this.activa === guia) this.activa = null;
        alCerrar?.();
      },
    });

    this.activa = guia;
    guia.drive();
  }

  cerrar(): void {
    this.activa?.destroy();
    this.activa = null;
  }

  /**
   * Orden de lectura de la ventana: cuánto falta, qué hacer, dónde está el dato,
   * y los botones. Driver pone el contador abajo, junto a los botones; se sube.
   *
   * Idempotente: Driver puede reutilizar la misma ventana de un paso al otro.
   */
  private armar(popover: PopoverDOM, guia: Driver): void {
    const actual = (guia.getActiveIndex() ?? 0) + 1;
    const total = guia.getConfig().steps?.length ?? 1;

    let progreso = popover.wrapper.querySelector<HTMLElement>('.pf-guia-progreso');
    if (!progreso && total > 1) {
      progreso = document.createElement('div');
      progreso.className = 'pf-guia-progreso';
      const barra = document.createElement('div');
      barra.className = 'pf-guia-barra';
      barra.append(document.createElement('span'));
      progreso.append(popover.progress, barra);
      popover.title.before(progreso);
    }
    const lleno = progreso?.querySelector<HTMLElement>('.pf-guia-barra span');
    if (lleno) lleno.style.width = `${(actual / total) * 100}%`;

    // Cuando lo señalado ocupa casi toda la pantalla no queda lugar para poner
    // la ventana al lado, y Driver la centra ENCIMA: en un celular, el primer
    // paso —la tarjeta dibujada más los cuatro campos— terminaba con la ventana
    // tapando el titular y la vigencia del ejemplo, que es justo lo que ese paso
    // explica. Anclada al pie tapa lo de abajo y deja ver lo señalado.
    const zona = guia.getActiveElement()?.getBoundingClientRect();
    const noCabeAlLado = !!zona && zona.height > window.innerHeight * 0.55;
    popover.wrapper.classList.toggle('pf-guia-al-pie', noCabeAlLado);

    // En el primer paso no hay a dónde regresar. Driver deja el botón apagado,
    // y un botón que no hace nada es otra cosa que la persona no entiende.
    popover.previousButton.style.display = guia.isFirstStep() ? 'none' : '';

    // En el último paso "Entendido" ya cierra; "Omitir" sobraría.
    let omitir = popover.footer.querySelector<HTMLButtonElement>('.pf-guia-omitir');
    if (guia.isLastStep()) {
      omitir?.remove();
      return;
    }
    if (!omitir) {
      omitir = document.createElement('button');
      omitir.type = 'button';
      omitir.className = 'pf-guia-omitir';
      omitir.textContent = 'Omitir';
      omitir.addEventListener('click', () => guia.destroy());
      popover.footer.append(omitir);
    }
  }

  /** Mismo criterio que PortalAnimacionesService: quien pidió reducir movimiento no ve animaciones. */
  private get reducido(): boolean {
    return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  }
}
