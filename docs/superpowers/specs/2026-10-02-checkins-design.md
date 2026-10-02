# Check-ins y valoraciones — Diseño

**Fecha:** 2026-10-02
**Alcance:** UC4 / RF7 y RF8 (sin fotos) de [`docs/spec.md`](../../spec.md).

## Objetivo

Un usuario registrado registra su visita a un café verificado y lo valora en tres dimensiones (café, servicio, ambiente; 1-5), con métodos probados, nota de tasting y precio pagado opcionales. La ficha del café muestra valoraciones reales y las visitas recientes; el perfil muestra el historial del usuario y sus estadísticas dejan de estar a cero.

**Éxito:**

- Un check-in creado desde la ficha actualiza al momento la media, el número de valoraciones y las visitas del café.
- Las medias de búsqueda, tarjetas y ficha salen de check-ins reales, también en el seed.
- No se puede inflar la media de un café: un voto por usuario y un check-in por café y día.

## Decisiones

| Tema                    | Decisión                                                                                                                                                                                                |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Repetición              | Se permiten visitas repetidas al mismo café, como máximo **una por café y día natural**. «Día» en la zona horaria del café (`Cafe.timezone`).                                                           |
| Ubicación               | **No se exige** estar cerca del café (sin geofencing): evita falsos negativos de GPS y permite registrar visitas a posteriori.                                                                          |
| Media del café          | **Un voto por usuario:** cuenta el check-in más reciente de cada usuario. Puntuación de un check-in = media de sus 3 dimensiones. `averageRating` = media de esas puntuaciones, redondeada a 1 decimal. |
| `totalReviews`          | Usuarios distintos con al menos un check-in en el café.                                                                                                                                                 |
| `totalCheckIns`         | Todos los check-ins del café.                                                                                                                                                                           |
| Visibilidad             | Check-ins **públicos**: autor, valoraciones, métodos y nota se ven en la ficha y en el perfil público. **`pricePaid` solo lo ve su autor.**                                                             |
| Mantenimiento de medias | Recálculo explícito en el servicio, dentro de la misma transacción que la escritura y con la fila del café bloqueada (enfoque A; se descartó un trigger de Postgres y calcular al leer).                |
| Medias por dimensión    | Se calculan al leer la ficha (solo se usan ahí). Solo se persisten las tres cifras que usan búsqueda y tarjetas.                                                                                        |

**Fuera de alcance:** fotos (pendiente de la subida de imágenes; la columna `photos` queda en el esquema pero la API no la acepta), gamificación, feed de actividad (v2), check-in offline (UC8) y la integración con «Iniciar ruta» (UC7, siguiente iteración).

## Datos

Migración sobre `check_ins`:

- Nueva columna `visitedOn DATE NOT NULL`: fecha local del café en el momento de crear el check-in. La calcula la API a partir de `Cafe.timezone`; no cambia al editar.
- Se elimina `@@unique([userId, cafeId, createdAt])` (no impedía nada) y se añade `@@unique([userId, cafeId, visitedOn])`. La base de datos garantiza el límite diario aunque lleguen dos peticiones simultáneas.
- Nuevo `@@index([userId, createdAt])` para el historial del usuario. Se mantiene `@@index([cafeId])`.

La tabla está vacía en todos los entornos (no hay despliegue), así que la columna se crea `NOT NULL` sin valor por defecto.

## Esquemas compartidos

Nuevo `packages/shared/src/checkin.ts`, exportado desde `index.ts`:

