# 🏗️ EWOORKER - PROYECTO COMPLETO

## 📋 Resumen Ejecutivo

**ewoorker** es una plataforma B2B SaaS para el sector de la construcción que conecta constructores principales con subcontratistas profesionales, resolviendo 3 problemas críticos:

1. **Compliance Legal (Ley 32/2006)**: Libro de subcontratación digital + gestión documental automática
2. **Pago Seguro**: Sistema escrow que protege a ambas partes
3. **Marketplace Eficiente**: Matching inteligente entre obras y profesionales verificados

**Modelo de Negocio**: División 50/50 con socio fundador SOLO sobre comisiones de marketplace/escrow (NO suscripciones SaaS).

---

## 🎯 Líneas de Negocio

### 1. **Suscripciones SaaS (MRR)** ✅ 100% INMOVA

| Plan                         | Precio/Mes | Target      | Features Clave                     |
| ---------------------------- | ---------- | ----------- | ---------------------------------- |
| **OBRERO** (Free)            | €0         | Freelancers | Perfil básico, 3 ofertas/mes       |
| **CAPATAZ** (Pro)            | €49        | PYMEs       | Ofertas ilimitadas, Compliance Hub |
| **CONSTRUCTOR** (Enterprise) | €149       | Empresas    | API, White-label, Account manager  |

**IMPORTANTE**: Las suscripciones SaaS son 100% para Inmova (NO se reparten con el socio).

**Ingresos proyectados**:

- 100 empresas CAPATAZ = €4,900/mes → **100% Inmova**
- 20 empresas CONSTRUCTOR = €2,980/mes → **100% Inmova**
- **Total MRR**: €7,880 → **100% Inmova**
- **ARR**: €94,560 → **100% Inmova**

---

### 2. **Comisiones por Transacción (Escrow)** ⚠️ 50/50 CON SOCIO

**Modelo**: 1.5% - 3% del valor de cada pago procesado

**IMPORTANTE**: Solo las comisiones de marketplace/escrow se reparten 50/50 con el socio fundador.

```
Ejemplo: Obra de €50,000
- Comisión ewoorker (2%): €1,000
  - Tu socio recibe: €500 (50%)
  - Plataforma Inmova: €500 (50%)
```

**Proyección conservadora**:

- GMV mensual: €500,000
- Comisión promedio: 2%
- **Ingreso mensual TOTAL**: €10,000
  - Socio (50%): €5,000
  - Inmova (50%): €5,000
- **Ingreso anual TOTAL**: €120,000
  - **Socio**: €60,000
  - **Inmova**: €60,000

**Proyección optimista**:

- GMV mensual: €1,500,000
- Comisión: 2%
- **Ingreso anual TOTAL**: €360,000
  - **Socio**: €180,000
  - **Inmova**: €180,000

---

### 3. **Servicios Premium (Adicionales)** ✅ 100% INMOVA

- **Contratación Urgente**: 5-10% extra en obras <48h
- **Certificaciones Digitales**: €29/certificación
- **Verificación Prioritaria**: €99/empresa
- **Marketplace Destacado**: €199/mes

**IMPORTANTE**: Los servicios premium son 100% para Inmova (NO se reparten con el socio).

**Proyección conservadora**: €2,500/mes → **100% Inmova**

---

## 💰 Proyección Financiera Año 1

### Desglose de Ingresos

| Fuente             | Conservador | Optimista | División Socio        |
| ------------------ | ----------- | --------- | --------------------- |
| Suscripciones      | €70K        | €150K     | ❌ 100% Inmova        |
| Comisiones Escrow  | €120K       | €300K     | ✅ 50/50 (€60K-€150K) |
| Servicios Premium  | €30K        | €80K      | ❌ 100% Inmova        |
| **TOTAL INGRESOS** | **€220K**   | **€530K** |                       |

### Distribución Real

| Concepto                         | Conservador | Optimista |
| -------------------------------- | ----------- | --------- |
| **Ingresos 100% Inmova**         | €100K       | €230K     |
| (Suscripciones + Premium)        |             |           |
| **Ingresos 50/50 (Marketplace)** | €120K       | €300K     |
| → Socio (50%)                    | €60K        | €150K     |
| → Inmova (50%)                   | €60K        | €150K     |
| **TOTAL SOCIO**                  | **€60K**    | **€150K** |
| **TOTAL INMOVA**                 | **€160K**   | **€380K** |

