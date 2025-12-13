# Changelog - INMOVA

Todos los cambios notables de este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2026-01-15

### 🎉 Release Mayor - Versión INMOVA (Rebrand de Vidaro)

### Agregado

#### Módulos y Funcionalidades
- **Sistema Multi-Vertical completo** con 88 módulos profesionales
- **Módulo de Alquiler por Habitaciones (Room Rental)**
  - Gestión individual de habitaciones dentro de unidades
  - Prorrateo automático de servicios (agua, luz, gas, internet)
  - Reglas de convivencia personalizables
  - Calendario de limpieza rotativo
  - Página de detalle individual por habitación
  - UI dedicada para prorrateoimport React from 'react';
  - 📄 Documentación completa en `/MODELO_ALQUILER_HABITACIONES.md`

- **Portal del Propietario**
  - Dashboard financiero con comparaciones periódicas
  - Acceso restringido por edificios asignados
  - Reportes personalizados
  - Autenticación JWT con cookies HttpOnly

- **Panel de Super-Administrador mejorado**
  - Sistema de impersonación ("Login como")
  - Operaciones en masa (bulk operations)
  - Filtrado avanzado multi-criterio
  - Exportación a CSV
  - Dashboard con métricas globales
  - Timeline de actividad del sistema
  - Sistema de alertas automatizadas
  - 📄 Documentación en `/MEJORAS_SUPERADMIN.md`

- **Módulo de Cupones y Descuentos**
  - Creación de cupones porcentuales o de monto fijo
  - Límites de uso (total y por usuario)
  - Validación de monto mínimo
  - Aplicación a tipos específicos (renta, servicios)
  - Estadísticas de uso

- **Integraciones Contables (Preparadas)**
  - Zucchetti (con guía de activación completa)
  - ContaSimple (con botón de prueba de conexión)
  - Sage
  - Holded
  - A3 Software
  - Alegra
  - Todas funcionan en Demo Mode por defecto

- **Open Banking - Bankinter (PSD2)**
  - Verificación de ingresos de inquilinos
  - Conexión de cuentas bancarias
  - Sincronización de transacciones
  - Conciliación automática
  - 📄 Guía completa en proyecto

- **Sistema de Onboarding Interactivo**
  - Tour guiado para nuevos usuarios
  - Tooltips contextuales
  - Wizards paso a paso
  - Generador de datos de demo

- **Mejoras en OCR**
  - Soporte para PDFs
  - Soporte para DOC/DOCX
  - Extracción mejorada de DNI y contratos
  - UI unificada para todos los tipos

#### UI/UX
- **Componentes reutilizables mejorados:**
  - `LoadingState` con mensajes contextuales
  - `EmptyState` con múltiples acciones y soporte de chat
  - `FilterChips` para gestión visual de filtros
  - `ButtonWithLoading` con estados de carga
  - `ConfirmDialog` para confirmaciones seguras
  - `InfoTooltip` para ayuda contextual
  - `PaginationInfo` avanzada
  - `SearchInput` con debounce
  - `ViewModeToggle` (grid/list/compact)
  - `SkeletonCard` y `SkeletonList` para placeholders
  - `EnhancedEmptyState` con presets predefinidos
  - `MobileFormWizard` para formularios largos

- **Mejoras de Accesibilidad (WCAG 2.1 AA)**
  - Focus visible mejorado en todos los elementos interactivos
  - Skip links funcionales
  - ARIA labels en botones icon-only
  - Contraste de colores mejorado
  - Soporte para lectores de pantalla
  - Formularios accesibles con `AccessibleInputField` y `AccessibleSelectField`

- **Optimizaciones de Rendimiento**
  - Lazy loading de componentes pesados (Recharts, Tabs, Dialogs)
  - Memoización de componentes clave (`KPICard`, `DataTable`, filas de tabla)
  - Sistema de caching en memoria para APIs de dashboard
  - Invalidación selectiva de caché
  - Lazy-loaded charts en todas las páginas de análisis

- **Responsive Design**
  - Sidebar colapsable en móvil
  - Gráficos optimizados para pantallas pequeñas
  - Formularios adaptados con wizards en móvil
  - Margin izquierdo responsive (`ml-0 lg:ml-64`) en todas las páginas

- **Branding (White Label)**
  - Sistema completo de personalización de marca
  - Panel de administración en `/admin/personalizacion`
  - CSS variables dinámicas
  - Inyección de estilos en tiempo real
  - Soporte para logos, colores, tipografías, favicon

#### Landing Page Mejorado
- Diseño moderno con gradientes y animaciones
- Sección de módulos destacados por vertical
- Comparativa con competidores
- Testimonios y casos de éxito
- Páginas adicionales:
  - `/landing/sobre-nosotros` - Sobre INMOVA
  - `/landing/contacto` - Formulario de contacto
  - `/landing/demo` - Selección de demo por vertical
  - `/landing/blog` - Blog (próximamente)
  - `/landing/casos-exito` - Casos de éxito
  - `/landing/legal/*` - Políticas legales

