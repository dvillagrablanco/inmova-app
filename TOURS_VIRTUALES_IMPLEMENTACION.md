# 🚀 GUÍA DE IMPLEMENTACIÓN: Tours Virtuales y Módulos

## 📋 PASOS PARA INTEGRAR EN TU APLICACIÓN

### 1. Agregar Auto-Starter a Layout Principal

Edita tu archivo `app/(dashboard)/layout.tsx`:

```tsx
import { TourAutoStarter } from '@/components/tours/TourAutoStarter';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      {/* Tu sidebar, header, etc. */}
      
      <main>
        {children}
      </main>

      {/* Tour Auto-Starter (al final del layout) */}
      <TourAutoStarter />
    </div>
  );
}
```

### 2. Añadir data-tour Attributes a Elementos

Para que los tours puedan destacar elementos, añade atributos `data-tour`:

#### Dashboard
```tsx
// app/(dashboard)/dashboard/page.tsx
export default function DashboardPage() {
  return (
    <div>
      {/* KPIs */}
      <div data-tour="kpi-cards" className="grid grid-cols-3 gap-4">
        <KPICard title="Ingresos" value="$12,500" />
        {/* ... */}
      </div>

      {/* Gráficos */}
      <div data-tour="charts" className="grid grid-cols-2 gap-4">
        <RevenueChart />
        <OccupancyChart />
      </div>

      {/* Acciones Rápidas */}
      <div data-tour="quick-actions" className="flex gap-2">
        <Button>Nueva Propiedad</Button>
        <Button>Nuevo Contrato</Button>
      </div>

      {/* Alertas */}
      <div data-tour="alerts">
        <AlertsList />
      </div>
    </div>
  );
}
```

#### Edificios
```tsx
// app/(dashboard)/edificios/page.tsx
export default function EdificiosPage() {
  return (
    <div>
      <Button data-tour="btn-create-building">
        Nuevo Edificio
      </Button>

      <div data-tour="buildings-list">
        {/* Lista de edificios */}
      </div>
    </div>
  );
}
```

#### Formulario de Edificio
```tsx
// components/edificios/BuildingForm.tsx
export function BuildingForm() {
  return (
    <form data-tour="building-form">
      <input name="address" />
      <input name="city" />
      
      <Button data-tour="btn-save" type="submit">
        Guardar
      </Button>
    </form>
  );
}
```

### 3. Configurar Módulos en Sidebar

Edita tu componente de navegación lateral:

```tsx
// components/layout/Sidebar.tsx
'use client';

import { useModules } from '@/hooks/useModules';
import Link from 'next/link';

export function Sidebar() {
  const { activeModules, isModuleActive } = useModules();

  return (
    <nav>
      {/* Dashboard siempre visible */}
      <Link href="/dashboard">
        📊 Dashboard
      </Link>

      {/* Edificios (si está activo) */}
      {isModuleActive('edificios') && (
        <Link href="/edificios">
          🏢 Edificios
        </Link>
      )}

      {/* Unidades (si está activo) */}
      {isModuleActive('unidades') && (
        <Link href="/unidades">
          🏠 Unidades
        </Link>
      )}

      {/* Contratos (si está activo) */}
      {isModuleActive('contratos') && (
        <Link href="/contratos">
          📝 Contratos
        </Link>
      )}

      {/* Mantenimiento (si está activo) */}
      {isModuleActive('mantenimiento') && (
        <Link href="/mantenimiento">
          🛠️ Mantenimiento
        </Link>
      )}

      {/* ... resto de módulos */}

      {/* Enlace a Configuración (siempre visible) */}
      <Link href="/configuracion">
        ⚙️ Configuración
      </Link>
    </nav>
  );
}
```

### 4. Añadir Menú de Tours

Opción 1: Botón flotante en esquina
```tsx
// components/layout/TourButton.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { GraduationCap } from 'lucide-react';
import { ToursList } from '@/components/tours/ToursList';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

export function TourButton() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="fixed bottom-4 right-20 rounded-full shadow-lg"
        >
          <GraduationCap className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Tours Virtuales</SheetTitle>
          <SheetDescription>
            Aprende a usar la plataforma
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6">
          <ToursList />
        </div>
      </SheetContent>
    </Sheet>
  );
}
```

Agregar al layout:
```tsx
// app/(dashboard)/layout.tsx
import { TourButton } from '@/components/layout/TourButton';

export default function DashboardLayout({ children }) {
  return (
    <div>
      {children}
      <TourAutoStarter />
      <TourButton />  {/* ← Botón flotante */}
    </div>
  );
}
```