---

## 🏗️ Arquitectura Técnica

### Stack

- **Frontend**: Next.js 15 + React 19
- **Backend**: Next.js API Routes + Server Actions
- **Base de Datos**: PostgreSQL con Prisma ORM
- **Pagos**: Stripe Connect (para escrow)
- **Storage**: AWS S3 (documentos legales)
- **Auth**: NextAuth.js

### Modelos de Datos Principales

#### EwoorkerPerfilEmpresa

```typescript
{
  tipoEmpresa: 'CONSTRUCTOR' | 'SUBCONTRATISTA' | 'MULTISERVICIO'
  especialidades: string[]  // ['Estructura', 'Electricidad']
  numeroREA: string         // Registro Empresas Acreditadas
  planActual: 'OBRERO_FREE' | 'CAPATAZ_PRO' | 'CONSTRUCTOR'
  valoracionMedia: float
  proyectosCompletados: int
}
```

#### EwoorkerObra

```typescript
{
  titulo: string
  presupuestoEstimado: float
  especialidadesRequeridas: string[]
  urgente: boolean
  direccion: string
  fechaInicio: Date
  fechaFin: Date
  estado: 'PUBLICADA' | 'ADJUDICADA' | 'EN_CURSO' | 'COMPLETADA'
}
```

#### EwoorkerPago

```typescript
{
  tipo: 'SUSCRIPCION_MENSUAL' | 'PAGO_SEGURO_ESCROW' | 'CONTRATACION_URGENTE';
  montoTotal: float;
  montoComision: float;
  beneficioSocio: float; // 50%
  beneficioPlataforma: float; // 50%
  estado: 'PENDIENTE' | 'RETENIDO_ESCROW' | 'LIBERADO' | 'PAGADO';
}
```

---

## 📊 Panel del Socio Fundador

### URL de Acceso

`/ewoorker/admin-socio`

### Métricas Mostradas

#### KPIs Financieros

- **GMV Total**: Volumen bruto transaccionado
- **Comisiones Generadas**: Total ingresos plataforma
- **Tu Beneficio (50%)**: Cantidad a cobrar
- **Plataforma (50%)**: Reinversión Inmova

#### Métricas de Usuarios

- Total Empresas Registradas
- Empresas Activas (%)
- Nuevas Este Mes
- Empresas Verificadas (REA válido)

#### Actividad Marketplace

- Obras Publicadas
- Ofertas Enviadas
- Contratos Activos
- Contratos Completados

#### Engagement

- Tasa de Conversión (Ofertas → Contratos)
- Tiempo Medio de Adjudicación
- Valoración Media de Plataforma

#### Desglose de Comisiones

- Suscripciones MRR
- Escrow (pagos)
- Urgentes
- Otros servicios

### Features del Panel

- ✅ Filtros por período (mes, trimestre, año)
- ✅ Exportación a PDF
- ✅ Acceso restringido (solo socio + admins autorizados)
- ✅ Log de auditoría de accesos
- ✅ Actualización en tiempo real

---

## 🔑 Funcionalidades Clave

### 1. **Compliance Hub** (Diferenciador Principal)

**Problema**: La Ley 32/2006 obliga a:

- Mantener el Libro de Subcontratación al día
- Verificar documentación de subcontratistas (REA, TC1, TC2, Seguros)
- Notificar a la Administración

**Solución ewoorker**:

- ✅ Libro Digital automático
- ✅ Alertas de vencimiento (REA, TC1, TC2, Seguros RC)
- ✅ Validación en tiempo real con TGSS (API)
- ✅ Upload centralizado de documentos
- ✅ Asientos automáticos en cada subcontratación

**Valor**: Ahorra 5-10 horas/semana + evita sanciones (hasta €10,000)

---

### 2. **Sistema Escrow (Pago Seguro)**

**Flujo**:

