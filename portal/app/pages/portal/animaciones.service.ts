import { Injectable } from '@angular/core';
import { animate, stagger } from 'animejs';

/**
 * Animaciones del portal del cliente.
 *
 * Centralizadas acá para que el componente no quede salpicado de llamadas y para
 * poder desactivarlas desde un solo lugar.
 *
 * Criterio: en una pantalla donde se piden datos de tarjeta, la animación debe
 * confirmar que el sistema respondió, nunca llamar la atención sobre sí misma.
 * Duraciones cortas, curvas suaves, nada en bucle.
 */
@Injectable({ providedIn: 'root' })
export class PortalAnimacionesService {

  /**
   * Respeta la preferencia del sistema operativo. Para quien marcó reducir
   * movimiento —por vértigo, migraña o sensibilidad vestibular— las animaciones
   * no son un adorno: son un problema. En ese caso no se anima nada.
   */
  private get reducido(): boolean {
    return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  }

  /** Entrada de un paso del asistente: el bloque completo sube y aparece. */
  entradaPaso(elemento: Element | null): void {
    if (!elemento || this.reducido) return;
    animate(elemento, {
      opacity: [0, 1],
      y: [14, 0],
      duration: 420,
      ease: 'outExpo',
    });
  }

  /** Los campos del formulario entran escalonados, guiando la lectura hacia abajo. */
  entradaCampos(elementos: NodeListOf<Element> | Element[]): void {
    const lista = Array.from(elementos);
    if (!lista.length || this.reducido) return;
    animate(lista, {
      opacity: [0, 1],
      y: [10, 0],
      duration: 380,
      delay: stagger(45, { start: 90 }),
      ease: 'outQuad',
    });
  }

  /** Aviso de error: un desplazamiento lateral breve, sin estridencia. */
  sacudirError(elemento: Element | null): void {
    if (!elemento) return;
    if (this.reducido) return;
    animate(elemento, {
      x: [0, -6, 6, -4, 4, 0],
      duration: 320,
      ease: 'outQuad',
    });
  }

  /** La barra de progreso avanza de forma continua, no a saltos. */
  avanzarProgreso(elemento: Element | null, porcentaje: number): void {
    if (!elemento) return;
    if (this.reducido) {
      (elemento as HTMLElement).style.width = `${porcentaje}%`;
      return;
    }
    animate(elemento, {
      width: `${porcentaje}%`,
      duration: 520,
      ease: 'inOutQuad',
    });
  }

  /** Confirmación final: el check aparece con un rebote contenido. */
  confirmacion(elemento: Element | null): void {
    if (!elemento || this.reducido) return;
    animate(elemento, {
      scale: [0.6, 1],
      opacity: [0, 1],
      duration: 620,
      ease: 'outBack(1.4)',
    });
  }

}
