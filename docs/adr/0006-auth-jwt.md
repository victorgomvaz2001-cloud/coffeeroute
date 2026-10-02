# 0006 · Autenticación propia con JWT

**Estado:** Aceptada

## Contexto

La especificación permitía Clerk, Auth0 o una implementación propia. Queremos evitar coste por usuario activo y dependencia de un proveedor.

## Decisión

- Access token JWT (HS256, 15 min) con `sub` y `role`.
- Refresh token opaco de 48 bytes aleatorios, guardado solo como hash SHA-256, válido 30 días y **rotado en cada uso**.
- Si se reutiliza un refresh token ya revocado se revocan todas las sesiones del usuario (detección de robo).
- Contraseñas con bcrypt (coste 12). El login compara contra un hash ficticio si el email no existe, para no revelar cuentas por tiempo de respuesta.
- Móvil: sesión en Keychain/Keystore (`expo-secure-store`), refresh automático con una única petición en vuelo.
- Panel admin: tokens en cookies httpOnly; `proxy.ts` refresca antes de renderizar.

## Consecuencias

- Google y Apple Sign-In (RF20) quedan pendientes: se añadirán verificando el `idToken` en la API y creando usuarios con `authProvider` GOOGLE/APPLE.
- La revocación ante reutilización afecta a todos los dispositivos del usuario.
