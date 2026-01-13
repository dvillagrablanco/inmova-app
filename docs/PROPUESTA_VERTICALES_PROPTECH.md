# Propuesta de Simplificación de Verticales PropTech

## Estado Actual vs Propuesta

### ❌ Estado Actual (13 verticales + 9 herramientas)

El sidebar actual tiene **demasiados verticales**, muchos de los cuales NO son PropTech real:

```
VERTICALES ACTUALES:
1. Alquiler Residencial
2. STR (Alquiler Vacacional)
3. Co-Living
4. Construcción (Build-to-Rent)
5. House Flipping
6. Comercial (Servicios Profesionales)
7. Alquiler Comercial
8. Administración de Fincas
9. Student Housing
10. Viajes Corporativos ❌ (NO es PropTech)
11. Vivienda Social
12. Real Estate Developer
13. Workspace
14. Warehouse ❌ (NO es PropTech - es logística)
15. eWoorker ❌ (NO es PropTech - es marketplace de trabajo)

HERRAMIENTAS HORIZONTALES:
1. Finanzas
2. Analytics
3. Operaciones
4. Herramientas Inversión
5. Comunicaciones
6. Documentos/Legal
7. CRM/Marketing
8. Automatización
9. Innovación/Sostenibilidad
```

**Problema**: El usuario se pierde con tantas opciones y muchas no aplican a su negocio.

---

## ✅ Propuesta: Organización basada en el Sector Inmobiliario Real

### Estructura PropTech Simplificada

```
CORE PROPTECH (5 verticales principales):
├── 🏠 Gestión de Alquileres (Property Management)
│   ├── Propiedades (edificios + unidades)
│   ├── Inquilinos
│   ├── Contratos
│   ├── Pagos
│   └── Mantenimiento
│
├── 🏖️ Alquiler Vacacional (STR)
│   ├── Propiedades
│   ├── Reservas
│   ├── Canales (Airbnb, Booking)
│   └── Housekeeping
│
├── 🏢 Inmuebles Comerciales
│   ├── Oficinas/Locales/Naves
│   ├── Contratos Comerciales
│   └── Gestión de Leads
│
├── 🏘️ Comunidades de Propietarios
│   ├── Comunidades
│   ├── Juntas/Votaciones
│   └── Gastos Comunes
│
└── 📊 CRM Inmobiliario
    ├── Leads
    ├── Propiedades en venta/alquiler
    └── Visitas/Agenda

HERRAMIENTAS (colapsadas por defecto):
├── 💰 Finanzas (Pagos, Gastos, Informes)
├── 🔧 Operaciones (Mantenimiento, Proveedores)
├── 📄 Documentación (Contratos, Legal)
└── ⚙️ Configuración

MÓDULOS ESPECIALIZADOS (solo si están activados):
├── 🎓 Student Housing
├── 🏗️ Construcción/Flipping
├── 🏠 Coliving
└── 🏛️ Vivienda Social
```

---

## Beneficios de la Simplificación

| Aspecto | Antes | Después |
|---------|-------|---------|
| Verticales principales | 15+ | 5 |
| Tiempo de aprendizaje | Alto | Bajo |
| Navegación | Confusa | Clara |
| Relevancia | Baja (muchos no aplican) | Alta (todos son PropTech) |
| Onboarding | Complejo | Simple |

---

## Verticales a Eliminar o Reubicar

### ❌ Eliminar completamente:
- **Viajes Corporativos**: Es travel management, no PropTech
- **Warehouse**: Es logística/almacén, no PropTech
- **eWoorker**: Es marketplace de trabajo, no gestión inmobiliaria

### 🔄 Reubicar como módulos especializados:
- **Student Housing** → Módulo especializado (solo si activado)
- **Construcción/Flipping** → Módulo especializado
- **Coliving** → Dentro de "Alquiler por Habitaciones"
- **Vivienda Social** → Módulo especializado
- **Workspace** → Fusionar con "Inmuebles Comerciales"

---

## Implementación Recomendada

### Fase 1: Dashboard mejorado ✅
- Corregido el API `/api/dashboard` para devolver todos los datos necesarios
- KPIs funcionando correctamente

### Fase 2: Simplificación de sidebar (pendiente)
1. Ocultar verticales no-PropTech por defecto
2. Crear un sistema de "módulos activables"
3. Permitir al usuario elegir qué módulos ver

### Fase 3: Configuración por tipo de negocio
- Al registrarse, preguntar tipo de negocio:
  - Gestor de alquileres
  - Propietario individual
  - Agencia inmobiliaria
  - Administrador de fincas
- Mostrar solo los módulos relevantes

---

## Código de Referencia

Los verticales están definidos en:
- `components/layout/sidebar.tsx` (navegación)
- `lib/hooks/usePermissions.ts` (permisos)
- `prisma/schema.prisma` (módulos de empresa)

Para activar/desactivar módulos por empresa:
```typescript
// En la tabla Company
modules: ['gestion_alquileres', 'str', 'comercial', ...]
```

---

*Documento creado: 12 Enero 2026*
*Versión: 1.0*
