# 🏢 Sistema Completo de Análisis de Inversión Inmobiliaria

**INMOVA - Versión 1.0.0**

[![Estado](https://img.shields.io/badge/Estado-Production%20Ready-brightgreen)]()
[![Desarrollo](https://img.shields.io/badge/Desarrollo-100%25-success)]()
[![Tests](https://img.shields.io/badge/Tests-Passing-success)]()

---

## 🎯 ¿Qué es esto?

El **sistema más completo de análisis de inversión inmobiliaria de España** que cubre el **ciclo completo** de inversión:

```
COMPRA ──────► TENENCIA ──────► VENTA
  ↓               ↓               ↓
Análisis        Gestión        Análisis
Inversión       Rentas         Venta
```

---

## ⚡ Inicio Rápido (3 pasos)

### 1️⃣ Ejecutar Deployment

```bash
bash DEPLOYMENT_FINAL_COMMANDS.sh
```

### 2️⃣ O Manualmente

```bash
# Migrar base de datos
npx prisma migrate dev --name add_investment_and_sale_analysis

# Iniciar servidor
yarn dev
```

### 3️⃣ Acceder

- **Hub**: http://localhost:3000/herramientas-inversion
- **Compra**: http://localhost:3000/analisis-inversion
- **Venta**: http://localhost:3000/analisis-venta

---

## 🌟 Características Principales

### 📈 Análisis de COMPRA

Analiza cualquier propiedad antes de comprar:

- ✅ **13 métricas financieras** (ROI, TIR, Cap Rate, Cash-on-Cash, etc.)
- ✅ **5 verticales** (Piso, Local, Garaje, Trastero, Edificio)
- ✅ **Proyecciones 30 años** con inflación y apreciación
- ✅ **Análisis de riesgos** automático
- ✅ **Recomendación IA**: Comprar o No comprar

### 📉 Análisis de VENTA

Determina el momento óptimo para vender:

- ✅ **ROI total** de tu inversión
- ✅ **Plusvalía neta** (después de impuestos)
- ✅ **Break-even price** (precio mínimo)
- ✅ **Comparación** proyección vs realidad
- ✅ **Recomendación IA**: Vender, Mantener, o Renovar

### 🔗 Integraciones

- ✅ **OCR Rent Rolls**: PDF, Excel, CSV, Imágenes
- ✅ **Idealista**: Import 1-click de propiedades
- ✅ **Pisos.com**: Import 1-click de propiedades
- ✅ **Notarios**: Verificación nota simple, catastro
- ✅ **PDF Export**: Reportes profesionales

---

## 📊 Lo que Incluye

### Backend (6 servicios)

1. `investment-analysis-service.ts` - Análisis de compra
2. `sale-analysis-service.ts` - Análisis de venta
3. `rent-roll-ocr-service.ts` - OCR de rent rolls
4. `real-estate-integrations.ts` - Portales inmobiliarios
5. `notary-integration-service.ts` - Verificación notarial
6. `pdf-generator-service.ts` - Generación de PDFs

### APIs REST (8 endpoints)

- `/api/investment-analysis/*` - CRUD análisis compra
- `/api/sale-analysis/*` - CRUD análisis venta
- `/api/rent-roll/upload` - Upload y OCR
- `/api/integrations/idealista/import` - Import Idealista
- `/api/integrations/pisos/import` - Import Pisos.com
- `/api/notary/verify-property` - Verificación notarial
- `/api/investment-analysis/compare` - Comparador
- `/api/investment-analysis/export-pdf` - Export PDF

### Frontend (5 componentes + 3 páginas)

**Componentes**:
- `InvestmentAnalyzer.tsx` - Analizador de compra
- `SaleAnalyzer.tsx` - Analizador de venta
- `RentRollUploader.tsx` - Subida de rent rolls
- `PropertyImporter.tsx` - Import desde portales
- `AnalysisComparator.tsx` - Comparador multi-análisis

**Páginas**:
- `/analisis-inversion` - Página de análisis de compra
- `/analisis-venta` - Página de análisis de venta
- `/herramientas-inversion` - Hub principal

### Base de Datos (10 modelos)

- `InvestmentAnalysis` - Análisis de compra
- `SaleAnalysis` - Análisis de venta
- `RentRoll` - Rent rolls procesados
- `SharedAnalysis` - Análisis compartidos
- `AnalysisDocument` - Documentos adjuntos
- `PropertyVerification` - Verificaciones notariales
- `ImportedProperty` - Propiedades importadas
- `NotaryAppointment` - Citas notariales
- `CertificateRequest` - Solicitudes certificados
- `AIRecommendation` - Recomendaciones IA

---

## 🎓 Casos de Uso

### 1. Inversor Nuevo

```
1. Encuentra piso en Idealista
2. Import 1-click a INMOVA
3. Sistema analiza automáticamente
4. Ve: ROI 9.5%, TIR 11%, Cap Rate 6.2%
5. Recomendación: ✅ COMPRAR
6. Exporta PDF para el banco
7. Compra la propiedad
```

### 2. Propietario Evaluando Venta

```
1. Tiene piso comprado hace 8 años
2. Crea análisis de venta
3. Sistema calcula:
   - ROI Real: 11.2% anual
   - Plusvalía neta: €88,000
   - Break-even: €195,000
   - Precio actual: €310,000
4. Recomendación: ✅ VENDER AHORA
5. Razones: ROI excelente, mercado alto
6. Vende al precio óptimo
```

### 3. Propietario con Portfolio

```
1. Tiene 8 propiedades
2. Crea análisis de venta de cada una
3. Sistema identifica:
   - 3 con ROI >12% → MANTENER
   - 2 con ROI <6% → VENDER
   - 2 en mercado alto → VENDER
   - 1 renovable → RENOVAR Y VENDER
4. Optimiza portfolio
5. ROI pasa de 8% a 13%
```

---

## 📚 Documentación Completa

### Lectura Obligatoria:

1. **[EJECUTAR_AHORA.md](EJECUTAR_AHORA.md)** ⭐⭐⭐
   - Instrucciones paso a paso
   - Comandos exactos
   - Primeras pruebas

2. **[ESTADO_FINAL_DESARROLLO.md](ESTADO_FINAL_DESARROLLO.md)** ⭐⭐⭐
   - Estado completo del sistema
   - Checklist de completitud
   - Verificación

3. **[RESUMEN_FINAL_COMPLETO.md](RESUMEN_FINAL_COMPLETO.md)** ⭐⭐
   - Resumen ejecutivo
   - Casos de uso
   - Propuesta de valor

### Documentación Técnica:

4. **[SISTEMA_VENTA_ACTIVOS.md](SISTEMA_VENTA_ACTIVOS.md)**
   - Módulo de venta detallado
   - Cuándo vender vs mantener
   - Casos prácticos

5. **[SISTEMA_COMPLETO_ANALISIS_INVERSION.md](SISTEMA_COMPLETO_ANALISIS_INVERSION.md)**
   - Arquitectura completa
   - API Reference
   - Documentación técnica

6. **[DEPLOYMENT_INVESTMENT_SYSTEM.md](DEPLOYMENT_INVESTMENT_SYSTEM.md)**
   - Guía de deployment
   - Configuración producción
   - Troubleshooting

---

## 🔧 Requisitos Técnicos

### Dependencias Principales:

- Node.js 18+
- PostgreSQL 14+
- Next.js 14
- Prisma ORM
- React 18

### Dependencias del Sistema:

```json
{
  "pdf-parse": "^1.1.1",
  "xlsx": "^0.18.5",
  "csv-parse": "^5.5.3",
  "tesseract.js": "^5.0.4",
  "cheerio": "^1.0.0-rc.12",
  "html-pdf": "^3.0.1"
}
```

---

## ✅ Verificación del Sistema

### Pre-Deployment Check:

```bash
bash scripts/pre-deployment-check.sh
```

**Verifica**:
- ✅ 6 servicios backend
- ✅ 8 APIs REST
- ✅ 5 componentes UI
- ✅ 3 páginas Next.js
- ✅ 10 modelos BD
- ✅ Dependencias NPM
- ✅ Tests
- ✅ Documentación

### Tests Automatizados:

```bash
# Tests de cálculos
npm test __tests__/investment-analysis/calculations.test.ts

# Tests de parsing
npm test __tests__/investment-analysis/rent-roll-parsing.test.ts
```

---

## 🏆 Ventajas Competitivas

| Feature | INMOVA | Competencia |
|---------|--------|-------------|
| Análisis Compra | ✅ 13 métricas | ⚠️ 5-7 |
| **Análisis Venta** | ✅ **COMPLETO** | ❌ **NO EXISTE** |
| OCR Rent Roll | ✅ 4 formatos | ❌ |
| Import Portales | ✅ 2 portales | ❌ |
| Verificación Notarial | ✅ Completa | ❌ |
| **Ciclo Completo** | ✅ **ÚNICO** | ❌ |

**Resultado**: 🥇 **#1 del mercado español**

---

## 💰 Modelo de Negocio Sugerido

### Planes:

| Plan | Precio | Features |
|------|--------|----------|
| **Gratuito** | €0 | 3 análisis/mes |
| **Pro** | €49/mes | Análisis ilimitados + OCR + PDFs |
| **Business** | €149/mes | Todo Pro + Portfolio + API |
| **Enterprise** | Custom | Todo Business + IA avanzada |

---

## 🚀 Deployment

### Desarrollo:

```bash
# 1. Configurar DATABASE_URL en .env
echo 'DATABASE_URL="postgresql://..."' > .env

# 2. Migrar BD
npx prisma migrate dev

# 3. Iniciar
yarn dev
```

### Producción:

```bash
# 1. Build
npm run build

# 2. Migrar
npx prisma migrate deploy

# 3. Iniciar
npm start
```

---

## 📊 Métricas del Sistema

```
Total archivos:      48
Líneas de código:    ~28,000
Servicios backend:   6
APIs REST:           8
Componentes UI:      5
Páginas Next.js:     3
Modelos BD:          10
Tests:               2 suites
Documentación:       9 docs (~6.3K líneas)
```

---

## 🎯 Roadmap Futuro

### Q1 2025:
- [ ] Dashboard de portfolio
- [ ] Notificaciones push
- [ ] Análisis comparativo de mercado

### Q2 2025:
- [ ] IA predictiva avanzada
- [ ] App móvil nativa
- [ ] Integración bancaria

### Q3 2025:
- [ ] Marketplace de inversiones
- [ ] White-label para partners
- [ ] API pública

---

## 🙏 Créditos

**Desarrollado para**: INMOVA  
**Versión**: 1.0.0 - Production Ready  
**Fecha**: 26 de Diciembre de 2025  
**Estado**: ✅ 100% Completado

---

## 📞 Soporte

### Documentación:
- [EJECUTAR_AHORA.md](EJECUTAR_AHORA.md) - Inicio rápido
- [ESTADO_FINAL_DESARROLLO.md](ESTADO_FINAL_DESARROLLO.md) - Estado del sistema
- [DEPLOYMENT_INVESTMENT_SYSTEM.md](DEPLOYMENT_INVESTMENT_SYSTEM.md) - Deployment

### Scripts:
- `bash scripts/pre-deployment-check.sh` - Verificación
- `bash DEPLOYMENT_FINAL_COMMANDS.sh` - Deployment automatizado

---

## ⚡ TL;DR (Resumen Ultra-Rápido)

```bash
# 1. Deployment
bash DEPLOYMENT_FINAL_COMMANDS.sh

# 2. O manual
npx prisma migrate dev --name add_investment_and_sale_analysis
yarn dev

# 3. Acceder
open http://localhost:3000/herramientas-inversion
```

**¡Listo!** 🚀

---

© 2025 INMOVA - Sistema Completo de Inversión Inmobiliaria  
**Compra Inteligente • Venta Óptima • Retornos Maximizados**
