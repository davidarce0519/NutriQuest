# 🥗 NutriQuest

> Aplicación móvil de sugerencias nutricionales para estudiantes universitarios, construida con React Native, Expo SDK 54 y Supabase. Gamificación empática, realidad aumentada y cero penalizaciones.

---

## 📋 Tabla de Contenido

- [Descripción](#-descripción)
- [Stack Tecnológico](#-stack-tecnológico)
- [Arquitectura](#-arquitectura)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Base de Datos](#-base-de-datos)
- [Requisitos Previos](#-requisitos-previos)
- [Instalación y Ejecución Local](#-instalación-y-ejecución-local)
- [Variables de Entorno](#-variables-de-entorno)
- [Generación del APK](#-generación-del-apk)
- [Módulos Principales](#-módulos-principales)
- [Algoritmos Clave](#-algoritmos-clave)
- [Equipo](#-equipo)

---

## 📱 Descripción

NutriQuest es un Sistema Multimedia Mínimo Viable (SMMV) diseñado para fomentar hábitos alimenticios saludables en estudiantes de la Universidad Autónoma de Occidente (UAO). El sistema presenta sugerencias alimenticias personalizadas mediante un sistema de swipe, un avatar evolutivo no punitivo que crece con cada decisión saludable, y un módulo de Realidad Aumentada en Unity para visualizar batidos en 3D.

**Principio central:** el sistema nunca penaliza. El progreso del usuario nunca retrocede.

**APKs disponibles para descarga:** https://parrenson.github.io/nutriquest_web/

---

## 🛠 Stack Tecnológico

| Categoría | Tecnología | Versión |
|-----------|-----------|---------|
| Framework móvil | React Native + Expo | SDK 54 |
| Lenguaje | TypeScript | 5.x |
| Backend / BaaS | Supabase (PostgreSQL + RLS) | latest |
| Estado global | Zustand | 4.x |
| Queries asíncronas | TanStack React Query | 5.x |
| Animaciones | React Native Animated API | built-in |
| Swipe UI | react-native-deck-swiper | 2.x |
| Navegación | Expo Router | 3.x |
| Build / Deploy | EAS Build (Expo Application Services) | latest |
| Módulo AR | Unity 6 LTS (proyecto separado) | 6.x |

---

## 🏗 Arquitectura

NutriQuest implementa una **Arquitectura en Capas** con cuatro niveles de abstracción. Esta estructura garantiza separación de responsabilidades, testabilidad y escalabilidad independiente de cada módulo.

```
src/
├── data/           # Capa de datos
├── domain/         # Capa de dominio
├── infrastructure/ # Capa de infraestructura
└── presentation/   # Capa de presentación
```

### Capas

**`data/`** — Repositorios y cliente Supabase. Toda la comunicación con la base de datos ocurre aquí. Implementa el patrón Repository para desacoplar el origen de datos del resto del sistema.

**`domain/`** — Modelos de negocio y casos de uso (Use Cases). Contiene la lógica pura de la aplicación sin dependencias externas. Ejemplos: `generateMultipleSuggestionsUseCase`, `updateAvatarProgressUseCase`.

**`infrastructure/`** — Stores de Zustand, configuración del tema (claro/oscuro), servicios cross-cutting. No depende de la capa de presentación.

**`presentation/`** — Pantallas (screens), componentes UI y navegación, organizadas por rol de usuario (`student/`, `nutritionist/`, `admin/`).

---

## 📁 Estructura del Proyecto

```
nutriquest/
├── app/                          # Expo Router — rutas y navegación
│   ├── (auth)/                   # Grupo de rutas: autenticación
│   │   ├── login.tsx
│   │   └── register.tsx
│   ├── (student)/                # Grupo de rutas: estudiante
│   │   ├── home.tsx
│   │   ├── suggestions.tsx
│   │   ├── progress.tsx
│   │   ├── history.tsx
│   │   └── profile.tsx
│   ├── (nutritionist)/           # Grupo de rutas: nutricionista
│   └── _layout.tsx
│
├── src/
│   ├── data/
│   │   ├── repositories/
│   │   │   ├── SuggestionRepository.ts
│   │   │   ├── UserRepository.ts
│   │   │   ├── FoodRepository.ts
│   │   │   └── ProgressRepository.ts
│   │   └── supabaseClient.ts
│   │
│   ├── domain/
│   │   ├── models/
│   │   │   ├── User.ts
│   │   │   ├── Food.ts
│   │   │   ├── Suggestion.ts
│   │   │   └── AvatarProgress.ts
│   │   └── usecases/
│   │       ├── generateMultipleSuggestionsUseCase.ts
│   │       ├── updateAvatarProgressUseCase.ts
│   │       ├── getUserRestrictionsUseCase.ts
│   │       └── recordDecisionUseCase.ts
│   │
│   ├── infrastructure/
│   │   ├── stores/
│   │   │   ├── authStore.ts        # Zustand: sesión de usuario
│   │   │   ├── suggestionStore.ts  # Zustand: estado de sugerencias
│   │   │   └── themeStore.ts       # Zustand: modo claro/oscuro
│   │   └── theme/
│   │       ├── lightTheme.ts
│   │       └── darkTheme.ts
│   │
│   └── presentation/
│       ├── components/
│       │   ├── SuggestionCard.tsx
│       │   ├── AvatarDisplay.tsx
│       │   ├── ProgressBar.tsx
│       │   └── ReflectiveMessage.tsx
│       └── hooks/
│           ├── useSuggestions.ts
│           ├── useAvatarProgress.ts
│           └── useDarkModeAuto.ts
│
├── assets/
│   ├── avatars/                  # Imágenes SVG/PNG del avatar (4 niveles)
│   └── foods/                   # Imágenes de alimentos
│
├── supabase/
│   └── functions/
│       └── delete-account/       # Edge Function para eliminación de cuenta
│
├── app.json
├── eas.json
├── .env.local                    # Variables de entorno (no se sube al repo)
└── tsconfig.json
```

---

## 🗄 Base de Datos

Supabase con PostgreSQL. Todas las tablas tienen Row Level Security (RLS) habilitado. El control de acceso por rol se gestiona mediante la función `get_my_role()` con el atributo `SECURITY DEFINER`.

### Tablas principales

| Tabla | Descripción |
|-------|-------------|
| `profiles` | Datos de usuario: nombre, rol, biometría (peso, talla, IMC) |
| `foods` | Catálogo de alimentos con macros, categoría y estado de validación |
| `suggestions` | Sugerencias generadas por sesión |
| `decisions` | Registro de cada swipe (aceptado / descartado) |
| `user_restrictions` | Alergias, intolerancias y preferencias del usuario |
| `avatar_progress` | Nivel actual y contador de decisiones saludables acumuladas |
| `history_entries` | Entradas del historial semanal |
| `nutritionist_validations` | Aval del nutricionista por alimento |

> El esquema completo con políticas RLS y migraciones está disponible en el panel de Supabase del proyecto.

---

## ✅ Requisitos Previos

- **Node.js** >= 18.x
- **npm** >= 9.x o **yarn** >= 1.22
- **Expo CLI** instalado globalmente
- **EAS CLI** instalado globalmente (para builds)
- Cuenta en [Supabase](https://supabase.com) con proyecto configurado
- Android Studio o dispositivo físico Android para pruebas

```bash
npm install -g expo-cli eas-cli
```

---

## 🚀 Instalación y Ejecución Local

```bash
# 1. Clonar el repositorio
git clone https://github.com/davidarce0519/NutriQuest.git
cd NutriQuest

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus credenciales de Supabase

# 4. Iniciar el servidor de desarrollo
npx expo start

# 5. Abrir en dispositivo / emulador
# Escanear el QR con la app Expo Go (Android/iOS)
# o presionar 'a' para abrir en emulador Android
```

---

## 🔑 Variables de Entorno

Crear el archivo `.env.local` en la raíz del proyecto con las siguientes variables:

```env
EXPO_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key-publica
```

> Las variables prefijadas con `EXPO_PUBLIC_` son accesibles en el cliente. Nunca incluir la `service_role` key en el cliente.

---

## 📦 Generación del APK

NutriQuest utiliza **EAS Build** para compilar los binarios de producción.

```bash
# Instalar EAS CLI si no está instalado
npm install -g eas-cli

# Autenticarse en Expo
eas login

# Configurar el proyecto (solo primera vez)
eas build:configure

# Generar APK para Android (perfil preview)
eas build --platform android --profile preview

# Generar APK para distribución interna
eas build --platform android --profile development
```

El archivo `eas.json` contiene los perfiles de build. El APK generado estará disponible en el dashboard de Expo para descarga directa.

---

## 🧩 Módulos Principales

### Módulo de Sugerencias (`suggestions.tsx`)

Pantalla central de la app. Implementa una interfaz de swipe estilo Tinder usando `react-native-deck-swiper`. El sistema genera hasta 3 sugerencias por sesión aplicando el caso de uso `generateMultipleSuggestionsUseCase`.

- **Swipe derecha** → decisión aceptada, microanimación de confirmación
- **Swipe izquierda** → sugerencia descartada sin penalización
- Las restricciones activas del usuario se muestran como recordatorio visual al iniciar

### Módulo de Progreso (`progress.tsx`)

Muestra el avatar evolutivo con 4 etapas visuales diferenciadas:

| Nivel | Nombre | Decisiones requeridas |
|-------|--------|----------------------|
| 1 | 🌱 Semilla | 0 |
| 2 | 🌿 Brote | 10 |
| 3 | 🪴 Planta | 25 |
| 4 | 🌳 Árbol | 50 |

El avatar **nunca retrocede**. Incluye barra de progreso animada y contador de decisiones restantes para el siguiente nivel.

### Módulo de Historial (`history.tsx`)

Panel analítico que muestra máximo **3 métricas simultáneas** para evitar sobrecarga cognitiva. Sin puntajes, calificaciones numéricas ni comparaciones externas. Los mensajes reflexivos usan lenguaje de primera persona.

### Módulo de Perfil (`profile.tsx`)

- Datos biométricos: peso, talla, cálculo automático de IMC
- Preferencias alimentarias organizadas en 4 categorías: Alergias, Intolerancias, Preferencias y Restricciones
- Configuración: modo oscuro automático, notificaciones

### Modo Oscuro Automático

Se activa automáticamente entre las **7:00 p.m. y las 6:00 a.m.** según la hora del dispositivo, implementado en `useDarkModeAuto.ts`. Cumple con la norma de accesibilidad WCAG AA para contraste.

---

## ⚙️ Algoritmos Clave

### Fisher-Yates con Relajación Progresiva de Filtros

Ubicado en `generateMultipleSuggestionsUseCase.ts`. Genera sugerencias respetando las restricciones activas del usuario. Si no hay suficientes alimentos que cumplan todos los filtros, el algoritmo relaja progresivamente los criterios para garantizar siempre al menos una sugerencia disponible.

```
1. Obtener alimentos validados por nutricionista
2. Filtrar por restricciones activas del usuario
3. Si resultado < 3 → relajar filtros en orden de prioridad
4. Aplicar Fisher-Yates shuffle al conjunto filtrado
5. Retornar las primeras N sugerencias
```

### Sistema No Punitivo

La función `recordDecisionUseCase` registra cada decisión pero el contador de `avatar_progress.healthy_decisions` **solo se incrementa** cuando `decision_type = 'accepted'`. Nunca se decrementa. Las decisiones de descarte se almacenan en `decisions` pero no afectan el progreso.


## 📄 Licencia

Proyecto académico — Universidad Autónoma de Occidente. Todos los derechos reservados.