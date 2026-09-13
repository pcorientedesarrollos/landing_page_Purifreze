import { defineConfig, devices } from '@playwright/test';

/**
 * e2e del portal del cliente, que ahora vive en esta landing.
 *
 * Levanta dos procesos: el servidor de Astro ya compilado —no `astro dev`,
 * porque lo que se prueba incluye el middleware y el index del portal generado
 * por `ng build`— y un ERP simulado que responde la validación del enlace.
 *
 * Antes de correr: `npm run build` (compila el portal y la landing).
 */
export default defineConfig({
  testDir: './e2e/tests',
  timeout: 90_000,
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    baseURL: 'http://127.0.0.1:4330',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    // Por omisión sólo se conserva lo de las corridas que fallan. Para MIRAR un
    // flujo correr hay dos interruptores que no cambian el uso diario:
    //   VIDEO=1      graba el video aunque el test pase
    //   SLOW_MO=700  pausa esos milisegundos entre acciones (con --headed)
    video: process.env['VIDEO'] ? 'on' : 'retain-on-failure',
    launchOptions: { slowMo: Number(process.env['SLOW_MO'] ?? 0) },
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      command: 'node e2e/erp-mock.mjs',
      port: 4010,
      reuseExistingServer: true,
      stdout: 'ignore',
      stderr: 'pipe',
    },
    {
      command: 'node dist/server/entry.mjs',
      port: 4330,
      env: { PORT: '4330', HOST: '127.0.0.1', PORTAL_API_URL: 'http://localhost:4010' },
      reuseExistingServer: true,
      timeout: 60_000,
      stdout: 'ignore',
      stderr: 'pipe',
    },
  ],
});
