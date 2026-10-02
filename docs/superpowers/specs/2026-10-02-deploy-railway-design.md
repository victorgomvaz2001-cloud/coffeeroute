# Despliegue en Railway — Diseño

**Fecha:** 2026-10-02
**Alcance:** RNF31/RNF38 de [`docs/spec.md`](../../spec.md) y la tarea «despliegue (Railway)» del README. Se deja el repo listo para desplegar y se documenta el proceso; no se crea ni se despliega ningún proyecto en Railway.

## Objetivo

Que cualquiera con acceso al repo y una cuenta de Railway pueda poner en producción la API y el panel de curación siguiendo `DEPLOY.md`, sin decisiones por tomar ni pasos ocultos, y que los despliegues siguientes sean automáticos al fusionar en `main` con CI en verde.

**Éxito:**

- `DEPLOY.md` cubre el primer despliegue de principio a fin, los despliegues siguientes, migraciones, rollback, copias de seguridad, secretos y problemas frecuentes.
- La infraestructura del entorno `production` está declarada en `.railway/railway.ts` y se aplica con `railway config plan` / `railway config apply`.
- Ningún secreto entra en git.
- Producción nunca recibe datos ficticios del seed.

## Decisiones

| Tema                  | Decisión                                                                                                                                                                                                                                                  |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Configuración         | **Infrastructure as Code** de Railway (`.railway/railway.ts`, paquete `railway`). `railway.json` / `railway.toml` (Config as Code) están obsoletos y dejan de leerse el 2026-12-01.                                                                       |
| Entornos              | Solo `production`. El archivo recibe `ctx.environment` para que añadir `staging` más adelante sea crear el entorno y aplicar.                                                                                                                             |
| Base de datos         | Servicio de imagen `postgis/postgis:17-3.5` (misma versión que en local) con volumen propio. El Postgres gestionado de Railway no incluye PostGIS.                                                                                                        |
| Caché                 | Helper `redis()` de Railway.                                                                                                                                                                                                                              |
| Build                 | Railpack (sin Dockerfile) con comandos de turbo por servicio sobre el monorepo compartido (sin `rootDirectory`). Node fijado con `RAILPACK_NODE_VERSION=24`, porque Railpack lee `engines.node` (`>=24`) antes que `.nvmrc`. No se podan devDependencies. |
| Migraciones           | `preDeploy` de la API: `prisma migrate deploy`. Corre con la red privada disponible; si falla, el despliegue se detiene y sigue sirviendo la versión anterior.                                                                                            |
| Red interna           | El panel llama a la API por la red privada (`http://${{api.RAILWAY_PRIVATE_DOMAIN}}:3000/api/v1`). Los entornos nuevos resuelven IPv4 e IPv6, así que la API sigue escuchando en `0.0.0.0`.                                                               |
| Despliegue automático | Integración de GitHub de Railway desde `main` con **«Wait for CI»** activado: solo despliega si el workflow `CI` pasa (RNF38 sin job de despliegue propio).                                                                                               |
| Primer administrador  | Comando `create-admin` compilado en `dist`, ejecutado dentro del contenedor con `railway ssh`. El seed se niega a ejecutarse con `NODE_ENV=production`.                                                                                                   |
| Móvil                 | Fuera de alcance salvo documentar `EXPO_PUBLIC_API_URL` con el dominio público de la API. Las builds de EAS van en otra iteración.                                                                                                                        |

## Cambios en el repo

### `.railway/railway.ts`

Nuevo, con `railway` como devDependency en la raíz. Recursos:

- **`postgis`** — `source: image("postgis/postgis:17-3.5")`, volumen `postgis-data` montado en `/var/lib/postgresql/data`, variables `POSTGRES_USER=coffeeroute`, `POSTGRES_DB=coffeeroute`, `PGDATA=/var/lib/postgresql/data/pgdata` (el volumen trae `lost+found` en su raíz) y `POSTGRES_PASSWORD: preserve()`.
- **`redis`** — `redis("redis")`.
- **`api`** — `source: github("victorgomvaz2001-cloud/coffeeroute", { branch: "main" })`:
  - `build`: `pnpm turbo run build --filter=@coffeeroute/api` (compila `shared` y genera el cliente de Prisma por las dependencias de turbo).
  - `start`: `pnpm --filter @coffeeroute/api start`.
  - `preDeploy`: `pnpm --filter @coffeeroute/api db:deploy`.
  - `healthcheck`: `/health`.
  - `env`: `NODE_ENV=production`, `PORT=3000`, `RAILPACK_NODE_VERSION=24`, `DATABASE_URL` compuesta con referencias al servicio `postgis` (usuario, contraseña, dominio privado, puerto 5432, base `coffeeroute`), `REDIS_URL` por referencia a `redis`, `CORS_ORIGINS=""` (ningún navegador llama a la API: el panel la usa desde el servidor), y `JWT_ACCESS_SECRET`, `MAPBOX_ACCESS_TOKEN`, `SENTRY_DSN` con `preserve()`.
- **`admin`** — mismo `source`:
  - `build`: `pnpm turbo run build --filter=@coffeeroute/admin`.
  - `start`: `pnpm --filter @coffeeroute/admin start`.
  - `env`: `NODE_ENV=production`, `PORT=3001`, `RAILPACK_NODE_VERSION=24`, `API_URL` por la red privada.