- `ratingSchema`: entero 1-5.
- `createCheckInSchema`: `cafeId` (uuid), `ratingCoffee`, `ratingService`, `ratingAmbiance`, `brewMethods` (opcional, valores de `BREW_METHODS`, sin repetidos, por defecto `[]`), `notes` (opcional, `trim`, máx. 500), `pricePaid` (opcional, 0-100, hasta 2 decimales).
- `updateCheckInSchema`: los mismos campos salvo `cafeId`, todos opcionales; `notes` y `pricePaid` admiten `null` para borrarlos. Al menos un campo.
- `checkInListQuerySchema`: reutiliza `paginationQuerySchema`.
- Tipos de respuesta:
  - `CheckInAuthor`: `{ id, name, avatarUrl }`.
  - `PublicCheckIn`: `{ id, ratingCoffee, ratingService, ratingAmbiance, overallRating, brewMethods, notes, visitedOn, createdAt, author }`.
  - `CheckIn` (del autor): `PublicCheckIn` + `pricePaid` + `cafe: { id, name, city, country }`.
  - `CafeRatings`: `{ coffee, service, ambiance }` (1 decimal).
- `CafeDetail` gana `ratings: CafeRatings | null` (null sin valoraciones) y `myCheckInToday: { id: string } | null` (null si la petición no va autenticada o no hay check-in hoy).

Mensajes de validación en español, como el resto de esquemas.

## API

Nuevo módulo `apps/api/src/checkins` (`CheckinsController`, `CheckinsService`, `CafeRatingsService`, `checkin.mapper.ts`).

| Endpoint                             | Acceso  | Comportamiento                                                                                                                                                                                                     |
| ------------------------------------ | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `POST /checkins`                     | Usuario | Café inexistente o no `VERIFIED` → 404 `NOT_FOUND`. Ya existe check-in hoy (violación del único, P2002) → 409 `CHECKIN_ALREADY_TODAY`, «Ya hiciste check-in aquí hoy». `@Throttle` 20 req/min. Devuelve `CheckIn`. |
| `GET /checkins/me?page&limit`        | Usuario | Historial propio paginado (`Paginated<CheckIn>`), del más reciente al más antiguo.                                                                                                                                 |
| `PATCH /checkins/:id`                | Autor   | Si no existe o no eres el autor → 404 (como en rutas). Devuelve `CheckIn`.                                                                                                                                         |
| `DELETE /checkins/:id`               | Autor   | Igual que `PATCH`. 204.                                                                                                                                                                                            |
| `GET /cafes/:id/checkins?page&limit` | Público | `Paginated<PublicCheckIn>` de un café verificado (si no, 404). Más recientes primero.                                                                                                                              |
| `GET /users/:id/checkins?page&limit` | Público | `Paginated<PublicCheckIn>` de un usuario, con el café incluido (`PublicCheckIn & { cafe }`), solo de cafés verificados.                                                                                            |

`GET /cafes/:id` añade `ratings` y `myCheckInToday`. El endpoint ya es público y acepta usuario opcional (como `GET /routes/:id`).

### Recálculo de agregados

`CafeRatingsService.recompute(tx, cafeId)`, siempre dentro de una transacción interactiva de Prisma:

1. `SELECT id FROM cafes WHERE id = $1 FOR UPDATE` — serializa recálculos concurrentes del mismo café.
2. Un único `UPDATE cafes SET "averageRating", "totalReviews", "totalCheckIns"` calculado desde `check_ins`: `DISTINCT ON ("userId") … ORDER BY "userId", "createdAt" DESC` para la media y el número de valoraciones, `COUNT(*)` para el total. Sin check-ins, todo a 0.

Lo llaman:

- `CheckinsService.create`, `update` y `delete`.
- `UsersService.deleteMe`: en una transacción recoge los `cafeId` distintos de los check-ins del usuario, borra al usuario (los check-ins caen en cascada) y recalcula cada café afectado.
- El seed.

Tras cada escritura confirmada se llama a `CafeSearchCacheService.invalidate()` para que el orden por valoración de la búsqueda no quede desfasado.

`visitedOn` se calcula en la API con `Intl.DateTimeFormat('en-CA', { timeZone: cafe.timezone })` sobre la hora actual.

## App móvil

Patrones existentes: React Query en `lib/api`, react-hook-form + zod (`lib/forms.ts`), NativeWind, componentes `Section`, `Chip`, `Button`, `FormError`, estados de `components/states.tsx`.

