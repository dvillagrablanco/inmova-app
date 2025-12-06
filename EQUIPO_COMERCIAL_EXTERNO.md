# Módulo de Equipo Comercial Externo

## 📚 Descripción

Sistema completo para gestionar comerciales autónomos externos que captan clientes para INMOVA a cambio de comisiones por éxito.

## ✨ Características Principales

### 1. Gestión de Comerciales
- Registro completo de comerciales autónomos
- Datos personales y fiscales (DNI, IBAN, dirección)
- Código de referido único para tracking
- Configuración personalizada de comisiones
- Estados: ACTIVO, INACTIVO, SUSPENDIDO, CANCELADO
- Métricas acumuladas (leads, conversiones, tasa de conversión)

### 2. Gestión de Leads
- Registro de leads captados por cada comercial
- Estados del lead: NUEVO, CONTACTADO, CALIFICADO, DEMO, PROPUESTA, NEGOCIACION, CERRADO_GANADO, CERRADO_PERDIDO
- Priorización: Baja, Media, Alta
- Tracking de interacciones (llamadas, emails, reuniones)
- Probabilidad de cierre
- Conversión a cliente con generación automática de comisión

### 3. Sistema de Comisiones
- **Comisión de Captación**: Pago fijo por cada cliente conseguido (€150-200)
- **Comisión Recurrente**: Porcentaje mensual del MRR del cliente (10-12%)
- **Bonificaciones**: Por cumplimiento de objetivos mensuales (€500-600)
- Estados: PENDIENTE, APROBADA, PAGADA, CANCELADA, RETENIDA
- Retención IRPF automática (15%)
- Sistema de aprobación y pago

### 4. Objetivos de Ventas
- Objetivos mensuales personalizados
- Tracking automático de progreso
- Métricas: Leads, Conversiones, MRR generado
- Porcentajes de cumplimiento
- Generación automática de bonificaciones

### 5. Dashboards
- **Dashboard Administrativo**: Vista general del equipo comercial
- **Dashboard Personal**: Para cada comercial con sus métricas
- Estadísticas en tiempo real
- Top performers
- Alertas y notificaciones

## 💾 Base de Datos

### Modelos Prisma Creados

1. **SalesRepresentative**: Comercial externo
2. **SalesLead**: Lead captado
3. **SalesCommission**: Comisiones
4. **SalesTarget**: Objetivos de ventas

### Enums Creados

- `SalesRepStatus`: ACTIVO, INACTIVO, SUSPENDIDO, CANCELADO
- `LeadStatus`: NUEVO, CONTACTADO, CALIFICADO, DEMO, PROPUESTA, NEGOCIACION, CERRADO_GANADO, CERRADO_PERDIDO, DESCARTADO
- `SalesCommissionType`: CAPTACION, RECURRENTE, REACTIVACION, BONIFICACION
- `SalesCommissionStatus`: PENDIENTE, APROBADA, PAGADA, CANCELADA, RETENIDA

## 🔧 Archivos Creados

### Backend

#### Schema y Servicios
```
prisma/schema.prisma                                    # Modelos de datos (líneas 9784-10059)
lib/services/sales-team-service.ts                      # Lógica de negocio
```

#### APIs REST
```
pages/api/sales-team/
  ├── dashboard.ts                                   # Dashboard administrativo
  ├── representatives/
  │   ├── index.ts                                 # Listar/crear comerciales
  │   ├── [id].ts                                  # Detalle/actualizar comercial
  │   └── [id]/dashboard.ts                        # Dashboard del comercial
  ├── leads/
  │   ├── index.ts                                 # Listar/crear leads
  │   ├── [id].ts                                  # Detalle/actualizar lead
  │   ├── [id]/convert.ts                          # Convertir lead a cliente
  │   └── [id]/interaction.ts                      # Registrar interacción
  └── commissions/
      ├── index.ts                                 # Listar/crear comisiones
      ├── [id]/approve.ts                          # Aprobar comisión
      └── [id]/pay.ts                              # Marcar como pagada
```

### Frontend - Administración

```
pages/admin/sales-team/
  ├── index.tsx                                      # Dashboard principal
  ├── representatives/
  │   └── index.tsx                                # Lista de comerciales + formulario crear
  ├── leads/
  │   └── index.tsx                                # Lista de leads con filtros
  └── commissions/
      └── index.tsx                                # Lista de comisiones + aprobar/pagar
```

### Frontend - Portal Comercial

```
pages/sales-portal/
  ├── index.tsx                                      # Dashboard del comercial
  └── leads/
      └── new.tsx                                   # Formulario crear lead
```

### Scripts

```
scripts/seed-sales-team.ts                              # Seed con datos de prueba
```

## 🚀 Cómo Usar

### 1. Acceso Administrativo

1. Iniciar sesión como `super_admin` o `administrador`
2. En el menú lateral, ir a **"Equipo Comercial Externo"**
3. Acceder a:
   - Dashboard general con estadísticas
   - Gestión de comerciales
   - Gestión de leads
   - Gestión de comisiones

### 2. Crear un Comercial

1. Ir a **Equipo Comercial Externo > Comerciales**
2. Clic en **"Nuevo Comercial"**
3. Completar formulario:
   - Datos personales (nombre, DNI, email, teléfono)
   - Datos fiscales (IBAN, dirección)
   - Configuración de comisiones (opcional, usa valores por defecto)
4. Se genera automáticamente:
   - Código de referido único
   - Objetivos mensuales para los próximos 3 meses

