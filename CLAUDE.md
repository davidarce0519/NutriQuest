# NUTRIQUEST — Contexto para Claude Code

## 1. DESCRIPCIÓN DEL PROYECTO

NutriQuest es una **aplicación móvil nativa** (React Native + Expo) de sugerencias nutricionales para estudiantes universitarios. Conecta con **Supabase** como backend (auth, base de datos, RLS). Es un proyecto universitario con intención de producción real.

---

## 2. STACK TECNOLÓGICO

| Capa | Tecnología |
|---|---|
| Mobile | React Native + Expo SDK 54 |
| Lenguaje | TypeScript estricto |
| Navegación | React Navigation v7 (stack + bottom tabs) |
| Estado global | Zustand |
| Servidor | Supabase (PostgreSQL + Auth + RLS) |
| Queries | Direct Supabase client (no React Query aún) |
| Animaciones | react-native-reanimated 3.x |
| Gestos | react-native-gesture-handler |
| Swipe cards | react-native-deck-swiper |
| Safe area | react-native-safe-area-context |
| Notificaciones | expo-notifications |
| Almacenamiento seguro | expo-secure-store |
| Package manager | yarn |

---

## 3. ARQUITECTURA POR CAPAS (OBLIGATORIA)

```
src/
├── presentation/          ← CAPA 1: UI pura
│   ├── screens/
│   │   ├── auth/          LoginScreen, RegisterScreen
│   │   ├── student/       HomeScreen, SuggestionScreen, ProgressScreen,
│   │   │                  HistoryScreen, ProfileScreen
│   │   ├── nutritionist/  FoodCatalogScreen, StudentListScreen
│   │   └── admin/         UsersScreen, AnalyticsScreen
│   ├── components/
│   │   ├── common/        Componentes reutilizables (Button, Input, Card...)
│   │   ├── suggestion/    Cards de sugerencias
│   │   ├── avatar/        Avatar y barras de progreso
│   │   └── charts/        Gráficas del historial
│   └── navigation/
│       ├── AppNavigator.tsx      Raíz — decide stack según rol
│       ├── AuthNavigator.tsx     Login, Register
│       ├── StudentNavigator.tsx  Tabs del estudiante (custom tab bar)
│       ├── NutritionistNavigator.tsx
│       └── AdminNavigator.tsx
│
├── domain/                ← CAPA 2: lógica de negocio pura
│   ├── models/index.ts    Todos los tipos e interfaces TypeScript
│   └── usecases/
│       ├── auth/index.ts
│       ├── suggestion/index.ts
│       ├── health/index.ts
│       └── avatar/index.ts
│
├── data/                  ← CAPA 3: acceso a datos
│   ├── supabase/supabaseClient.ts
│   ├── repositories/
│   │   ├── authRepository.ts
│   │   ├── foodRepository.ts
│   │   ├── suggestionRepository.ts
│   │   ├── healthRepository.ts
│   │   └── avatarRepository.ts
│   └── mappers/
│       └── foodMapper.ts
│
└── infrastructure/        ← CAPA 4: servicios externos y configuración
    ├── config/env.ts
    ├── notifications/notificationService.ts
    ├── storage/secureStorage.ts
    ├── stores/
    │   ├── authStore.ts
    │   └── healthStore.ts
    └── theme/
        ├── colors.ts
        ├── typography.ts
        ├── spacing.ts
        ├── darkMode.ts
        └── index.ts
```

### REGLA DE DEPENDENCIAS (no violar nunca):
```
presentation → domain ← data ← infrastructure
```
- `presentation` importa de `domain/usecases` y `infrastructure/stores`
- `domain/usecases` importa de `data/repositories`
- `data/repositories` importa de `data/supabase`
- **NUNCA** `domain` importa de `presentation`
- **NUNCA** `presentation` importa directamente de `data/repositories`

---

## 4. PALETA DE COLORES (usar siempre estas constantes)

```ts
const GREEN       = '#1a6b0a';   // Verde principal NutriQuest
const GREEN_DARK  = '#042901';   // Verde oscuro (botones, avatar)
const GREEN_LIGHT = '#c1d9b7';   // Verde claro (textos sobre verde)
const BG          = '#f5f5f0';   // Fondo crema claro
const WHITE       = '#ffffff';

// Semánticos
const SUCCESS = '#22c55e';
const WARNING = '#eab308';
const DANGER  = '#ef4444';
const INFO    = '#38bdf8';

// Energía (nivel 1-5)
const ENERGY_COLORS = ['', '#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e'];
```

