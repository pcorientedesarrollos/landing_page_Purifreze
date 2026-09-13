import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter, withHashLocation } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { importProvidersFrom } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';

import { AppComponent } from './app/app.component';
import { PortalRoutes } from './app/pages/portal/portal.routes';

/**
 * Arranque del portal del cliente, separado del ERP a propósito.
 *
 * En admin-purifreze el portal era una ruta más de la SPA del administrador, y
 * publicarlo aquí habría mandado al navegador del cliente todo el código del
 * ERP —cobros, facturación, reportes— para que llenara un formulario de
 * tarjeta. Este bootstrap carga ÚNICAMENTE PortalRoutes.
 *
 * Lo que deliberadamente NO se provee, y estaba en el main.ts del admin:
 *   - JwtInterceptorInterceptor: pisaba el header Authorization en todas las
 *     peticiones con el JWT del empleado. Es la razón de que el portal use su
 *     propio header X-Portal-Token.
 *   - AuthGuardService / DeactivateGuard: guardas de pantallas del ERP.
 *   - provideToastr, ExcelService, DatePipe: sin uso en estas tres pantallas.
 *
 * withHashLocation() no es herencia del admin: la ruta pública es
 * /purifreze-suscripcion mientras que los assets se sirven desde /portal-app/.
 * Con la ruta en el hash, el router queda independiente del path y las dos
 * cosas conviven sin reescrituras del servidor.
 */
bootstrapApplication(AppComponent, {
  providers: [
    provideAnimations(),
    provideRouter(PortalRoutes, withHashLocation()),
    importProvidersFrom(HttpClientModule),
  ],
}).catch(err => console.error(err));