#### Seguridad
- **Content Security Policy (CSP) estricto**
  - Implementado en middleware
  - Compatible con Edge Runtime
  - Nonces dinámicos para scripts inline

- **Protección contra Timing Attacks**
  - Delay constante en autenticación
  - Comparaciones de hash siempre ejecutadas
  - Mensajes de error genéricos

- **Rate Limiting mejorado**
  - Límites por endpoint
  - Tracking por IP y usuario
  - Headers informativos

- **Autenticación JWT para portales externos**
  - Portal del Propietario
  - Portal del Proveedor
  - Cookies HttpOnly
  - Renovación automática

#### Base de Datos
- **8 nuevos índices compuestos** para optimización de queries:
  - `Building`: `companyId + tipo + anoConstructor`
  - `Tenant`: `companyId + createdAt`
  - `Unit`: `buildingId + tipo + estado`, `rentaMensual + estado`
  - `Contract`: `estado + fechaFin`, `unitId + fechaInicio + fechaFin`
  - `Payment`: `estado + fechaVencimiento`, `nivelRiesgo + estado`

- **Nuevos modelos:**
  - `Room` - Habitaciones individuales
  - `RoomContract` - Contratos de habitaciones
  - `RoomPayment` - Pagos de habitaciones
  - `DiscountCoupon` - Sistema de cupones
  - `CouponUsage` - Registro de uso de cupones
  - `OwnerBuilding` - Relación propietarios-edificios
  - Modelos de Stripe (Customer, Subscription, WebhookEvent)
  - Modelos de integraciones contables
  - Y más...

#### Integraciones
- **Stripe:**
  - Pagos únicos y recurrentes
  - Gestión de suscripciones
  - Webhooks completamente implementados
  - Dashboard de métricas
  - Portal del inquilino con Stripe Elements

- **AWS S3:**
  - Configuración automática en producción
  - Gestión de archivos públicos y privados
  - URLs firmadas para acceso temporal

- **SendGrid:**
  - Emails transaccionales
  - Plantillas personalizables
  - Adjuntos (PDFs de recibos)

- **Google Analytics:**
  - Tracking de eventos
  - Métricas personalizadas

#### Documentación
- 🎯 `/README.md` - Guía completa de setup
- 🎯 `/.env.example` - Todas las variables documentadas
- 🎯 `/DOCS/INTEGRACIONES.md` - Guía de integraciones de terceros
- 🎯 `/MODELO_ALQUILER_HABITACIONES.md` - Módulo Room Rental
- 🎯 `/MEJORAS_SUPERADMIN.md` - Panel Super-Admin
- 🎯 `/VIDEO_SCRIPT_90_SEGUNDOS.md` - Script de video demo
- 🎯 Runbook de incidentes
- 🎯 Contactos de soporte

### Cambiado

#### Rebrand Completo
- **Vidaro → INMOVA**
- **Homming → INMOVA**
- Todos los logos actualizados
- Referencias en código cambiadas
- Metadata y SEO actualizados
- Dominio: `inmova.app`

#### Mejoras de Arquitectura
- Refactor del `Sidebar` y `Header`:
  - Exportación como named exports
  - Corrección de imports en 73 archivos
  - Lógica de navegación mejorada

- Hooks personalizados extraídos:
  - `useCompanies` - Gestión de empresas
  - `useCompanyFilters` - Filtrado de clientes
  - `useLocalStorage` - Persistencia de preferencias
  - `useBranding` - Acceso a configuración de marca

- Componentes modulares:
  - `FilterBar` - Barra de filtros reutilizable
  - `CompanyCard` - Tarjeta de empresa
  - `BackButton` - Botón de navegación consistente
  - `ChangePlanDialog` - Diálogo de cambio de plan

#### Optimizaciones de Datos
- Sistema de caching implementado (`api-cache-helpers.ts`)
- Invalidación inteligente de caché
- Queries con includes optimizados
- Paginación mejorada

#### Formularios
- Migración a `react-hook-form` + `zod`:
  - Login y Register con validación robusta
  - Esquemas de validación en `form-schemas-auth.ts`
  - Mensajes de error mejorados

- Campos accesibles:
  - `AccessibleInputField`
  - `AccessibleSelectField`
  - ARIA attributes completos
  - Errores visualmente destacados

