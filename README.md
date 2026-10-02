# CoffeeRoute

Planificador de rutas por cafés de especialidad: descubre cafeterías verificadas, planifica rutas por ciudad y registra tus visitas. Especificación completa en [`docs/spec.md`](docs/spec.md); decisiones técnicas en [`docs/adr`](docs/adr/README.md).

## Estructura

```
apps/
  api/      NestJS 11 + Prisma 7 + PostgreSQL/PostGIS + Redis   → http://localhost:3000 (docs: /api/docs)
  mobile/   Expo SDK 57 + Expo Router + NativeWind              → Expo Go / simulador
  admin/    Next.js 16 (panel de curación)                       → http://localhost:3001
packages/
  shared/         Esquemas Zod, tipos y constantes de dominio compartidos
  tsconfig/       tsconfig base
  eslint-config/  Configuración ESLint base (api, shared)
docs/       Especificación y ADRs
```

## Requisitos

- Node 24 (`nvm use` lee `.nvmrc`) y pnpm 10 (`corepack enable` o `npm i -g pnpm`)
- Docker (Docker Desktop o Colima)
- Para el móvil: Xcode con el simulador de iOS, Android Studio, o la app Expo Go en tu teléfono

## Puesta en marcha

```bash
nvm use
pnpm install
cp apps/api/.env.example apps/api/.env          # cambia JWT_ACCESS_SECRET y SEED_ADMIN_PASSWORD; MAPBOX_ACCESS_TOKEN opcional
cp apps/admin/.env.example apps/admin/.env.local
pnpm db:up                                      # PostGIS en :5433 y Redis en :6380
pnpm db:migrate                                 # aplica las migraciones
pnpm db:seed                                    # admin, usuario demo y ~25 cafés ficticios
pnpm dev                                        # api + admin + Metro (Expo) en paralelo
```

Postgres y Redis se publican en los puertos **5433** y **6380** para no chocar con instalaciones locales.

### Usuarios del seed

| Rol             | Email                                 | Contraseña                               |
| --------------- | ------------------------------------- | ---------------------------------------- |
| Curador (ADMIN) | `SEED_ADMIN_EMAIL` de `apps/api/.env` | `SEED_ADMIN_PASSWORD` de `apps/api/.env` |
| Usuario         | `demo@coffeeroute.app`                | `demo-password-123`                      |

Los cafés del seed (Málaga, Madrid y Lisboa) y sus tostadores son **ficticios**.

### App móvil

```bash
pnpm --filter @coffeeroute/mobile dev   # pulsa "i" (iOS) o "a" (Android), o escanea el QR con Expo Go
```

La app llama a la API en el mismo host que sirve Metro, así que funciona en simulador y en un teléfono de la misma red Wi-Fi. Para otra URL, define `EXPO_PUBLIC_API_URL` en `apps/mobile/.env`.

## Scripts

| Comando                                    | Qué hace                                                                      |
| ------------------------------------------ | ----------------------------------------------------------------------------- |
| `pnpm dev`                                 | Arranca todas las apps en modo desarrollo                                     |
| `pnpm build`                               | Compila shared, api y admin                                                   |
| `pnpm lint` / `pnpm typecheck`             | ESLint y TypeScript en todo el monorepo                                       |
| `pnpm test`                                | Tests unitarios de todos los paquetes y e2e de la API (necesita `pnpm db:up`) |
| `pnpm format` / `pnpm format:check`        | Prettier                                                                      |
| `pnpm db:migrate` / `db:seed` / `db:reset` | Migraciones, datos de ejemplo y reinicio de la BD de desarrollo               |
| `pnpm --filter @coffeeroute/api db:studio` | Prisma Studio                                                                 |

Los e2e de la API usan su propia base de datos `coffeeroute_test` (se crea sola) y la base 1 de Redis; nunca tocan los datos de desarrollo.

## API

Versionada bajo `/api/v1` (RNF35). Swagger en <http://localhost:3000/api/docs>. Errores siempre con la forma `{ statusCode, message, code, fieldErrors? }` y mensajes en español aptos para mostrar al usuario.

| Endpoint                                                                                                                | Acceso                                                                     |
| ----------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `POST /auth/signup` · `login` · `refresh` · `logout`                                                                    | Público (login/signup limitados a 10 req/min)                              |
| `GET /cafes?lat&lng&radiusKm&city&q&brewMethods&amenities&priceRange&roaster&openNow&page&limit`                        | Público                                                                    |
| `GET /cafes/:id`                                                                                                        | Público (los no verificados solo los ven su proponente y los curadores)    |
| `POST /cafes`                                                                                                           | Usuario: propone un café (queda `PENDING`)                                 |
| `POST /routes/plan`                                                                                                     | Usuario: tramos, totales y orden óptimo (opcionalmente desde tu ubicación) |
| `GET /routes/mine` · `POST /routes` · `PATCH/DELETE /routes/:id`                                                        | Usuario (solo el autor modifica)                                           |
| `GET /routes?city` · `GET /routes/:id`                                                                                  | Público para rutas públicas; las privadas solo las ve su autor             |
| `GET/PATCH/DELETE /users/me` · `GET /users/:id`                                                                         | Usuario / público                                                          |
| `GET /admin/cafes/pending` · `GET /admin/cafes/:id` · `PATCH /admin/cafes/:id/verify` · `PATCH /admin/cafes/:id/reject` | ADMIN                                                                      |
| `GET /health`                                                                                                           | Público: estado de base de datos y Redis                                   |

## Estado del MVP

Hecho en esta fase:

- **UC1 / UC3:** búsqueda por ubicación o ciudad, filtros, mapa y lista. **UC6:** propuesta y verificación de cafés. Auth email/contraseña y perfil con estadísticas.
- **UC2 / RF3-6 / RF16:** rutas de 2-10 cafés con orden óptimo exacto, tiempos a pie de Mapbox (con respaldo), notas, edición, borrado y exportación a Google/Apple Maps ([ADR 0011](docs/adr/0011-route-planning.md)).
- Modelo de datos completo del MVP (rutas, check-ins, follows, favoritos y reportes ya existen en la BD).
- CI en GitHub Actions: formato, lint, typecheck, tests (incluidos e2e con PostGIS) y build.

Pendiente:

- «Iniciar ruta» guiada (UC7), división en varios días (UC3), check-ins y valoraciones (UC4), modo offline (UC8).
- Google y Apple Sign-In (RF20). Notificar al proponente cuando se verifica o rechaza su café.
- Sentry en el móvil, subida de imágenes, despliegue (Railway) y migración a Mapbox ([ADR 0007](docs/adr/0007-react-native-maps-interim.md)).

## Problemas frecuentes

- **`no matching manifest for linux/arm64`:** la imagen `postgis/postgis` no publica arm64; usamos `imresamu/postgis` ([ADR 0010](docs/adr/0010-dependency-versions.md)).
- **Docker no responde con Colima:** `colima start`.
- **El simulador de iOS no arranca** ("command line tools selected"): `sudo xcode-select -s /Applications/Xcode.app/Contents/Developer`.
- **`prisma migrate dev` pide un nombre de migración sin haber cambiado nada:** revisa que la columna `location` siga declarada con `dbgenerated` ([ADR 0009](docs/adr/0009-postgis-generated-column.md)).
