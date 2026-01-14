# 🛣️ Hoja de Ruta Frontend 2026 - Inmova App

**Objetivo:** Transformar la potencia del Backend actual (+100 endpoints) en una experiencia de usuario (UX) fluida, intuitiva y profesional, cerrando la brecha existente entre API y UI.

---

## 🏗️ Fase 1: Cimientos y Conexión (Mes 1)
*Objetivo: Que los datos fluyan. Eliminar "placeholders" y conectar vistas críticas.*

### 1.1 Arquitectura de Datos (Data Layer)
- [ ] **Hooks Globales (TanStack Query):** Crear librería de hooks tipados en `hooks/queries/`.
  - `useProperties`, `useProperty(id)`
  - `useTenants`, `useTenant(id)`
  - `usePayments`, `useStats`
- [ ] **Sincronización de Tipos:** Generar tipos TypeScript automáticos desde el esquema de Prisma para el frontend (`types/api.ts`).
- [ ] **Manejo de Errores UI:** Implementar interceptores de Axios/Fetch que disparen `toast.error()` automáticamente ante fallos 4xx/5xx.

### 1.2 Dashboard Core (Prioridad Alta)
- [ ] **Propiedades:** Reemplazar página estática por `DataTable` avanzada (filtros, ordenación, acciones).
  - Vistas: Lista, Grid (Tarjetas), Mapa.
- [ ] **Inquilinos:** CRUD completo conectado a `/api/tenants`.
- [ ] **Contratos:** Visor de contratos con estados (Activo, Pendiente, Finalizado).

---

## 🎨 Fase 2: Experiencia de Usuario (UX) (Mes 1-2)
*Objetivo: Que la app se sienta rápida y profesional.*

### 2.1 Feedback Visual
- [ ] **Skeletons:** Implementar estados de carga para CADA componente de datos. Adiós a los spinners genéricos.
- [ ] **Empty States:** Diseñar ilustraciones y acciones claras cuando no hay datos (ej: "No tienes propiedades. [Crear Primera]").
- [ ] **Optimistic Updates:** Que los botones "Me gusta" o "Archivar" respondan instantáneamente antes de confirmar con el servidor.

### 2.2 Navegación Inteligente
- [ ] **Sidebar Dinámica:** Mostrar solo los módulos contratados/activos según el plan del usuario.
- [ ] **Breadcrumbs Automáticos:** Mejorar la ubicación del usuario en la jerarquía.
- [ ] **Command Palette (Cmd+K):** Implementar búsqueda global de propiedades e inquilinos.

---

## 📱 Fase 3: Adaptabilidad y Portales (Mes 2)
*Objetivo: Servir a todos los actores del ecosistema.*

### 3.1 Mobile First Real
- [ ] **Tablas Responsivas:** Convertir filas de tablas en tarjetas detalladas en móviles.
- [ ] **Bottom Navigation:** Menú inferior fijo en móviles para acciones rápidas.
- [ ] **Touch Areas:** Aumentar tamaño de botones táctiles (min 44px).

### 3.2 Portales Específicos
- [ ] **Portal Inquilino:** Finalizar dashboard de pagos e incidencias.
- [ ] **Portal Propietario:** Vistas simplificadas de rentabilidad y documentos.
- [ ] **Portal Proveedor:** Gestión de órdenes de trabajo (Aceptar/Rechazar) desde móvil.

---

## 🤖 Fase 4: Diferenciación (IA & Automatización) (Mes 3)
*Objetivo: "Wow factor" y productividad.*

### 4.1 Integración IA
- [ ] **Chatbot Contextual:** Asistente que conoce el contexto de la página actual (ej: en /propiedades, ayuda a crear una nueva).
- [ ] **Generador de Descripciones:** Botón "Mejorar con IA" en formularios de propiedades.
- [ ] **Análisis Predictivo:** Widgets de gráficas mostrando tendencias de precios/ocupación (usando endpoints de predicción existentes).

---

## 🛠️ Stack Tecnológico Frontend Recomendado

| Capa | Tecnología | Estado |
|------|------------|--------|
| **Core** | Next.js 14 (App Router) | ✅ Instalado |
| **UI Kit** | Shadcn UI + Tailwind | ✅ Instalado |
| **Data Fetching** | TanStack Query v5 | ✅ Instalado (usar más) |
| **Forms** | React Hook Form + Zod | ✅ Instalado |
| **Charts** | Recharts / Tremor | ⚠️ Instalar Tremor |
| **Maps** | React Map GL / Leaflet | ⚠️ Definir |
| **Tables** | TanStack Table v8 | ✅ Instalado |

---

## 📝 Primer Paso Inmediato (Quick Win)
**"Conectar Propiedades"**: Transformar `app/dashboard/properties/page.tsx` de un texto estático a una tabla viva conectada a `/api/v1/properties`. Esto validará la arquitectura de datos para el resto de la app.
