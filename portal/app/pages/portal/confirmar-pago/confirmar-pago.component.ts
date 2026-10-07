import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Resumen de lo que el cliente está por autorizar. Al confirmar se guarda la
 * tarjeta y el primer cargo puede salir en ese momento, así que es la última
 * oportunidad de revisar monto, tarjeta y fecha.
 */
@Component({
  selector: 'app-portal-confirmar-pago',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './confirmar-pago.component.html',
  styleUrls: ['./confirmar-pago.component.scss'],
})
export class PortalConfirmarPagoComponent {
  /** "$370.00". */
  @Input() monto = '';
  /** "Mensual". */
  @Input() periodicidad = '';
  @Input() tarjeta: { logo: string | null; ultimos4: string; titular: string } = {
    logo: null, ultimos4: '', titular: '',
  };
  /** "Hoy" o "15 de octubre de 2026". */
  @Input() primerCargo = '';
  /** "2 de octubre" cuando el primer cargo es hoy: qué mensualidad paga. */
  @Input() mensualidad: string | null = null;
  @Input() procesando = false;

  @Output() cerrar = new EventEmitter<void>();
  @Output() confirmar = new EventEmitter<void>();

  onCerrar(): void {
    if (!this.procesando) this.cerrar.emit();
  }
}
