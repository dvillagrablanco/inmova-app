# Sistema de Partners B2B - INMOVA

## 🎯 Descripción General

El **Sistema de Partners B2B** de INMOVA permite que bancos, multifamily offices, plataformas de membresía y otras entidades puedan ofrecer la plataforma INMOVA a sus clientes, generando **ingresos recurrentes** sin inversión inicial.

## 💡 Concepto

Es un modelo **B2B2C** (Business to Business to Consumer) donde:

- **INMOVA** → Proveedor de la plataforma SaaS
- **Partners** (Bancos, Offices, etc.) → Intermediarios con acceso a clientes potenciales
- **Clientes Finales** → Propietarios inmobiliarios que usan INMOVA

### Flujo de Valor

```
┌────────────────┐
│   PARTNER      │  Ofrece plataforma a sus clientes
│  (Banco, etc)  │  Genera valor agregado
│                │  Recibe 20-70% de comisión
└─────┬───────────┘
     │
     │ Invita
     │
     ↓
┌─────┴───────────┐
│ CLIENTE FINAL  │  Usa INMOVA para gestionar propiedades
│  (Propietario)  │  Paga 149€/mes (Plan Profesional)
│                │
└────────────────┘
```

---

## 📊 Modelo de Comisiones

### Escala de Comisiones por Volumen

| Clientes Activos | % Comisión Partner | Ingreso/Cliente (149€ plan) |
|------------------|--------------------|--------------------------|
| 1-10             | 20%                | €29.80/mes              |
| 11-25            | 30%                | €44.70/mes              |
| 26-50            | 40%                | €59.60/mes              |
| 51-100           | 50%                | €74.50/mes              |
| 101-250          | 60%                | €89.40/mes              |
| 251+             | 70%                | €104.30/mes             |

### Ejemplos de Ingresos

#### Caso 1: Banco con 50 clientes
```
Clientes activos: 50
Comisión: 40%
Ingreso mensual: 50 × 59.60€ = €2,980/mes
Ingreso anual: €35,760/año
```

#### Caso 2: Multifamily Office con 100 clientes
```
Clientes activos: 100
Comisión: 50%
Ingreso mensual: 100 × 74.50€ = €7,450/mes
Ingreso anual: €89,400/año
```

#### Caso 3: Plataforma con 250 clientes
```
Clientes activos: 250
Comisión: 60%
Ingreso mensual: 250 × 89.40€ = €22,350/mes
Ingreso anual: €268,200/año
```

---

## 🛠️ Arquitectura Técnica

### Modelos de Base de Datos

```prisma
model Partner {
  id                    String
  nombre                String
  razonSocial           String
  cif                   String
  tipo                  PartnerType
  contactoNombre        String
  contactoEmail         String
  email                 String
  password              String
  comisionPorcentaje    Float
  estado                PartnerStatus
  activo                Boolean
  logo                  String?
  coloresPrimarios      Json?
  dominioPersonalizado  String?
  
  clientes              PartnerClient[]
  invitaciones          PartnerInvitation[]
  comisiones            Commission[]
}

model PartnerClient {
  id                    String
  partnerId             String
  companyId             String
  estado                String
  totalComisionGenerada Float
  fechaActivacion       DateTime
}

model Commission {
  id              String
  partnerId       String
  companyId       String
  periodo         String
  montoBruto      Float
  porcentaje      Float
  montoComision   Float
  estado          CommissionStatus
  fechaPago       DateTime?
  clientesActivos Int
}

model PartnerInvitation {
  id              String
  partnerId       String
  email           String
  token           String
  estado          PartnerInvitationStatus
  enviadoFecha    DateTime
  aceptadoFecha   DateTime?
  expiraFecha     DateTime
}
```

### APIs Principales

| Endpoint | Método | Descripción | Auth |
|----------|--------|-------------|------|
| `/api/partners/register` | POST | Registro de nuevo Partner | No |
| `/api/partners/login` | POST | Login y obtención de token | No |
| `/api/partners/dashboard` | GET | Dashboard con métricas | Sí |
| `/api/partners/invitations` | POST | Enviar invitación | Sí |
| `/api/partners/invitations` | GET | Listar invitaciones | Sí |
| `/api/partners/commissions` | GET | Listar comisiones | Sí |
| `/api/partners/accept-invitation` | GET | Verificar invitación | No |
| `/api/partners/accept-invitation` | POST | Aceptar invitación | No |
| `/api/partners/calculate-commissions` | POST | Calcular comisiones (CRON) | Admin |

---

## 🚦 Flujo de Implementación

### 1. Registro de Partner

