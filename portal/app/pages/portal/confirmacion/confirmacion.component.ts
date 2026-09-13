import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TarjetaAConfirmar } from './tarjeta';

/** Lo que el cliente está por confirmar, ya escrito como se lee. */
export interface ResumenConfirmacion {
  contratos: number;
  /** "$549.00" */
  total: string;
  /** "Mensual". null cuando los contratos no comparten periodicidad. */
  periodicidad: string | null;
  /** "3 de octubre de 2026" u "hoy". null si el servidor no mandó la fecha. */
  primerCargo: string | null;
  /** El cargo se hace en el acto porque la mensualidad ya venció. */
  cobroEnElActo: boolean;
  /** "1 de septiembre": la mensualidad que salda ese cargo. */
  mensualidad: string | null;
  tarjeta: TarjetaAConfirmar;
}

/**
 * Confirmación del pago automático, antes de mandar la tarjeta.
 *
 * El cliente ve qué se cobra, desde cuándo y con qué tarjeta. Al tocar
 * "Activar pago automático" acepta los términos: es el momento del
 * consentimiento, y el servidor lo registra al recibir el registro.
 */
@Component({
  selector: 'app-portal-confirmacion',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './confirmacion.component.html',
  styleUrls: ['./confirmacion.component.scss'],
})
export class PortalConfirmacionComponent {
  @Input({ required: true }) resumen!: ResumenConfirmacion;
  /** Mientras se registra no se puede cerrar ni confirmar dos veces. */
  @Input() procesando = false;

  @Output() confirmar = new EventEmitter<void>();
  @Output() cerrar = new EventEmitter<void>();
  @Output() verTerminos = new EventEmitter<void>();

  onCerrar(): void {
    if (!this.procesando) this.cerrar.emit();
  }

  onConfirmar(): void {
    if (!this.procesando) this.confirmar.emit();
  }
}
