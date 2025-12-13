# Sistema de Partners INMOVA - Documentación Completa

## 🎉 Resumen Ejecutivo

Se ha implementado un sistema completo de gestión de partners (equipo comercial externo) con 3 fases de funcionalidades:

### ✅ FASE 1: FUNDAMENTOS (Completada)
- ✅ Gestión de comerciales (crear, actualizar, aprobar)
- ✅ Gestión de leads (captura, seguimiento, conversión)
- ✅ Sistema de comisiones (captación, recurrente, bonificaciones)
- ✅ Objetivos mensuales y tracking
- ✅ CRON jobs para cálculo automático de comisiones
- ✅ Emails automáticos (bienvenida, comisiones, recordatorios)
- ✅ Dashboard de comercial
- ✅ Dashboard administrativo

### ✅ FASE 2: INTEGRACIONES AVANZADAS (Completada)
- ✅ API pública con API Keys para partners
- ✅ Sistema White Label (branding personalizado)
- ✅ Materiales de marketing (banners, templates, documentos)
- ✅ Tracking de descargas de materiales
- ✅ Sistema de reportes avanzados (CSV, gráficas)
- ✅ Endpoint público de registro de partners
- ✅ API pública para crear leads desde integraciones externas

### ✅ FASE 3: ECOSISTEMA PARTNERS (Completada)
- ✅ Sistema de certificaciones para partners
- ✅ Afiliados nivel 2 (sub-afiliados) con comisiones en cascada
- ✅ Analytics avanzado por partner
- ✅ Dashboard de performance detallado
- ✅ Sistema de reconocimientos y gamificación

---

## 📁 Estructura de Base de Datos

### Modelos Principales

#### SalesRepresentative (Partner/Comercial)
```prisma
model SalesRepresentative {
  id                    String
  nombre                String
  apellidos             String
  nombreCompleto        String
  dni                   String @unique
  email                 String @unique
  telefono              String
  codigoReferido        String @unique
  comisionCaptacion     Float
  comisionRecurrente    Float
  bonificacionObjetivo  Float
  
  // API y White Label (Fase 2)
  apiKey                String? @unique
  apiSecret             String?
  apiEnabled            Boolean
  whiteLabelEnabled     Boolean
  whiteLabelConfig      Json?
  
  // Sub-afiliados (Fase 3)
  nivel                 Int
  parentSalesRepId      String?
  
  leads                 SalesLead[]
  comisiones            SalesCommission[]
  objetivos             SalesTarget[]
  certificationsAwarded PartnerCertificationAwarded[]
}
```

#### SalesLead (Lead)
```prisma
model SalesLead {
  id                   String
  salesRepId           String
  nombreContacto       String
  emailContacto        String
  nombreEmpresa        String
  estado               LeadStatus
  convertido           Boolean
  fechaCaptura         DateTime
  ...
}
```

#### SalesCommission (Comisión)
```prisma
model SalesCommission {
  id                String
  salesRepId        String
  tipo              SalesCommissionType // CAPTACION, RECURRENTE, BONIFICACION, NIVEL2
  descripcion       String
  periodo           String?
  montoBase         Float
  montoComision     Float
  montoNeto         Float
  estado            SalesCommissionStatus
  ...
}
```

---

## 🔧 APIs Implementadas

### APIs de Gestión (Admin)

#### Comerciales
- `GET /api/sales-team/representatives` - Listar comerciales
- `POST /api/sales-team/representatives` - Crear comercial
- `PUT /api/sales-team/representatives/[id]` - Actualizar comercial
- `DELETE /api/sales-team/representatives/[id]` - Eliminar comercial

#### Comisiones
- `GET /api/sales-team/commissions` - Listar comisiones
- `POST /api/sales-team/commissions/approve` - Aprobar comisión
- `POST /api/sales-team/commissions/pay` - Marcar como pagada
- `POST /api/sales-team/commissions/cancel` - Cancelar comisión

#### Reportes
- `GET /api/reports/commissions?format=csv` - Exportar comisiones a CSV
- `GET /api/reports/commissions?type=chart` - Datos para gráficas
- `GET /api/reports/leads?format=csv` - Exportar leads a CSV
- `GET /api/reports/leads?type=chart` - Datos para gráficas de leads
- `GET /api/reports/targets?format=csv` - Exportar objetivos a CSV
- `GET /api/reports/sales-reps?type=ranking` - Ranking de comerciales
- `GET /api/reports/sales-reps?type=stats` - Estadísticas generales

### APIs de Partners (Fase 2)