1. Partner accede a `/partners-program` (landing page)
2. Hace clic en "Regístrate"
3. Completa formulario en `/partners/register`
4. Sistema crea Partner con estado `PENDING`
5. Admin de INMOVA revisa y aprueba
6. Partner cambia a estado `ACTIVE`

### 2. Invitación de Clientes

1. Partner accede a su dashboard `/partners/dashboard`
2. Va a sección de Invitaciones
3. Completa formulario con:
   - Email del cliente
   - Nombre (opcional)
   - Mensaje personalizado (opcional)
4. Sistema genera token único
5. (Futuro) Se envía email con link:
   ```
   https://inmova.app/partners/accept/{token}
   ```
6. Invitación queda en estado `PENDING`

### 3. Aceptación de Invitación
1. Cliente recibe email y hace clic en el link
2. Sistema verifica token en `/partners/accept/{token}`
3. Cliente ve información del Partner (logo, mensaje)
4. Cliente completa formulario de registro:
   - Nombre de empresa
   - Email
   - Contraseña
   - Teléfono (opcional)
   - Dirección (opcional)
5. Sistema crea:
   - `Company` (nueva empresa cliente)
   - `User` (usuario administrador)
   - `PartnerClient` (vinculación Partner-Cliente)
6. Invitación cambia a estado `ACCEPTED`
7. Cliente puede hacer login en `/login`

### 4. Cálculo de Comisiones (Automatizado)

1. **CRON job** llama a `/api/partners/calculate-commissions` (primer día de cada mes)
2. Sistema obtiene todos los Partners activos
3. Para cada Partner:
   - Cuenta clientes activos
   - Determina % de comisión según escala
   - Para cada cliente activo:
     - Calcula comisión (149€ × %)
     - Crea registro en `Commission` con estado `PENDING`
4. Partners pueden ver comisiones en su dashboard
5. Admin de INMOVA aprueba comisiones (estado `APPROVED`)
6. Se procesan pagos (estado `PAID`)

---

## 💻 Interfaces de Usuario

### Para Partners

#### 1. Landing Page: `/partners-program`
- Información del programa
- Beneficios y comisiones
- Perfiles objetivo
- CTA de registro

#### 2. Login: `/partners/login`
- Email y contraseña
- Redirección a dashboard

#### 3. Registro: `/partners/register`
- Datos de empresa
- Contacto principal
- Credenciales de acceso

#### 4. Dashboard: `/partners/dashboard`
- Métricas principales:
  - Clientes activos
  - Comisión del mes
  - Comisión total generada
  - Pendiente de pago
- Clientes recientes
- Invitaciones recientes
- Historial de comisiones

#### 5. Clientes: `/partners/clients`
- Lista de todos los clientes
- Filtro y búsqueda
- Estado de cada cliente
- Comisión generada por cliente

#### 6. Invitaciones: `/partners/invitations`
- Formulario para nueva invitación
- Historial de invitaciones
- Estados: Pendiente, Aceptada, Expirada
- Tasa de conversión

#### 7. Comisiones: `/partners/commissions`
- Lista de todas las comisiones
- Filtros por estado y periodo
- Totales por estado
- Información de pago

#### 8. Configuración: `/partners/settings`
- Información del Partner
- Contacto
- Configuración de comisiones
- Estado de la cuenta

### Para Clientes Finales

#### 9. Aceptar Invitación: `/partners/accept/{token}`
- Verificación de invitación
- Información del Partner
- Formulario de registro
- Creación de cuenta

---

## 🔒 Seguridad

### Autenticación
- Partners usan JWT con expiración de 7 días
- Token en header: `Authorization: Bearer {token}`
- Todas las contraseñas hasheadas con bcrypt

### Autorización
- Cada endpoint verifica el token JWT
- Partners solo pueden ver sus propios datos
- Clientes finales usan sistema de autenticación normal de INMOVA

### Invitaciones
- Token único generado con `crypto.randomBytes(32)`
- Expiración automática a los 30 días
- Verificación de estado antes de aceptar
- Un solo uso por invitación

---

## 📝 Documentación Adicional

- **API Documentation:** Ver archivo `PARTNERS_API_DOCUMENTATION.md`
- **Business Model:** Ver archivo `MODELO_NEGOCIO_B2B_PARTNERS.md`

---

## 🚀 Casos de Uso

### Caso 1: Banco Santander

**Contexto:**
Banco Santander quiere ofrecer a sus clientes con hipotecas una herramienta profesional de gestión inmobiliaria.

**Implementación:**
1. Se registra en `/partners/register`
2. INMOVA aprueba el Partner
3. Configura personalización (logo, colores)
4. Invita a 1,000 clientes desde su CRM
5. 150 clientes aceptan (15% conversión)
6. Cada cliente paga 149€/mes
7. Banco recibe 60% = 89.40€/cliente
8. **Ingreso mensual: €13,410**
9. **Ingreso anual: €160,920**

