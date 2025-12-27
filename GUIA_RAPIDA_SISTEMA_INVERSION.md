# 🚀 Guía Rápida - Sistema de Análisis de Inversión

## ⚡ Instalación en 3 Pasos

### 1️⃣ Ejecutar Script de Instalación

```bash
./scripts/install-investment-system.sh
```

Este script instalará automáticamente:
- ✅ Dependencias NPM (pdf-parse, xlsx, tesseract.js, etc.)
- ✅ Verificará la estructura de archivos
- ✅ Configurará Prisma

### 2️⃣ Integrar Schema de Base de Datos

```bash
# Abrir prisma/schema-updates-investment.prisma
# Copiar todos los modelos
# Pegarlos al final de prisma/schema.prisma

# Luego ejecutar migración
npx prisma migrate dev --name add_investment_analysis
npx prisma generate
```

### 3️⃣ Reiniciar Servidor

```bash
yarn dev
# o
npm run dev
```

¡Listo! El sistema está funcionando en:
- **Herramientas**: http://localhost:3000/herramientas-inversion
- **Analizador**: http://localhost:3000/analisis-inversion

---

## 🎯 Uso Rápido

### Crear Primer Análisis (2 minutos)

1. Ve a `/analisis-inversion`
2. Selecciona tipo: **Piso**
3. Ingresa:
   - Precio compra: €200,000
   - Renta mensual: €1,200
4. Configura CAPEX (notaría, impuestos, etc.)
5. Configura OPEX (comunidad, IBI, etc.)
6. ¡Ve resultados instantáneos!

### Subir Rent Roll (1 minuto)

1. Ve a `/herramientas-inversion`
2. Click en **"Upload Rent Roll"**
3. Arrastra archivo PDF/Excel
4. Sistema extrae automáticamente:
   - Unidades
   - Rentas
   - Ocupación
5. Click **"Crear Análisis desde Rent Roll"**

### Importar desde Idealista (30 segundos)

1. Ve a `/herramientas-inversion`
2. Click en **"Import desde Portales"**
3. Pega URL de Idealista
4. ✓ Marcar "Crear análisis automático"
5. Click **"Importar"**
6. ¡Análisis generado automáticamente!

### Comparar 3 Inversiones (1 minuto)

1. Ve a `/herramientas-inversion/comparador`
2. Selecciona 3 análisis
3. Click **"Comparar"**
4. Ve tabla lado a lado
5. Exporta PDF comparativo

---

## 📊 Métricas Explicadas

### ROI (Return on Investment)
**Fórmula**: `(Beneficio Neto Anual / Inversión Total) × 100`

**Interpretación**:
- < 5%: ❌ No recomendado
- 5-8%: ⚠️ Aceptable
- 8-12%: ✅ Bueno
- > 12%: ⭐ Excelente

### Cash-on-Cash Return
**Fórmula**: `(Cash Flow Anual / Capital Propio Invertido) × 100`

**Interpretación**:
- < 6%: ❌ Bajo
- 6-10%: ⚠️ Aceptable
- 10-15%: ✅ Bueno
- > 15%: ⭐ Excelente

### Cap Rate
**Fórmula**: `(NOI / Precio de Compra) × 100`

**Interpretación**:
- < 4%: ❌ Bajo rendimiento
- 4-6%: ⚠️ Normal mercado estable
- 6-8%: ✅ Bueno
- > 8%: ⭐ Excelente

### TIR (IRR)
**Tasa Interna de Retorno** considerando:
- Cash flows anuales
- Apreciación de capital
- Horizonte temporal

**Interpretación**:
- < 8%: ❌ Por debajo de expectativas
- 8-12%: ⚠️ Aceptable
- 12-18%: ✅ Bueno
- > 18%: ⭐ Excelente

---

## 🎓 Ejemplos Prácticos

### Ejemplo 1: Piso de Inversión Tradicional

```
Tipo: Piso
Ubicación: Madrid Centro
Precio: €250,000
Renta mensual: €1,400

CAPEX:
- Notaría y registro: €2,500
- Impuesto transmisiones (7%): €17,500
- Agencia: €12,500
- Reformas: €15,000
- Muebles: €5,000
CAPEX Total: €52,500

Financiación:
- Hipoteca: 70% (€175,000)
- Entrada: 30% (€75,000)
- Interés: 3.5%
- Plazo: 25 años

Resultados:
✅ ROI: 9.2% (Bueno)
✅ Cash-on-Cash: 11.5% (Bueno)
✅ Cap Rate: 5.8% (Aceptable)
⭐ Recomendación: BUENA INVERSIÓN
```

### Ejemplo 2: Local Comercial

```
Tipo: Local
Ubicación: Barcelona, zona comercial
Precio: €180,000
Renta mensual: €1,800

CAPEX:
- Notaría y registro: €2,200
- Impuesto transmisiones (6%): €10,800
- Sin reformas necesarias
CAPEX Total: €13,000

Sin Financiación (100% contado)

Resultados:
⭐ ROI: 11.8% (Excelente)
⭐ Cash-on-Cash: 11.8% (Bueno)
⭐ Cap Rate: 12.0% (Excelente)
⭐ Recomendación: EXCELENTE INVERSIÓN

Fortalezas:
✓ ROI superior al 10%
✓ Cap Rate alto (12%)
✓ Sin financiación = sin riesgo deuda
✓ Payback period: 8.5 años
```

