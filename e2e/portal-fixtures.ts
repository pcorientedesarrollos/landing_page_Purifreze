import { Page } from '@playwright/test';

/**
 * Datos y simulaciones compartidos por las dos cosas que corren sobre el portal:
 * el test de regresión y el generador de capturas para Openpay.
 *
 * Vive fuera de e2e/tests/ a propósito: ahí dentro Playwright tomaría el archivo
 * como una suite sin tests y fallaría.
 *
 * Los datos son INVENTADOS pero verosímiles. No salen de la base: estas pantallas
 * terminan en un PDF que se manda fuera de la empresa, y el nombre y el monto que
 * paga un cliente real no tienen por qué viajar ahí.
 */

/**
 * Enlace de un solo uso con el que se entra al portal. Debe coincidir con el
 * TOKEN_DE_PRUEBA de e2e/erp-mock.mjs, que es quien lo da por válido: el
 * servidor de la landing consulta esa validación antes de renderizar nada.
 */
export const TOKEN_ENLACE = 'enlace-e2e-0123456789abcdef';

/** La ruta pública, con el enlace. El '#/' lo pide el router del portal. */
export const RUTA_PORTAL = `/purifreze-suscripcion?t=${TOKEN_ENLACE}#/`;

export const CLIENTE = {
  idCliente: 2481,
  nombre: 'DISTRIBUIDORA DEL SURESTE SA DE CV',
  correo: 'administracion@distribuidorasureste.mx',
  rfc: 'DSU140312QK3',
};

export const SESION = {
  token: 'sesion-de-demostracion',
  expiraEnMinutos: 30,
  cliente: { idCliente: CLIENTE.idCliente, nombre: CLIENTE.nombre, correo: CLIENTE.correo },
};

/**
 * UN SOLO CONTRATO, y no es un recorte del ejemplo.
 *
 * Decisión openpay.fecha-multicontrato: el cliente con más de un contrato
 * cobrable NO entra al portal, se atiende con el dueño. El backend lo bloquea
 * con el motivo MULTICONTRATO (openpay-suscripcion.reglas.ts). Sembrar dos
 * contratos acá pintaría una pantalla que en producción nadie ve.
 */
export const SERVICIO = {
  descripcion: 'Renta de equipo Purifreze',
  contratos: [{ idContrato: 2481, equipos: 3, monto: 2320, periodicidad: null }],
  periodicidad: 'Mensual',
  openpay: { repeatEvery: 1, repeatUnit: 'month' },
  subtotal: 2000,
  iva: 320,
  total: 2320,
  tasaIva: 0.16,
  excluidos: 0,
  bloqueo: null,
  primerCobro: primerDiaDelMesQueViene(),
  fechaMensualidad: primerDiaDelMesQueViene().slice(0, 7),
  cobroVencido: false,
};

/** Tarjeta de prueba de Openpay. Nunca sale del navegador: la tokenización está simulada. */
export const TARJETA = {
  titular: 'JORGE RAMIREZ SOLIS',
  numero: '4111111111111111',
  cvv: '123',
};

export const TOKEN_OPENPAY = 'tok_demostracion';
export const DEVICE_SESSION_ID = 'device_demostracion';
export const CODIGO = '482913';

export function primerDiaDelMesQueViene(): string {
  const hoy = new Date();
  const f = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 1);
  return `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, '0')}-01`;
}

/** MM/AA tres años adelante: el componente rechaza vigencias ya vencidas. */
export function vigenciaFutura(): string {
  const f = new Date();
  return `${String(f.getMonth() + 1).padStart(2, '0')}/${String((f.getFullYear() + 3) % 100).padStart(2, '0')}`;
}

/**
 * Openpay.js y jQuery quedan definidos ANTES de que cargue la app, y los scripts
 * del CDN se responden vacíos. El servicio encuentra `window.OpenPay` ya puesto y
 * nunca habla con js.openpay.mx: tokenizar de verdad dejaría un método de pago
 * vivo en la pasarela.
 */
export async function simularOpenpay(page: Page): Promise<void> {
  await page.addInitScript(
    ({ tokenId, deviceId }) => {
      (window as any).jQuery = () => ({});
      (window as any).OpenPay = {
        setId: () => {},
        setApiKey: () => {},
        setSandboxMode: () => {},
        deviceData: { setup: () => deviceId },
        token: {
          create: (_datos: unknown, exito: (r: any) => void) => exito({ data: { id: tokenId } }),
        },
      };
    },
    { tokenId: TOKEN_OPENPAY, deviceId: DEVICE_SESSION_ID }
  );

  for (const script of ['**/js.openpay.mx/**', '**/ajax.googleapis.com/**']) {
    await page.route(script, ruta =>
      ruta.fulfill({ status: 200, contentType: 'application/javascript', body: '' })
    );
  }
}

/** Siembra la sesión del portal: es lo que deja el login tras verificar el código. */
export async function sembrarSesion(page: Page): Promise<void> {
  await page.addInitScript(
    ({ clave, sesion }) => sessionStorage.setItem(clave, JSON.stringify(sesion)),
    { clave: 'portal_purifreze_sesion', sesion: SESION }
  );
}

function json(datos: unknown) {
  return { status: 200, contentType: 'application/json', body: JSON.stringify(datos) };
}

/**
 * Responde todo lo que el portal le pide al backend.
 *
 * `alRegistrar` recibe el cuerpo del POST /portal/tarjeta, que es donde se
 * comprueba que el número de tarjeta no viaja al servidor.
 */
export async function simularBackend(
  page: Page,
  opciones: {
    conAutenticacion?: boolean;
    alRegistrar?: (cuerpo: any) => void;
    /** true pinta el distintivo "MODO DE PRUEBAS". Por omisión se muestra el
     *  portal como lo ve el cliente en producción, que es lo que documentan
     *  las capturas. */
    sandbox?: boolean;
  } = {}
): Promise<void> {
  if (opciones.conAutenticacion) {
    await page.route('**/portal/solicitar-codigo', ruta => ruta.fulfill(json({ data: { enviado: true } })));
    await page.route('**/portal/verificar-codigo', ruta => ruta.fulfill(json({ data: SESION })));
  }

  await page.route('**/portal/contratos', ruta => ruta.fulfill(json({ data: SERVICIO })));
  await page.route('**/portal/config-openpay', ruta =>
    ruta.fulfill(
      json({ data: { merchantId: 'm_demo', publicKey: 'pk_demo', sandbox: opciones.sandbox ?? false } })
    )
  );
  await page.route('**/portal/tarjeta', async ruta => {
    opciones.alRegistrar?.(ruta.request().postDataJSON());
    await ruta.fulfill(
      json({
        data: {
          marca: 'visa',
          ultimos4: '1111',
          cobroActivado: true,
          primerCobro: SERVICIO.primerCobro,
          fechaMensualidad: SERVICIO.fechaMensualidad,
          monto: SERVICIO.total,
        },
      })
    );
  });
}