### Caso 2: Zona 3 (Coworking)

**Contexto:**
Plataforma de coworking quiere ofrecer a sus miembros (freelancers, startups) una forma de gestionar alquileres.

**Implementación:**
1. Se registra como Partner
2. Añade beneficio en su app de miembros
3. Invita a 500 miembros vía email masivo
4. 50 miembros activan (10% conversión)
5. Cada uno paga 149€/mes
6. Zona 3 recibe 40% = 59.60€/cliente
7. **Ingreso mensual: €2,980**
8. **Ingreso anual: €35,760**

---

## 🔧 Comandos y Scripts

### Desarrollo

```bash
# Compilar Prisma
cd nextjs_space
yarn prisma generate

# Aplicar cambios al schema
yarn prisma db push

# Ejecutar seed (crear Partners de ejemplo)
yarn prisma db seed

# Iniciar desarrollo
yarn dev
```

### Producción
```bash
# Build
yarn build

# Iniciar servidor
yarn start
```

### CRON Job para Comisiones

**Configurar en servidor (ejemplo con cron):**

```bash
# Editar crontab
crontab -e

# Añadir tarea (primer día del mes a las 00:00)
0 0 1 * * curl -X POST https://inmova.app/api/partners/calculate-commissions -H "Authorization: Bearer {admin-token}"
```

---

## 📊 KPIs del Sistema

### Métricas de Partners

- **Total Partners activos:** Cuantos Partners tienen estado `ACTIVE`
- **Total clientes B2B:** Suma de clientes de todos los Partners
- **Tasa de conversión invitaciones:** (Aceptadas / Enviadas) × 100
- **MRR Partners:** Ingreso mensual recurrente total de Partners
- **ARR Partners:** Ingreso anual recurrente total de Partners

### Métricas de Comisiones

- **Comisiones pendientes:** Total en estado `PENDING`
- **Comisiones aprobadas:** Total en estado `APPROVED`
- **Comisiones pagadas:** Total en estado `PAID`
- **Comisión promedio por Partner:** Total comisiones / Nº Partners

### Métricas de Invitaciones

- **Invitaciones enviadas:** Total creadas
- **Invitaciones aceptadas:** Total con estado `ACCEPTED`
- **Invitaciones expiradas:** Total con estado `EXPIRED`
- **Tiempo medio de aceptación:** (Aceptado - Enviado) promedio

---

## 🔮 Roadmap Futuro

### Fase 1 (Actual) ✅
- [x] Sistema completo de Partners
- [x] Dashboard de Partners
- [x] Sistema de invitaciones
- [x] Cálculo automático de comisiones
- [x] Landing page de Partners

### Fase 2 (Q1 2026)
- [ ] Sistema de emails automáticos para invitaciones
- [ ] White Label completo con dominio personalizado
- [ ] API pública para Partners
- [ ] Integración con sistemas CRM de Partners
- [ ] Materiales de marketing personalizados

### Fase 3 (Q2 2026)
- [ ] Sistema de pagos automático de comisiones
- [ ] Dashboard analítico avanzado para Partners
- [ ] Programa de afiliados de segundo nivel
- [ ] Marketplace de Partners
- [ ] Certificaciones y formaciones para Partners

---

## 👥 Partners de Ejemplo (Seed)

### 1. Banco Santander
- **Email:** partners@bancosantander.es
- **Password:** Partner2025!
- **Tipo:** Banco
- **Estado:** ACTIVE
- **Comisión:** 60%

### 2. Abante Asesores
- **Email:** partners@abanteasesores.com
- **Password:** Partner2025!
- **Tipo:** Multifamily Office
- **Estado:** ACTIVE
- **Comisión:** 50%

### 3. Zona 3
- **Email:** partners@zona3.com
- **Password:** Partner2025!
- **Tipo:** Plataforma Membresía
- **Estado:** ACTIVE
- **Comisión:** 40%

### 4. Nuevo Consultor Inmobiliario
- **Email:** partners@nuevoconsultor.com
- **Password:** Partner2025!
- **Tipo:** Consultora
- **Estado:** PENDING
- **Comisión:** 20%

---

## 📞 Contacto y Soporte

**Para Partners:**
- Email: partners@inmova.com
- Teléfono: +34 900 123 456
- Portal: https://inmova.app/partners
- Documentación: https://docs.inmova.app/partners

**Para Soporte Técnico:**
- Email: soporte@inmova.com
- Teléfono: +34 910 000 000

---

© 2025 INMOVA - Enxames Investments SL
