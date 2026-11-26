import { describe, it, expect } from 'vitest';
import type { CobroProgramado } from '../../../services/portal/portal.service';
import {
  avisoMensualidadVencida,
  fechaLarga,
  fraseCobroProgramado,
  montoAutorizado,
} from './cobro-programado';

const programado = (extra: Partial<CobroProgramado> = {}): CobroProgramado => ({
  monto: 750,
  diaCobro: 10,
  fechaPrimerCobro: '2027-01-10',
  mensualidadVencida: null,
  ...extra,
});

describe('fraseCobroProgramado', () => {
  it('dice cuánto y qué día de cada mes', () => {
    expect(fraseCobroProgramado(programado())).toBe(
      'Se te cobrarán $750.00 el día 10 de cada mes'
    );
  });

  it('respeta días de fin de mes y montos con miles', () => {
    expect(fraseCobroProgramado(programado({ monto: 1250.5, diaCobro: 31 }))).toBe(
      'Se te cobrarán $1,250.50 el día 31 de cada mes'
    );
  });
});

describe('avisoMensualidadVencida', () => {
  it('sin mensualidad vencida no hay aviso', () => {
    expect(avisoMensualidadVencida(programado())).toBeNull();
    expect(avisoMensualidadVencida(null)).toBeNull();
  });

  it('avisa que la vencida no se cobra a la tarjeta, sin presentarla como cargo', () => {
    const aviso = avisoMensualidadVencida(
      programado({ mensualidadVencida: { fecha: '2026-12-01', monto: 750 } })
    );
    expect(aviso).toBe(
      'Tu mensualidad del 1 de diciembre de 2026 ($750.00) ya venció y no se cobrará ' +
        'a esta tarjeta. Si aún no la pagas, comunícate con Purifreze.'
    );
    expect(aviso).not.toMatch(/\bhoy\b/i);
  });
});

describe('montoAutorizado', () => {
  it('con cobro programado autoriza el monto programado', () => {
    expect(montoAutorizado({ total: 900, cobroProgramado: programado() })).toBe(750);
  });

  it('sin programación autoriza el total, como siempre', () => {
    expect(montoAutorizado({ total: 900, cobroProgramado: null })).toBe(900);
    expect(montoAutorizado({ total: 900 })).toBe(900);
    expect(montoAutorizado(null)).toBeNull();
  });
});

describe('fechaLarga', () => {
  it('no corre la fecha un día por la zona horaria', () => {
    expect(fechaLarga('2027-01-10')).toBe('10 de enero de 2027');
  });
});
