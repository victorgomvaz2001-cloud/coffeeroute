# 0008 · Validación con Zod compartida

**Estado:** Aceptada. Sustituye la mención a class-validator de la especificación (§4.1).

## Contexto

Las mismas reglas (email, contraseña, filtros de búsqueda, propuesta de café, motivo de rechazo) se validan en la API, el formulario móvil y el panel admin.

## Decisión

Los esquemas viven en `@coffeeroute/shared` con Zod 4:

- API: `nestjs-zod` (`createZodDto` y `ZodValidationPipe` global), que además genera el esquema OpenAPI.
- Móvil: `react-hook-form` + `zodResolver`.
- Admin: `safeParse` en los Server Actions.
- Mensajes por defecto en español (`z.locales.es()`) y mensajes propios en los campos importantes.

## Consecuencias

- Una sola fuente de verdad: un cliente no puede validar distinto que la API.
- Toda la app debe usar una única instancia de `zod` (lo garantiza pnpm resolviendo la misma versión).
