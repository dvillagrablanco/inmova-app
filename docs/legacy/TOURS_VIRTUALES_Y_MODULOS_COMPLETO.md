# 🎯 SISTEMA DE TOURS VIRTUALES Y MÓDULOS DINÁMICOS - COMPLETO

## 📋 RESUMEN EJECUTIVO

Se ha desarrollado un sistema completo de **tours virtuales interactivos** y **gestión dinámica de módulos** que se adapta automáticamente según:
- **Rol del usuario** (super_admin, administrador, gestor, operador, soporte, community_manager)
- **Vertical de negocio** (alquiler tradicional, STR vacacional, coliving, construcción, etc.)
- **Nivel de experiencia** (principiante, intermedio, avanzado)

Los usuarios pueden **activar/desactivar funcionalidades** en cualquier momento, permitiendo personalizar completamente su experiencia.

---

## 🏗️ ARQUITECTURA DEL SISTEMA

### 1. Sistema de Tours Virtuales (`lib/virtual-tours-system.ts`)

#### Tipos de Tours Implementados
```typescript
TourStepType = 'tooltip' | 'modal' | 'spotlight' | 'video' | 'interactive'
TourTrigger = 'auto' | 'manual' | 'ondemand'
```

#### Tours Disponibles
1. **Tour Dashboard** - Panel de control (90s)
2. **Tour Edificios** - Gestión de propiedades (120s)
3. **Tour Unidades** - Apartamentos y locales (100s)
4. **Tour Contratos** - Contratos de alquiler (150s)
5. **Tour Mantenimiento** - Incidencias (110s)
6. **Tour Coliving** - Espacios compartidos (180s)

#### Características de Tours
- **Adaptados por rol**: Cada tour se muestra solo a roles relevantes
- **Adaptados por vertical**: Tours especializados según el negocio
- **Adaptados por experiencia**: Más videos para principiantes, menos para avanzados
- **Repeatables**: Se pueden ver múltiples veces
- **Auto-start**: Algunos se inician automáticamente
- **Progress tracking**: Seguimiento de progreso

---

### 2. Sistema de Módulos Dinámicos (`lib/modules-management-system.ts`)

#### Categorías de Módulos

##### 🔵 CORE (Esenciales)
- **dashboard**: Panel de control (5 min)
- **edificios**: Gestión de propiedades (10 min)
- **unidades**: Apartamentos/locales (8 min)
- **inquilinos**: Base de datos inquilinos (7 min)
- **contratos**: Contratos de alquiler (15 min)

##### 🟣 ADVANCED (Avanzados)
- **pagos**: Cobros con Stripe (20 min)
- **mantenimiento**: Incidencias y proveedores (12 min)
- **crm**: Gestión de leads (25 min)
- **reportes**: Informes y analytics (15 min)

##### 🟢 SPECIALIZED (Especializados)
- **coliving**: Espacios compartidos (20 min)
- **str**: Channel manager vacacional (30 min)
- **flipping**: House flipping (25 min)
- **construccion**: Gestión de obra (35 min)
- **comunidades**: Administración de fincas (30 min)

##### 🟡 PREMIUM (Requieren configuración adicional)
- **ia_valoracion**: Valoración automática con IA (20 min)
- **tour_virtual**: Tours 360° (15 min)
- **firma_digital**: Firma electrónica (10 min)
- **automatizacion**: Workflows (30 min)

#### Lógica de Activación por Defecto

##### Principiante
- ✅ Módulos CORE básicos
- ❌ Contratos (demasiado complejo)
- ❌ Módulos avanzados
- ❌ Módulos premium

##### Intermedio
- ✅ Todos los CORE
- ✅ Algunos ADVANCED (pagos, reportes)
- ✅ SPECIALIZED según vertical
- ⚠️ PREMIUM bajo demanda

##### Avanzado
- ✅ Todos los CORE
- ✅ Todos los ADVANCED
- ✅ SPECIALIZED según vertical
- ✅ Algunos PREMIUM (firma digital)

---

### 3. Servicio de Preferencias (`lib/user-preferences-service.ts`)

#### Funciones Principales