1. Constructor deposita el importe en cuenta escrow
2. Subcontratista recibe notificación de fondos bloqueados
3. Subcontratista empieza trabajo con tranquilidad
4. Al completar hitos, constructor libera fondos parciales
5. ewoorker cobra comisión (1.5-3%) al transferir

**Garantías**:

- Constructor: Solo paga si el trabajo está bien
- Subcontratista: Dinero asegurado aunque constructor tenga problemas

---

### 3. **Marketplace Inteligente**

**Matching Automático**:

```typescript
algoritmo_matching(obra, subcontratista) {
  score = 0

  // Especialidades (40%)
  if (subcontratista.especialidades.includes(obra.especialidadRequerida)) {
    score += 40
  }

  // Ubicación geográfica (25%)
  distancia = calcularDistancia(obra.ubicacion, subcontratista.baseOperaciones)
  score += (25 * (1 - distancia/100km))

  // Disponibilidad (20%)
  if (subcontratista.disponibilidadInmediata) {
    score += 20
  }

  // Reputación (15%)
  score += (subcontratista.valoracionMedia / 5) * 15

  return score
}
```

---

### 4. **Certificaciones Digitales**

Sustitución del papeleo tradicional:

- **Certificación de Obra Ejecutada**: PDF firmado digitalmente
- **Partes de Trabajo Diarios**: Geolocalizados con fotos
- **Mediciones**: Unidades ejecutadas con evidencia
- **Firma Digital**: Válida ante Administración

---

## 🔗 Integraciones Planeadas

### Fase 1 (Q1 2025)

- [ ] **TGSS (Tesorería General Seguridad Social)**: Validación TC1/TC2 en tiempo real
- [ ] **Stripe Connect**: Escrow completo
- [ ] **Twilio**: SMS alertas documentación

### Fase 2 (Q2 2025)

- [ ] **Presto/Arquímedes**: Importar presupuestos
- [ ] **Contasimple/Holded**: Exportar facturas
- [ ] **Google Maps API**: Geocodificación obras

### Fase 3 (Q3 2025)

- [ ] **Registro Mercantil**: Verificación empresas automática
- [ ] **API Open Banking**: Domiciliaciones bancarias
- [ ] **Docsign**: Firma electrónica avanzada

---

## 👥 Perfiles de Usuario

### Constructor Principal

**Necesidades**:

- Encontrar subcontratistas confiables rápido
- Cumplir compliance sin dedicarle tiempo
- Asegurar calidad del trabajo

**Funcionalidades**:

- Publicar obras en 2 minutos
- Recibir ofertas de empresas verificadas
- Comparar presupuestos lado a lado
- Libro de subcontratación automático
- Retener pago hasta conformidad

---

### Subcontratista

**Necesidades**:

- Encontrar trabajo estable
- Cobrar a tiempo (sin morosidad)
- Mantener docs al día sin esfuerzo

**Funcionalidades**:

- Acceso a 500+ obras semanales
- Alertas de obras de su especialidad
- Subir docs una vez (auto-reuso)
- Escrow garantiza cobro
- Construir reputación con reviews

---

## 📱 Roadmap Mobile App

### Fase 1: App Subcontratista (iOS + Android)

**Features**:

- Notificaciones push de obras nuevas
- Enviar ofertas rápidas
- Fichaje con geolocalización
- Subir fotos de avance obra
- Chat con constructor

### Fase 2: App Constructor

**Features**:

- Aprobar certificaciones desde móvil
- Revisar fotos de avance
- Liberar pagos escrow
- Firmar documentos

---

## 🎯 Go-to-Market Strategy

### Canal 1: Gremios y Asociaciones

- CEPCO (Confederación Española de Constructoras)
- AEDAS (Arquitectos)
- Asociaciones provinciales de constructores

**Táctica**: Webinars sobre Ley 32/2006 + demo ewoorker

---

### Canal 2: Content Marketing

**Blog posts**:

- "Guía completa Ley 32/2006 para constructores"
- "Cómo evitar sanciones del Libro de Subcontratación"
- "5 formas de no cobrar nunca más tarde"

**SEO Keywords**:

- "libro subcontratación digital"
- "REA construcción"
- "pago seguro subcontratistas"

---

### Canal 3: Outbound Sales

**Target**: Constructoras con facturación >€500K/año

**Pitch**:

> "Somos la única plataforma que junta marketplace + compliance + escrow. Ahorras 10 horas/semana en papeleo y nunca más tendrás un subcontratista sin papeles al día."

---

## 💼 Acuerdo con Socio Fundador

### División de Beneficios

**50% Socio / 50% Inmova (Plataforma)**

### Modelo de Cálculo

```typescript
const calcularBeneficios = (transaccion) => {
  let comisionTotal = 0;

  switch (transaccion.tipo) {
    case 'SUSCRIPCION':
      comisionTotal = transaccion.monto; // €49 o €149
      break;
    case 'ESCROW':
      comisionTotal = transaccion.monto * 0.02; // 2% del pago
      break;
    case 'URGENTE':
      comisionTotal = transaccion.monto * 0.075; // 7.5% extra
      break;
  }

  return {
    total: comisionTotal,
    socio: comisionTotal * 0.5,
    plataforma: comisionTotal * 0.5,
  };
};
```

### Pagos al Socio

- **Frecuencia**: Mensual (día 5 de cada mes)
- **Método**: Transferencia bancaria
- **Reporte**: PDF automático generado desde panel admin-socio
- **Retención IRPF**: A cargo del socio (autónomo/sociedad)

### Responsabilidades

| Socio                              | Inmova (Plataforma)                      |
| ---------------------------------- | ---------------------------------------- |
| BD de clientes inicial             | Desarrollo y mantenimiento técnico       |
| Relaciones comerciales             | Hosting e infraestructura                |
| Soporte especializado construcción | Soporte técnico 24/7                     |
| Validación compliance              | Integración con APIs externas            |
| Expansión gremios                  | Marketing digital y SEO                  |
|                                    | **Desarrollo de software (100% Inmova)** |
|                                    | **Suscripciones SaaS (100% Inmova)**     |
| **Marketplace (50% comisión)**     | **Marketplace (50% comisión)**           |

---

## 📈 Métricas de Éxito

### Corto Plazo (3 meses)

- [ ] 50 empresas registradas
- [ ] 20 empresas con plan de pago (CAPATAZ/CONSTRUCTOR)
- [ ] 100 obras publicadas
- [ ] €5,000 GMV

### Medio Plazo (6 meses)

- [ ] 200 empresas registradas
- [ ] 80 empresas con plan de pago
- [ ] 500 obras publicadas
- [ ] €50,000 GMV
- [ ] 100 contratos completados

### Largo Plazo (12 meses)

- [ ] 1,000 empresas registradas
- [ ] 300 con plan de pago
- [ ] 2,000 obras publicadas
- [ ] €500,000 GMV/mes
- [ ] App móvil lanzada (iOS + Android)

---

## 🚀 URLs Desplegadas

### Landing Pública

- **Producción**: `http://157.180.119.236:3000/ewoorker-landing`
- **Dominio**: `https://ewoorker.com` (pendiente de configurar)

### Aplicación

- **Dashboard**: `http://157.180.119.236:3000/ewoorker/dashboard`
- **Panel Socio**: `http://157.180.119.236:3000/ewoorker/admin-socio`
- **Marketplace**: `http://157.180.119.236:3000/ewoorker/obras`
- **Compliance**: `http://157.180.119.236:3000/ewoorker/compliance`
- **Pagos**: `http://157.180.119.236:3000/ewoorker/pagos`

---

## 🔐 Acceso Panel del Socio

### Configuración de Permisos

El acceso al panel del socio está restringido a:

1. Usuario con flag `isSocioEwoorker: true` en BD
2. Admins con permiso especial

### Cómo Dar Acceso al Socio

```sql
-- Opción 1: Marcar usuario existente
UPDATE users
SET "isSocioEwoorker" = true
WHERE email = 'socio@example.com';

-- Opción 2: Crear usuario específico
INSERT INTO users (id, email, name, "isSocioEwoorker", role, activo)
VALUES (
  'cuid_example',
  'socio@ewoorker.com',
  'Nombre del Socio',
  true,
  'ADMIN',
  true
);
```

### Seguridad

- ✅ Logs de auditoría de todos los accesos
- ✅ 2FA opcional para el socio
- ✅ IP whitelisting configurable
- ✅ Exportaciones trackeadas