### 5. Proteger Rutas por Módulo

```tsx
// app/(dashboard)/contratos/page.tsx
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getUserPreferences } from '@/lib/user-preferences-service';

export default async function ContratosPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  // Verificar si módulo está activo
  const prefs = await getUserPreferences(session.user.id);
  if (!prefs.activeModules.includes('contratos')) {
    return (
      <div className="container py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">
          Módulo no activado
        </h1>
        <p className="text-gray-600 mb-6">
          El módulo "Contratos" no está activo en tu cuenta.
        </p>
        <Link href="/configuracion?tab=modulos">
          <Button>Activar módulo</Button>
        </Link>
      </div>
    );
  }

  // Módulo activo, mostrar contenido
  return (
    <div>
      {/* Contenido de contratos */}
    </div>
  );
}
```

### 6. Inicialización Automática en Registro

Ya está integrado en `lib/onboarding-service.ts`, pero asegúrate de llamarlo:

```tsx
// app/api/auth/register/route.ts (o similar)
import { initializeOnboardingTasks } from '@/lib/onboarding-service';

export async function POST(req: Request) {
  // ... crear usuario en BD

  // Inicializar onboarding (incluye módulos automáticamente)
  await initializeOnboardingTasks(
    user.id,
    user.companyId,
    company.businessVertical,
    user.role,
    'principiante' // o lo que el usuario seleccione
  );

  // ... resto
}
```

### 7. Ejemplo: Tour Manual en Botón

```tsx
// components/features/ManualTourButton.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Play } from 'lucide-react';
import { VirtualTourPlayer } from '@/components/tours/VirtualTourPlayer';
import { ALL_VIRTUAL_TOURS } from '@/lib/virtual-tours-system';

export function ManualTourButton({ tourId }: { tourId: string }) {
  const [activeTour, setActiveTour] = useState<any>(null);

  const startTour = () => {
    const tour = ALL_VIRTUAL_TOURS.find(t => t.id === tourId);
    if (tour) setActiveTour(tour);
  };

  return (
    <>
      <Button onClick={startTour} variant="outline" size="sm">
        <Play className="h-4 w-4 mr-2" />
        Ver tutorial
      </Button>

      {activeTour && (
        <VirtualTourPlayer
          tour={activeTour}
          onComplete={() => setActiveTour(null)}
          onSkip={() => setActiveTour(null)}
        />
      )}
    </>
  );
}
```

Uso:
```tsx
<ManualTourButton tourId="tour-contratos" />
```

---

## 🎨 PERSONALIZACIÓN DE TOURS

### Crear un Nuevo Tour

1. Edita `lib/virtual-tours-system.ts`
2. Añade tu tour:

```typescript
export const TOUR_MI_FEATURE: VirtualTour = {
  id: 'tour-mi-feature',
  name: 'Mi Feature',
  description: 'Descripción del tour',
  category: 'feature',
  trigger: 'manual',
  conditions: {
    roles: ['administrador'],
    experienceLevels: ['principiante', 'intermedio']
  },
  steps: [
    {
      id: 'step-1',
      type: 'modal',
      title: 'Bienvenido',
      description: 'Este es el primer paso',
      target: 'body',
      placement: 'center',
      allowSkip: true,
      showProgress: true
    },
    {
      id: 'step-2',
      type: 'spotlight',
      title: 'Elemento Importante',
      description: 'Este elemento hace X',
      target: '[data-tour="mi-elemento"]',
      placement: 'right',
      highlightElement: true,
      allowSkip: true,
      showProgress: true
    }
  ],
  estimatedDuration: 60,
  priority: 50,
  repeatable: true,
  autoStart: false
};

// Agregar al registro
export const ALL_VIRTUAL_TOURS: VirtualTour[] = [
  // ... tours existentes
  TOUR_MI_FEATURE
];
```

3. Mapear en `TourAutoStarter.tsx`:

```typescript
const ROUTE_TO_TOUR_MAP: Record<string, string> = {
  // ... rutas existentes
  '/mi-feature': 'tour-mi-feature'
};
```

### Crear un Nuevo Módulo

1. Edita `lib/modules-management-system.ts`
2. Añade tu módulo al objeto `MODULES`:

