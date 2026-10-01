# CoffeeRoute - Planificador de Rutas de Cafés de Especialidad

## Documento de Especificación Técnica v1.0

**Fecha:** Octubre 2026  
**Autor:** Equipo de Desarrollo  
**Estado:** En definición  

---

## 1. Visión del Producto

CoffeeRoute es una aplicación móvil multiplataforma (iOS/Android) que permite a los amantes del café de especialidad descubrir cafeterías verificadas, planificar rutas de visita multi-café por ciudad, y registrar sus experiencias mediante check-ins y valoraciones detalladas.

### 1.1 Propuesta de Valor Única

- **Enfoque en especialidad:** Solo cafeterías que cumplen criterios estrictos de café de especialidad (tostadores de calidad, equipamiento profesional, baristas formados).
- **Planificación de rutas:** No solo "cafés cercanos", sino rutas optimizadas para visitar múltiples cafés en una zona/ciudad.
- **Información curada:** Datos que no están en Google Maps (métodos de brew, tostadores servidos, equipamiento, ambiente para trabajar).
- **Comunidad de nicho:** Usuarios que valoran el café de especialidad y comparten rutas y recomendaciones.

### 1.2 Público Objetivo

- **Viajeros cafeteros:** Personas que planifican visitas a cafés de especialidad cuando viajan a nuevas ciudades.
- **Locales exploradores:** Residentes que quieren descubrir nuevos cafés de especialidad en su ciudad.
- **Nómadas digitales:** Personas que trabajan remoto y buscan cafés laptop-friendly con buen café.
- **Entusiastas del café:** Home baristas y aficionados que quieren explorar la escena de especialidad.

---

## 2. Requisitos Funcionales

### 2.1 Actores del Sistema

| Actor | Descripción |
|-------|-------------|
| **Usuario no registrado** | Puede buscar cafés, ver mapa, ver rutas públicas. No puede guardar, valorar ni crear rutas. |
| **Usuario registrado** | Puede crear/guardar rutas, hacer check-in, valorar cafés, seguir usuarios, compartir rutas. |
| **Administrador/Curador** | Verifica nuevos cafés, gestiona base de datos, modera contenido, responde reportes. |
| **Propietario de café** (Fase 2) | Puede reclamar ficha de su café, actualizar información, responder valoraciones. |

### 2.2 Casos de Uso Principales

#### UC1: Búsqueda de Cafés por Ubicación

**Descripción:** El usuario busca cafés de especialidad cerca de su ubicación actual o en una ciudad específica.

**Precondición:** 
- Usuario tiene permisos de ubicación activados O introduce ciudad manualmente.

**Flujo Principal:**
1. Usuario abre la app y permite acceso a ubicación (o introduce ciudad en barra de búsqueda).
2. Sistema muestra mapa interactivo y lista de cafés de especialidad en radio de 5 km (ajustable).
3. Usuario aplica filtros: abierto ahora, métodos de brew (pour-over, espresso, cold brew, siphon), tostadores en barra, wifi, laptop-friendly, rango de precios.
4. Sistema actualiza resultados en tiempo real.
5. Usuario selecciona un café para ver ficha detallada.

**Postcondición:** Usuario visualiza información completa del café y puede añadirlo a una ruta.

**Excepciones:**
- Sin conexión: muestra cafés cacheados en la zona.
- Sin resultados: sugiere ampliar radio de búsqueda o quitar filtros.

---

#### UC2: Creación de Ruta Personalizada

**Descripción:** El usuario crea una ruta con múltiples cafés para visitar en una zona.

**Precondición:** 
- Usuario está registrado.
- Usuario ha buscado cafés y seleccionado al menos 2.

**Flujo Principal:**
1. Usuario pulsa botón "Crear ruta" desde mapa o lista.
2. Sistema abre editor de ruta con cafés seleccionados.
3. Usuario añade/elimina cafés de la ruta.
4. Sistema calcula automáticamente:
   - Distancia total de la ruta.
   - Tiempo estimado de visita (45 min por café por defecto, editable).
   - Tiempo de desplazamiento entre cafés (caminando o transporte público).
   - Orden óptimo de visita (algoritmo de ruta más corta).
5. Usuario puede reordenar cafés manualmente (drag & drop).
6. Usuario añade notas por café (ej. "probar flat white aquí", "llegar antes de las 11 para evitar colas").
7. Usuario guarda la ruta con nombre descriptivo (ej. "Ruta centro Málaga - 4 cafés").
8. Sistema guarda ruta en perfil del usuario.

**Postcondición:** Ruta guardada y accesible desde perfil, disponible offline.

**Excepciones:**
- Café cerrado temporalmente: sistema notifica y sugiere alternativo cercano.

---

#### UC3: Planificación de Ruta por Ciudad (Pre-Viaje)

**Descripción:** El usuario planifica una ruta antes de viajar a una ciudad destino.

**Precondición:** 
- Usuario está registrado.
- Usuario introduce ciudad de destino (ej. "Lisboa", "Copenhague").