---

## 5. PATRÓN VISUAL DE PANTALLAS (consistencia obligatoria)

Todas las pantallas del estudiante siguen este patrón:

```tsx
<View style={{ flex: 1, backgroundColor: BG }}>
  {/* Franja verde superior curva */}
  <View style={{
    position: 'absolute', top: 0, left: 0, right: 0,
    height: 180, backgroundColor: GREEN,
    borderBottomLeftRadius: 40, borderBottomRightRadius: 40,
  }} />

  <SafeAreaView style={{ flex: 1 }}>
    {/* Header sobre la franja verde */}
    <View style={{ paddingHorizontal: 18, paddingTop: 10 }}>
      <Text style={{ color: GREEN_LIGHT, fontSize: 12, fontWeight: '600' }}>
        Subtítulo
      </Text>
      <Text style={{ color: WHITE, fontSize: 28, fontWeight: '900' }}>
        Título principal
      </Text>
    </View>

    {/* Contenido en cards blancas sobre fondo crema */}
    <ScrollView contentContainerStyle={{ padding: 18, gap: 14 }}>
      <View style={{
        backgroundColor: WHITE,
        borderRadius: 24,
        padding: 18,
        elevation: 4,
      }}>
        {/* Contenido */}
      </View>
    </ScrollView>
  </SafeAreaView>
</View>
```

---

## 6. MODELOS DE DATOS PRINCIPALES

```ts
// Roles disponibles
type UserRole = 'estudiante' | 'nutricionista' | 'superadmin';

// Perfil de usuario
interface User {
  id: string; fullName: string; email: string; role: UserRole;
  notificationsPaused: boolean; dataConsent: boolean; isActive: boolean;
}

// Perfil de salud
interface HealthProfile {
  userId: string; heightCm?: number; weightKg?: number;
  bmi?: number; bmiCategory?: 'Bajo peso'|'Normal'|'Sobrepeso'|'Obesidad';
  nutritionalGoal?: NutritionalGoal; dietType?: DietType;
  physicalActivityLevel?: PhysicalActivityLevel;
  currentSemester?: number; avgSleepHours?: number; dailyWaterGlasses?: number;
}

// Alimento
interface Food {
  id: string; name: string; description?: string;
  nutritionalBenefits?: string; prepTimeMinutes?: number;
  energyLevel?: number; // 1-5
  imageUrl?: string; isQuick: boolean; ingredientsSummary?: string;
  caloriesKcal?: number; proteinG?: number; carbsG?: number; fatG?: number;
  bestForGoal?: string[]; suitableDietTypes?: string[];
  validatorName?: string; validatedAt?: string;
}

// Sugerencia
interface Suggestion {
  id: string; userId: string; food: Food;
  suggestedAt: string; isExamPeriod: boolean;
  response: 'aceptada' | 'descartada' | 'sin_respuesta';
  feedback?: 'me_gusta' | 'no_me_gusta' | 'no_aplica';
  emotionalMessage?: string;
}

// Progreso del avatar
interface AvatarProgress {
  userId: string; currentLevel: number;
  totalHealthyDecisions: number; activeStreakDays: number;
}
```

---

## 7. TABLAS SUPABASE PRINCIPALES

```
profiles              → usuarios extendidos (rol, consentimiento)
health_profiles       → datos biométricos del estudiante
health_measurements   → historial de mediciones
food_preferences      → alergias, intolerancias, preferencias, restricciones
foods                 → catálogo de alimentos validados
food_restrictions     → ingredientes que excluyen un alimento por categoría
suggestions           → sugerencias generadas y su respuesta
avatar_progress       → nivel y decisiones del avatar
avatar_levels         → configuración de niveles (4 niveles: Semilla→Árbol)
avatar_level_history  → registro de subidas de nivel
weekly_summaries      → resúmenes calculados por semana
notification_settings → configuración de notificaciones y modo oscuro
system_config         → configuración global (solo superadmin)
audit_log             → registro de acciones administrativas
```

**RLS activo en todas las tablas.** Los estudiantes solo ven sus propios datos. Los nutricionistas ven datos de estudiantes. El superadmin ve todo.

---