- **`lib/api/checkins.ts`:** `useCreateCheckIn`, `useUpdateCheckIn`, `useDeleteCheckIn`, `useMyCheckIns` (infinite), `useCafeCheckIns` (infinite). Las mutaciones invalidan la ficha del café, sus visitas, `me`, `checkins/me` y la búsqueda de cafés.
- **Ficha del café (`cafe/[id].tsx`):**
  - Botón **«Hacer check-in»** junto a «Cómo llegar», solo en cafés verificados. Sin sesión → `/login`. Con `myCheckInToday` → «Check-in de hoy ✓ · Editar».
  - Sección **«Valoraciones»**: media global y tres barras (Café, Servicio, Ambiente). Estado vacío: «Sé el primero en valorar».
  - Sección **«Visitas recientes»**: las 3 últimas (autor, fecha, puntuación, métodos como chips, nota de tasting) y «Ver todas» → `cafe/[id]/checkins.tsx` (lista paginada).
- **`checkin.tsx` (modal):** parámetros `cafeId` (crear) o `checkInId` (editar).
  - `components/rating-input.tsx`: 5 iconos por dimensión, `accessibilityRole="adjustable"` con acciones de incrementar/decrementar.
  - Métodos probados: chips seleccionables, primero los del café y luego «Otros».
  - Nota de tasting multilínea con contador (500) y precio pagado numérico en € opcional.
  - Al guardar vuelve a la ficha; los errores de API (409 incluido) se muestran con `FormError`.
  - En edición, «Eliminar check-in» con confirmación.
- **Perfil (`(tabs)/profile.tsx`):** sección **«Mis visitas»** con los 5 últimos check-ins (café, ciudad, fecha, puntuación); tocar uno abre su edición; «Ver todas» → `checkins/mine.tsx` (paginada). Las estadísticas existentes no cambian.

Lógica pura en `lib/checkins.ts`: formateo de la puntuación global y ordenación de métodos (los del café primero).

## Seed

- Se eliminan `averageRating` y `totalReviews` de `seed-data.ts`.
- Se crean ~6 usuarios ficticios y check-ins deterministas (valoraciones, métodos, notas y fechas `visitedOn` repartidas en días pasados), más algunos del usuario demo, sobre cafés verificados.
- Al terminar se llama a `CafeRatingsService.recompute` (o a la misma consulta SQL exportada) para cada café.

## Errores

Forma estándar `{ statusCode, message, code, fieldErrors? }` con mensajes en español:

- 400 validación (`fieldErrors` por campo).
- 404 `NOT_FOUND` para café inexistente o no verificado y para check-ins ajenos o inexistentes.
- 409 `CHECKIN_ALREADY_TODAY`.
- 429 por throttling.

## Tests

- **shared:** `checkin.test.ts` — límites de valoración, métodos válidos y sin repetir, longitud de nota, precio, `update` vacío rechazado.
- **API e2e (`test/checkins.e2e-spec.ts`):**
  - Crear check-in y comprobar agregados del café.
  - Segundo check-in el mismo día → 409.
  - Café pendiente → 404.
  - Un voto por usuario: segundo check-in del mismo usuario en otro día (fijando `visitedOn`/`createdAt` vía Prisma) sustituye su voto en la media; `totalCheckIns` suma ambos.
  - Editar y borrar recalculan; otro usuario recibe 404.
  - Listados públicos sin `pricePaid`; `GET /checkins/me` con `pricePaid`.
  - `GET /cafes/:id` devuelve `ratings` y `myCheckInToday`.
  - Borrar la cuenta recalcula los cafés afectados.
- **Unitarios API:** cálculo de `visitedOn` por zona horaria (cambio de día en UTC vs. hora local).
- **Móvil:** `lib/__tests__/checkins.test.ts` para la lógica pura; verificación visual en el simulador de iOS.

## Documentación

- README: endpoints nuevos y estado del MVP (UC4 hecho salvo fotos).
- ADR 0012: reglas de check-in y cálculo de valoraciones (un voto por usuario, un check-in por café y día en la zona del café, recálculo transaccional).