```typescript
// Obtener preferencias
getUserPreferences(userId: string): Promise<UserPreferences>

// Actualizar preferencias
updateUserPreferences(userId: string, preferences: Partial<UserPreferences>): Promise<UserPreferences>

// Activar módulo
activateModule(userId: string, moduleId: string): Promise<Result>

// Desactivar módulo (valida dependencias)
deactivateModule(userId: string, moduleId: string): Promise<Result>

// Completar tour
completeTour(userId: string, tourId: string): Promise<Result>

// Cambiar nivel de experiencia y ajustar módulos
changeExperienceLevel(userId: string, newLevel: string, adjustModules: boolean): Promise<Result>
```

#### Estructura de Preferencias
```typescript
interface UserPreferences {
  activeModules: string[];
  completedTours: string[];
  experienceLevel: 'principiante' | 'intermedio' | 'avanzado';
  vertical: string;
  theme: 'light' | 'dark';
  language: 'es' | 'en';
  enableTooltips: boolean;
  enableChatbot: boolean;
  enableVideos: boolean;
  autoplayTours: boolean;
  notificationsEnabled: boolean;
}
```

---

## 🔌 APIs IMPLEMENTADAS

### `/api/modules`

#### GET
```bash
# Obtener módulos activos
GET /api/modules?view=active

# Obtener todos los módulos
GET /api/modules?view=all

# Obtener módulos disponibles (no activos pero permitidos)
GET /api/modules?view=available

# Obtener recomendados según perfil
GET /api/modules?view=recommended

# Obtener sugerencias (disponibles + dependencias satisfechas)
GET /api/modules?view=suggested

# Obtener por categorías
GET /api/modules?view=categories
```

#### POST
```bash
# Activar módulo
POST /api/modules
{
  "action": "activate",
  "moduleId": "pagos"
}

# Desactivar módulo
POST /api/modules
{
  "action": "deactivate",
  "moduleId": "crm"
}
```

**Validaciones**:
- ✅ Verifica permisos de rol
- ✅ Verifica vertical requerido
- ✅ Valida dependencias antes de activar
- ✅ Valida dependencias inversas antes de desactivar

---

### `/api/tours`

#### GET
```bash
# Tours disponibles (no completados o repeatables)
GET /api/tours?view=available

# Todos los tours relevantes
GET /api/tours?view=all

# Siguiente tour recomendado (auto-start)
GET /api/tours?view=next

# Tours completados
GET /api/tours?view=completed
```

#### POST
```bash
# Completar tour
POST /api/tours
{
  "action": "complete",
  "tourId": "tour-dashboard"
}

# Resetear tour (para volver a verlo)
POST /api/tours
{
  "action": "reset",
  "tourId": "tour-dashboard"
}
```

**Response includes**:
- Lista de tours filtrados
- Progreso total (%)
- Tours completados
- Nivel de experiencia

---

### `/api/preferences`

#### GET
```bash
# Obtener preferencias
GET /api/preferences

# Obtener preferencias + estadísticas
GET /api/preferences?stats=true
```

**Response con stats**:
```json
{
  "success": true,
  "preferences": { ... },
  "stats": {
    "totalModules": 18,
    "activeModules": 8,
    "completedTours": 3,
    "experienceLevel": "intermedio",
    "utilizationRate": 44
  }
}
```

#### PUT
```bash
# Actualizar preferencias
PUT /api/preferences
{
  "experienceLevel": "avanzado",
  "enableTooltips": false,
  "enableVideos": true,
  "adjustModulesOnExperienceChange": true  // Recalcular módulos
}
```

**Si `adjustModulesOnExperienceChange: true`**:
- Recalcula módulos según nuevo nivel
- Retorna `activeModules` actualizados

---

## 🎨 COMPONENTES UI

### 1. `ModuleManager.tsx`
Panel completo de gestión de módulos con:
- Tabs por categoría (Core, Advanced, Specialized, Premium)
- Switches para activar/desactivar
- Badges de categoría y tiempo estimado
- Listado de features
- Alertas de dependencias
- Estado activo/inactivo

