# 🏗️ EWOORKER - MODELO DE NEGOCIO INDEPENDIENTE

## 📋 RESUMEN EJECUTIVO

eWoorker es un **B2B marketplace para subcontratación en construcción** integrado en INMOVA pero con **identidad propia y modelo de ingresos independiente**.

### Acuerdo de Beneficios
- **50% para el Socio Fundador**
- **50% para la Plataforma**

División automática en cada transacción según schema `EwoorkerPago`.

---

## 💰 MODELO DE INGRESOS

### 1. Suscripciones Mensuales

| Plan | Precio/Mes | Comisión Extra | Target |
|------|------------|----------------|--------|
| **Obrero** | €0 (Gratis) | 5% por obra | Autónomos, pequeñas subcontratas |
| **Capataz** | €49 | 2% por obra + 2% escrow | PYMEs subcontratistas activas |
| **Constructor** | €149 | 0% comisión | Jefes de Grupo, Constructoras |

### 2. Comisiones por Transacción

#### a) Escrow Payments (Pagos Seguros)
- **Comisión**: 2-3% del monto de la obra
- **Flujo**: Dinero retenido en custodia hasta entrega conforme
- **Beneficio**: Constructor y subcontratista protegidos

#### b) Contratación Urgente
- **Comisión**: 5-10% extra
- **Beneficio**: Prioridad en listado, notificaciones inmediatas

#### c) Maquinaria On-Demand
- **Comisión**: 5-10% del alquiler
- **Futuro**: Marketplace de equipamiento

#### d) Servicios Premium
- **Certificaciones digitales**: €50-100/certificado
- **Verificación exprés**: €25/empresa
- **Formación PRL**: €150-300/curso

### 3. Ingresos Proyectados (Año 1)

```
MES 1-3 (Early Adopters):
- 50 empresas × €25 avg = €1,250/mes
- División: €625 Socio / €625 Plataforma

MES 4-6 (Growth):
- 200 empresas × €40 avg = €8,000/mes
- División: €4,000 Socio / €4,000 Plataforma

MES 7-12 (Scale):
- 500 empresas × €50 avg = €25,000/mes
- División: €12,500 Socio / €12,500 Plataforma

OBJETIVO AÑO 1: €150,000 - €200,000 ingresos totales
Beneficio Socio: €75,000 - €100,000
```

---

## 📊 PANEL DE MÉTRICAS DEL SOCIO

### Acceso
- **URL**: `/ewoorker/admin-socio`
- **Rol requerido**: `super_admin`
- **Email**: `socio@ewoorker.com`
- **Password**: `Ewoorker2025!Socio`

### KPIs Principales

#### Financiero
- **Tu Beneficio (50%)**: Dinero del socio en el periodo
- **GMV Total**: Gross Merchandise Value (valor total transaccionado)
- **MRR**: Monthly Recurring Revenue (suscripciones)
- **Desglose de Comisiones**: Por tipo (suscripción, escrow, urgentes)

#### Usuarios
- **Total Empresas**: Registradas en eWoorker
- **Empresas Activas**: Con actividad reciente
- **Por Plan**: Obrero, Capataz, Constructor
- **Crecimiento Mensual**: Nuevas empresas del mes

#### Operaciones
- **Obras Publicadas**: Proyectos disponibles
- **Ofertas Enviadas**: Propuestas de subcontratistas
- **Contratos Activos**: En ejecución
- **Contratos Completados**: Finalizados con éxito

#### Performance
- **Tasa de Conversión**: % ofertas → contratos
- **Tiempo Medio Adjudicación**: Días desde publicación a firma
- **Valoración Plataforma**: Rating promedio usuarios

### Exportación de Reportes
- Formato: PDF/TXT
- Periodos: Mes actual, mes anterior, trimestre, año
- Incluye: Todos los KPIs y desglose financiero

---

## 🔐 CREDENCIALES DEL SOCIO

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔐 ACCESO AL PANEL DEL SOCIO FUNDADOR
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📧 Email:    socio@ewoorker.com
🔒 Password: Ewoorker2025!Socio

