import { test, expect } from '@playwright/test';
import {
  CLIENTE, SERVICIO, TARJETA, TOKEN_OPENPAY, DEVICE_SESSION_ID,
  vigenciaFutura, simularOpenpay, sembrarSesion, simularBackend, RUTA_PORTAL,
} from '../portal-fixtures';

/**
 * Golden path del portal del cliente: ve el servicio que tiene contratado y
 * registra su tarjeta para quedar domiciliado.
 *
 * ARRANCA EN "Tu servicio": siembra en sessionStorage la misma sesión que deja
 * el login al verificar el código, que es lo único que mira ngOnInit para
 * saltarse identidad y código. El recorrido con esos dos pasos incluidos está
 * en portal-flujo-completo.spec.ts.
 *
 * El backend y Openpay.js están simulados (ver ../portal-fixtures.ts). Lo que
 * pasa del lado del servidor está cubierto por los integration contra MySQL real.
 *
 * El portal no lleva AuthGuard y su cliente no es un empleado del ERP, así que
 * este test arranca SIN la sesión de admin que el resto de la suite reutiliza.
 */

test('Portal — ve su servicio contratado y registra la tarjeta', async ({ page }) => {
  await sembrarSesion(page);
  await simularOpenpay(page);

  // Se guarda lo que el front manda: es la única forma de comprobar que el
  // número de tarjeta NO viaja al servidor.
  let cuerpoDelAlta: any = null;
  await simularBackend(page, { alRegistrar: cuerpo => (cuerpoDelAlta = cuerpo) });

  await page.goto(RUTA_PORTAL);

  // ── Su servicio ────────────────────────────────────────────────────────
  await expect(page.getByRole('heading', { name: 'Tu servicio' })).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText(CLIENTE.nombre, { exact: false })).toBeVisible();
  await expect(page.getByText(`Contrato ${SERVICIO.contratos[0].idContrato}`)).toBeVisible();
  await expect(page.getByText('$2,320.00').first()).toBeVisible();

  await page.getByRole('button', { name: 'Continuar' }).click();

  // ── Su tarjeta ─────────────────────────────────────────────────────────
  await expect(page.getByRole('heading', { name: 'Datos de tu tarjeta' })).toBeVisible();

  // Mientras Openpay no está listo el botón dice "Preparando el pago seguro…",
  // así que encontrarlo por este nombre ya prueba que la pasarela quedó armada.
  const registrar = page.getByRole('button', { name: 'Registrar tarjeta' });

  await page.locator('[data-openpay-card="holder_name"]').fill(TARJETA.titular);
  await page.locator('[data-openpay-card="card_number"]').fill(TARJETA.numero);
  await page.locator('input[autocomplete="cc-exp"]').fill(vigenciaFutura());
  await page.locator('[data-openpay-card="cvv2"]').fill(TARJETA.cvv);

  // Se habilita recién cuando los cuatro campos son válidos: esperarlo antes
  // de llenarlos lo encuentra deshabilitado siempre.
  await expect(registrar).toBeEnabled({ timeout: 15_000 });
  await registrar.click();

  // ── Confirmación ───────────────────────────────────────────────────────
  // Tocar "Activar pago automático" ES el consentimiento de los términos.
  const modal = page.getByRole('dialog');
  await expect(modal.getByRole('heading', { name: 'Confirma tu pago automático' })).toBeVisible();
  await modal.getByRole('button', { name: 'Activar pago automático' }).click();

  // ── Quedó activo ───────────────────────────────────────────────────────
  await expect(page.getByRole('heading', { name: 'Tu pago automático quedó activo' }))
    .toBeVisible({ timeout: 15_000 });

  // Lo que viajó al servidor: el token de Openpay, no la tarjeta.
  expect(cuerpoDelAlta).toBeTruthy();
  expect(JSON.stringify(cuerpoDelAlta)).not.toContain(TARJETA.numero);
  expect(JSON.stringify(cuerpoDelAlta)).not.toContain(TARJETA.cvv);
  expect(JSON.stringify(cuerpoDelAlta)).toContain(TOKEN_OPENPAY);
  expect(JSON.stringify(cuerpoDelAlta)).toContain(DEVICE_SESSION_ID);
});
