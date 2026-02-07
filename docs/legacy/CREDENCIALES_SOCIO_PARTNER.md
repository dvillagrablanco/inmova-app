# 👥 CREDENCIALES DE LOGIN PARA SOCIO - PARTNER

**Fecha:** 26 Diciembre 2025  
**Sistema:** INMOVA - Portal de Partners  
**Estado:** ✅ **LISTO PARA USAR**

---

## 🔐 CREDENCIALES DEL SOCIO

### Opción 1: Partner Demo (Ya Creado)
```
URL: https://tu-dominio.com/partners/login
Email: partner@demo.com
Password: Partner123!
Tipo: BANCO
```

### Opción 2: Crear Nuevo Partner

#### Método A: Registro Público
1. Ir a: `https://tu-dominio.com/partners/register`
2. Completar formulario:
   - Nombre: (ej: "Mi Banco SA")
   - Razón Social: (ej: "Mi Banco Sociedad Anónima")
   - CIF: (ej: "B12345678")
   - Tipo: BANCO / MULTIFAMILY_OFFICE / PLATAFORMA_MEMBRESIA / OTRO
   - Contacto Nombre: (ej: "Juan Pérez")
   - Contacto Email: (ej: "juan@mibanco.com")
   - Contacto Teléfono: (ej: "+34 600 123 456")
   - Email login: (ej: "partner@mibanco.com")
   - Password: (mínimo 8 caracteres)
3. Enviar → Estado: PENDING (requiere aprobación admin)
4. Admin aprueba desde `/admin/partners` (si existe)
5. Login habilitado

#### Método B: Creación Directa en DB (Desarrollo)

**Script SQL para crear partner directamente:**

```sql
-- Generar hash de password (usar bcrypt con cost 10)
-- Para password "MiPassword123!" el hash sería algo como:
-- $2a$10$xxx...

INSERT INTO "Partner" (
  id,
  nombre,
  "razonSocial",
  cif,
  tipo,
  "contactoNombre",
  "contactoEmail",
  "contactoTelefono",
  email,
  password,
  "comisionPorcentaje",
  estado,
  activo,
  "createdAt",
  "updatedAt"
) VALUES (
  gen_random_uuid(),
  'Socio Comercial Demo',
  'Socio Comercial SL',
  'B98765432',
  'OTRO',
  'Contacto Demo',
  'contacto@socio.com',
  '+34 600 000 000',
  'socio@inmova.com',
  '$2a$10$XYZ...', -- Hash de "SocioPass123!"
  20.0,
  'ACTIVE',
  true,
  NOW(),
  NOW()
);
```

#### Método C: API de Registro

```bash
curl -X POST https://tu-dominio.com/api/partners/register \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Mi Partner",
    "razonSocial": "Mi Partner SL",
    "cif": "B11111111",
    "tipo": "BANCO",
    "contactoNombre": "Juan López",
    "contactoEmail": "juan@partner.com",
    "contactoTelefono": "+34 600 111 222",
    "email": "partner@mipartner.com",
    "password": "MiPassword123!"
  }'
```

**Respuesta:**
```json
{
  "message": "Partner registrado correctamente. Pendiente de aprobación.",
  "partner": {
    "id": "clxxx...",
    "nombre": "Mi Partner",
    "email": "partner@mipartner.com",
    "estado": "PENDING"
  }
}
```

---

## 🎯 FUNCIONALIDADES DEL PORTAL DE PARTNERS

### Dashboard Principal
**URL:** `/partners/dashboard`

**Funcionalidades:**
- ✅ Métricas generales:
  - Total de clientes referidos
  - Comisiones del mes
  - Comisiones históricas
  - Pendientes de pago
  - Invitaciones pendientes/aceptadas
  - Tasa de conversión
- ✅ Lista de clientes recientes
- ✅ Lista de comisiones
- ✅ Invitaciones enviadas

