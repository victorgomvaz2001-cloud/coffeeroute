# 0007 · react-native-maps como solución provisional

**Estado:** Aceptada

## Contexto

Mapbox (0002) requiere una development build. Durante el MVP queremos iterar en Expo Go, sin compilar binarios nativos.

## Decisión

Usar `react-native-maps` (Apple Maps en iOS, Google Maps en Android), funcional en Expo Go, encapsulado en `apps/mobile/src/components/cafe-map.tsx`.

## Consecuencias

- Sin estilos de mapa personalizados ni mapas offline hasta migrar a Mapbox.
- La migración se limita a `CafeMap` cuando exista la dev build.
