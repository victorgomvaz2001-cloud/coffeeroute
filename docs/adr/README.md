# Architecture Decision Records

Decisiones técnicas de CoffeeRoute. Formato: contexto → decisión → consecuencias. Una ADR aceptada no se edita; si cambia la decisión se crea otra que la sustituya.

| #                                         | Decisión                                                    | Estado                       |
| ----------------------------------------- | ----------------------------------------------------------- | ---------------------------- |
| [0001](0001-react-native-expo.md)         | React Native + Expo para la app móvil                       | Aceptada                     |
| [0002](0002-mapbox.md)                    | Mapbox GL como proveedor de mapas                           | Aceptada (aplazada por 0007) |
| [0003](0003-postgresql-postgis.md)        | PostgreSQL + PostGIS                                        | Aceptada                     |
| [0004](0004-nestjs.md)                    | NestJS para el backend                                      | Aceptada                     |
| [0005](0005-monorepo.md)                  | Monorepo pnpm + Turborepo                                   | Aceptada                     |
| [0006](0006-auth-jwt.md)                  | Autenticación propia con JWT + refresh tokens rotados       | Aceptada                     |
| [0007](0007-react-native-maps-interim.md) | react-native-maps mientras no haya dev build                | Aceptada                     |
| [0008](0008-zod-shared-validation.md)     | Validación con Zod compartida (en lugar de class-validator) | Aceptada                     |
| [0009](0009-postgis-generated-column.md)  | Columna `location` generada por PostGIS                     | Aceptada                     |
| [0010](0010-dependency-versions.md)       | Versiones fijadas a octubre de 2026                         | Aceptada                     |
| [0011](0011-route-planning.md)            | Rutas: Held-Karp + Mapbox Matrix con caché y respaldo       | Aceptada                     |
