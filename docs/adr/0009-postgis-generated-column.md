# 0009 · Columna `location` generada por PostGIS

**Estado:** Aceptada

## Contexto

Prisma no puede escribir tipos `geography`. Mantener a mano una columna geográfica sincronizada con `latitude`/`longitude` es propenso a errores.

## Decisión

`cafes.location` es `geography(Point, 4326) GENERATED ALWAYS AS (ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography) STORED`, con índice GIST. En `schema.prisma` se declara como `Unsupported(...)` con `@default(dbgenerated(...))` para que `prisma migrate dev` no detecte una deriva en cada ejecución.

## Consecuencias

- El código solo escribe `latitude`/`longitude`; la base de datos mantiene la geometría.
- La migración inicial se editó a mano (`CREATE EXTENSION postgis` y expresión `GENERATED`).