🎯 Rol:      super_admin
🔗 Panel:    /ewoorker/admin-socio
🌐 URL:      https://inmovaapp.com/ewoorker/admin-socio

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Permisos
- ✅ Ver métricas completas de eWoorker
- ✅ Exportar reportes financieros
- ✅ Acceso a logs de auditoría
- ✅ Dashboard independiente de INMOVA
- ❌ NO puede modificar configuración técnica

---

## 🎨 SUBLANDING EWOORKER

### URL
- Principal: `/ewoorker/landing`
- Alias: `/ewoorker-landing`

### Precios Actualizados

#### Plan Obrero
```
Precio: GRATIS
Comisión: 5% por obra cerrada
Target: Autónomos y pequeñas subcontratas
```

#### Plan Capataz (MÁS POPULAR)
```
Precio: €49/mes
Comisión: 2% por obra + 2% escrow
Target: PYMEs subcontratistas activas
```

#### Plan Constructor
```
Precio: €149/mes
Comisión: 0% (sin comisiones extra)
Target: Jefes de Grupo y Constructoras grandes
```

### FAQ Actualizada
Nueva pregunta añadida:
> **¿Hay comisión por uso?**
> Depende del plan. Plan Obrero (gratis): 5% comisión por obra cerrada. Plan Capataz (€49/mes): 2% comisión. Plan Constructor (€149/mes): 0% comisión + obras destacadas. La comisión solo se cobra si cierras obra.
>
> **Modelo de negocio eWoorker:** Suscripciones mensuales + comisiones por éxito. Los ingresos se reparten 50% para la plataforma y 50% para el socio fundador.

---

## 🗄️ SCHEMA DE BASE DE DATOS

### Modelo `EwoorkerPago`

```prisma
model EwoorkerPago {
  id                    String   @id @default(cuid())
  contratoId            String?
  contrato              EwoorkerContrato? @relation(...)
  
  // Tipo
  tipo                  EwoorkerTipoComision
  concepto              String
  
  // Importes
  montoBase             Float    // Monto sobre el que se calcula
  porcentajeComision    Float?   // Si aplica
  montoComision         Float    // Comisión de ewoorker
  montoNeto             Float    // Lo que recibe el subcontratista
  
  // ✅ DIVISIÓN DE BENEFICIOS (50/50)
  beneficioEwoorker     Float    // 50% para plataforma
  beneficioSocio        Float    // 50% para socio fundador
  
  // Estado
  estado                EwoorkerEstadoPago @default(PENDIENTE)
  fechaPago             DateTime?
  
  // Escrow
  retenidoEscrow        Boolean  @default(false)
  fechaLiberacion       DateTime?
  
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
}
```

### Modelo `EwoorkerMetricaSocio`

```prisma
model EwoorkerMetricaSocio {
  id                    String   @id @default(cuid())
  
  // Periodo
  mes                   Int
  ano                   Int
  
  // Financiero (en céntimos)
  gmvTotal              Int      @default(0)
  comisionesGeneradas   Int      @default(0)
  beneficioSocio        Int      @default(0) // ✅ 50%
  beneficioPlataforma   Int      @default(0) // ✅ 50%
  
  // Suscripciones
  suscripcionesActivas  Int
  mrrSuscripciones      Int
  
  // Usuarios
  totalEmpresas         Int
  empresasActivas       Int
  usuariosObrero        Int
  usuariosCapataz       Int
  usuariosConstructor   Int
  
  // Operaciones
  obrasPublicadas       Int
  ofertasEnviadas       Int
  contratosActivos      Int
  contratosCompletados  Int
  
  // Performance
  tasaConversion        Float
  tiempoMedioAdjudicacion Float
  valoracionMediaPlataforma Float
  
  createdAt             DateTime @default(now())
  
  @@unique([mes, ano])
}
```

---

## 📂 ARCHIVOS IMPLEMENTADOS