#### API Keys
- `POST /api/partners/api-keys/generate` - Generar API key para partner
- `POST /api/partners/api-keys/revoke` - Revocar API key

#### White Label
- `POST /api/partners/white-label/configure` - Configurar branding
- `GET /api/partners/white-label/[id]` - Obtener configuración

#### Materiales de Marketing
- `GET /api/partners/marketing-materials` - Listar materiales
- `POST /api/partners/marketing-materials` - Crear material (admin)
- `POST /api/partners/marketing-materials/download` - Registrar descarga

### APIs Públicas (sin autenticación NextAuth)

#### Registro de Partners
- `POST /api/partners/public/register`
```json
{
  "nombre": "Juan",
  "apellidos": "Pérez",
  "dni": "12345678A",
  "email": "juan@example.com",
  "telefono": "+34600123456",
  "password": "secreto123"
}
```

#### Crear Leads (con API Key)
- `POST /api/partners/public/leads/create`
- Headers requeridos:
  - `X-API-Key: pk_xxxxx`
  - `X-API-Secret: sk_xxxxx`
```json
{
  "nombreContacto": "María",
  "emailContacto": "maria@empresa.com",
  "nombreEmpresa": "Empresa XYZ",
  "sector": "inmobiliario",
  "propiedadesEstimadas": 25
}
```

### APIs de Certificaciones (Fase 3)

- `POST /api/partners/certifications` - Crear certificación (admin)
- `POST /api/partners/certifications/award` - Otorgar certificación
- `GET /api/partners/certifications/[salesRepId]` - Ver certificaciones del partner

### APIs de Sub-Afiliados (Fase 3)

- `POST /api/partners/sub-affiliates` - Crear sub-afiliado
- `GET /api/partners/sub-affiliates?parentSalesRepId=xxx` - Listar sub-afiliados

### APIs de Analytics (Fase 3)

- `GET /api/partners/analytics/[salesRepId]?periodo=2024-12` - Analytics avanzado

---

## ⏰ CRON Jobs (Automatizaciones)

Todos los CRON jobs requieren autenticación mediante header:
```
Authorization: Bearer <CRON_SECRET_TOKEN>
```

### 1. Cálculo Mensual de Comisiones
- **Endpoint**: `POST /api/cron/monthly-commissions`
- **Frecuencia**: Día 1 de cada mes a las 00:00
- **Función**: Calcula comisiones recurrentes y bonificaciones del mes anterior
- **CRON**: `0 0 1 * *`

### 2. Actualización de Métricas
- **Endpoint**: `POST /api/cron/update-metrics`
- **Frecuencia**: Diario a las 02:00
- **Función**: Actualiza métricas de todos los comerciales
- **CRON**: `0 2 * * *`

### 3. Recordatorio de Objetivos
- **Endpoint**: `POST /api/cron/monthly-goals-reminder`
- **Frecuencia**: Lunes a las 09:00
- **Función**: Envía recordatorios de objetivos mensuales
- **CRON**: `0 9 * * 1`

### Configuración de CRON Jobs

