import { defineMiddleware } from 'astro:middleware';
import {
  validarEnlace,
  RUTA_PORTAL,
  RUTA_ASSETS,
  RUTA_ENLACE_NO_DISPONIBLE,
} from './lib/enlace-suscripcion';

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

  // El portal: sin enlace válido no se renderiza el portal, pero sí una pantalla
  // que explique qué pasó. El 404 mudo era correcto contra quien sondea la URL y
  // pésimo para el cliente de verdad, que es quien llega acá: su enlace dura una
  // hora y abrirlo tarde es lo más normal del mundo.
  //
  // Se hace rewrite y no redirect para conservar la URL del enlace: si vuelve a
  // tocarlo desde su chat cae de nuevo en la explicación, no en una dirección
  // que no reconoce. Y el token no se arrastra a ninguna parte.
  if (pathname === RUTA_PORTAL || pathname === `${RUTA_PORTAL}/`) {
    const enlace = await validarEnlace(searchParams.get('t'));
    if (!enlace.valido) return context.rewrite(RUTA_ENLACE_NO_DISPONIBLE);
    context.locals.tokenPortal = enlace.token!;
  }

  return next();
});
