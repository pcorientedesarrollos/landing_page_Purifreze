/**
 * Arma el PDF del flujo del portal a partir de las capturas.
 *
 * Existe porque Openpay pide ver, para habilitar producción, qué pantallas
 * recorre el cliente antes de dejar su tarjeta. Cada página lleva el paso y una
 * línea de qué está viendo: un PDF de imágenes sueltas obliga al revisor a
 * adivinar el orden.
 *
 *   CAPTURAS=1 npx playwright test portal-flujo-completo --no-deps   # genera las imágenes
 *   node e2e/capturas-a-pdf.mjs                                      # escritorio
 *   node e2e/capturas-a-pdf.mjs capturas/portal-movil                # celular
 */
import { chromium } from '@playwright/test';
import { readdirSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, join } from 'node:path';

const dir = process.argv[2] ?? 'capturas/portal';
const esMovil = dir.includes('movil');
const salida = process.argv[3] ?? `capturas/Purifreze-flujo-registro-tarjeta${esMovil ? '-celular' : ''}.pdf`;

/** Qué ve el cliente en cada paso. La clave es el nombre del archivo sin numerar. */
const PASOS = {
  'identificacion': ['Identificación', 'Mediante un enlace que se le proporciona, https://www.purifreze.mx/purifreze-suscripcion, el cliente empieza su verificación con el RFC y el correo que tiene registrados con Purifreze. No hay usuario ni contraseña que recordar.'],
  'codigo-de-acceso': ['Código de un solo uso', 'Recibe en ese correo un código de seis dígitos, válido por diez minutos. Es lo que prueba que el correo es suyo.'],
  'tu-servicio': ['Su servicio contratado', 'Antes de pedirle ningún dato de tarjeta se le muestra qué tiene contratado, el importe con el IVA desglosado, la periodicidad y la fecha de cobro.'],
  'datos-de-tarjeta': ['Datos de la tarjeta', 'El formulario indica el importe y la periodicidad que se autorizan, las marcas aceptadas y que el pago lo procesa Openpay.'],
  'tarjeta-capturada': ['Tarjeta capturada', 'Los datos se tokenizan en el navegador con Openpay.js. El número de tarjeta y el CVV nunca llegan a los servidores de Purifreze.'],
  'confirmacion': ['Confirmación de la autorización', 'Antes de cobrar nada se le resume qué monto se le va a cobrar, con qué periodicidad y desde cuándo. El cargo se autoriza al tocar "Activar pago automático".'],
  'pago-automatico-activo': ['Alta confirmada', 'Se le confirma el alta, con la marca y los últimos cuatro dígitos de su tarjeta y la fecha del próximo cargo.'],
};

const archivos = readdirSync(dir).filter(f => f.endsWith('.png')).sort();
if (!archivos.length) {
  console.error(`Sin capturas en ${dir}. Generalas con: CAPTURAS=1 npx playwright test portal-flujo-completo --no-deps`);
  process.exit(1);
}

const hoy = new Date().toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });

function paso(archivo) {
  const base = archivo.replace(/^\d+-/, '').replace(/\.png$/, '');
  const terminos = base.match(/^terminos-(\d+)-de-(\d+)$/);
  if (terminos) {
    return [
      `Términos y condiciones (${terminos[1]} de ${terminos[2]})`,
      'El texto completo de la autorización de cargos recurrentes, accesible desde la pantalla de confirmación antes de autorizar.',
    ];
  }
  return PASOS[base] ?? [base.replace(/-/g, ' '), ''];
}

const paginas = archivos.map((archivo, i) => {
  const [titulo, detalle] = paso(archivo);
  return `
  <section class="pagina">
    <header>
      <span class="paso">Paso ${i + 1} de ${archivos.length}</span>
      <h2>${titulo}</h2>
      ${detalle ? `<p>${detalle}</p>` : ''}
    </header>
    <figure><img src="${archivo}" alt="${titulo}"></figure>
  </section>`;
}).join('\n');

const html = `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><style>
  @page { size: A4; margin: 14mm; }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: system-ui, -apple-system, 'Segoe UI', sans-serif; color: #12275a; }
  .portada { height: 250mm; display: flex; flex-direction: column; justify-content: center; page-break-after: always; }
  .portada h1 { font-size: 30px; margin: 0 0 8px; }
  .portada .sub { font-size: 17px; color: #4a5b85; margin: 0 0 28px; }
  .portada dl { display: grid; grid-template-columns: auto 1fr; gap: 6px 14px; font-size: 13px; margin: 0; }
  .portada dt { color: #7b88a8; }
  .portada dd { margin: 0; font-weight: 600; }
  .marca { font-size: 13px; letter-spacing: .14em; text-transform: uppercase; color: #1f7ac0; margin-bottom: 14px; }
  .pagina { page-break-after: always; }
  .pagina:last-child { page-break-after: auto; }
  header .paso { font-size: 11px; letter-spacing: .1em; text-transform: uppercase; color: #1f7ac0; }
  header h2 { font-size: 19px; margin: 3px 0 6px; }
  header p { font-size: 12.5px; line-height: 1.5; color: #4a5b85; margin: 0 0 12px; max-width: 165mm; }
  figure { margin: 0; text-align: center; }
  img { max-width: ${esMovil ? '78mm' : '100%'}; max-height: 205mm; border: 1px solid #dde3f0; border-radius: 6px; }
</style></head><body>
  <div class="portada">
    <div class="marca">Purifreze</div>
    <h1>Flujo de registro de método de pago</h1>
    <p class="sub">Pantallas que recorre el cliente para autorizar el cobro recurrente${esMovil ? ', en teléfono celular' : ''}.</p>
    <dl>
      <dt>Comercio</dt><dd>Purifreze</dd>
      <dt>Portal</dt><dd>https://www.purifreze.mx/purifreze-suscripcion</dd>
      <dt>Procesador</dt><dd>Openpay · BBVA</dd>
      <dt>Tipo de cobro</dt><dd>Recurrente mensual con tarjeta, autorizado por el cliente</dd>
      <dt>Captura de tarjeta</dt><dd>Tokenizada en el navegador con Openpay.js</dd>
      <dt>Pantallas</dt><dd>${archivos.length}</dd>
      <dt>Fecha</dt><dd>${hoy}</dd>
    </dl>
  </div>
  ${paginas}
</body></html>`;

const htmlPath = join(dir, '_pdf.html');
writeFileSync(htmlPath, html);

const navegador = await chromium.launch();
const page = await navegador.newPage();
await page.goto('file://' + resolve(htmlPath));
mkdirSync(resolve(salida, '..'), { recursive: true });
await page.pdf({ path: salida, format: 'A4', printBackground: true });
await navegador.close();
console.log(`PDF -> ${salida} (${archivos.length} pantallas + portada)`);
