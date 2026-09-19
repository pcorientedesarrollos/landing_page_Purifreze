import { defineMiddleware } from 'astro:middleware';
import { RUTA_ASSETS } from './lib/acceso-portal';

/** 404 sin cuerpo: no confirma siquiera que la ruta exista. */
const noEncontrado = () => new Response(null, { status: 404 });

export const onRequest = defineMiddleware(async (context, next) => {
  const host = context.request.headers.get('host');
  if (host === 'purifreze.mx') {
    const url = new URL(context.request.url);
    url.host = 'www.purifreze.mx';
    return Response.redirect(url.toString(), 301);
  }

  // El index compilado del portal se sirve SÓLO por su página. Los archivos de
  // public/ los entrega el adaptador node ANTES que este middleware, así que un
  // index alcanzable por su ruta de assets sería una segunda puerta a la misma
  // pantalla, por fuera de lo que se decida acá.
  const { pathname } = context.url;
  if (pathname === `${RUTA_ASSETS}/index.html` || pathname === `${RUTA_ASSETS}/`) {
    return noEncontrado();
  }

  // El portal ya no se protege desde acá. Antes traía el token en la URL y
  // había algo que validar antes de renderizar; ahora la credencial es un
  // código que se teclea en /activar, y lo que hace falta para ver datos es la
  // sesión que sale de ese canje. Sin ella la pantalla se vuelve sola a
  // /activar, y el servidor no entrega datos de nadie en el camino.

  return next();
});
