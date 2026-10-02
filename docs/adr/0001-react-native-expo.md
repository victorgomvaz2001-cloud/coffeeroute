# 0001 · React Native + Expo frente a Flutter

**Estado:** Aceptada (especificación v1.0, §9)

## Contexto

Necesitamos una app para iOS y Android con más del 85 % de código compartido (RNF42) y actualizaciones OTA (RNF39).

## Decisión

React Native con Expo (SDK 57) y Expo Router para la navegación.

## Consecuencias

- Un solo lenguaje (TypeScript) en móvil, API y panel web; podemos compartir tipos y validación (ver 0008).
- Expo gestiona las versiones nativas compatibles (`npx expo install`) y permite EAS Update para OTA.
- Expo Router está construido sobre React Navigation, así que cumple el requisito de navegación de la especificación.