**Flujo Principal:**
1. Usuario busca ciudad en barra de búsqueda principal.
2. Sistema muestra cafés de especialidad en esa ciudad agrupados por barrios/zonas.
3. Sistema muestra mapa de la ciudad con cafés marcados.
4. Usuario selecciona cafés y crea ruta como en UC2.
5. Sistema muestra:
   - Mapa completo de la ruta.
   - Tiempo total estimado (visita + desplazamientos).
   - Sugerencia de orden óptimo.
   - Opción de dividir en múltiples días si la ruta es muy larga.
6. Usuario puede exportar ruta a Google Maps / Apple Maps para navegación paso a paso.
7. Usuario guarda la ruta para acceso offline durante el viaje.

**Postcondición:** Ruta disponible en la app y exportada a app de mapas externa.

---

#### UC4: Check-in y Valoración en Café

**Descripción:** El usuario registra su visita y valora el café en múltiples dimensiones.

**Precondición:** 
- Usuario está registrado.
- Usuario está físicamente cerca del café (geofencing opcional).

**Flujo Principal:**
1. Usuario abre ficha del café y pulsa "Check-in".
2. Sistema solicita valoración en 3 dimensiones (escala 1-5):
   - Calidad del café.
   - Servicio/atención.
   - Ambiente/espacio.
3. Usuario selecciona método(s) probado(s): espresso, filter, cold brew, etc.
4. Usuario puede añadir:
   - Fotos de bebidas/espacio.
   - Nota de tasting (texto libre, ej. "notas a chocolate, acidez media, cuerpo alto").
   - Precio pagado (opcional).
5. Sistema guarda check-in y actualiza media de valoraciones del café.
6. Sistema suma puntos al perfil del usuario (gamificación: "10 cafés visitados", "5 ciudades exploradas").
7. Sistema publica check-in en feed de actividad (visible para seguidores).

**Postcondición:** Check-in registrado, visible en perfil del usuario y en ficha del café.

**Excepciones:**
- Foto inapropiada: sistema rechaza y notifica (moderación IA).

---

#### UC5: Seguimiento de Usuarios y Rutas Compartidas

**Descripción:** El usuario sigue a otros usuarios y ve sus rutas y check-ins públicos.

**Precondición:** 
- Usuario está registrado.

**Flujo Principal:**
1. Usuario accede a pestaña "Comunidad" o busca usuario por nombre.
2. Usuario ve perfil de otro usuario con:
   - Estadísticas (cafés visitados, ciudades, rutas creadas).
   - Rutas públicas creadas.
   - Check-ins recientes.
3. Usuario pulsa "Seguir".
4. Sistema añade usuario a lista de seguidos.
5. Sistema muestra en feed principal actividad reciente de usuarios seguidos.
6. Usuario puede copiar una ruta pública a su perfil (con atribución automática al creador).

**Postcondición:** Usuario sigue a otro y ve su actividad en feed.

---

#### UC6: Verificación de Café por Administrador

**Descripción:** El administrador verifica que un café cumple criterios de especialidad antes de aparecer en búsquedas públicas.

**Precondición:** 
- Café ha sido propuesto (por usuario, scraping inicial o reclamación de propietario).

**Flujo Principal:**
1. Administrador accede a panel de administración (web).
2. Sistema muestra lista de cafés pendientes de verificación.
3. Administrador revisa información proporcionada:
   - Tostadores servidos (nombres, origen).
   - Equipamiento (marca de máquina de espresso, molinos).
   - Métodos de preparación ofrecidos.
   - Fotos del espacio y bebidas.
   - Web/redes sociales del café.
4. Administrador puede contactar al café para verificar información (email/teléfono).
5. Administrador marca café como:
   - **Verificado:** aparece en búsquedas públicas.
   - **Rechazado:** con motivo registrado (ej. "no sirve especialidad", "información insuficiente").
6. Sistema notifica al usuario proponente del resultado.

**Postcondición:** Café verificado visible en la app o rechazado con motivo registrado.

---

#### UC7: Navegación Paso a Paso Durante Ruta

**Descripción:** El usuario sigue una ruta guardada con navegación integrada.

**Precondición:** 
- Usuario tiene una ruta guardada.
- Usuario está en la ciudad de la ruta.

**Flujo Principal:**
1. Usuario abre ruta guardada desde perfil.
2. Usuario pulsa "Iniciar ruta".
3. Sistema muestra:
   - Primer café de la ruta con dirección y distancia.
   - Botón "Navegar" que abre Google Maps / Apple Maps con destino.
   - Tiempo estimado de llegada.
4. Al llegar al café, usuario hace check-in (UC4).
5. Sistema marca café como "visitado" y muestra siguiente café de la ruta.
6. Usuario repite hasta completar ruta.
7. Sistema muestra resumen final: cafés visitados, distancia total, tiempo total.

**Postcondición:** Ruta completada, estadísticas actualizadas en perfil.

---

#### UC8: Búsqueda Offline

**Descripción:** El usuario accede a información de cafés y rutas sin conexión a internet.

**Precondición:** 
- Usuario ha guardado rutas o visitado cafés previamente (datos cacheados).

