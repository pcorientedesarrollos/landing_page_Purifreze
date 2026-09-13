import { test, expect, Page } from '@playwright/test';
import {
  CLIENTE, TARJETA, CODIGO,
  vigenciaFutura, simularOpenpay, simularBackend, RUTA_PORTAL,
} from '../portal-fixtures';

/**
 * El recorrido COMPLETO del cliente en el portal, de principio a fin, y el
 * generador de las capturas que Openpay pide para revisar el comercio.
 *
 * Se distingue de portal-registrar-tarjeta.spec.ts en que no siembra la sesión:
 * entra por la puerta, con RFC y correo, y pasa por el código. Eso lo hace más
 * lento y con más piezas simuladas, pero es lo que Openpay quiere ver.
 *
 * Las capturas están APAGADAS por omisión: en una corrida normal esto es un
 * test del flujo completo y no debe escribir imágenes.
 *
 *   CAPTURAS=1 npx playwright test portal-flujo-completo --no-deps
 *   CAPTURAS=1 MOBILE=1 npx playwright test portal-flujo-completo --no-deps
 */

const CAPTURAS = Boolean(process.env['CAPTURAS']);
const MOBILE = Boolean(process.env['MOBILE']);
const DIR = `capturas/portal${MOBILE ? '-movil' : ''}`;

let n = 0;

/** Numeradas en orden para que se lean como secuencia al ordenarlas por nombre. */
async function captura(page: Page, nombre: string): Promise<void> {
  if (!CAPTURAS) return;
  n += 1;
  const archivo = `${DIR}/${String(n).padStart(2, '0')}-${nombre}.png`;
  // Las animaciones de entrada del portal tardan ~400 ms: sin esperar, la foto
  // sale con la tarjeta a medio aparecer.
  await page.waitForTimeout(500);
  await page.screenshot({ path: archivo, fullPage: true });
  console.log(`  captura -> ${archivo}`);
}

test('Portal — recorrido completo del cliente, de la identificación al alta', async ({ page }) => {
  await simularOpenpay(page);
  await simularBackend(page, { conAutenticacion: true });

  if (MOBILE) await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(RUTA_PORTAL);

  // ── 1. Se identifica ───────────────────────────────────────────────────
  await expect(page.getByRole('heading', { name: 'Registra tu método de pago' }))
    .toBeVisible({ timeout: 30_000 });
  await page.getByLabel('RFC').fill(CLIENTE.rfc);
  await page.getByLabel('Correo electrónico').fill(CLIENTE.correo);
  await captura(page, 'identificacion');
  await page.locator('button[type="submit"]').click();

  // ── 2. Recibe el código ────────────────────────────────────────────────
  await expect(page.getByRole('heading', { name: 'Revisa tu correo' })).toBeVisible();
  await page.getByLabel('Código de verificación').fill(CODIGO);
  await captura(page, 'codigo-de-acceso');
  await page.locator('button[type="submit"]').click();

  // ── 3. Ve lo que tiene contratado ──────────────────────────────────────
  await expect(page.getByRole('heading', { name: 'Tu servicio' })).toBeVisible();
  await expect(page.getByText(CLIENTE.nombre, { exact: false })).toBeVisible();
  await captura(page, 'tu-servicio');
  await page.getByRole('button', { name: 'Continuar' }).click();

  // ── 4. Captura su tarjeta ──────────────────────────────────────────────
  await expect(page.getByRole('heading', { name: 'Datos de tu tarjeta' })).toBeVisible();
  const registrar = page.getByRole('button', { name: 'Registrar tarjeta' });
  await captura(page, 'datos-de-tarjeta');

  await page.locator('[data-openpay-card="holder_name"]').fill(TARJETA.titular);
  await page.locator('[data-openpay-card="card_number"]').fill(TARJETA.numero);
  await page.locator('input[autocomplete="cc-exp"]').fill(vigenciaFutura());
  await page.locator('[data-openpay-card="cvv2"]').fill(TARJETA.cvv);

  await expect(registrar).toBeEnabled({ timeout: 15_000 });
  await captura(page, 'tarjeta-capturada');
  await registrar.click();

  // ── 5. Confirma lo que va a autorizar ──────────────────────────────────
  const modal = page.getByRole('dialog');
  await expect(modal.getByRole('heading', { name: 'Confirma tu pago automático' })).toBeVisible();
  await captura(page, 'confirmacion');

  // ── 6. Lee los términos ────────────────────────────────────────────────
  // Salen del texto legal de la confirmación, que se oculta mientras se leen.
  await modal.locator('.pf-legal-enlace').click();
  const terminos = page
    .getByRole('dialog')
    .filter({ has: page.getByRole('heading', { name: 'Autorización de cargos recurrentes' }) });
  await expect(terminos).toBeVisible();
  // El scroll vive en .pf-modal-cuerpo, no en la página: fullPage sólo agarra la
  // primera pantalla del texto. Se recorre el modal de arriba a abajo y se saca
  // una captura por pantalla, para documentar los términos COMPLETOS — que es
  // justo lo que revisa la pasarela.
  const cuerpo = terminos.locator('.pf-modal-cuerpo');
  const pantallas = await cuerpo.evaluate(el => Math.ceil(el.scrollHeight / el.clientHeight));
  for (let i = 0; i < pantallas; i++) {
    await cuerpo.evaluate((el, salto) => el.scrollTo(0, salto * el.clientHeight), i);
    await captura(page, `terminos-${i + 1}-de-${pantallas}`);
  }

  // Dos botones se llaman "Cerrar" en este modal: la X del encabezado y el del
  // pie. Se toma el del pie, que es el que un cliente usa de verdad.
  await terminos.locator('.pf-boton-secundario').click();

  // ── 7. Autoriza ────────────────────────────────────────────────────────
  await expect(modal.getByRole('heading', { name: 'Confirma tu pago automático' })).toBeVisible();
  await modal.getByRole('button', { name: 'Activar pago automático' }).click();

  await expect(page.getByRole('heading', { name: 'Tu pago automático quedó activo' }))
    .toBeVisible({ timeout: 15_000 });
  await captura(page, 'pago-automatico-activo');
});
