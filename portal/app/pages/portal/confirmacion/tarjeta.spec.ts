import { describe, it, expect } from 'vitest';
import { tarjetaAConfirmar } from './tarjeta';

describe('tarjetaAConfirmar', () => {
  it('reconoce Visa con el número como lo escribe el cliente, con espacios', () => {
    expect(tarjetaAConfirmar('4111 1111 1111 2774')).toEqual({
      nombre: 'Visa',
      logo: 'assets/openpay/visa.png',
      ultimos4: '2774',
    });
  });

  it('reconoce Mastercard en sus dos rangos', () => {
    expect(tarjetaAConfirmar('5555555555554444').nombre).toBe('Mastercard');
    expect(tarjetaAConfirmar('2223000048400011').nombre).toBe('Mastercard');
  });

  it('reconoce American Express, que tiene 15 dígitos', () => {
    expect(tarjetaAConfirmar('378282246310005')).toEqual({
      nombre: 'American Express',
      logo: 'assets/openpay/amex.png',
      ultimos4: '0005',
    });
  });

  it('sin marca reconocida muestra solo "Tarjeta" y los últimos 4', () => {
    expect(tarjetaAConfirmar('6011111111111117')).toEqual({
      nombre: 'Tarjeta',
      logo: null,
      ultimos4: '1117',
    });
  });
});
