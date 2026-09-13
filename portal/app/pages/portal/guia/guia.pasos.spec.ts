import { describe, it, expect } from 'vitest';
import type { DriveStep } from 'driver.js';
import { pasosServicio, pasosTarjeta } from './guia.pasos';

const elementos = (pasos: DriveStep[]) => pasos.map((p) => p.element);

describe('la guía es un tutorial', () => {
  it('cada paso dice lo que hay que hacer', () => {
    for (const paso of [...pasosServicio(), ...pasosTarjeta()]) {
      expect(paso.popover?.title).toMatch(/^(Revisa|Escribe|Toca)\b/);
    }
  });
});

describe('pasosServicio', () => {
  it('revisar el servicio y continuar', () => {
    expect(elementos(pasosServicio())).toEqual([
      '[data-guia="servicio"]',
      '[data-guia="continuar"]',
    ]);
  });
});

describe('pasosTarjeta', () => {
  it('un paso por acción, no por campo', () => {
    expect(elementos(pasosTarjeta())).toEqual([
      '[data-guia="campos"]',
      '[data-guia="registrar"]',
    ]);
  });

  it('no repite lo que muestra la confirmación', () => {
    const textos = pasosTarjeta()
      .map((p) => p.popover?.description)
      .join(' ');
    expect(textos).not.toMatch(/\$|cargo|cobr/);
  });
});