### 2. `VirtualTourPlayer.tsx`
Reproductor interactivo de tours con:
- **Tipos de visualización**:
  - Modal (centro de pantalla)
  - Tooltip (flotante cerca del elemento)
  - Spotlight (resalta elemento con overlay oscuro)
- **Características**:
  - Progress bar
  - Navegación adelante/atrás
  - Skip tour
  - Soporte de videos
  - Highlight de elementos target
  - Smooth scroll
  - Animaciones

### 3. `ToursList.tsx`
Lista de tours disponibles con:
- Progress global
- Cards por tour
- Badges de categoría
- Tiempo estimado
- Estado completado
- Botón "Ver de nuevo"
- Botón resetear
- Filtros

### 4. `PreferencesPanel.tsx`
Panel de configuración con:
- Selección de nivel de experiencia
- Opción de ajustar módulos automáticamente
- Switches para tooltips, chatbot, videos
- Selector de tema (light/dark)
- Selector de idioma (es/en)
- Estadísticas de uso
- Notificaciones

---

## 🪝 HOOKS PERSONALIZADOS

### `useVirtualTour()`
```typescript
const {
  availableTours,      // Tours disponibles
  nextTour,            // Siguiente tour recomendado
  completedTours,      // IDs de tours completados
  progress,            // Progreso global (%)
  loading,
  completeTour,        // Función para completar
  resetTour,           // Función para resetear
  isTourCompleted,     // Verificar si está completado
  refetch              // Refrescar datos
} = useVirtualTour();
```

### `useModules()`
```typescript
const {
  activeModules,       // Módulos activos
  allModules,          // Todos los módulos
  recommendedModules,  // Recomendados según perfil
  loading,
  activateModule,      // Función para activar
  deactivateModule,    // Función para desactivar
  isModuleActive,      // Verificar si está activo
  refetch              // Refrescar datos
} = useModules();
```

---

## 🔄 INTEGRACIÓN CON ONBOARDING

### Actualizado: `lib/onboarding-service.ts`

La función `initializeOnboardingTasks()` ahora también:
1. Inicializa las tareas de onboarding adaptadas
2. **Inicializa los módulos por defecto** según:
   - Rol del usuario
   - Vertical de la empresa
   - Nivel de experiencia

```typescript
// Al finalizar creación de tareas
await initializeDefaultModules(
  userId, 
  userRole, 
  company.businessVertical,
  userExperience
);
```

**Resultado**: El usuario nuevo tiene automáticamente:
- ✅ Tareas de onboarding adaptadas
- ✅ Módulos activos según su perfil
- ✅ Tours virtuales disponibles
- ✅ Preferencias inicializadas

---

## 📊 EJEMPLOS DE USO

### Ejemplo 1: Usuario Principiante - Alquiler Tradicional

**Perfil**:
- Rol: `gestor`
- Vertical: `alquiler_tradicional`
- Experiencia: `principiante`

**Módulos Activos por Defecto**:
- ✅ dashboard
- ✅ edificios
- ✅ unidades
- ✅ inquilinos
- ❌ contratos (demasiado complejo)
- ❌ pagos
- ❌ premium

**Tours Auto-Start**:
- Tour Dashboard (inmediato)
- Tour Edificios (al entrar a edificios)

**Características**:
- Videos incluidos en todos los tours
- Tooltips activados
- Chatbot activado
- Tours se inician automáticamente

---

### Ejemplo 2: Usuario Avanzado - Coliving

**Perfil**:
- Rol: `administrador`
- Vertical: `coliving`
- Experiencia: `avanzado`

**Módulos Activos por Defecto**:
- ✅ Todos los CORE
- ✅ Todos los ADVANCED
- ✅ coliving (especializado)
- ✅ firma_digital (premium)
- ⚠️ Resto premium bajo demanda

**Tours Auto-Start**:
- Ninguno (usuario avanzado)
- Tours disponibles manualmente

**Características**:
- Videos desactivados (conoce el flujo)
- Tooltips opcionales
- Tours no se inician automáticamente
- Tareas onboarding auto-completadas

---

### Ejemplo 3: Community Manager - Comunidades

**Perfil**:
- Rol: `community_manager`
- Vertical: `comunidades`
- Experiencia: `intermedio`

