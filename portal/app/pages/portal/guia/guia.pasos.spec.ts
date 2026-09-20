import { describe, it, expect } from 'vitest';
import type { DriveStep } from 'driver.js';
import { pasosPago } from './guia.pasos';

const elementos = (pasos: DriveStep[]) => pasos.map((p) => p.element);

describe('la guía es un tutorial', () => {
  it('cada paso dice lo que hay que hacer', () => {
    for (const paso of pasosPago()) {
      expect(paso.popover?.title).toMatch(/^(Revisa|Escribe|Marca|Toca)\b/);
    }
  });
});

describe('pasosPago', () => {
  it('recorre la pantalla en el orden en que se usa: tarjeta, resumen, autorización, activar', () => {
    expect(elementos(pasosPago())).toEqual([
      '[data-guia="campos"]',
      '[data-guia="servicio"]',
      '[data-guia="aceptar"]',
      '[data-guia="registrar"]',
    ]);
  });
});