**Flujo Principal:**
1. Usuario abre app sin conexión (modo avión o sin cobertura).
2. Sistema detecta falta de conexión y muestra indicador "Modo offline".
3. Usuario puede:
   - Ver rutas guardadas completas.
   - Ver fichas de cafés visitados o en rutas guardadas.
   - Ver mapas cacheados de zonas visitadas recientemente.
4. Sistema permite hacer check-in offline (se sincroniza al recuperar conexión).
5. Al recuperar conexión, sistema sincroniza automáticamente:
   - Check-ins pendientes.
   - Valoraciones nuevas.
   - Rutas creadas offline.

**Postcondición:** Datos sincronizados con servidor, usuario ve información actualizada.

---

### 2.3 Requisitos Funcionales Detallados

| ID | Requisito | Prioridad | Fase |
|----|-----------|-----------|------|
| RF1 | La app debe mostrar cafés de especialidad en mapa interactivo y lista. | Alta | MVP |
| RF2 | La app debe permitir filtrar por: abierto ahora, métodos de brew, tostadores, wifi, laptop-friendly, rango de precios. | Alta | MVP |
| RF3 | La app debe permitir crear rutas con 2-10 cafés y calcular orden óptimo automáticamente. | Alta | MVP |
| RF4 | La app debe estimar tiempo total de ruta (visita + desplazamiento) y mostrarlo al usuario. | Alta | MVP |
| RF5 | La app debe permitir guardar rutas en perfil de usuario con nombre personalizado. | Alta | MVP |
| RF6 | La app debe permitir exportar ruta a Google Maps / Apple Maps para navegación externa. | Media | MVP |
| RF7 | La app debe permitir check-in y valoración en 3 dimensiones (café, servicio, ambiente) con escala 1-5. | Alta | MVP |
| RF8 | La app debe permitir añadir fotos y notas de tasting a cada check-in. | Media | MVP |
| RF9 | La app debe mostrar perfil de usuario con rutas creadas, check-ins, estadísticas (cafés visitados, ciudades). | Media | MVP |
| RF10 | La app debe permitir seguir a otros usuarios y ver su actividad en feed. | Baja | v2 |
| RF11 | La app debe permitir buscar cafés por ciudad antes de viajar (sin estar en ubicación física). | Alta | MVP |
| RF12 | La app debe permitir búsqueda offline de rutas guardadas y fichas de cafés visitados. | Media | MVP |
| RF13 | El panel de administración web debe permitir verificar/rechazar cafés propuestos con motivo. | Alta | MVP |
| RF14 | La app debe notificar al usuario cuando un café en su ruta guardada cambie horario o cierre temporalmente. | Baja | v2 |
| RF15 | La app debe permitir compartir ruta por enlace público (web responsive). | Media | v2 |
| RF16 | La app debe permitir editar o eliminar rutas propias. | Media | MVP |
| RF17 | La app debe permitir marcar cafés como favoritos (lista independiente de rutas). | Media | v2 |
| RF18 | La app debe permitir reportar información incorrecta de un café (horario, cierre, etc.). | Media | v2 |
| RF19 | La app debe soportar múltiples idiomas (español, inglés como mínimo). | Baja | v2 |
| RF20 | La app debe permitir autenticación mediante email/password, Google y Apple Sign-In. | Alta | MVP |

---

## 3. Requisitos No Funcionales

### 3.1 Rendimiento

| ID | Requisito | Métrica | Prioridad |
|----|-----------|---------|-----------|
| RNF1 | Tiempo de carga inicial de la app (cold start) | < 2 segundos en 4G | Alta |
| RNF2 | Tiempo de búsqueda de cafés por ubicación | < 1 segundo para 100 resultados | Alta |
| RNF3 | Tiempo de cálculo de ruta óptima (hasta 10 cafés) | < 2 segundos | Alta |
| RNF4 | Tiempo de carga de ficha de café (con caché) | < 500 ms | Alta |
| RNF5 | Número máximo de usuarios concurrentes soportados | 10,000 usuarios simultáneos | Media |
| RNF6 | Disponibilidad del servicio (uptime mensual) | 99.5% | Alta |
| RNF7 | Tiempo de respuesta de API (p95) | < 300 ms | Alta |
| RNF8 | Tamaño máximo de descarga de app | < 100 MB (iOS y Android) | Media |

### 3.2 Usabilidad

| ID | Requisito | Prioridad |
|----|-----------|-----------|
| RNF9 | La app debe ser intuitiva para usuarios no técnicos (puntuación SUS > 75 en tests de usabilidad). | Alta |
| RNF10 | La app debe seguir guías de diseño de iOS (Human Interface Guidelines) y Android (Material Design 3). | Alta |
| RNF11 | La app debe ser accesible (WCAG 2.1 AA): soporte para VoiceOver/TalkBack, contraste adecuado (ratio 4.5:1), texto escalable hasta 200%. | Alta |
| RNF12 | La app debe funcionar cómodamente con una mano en móviles (elementos clave en zona inferior de pantalla, reachability). | Media |
| RNF13 | La app debe soportar modo oscuro y claro, con detección automática según configuración del sistema. | Media |
| RNF14 | La app debe mostrar mensajes de error claros y accionables (no códigos técnicos). | Alta |
| RNF15 | La app debe tener onboarding guiado para primeros usos (máximo 4 pantallas). | Media |

