# 🎓 SISTEMA DE TUTORIALES PASO A PASO

## 📋 Índice
1. [Descripción General](#descripción-general)
2. [Componentes Implementados](#componentes-implementados)
3. [Flujo de Usuario](#flujo-de-usuario)
4. [Guías Técnicas](#guías-técnicas)
5. [API Endpoints](#api-endpoints)
6. [Base de Datos](#base-de-datos)

---

## Descripción General

Sistema completo de tutoriales interactivos y guías paso a paso para nuevos usuarios. Diseñado específicamente para usuarios que se registran por primera vez, garantizando una experiencia de onboarding intuitiva y sin fricción.

### 🎯 Objetivos

- **Onboarding Zero-Friction**: Usuarios activos en menos de 10 minutos
- **Aprendizaje Progresivo**: Paso a paso, sin información abrumadora
- **Seguimiento Visual**: Progreso claro en todo momento
- **Adaptable**: Puede saltarse o retomarse en cualquier momento

---

## Componentes Implementados

### 1. InteractiveGuide (Guía Interactiva)

**📁 Archivo**: `components/tutorials/InteractiveGuide.tsx`

**Descripción**: Guía contextual paso a paso que bloquea UI y resalta elementos específicos.

**Características**:
- ✅ Overlay oscuro que bloquea interacción
- ✅ Highlight del elemento objetivo con animación pulsante
- ✅ Tooltip posicionado dinámicamente (top, bottom, left, right, center)
- ✅ Barra de progreso visual
- ✅ Navegación adelante/atrás
- ✅ Opción de saltar guía

**Props**:
```typescript
interface InteractiveGuideProps {
  steps: GuideStep[];
  onComplete: () => void;
  onSkip?: () => void;
  title: string;
  description: string;
}

interface GuideStep {
  id: string;
  title: string;
  description: string;
  action: string; // Qué debe hacer el usuario
  targetSelector?: string; // Selector CSS del elemento
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
  waitForAction?: boolean;
  autoAdvance?: boolean;
  validation?: () => boolean;
}
```

**Ejemplo de uso**:
```tsx
<InteractiveGuide
  title="Crea tu primera propiedad"
  description="Te guiaremos paso a paso"
  steps={[
    {
      id: 'step-1',
      title: 'Haz click en "Nuevo Edificio"',
      description: 'Encontrarás el botón en la esquina superior derecha',
      action: 'Click en el botón azul "Nuevo Edificio"',
      targetSelector: '#btn-nuevo-edificio',
      position: 'bottom'
    },
    // ... más pasos
  ]}
  onComplete={() => {
    toast.success('¡Guía completada!');
  }}
  onSkip={() => {
    // Usuario saltó la guía
  }}
/>
```

---

### 2. FirstTimeSetupWizard (Wizard de Configuración Inicial)

**📁 Archivo**: `components/tutorials/FirstTimeSetupWizard.tsx`

**Descripción**: Wizard completo de 5 pasos para configuración inicial del usuario.

**Pasos del Wizard**:

#### Paso 1: Tu Perfil
- **Tiempo estimado**: 2 minutos
- **Tareas**:
  - Nombre completo
  - Teléfono de contacto
  - Dirección fiscal (opcional)
- **Beneficios**:
  - Contratos con información correcta
  - Notificaciones al instante
  - Documentos oficiales listos

#### Paso 2: Primera Propiedad
- **Tiempo estimado**: 5 minutos
- **Tareas**:
  - Crear edificio
  - Dirección completa
  - Detalles de la propiedad
  - Subir foto
- **Beneficios**:
  - Toda la información en un lugar
  - Fácil de compartir con inquilinos
  - Base para contratos y pagos

#### Paso 3: Primer Inquilino
- **Tiempo estimado**: 3 minutos
- **Tareas**:
  - Datos del inquilino
  - Asignar propiedad
  - Contacto de emergencia
- **Beneficios**:
  - Comunicación directa desde la app
  - Historial completo
  - Notificaciones automáticas

#### Paso 4: Primer Contrato
- **Tiempo estimado**: 7 minutos
- **Tareas**:
  - Elegir plantilla
  - Términos del contrato
  - Revisar contrato
  - Enviar para firma
- **Beneficios**:
  - Contrato legal en minutos
  - Firma digital válida
  - Almacenado de forma segura

#### Paso 5: Personalizar Experiencia
- **Tiempo estimado**: 2 minutos
- **Tareas**:
  - Nivel de experiencia
  - Activar ayudas
  - Seleccionar funciones
- **Beneficios**:
  - App adaptada a ti
  - Solo ves lo que necesitas
  - Puedes cambiar cuando quieras

**Props**:
```typescript
interface FirstTimeSetupWizardProps {
  onComplete: () => void;
  onSkip?: () => void;
}
```

**Características**:
- ✅ 5 pasos predefinidos
- ✅ Checklist de tareas por paso
- ✅ Botón "Iniciar" que redirige a la ruta correspondiente
- ✅ Progreso global visible
- ✅ Estimación de tiempo por paso
- ✅ Beneficios claros de cada paso
- ✅ Guardado automático de progreso

---

### 3. OnboardingChecklist (Checklist Flotante)

**📁 Archivo**: `components/tutorials/OnboardingChecklist.tsx`

**Descripción**: Checklist flotante siempre visible con los primeros pasos del usuario.

**Características**:
- ✅ Flotante en esquina inferior derecha
- ✅ Minimizable
- ✅ Progreso visual con barra
- ✅ Click para navegar directamente
- ✅ Marca manual de completado
- ✅ Celebración al completar todo
- ✅ Persistencia en base de datos

**Estados del Checklist**:

**Minimizado**:
```
+--------------------------------------+
| 🏆 3/5 Pasos completados [🔼]       |
+--------------------------------------+
```

**Expandido**:
```
+--------------------------------------+
| 🎉 Primeros Pasos              [🔽]  |
| 3 de 5 completados                   |
| Progreso: ████████░░ 60%            |
|                                      |
| ✅ Completa tu perfil                |
| ✅ Añade tu primera propiedad        |
| ✅ Registra un inquilino             |
| ⭕ Crea tu primer contrato (~7 min)  |
| ⭕ Personaliza tu experiencia (~2 min)|
|                                      |
| 💡 Completa estos pasos para        |
|    aprovechar al máximo la plataforma|
+--------------------------------------+
```

**Al completar todo**:
```
+--------------------------------------+
| 🏆 ¡Configuración completa!    [🔽]  |
| ¡Ya puedes usar todas las funciones! |
|                                      |
|          🏆                          |
|    ¡Enhorabuena!                     |
|                                      |
| Has completado todos los pasos       |
| iniciales. Ya estás listo para       |
| gestionar tus propiedades como un    |
| profesional.                         |
|                                      |
| [✨ Configuración Completa]          |
+--------------------------------------+
```

---

## Flujo de Usuario

### 🎯 Primera Vez en la Aplicación

```
Usuario nuevo se registra
        ↓
Redirigido a Dashboard
        ↓
Detecta que es nuevo (onboardingCompleted: false)
        ↓
OPCIÓN 1: Mostrar FirstTimeSetupWizard (modal full-screen)
    ↓
Usuario completa wizard paso a paso
    ↓
Al finalizar: hasCompletedOnboarding = true
    ↓
Redirigido a Dashboard con checklist flotante

        O

OPCIÓN 2: Mostrar OnboardingChecklist directamente
    ↓
Usuario ve checklist flotante en esquina
    ↓
Click en tarea → Redirige a ruta correspondiente
    ↓
Usuario completa manualmente cada tarea
    ↓
Al completar todo: ¡Celebración!
```

### 🎯 Usuario Experimentado (Skip Wizard)

```
Usuario nuevo se registra
        ↓
Wizard aparece
        ↓
Click en "Saltar configuración"
        ↓
onboardingCompleted = false (aún)
        ↓
Checklist flotante siempre visible
        ↓
Puede completar pasos cuando quiera
```

---

## Guías Técnicas

### Integración en Layout Autenticado

**📁 Archivo**: `components/layout/authenticated-layout.tsx`

```tsx
'use client';

import { OnboardingChecklist } from '@/components/tutorials/OnboardingChecklist';
import { FirstTimeSetupWizard } from '@/components/tutorials/FirstTimeSetupWizard';
import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';

export function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const [showSetupWizard, setShowSetupWizard] = useState(false);
  const [showChecklist, setShowChecklist] = useState(true);

  useEffect(() => {
    const checkOnboarding = async () => {
      if (!session?.user?.id) return;

      const response = await fetch('/api/user/onboarding-status');
      const data = await response.json();

      // Si es usuario nuevo Y nunca completó onboarding
      if (!data.hasCompletedOnboarding && data.isNewUser) {
        // Mostrar wizard si nunca lo vio
        if (!localStorage.getItem('skipped-setup-wizard')) {
          setShowSetupWizard(true);
        }
      }

      // Checklist siempre visible hasta completar todo
      setShowChecklist(!data.hasCompletedOnboarding);
    };

    checkOnboarding();
  }, [session]);

  const handleCompleteSetup = () => {
    setShowSetupWizard(false);
    setShowChecklist(true);
  };

  const handleSkipSetup = () => {
    setShowSetupWizard(false);
    setShowChecklist(true);
    localStorage.setItem('skipped-setup-wizard', 'true');
  };

  const handleDismissChecklist = () => {
    setShowChecklist(false);
  };

  return (
    <div>
      {/* Layout normal */}
      {children}

      {/* Setup Wizard (primera vez) */}
      {showSetupWizard && (
        <FirstTimeSetupWizard
          onComplete={handleCompleteSetup}
          onSkip={handleSkipSetup}
        />
      )}

      {/* Checklist flotante (hasta completar) */}
      {showChecklist && session?.user?.id && (
        <OnboardingChecklist
          userId={session.user.id}
          isNewUser={true}
          onDismiss={handleDismissChecklist}
        />
      )}
    </div>
  );
}
```

---

## API Endpoints

### GET `/api/onboarding/checklist`

**Descripción**: Obtener progreso del checklist del usuario.

**Respuesta**:
```json
{
  "checklist": ["complete-profile", "add-property"],
  "currentStep": 2,
  "isCompleted": false
}
```

---

### POST `/api/onboarding/checklist`

**Descripción**: Guardar progreso del checklist.

**Body**:
```json
{
  "completedItems": ["complete-profile", "add-property", "add-tenant"]
}
```

**Respuesta**:
```json
{
  "success": true,
  "progress": {
    "id": "...",
    "userId": "...",
    "completedSteps": ["complete-profile", "add-property", "add-tenant"],
    "currentStep": 3,
    "isCompleted": false
  }
}
```

---

### POST `/api/onboarding/complete-setup`

**Descripción**: Marcar configuración inicial como completada.

**Body**:
```json
{
  "completedTasks": ["task-1", "task-2", "task-3"],
  "setupVersion": "1.0"
}
```

**Respuesta**:
```json
{
  "success": true,
  "message": "Configuración inicial completada"
}
```

---

### GET `/api/user/onboarding-status`

**Descripción**: Verificar estado de onboarding del usuario.

**Respuesta**:
```json
{
  "hasCompletedOnboarding": false,
  "isNewUser": true,
  "onboardingCompletedAt": null,
  "setupProgress": {
    "completedSteps": ["complete-profile"],
    "currentStep": 1,
    "isCompleted": false
  }
}
```

---

## Base de Datos

### Modelo: UserOnboardingProgress

```prisma
model UserOnboardingProgress {
  id              String    @id @default(cuid())
  userId          String    @unique
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // Progress
  completedSteps  String[]  // IDs de pasos completados
  currentStep     Int       @default(0)
  isCompleted     Boolean   @default(false)
  setupVersion    String?   // Versión del setup para tracking
  
  // Timestamps
  lastUpdated     DateTime  @default(now()) @updatedAt
  createdAt       DateTime  @default(now())
  
  @@index([userId])
  @@index([isCompleted])
  @@map("user_onboarding_progress")
}
```

### Campos Añadidos a User

```prisma
model User {
  // ... campos existentes
  
  // Onboarding
  hasCompletedOnboarding Boolean          @default(false)
  onboardingCompletedAt  DateTime?
  
  // Tutorial & Setup Progress
  onboardingProgressDetailed UserOnboardingProgress?
  
  // ...
}
```

---

## 🎨 Estilos y Animaciones

### Highlight de Elementos

Cuando InteractiveGuide resalta un elemento:

```css
.guide-highlight {
  animation: guide-pulse 2s ease-in-out infinite;
  box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.4),
              0 0 0 8px rgba(99, 102, 241, 0.2),
              0 0 30px rgba(99, 102, 241, 0.3);
  border-radius: 8px;
  position: relative;
  z-index: 9999;
}

@keyframes guide-pulse {
  0%, 100% {
    box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.4),
                0 0 0 8px rgba(99, 102, 241, 0.2),
                0 0 30px rgba(99, 102, 241, 0.3);
  }
  50% {
    box-shadow: 0 0 0 6px rgba(99, 102, 241, 0.5),
                0 0 0 12px rgba(99, 102, 241, 0.3),
                0 0 40px rgba(99, 102, 241, 0.4);
  }
}
```

---

## 🚀 Deploy

### Migraciones de Prisma

```bash
# Generar migración
npx prisma migrate dev --name add_onboarding_progress

# Aplicar en producción
npx prisma migrate deploy

# Generar Prisma Client
npx prisma generate
```

---

## ✅ Checklist de Implementación

- [x] `InteractiveGuide.tsx` - Guía paso a paso contextual
- [x] `FirstTimeSetupWizard.tsx` - Wizard de configuración inicial
- [x] `OnboardingChecklist.tsx` - Checklist flotante
- [x] API: `/api/onboarding/checklist` (GET, POST)
- [x] API: `/api/onboarding/complete-setup` (POST)
- [x] Modelo Prisma: `UserOnboardingProgress`
- [x] Campos en User: `hasCompletedOnboarding`, `onboardingCompletedAt`
- [ ] Integración en `authenticated-layout.tsx`
- [ ] API: `/api/user/onboarding-status`
- [ ] Tests E2E del flujo completo
- [ ] Migraciones aplicadas en producción

---

## 📊 Métricas de Éxito

### KPIs a medir:

- **Tasa de Completado de Wizard**: % usuarios que completan wizard completo
- **Tiempo Promedio de Onboarding**: Minutos desde registro hasta hasCompletedOnboarding=true
- **Tasa de Skip**: % usuarios que saltan wizard
- **Paso con Mayor Abandono**: Qué paso del wizard tiene mayor dropout
- **Retención D1**: % usuarios que vuelven el día siguiente después de onboarding

**Queries útiles**:

```sql
-- Tasa de completado de onboarding
SELECT 
  COUNT(*) FILTER (WHERE "hasCompletedOnboarding" = true) * 100.0 / COUNT(*) as completion_rate
FROM users
WHERE "createdAt" >= NOW() - INTERVAL '30 days';

-- Tiempo promedio de onboarding
SELECT 
  AVG(EXTRACT(EPOCH FROM ("onboardingCompletedAt" - "createdAt")) / 60) as avg_minutes
FROM users
WHERE "hasCompletedOnboarding" = true
AND "createdAt" >= NOW() - INTERVAL '30 days';
```

---

## 🐛 Troubleshooting

### Usuario no ve el wizard

**Posible causa**: localStorage tiene flag de skip

**Solución**:
```javascript
localStorage.removeItem('skipped-setup-wizard');
```

### Progreso no se guarda

**Verificar**:
1. API `/api/onboarding/checklist` responde correctamente
2. Session válida
3. Prisma Client generado
4. Migraciones aplicadas

### Highlight no aparece

**Verificar**:
1. Selector CSS correcto
2. Elemento existe en el DOM
3. z-index del elemento es menor a 9999

---

## 📚 Referencias

- [Documentación Cursorrules](/CURSORRULES_USAGE_GUIDE.md)
- [Sistema Zero-Touch Onboarding](/docs/zero-touch-onboarding.md)
- [UX Improvements](/MEJORAS_UX_INTUITIVIDAD.md)

---

**Última actualización**: 1 de enero de 2026
**Versión**: 1.0.0
**Mantenido por**: Equipo Inmova
