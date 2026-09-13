import { defineMiddleware } from 'astro:middleware';
import { validarEnlace, RUTA_PORTAL, RUTA_ASSETS } from './lib/enlace-suscripcion';

/** 404 sin cuerpo: no confirma siquiera que la ruta exista. */
const noEncontrado = () => new Response(null, { status: 404 });

export const onRequest = defineMiddleware(async (context, next) => {
  const host = context.request.headers.get('host');
  if (host === 'purifreze.mx') {
    const url = new URL(context.request.url);
    url.host = 'www.purifreze.mx';
    return Response.redirect(url.toString(), 301);
  }

  const { pathname, searchParams } = context.url;

  // El index compilado del portal se sirve SÓLO por la página, que antes valida
  // el enlace. Alcanzarlo por su ruta de assets saltearía el gate entero.
  if (pathname === `${RUTA_ASSETS}/index.html` || pathname === `${RUTA_ASSETS}/`) {
    return noEncontrado();
  }

  // El portal: sin enlace válido no se renderiza nada. Se responde 404 y no un
  // 401 o un 403 a propósito — quien sondea la URL no se entera de que existe.
  if (pathname === RUTA_PORTAL || pathname === `${RUTA_PORTAL}/`) {
    const enlace = await validarEnlace(searchParams.get('t'));
    if (!enlace.valido) return noEncontrado();
    context.locals.tokenPortal = enlace.token!;
  }

  return next();
});
