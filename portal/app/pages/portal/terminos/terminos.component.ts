import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Términos de autorización de cargos recurrentes. Texto vigente, aprobado por
 * Purifreze el 2026-08-25.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * REGLA AL EDITAR ESTE TEXTO
 *
 * Cada aceptación queda registrada en portal_terminos_aceptacion con la VERSION
 * de abajo: es lo que permite saber qué leyó exactamente cada cliente si algún
 * día se cuestiona una autorización.
 *
 * Cambiar el texto sin subir la versión hace que ese registro mienta. Al tocar
 * una coma de este archivo:
 *   1. Subí VERSION acá.
 *   2. Subí VERSION_TERMINOS en el backend, en el MISMO commit
 *      (server-admin-purifreze/src/services/portal/terminos.ts).
 * El servidor rechaza el registro de tarjeta si las dos no coinciden, así que
 * olvidarse de una rompe el portal en vez de guardar un consentimiento falso.
 * ─────────────────────────────────────────────────────────────────────────────
 */
@Component({
  selector: 'app-portal-terminos',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './terminos.component.html',
  styleUrls: ['./terminos.component.scss'],
})
export class PortalTerminosComponent {
  /** Versión del texto. Cámbiala cuando cambie el contenido. */
  static readonly VERSION = '2026-08-25';

  /** Fecha de vigencia de esta versión, para mostrarla junto al número. */
  static readonly VIGENTE_DESDE = '25 de agosto de 2026';

  @Input() nombreCliente = '';
  @Input() monto = '';
  @Input() periodicidad = '';

  @Output() cerrar = new EventEmitter<void>();
  @Output() aceptar = new EventEmitter<void>();

  readonly version = PortalTerminosComponent.VERSION;
  readonly vigenteDesde = PortalTerminosComponent.VIGENTE_DESDE;

  onCerrar(): void {
    this.cerrar.emit();
  }

  onAceptar(): void {
    this.aceptar.emit();
  }
}