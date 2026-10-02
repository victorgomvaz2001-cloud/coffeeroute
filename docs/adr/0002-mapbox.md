# 0002 · Mapbox GL frente a Google Maps

**Estado:** Aceptada; implementación aplazada por [0007](0007-react-native-maps-interim.md) (especificación v1.0, §9)

## Contexto

Necesitamos mapas personalizables, buen precio a escala y soporte offline (UC8).

## Decisión

Mapbox GL (`@rnmapbox/maps`) como proveedor objetivo: 50k cargas/mes gratis, estilos propios y paquetes offline.

## Consecuencias

- Requiere development build (no funciona en Expo Go) y un token de Mapbox.
- Hasta tener la dev build usamos react-native-maps (0007); el componente `CafeMap` aísla el cambio.
