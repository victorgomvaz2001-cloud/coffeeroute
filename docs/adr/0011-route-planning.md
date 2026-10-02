# 0011 · Planificación de rutas: Held-Karp + Mapbox Matrix

**Estado:** Aceptada

## Contexto

RF3/RF4 piden ordenar 2–10 cafés por la ruta más corta y estimar el tiempo total (visitas + desplazamientos) en menos de 2 s (RNF3).

## Decisión

- **Orden óptimo exacto** con Held-Karp (programación dinámica, O(n²·2ⁿ)): con 11 nodos como máximo (10 cafés + ubicación de salida) tarda milisegundos. Es un camino abierto (no vuelve al inicio) y admite matrices asimétricas. Vive en `@coffeeroute/shared` (`shortestOpenPath`), probado contra fuerza bruta.
- **Tiempos a pie** con la Mapbox Matrix API (perfil `walking`), una petición por plan (≤ 25 coordenadas).
- **Caché** en Redis por par de coordenadas (5 decimales, 30 días): la clave cambia si un café se mueve, así que no hace falta invalidar.
- **Respaldo** con una estimación (línea recta × 1,3 a 4,8 km/h) para pares sin ruta, sin token, con Mapbox caído o en los tests. La respuesta indica `travelSource: 'mapbox' | 'estimate'` y la app muestra «tiempos aproximados».
- `POST /routes/plan` exige sesión y tiene un límite propio (30/min por usuario) porque cada plan puede consumir cuota de Mapbox (60 peticiones/min por cuenta).

## Consecuencias

- El token vive solo en la API (`MAPBOX_ACCESS_TOKEN`), nunca en la app.
- Exportar a mapas: Google Maps recibe la ruta completa (paradas como `waypoints`); los enlaces de Apple Maps solo admiten un destino, así que en iOS se ofrece Apple Maps para el primer café.
