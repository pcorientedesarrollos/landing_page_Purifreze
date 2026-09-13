import { Routes } from '@angular/router';

/**
 * Rutas del portal público del cliente.
 *
 * Fuera de /admin y SIN AuthGuardService: quien entra acá no es un empleado con
 * usuario del ERP, es un cliente que se autentica con RFC + correo + código.
 */
export const PortalRoutes: Routes = [
  {
    path: '',
    title: 'Registrar método de pago | Purifreze',
    loadComponent: () =>
      import('./registrar-tarjeta/registrar-tarjeta.component').then(
        c => c.PortalRegistrarTarjetaComponent
      ),
  },
];
