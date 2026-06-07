# Arquitectura del proyecto Purifreze

## Objetivo

El proyecto contiene una landing publica y un CMS propio para administrar su
contenido. La arquitectura separa la interfaz publica, el panel administrativo,
la API y la persistencia de datos.

```text
Landing Astro  ----\
                    -> API Nest.js -> Prisma -> MySQL en DreamHost
Admin Angular  ----/
```

## Estructura general

```text
landing_page_Purifreze/
|-- src/                 # Landing publica en Astro
|-- public/              # Assets publicos de la landing
|-- admin/               # Panel administrativo independiente en Angular
|-- backend/             # API independiente en Nest.js
|-- ARCHITECTURE.md      # Este documento
```

La landing permanece en la raiz para evitar una reorganizacion prematura. El
admin y el backend son proyectos independientes, cada uno con su propio
`package.json`.

## Landing publica

**Tecnologia:** Astro y Tailwind CSS.

**Ubicacion:** `src/` y `public/`.

Responsabilidades:

- Mostrar el sitio publico de Purifreze.
- Renderizar las secciones comerciales: Hero, beneficios, comparacion, usos,
  testimonios, FAQ y CTA.
- Conservar los recursos visuales en `public/assets/`.
- Mostrar la galeria de videos administrada desde el CMS con respaldo local.

Estado actual:

- La tabla de comparacion detallada consulta la API en el navegador y permite
  editar sus filas desde el CMS.
- Las filas locales se conservan como respaldo si la API no esta disponible.
- Queda pendiente conectar progresivamente las demas secciones con el contenido
  administrado.

Comando de desarrollo:

```powershell
npm run dev -- --port 4321
```

URL local:

```text
http://localhost:4321
```

## Panel administrativo

**Tecnologia:** Angular standalone y Tailwind CSS.

**Ubicacion:** `admin/`.

Responsabilidades:

- Listar secciones de contenido.
- Mostrar un estado vacio cuando no hay secciones.
- Crear secciones desde el navegador.
- Editar titulo, descripcion, orden, visibilidad y contenido JSON adicional.
- Enviar cambios a la API Nest.js.

Configuracion local:

```ts
apiUrl: 'http://localhost:3000'
landingUrl: 'http://localhost:4321'
```

La configuracion vive en `admin/src/environments/environment.ts`. `landingUrl`
permite previsualizar en el admin
los recursos versionados bajo `/assets`. Este archivo solo debe contener URLs
publicas; no debe incluir contrasenas o secretos.

Comando de desarrollo:

```powershell
cd admin
npm start
```

URL local:

```text
http://localhost:4200
```

## API

**Tecnologia:** Nest.js.

**Ubicacion:** `backend/`.

Responsabilidades:

- Recibir solicitudes HTTP desde el admin y la landing.
- Validar los datos antes de procesarlos.
- Consultar MySQL mediante Prisma.
- Permitir solicitudes CORS desde las URLs configuradas.

Flujo interno:

```text
Solicitud HTTP
  -> Controller
  -> DTO y ValidationPipe
  -> Service
  -> PrismaService
  -> MySQL en DreamHost
```

### Modulos principales

```text
backend/src/
|-- app.module.ts
|-- main.ts
|-- prisma/
|   |-- prisma.module.ts
|   `-- prisma.service.ts
`-- content-sections/
    |-- content-sections.module.ts
    |-- content-sections.controller.ts
    |-- content-sections.service.ts
    `-- dto/
        |-- create-content-section.dto.ts
        `-- update-content-section.dto.ts
```

### Controller, DTO y Service

- **Controller:** define las rutas HTTP y recibe las solicitudes.
- **DTO:** valida la forma y las reglas de los datos entrantes.
- **Service:** contiene la logica para leer y escribir contenido.
- **PrismaService:** administra la conexion entre Nest.js y MySQL.

### Endpoints actuales

```text
GET    /content-sections
POST   /content-sections
PATCH  /content-sections/:key
```

Ejemplo para crear una seccion:

```json
{
  "key": "hero",
  "label": "Portada",
  "title": "Agua purificada siempre disponible",
  "description": "Sin cargar garrafones ni preocuparte por el mantenimiento.",
  "isVisible": true
}
```

Comando de desarrollo:

```powershell
cd backend
npm run start:dev
```

URL local:

```text
http://localhost:3000
```

## Base de datos

**Motor:** MySQL alojado en DreamHost.

**ORM:** Prisma.

Prisma funciona como una capa entre TypeScript y MySQL:

```text
Codigo TypeScript -> Prisma Client -> Driver MySQL -> DreamHost
```

El esquema se encuentra en:

```text
backend/prisma/schema.prisma
```

### Modelo actual

```prisma
model ContentSection {
  id          Int      @id @default(autoincrement())
  key         String   @unique @db.VarChar(80)
  label       String   @db.VarChar(120)
  title       String?  @db.VarChar(255)
  description String?  @db.Text
  content     Json?
  sortOrder   Int      @default(0)
  isVisible   Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

El campo `content` permite almacenar datos adicionales en JSON mientras se
definen formularios especificos para Hero, FAQ, testimonios y otras secciones.

### Sincronizacion del esquema

Durante el prototipo se uso:

```powershell
cd backend
npx prisma db push
```

Este comando sincroniza `schema.prisma` con la base remota. DreamHost no permite
crear automaticamente la shadow database que requiere `prisma migrate dev`.

Antes de produccion conviene decidir entre:

- Crear una base adicional para usarla como shadow database.
- Generar y versionar migraciones SQL con un flujo compatible con DreamHost.

## Variables de entorno del backend

Archivo local:

```text
backend/.env
```

Plantilla versionable:

```text
backend/.env.example
```

Variables:

```env
DATABASE_URL="mysql://USER:PASSWORD@HOST:3306/DATABASE"
DATABASE_HOST="HOST"
DATABASE_PORT=3306
DATABASE_USER="USER"
DATABASE_PASSWORD="PASSWORD"
DATABASE_NAME="DATABASE"
PORT=3000
ADMIN_ORIGIN="http://localhost:4200"
LANDING_ORIGIN="http://localhost:4321"
```

Los archivos `.env` reales no deben subirse a Git porque contienen secretos.

## Estado del MVP

Funcional:

- Base MySQL exclusiva para el CMS.
- Tabla `ContentSection`.
- Conexion entre Nest.js, Prisma y DreamHost.
- API para listar, crear y editar secciones.
- Validacion de datos mediante DTOs.
- Admin Angular conectado a la API.
- Creacion manual de una seccion desde el navegador.
- Filas de la tabla comparativa editables desde el admin con orden y visibilidad.
- Galeria de videos editable con subida MP4, visibilidad y borrado de uploads.
-Articulos de blog editables 
## Multimedia

El MVP guarda videos subidos desde el admin en el disco local del backend:

```text
backend/uploads/videos/
```

Nest expone esos archivos bajo:

```text
GET /uploads/videos/:filename
```

La API acepta archivos MP4 de hasta 25 MB:

```text
POST   /media/videos
DELETE /media/videos/:filename
```

El borrado fisico solo permite nombres UUID generados por el backend. Los
recursos versionados de la landing, como `public/assets/hidratcion.mp4`, no
pueden eliminarse mediante el CMS.

Antes de produccion conviene mover estos archivos a almacenamiento persistente
externo si el hosting no garantiza conservar el disco local del proceso.