### Ejemplo 3: Edificio Completo

```
Tipo: Edificio
Ubicación: Valencia
Precio: €900,000
Unidades: 8 pisos
Renta total mensual: €7,200

(Rent roll subido con OCR)

CAPEX:
- Notaría y registro: €9,000
- Impuesto transmisiones: €63,000
- Reformas comunes: €50,000
CAPEX Total: €122,000

Financiación:
- Hipoteca: 60% (€540,000)
- Entrada: 40% (€360,000)
- Interés: 3.8%
- Plazo: 30 años

Resultados:
⭐ ROI: 14.2% (Excelente)
⭐ Cash-on-Cash: 16.8% (Excelente)
⭐ Cap Rate: 9.6% (Excelente)
⭐⭐ Recomendación: INVERSIÓN EXCEPCIONAL

Fortalezas:
✓ ROI superior al 10%
✓ Cash-on-Cash superior al 15%
✓ Diversificación de riesgo (8 unidades)
✓ Alta ocupación (87.5%)
✓ Potencial de apreciación alto

Riesgos:
⚠ Inversión grande (alta exposición)
⚠ Gestión más compleja
```

---

## 🔧 Solución de Problemas

### Error: "Cannot find module 'pdf-parse'"

```bash
yarn add pdf-parse @types/pdf-parse
```

### Error: Prisma Client no actualizado

```bash
npx prisma generate
```

### Error: Tablas no existen

```bash
npx prisma migrate dev --name add_investment_analysis
```

### Error OCR: "Tesseract worker failed"

```bash
# Reinstalar tesseract.js
yarn remove tesseract.js
yarn add tesseract.js@latest
```

### Import desde Idealista no funciona

**Causa**: Idealista puede bloquear scraping

**Solución**:
1. Usar API oficial (si disponible)
2. Configurar `IDEALISTA_API_KEY` en .env
3. Alternativamente, copiar datos manualmente

---

## 📚 Recursos Adicionales

### Documentación Completa

- **`SISTEMA_COMPLETO_ANALISIS_INVERSION.md`**: Documentación técnica completa
- **`ANALIZADOR_INVERSION_INMOBILIARIA.md`**: Guía del analizador principal

### Videos Tutorial (crear)

1. **Introducción al Sistema** (5 min)
2. **Crear Primer Análisis** (8 min)
3. **Upload Rent Roll** (6 min)
4. **Import desde Portales** (7 min)
5. **Comparar Inversiones** (5 min)

### Soporte

- 📧 Email: soporte@inmova.app
- 💬 Chat: En aplicación
- 📚 Docs: /docs/investment-analysis

---

## 🎯 Checklist de Verificación

Antes de usar en producción:

- [ ] Dependencias instaladas (`yarn install`)
- [ ] Migración de BD ejecutada (`prisma migrate`)
- [ ] Variables de entorno configuradas (`.env`)
- [ ] Servidor reiniciado (`yarn dev`)
- [ ] Ruta accesible: `/herramientas-inversion`
- [ ] Test: Crear análisis básico
- [ ] Test: Subir rent roll PDF
- [ ] Test: Comparar 2 análisis
- [ ] Test: Exportar PDF

---

## ⚡ Shortcuts

### Accesos Directos

- `/analisis-inversion` - Crear análisis nuevo
- `/herramientas-inversion` - Hub de herramientas
- `/herramientas-inversion/mis-analisis` - Mis análisis guardados
- `/herramientas-inversion/comparador` - Comparador
- `/herramientas-inversion/rent-roll` - Uploader
- `/herramientas-inversion/importar` - Importer

### Atajos de Teclado (implementar)

- `Ctrl/Cmd + N` - Nuevo análisis
- `Ctrl/Cmd + S` - Guardar análisis
- `Ctrl/Cmd + E` - Exportar PDF
- `Ctrl/Cmd + K` - Comparar seleccionados

---

## 🚀 Tips Pro

### 1. Templates por Vertical

Guarda análisis como "templates" con configuración por defecto:
- `Template Piso Madrid` (CAPEX típicos de Madrid)
- `Template Local Barcelona` (Impuestos de Cataluña)
- `Template Garaje` (Valores estándar)

### 2. Automatización con Rent Rolls

Si gestionas múltiples edificios:
1. Sube rent roll mensual
2. Sistema detecta cambios
3. Recalcula automáticamente
4. Te notifica de variaciones

### 3. Comparación Estratégica

Compara propiedades por:
- **Mismo presupuesto**: Ver cuál rinde más
- **Mismo ROI**: Ver cuál requiere menos capital
- **Misma ubicación**: Entender precios de mercado

### 4. Recomendaciones IA

Activa todas las recomendaciones IA:
- cost_reduction
- income_increase
- financing
- operations
- strategy

Revísalas mensualmente e implementa las de prioridad **high**.

---

**¡Sistema listo para usar!** 🎉

Empieza por `/herramientas-inversion` y explora todas las funcionalidades.
