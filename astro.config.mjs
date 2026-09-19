// @ts-check
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import node from '@astrojs/node';
import { erpDelNavegador } from './src/lib/acceso-portal';

/**
 * Dice al arrancar contra qué ERP va a canjear el código el navegador.
 *
 * La URL no se decide en el build sino en el entorno, así que mirando el código
 * no se sabe cuál quedó: el mismo `npm run dev` apunta a localhost o a Railway
 * según lo que haya en el shell. Sin esto, teclear un código y ver "no sirve"
 * no distingue entre un código vencido y estar pegándole al ERP equivocado.
 */
const avisoDelErp = {
    name: 'purifreze:aviso-erp',
    hooks: {
        'astro:server:start': () => {
            const { url, origen } = erpDelNavegador();
            console.log(`[portal] el canje del código va a ${url} · ${origen}`);
        },
    },
};

// https://astro.build/config
export default defineConfig({
    integrations: [tailwind(), avisoDelErp],
    output: 'server',
    adapter: node({ mode: 'standalone' }),
});