### 3.3 Seguridad

| ID | Requisito | Prioridad |
|----|-----------|-----------|
| RNF16 | La app debe usar autenticación segura (OAuth 2.0 con Google/Apple, email+password con hash bcrypt). | Alta |
| RNF17 | Las contraseñas nunca deben almacenarse en texto plano (ni en base de datos ni en logs). | Alta |
| RNF18 | La app debe usar HTTPS/TLS 1.3 para todas las comunicaciones cliente-servidor. | Alta |
| RNF19 | Los datos personales del usuario (email, ubicación, fotos) deben estar encriptados en reposo (AES-256). | Alta |
| RNF20 | La app debe cumplir con GDPR: derecho a olvido, exportación de datos, consentimiento explícito para ubicación. | Alta |
| RNF21 | La app debe permitir borrar cuenta y todos los datos asociados en < 30 días tras solicitud. | Alta |
| RNF22 | Las fotos subidas por usuarios deben ser escaneadas por contenido inapropiado (IA de moderación). | Media |
| RNF23 | La API debe implementar rate limiting para prevenir abusos (máx. 100 requests/minuto por usuario). | Media |
| RNF24 | La app debe cerrar sesión automáticamente tras 90 días de inactividad. | Baja |

### 3.4 Fiabilidad

| ID | Requisito | Prioridad |
|----|-----------|-----------|
| RNF25 | La app debe funcionar offline para rutas guardadas y fichas de cafés visitados (almacenamiento local). | Alta |
| RNF26 | La app debe sincronizar datos en cuanto recupere conexión (sync automático en background). | Alta |
| RNF27 | La app debe manejar errores de red de forma elegante (mensajes claros, reintentos automáticos con backoff exponencial). | Alta |
| RNF28 | La base de datos debe tener backup diario automático con retención de 30 días. | Alta |
| RNF29 | La app debe tener logging de errores para debugging (Sentry o similar) con trazas completas. | Alta |
| RNF30 | El sistema debe tener health checks automáticos y alertas si la disponibilidad cae bajo 99%. | Media |

### 3.5 Escalabilidad

| ID | Requisito | Prioridad |
|----|-----------|-----------|
| RNF31 | La arquitectura debe permitir escalar horizontalmente el backend (contenedores en Railway/AWS). | Media |
| RNF32 | La base de datos debe soportar crecimiento a 100,000 cafés y 1M de usuarios sin degradación de rendimiento. | Media |
| RNF33 | El sistema de caché (Redis) debe reducir carga de base de datos en un 80% para lecturas frecuentes. | Media |
| RNF34 | Las imágenes deben servirse desde CDN (Cloudflare Images o AWS CloudFront) con optimización automática. | Alta |
| RNF35 | La API debe soportar versionado (v1, v2) para mantener compatibilidad con versiones antiguas de la app. | Media |

### 3.6 Mantenibilidad

| ID | Requisito | Prioridad |
|----|-----------|-----------|
| RNF36 | El código debe tener tests automatizados (cobertura > 70% en backend, > 50% en frontend móvil). | Alta |
| RNF37 | El código debe seguir convenciones de estilo (ESLint, Prettier) y estar documentado (JSDoc/TSDoc en funciones públicas). | Media |
| RNF38 | El despliegue debe ser automatizado (CI/CD con GitHub Actions: build, test, deploy en cada merge a main). | Alta |
| RNF39 | La app móvil debe soportar actualizaciones OTA (Over-The-Air) para cambios menores sin pasar por store (Expo Updates). | Media |
| RNF40 | Debe haber documentación técnica actualizada (README, arquitectura, decisiones técnicas/ADRs). | Media |

### 3.7 Portabilidad

| ID | Requisito | Prioridad |
|----|-----------|-----------|
| RNF41 | La app debe estar disponible en iOS (versión 17+) y Android (API 26+, Android 8+). | Alta |
| RNF42 | La app debe compartir > 85% de código entre plataformas (React Native + Expo). | Alta |
| RNF43 | La web de rutas compartidas (fase 2) debe ser responsive y funcionar en desktop/móvil/tablet. | Media |
| RNF44 | El backend debe ser agnóstico a plataforma (API REST/GraphQL estándar). | Alta |

### 3.8 Legales y Cumplimiento

| ID | Requisito | Prioridad |
|----|-----------|-----------|
| RNF45 | La app debe mostrar política de privacidad y términos de uso accesibles desde el primer uso (pantalla de registro). | Alta |
| RNF46 | La app debe solicitar consentimiento explícito para uso de ubicación (iOS: `NSLocationWhenInUseUsageDescription`, Android: permisos runtime). | Alta |
| RNF47 | La app debe permitir desactivar seguimiento de ubicación en cualquier momento desde configuración. | Alta |
| RNF48 | Las reseñas y fotos de usuarios deben tener opción de reporte por contenido inapropiado (moderación manual + IA). | Media |
| RNF49 | La app debe mostrar aviso de cookies y tracking si aplica (GDPR). | Media |
| RNF50 | La app debe cumplir con normas de App Store y Play Store (contenido, privacidad, pagos). | Alta |