## 8. STORES DE ZUSTAND

```ts
// authStore — usuario autenticado
useAuthStore: {
  user: User | null;
  isLoading: boolean;
  isHydrated: boolean;
  setUser(user): void;
  setLoading(v): void;
  setHydrated(v): void;
  clear(): void;  // llamar al hacer logout
}

// healthStore — perfil de salud en memoria
useHealthStore: {
  profile: HealthProfile | null;
  measurements: HealthMeasurement[];
  setProfile(p): void;
  setMeasurements(m): void;
  addMeasurement(m): void;
  clear(): void;  // llamar al hacer logout
}
```

---

## 9. NAVEGACIÓN Y ROLES

```
AppNavigator
├── AuthNavigator (si !user)
│   ├── LoginScreen
│   └── RegisterScreen
├── StudentNavigator (si role === 'estudiante')
│   ├── Inicio       → HomeScreen
│   ├── Sugerencia   → SuggestionScreen
│   ├── Progreso     → ProgressScreen
│   ├── Historial    → HistoryScreen
│   └── Perfil       → ProfileScreen
├── NutritionistNavigator (si role === 'nutricionista')
│   ├── Catalogo     → FoodCatalogScreen
│   └── Estudiantes  → StudentListScreen
└── AdminNavigator (si role === 'superadmin')
    ├── Usuarios     → UsersScreen
    └── Analytics    → AnalyticsScreen
```

El `StudentNavigator` tiene un **custom tab bar** con:
- Fondo blanco, wrapper crema `#f5f5f0`
- Indicador verde superior en tab activo
- Fondo verde suave `GREEN + '18'` en ícono activo
- `useSafeAreaInsets()` para el padding inferior

---

## 10. REGLAS DE CLEAN CODE (no negociables)

### Nombrado
- Componentes: `PascalCase` — `SuggestionScreen`, `FoodCard`
- Funciones/variables: `camelCase` — `handleSwipeRight`, `loadCards`
- Constantes de color: `UPPER_SNAKE_CASE` — `GREEN_DARK`, `BG`
- Archivos de pantalla: `NombreScreen.tsx`
- Archivos de repositorio: `nombreRepository.ts`
- Archivos de use case: `index.ts` dentro de su carpeta

### TypeScript
- **Sin `any`** excepto cuando venga de Supabase (mapear inmediatamente)
- Todos los props de componentes con interfaz explícita
- Los mappers en `data/mappers/` convierten snake_case de BD a camelCase de modelos
- No usar `as` para forzar tipos sin validación

### Estructura de archivos
- **Un componente por archivo**
- Estilos siempre al final del archivo con `StyleSheet.create`
- Constantes de color al inicio del archivo (no importar desde theme si es pantalla simple)
- Importaciones en orden: React → RN → terceros → internos

### Componentes
- Sin lógica de negocio en pantallas — delegar a use cases
- Sin llamadas directas a Supabase desde pantallas — usar repositorios
- Los `useEffect` siempre con cleanup cuando corresponda
- `try/catch` en todas las operaciones async con `Alert.alert` amigable

### Estilos
- `StyleSheet.create` siempre, nunca estilos inline complejos
- Variable `s` para el StyleSheet (convención del proyecto)
- `BorderRadius.full` para pills/círculos
- `useSafeAreaInsets()` para padding dinámico del footer

---

## 11. PATRÓN DE REPOSITORIO

```ts
// Siempre este patrón en los repositories
export const nombreRepository = {
  async getXxx(param: string): Promise<Modelo> {
    const { data, error } = await supabase
      .from('tabla')
      .select('*')
      .eq('columna', param)
      .single();
    if (error) throw error;
    return mapModelo(data);  // siempre mapear
  },
};

// Mapper separado (data/mappers/ o inline en el repo)
const mapModelo = (d: any): Modelo => ({
  id:        d.id,
  userId:    d.user_id,  // snake_case → camelCase
  createdAt: d.created_at,
});
```

---

## 12. PATRÓN DE USE CASE

```ts
// src/domain/usecases/xxx/index.ts
import { xxxRepository } from '../../../data/repositories/xxxRepository';

export const hacerAlgoUseCase = async (param: string): Promise<Resultado> => {
  // Validación de negocio aquí
  if (!param) throw new Error('Parámetro requerido');

  // Delegar al repositorio
  return xxxRepository.hacerAlgo(param);
};
```