---

## 📂 Estructura de Archivos

```
/workspace/
├── app/
│   ├── ewoorker-landing/          # Landing pública
│   │   └── page.tsx
│   ├── ewoorker/
│   │   ├── dashboard/             # Dashboard principal
│   │   ├── admin-socio/           # Panel del socio
│   │   ├── obras/                 # Marketplace
│   │   ├── compliance/            # Gestión docs
│   │   └── pagos/                 # Sistema de pagos
│   └── api/
│       └── ewoorker/
│           ├── obras/             # API obras
│           ├── admin-socio/       # API métricas socio
│           └── compliance/        # API documentos
├── prisma/
│   └── schema.prisma              # Modelos ewoorker (ya definidos)
└── scripts/
    └── migrate-ewoorker.sh        # Script de migración BD
```

---

## 🎨 Identidad de Marca ewoorker

### Colores Principales

- **Naranja Principal**: #EA580C (orange-600)
- **Naranja Claro**: #FB923C (orange-400)
- **Amarillo Acento**: #FCD34D (yellow-300)
- **Gris Oscuro**: #1F2937 (gray-800)

### Tipografía

- **Títulos**: Bold, sans-serif
- **Cuerpo**: Regular, sans-serif
- **Números**: Tabular, monospace (para métricas)

### Tono de Comunicación

- **Directo y práctico**: Sin tecnicismos innecesarios
- **Confiable**: Énfasis en seguridad y compliance
- **Profesional**: Lenguaje de B2B, no B2C casual

---

## ❓ FAQs Internas

### ¿Por qué ewoorker es parte de Inmova?

Inmova es el ecosistema PropTech completo. ewoorker es la **vertical B2B de construcción** dentro de ese ecosistema, con su propio P&L y socio.

### ¿Puede una empresa estar en Inmova y ewoorker?

Sí. Ejemplo:

- **Inmova**: Gestor de propiedades que alquila 50 pisos
- **ewoorker**: El mismo gestor busca albañiles para reformar

### ¿Qué pasa con los datos del socio si sale?

El contrato debe especificar:

1. **Cláusula de salida**: Aviso 6 meses
2. **Buyout**: Valoración a múltiplo de EBITDA
3. **Non-compete**: 2 años en mismo sector

### ¿Cómo se auditan las comisiones?

- Todas las transacciones quedan registradas en BD
- Panel del socio tiene acceso de solo lectura
- Exportación mensual automática a PDF

---

## 📞 Contacto y Soporte

### Para el Socio

- **Email**: socio@ewoorker.com
- **Panel directo**: /ewoorker/admin-socio
- **Reportes mensuales**: Automáticos día 1 de cada mes

### Para Clientes ewoorker

- **Email general**: hola@ewoorker.com
- **Soporte técnico**: soporte@ewoorker.com
- **Comercial**: ventas@ewoorker.com
- **Teléfono**: +34 900 XXX XXX (pendiente)

---

## 🎉 Estado Actual del Proyecto

### ✅ Completado

- [x] Modelos de datos (Prisma schema)
- [x] Dashboard principal ewoorker
- [x] Panel admin socio con métricas completas
- [x] Landing page profesional
- [x] Páginas de obras, compliance, pagos (estructura)
- [x] División automática 50/50 en modelo de pagos
- [x] Logs de auditoría

### 🟡 En Desarrollo

- [ ] API TGSS para validación TC1/TC2
- [ ] Stripe Connect para escrow completo
- [ ] Sistema de reviews bidireccional
- [ ] App móvil (iOS + Android)

### 🔴 Pendiente

- [ ] Integración con Presto/Arquímedes
- [ ] Marketing automation (HubSpot)
- [ ] Dominio propio (ewoorker.com)
- [ ] SSL + CDN
- [ ] Backup automático BD

---

**Última actualización**: 31 de Diciembre de 2025  
**Versión**: 1.0.0  
**Mantenido por**: Equipo Inmova + Socio Fundador ewoorker

---

## 🚀 ¡ewoorker está listo para escalar!

**Próximo paso**: Onboarding de primeros 10 clientes beta y validar product-market fit en Q1 2025.
