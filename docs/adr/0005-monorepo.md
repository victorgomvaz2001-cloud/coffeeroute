# 0005 · Monorepo pnpm + Turborepo

**Estado:** Aceptada

## Contexto

La especificación (§10) sugería repositorios separados para móvil, backend y panel admin. Los tres comparten tipos de dominio, constantes y reglas de validación.

## Decisión

Un único repositorio con pnpm workspaces y Turborepo:
`apps/api`, `apps/mobile`, `apps/admin` y `packages/shared`, `packages/tsconfig`, `packages/eslint-config`.

## Consecuencias

- Un cambio de contrato API ↔ cliente se hace en un solo commit y lo valida la misma CI.
- Turbo cachea y ordena tareas (`db:generate` → `build`/`typecheck`/`test`). Su modo estricto oculta variables de entorno no declaradas: las que necesita la CI están en `globalPassThroughEnv`.
- Expo funciona con dependencias aisladas de pnpm desde el SDK 54, sin `node-linker=hoisted`.