---

## 13. PATRÓN DE PANTALLA

```tsx
// src/presentation/screens/student/XxxScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../../infrastructure/stores/authStore';
// imports de use cases, NO de repositories directamente

const GREEN      = '#1a6b0a';
const GREEN_DARK = '#042901';
const BG         = '#f5f5f0';
const WHITE      = '#ffffff';

export const XxxScreen = () => {
  const user = useAuthStore((s) => s.user);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    xxxUseCase(user.id)
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  return (
    <View style={s.container}>
      <View style={s.topStrip} />
      <SafeAreaView style={s.safe}>
        {/* contenido */}
      </SafeAreaView>
    </View>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  topStrip: {
    position: 'absolute', top: 0, left: 0, right: 0,
    height: 180, backgroundColor: GREEN,
    borderBottomLeftRadius: 40, borderBottomRightRadius: 40,
  },
  safe: { flex: 1 },
});
```

---

## 14. HUs PENDIENTES DE IMPLEMENTAR (prioridad)

### Sprint 4 — Por hacer
| HU | Título | Archivo principal |
|---|---|---|
| HU_1.1 | Notificaciones push | `infrastructure/notifications/notificationService.ts` |
| HU_1.2 | Modo oscuro automático 7pm-6am | `infrastructure/theme/darkMode.ts` + `AppNavigator` |
| HU_2.3.1 | Eliminar datos del usuario | `data/repositories/authRepository.ts` |
| HU_2.4.1 | Pausar notificaciones | `ProfileScreen` + `notification_settings` |
| HU_2.5 | Aprendizaje adaptativo | `domain/usecases/suggestion/index.ts` |
| HU_3.1.2 | Animación subida de nivel | `ProgressScreen` |
| HU_3.2 | Microanimaciones de refuerzo | `SuggestionScreen` |
| HU_4.3 | Estados de carga y error | Todas las pantallas |
| HU_5.1 | Panel catálogo nutricionista | `FoodCatalogScreen` |
| HU_6.1 | Gráfica historial semanal | `HistoryScreen` |
| HU_6.3.2 | Mensaje reflexivo dinámico | `HistoryScreen` |
| HU_6.4 | Patrones acumulados | `HistoryScreen` |

### HUs parcialmente implementadas (completar)
| HU | Falta |
|---|---|
| HU_2.2 | UI de horarios de estudio y períodos de parciales |
| HU_3.3 | Verificar trigger Supabase no penaliza |
| HU_4.2 | Indicadores de energía con colores semánticos |
| HU_5.2.2 | Bloqueo por condiciones médicas |

---

## 15. COMANDOS ÚTILES

```bash
# Iniciar el proyecto
yarn start --clear

# Instalar dependencia nueva (siempre con npx expo install para compatibilidad)
npx expo install nombre-paquete

# Si es paquete sin versión Expo específica
yarn add nombre-paquete
```

---

## 16. VARIABLES DE ENTORNO

En `app.config.ts` (no en `.env` directamente — Expo lo lee desde extra):
```ts
extra: {
  supabaseUrl:     process.env.SUPABASE_URL,
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
}
```

Acceder desde código:
```ts
import { ENV } from '../infrastructure/config/env';
// ENV.SUPABASE_URL, ENV.SUPABASE_ANON_KEY
```

---

## 17. CONSIDERACIONES IMPORTANTES

1. **Nunca usar `localStorage` o `AsyncStorage`** para la sesión — usar `expo-secure-store` via `secureStorage.ts`
2. **El trigger `handle_new_user`** en Supabase crea automáticamente el perfil, health_profile, avatar_progress y notification_settings al registrarse
3. **El trigger `on_suggestion_response`** suma +1 a `total_healthy_decisions` cuando `response = 'aceptada'`
4. **RLS siempre activo** — no usar `service_role` key en el cliente
5. **`useSafeAreaInsets()`** para footer dinámico, nunca `paddingBottom` fijo
6. **Borrar `package-lock.json`** si aparece — el proyecto usa `yarn`
7. **`react-native-reanimated` versión 3.x** — no actualizar a 4.x (requiere `react-native-worklets`)
8. **Imágenes de alimentos** usan URLs externas de Unsplash — no assets locales
9. **El logout** siempre llama `clearAuth()` y `clearHealth()` de los stores de Zustand