---

## 4. Arquitectura Técnica

### 4.1 Stack Tecnológico

#### Frontend Móvil
- **Framework:** React Native 0.73+ con Expo SDK 50+
- **Lenguaje:** TypeScript 5+
- **Navegación:** React Navigation 6+ (stack, tabs, drawer)
- **Gestión de estado:** Zustand o Redux Toolkit
- **Mapas:** react-native-maps con Mapbox GL o Google Maps
- **Almacenamiento local:** AsyncStorage + WatermelonDB (para offline)
- **HTTP Client:** Axios o TanStack Query (React Query)
- **Formularios:** React Hook Form + Zod (validación)
- **UI Components:** NativeWind (Tailwind para RN) o Tamagui

#### Backend
- **Framework:** NestJS 10+ (Node.js 20+)
- **Lenguaje:** TypeScript 5+
- **Base de datos:** PostgreSQL 15+ con extensión PostGIS (consultas geoespaciales)
- **ORM:** Prisma o TypeORM
- **Caché:** Redis (Upstash o Railway Redis)
- **Autenticación:** Clerk, Auth0 o implementación propia con JWT
- **Validación:** class-validator + class-transformer
- **Documentación API:** Swagger/OpenAPI

#### Infraestructura
- **Hosting backend:** Railway, Render o AWS (ECS/Fargate)
- **Base de datos:** Supabase (PostgreSQL gestionado) o Railway PostgreSQL
- **CDN:** Cloudflare (DNS, caché, seguridad)
- **Almacenamiento imágenes:** Cloudflare Images o AWS S3 + CloudFront
- **CI/CD:** GitHub Actions (build, test, deploy automático)
- **Monitorización:** 
  - Errores: Sentry
  - Logs: Logtail o Datadog
  - Uptime: Uptime Kuma o Better Stack
  - Analytics: PostHog (auto-hosted) o Mixpanel

#### Servicios Externos
- **Mapas:** Mapbox GL (más personalizable, 50k cargas/mes gratis) o Google Maps Platform
- **Geocoding:** Mapbox Geocoding API o Google Geocoding API
- **Notificaciones push:** Firebase Cloud Messaging (Android) + APNs (iOS) o OneSignal
- **Emails transaccionales:** Resend, SendGrid o AWS SES
- **Pagos (fase 2):** Stripe (suscripciones, pagos únicos)
- **Moderación de imágenes:** Hive Moderation o AWS Rekognition

### 4.2 Diagrama de Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                      CLIENTES                               │
│  ┌─────────────────┐              ┌─────────────────────┐  │
│  │   App Móvil     │              │   Panel Admin Web   │  │
│  │  React Native   │              │     Next.js + TS    │  │
│  │     + Expo      │              │                     │  │
│  └────────┬────────┘              └──────────┬──────────┘  │
│           │                                   │             │
└───────────┼───────────────────────────────────┼─────────────┘
            │                                   │
            │ HTTPS/TLS 1.3                     │ HTTPS/TLS 1.3
            │                                   │
            ▼                                   ▼
┌─────────────────────────────────────────────────────────────┐
│                      API GATEWAY                            │
│              (Cloudflare / AWS API Gateway)                 │
│         - Rate limiting, WAF, caching, SSL termination      │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND (NestJS)                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ Auth Module  │  │ Cafés Module │  │  Routes Module   │  │
│  │              │  │              │  │                  │  │
│  │ - JWT        │  │ - CRUD       │  │ - CRUD           │  │
│  │ - OAuth      │  │ - Search     │  │ - Optimization   │  │
│  │ - Sessions   │  │ - Geospatial │  │ - Export         │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ Users Module │  │ CheckIn      │  │  Admin Module    │  │
│  │              │  │  Module      │  │                  │  │
│  │ - Profile    │  │ - CheckIn    │  │ - Verification   │  │
│  │ - Follows    │  │ - Reviews    │  │ - Moderation     │  │
│  │ - Stats      │  │ - Photos     │  │ - Reports        │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
└───────────────────────────┬─────────────────────────────────┘
                            │
            ┌───────────────┼───────────────┐
            │               │               │
            ▼               ▼               ▼
    ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
    │  PostgreSQL  │ │    Redis     │ │  Cloudflare  │
    │   + PostGIS  │ │    Cache     │ │    Images    │
    │              │ │              │ │              │
    │ - Cafés      │ │ - Sessions   │ │ - Fotos      │
    │ - Usuarios   │ │ - API Cache  │ │ - Avatares   │
    │ - Rutas      │ │ - Rate Limit │ │ - Thumbnails │
    │ - CheckIns   │ │              │ │              │
    └──────────────┘ └──────────────┘ └──────────────┘
```

### 4.3 Modelo de Datos (Entidades Principales)

```prisma
// Schema simplificado de Prisma