```typescript
export const MODULES: Record<string, Module> = {
  // ... módulos existentes
  mi_modulo: {
    id: 'mi_modulo',
    name: 'Mi Módulo',
    description: 'Descripción del módulo',
    icon: '🎯',
    category: 'advanced',
    route: '/mi-modulo',
    requiredRole: ['gestor', 'administrador'],
    recommendedFor: {
      roles: ['gestor'],
      experienceLevels: ['intermedio', 'avanzado']
    },
    dependencies: ['edificios'], // Si depende de otros
    defaultActive: {
      principiante: false,
      intermedio: true,
      avanzado: true
    },
    features: ['Feature 1', 'Feature 2', 'Feature 3'],
    estimatedLearningTime: 20
  }
};
```

---

## 🐛 TROUBLESHOOTING

### Tours no se inician automáticamente

**Verifica**:
1. `autoplayTours` en preferencias está en `true`
2. Tour tiene `autoStart: true`
3. Tour no está completado (o es `repeatable`)
4. `TourAutoStarter` está en el layout
5. Ruta está mapeada en `ROUTE_TO_TOUR_MAP`

### Elementos no se destacan en tours

**Verifica**:
1. Elemento tiene atributo `data-tour="nombre"`
2. `target` en step coincide: `[data-tour="nombre"]`
3. Elemento existe en el DOM cuando el tour inicia
4. CSS de `.tour-highlight` está cargado

### Módulos no aparecen en sidebar

**Verifica**:
1. Módulo está activo: `isModuleActive('modulo-id')`
2. Usuario tiene rol requerido
3. Vertical es compatible
4. `useModules()` hook está funcionando

### Preferencias no se guardan

**Verifica**:
1. API `/api/preferences` funciona
2. Campo `preferences` en User es tipo `Json`
3. No hay errores en consola del navegador
4. Session está activa

---

## 📊 MONITOREO Y ANALYTICS

### Tracking de Eventos (Opcional)

```typescript
// lib/analytics.ts
export function trackTourStart(tourId: string) {
  // Google Analytics
  if (window.gtag) {
    window.gtag('event', 'tour_start', {
      tour_id: tourId
    });
  }

  // Mixpanel
  if (window.mixpanel) {
    window.mixpanel.track('Tour Started', {
      tour_id: tourId
    });
  }
}

export function trackTourComplete(tourId: string, duration: number) {
  if (window.gtag) {
    window.gtag('event', 'tour_complete', {
      tour_id: tourId,
      duration_seconds: duration
    });
  }
}

export function trackModuleActivate(moduleId: string) {
  if (window.gtag) {
    window.gtag('event', 'module_activate', {
      module_id: moduleId
    });
  }
}
```

Integrar en componentes:
```typescript
// VirtualTourPlayer.tsx
import { trackTourStart, trackTourComplete } from '@/lib/analytics';

useEffect(() => {
  trackTourStart(tour.id);
  const startTime = Date.now();

  return () => {
    const duration = (Date.now() - startTime) / 1000;
    trackTourComplete(tour.id, duration);
  };
}, [tour.id]);
```

---

## ✅ CHECKLIST FINAL

### Backend
- [x] `lib/virtual-tours-system.ts` - Sistema de tours
- [x] `lib/modules-management-system.ts` - Sistema de módulos
- [x] `lib/user-preferences-service.ts` - Gestión de preferencias
- [x] `app/api/modules/route.ts` - API de módulos
- [x] `app/api/tours/route.ts` - API de tours
- [x] `app/api/preferences/route.ts` - API de preferencias
- [x] `lib/onboarding-service.ts` - Integración en onboarding

### Frontend
- [x] `components/modules/ModuleManager.tsx` - Gestor de módulos
- [x] `components/tours/VirtualTourPlayer.tsx` - Reproductor de tours
- [x] `components/tours/ToursList.tsx` - Lista de tours
- [x] `components/tours/TourAutoStarter.tsx` - Auto-iniciador
- [x] `components/preferences/PreferencesPanel.tsx` - Panel de preferencias
- [x] `hooks/useVirtualTour.ts` - Hook de tours
- [x] `hooks/useModules.ts` - Hook de módulos
- [x] `app/(dashboard)/configuracion/page.tsx` - Página de configuración

### Integración
- [ ] Añadir `TourAutoStarter` al layout principal
- [ ] Añadir atributos `data-tour` a elementos clave
- [ ] Integrar `useModules` en sidebar
- [ ] Añadir botón flotante de tours
- [ ] Proteger rutas por módulo
- [ ] Llamar `initializeOnboardingTasks` en registro

### Testing
- [ ] Test manual de activar/desactivar módulos
- [ ] Test manual de completar tours
- [ ] Test de cambio de experiencia
- [ ] Test de autoplay tours
- [ ] Verificar data-tour attributes funcionan
- [ ] Test de dependencias de módulos

---

**Sistema completo y documentado. Listo para implementar.**
