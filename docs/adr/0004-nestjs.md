# 0004 · NestJS frente a Express directo

**Estado:** Aceptada (especificación v1.0, §9)

## Contexto

La API crecerá por módulos (auth, cafés, rutas, check-ins, admin) y necesita documentación OpenAPI.

## Decisión

NestJS con módulos por dominio, guards globales (JWT → roles → rate limiting) y un filtro global de errores.

## Consecuencias

- Inyección de dependencias y estructura opinada; Swagger generado en `/api/docs`.
- Usamos NestJS 11, no 12: varias librerías clave aún no declaran compatibilidad con 12 (ver 0010).
