import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Aviso de Privacidad del portal, en los términos de la LFPDPPP. Openpay lo
 * exige como requisito de integración: el titular de la tarjeta debe poder
 * consultar, antes de capturar sus datos, quién trata su información y que
 * Openpay participa como encargado del pago.
 *
 * A diferencia de los Términos (`PortalTerminosComponent`), este aviso es
 * informativo — no se "acepta" ni queda versionado contra un consentimiento
 * en el backend. Solo se muestra fecha de última actualización.
 */
@Component({
  selector: 'app-portal-aviso-privacidad',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './aviso_privacidad.component.html',
  styleUrls: ['./aviso_privacidad.component.scss'],
})
export class PortalAvisoPrivacidadComponent {
  /** Fecha de la última actualización del texto. */
  static readonly ACTUALIZADO = '21 de septiembre de 2026';

  @Output() cerrar = new EventEmitter<void>();

  readonly actualizado = PortalAvisoPrivacidadComponent.ACTUALIZADO;

  onCerrar(): void {
    this.cerrar.emit();
  }
}
