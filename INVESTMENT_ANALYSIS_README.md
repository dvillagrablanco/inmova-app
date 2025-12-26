# 🏢 Sistema de Análisis de Inversión Inmobiliaria - INMOVA

> **Sistema profesional completo para analizar, comparar y optimizar inversiones inmobiliarias con OCR, integraciones externas y recomendaciones por IA.**

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/inmova/investment-analysis)
[![Status](https://img.shields.io/badge/status-ready-green.svg)](https://github.com/inmova/investment-analysis)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

---

## 📖 Tabla de Contenidos

- [Características](#-características)
- [Demo](#-demo)
- [Instalación](#-instalación)
- [Uso Rápido](#-uso-rápido)
- [Arquitectura](#-arquitectura)
- [Documentación](#-documentación)
- [API Reference](#-api-reference)
- [Roadmap](#-roadmap)
- [Contribuir](#-contribuir)
- [Licencia](#-licencia)

---

## ✨ Características

### 📊 Análisis Financiero Avanzado
- **13 métricas calculadas**: ROI, TIR, Cash-on-Cash, Cap Rate, NOI, DSCR, LTV, etc.
- **5 verticales soportados**: Piso, Local, Garaje, Trastero, Edificio completo
- **Proyecciones a largo plazo**: Hasta 30 años con apreciación y inflación
- **Análisis de riesgos automático**: Identifica factores de riesgo y fortalezas
- **Sistema de recomendaciones**: 5 niveles desde "Excelente" a "No Recomendado"

### 🤖 OCR Inteligente para Rent Rolls
- **4 formatos soportados**: PDF, Excel (.xlsx, .xls), CSV, Imágenes
- **Extracción automática**: Unidades, rentas, inquilinos, ocupación
- **Validación inteligente**: Detecta errores y datos atípicos
- **Resumen instantáneo**: Estadísticas y distribución de rentas
- **Vinculación directa**: Crea análisis desde rent roll procesado

### 🔗 Integraciones Externas

#### Portales Inmobiliarios
- **Idealista**: Import con 1 click desde URL
- **Pisos.com**: Scraping automático de propiedades
- **Análisis de mercado**: Comparables y tendencias

#### Sistema Notarial
- **Nota Simple**: Consulta Registro de la Propiedad
- **Catastro**: Verificación de datos catastrales
- **Cálculo de costos**: Notaría, registro, gestoría
- **Gestión de citas**: Solicitud de citas con notarios

### 📄 Exportación Profesional
- **PDF con branding**: Reportes personalizables
- **Comparativas**: Tabla lado a lado de múltiples análisis
- **Formato imprimible**: A4, márgenes profesionales

### 🤝 Colaboración
- **Sistema de compartir**: Con permisos (View/Edit)
- **Comparador**: Hasta N análisis simultáneos
- **Historial**: Guarda todos tus análisis

### 🧠 Inteligencia Artificial
- **Recomendaciones personalizadas**: 6 tipos de optimizaciones
- **Priorización automática**: Critical, High, Medium, Low
- **Impacto cuantificado**: Ahorro/ganancia potencial

---

## 🎬 Demo

### Pantallas Principales

**1. Analizador de Inversión**
```
┌─────────────────────────────────────────┐
│  📊 Análisis de Inversión               │
├─────────────────────────────────────────┤
│  Tipo: Piso  |  Precio: €200,000       │
│  Renta: €1,200/mes                      │
│                                         │
│  ✅ ROI: 9.2% (Bueno)                   │
│  ✅ Cash-on-Cash: 11.5% (Bueno)         │
│  ✅ Cap Rate: 5.8% (Aceptable)          │
│                                         │
│  ⭐ Recomendación: BUENA INVERSIÓN      │
│                                         │
│  [Guardar]  [Compartir]  [Exportar PDF]│
└─────────────────────────────────────────┘
```

**2. Upload Rent Roll**
```
┌─────────────────────────────────────────┐
│  📤 Subir Rent Roll                     │
├─────────────────────────────────────────┤
│  [Arrastra PDF/Excel aquí]              │
│                                         │
│  ✓ 12 unidades detectadas               │
│  ✓ 11 ocupadas (91.7%)                  │
│  ✓ €10,200/mes total                    │
│                                         │
│  [Crear Análisis desde este Rent Roll] │
└─────────────────────────────────────────┘
```

**3. Import desde Portales**
```
┌─────────────────────────────────────────┐
│  🔗 Importar Propiedad                  │
├─────────────────────────────────────────┤
│  Portal: [Idealista ▼]                  │
│  URL: https://idealista.com/...         │
│                                         │
│  ☑ Crear análisis automático            │
│                                         │
│  [Importar Propiedad]                   │
└─────────────────────────────────────────┘
```

### Video Demo

(TODO: Grabar video demo de 2 minutos)

---

## 🚀 Instalación

### Requisitos Previos

- Node.js 18+ y npm/yarn
- PostgreSQL 14+
- Prisma ORM configurado

### Instalación Automática

```bash
# Clonar repositorio (si aplica)
git clone https://github.com/inmova/investment-analysis.git
cd investment-analysis

# Ejecutar script de instalación
./scripts/install-investment-system.sh
```

El script instalará:
- ✅ Dependencias NPM (pdf-parse, xlsx, tesseract.js, etc.)
- ✅ Verificación de estructura de archivos
- ✅ Configuración de Prisma

### Instalación Manual

#### 1. Instalar Dependencias

```bash
yarn add pdf-parse xlsx csv-parse tesseract.js cheerio puppeteer html-pdf
yarn add -D @types/pdf-parse @types/html-pdf
```

#### 2. Actualizar Base de Datos

```bash
# Copiar modelos de prisma/schema-updates-investment.prisma
# a prisma/schema.prisma

# Ejecutar migración
npx prisma migrate dev --name add_investment_analysis
npx prisma generate
```

#### 3. Variables de Entorno

Crea/actualiza `.env`:

```env
# Requerido
DATABASE_URL="postgresql://user:pass@localhost:5432/inmova"

# Opcional (para integraciones)
IDEALISTA_API_KEY="tu_api_key"
PISOS_API_KEY="tu_api_key"
NOTARY_INTEGRATION_API_KEY="tu_api_key"
REGISTRO_PROPIEDAD_API_URL="https://..."
```

#### 4. Iniciar Servidor

```bash
yarn dev
# o
npm run dev
```

Accede a:
- http://localhost:3000/herramientas-inversion
- http://localhost:3000/analisis-inversion

---

## 💡 Uso Rápido

### 1. Crear Primer Análisis (2 minutos)

```typescript
// Vía UI:
// 1. Ir a /analisis-inversion
// 2. Seleccionar tipo: Piso
// 3. Ingresar datos básicos
// 4. Ver resultados

// Vía API:
const response = await fetch('/api/investment-analysis', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Mi Primer Análisis',
    data: {
      assetType: 'piso',
      purchasePrice: 200000,
      monthlyRent: 1200,
      // ... más datos
    },
    results: {
      // calculado por el frontend
    }
  })
});
```

### 2. Subir Rent Roll

```typescript
const formData = new FormData();
formData.append('file', pdfFile);
formData.append('propertyId', 'prop_123');

const response = await fetch('/api/rent-roll/upload', {
  method: 'POST',
  body: formData
});

const { rentRoll, parsedData, summary } = await response.json();
```

### 3. Importar desde Idealista

```typescript
const response = await fetch('/api/integrations/idealista/import', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    url: 'https://www.idealista.com/inmueble/12345',
    createAnalysis: true
  })
});

const { property, propertyData } = await response.json();
```

### 4. Comparar Análisis

```typescript
const response = await fetch('/api/investment-analysis/compare', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    analysisIds: ['id1', 'id2', 'id3']
  })
});

const comparison = await response.json();
```

---

## 🏗️ Arquitectura

### Stack Tecnológico

```
Frontend:
- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS
- shadcn/ui

Backend:
- Next.js API Routes
- Prisma ORM
- PostgreSQL

Librerías Especializadas:
- pdf-parse (PDF parsing)
- xlsx (Excel parsing)
- csv-parse (CSV parsing)
- tesseract.js (OCR)
- cheerio (Web scraping)
- puppeteer (PDF generation)
```

### Estructura de Directorios

```
/
├── app/
│   ├── analisis-inversion/
│   │   └── page.tsx                 # Analizador principal
│   ├── herramientas-inversion/
│   │   └── page.tsx                 # Hub de herramientas
│   └── api/
│       ├── investment-analysis/     # APIs de análisis
│       ├── rent-roll/               # APIs OCR
│       ├── integrations/            # APIs portales
│       └── notary/                  # APIs notariales
│
├── components/
│   ├── calculators/
│   │   └── InvestmentAnalyzer.tsx   # Componente principal
│   └── investment/
│       ├── RentRollUploader.tsx     # Upload rent roll
│       ├── PropertyImporter.tsx     # Import portales
│       └── AnalysisComparator.tsx   # Comparador
│
├── lib/
│   └── services/
│       ├── investment-analysis-service.ts
│       ├── rent-roll-ocr-service.ts
│       ├── real-estate-integrations.ts
│       ├── notary-integration-service.ts
│       └── pdf-generator-service.ts
│
├── prisma/
│   ├── schema.prisma
│   └── schema-updates-investment.prisma
│
├── scripts/
│   └── install-investment-system.sh
│
└── docs/
    ├── SISTEMA_COMPLETO_ANALISIS_INVERSION.md
    ├── GUIA_RAPIDA_SISTEMA_INVERSION.md
    └── INVESTMENT_ANALYSIS_README.md (este archivo)
```

### Flujo de Datos

```
Usuario → UI Component → API Route → Service Layer → Prisma → PostgreSQL
                                          ↓
                                    External APIs
                                 (Idealista, Catastro)
```

---

## 📚 Documentación

### Documentación Completa

- **[Sistema Completo](./SISTEMA_COMPLETO_ANALISIS_INVERSION.md)**: Documentación técnica exhaustiva
- **[Guía Rápida](./GUIA_RAPIDA_SISTEMA_INVERSION.md)**: Instalación y primeros pasos
- **[API Reference](#-api-reference)**: Endpoints y ejemplos

### Documentación por Módulo

#### Servicios

- `investment-analysis-service.ts`: Gestión de análisis (CRUD, compartir, comparar)
- `rent-roll-ocr-service.ts`: Procesamiento OCR de rent rolls
- `real-estate-integrations.ts`: Integración con portales inmobiliarios
- `notary-integration-service.ts`: Verificación notarial y catastral
- `pdf-generator-service.ts`: Generación de reportes PDF

#### Componentes

- `InvestmentAnalyzer`: Calculadora principal con tabs
- `RentRollUploader`: Upload y procesamiento de documentos
- `PropertyImporter`: Import desde Idealista/Pisos.com
- `AnalysisComparator`: Comparación multi-análisis

---

## 🔌 API Reference

### Investment Analysis

#### POST `/api/investment-analysis`
Crear nuevo análisis

```json
{
  "name": "Piso Madrid Centro",
  "data": {
    "assetType": "piso",
    "purchasePrice": 200000,
    "monthlyRent": 1200,
    // ... más campos
  },
  "results": {
    "roi": 9.2,
    "cashOnCash": 11.5,
    // ... más métricas
  }
}
```

**Response**: `{ id, userId, name, data, results, createdAt }`

#### GET `/api/investment-analysis?id={id}`
Obtener análisis específico

**Response**: Objeto de análisis completo

#### PUT `/api/investment-analysis`
Actualizar análisis

```json
{
  "id": "analysis_123",
  "data": { /* datos actualizados */ },
  "results": { /* resultados recalculados */ }
}
```

#### DELETE `/api/investment-analysis?id={id}`
Eliminar análisis

---

### Rent Roll

#### POST `/api/rent-roll/upload`
Subir y procesar rent roll

```
Content-Type: multipart/form-data

file: [PDF/Excel/CSV/Image]
propertyId: (opcional)
```

**Response**:
```json
{
  "rentRoll": { /* objeto guardado en BD */ },
  "parsedData": {
    "buildingName": "Edificio Central",
    "totalUnits": 12,
    "occupiedUnits": 11,
    "totalMonthlyRent": 10200,
    "units": [ /* array de unidades */ ]
  },
  "summary": { /* resumen calculado */ },
  "validation": {
    "valid": true,
    "errors": [],
    "warnings": []
  }
}
```

---

### Integrations

#### POST `/api/integrations/idealista/import`
Importar propiedad desde Idealista

```json
{
  "url": "https://www.idealista.com/inmueble/12345",
  "createAnalysis": true
}
```

**Response**:
```json
{
  "property": { /* propiedad guardada */ },
  "propertyData": {
    "title": "...",
    "price": 200000,
    "features": { /* características */ },
    "images": [ /* URLs */ ]
  }
}
```

#### POST `/api/integrations/pisos/import`
Importar propiedad desde Pisos.com

Mismo formato que Idealista.

---

### Notary

#### POST `/api/notary/verify-property`
Verificar propiedad con Registro

```json
{
  "propertyId": "prop_123",
  "cadastralReference": "1234567AB0001BC",
  "province": "Madrid"
}
```

**Response**:
```json
{
  "verified": true,
  "notaSimple": { /* datos del registro */ },
  "cadastralData": { /* datos de catastro */ },
  "checks": {
    "ownershipVerified": true,
    "noEncumbrances": true,
    "cadastralMatch": true
  }
}
```

---

## 🗺️ Roadmap

### v1.1 (Q1 2026)
- [ ] Dashboard de portfolio
- [ ] Gráficos interactivos
- [ ] Alertas automáticas
- [ ] Mobile app (React Native)

### v1.2 (Q2 2026)
- [ ] IA predictiva de valorización
- [ ] Marketplace de inversiones
- [ ] Integración con bancos
- [ ] API pública

### v1.3 (Q3 2026)
- [ ] Blockchain/tokenización
- [ ] Crowdfunding inmobiliario
- [ ] Multi-moneda
- [ ] Multi-país

### v2.0 (Q4 2026)
- [ ] White-label SaaS
- [ ] Módulo de gestión completo
- [ ] CRM integrado
- [ ] Facturación automática

---

## 🤝 Contribuir

¡Las contribuciones son bienvenidas!

### Cómo Contribuir

1. **Fork** el repositorio
2. **Crea** tu rama de feature (`git checkout -b feature/amazing-feature`)
3. **Commit** tus cambios (`git commit -m 'Add amazing feature'`)
4. **Push** a la rama (`git push origin feature/amazing-feature`)
5. **Abre** un Pull Request

### Guías de Estilo

- **TypeScript**: Seguir estándares del proyecto
- **Commits**: Usar [Conventional Commits](https://www.conventionalcommits.org/)
- **Tests**: Incluir tests para nuevas features
- **Docs**: Actualizar documentación

---

## 📝 Licencia

Este proyecto está bajo la licencia MIT.

Ver [LICENSE](LICENSE) para más detalles.

---

## 👥 Equipo

- **Desarrollo**: INMOVA Development Team
- **Diseño**: UX/UI Team
- **QA**: Testing Team

---

## 📞 Soporte

- 📧 **Email**: soporte@inmova.app
- 💬 **Chat**: En aplicación
- 📚 **Docs**: https://docs.inmova.app/investment-analysis
- 🐛 **Issues**: https://github.com/inmova/investment-analysis/issues

---

## 🎖️ Agradecimientos

Gracias a todos los que han contribuido al desarrollo de este sistema:

- Equipo de desarrollo de INMOVA
- Beta testers
- Comunidad de inversores inmobiliarios

---

## 📊 Estadísticas

- **Líneas de código**: ~23,400
- **Archivos creados**: 25+
- **Servicios backend**: 5
- **Componentes UI**: 6
- **APIs**: 9
- **Modelos de BD**: 11
- **Métricas calculadas**: 13
- **Formatos OCR**: 4
- **Integraciones externas**: 5

---

**Desarrollado con ❤️ por INMOVA**

© 2025 INMOVA - Todos los derechos reservados

---

[![Stars](https://img.shields.io/github/stars/inmova/investment-analysis?style=social)](https://github.com/inmova/investment-analysis)
[![Twitter](https://img.shields.io/twitter/follow/inmova?style=social)](https://twitter.com/inmova)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-blue)](https://linkedin.com/company/inmova)