#### Estilos y Tema
- **Paleta de colores actualizada:**
  - Primario: Indigo 600 (#4F46E5)
  - Secundario: Violet 600 (#7C3AED)
  - Accent: Pink 600 (#EC4899)
  - Gradientes personalizados

- **CSS Global (`globals.css`):**
  - Variables CSS para tematización
  - Clases utilitarias (`.gradient-primary`, `.shadow-primary`)
  - Estilos de accesibilidad (focus-visible, skip-link)
  - Modo de alto contraste
  - Respeto a `prefers-reduced-motion`

- **Tailwind Config:**
  - Tema extendido con colores de marca
  - Animaciones personalizadas
  - Breakpoints consistentes

#### Páginas Migradas a Nuevos Patrones
- `/edificios` - EmptyState, FilterChips, DeleteConfirmation
- `/unidades` - ViewModeToggle, EnhancedEmptyState
- `/inquilinos` - FilterChips mejorado
- `/contratos` - IconButton, StatusBadge
- `/pagos` - Fix de hidratación, calendario mejorado
- `/candidatos` - LoadingState, EmptyState, FilterChips
- `/documentos` - Filtros persistentes con chips
- `/proveedores` - EmptyState dinámico
- `/gastos` - FilterChips integrado
- `/mantenimiento` - ErrorBoundary, EmptyState
- `/tareas` - CRUD completo con nuevos componentes
- Y muchas más...

#### APIs
- **Todas las rutas de módulos principales ahora usan:**
  - Invalidación de caché en mutaciones
  - `export const dynamic = 'force-dynamic'` donde necesario
  - Type safety mejorado
  - Logging estructurado (`logger`, `logError`)

- **Nuevos endpoints:**
  - `/api/room-rental/*` - Gestión de habitaciones
  - `/api/coupons/*` - Sistema de cupones
  - `/api/accounting/*` - Integraciones contables
  - `/api/open-banking/*` - Bankinter PSD2
  - `/api/stripe/*` - Pagos y suscripciones
  - `/api/admin/companies/bulk` - Operaciones masivas
  - `/api/admin/impersonate` - Impersonación
  - `/api/admin/dashboard-stats` - Métricas globales
  - `/api/admin/activity-timeline` - Timeline de actividad

### Corregido

#### TypeScript
- Cientos de errores de tipo resueltos
- Imports corregidos (default → named)
- Props de componentes tipados correctamente
- Type assertions explícitos donde necesario
- `session.user.rolee` → `session.user.role` (typo global corregido)

#### Hidratación (SSR)
- **Fechas:** Inicialización en `useEffect` en vez de render
- **Valores deterministas:** Sin `Math.random()` o `Date.now()` en estado inicial
- **Select values:** Cambio de `""` a valores semánticos (`"no-unit"`, `"auto-detect"`)
- Formularios con valores controlados desde SSR

#### UI/UX
- **Contraste de colores:** Texto blanco sobre fondos claros corregido
- **Botones funcionales:** Todos tienen handlers definidos
- **Loading states:** Spinners consistentes con marca
- **Empty states:** Mensajes contextuales y acciones claras
- **Errores visuales:** Alertas destacadas con iconos

#### Seguridad
- Validación de entrada en todos los endpoints
- Sanitización de datos de usuario
- Protección CSRF via NextAuth
- XSS prevenido con CSP
- SQL injection imposible (Prisma ORM)

#### Performance
- Bundle size reducido ~30% con lazy loading
- First Contentful Paint mejorado
- Time to Interactive optimizado
- Menos re-renders innecesarios
- Queries de base de datos optimizadas con índices

#### Navegación
- Breadcrumbs correctos en todas las páginas
- Botones "Volver" consistentes
- Links internos funcionando
- Sidebar activo en ruta actual

#### Móviles
- Layout responsive en todas las páginas
- Sidebar colapsable
- Formularios con wizards
- Gráficos adaptados
- Touch targets de 44x44px mínimo

### Eliminado

- Referencias a "Vidaro" y "Homming"
- Código muerto y comentado
- Dependencias no utilizadas
- Logs de debug en producción
- Placeholders de "Lorem ipsum"

### Seguridad

- **CVE-XXXX-XXXX:** Actualización de dependencias con vulnerabilidades
- Rate limiting implementado globalmente
- Validación de permisos en todas las rutas protegidas
- Encriptación de datos sensibles en BD
- Auditoría de acciones críticas

---

## [1.5.0] - 2025-11-20

### Agregado
- Módulo de STR (Short-Term Rental)
- Sincronización con canales (Airbnb, Booking.com)
- Pricing dinámico con IA
- Módulo de House Flipping
- Módulo de Construcción
- Módulo de Servicios Profesionales

### Cambiado
- Sidebar con navegación multi-vertical
- Sistema de módulos activables por empresa

---

## [1.0.0] - 2025-09-01

### Agregado
- Release inicial de Vidaro
- Gestión básica de edificios, unidades, inquilinos
- Contratos y pagos
- Mantenimiento
- Dashboard con KPIs
- Autenticación con NextAuth
- Base de datos PostgreSQL con Prisma

---

## Formato de Changelog

### Tipos de Cambios
- `Agregado` - Nuevas funcionalidades
- `Cambiado` - Cambios en funcionalidades existentes
- `Deprecado` - Funcionalidades que serán eliminadas
- `Eliminado` - Funcionalidades eliminadas
- `Corregido` - Corrección de bugs
- `Seguridad` - Vulnerabilidades corregidas

### Versionado Semántico
- **MAJOR** (X.0.0): Cambios incompatibles con versiones anteriores
- **MINOR** (0.X.0): Nueva funcionalidad compatible
- **PATCH** (0.0.X): Correcciones de bugs compatibles

---

**Mantenido por:** Enxames Investments SL  
**Proyecto:** INMOVA - Plataforma de Gestión Inmobiliaria  
**Última actualización:** 15 de Enero de 2026