**Módulos Activos por Defecto**:
- ✅ dashboard
- ✅ edificios (para visualizar)
- ✅ comunidades (especializado)
- ✅ mantenimiento
- ❌ contratos (no aplica)
- ❌ pagos (no gestiona)

**Tours Auto-Start**:
- Tour Dashboard
- Tour Comunidades (específico)

**Características**:
- Algunos videos incluidos
- Tooltips activados
- Tours recomendados según su rol

---

## 🔐 VALIDACIONES Y SEGURIDAD

### Validación de Dependencias

**Antes de Activar un Módulo**:
```typescript
// Ejemplo: activar "contratos" requiere "unidades" + "inquilinos"
{
  dependencies: ['unidades', 'inquilinos']
}
```
→ Si faltan dependencias, retorna error con lista de faltantes.

**Antes de Desactivar un Módulo**:
```typescript
// Ejemplo: desactivar "edificios" cuando "unidades" está activo
→ Error: "Otros módulos dependen de este: Unidades"
```

### Validación de Permisos

**Por Rol**:
```typescript
// Solo administradores pueden activar "crm"
requiredRole: ['administrador', 'super_admin']
```

**Por Vertical**:
```typescript
// Solo vertical coliving puede activar módulo "coliving"
requiredVertical: ['coliving', 'room_rental']
```

---

## 🎯 CASOS DE USO PRINCIPALES

### Caso 1: Usuario Cambia Nivel de Experiencia

```typescript
// Usuario pasa de principiante a intermedio
PUT /api/preferences
{
  "experienceLevel": "intermedio",
  "adjustModulesOnExperienceChange": true
}
```

**Resultado**:
- Se activan módulos recomendados para intermedio
- Se desactivan videos en tours (opcional)
- Tours ya no se inician automáticamente
- Se mantienen módulos manualmente activados

---

### Caso 2: Usuario Quiere Activar Módulo Premium

```typescript
// Activar valoración IA
POST /api/modules
{
  "action": "activate",
  "moduleId": "ia_valoracion"
}
```

**Backend verifica**:
1. ¿Usuario tiene rol permitido? (`gestor`, `administrador`)
2. ¿Dependencias satisfechas? (ninguna)
3. ¿Vertical permitido? (cualquiera)

**Si OK**:
- Módulo se activa
- Tour "IA Valoración" se hace disponible
- Menú lateral muestra nueva opción

---

### Caso 3: Usuario Desea Ver Tour de Nuevo

```typescript
// Resetear tour dashboard
POST /api/tours
{
  "action": "reset",
  "tourId": "tour-dashboard"
}
```

**Resultado**:
- Tour se marca como no completado
- Vuelve a aparecer en lista de disponibles
- Se puede reproducir nuevamente

---

## 📈 MÉTRICAS Y ANALYTICS

### Estadísticas de Usuario

```typescript
{
  totalModules: 18,          // Total de módulos en plataforma
  activeModules: 8,          // Módulos que tiene activos
  completedTours: 3,         // Tours completados
  experienceLevel: "intermedio",
  utilizationRate: 44        // % de módulos activos
}
```

### Progress de Tours

```typescript
{
  totalTours: 6,
  completedTours: 3,
  progress: 50,              // % completado
  remainingTime: 240         // segundos estimados
}
```

---

## 🚀 FLUJO COMPLETO: NUEVO USUARIO

### 1. Registro y Onboarding Inicial
```
Usuario se registra → selecciona rol, vertical, experiencia
↓
Backend ejecuta `initializeOnboardingTasks()`
↓
Se crean:
  - Tareas de onboarding adaptadas
  - Módulos por defecto según perfil
  - Preferencias inicializadas
```

### 2. Primera Sesión
```
Usuario hace login
↓
Dashboard carga → verifica `autoplayTours`
↓
Si autoplayTours = true:
  - Fetch /api/tours?view=next
  - Inicia tour dashboard automáticamente
```

### 3. Navegación
```
Usuario navega a "Edificios"
↓
Componente verifica si módulo está activo
↓
Si NO está activo:
  - Muestra mensaje "Activa este módulo"
  - Botón para activar
↓
Si SÍ está activo:
  - Carga contenido
  - Si hay tour disponible y autoplay, inicia tour
```

