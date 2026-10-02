# 0003 · PostgreSQL + PostGIS frente a MongoDB

**Estado:** Aceptada (especificación v1.0, §9)

## Contexto

La búsqueda principal es geoespacial (cafés en un radio, ordenados por distancia) y el modelo es relacional (usuarios, rutas, cafés, check-ins).

## Decisión

PostgreSQL 17 con PostGIS 3.5, accedido mediante Prisma 7.

## Consecuencias

- `ST_DWithin` + índice GIST resuelven la búsqueda por radio en milisegundos (RNF2).
- Prisma no entiende los tipos de PostGIS, así que esas consultas se escriben en SQL con `Prisma.sql` (ver `apps/api/src/cafes/cafe-search.sql.ts`) y la columna geográfica se declara como `Unsupported` (ver 0009).
- La extensión `unaccent` permite buscar "Malaga" y encontrar "Málaga".