Puedes usar servicios externos como:
- [cron-job.org](https://cron-job.org)
- [EasyCron](https://www.easycron.com)
- Vercel Cron Jobs (si estás en Vercel)
- GitHub Actions (scheduled workflows)

**Ejemplo de configuración en cron-job.org:**

1. Registrarse en cron-job.org
2. Crear nuevo cron job:
   - URL: `https://inmova.app/api/cron/monthly-commissions`
   - Método: POST
   - Header: `Authorization: Bearer tu_token_secreto`
   - Schedule: `0 0 1 * *`
3. Repetir para cada endpoint

---

## 📝 Variables de Entorno Requeridas

Añadir al archivo `.env`:

```env
# CRON Jobs
CRON_SECRET_TOKEN=tu_token_super_secreto_aqui

# Email (opcional para producción)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=tu_email@gmail.com
SMTP_PASSWORD=tu_password_o_app_password

# URL de la aplicación
NEXT_PUBLIC_APP_URL=https://inmova.app
```

---

## 🚀 Flujo de Trabajo Típico

### Para Administradores

1. **Crear comercial nuevo**:
   - Ir a `/admin/sales-team/representatives`
   - Click en "Nuevo Comercial"
   - Llenar formulario
   - El comercial recibe email de bienvenida automáticamente

2. **Generar API Key para partner**:
   - Ir a perfil del comercial
   - Click en "Generar API Key"
   - Copiar y enviar credenciales al partner (se muestran solo una vez)

3. **Aprobar comisiones**:
   - Cada mes, el sistema genera comisiones automáticamente
   - Ir a `/admin/sales-team/commissions`
   - Revisar comisiones pendientes
   - Aprobar o rechazar
   - Marcar como pagadas una vez transferido el dinero

4. **Otorgar certificación**:
   - Crear certificación en el sistema
   - Seleccionar partner
   - Otorgar certificación
   - Partner recibe email automático con su certificado

### Para Partners/Comerciales

1. **Registro**:
   - Completar formulario en `/portal-comercial/register`
   - O usar API pública: `POST /api/partners/public/register`
   - Esperar aprobación de administrador

2. **Captura de leads**:
   - Manualmente desde su portal
   - O mediante API con su API Key
   - O mediante landing page personalizada con su código referido

3. **Ver comisiones**:
   - Login en `/portal-comercial/login`
   - Dashboard muestra comisiones pendientes y pagadas
   - Descargar reportes en CSV

4. **Invitar sub-afiliados** (nivel 2):
   - Desde su dashboard
   - Crear sub-afiliado
   - Recibe 10% de las comisiones del sub-afiliado

---

## 🔐 Seguridad

### API Keys
- Las API keys son únicas por partner
- El secret se hashea con SHA-256 antes de guardar
- Solo se muestra el secret una vez al generarlo
- Se pueden revocar en cualquier momento

### CRON Jobs
- Protegidos con token secreto en header
- Solo responden a POST/GET con token válido
- Recomendado: usar token largo y aleatorio

### Autenticación
- Administradores: NextAuth con roles
- Partners: Sistema de login dedicado con password hasheado (bcrypt)
- API pública: Requiere API Key + Secret en headers

---

## 📊 Métricas y KPIs Disponibles

### Por Comercial
- Total de leads generados
- Total de conversiones
- Tasa de conversión %
- Comisiones generadas (total)
- Comisiones pendientes
- Comisiones pagadas
- Cumplimiento de objetivos mensuales
- Número de sub-afiliados activos
- Comisiones de nivel 2

### Globales
- Ranking de comerciales por performance
- Estadísticas generales del programa
- Evolución temporal de comisiones
- Evolución temporal de leads
- Distribución de leads por estado
- Distribución de comisiones por tipo

---

## 📚 Servicios Implementados

### 1. sales-team-service.ts
Gestión completa de comerciales, leads, comisiones y objetivos.

### 2. automation-service.ts
Automatizaciones (CRON), emails, notificaciones.

### 3. reports-service.ts
Generación de reportes CSV, datos para gráficas, estadísticas.

### 4. partners-service.ts
Funcionalidades avanzadas: API Keys, White Label, certificaciones, sub-afiliados, analytics.

### 5. email-service.ts
Envío de emails transaccionales y de marketing.

---

## 🔄 Casos de Uso Avanzados

### 1. Integración con CRM Externo
Un partner con su propio CRM puede:
- Generar su API Key desde el portal
- Integrar su CRM para enviar leads automáticamente
- Recibir notificaciones de comisiones por email

### 2. White Label para Agencias
Una agencia grande puede:
- Configurar su branding personalizado
- Crear sub-afiliados (agentes individuales)
- Recibir 10% de todas las comisiones de sus agentes
- Tener su propio dashboard con su marca

### 3. Programa de Certificación
- Crear niveles de certificación (Básico, Intermedio, Avanzado, Experto)
- Establecer requisitos (ej: 10 conversiones para nivel Avanzado)
- Otorgar automáticamente o manualmente
- Partners con certificación pueden tener mejores tasas de comisión

---

## ✨ Próximos Pasos Sugeridos (Opcionales)

1. **Dashboard de Partners mejorado**
   - Gráficas interactivas con Chart.js o Recharts
   - Filtros avanzados por fecha
   - Comparativas con otros partners (anónimas)

2. **Gamificación**
   - Sistema de puntos y badges
   - Leaderboard público
   - Premios y reconocimientos

3. **Marketplace de Leads**
   - Partners pueden comprar/vender leads entre ellos
   - Sistema de subastas
   - Comisiones para la plataforma

4. **Formación y Recursos**
   - Biblioteca de vídeos de capacitación
   - Webinars en vivo
   - Comunidad de partners (foro)

5. **Móvil App**
   - App nativa para iOS/Android
   - Notificaciones push
   - Escaneo de tarjetas de visita con IA

---

## 👥 Soporte

Para cualquier duda o problema:
- Email: soporte@inmova.com
- Documentación API: `/api/docs`
- Portal de partners: `/portal-comercial`

---

**Última actualización**: Diciembre 2024