`.railway/README.md` (lo genera la CLI) se adapta en español con los dos comandos de uso. El archivo debe pasar `tsc` contra los tipos del paquete `railway` y entrar en el lint/format del monorepo.

### Panel

`apps/admin/package.json`: `"start": "next start --port ${PORT:-3001}"`. En local sigue en 3001.

### `create-admin`

`apps/api/src/cli/create-admin.ts`, compilado en `apps/api/dist/cli/create-admin.js` y expuesto como script `admin:create` en la API:

- Uso: `node apps/api/dist/cli/create-admin.js <email>` con la contraseña en `ADMIN_PASSWORD` (variable de entorno, para no dejarla en el historial ni en la lista de procesos).
- Valida email y contraseña con los esquemas de `@coffeeroute/shared` (8–72 caracteres).
- Crea o actualiza el usuario con rol `ADMIN` y contraseña hasheada con el mismo coste de bcrypt que `AuthService` (se exporta la constante en lugar de duplicarla).
- Sale con código distinto de 0 y mensaje claro si falta algo; nunca imprime la contraseña.
- La lógica (validar y hacer upsert) vive en una función pura y probada; el archivo de entrada solo lee `argv`/`env` y llama a esa función.

### Seed

`apps/api/prisma/seed.ts` lanza un error al empezar si `NODE_ENV === "production"`: «El seed crea datos ficticios y no se ejecuta en producción. Usa admin:create para el primer administrador.»

### Documentación

- **`DEPLOY.md`** (raíz, español):
  1. Mapa de servicios (diagrama de texto) y qué hace cada uno.
  2. Requisitos: cuenta de Railway, CLI instalada, app de GitHub de Railway con acceso al repo, Node 24 y pnpm en local.
  3. Primer despliegue: `railway login`, crear/enlazar el proyecto (`railway init` / `railway link`), `pnpm install`, `railway config plan` y `railway config apply`; definir los secretos (`POSTGRES_PASSWORD`, `JWT_ACCESS_SECRET` generado con `openssl rand -base64 48`, opcionales `MAPBOX_ACCESS_TOKEN`, `SENTRY_DSN`); activar «Wait for CI» y watch paths por servicio en el panel; generar dominios públicos para `api` (puerto 3000) y `admin` (puerto 3001); crear el administrador con `railway ssh`; comprobar `/health`, el login del panel y una búsqueda de cafés.
  4. Móvil: `EXPO_PUBLIC_API_URL=https://<dominio-api>/api/v1`.
  5. Despliegues siguientes: merge a `main` → CI → Railway; cambios de infraestructura con `config plan/apply`.
  6. Migraciones: `preDeploy`, migraciones compatibles hacia atrás (expandir → desplegar → contraer), qué pasa si fallan.
  7. Rollback: redeploy de un despliegue anterior desde Railway; las migraciones no se deshacen.
  8. Copias de seguridad: backups del volumen de `postgis` y cómo restaurar.
  9. Secretos: rotación de `JWT_ACCESS_SECRET` (cierra todas las sesiones) y de `POSTGRES_PASSWORD`.
  10. Observabilidad: logs de Railway, `/health`, Sentry.
  11. Problemas frecuentes: `type "geography" does not exist` (imagen sin PostGIS), `preDeploy` fallido, healthcheck que no pasa, panel sin conexión con la API, variables sin definir (la API valida el entorno al arrancar y dice cuál falta).
- **ADR 0013** «Despliegue en Railway con IaC» e índice de ADRs.
- **README**: enlace a `DEPLOY.md` en «Puesta en marcha» y «Estado del MVP» actualizado (despliegue preparado; pendiente el primer despliegue real y EAS).

## Errores y seguridad

- Secretos solo en Railway (`preserve()`); `DEPLOY.md` nunca muestra valores reales.
- La API ya falla al arrancar con un mensaje legible si el entorno es inválido (`validateEnv`); el healthcheck impide promocionar un despliegue roto.
- `create-admin` no registra ni imprime la contraseña y rechaza contraseñas fuera de 8–72 caracteres.
- El seed no puede contaminar producción.

## Pruebas

- **Unitarios (API):** la función de `create-admin`: crea admin nuevo, promociona y cambia la contraseña de uno existente, rechaza email inválido y contraseña corta/larga (Prisma simulado solo en el límite de la función).
- **e2e (API):** `create-admin` contra la base de datos de pruebas: el usuario resultante puede iniciar sesión y recibe rol `ADMIN`.
- **Typecheck:** `.railway/railway.ts` contra los tipos de `railway`.
- **Prueba local «como en producción»** (manual, con evidencia en el plan): `pnpm turbo run build --filter=@coffeeroute/api --filter=@coffeeroute/admin`; API con `NODE_ENV=production` desde `dist` respondiendo `/health`; panel con `PORT=4001 pnpm --filter @coffeeroute/admin start` respondiendo en 4001; `create-admin` contra la BD local; `NODE_ENV=production pnpm db:seed` rechazado.
- CI sin cambios debe seguir verde.

## Fuera de alcance

Crear el proyecto real en Railway, dominios propios, entorno `staging`, PR previews, builds de EAS para el móvil, alta disponibilidad de Postgres y un job de despliegue en GitHub Actions.