### 3. Gestionar Leads

#### Como Administrador:
1. Ver todos los leads en **Equipo Comercial Externo > Leads**
2. Filtrar por estado, prioridad, conversión
3. Ver detalle y actualizar estado
4. Convertir lead a cliente (genera comisión automáticamente)

#### Como Comercial:
1. Acceder al Portal Comercial (`/sales-portal`)
2. Crear nuevos leads desde **"Nuevo Lead"**
3. Ver y gestionar leads propios
4. Ver comisiones generadas

### 4. Sistema de Comisiones

#### Generación Automática:
- **Captación**: Se genera automáticamente al convertir un lead
- **Recurrente**: Ejecutar manualmente `generateRecurrentCommissions(periodo)`
- **Bonificación**: Ejecutar manualmente `processBonifications(periodo)`

#### Flujo de Aprobación:
1. Comisión se crea con estado **PENDIENTE**
2. Administrador la revisa y **APRUEBA**
3. Administrador registra el pago y la marca como **PAGADA**

### 5. Ejecutar Seed de Prueba

```bash
cd /home/ubuntu/homming_vidaro/nextjs_space
yarn ts-node scripts/seed-sales-team.ts
```

Esto creará:
- 3 comerciales de prueba
- 15 leads (5 por comercial)
- 2 comisiones pendientes
- 3 objetivos mensuales

**Credenciales de prueba:**
- Email: `carlos.rodriguez@comercial.com`
- Contraseña: `comercial123`

## 📊 Funcionalidades del Servicio

### Comerciales
- `createSalesRepresentative()`: Crear comercial
- `updateSalesRepresentative()`: Actualizar datos
- `changeSalesRepPassword()`: Cambiar contraseña
- `updateSalesRepStatus()`: Cambiar estado
- `getSalesRepresentatives()`: Listar con filtros
- `getSalesRepresentativeById()`: Obtener detalle
- `updateSalesRepMetrics()`: Actualizar métricas

### Leads
- `createLead()`: Crear lead
- `updateLeadStatus()`: Actualizar estado
- `updateLead()`: Actualizar información
- `registerLeadInteraction()`: Registrar llamada/email/reunión
- `convertLead()`: Convertir a cliente
- `getLeads()`: Listar con filtros
- `getLeadById()`: Obtener detalle

### Comisiones
- `createCommission()`: Crear comisión
- `approveCommission()`: Aprobar
- `markCommissionPaid()`: Marcar como pagada
- `cancelCommission()`: Cancelar
- `getCommissions()`: Listar con filtros
- `generateRecurrentCommissions()`: Generar comisiones mensuales

### Objetivos
- `createSalesTarget()`: Crear objetivo
- `updateTargetProgress()`: Actualizar progreso
- `processBonifications()`: Procesar bonificaciones
- `getSalesTargets()`: Listar objetivos

### Dashboards
- `getSalesRepDashboard()`: Dashboard del comercial
- `getAdminDashboard()`: Dashboard administrativo

## 🔐 Permisos

### Administración (`super_admin` y `administrador`)
- Acceso completo a todas las funcionalidades
- Crear/editar/eliminar comerciales
- Ver todos los leads
- Aprobar y pagar comisiones
- Convertir leads a clientes

### Comercial (autenticación propia)
- Ver su propio dashboard
- Crear y gestionar sus leads
- Ver sus comisiones
- Ver sus objetivos

## 💰 Esquema de Comisiones

### Valores por Defecto

| Tipo | Valor | Descripción |
|------|-------|-------------|
| Captación | €150 | Pago fijo por cliente conseguido |
| Recurrente | 10% | Del MRR mensual del cliente |
| Bonificación | €500 | Por cumplir objetivos mensuales |
| IRPF | 15% | Retención automática |

### Objetivos Mensuales por Defecto

- **Leads**: 10 por mes
- **Conversiones**: 2 por mes
- **MRR**: Variable según comercial

## ⚡ Automatizaciones Implementadas

1. **Generación de Código de Referido**: Automático al crear comercial
2. **Creación de Objetivos**: Se crean automáticamente para 3 meses al crear comercial
3. **Comisión de Captación**: Se genera al convertir lead a cliente
4. **Actualización de Métricas**: Se actualizan al crear leads o comisiones
5. **Actualización de Objetivos**: Se actualiza progreso al convertir leads

## 📝 Tareas Pendientes (Futuras Mejoras)

1. **Portal de Comercial Completo**:
   - Página de detalle de lead
   - Página de listado de comisiones
   - Página de objetivos
   - Autenticación propia (NextAuth para comerciales)

2. **Automatizaciones**:
   - Cron job para comisiones recurrentes mensuales
   - Cron job para bonificaciones al fin de mes
   - Notificaciones automáticas (email/SMS)

3. **Reportes**:
   - Exportar comisiones a CSV/PDF
   - Informes mensuales por comercial
   - Gráficas de rendimiento

4. **Integraciones**:
   - Integración con sistema de pagos (transferencias bancarias)
   - Integración con CRM externo
   - Webhooks para eventos importantes

5. **Móvil**:
   - App móvil para comerciales
   - Escaneo de tarjetas de visita
   - Geolocalización de visitas

## 👥 Soporte y Contacto

Para cualquier duda o soporte sobre el módulo de Equipo Comercial Externo, contactar al equipo de desarrollo de INMOVA.

---

**Versión**: 1.0.0  
**Fecha de Creación**: Diciembre 2024  
**Estado**: Funcional - En Producción