### Frontend
```
app/ewoorker/
├── landing/page.tsx              # Sublanding con precios actualizados
├── admin-socio/page.tsx          # Panel de métricas del socio (NUEVO)
└── layout.tsx                    # Metadata eWoorker

components/landing/sections/      # Actualizado con precios claros
```

### Backend
```
app/api/ewoorker/admin-socio/
├── metrics/route.ts              # API de métricas (NUEVO)
└── export/route.ts               # API de exportación reportes (NUEVO)
```

### Scripts
```
scripts/
├── create-ewoorker-partner-user.ts     # Crear usuario socio (NUEVO)
└── deploy-ewoorker-business-model.py   # Deployment completo (NUEVO)
```

### Documentación
```
EWOORKER_BUSINESS_MODEL_RESUMEN.md      # Este archivo
README_CREDENCIALES_SOCIO.md            # Credenciales detalladas
```

---

## 🚀 DEPLOYMENT

### Comando

```bash
python3 scripts/deploy-ewoorker-business-model.py
```

### Pasos del Script

1. **Git pull** - Actualiza código desde main
2. **npm install** - Instala dependencias
3. **prisma generate** - Genera Prisma Client
4. **create-ewoorker-partner-user.ts** - Crea usuario del socio
5. **npm run build** - Compila aplicación
6. **pm2 reload** - Reinicia sin downtime
7. **Health checks** - Verifica endpoints

### Health Checks

- ✅ Main Landing: `http://localhost:3000/landing`
- ✅ eWoorker Landing: `http://localhost:3000/ewoorker/landing`
- ✅ Admin Socio Panel: `http://localhost:3000/ewoorker/admin-socio`
- ✅ Metrics API: `http://localhost:3000/api/ewoorker/admin-socio/metrics`

---

## ✅ CHECKLIST DE VERIFICACIÓN

### Precios en Sublanding
- [ ] Plan Obrero muestra "Gratis + 5% comisión"
- [ ] Plan Capataz muestra "€49/mes + 2% comisión"
- [ ] Plan Constructor muestra "€149/mes + 0% comisión"
- [ ] FAQ explica modelo de negocio 50/50

### Panel del Socio
- [ ] Login con `socio@ewoorker.com` funciona
- [ ] Dashboard muestra KPIs principales
- [ ] Tab Financiero muestra división 50/50
- [ ] Exportar reporte genera TXT descargable
- [ ] Selector de periodo funciona (mes, trimestre, año)

### Métricas
- [ ] GMV Total calculado correctamente
- [ ] Beneficio Socio = 50% comisiones
- [ ] MRR Suscripciones calculado
- [ ] Tasa de conversión calculada

### Seguridad
- [ ] Solo `super_admin` puede acceder a panel del socio
- [ ] Acceso denegado para otros roles
- [ ] Logs de auditoría registran accesos

---

## 📞 CONTACTO Y SOPORTE

### Para el Socio
- Email: socio@ewoorker.com
- Panel: https://inmovaapp.com/ewoorker/admin-socio
- Soporte técnico: Via panel INMOVA superadmin

### Para Usuarios eWoorker
- Landing: https://inmovaapp.com/ewoorker/landing
- Registro: https://inmovaapp.com/registro?platform=ewoorker
- Soporte: info@ewoorker.com (configurar)

---

## 🎯 ROADMAP FUTURO

### Q1 2026
- [ ] Dashboard de métricas en tiempo real (WebSockets)
- [ ] Gráficos de tendencias (Chart.js/Recharts)
- [ ] Notificaciones automáticas al socio (email mensual)
- [ ] Exportar reportes en PDF con logo eWoorker

### Q2 2026
- [ ] Marketplace de maquinaria on-demand
- [ ] Sistema de certificaciones digitales
- [ ] Formación PRL integrada
- [ ] App móvil para fichajes (React Native)

### Q3 2026
- [ ] API pública para integraciones
- [ ] White-label para grandes constructoras
- [ ] Expansión a otros países (Portugal, Francia)

---

**Última actualización**: 2 de enero de 2026  
**Versión**: 1.0.0  
**Estado**: ✅ Implementado y deployed en producción