**Vista:**
```
┌─────────────────────────────────────────────────┐
│  Dashboard de Partner                    [👤]  │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ │
│  │   12   │ │ €2,400 │ │ €12,000│ │  €800  │ │
│  │Clientes│ │ Este   │ │Históric│ │Pendiente│ │
│  │        │ │  Mes   │ │   o    │ │  Pago  │ │
│  └────────┘ └────────┘ └────────┘ └────────┘ │
│                                                 │
│  Clientes Recientes:                           │
│  • Empresa ABC - Plan Pro - Activo            │
│  • Empresa XYZ - Plan Enterprise - Activo      │
│                                                 │
│  Comisiones del Mes:                           │
│  • 15 Dic - €200 - Empresa ABC                │
│  • 01 Dic - €400 - Empresa XYZ                │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

### Clientes
**URL:** `/partners/clients`

**Funcionalidades:**
- ✅ Lista de todos los clientes referidos
- ✅ Estado de cada cliente (activo, suspendido, cancelado)
- ✅ Fecha de activación
- ✅ Total de comisiones generadas por cliente
- ✅ Búsqueda y filtros

**Vista:**
```
┌─────────────────────────────────────────────────┐
│  Mis Clientes                         [+Invitar]│
├─────────────────────────────────────────────────┤
│  🔍 [Buscar cliente...]        [Estado▼]       │
├─────────────────────────────────────────────────┤
│                                                 │
│  Cliente          Plan       Estado   Comisión │
│  ─────────────────────────────────────────────  │
│  Empresa ABC      Pro        ✅ Activo  €2,400 │
│  Empresa XYZ      Enterprise ✅ Activo  €4,800 │
│  Empresa 123      Standard   ⏸ Suspnd  €1,200  │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

### Comisiones
**URL:** `/partners/commissions`

**Funcionalidades:**
- ✅ Historial completo de comisiones
- ✅ Desglose por cliente y fecha
- ✅ Total por período
- ✅ Estado de pago
- ✅ Exportar a CSV

**Vista:**
```
┌─────────────────────────────────────────────────┐
│  Comisiones                       [Exportar CSV]│
├─────────────────────────────────────────────────┤
│  Período: [Diciembre 2025 ▼]                   │
│                                                 │
│  Total del período: €2,400                     │
│  Pagadas: €1,600                               │
│  Pendientes: €800                              │
├─────────────────────────────────────────────────┤
│                                                 │
│  Fecha     Cliente        Monto    Estado      │
│  ──────────────────────────────────────────     │
│  15 Dic    Empresa ABC    €200     ✅ Pagado   │
│  10 Dic    Empresa XYZ    €400     ✅ Pagado   │
│  05 Dic    Empresa 123    €100     ⏳ Pendient │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

### Invitaciones
**URL:** `/partners/invitations`

**Funcionalidades:**
- ✅ Enviar invitaciones por email
- ✅ Ver estado de invitaciones:
  - PENDING (enviada, no aceptada)
  - ACCEPTED (cliente registrado)
  - EXPIRED (venció el token)
  - CANCELLED (cancelada por el partner)
- ✅ Reenviar invitaciones
- ✅ Tracking de conversión

**Vista:**
```
┌─────────────────────────────────────────────────┐
│  Invitaciones                    [Nueva Invitación]│
├─────────────────────────────────────────────────┤
│                                                 │
│  📧 Nueva Invitación                           │
│  ┌─────────────────────────────────────────┐  │
│  │ Email: [___________________________]    │  │
│  │ Nombre: [_________________________]     │  │
│  │ Teléfono: [_______________________]     │  │
│  │ Mensaje: [_________________________]    │  │
│  │          [_________________________]    │  │
│  │                        [Enviar Invitación]│  │
│  └─────────────────────────────────────────┘  │
│                                                 │
│  Invitaciones Enviadas:                        │
│  Email              Estado    Fecha    Acción  │
│  ──────────────────────────────────────────    │
│  juan@empresa.com   ✅ Aceptada  10 Dic [Ver] │
│  maria@empresa.com  ⏳ Pendiente 15 Dic [Reenviar]│
│  pedro@empresa.com  ❌ Expirada  01 Dic [Reenviar]│
│                                                 │
└─────────────────────────────────────────────────┘
```

---

### Configuración
**URL:** `/partners/settings`

**Funcionalidades:**
- ✅ Editar información del partner
- ✅ Cambiar contraseña
- ✅ Configurar white label (si está habilitado):
  - Logo personalizado
  - Colores primarios
  - Dominio personalizado
- ✅ Ver configuración de comisiones
- ✅ Ver API keys (si aplica)

**Vista:**
```
┌─────────────────────────────────────────────────┐
│  Configuración                        [Guardar] │
├─────────────────────────────────────────────────┤
│                                                 │
│  Información del Partner                       │
│  • Nombre: [Mi Partner____________]           │
│  • Razón Social: [Mi Partner SL___]           │
│  • CIF: [B11111111___]                        │
│  • Email: [partner@mipartner.com_]            │
│                                                 │
│  Contacto Principal                            │
│  • Nombre: [Juan López___________]            │
│  • Email: [juan@partner.com______]            │
│  • Teléfono: [+34 600 111 222___]             │
│                                                 │
│  Comisiones                                    │
│  • Porcentaje: 20.0%                          │
│  • Umbral para tier: 1 cliente               │
│                                                 │
│  Seguridad                                     │
│  [Cambiar Contraseña]                         │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## 🔑 TIPOS DE PARTNERS

