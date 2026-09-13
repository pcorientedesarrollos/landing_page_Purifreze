import { createServer } from 'node:http';

/**
 * ERP simulado para los e2e del portal.
 *
 * Sólo existe por una razón: /portal/enlace/validar lo consulta el SERVIDOR de
 * la landing, no el navegador, así que page.route de Playwright no puede
 * interceptarlo. Todo lo demás que el portal pide —contratos, config de
 * Openpay, alta de tarjeta— sale del navegador y se simula desde el test.
 */
export const TOKEN_DE_PRUEBA = 'enlace-e2e-0123456789abcdef';
const PUERTO = Number(process.env['PUERTO_ERP_MOCK'] ?? 4010);

createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/portal/enlace/validar') {
    let cuerpo = '';
    req.on('data', c => (cuerpo += c));
    req.on('end', () => {
      const { token } = JSON.parse(cuerpo || '{}');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ data: { valido: token === TOKEN_DE_PRUEBA } }));
    });
    return;
  }
  res.writeHead(404).end();
}).listen(PUERTO, () => console.log(`[erp-mock] escuchando en ${PUERTO}`));