model User {
  id            String    @id @default(uuid())
  email         String    @unique
  name          String?
  avatarUrl     String?
  bio           String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  routes        Route[]
  checkIns      CheckIn[]
  follows       Follow[]  @relation("following")
  followers     Follow[]  @relation("follower")
  favorites     Favorite[]

  @@map("users")
}

model Café {
  id            String    @id @default(uuid())
  name          String
  slug          String    @unique
  address       String
  city          String
  country       String
  latitude      Float
  longitude     Float
  website       String?
  instagram     String?
  phone         String?

  openingHours  Json?     // { monday: {open: "08:00", close: "20:00"}, ... }
  roasters      String[]  // ["Nomad", "The Miners", "Satan's Coffee Corner"]
  brewMethods   String[]  // ["espresso", "pour-over", "cold-brew", "siphon"]
  equipment     Json?     // { machine: "La Marzocco", grinder: "Mahlkönig" }
  amenities     String[]  // ["wifi", "laptop-friendly", "outdoor-seating"]
  priceRange    String    // "€", "€€", "€€€"

  isVerified    Boolean   @default(false)
  verifiedAt    DateTime?
  verifiedBy    String?   // admin user id

  averageRating Float     @default(0)
  totalReviews  Int       @default(0)
  totalCheckIns Int       @default(0)

  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  checkIns      CheckIn[]
  favorites     Favorite[]

  @@index([latitude, longitude])
  @@index([city, country])
  @@map("cafes")
}

model Route {
  id            String    @id @default(uuid())
  name          String
  description   String?
  city          String
  country       String

  isPublic      Boolean   @default(false)
  totalDistance Float?    // km
  estimatedTime Int?      // minutos

  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  authorId      String
  author        User      @relation(fields: [authorId], references: [id])

  routeCafes    RouteCafé[]

  @@map("routes")
}

model RouteCafé {
  id            String    @id @default(uuid())
  order         Int
  notes         String?

  routeId       String
  route         Route     @relation(fields: [routeId], references: [id], onDelete: Cascade)

  caféId        String
  café          Café      @relation(fields: [caféId], references: [id])

  @@unique([routeId, caféId])
  @@map("route_cafes")
}

model CheckIn {
  id            String    @id @default(uuid())
  ratingCoffee  Int       // 1-5
  ratingService Int       // 1-5
  ratingAmbiance Int      // 1-5
  notes         String?
  photos        String[]  // URLs de Cloudflare Images
  brewMethods   String[]  // métodos probados
  pricePaid     Float?

  createdAt     DateTime  @default(now())

  userId        String
  user          User      @relation(fields: [userId], references: [id])

  caféId        String
  café          Café      @relation(fields: [caféId], references: [id])

  @@unique([userId, caféId, createdAt]) // un check-in por visita
  @@map("check_ins")
}

model Follow {
  id            String    @id @default(uuid())
  followerId    String
  followingId   String

  follower      User      @relation("following", fields: [followerId], references: [id])
  following     User      @relation("follower", fields: [followingId], references: [id])

  createdAt     DateTime  @default(now())

  @@unique([followerId, followingId])
  @@map("follows")
}

model Favorite {
  id            String    @id @default(uuid())

  userId        String
  user          User      @relation(fields: [userId], references: [id])

  caféId        String
  café          Café      @relation(fields: [caféId], references: [id])

  createdAt     DateTime  @default(now())

  @@unique([userId, caféId])
  @@map("favorites")
}
```

### 4.4 Endpoints de API (REST)

#### Autenticación
- `POST /api/v1/auth/signup` - Registro con email/password
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/google` - Login con Google OAuth
- `POST /api/v1/auth/apple` - Login con Apple Sign-In
- `POST /api/v1/auth/refresh` - Refresh token
- `POST /api/v1/auth/logout` - Logout

#### Cafés
- `GET /api/v1/cafes` - Listar cafés (con filtros: lat, lng, radius, brewMethods, roasters, etc.)
- `GET /api/v1/cafes/:id` - Obtener detalle de café
- `GET /api/v1/cafes/:id/reviews` - Obtener reseñas de café
- `POST /api/v1/cafes` - Proponer nuevo café (usuarios registrados)
- `PATCH /api/v1/cafes/:id` - Actualizar café (solo admin/propietario)
- `DELETE /api/v1/cafes/:id` - Eliminar café (solo admin)

#### Rutas
- `GET /api/v1/routes` - Listar rutas públicas (con filtros: city, author)
- `GET /api/v1/routes/:id` - Obtener detalle de ruta
- `POST /api/v1/routes` - Crear ruta (auth required)
- `PATCH /api/v1/routes/:id` - Actualizar ruta (solo autor)
- `DELETE /api/v1/routes/:id` - Eliminar ruta (solo autor)
- `POST /api/v1/routes/:id/duplicate` - Duplicar ruta pública (auth required)

#### Check-ins
- `POST /api/v1/checkins` - Crear check-in (auth required)
- `GET /api/v1/checkins/me` - Obtener check-ins del usuario actual
- `GET /api/v1/users/:userId/checkins` - Obtener check-ins públicos de usuario
- `PATCH /api/v1/checkins/:id` - Actualizar check-in (solo autor)
- `DELETE /api/v1/checkins/:id` - Eliminar check-in (solo autor)