El sistema soporta diferentes tipos de partners:

### 1. BANCO
Bancos que refieren clientes del sector inmobiliario.

### 2. MULTIFAMILY_OFFICE
Family offices que gestionan múltiples patrimonios inmobiliarios.

### 3. PLATAFORMA_MEMBRESIA
Plataformas de membresía (ej: WeWork, Spaces).

### 4. GESTOR_PATRIMONIAL
Gestores de patrimonio independientes.

### 5. ASESOR_FINANCIERO
Asesores financieros que trabajan con clientes con propiedades.

### 6. OTRO
Cualquier otro tipo de partner comercial.

---

## 💰 SISTEMA DE COMISIONES

### Configuración por Defecto
- **Porcentaje:** 20% de los ingresos de INMOVA por el cliente
- **Frecuencia:** Mensual
- **Cálculo:** Sobre la suscripción del cliente

### Ejemplo de Cálculo
```
Cliente: Empresa ABC
Plan: Pro - €200/mes
Comisión Partner: 20% = €40/mes

Mes 1: €40
Mes 2: €40
Mes 3: €40
Total 3 meses: €120
```

### Comisiones Recurrentes
- ✅ Se generan mensualmente mientras el cliente esté activo
- ✅ Se detienen si el cliente suspende o cancela
- ✅ Se reanudan si el cliente reactiva

### Pago de Comisiones
- **Frecuencia:** Mensual (configurable)
- **Método:** Transferencia bancaria
- **Plazo:** 30 días tras el cierre del mes

---

## 🚀 FLUJO COMPLETO DE PARTNER

### 1. Registro
```
Partner → /partners/register → Formulario → PENDING
```

### 2. Aprobación
```
Admin → Aprueba partner → Estado: ACTIVE → Partner puede login
```

### 3. Enviar Invitaciones
```
Partner → /partners/invitations → Envía email con token único → Cliente recibe email
```

### 4. Cliente Acepta
```
Cliente → Click en link de invitación → /partners/accept/[token] → Registro de empresa → Cliente creado
```

### 5. Comisiones Generadas
```
Cliente activo → Facturación mensual → Comisión calculada automáticamente → Aparece en /partners/commissions
```

### 6. Pago de Comisiones
```
Fin de mes → Admin procesa pagos → Partner recibe transferencia → Estado: PAGADO
```

---

## 📱 ACCESO MÓVIL

El portal de partners está **optimizado para móviles** y tablets.

### Features Móviles:
- ✅ Dashboard responsive
- ✅ Enviar invitaciones desde móvil
- ✅ Ver comisiones en tiempo real
- ✅ Notificaciones push (si está configurado)
- ✅ Sidebar optimizado (después del último deployment)

---

## 🔒 SEGURIDAD

### Autenticación
- ✅ Email/Password con bcrypt (cost 10)
- ✅ Token JWT para sesiones
- ✅ Expiración de tokens
- ✅ Rate limiting en login

### Permisos
- ✅ Partners solo ven sus propios clientes
- ✅ No pueden modificar comisiones
- ✅ No pueden acceder a datos de otros partners
- ✅ Invitaciones tienen tokens únicos con expiración

### Logs y Auditoría
- ✅ Todas las acciones quedan registradas
- ✅ Tracking de invitaciones
- ✅ Historial de comisiones
- ✅ Cambios en configuración

---

## 🧪 TESTING DEL SISTEMA

### Checklist de Funcionalidades

#### Autenticación
- [ ] Login con credenciales correctas
- [ ] Login con credenciales incorrectas (debe fallar)
- [ ] Logout
- [ ] Sesión persiste al recargar página

#### Dashboard
- [ ] Métricas se cargan correctamente
- [ ] Lista de clientes visible
- [ ] Lista de comisiones visible
- [ ] Invitaciones recientes visibles

#### Clientes
- [ ] Lista de clientes completa
- [ ] Búsqueda funciona
- [ ] Filtros funcionan
- [ ] Ver detalle de cliente

#### Comisiones
- [ ] Historial completo de comisiones
- [ ] Filtro por fecha funciona
- [ ] Exportar a CSV funciona
- [ ] Totales correctos

#### Invitaciones
- [ ] Enviar nueva invitación
- [ ] Email se envía correctamente
- [ ] Token es único
- [ ] Reenviar invitación funciona
- [ ] Cliente puede aceptar invitación

#### Configuración
- [ ] Editar información del partner
- [ ] Cambiar contraseña
- [ ] Guardar cambios

