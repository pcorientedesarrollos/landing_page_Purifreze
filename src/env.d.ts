/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    /** Token del enlace de suscripción, puesto por el middleware tras validarlo. */
    tokenPortal?: string;
  }
}