#### Usuarios
- `GET /api/v1/users/:id` - Obtener perfil público de usuario
- `GET /api/v1/users/me` - Obtener perfil del usuario actual
- `PATCH /api/v1/users/me` - Actualizar perfil (auth required)
- `DELETE /api/v1/users/me` - Eliminar cuenta (auth required)
- `POST /api/v1/users/:userId/follow` - Seguir usuario (auth required)
- `DELETE /api/v1/users/:userId/follow` - Dejar de seguir (auth required)
- `GET /api/v1/users/:userId/followers` - Obtener seguidores
- `GET /api/v1/users/:userId/following` - Obtuer seguidos

#### Admin (panel web)
- `GET /api/v1/admin/cafes/pending` - Listar cafés pendientes de verificación
- `PATCH /api/v1/admin/cafes/:id/verify` - Verificar café
- `PATCH /api/v1/admin/cafes/:id/reject` - Rechazar café
- `GET /api/v1/admin/reports` - Listar reportes de contenido
- `PATCH /api/v1/admin/reports/:id` - Resolver reporte

---

## 5. Plan de Desarrollo

### 5.1 Fase MVP (Semanas 1-10)

**Objetivo:** Lanzar app funcional en iOS y Android con características core.

#### Semana 1-2: Setup y Fundación
- [ ] Configurar proyecto Expo + TypeScript
- [ ] Configurar backend NestJS + PostgreSQL + Prisma
- [ ] Implementar autenticación (email/password, Google, Apple)
- [ ] Configurar CI/CD con GitHub Actions
- [ ] Configurar Sentry para errores

#### Semana 3-4: Módulo de Cafés
- [ ] Modelo de datos Café con PostGIS
- [ ] Endpoint GET /cafes con filtros geoespaciales
- [ ] Pantalla de mapa con marcadores de cafés
- [ ] Pantalla de lista de cafés
- [ ] Ficha detallada de café

#### Semana 5-6: Módulo de Rutas
- [ ] Modelo de datos Route + RouteCafé
- [ ] Algoritmo de optimización de ruta (TSP simplificado)
- [ ] Pantalla de creación de ruta (añadir/eliminar cafés)
- [ ] Pantalla de detalle de ruta
- [ ] Guardado de rutas en perfil
- [ ] Exportar ruta a Google Maps / Apple Maps

#### Semana 7-8: Check-ins y Valoraciones
- [ ] Modelo de datos CheckIn
- [ ] Endpoint POST /checkins
- [ ] Pantalla de check-in con valoración 3 dimensiones
- [ ] Subida de fotos a Cloudflare Images
- [ ] Actualización de averageRating en Café
- [ ] Pantalla de perfil de usuario con estadísticas

#### Semana 9-10: Offline y Pulido
- [ ] Implementar almacenamiento local con WatermelonDB
- [ ] Sync automático al recuperar conexión
- [ ] Panel de administración web básico (verificar cafés)
- [ ] Tests E2E con Detox
- [ ] Beta cerrada con 20-30 usuarios
- [ ] Iterar basado en feedback

**Entregable MVP:** App publicada en TestFlight (iOS) y Google Play Beta (Android).

---

### 5.2 Fase v2 (Semanas 11-16)

**Objetivo:** Añadir características sociales y de engagement.

- [ ] Sistema de follow entre usuarios
- [ ] Feed de actividad (check-ins y rutas de usuarios seguidos)
- [ ] Lista de favoritos
- [ ] Notificaciones push (nuevo seguidor, café en ruta cambió horario)
- [ ] Compartir ruta por enlace público (web responsive)
- [ ] Reportar información incorrecta
- [ ] Modo oscuro
- [ ] Soporte multi-idioma (ES/EN)
- [ ] Web app pública para rutas compartidas (Next.js + SEO)

**Entregable v2:** App 1.0 publicada en App Store y Play Store.

---

### 5.3 Fase v3 (Post-lanzamiento)

**Objetivo:** Monetización y crecimiento.

- [ ] Suscripción premium (rutas ilimitadas, filtros avanzados, sin anuncios)
- [ ] Integración con Stripe para pagos
- [ ] Reclamación de ficha por propietarios de cafés
- [ ] Programa de embajadores (usuarios top con beneficios)
- [ ] Integración con calendario para planificar visitas
- [ ] Gamificación avanzada (badges, niveles, Coffee Miles)
- [ ] API pública para desarrolladores (fase futura)

---

## 6. Estrategia de Monetización

### 6.1 Modelo Freemium

**Gratis:**
- Búsqueda ilimitada de cafés.
- Crear hasta 3 rutas activas.
- Check-ins y valoraciones ilimitados.
- Seguir usuarios y ver feed.

**Premium (3.99€/mes o 29.99€/año):**
- Rutas ilimitadas.
- Filtros avanzados (por tostador específico, equipamiento).
- Exportar rutas a GPX/KML.
- Modo offline completo (mapas cacheados).
- Sin anuncios.
- Soporte prioritario.