---

## 🆘 TROUBLESHOOTING

### Problema 1: No puedo hacer login

**Causas posibles:**
- Partner en estado PENDING (requiere aprobación)
- Partner con activo: false
- Credenciales incorrectas
- Password mal hasheado

**Solución:**
```sql
-- Ver estado del partner
SELECT id, email, estado, activo FROM "Partner" WHERE email = 'socio@inmova.com';

-- Activar partner
UPDATE "Partner" 
SET estado = 'ACTIVE', activo = true, "fechaActivacion" = NOW()
WHERE email = 'socio@inmova.com';
```

---

### Problema 2: No veo mis clientes

**Causas posibles:**
- No hay clientes asociados al partner
- Relación PartnerClient no existe
- Filtros demasiado restrictivos

**Solución:**
```sql
-- Ver clientes del partner
SELECT pc.*, c.nombre, c.estadoCliente 
FROM "PartnerClient" pc
JOIN "Partner" p ON p.id = pc."partnerId"
JOIN "Company" c ON c.id = pc."companyId"
WHERE p.email = 'socio@inmova.com';
```

---

### Problema 3: No se generan comisiones

**Causas posibles:**
- Cliente no está activo
- No hay facturación del cliente
- Cron job de comisiones no configurado

**Solución:**
1. Verificar que el cliente esté activo
2. Verificar que haya facturación
3. Ejecutar cálculo manual de comisiones:
```bash
curl -X POST https://tu-dominio.com/api/partners/calculate-commissions \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

---

### Problema 4: Invitación expirada

**Causas posibles:**
- Token venció (30 días por defecto)
- Token ya fue usado

**Solución:**
1. Ir a `/partners/invitations`
2. Buscar la invitación expirada
3. Click en "Reenviar"
4. Se genera nuevo token con 30 días más

---

## 📚 DOCUMENTACIÓN TÉCNICA

### API Endpoints de Partners

```
POST   /api/partners/register           - Registro de partner
POST   /api/partners/login              - Login
GET    /api/partners/dashboard          - Dashboard data
GET    /api/partners/commissions        - Lista de comisiones
POST   /api/partners/invitations        - Crear invitación
GET    /api/partners/invitations        - Lista de invitaciones
POST   /api/partners/accept-invitation  - Aceptar invitación
POST   /api/partners/calculate-commissions - Calcular comisiones (admin)
```

### Modelos de Base de Datos

**Partner:**
- id, nombre, razonSocial, cif, tipo
- contactoNombre, contactoEmail, contactoTelefono
- email, password (hasheado)
- comisionPorcentaje, estado, activo
- logo, coloresPrimarios, dominioPersonalizado

**PartnerClient:**
- id, partnerId, companyId
- estado, fechaActivacion, fechaCancelacion
- totalComisionGenerada, ultimaComisionFecha

**PartnerInvitation:**
- id, partnerId, email, nombre, telefono
- token, mensaje, estado
- enviadoFecha, aceptadoFecha, expiraFecha
- companyId (si fue aceptada)

**PartnerCommission:**
- id, partnerId, companyId
- mes, monto, estado
- fechaGeneracion, fechaPago

---

## ✅ RESUMEN EJECUTIVO

### ¿Qué es el Portal de Partners?
Sistema para que **socios comerciales** (bancos, family offices, etc.) refieran clientes a INMOVA y reciban comisiones recurrentes.

### Funcionalidades Clave:
- ✅ Dashboard con métricas de clientes y comisiones
- ✅ Sistema de invitaciones por email con tokens únicos
- ✅ Tracking de conversión
- ✅ Comisiones recurrentes automáticas (20% por defecto)
- ✅ Historial completo de comisiones
- ✅ White label configurable
- ✅ Portal responsive (móvil, tablet, desktop)

### Credenciales Demo:
```
URL: https://tu-dominio.com/partners/login
Email: partner@demo.com
Password: Partner123!
```

### Para Crear Nuevo Socio:
1. Usar `/partners/register`
2. Admin aprueba
3. Partner puede hacer login

---

## 📞 SOPORTE

Si necesitas ayuda con el portal de partners:

1. **Documentación:** Este archivo
2. **Testing:** Seguir checklist de funcionalidades
3. **Troubleshooting:** Ver sección de problemas comunes
4. **Soporte técnico:** Contactar al equipo de desarrollo

---

**Última actualización:** 26 Diciembre 2025  
**Sistema:** INMOVA Partners Portal  
**Estado:** ✅ LISTO PARA PRODUCCIÓN (tras deployment del sidebar)