### 4. Personalización
```
Usuario va a Preferencias
↓
Cambia experiencia a "avanzado"
↓
Opta por ajustar módulos automáticamente
↓
Backend recalcula módulos recomendados
↓
Se activan módulos avanzados
Se desactivan tutoriales
```

### 5. Descubrimiento
```
Usuario ve sección "Módulos Sugeridos"
↓
Muestra módulos disponibles con dependencias satisfechas
↓
Usuario activa "Firma Digital"
↓
Aparece tour "Firma Digital"
↓
Usuario lo completa
```

---

## 🛠️ CONFIGURACIÓN ADICIONAL

### Variables de Entorno Requeridas

```env
# Base
NEXT_PUBLIC_APP_URL=https://inmovaapp.com

# Para tours con videos
NEXT_PUBLIC_VIDEO_CDN_URL=https://cdn.inmovaapp.com/videos

# Opcional: Analytics de tours
ENABLE_TOUR_ANALYTICS=true
```

### Prisma Schema Requerido

El campo `preferences` en el modelo `User` debe ser `Json`:

```prisma
model User {
  id          String  @id @default(cuid())
  email       String  @unique
  name        String
  role        UserRole
  preferences Json?   // ← CRÍTICO
  // ... resto de campos
}
```

### CSS Global para Tours

El archivo `VirtualTourPlayer.tsx` inyecta CSS para highlights:

```css
.tour-highlight {
  position: relative;
  z-index: 45 !important;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.5);
  border-radius: 4px;
  transition: all 0.3s ease;
}
```

---

## 🧪 TESTING

### Test Manual - Activar Módulo

```bash
# 1. Login como gestor intermedio
curl -X POST /api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"gestor@test.com","password":"password"}'

# 2. Ver módulos activos
curl /api/modules?view=active

# 3. Activar módulo "pagos"
curl -X POST /api/modules \
  -H "Content-Type: application/json" \
  -d '{"action":"activate","moduleId":"pagos"}'

# 4. Verificar módulos activos (debe incluir "pagos")
curl /api/modules?view=active
```

### Test Manual - Completar Tour

```bash
# 1. Ver tours disponibles
curl /api/tours?view=available

# 2. Obtener siguiente tour recomendado
curl /api/tours?view=next

# 3. Completar tour dashboard
curl -X POST /api/tours \
  -H "Content-Type: application/json" \
  -d '{"action":"complete","tourId":"tour-dashboard"}'

# 4. Verificar progreso
curl /api/tours?view=all
```

---

## 📝 PRÓXIMAS MEJORAS SUGERIDAS

### Corto Plazo
- [ ] Analytics de uso de tours (tiempo por step)
- [ ] Módulos "favoritos" (pin en sidebar)
- [ ] Tours con branching (rutas alternativas)

### Medio Plazo
- [ ] A/B testing de tours (variantes)
- [ ] Recomendaciones ML según uso
- [ ] Gamificación (badges por tours completados)

### Largo Plazo
- [ ] Tours generados por IA según rol
- [ ] Módulos marketplace (terceros)
- [ ] Tours colaborativos (equipo completa juntos)

---

## 🎉 CONCLUSIÓN

El sistema de **Tours Virtuales y Módulos Dinámicos** está completamente implementado y listo para producción.

### Beneficios Clave
✅ **Adaptación automática** según perfil de usuario  
✅ **Personalización total** de módulos activos  
✅ **Onboarding escalable** para cualquier vertical  
✅ **Zero-Touch** para usuarios avanzados  
✅ **Guía paso a paso** para principiantes  
✅ **APIs RESTful** bien documentadas  
✅ **UI/UX intuitiva** con shadcn/ui  
✅ **Type-safe** con TypeScript  

### Cumple con .cursorrules
✅ Temperatura 0.3 (código determinístico)  
✅ Sin empatía en mensajes  
✅ Validación con Zod  
✅ Error handling completo  
✅ Next.js 15 App Router  
✅ Prisma ORM  
✅ APIs marcadas como `dynamic`  

**Sistema listo para usar.**