### 6.2 Otras Fuentes de Ingreso

- **Afiliación:** Comisión por reservas de hoteles cercanos a cafés (Booking.com API).
- **Patrocinios:** Cafés destacados en búsquedas (marcado como "Patrocinado").
- **B2B:** Licencia de API para otras apps o webs de turismo.
- **Merchandising:** Venta de productos de café (tazas, granos) con marca CoffeeRoute.

---

## 7. Métricas de Éxito (KPIs)

### 7.1 Métricas de Producto

| Métrica | Objetivo MVP (3 meses) | Objetivo Año 1 |
|---------|------------------------|----------------|
| Usuarios registrados | 1,000 | 25,000 |
| Usuarios activos mensuales (MAU) | 400 | 10,000 |
| Retención D30 | 25% | 40% |
| Cafés en base de datos | 500 | 10,000 |
| Rutas creadas | 200 | 5,000 |
| Check-ins totales | 1,000 | 50,000 |
| Suscriptores premium | 0 | 500 (2% de MAU) |
| Rating en App Store | 4.5+ | 4.7+ |

### 7.2 Métricas Técnicas

| Métrica | Objetivo |
|---------|----------|
| Uptime | > 99.5% |
| Tiempo de respuesta API (p95) | < 300 ms |
| Crash-free sessions | > 99.8% |
| Tamaño de app | < 100 MB |
| Tiempo de carga inicial | < 2 s |

---

## 8. Riesgos y Mitigación

| Riesgo | Impacto | Probabilidad | Mitigación |
|--------|---------|--------------|------------|
| Pocos cafés verificados al inicio | Alto | Media | Curación manual inicial, partnerships con asociaciones de café de especialidad |
| Competencia de apps establecidas (Beany, Roasters) | Medio | Alta | Diferenciación por rutas (no solo mapa), enfoque en mercado hispanohablante |
| Dificultad para monetizar | Alto | Media | Validar willingness-to-pay en beta, ajustar pricing según feedback |
| Problemas de escalabilidad con mapas | Medio | Baja | Usar Mapbox con caché agresivo, limitar resultados por defecto |
| Usuarios no crean contenido (check-ins) | Alto | Media | Gamificación desde MVP, notificaciones push para recordar |
| Cafés cierran o cambian información | Medio | Alta | Sistema de reportes de usuarios, verificación periódica |

---

## 9. Decisiones Técnicas (ADRs)

### ADR-001: React Native + Expo vs Flutter

**Decisión:** React Native + Expo

**Razones:**
- Mayor familiaridad del equipo con JavaScript/TypeScript.
- Ecosistema más maduro para integración con servicios web.
- Expo facilita despliegue y actualizaciones OTA.
- Compartir código con futura web app (Next.js) es más natural.

### ADR-002: Mapbox vs Google Maps

**Decisión:** Mapbox GL

**Razones:**
- Más personalizable (estilos de mapa custom).
- Pricing más favorable (50k cargas/mes gratis vs 28k de Google).
- Mejor soporte para mapas offline.
- Menor dependencia de Google.

### ADR-003: PostgreSQL + PostGIS vs MongoDB

**Decisión:** PostgreSQL + PostGIS

**Razones:**
- Consultas geoespaciales nativas y optimizadas.
- Relaciones complejas (usuarios, rutas, cafés, check-ins) se modelan mejor en SQL.
- ACID compliance para transacciones críticas.
- PostGIS es estándar de industria para location-based services.

### ADR-004: NestJS vs Express directo

**Decisión:** NestJS

**Razones:**
- Arquitectura modular y opinada facilita mantenimiento.
- Inyección de dependencias nativa.
- Integración con TypeScript es excelente.
- Swagger automático para documentación de API.

---

## 10. Próximos Pasos

1. **Revisar este documento** con stakeholders y ajustar requisitos.
2. **Priorizar features** para MVP (MoSCoW: Must, Should, Could, Won't).
3. **Crear wireframes** de pantallas principales (Figma).
4. **Configurar repositorios** (GitHub: frontend móvil, backend, admin web).
5. **Comenzar desarrollo** siguiendo roadmap de Fase MVP.
6. **Reclutar beta testers** (foros de café de especialidad, Reddit r/coffee).

---

## Anexos

### A. Glosario

- **Café de especialidad:** Café con puntuación 80+ en escala SCA, tostado por tostadores artesanales.
- **Brew methods:** Métodos de preparación (espresso, pour-over, French press, cold brew, siphon, etc.).
- **Check-in:** Registro de visita a un café con valoración y opcionalmente fotos/notas.
- **TSP (Traveling Salesman Problem):** Problema de optimización de ruta más corta visitando múltiples puntos.

### B. Referencias

- Beany App: https://beany.app/
- Roasters App: https://apps.apple.com/us/app/roasters-great-coffee-inside/id1466079049
- Mapbox Pricing: https://www.mapbox.com/pricing
- Expo Documentation: https://docs.expo.dev/
- NestJS Documentation: https://docs.nestjs.com/

---

**Fin del documento**

Última actualización: Octubre 2026
