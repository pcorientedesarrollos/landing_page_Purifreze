import { defineMiddleware } from 'astro:middleware';

export const onRequest = defineMiddleware((context, next) => {
  const host = context.request.headers.get('host');
  if (host === 'purifreze.mx') {
    const url = new URL(context.request.url);
    url.host = 'www.purifreze.mx';
    return Response.redirect(url.toString(), 301);
  }
  return next();
});