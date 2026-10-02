# 0010 · Versiones de dependencias (octubre de 2026)

**Estado:** Aceptada. Revisar en cada actualización de SDK o versión mayor.

| Pieza          | Elegida                   | Alternativa descartada | Motivo                                                                                                                                         |
| -------------- | ------------------------- | ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Node           | 24 LTS                    | 20                     | Node 20 está fuera de soporte; Prisma 7 pide ≥ 20.19                                                                                           |
| NestJS         | 11                        | 12                     | `nestjs-zod` y `@nest-lab/throttler-storage-redis` aún no admiten 12                                                                           |
| Prisma         | 7.x                       | 8 (RC)                 | La etiqueta `latest` de npm apunta a una RC                                                                                                    |
| Expo           | SDK 57                    | SDK 58                 | 57 es la versión estable más reciente                                                                                                          |
| NativeWind     | 5.0.0-rc.0 (fijada)       | 4.x                    | La documentación de NativeWind indica la 5 RC para Expo 57, con una matriz probada idéntica a nuestras versiones (RN 0.86.3, Reanimated 4.5.1) |
| Imagen PostGIS | `imresamu/postgis:17-3.5` | `postgis/postgis`      | La imagen oficial no publica arm64 (Apple Silicon)                                                                                             |

## Consecuencias

- NativeWind es una release candidate: si falla, la alternativa es `StyleSheet` con los tokens de `usePalette`.
- Prisma 7 carga su compilador WASM con `import()` dinámico; Jest e2e necesita `--experimental-vm-modules`.
