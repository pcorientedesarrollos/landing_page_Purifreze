/**
 * Declaraciones mínimas del namespace NodeJS para los tipos de anime.js v4.
 *
 * Sus archivos .d.ts referencian NodeJS.Immediate y NodeJS.Timeout —tipos de
 * retorno de setImmediate y setTimeout en Node— aunque la biblioteca corra en el
 * navegador. Como tsconfig.app.json declara `"types": []`, esos nombres no
 * existen y el build falla con TS2503.
 *
 * Se declaran solo esos dos en lugar de habilitar @types/node completo: incluir
 * todas las APIs de Node en un proyecto de navegador dejaría pasar sin error
 * cosas como `import fs from 'fs'`, que nunca deben llegar al bundle del cliente.
 *
 * Ambos se declaran como interfaces vacías a propósito: el código del portal
 * nunca los usa directamente, solo hacen falta para que los tipos de anime.js
 * resuelvan.
 */
declare namespace NodeJS {
  interface Immediate {}
  interface Timeout {}
}
