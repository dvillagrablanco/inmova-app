# DiliTrust Integration — Gaps Detectados y Mejoras Propuestas

**Fecha**: 11 marzo 2026  
**Fuente**: Análisis de 173 PDFs del grupo Vidaro/Baldomero descargados de DiliTrust  
**Reportings analizados**: AF (Activos Financieros), AR (Asset Report), Amper, MiFID II

---

## 1. RESUMEN EJECUTIVO

Se han descargado y analizado 173 documentos de DiliTrust que contienen:
- **80 reportings mensuales** (AF, AR, Amper, MiFID) de abril 2023 a febrero 2026
- **15 presentaciones** trimestrales Baldomero
- **3 Houseview** anuales
- **58 Capital Calls** de 10 fondos PE
- **9 Distribuciones** PE
- **8 documentos** varios (secundarios, comunicados)

### Patrimonio total a 31/01/2026:

| Cartera | Código | Valor | Custodios |
|---------|--------|-------|-----------|
| **BALDOMERO AF GRUPO** | 1149.01 | €44.743.029 | Inversis, Pictet, Banca March, CACEIS |
| **BALDOMERO PE GRUPO** | 1149.02 | €17.651.869 | CaixaBank, Bankinter (15 fondos PE) |
| **BALDOMERO AR GRUPO** | 1149.03 | €23.797.699 | Bankinter, UBS, Inversis |
| **BALDOMERO AMPER** | 1142.09 | €1.535.127 | Inversis |
| **TOTAL MASTER** | | **~€87.727.724** | |

---

## 2. DATOS EXTRAÍDOS DE LOS PDFs

### 2.1 Reporting AF (Activos Financieros)

**Datos disponibles que la app NO muestra actualmente:**

| Dato | Descripción | Frecuencia |
|------|-------------|------------|
| **Evolución patrimonial mensual** | Patrimonio total + aportaciones/retiradas + beneficios por mes (13 meses) | Mensual |
| **Performance por año** | Rentabilidad 2023, 2024, 2025, YTD, desde inicio, anualizada | Mensual |
| **Asset allocation vs objetivo** | Actual vs target con desviación (ej: RV 44.79% vs 45% target) | Mensual |
| **Desglose por custodio** | Valor por custodio: Inversis €9.8M, Pictet €12.1M, March €5.7M, CACEIS €17.2M | Mensual |
| **Comisiones desglosadas** | Gestión MdF, consultoría, depositaría, gastos bancarios | Mensual |
| **Volatilidad y Sharpe** | Volatilidad 12M, rentabilidad, Sharpe ratio por cartera | Mensual |
| **Posiciones individuales con ISIN** | ~83 posiciones con ISIN, cantidad, precio, coste, valor, peso, P&L 12M, YTD | Mensual |
| **Bonos con detalle** | Vencimiento, cupón, TIR compra, TIR actual, duración, nominal, rating, prelación | Mensual |
| **Benchmarks** | 17+ índices (MSCI World, IBEX, Bloomberg, Gold, etc.) con niveles y rentabilidades | Mensual |

### 2.2 Reporting AR (Asset Report)

| Dato | Descripción |
|------|-------------|
| Cartera diferente con custodios Bankinter, UBS, Inversis | €23.8M |
| Posiciones en activos en renta (inmobiliarios gestionados) | Complementa datos inmobiliarios |

### 2.3 Reporting Amper

| Dato | Descripción |
|------|-------------|
| Cartera gestionada separada (perfil arriesgado) | €1.5M en Inversis |
| Solo activos financieros, sin PE | Menor complejidad |

### 2.4 Capital Calls PE

| Dato | Descripción |
|------|-------------|
| **10 fondos PE activos** | Portobello, MCH Green, TB Direct III, PASF V, Coalesce, Industry Ventures X, New Mountain VII, Columbus IV, Axiom Asia 7, Artá Capital, Overbay |
| **Compromiso total** | €23.4M |
| **Capital llamado** | €16.6M |
| **Capital pendiente** | €7.7M |
| **Datos bancarios** de cada fondo | IBAN, BIC, beneficiario para capital calls |
| **Detalle de comisiones** | Comisión de gestión por fondo/trimestre |

---

## 3. GAPS IDENTIFICADOS

### 3.1 CRÍTICOS — Datos disponibles, app no los muestra

| # | Gap | Impacto | Esfuerzo |
|---|-----|---------|----------|
| **G1** | **No hay histórico mensual real** — La evolución patrimonial del dashboard es calculada, no histórica | El family office no puede ver tendencias reales de los últimos 3 años | Medio |
| **G2** | **No hay performance por año** — Rentabilidad 2023/2024/2025/YTD/desde inicio no se muestra | Dato fundamental para un family office | Bajo |
| **G3** | **No hay desglose AF por custodio** — Dashboard muestra total pero no por Inversis/Pictet/March/CACEIS | El cliente ve el total pero no dónde está distribuido | Bajo |
| **G4** | **No hay desviaciones vs objetivos** — Target allocation existe en PDFs pero no en UI | Asset allocation sin referencia de si está bien o mal | Medio |
| **G5** | **Múltiples portfolios mezclados** — AF, AR y Amper se mezclan en una sola vista | No se puede ver cada cartera independientemente | Medio |
| **G6** | **PE: no se importa rentabilidad mensual** — El parser extrae PE pero no alimenta patrimonioInicioPeriodo, rentabilidadPeriodoEur/Pct | La tabla de rentabilidad PE en el módulo PE queda vacía | Bajo |

### 3.2 IMPORTANTES — Mejoran significativamente la experiencia

| # | Gap | Impacto | Esfuerzo |
|---|-----|---------|----------|
| **G7** | **Comisiones no visibles** — PDFs detallan comisiones por concepto, app no las muestra | Family office paga ~€31K/mes en comisiones sin visibilidad | Bajo |
| **G8** | **Benchmarks no comparados** — 17 índices disponibles, ninguno comparado en UI | Sin referencia de si la cartera va bien vs mercado | Medio |
| **G9** | **Volatilidad y Sharpe ausentes** — Datos de riesgo extraídos pero no mostrados | Métricas estándar de cualquier wealth management | Bajo |
| **G10** | **Bonos sin detalle** — TIR, duración, cupón, vencimiento, rating no se muestran | Información crítica para renta fija | Medio |
| **G11** | **Return 12M y YTD por posición** — Extraídos del PDF pero no usados en cartera | Solo se muestra P&L absoluto, no rentabilidad | Bajo |
| **G12** | **Capital Calls: datos bancarios** — IBAN/BIC de cada fondo disponible | Podría autocompletar transferencias de capital calls | Bajo |

### 3.3 FUTURAS — Nice-to-have

| # | Gap | Impacto | Esfuerzo |
|---|-----|---------|----------|
| **G13** | Tipos de cambio históricos | Multi-divisa preciso | Alto |
| **G14** | Alertas automáticas por desviación vs target | Proactivo | Medio |
| **G15** | Generación automática de informe consolidado (MDFF-style) | Reemplaza informe manual | Alto |

---

## 4. MODELO DE DATOS — Cambios Necesarios

### 4.1 Nueva tabla: MonthlySnapshot

Para almacenar el histórico mensual real extraído de los PDFs:

```prisma
model MonthlySnapshot {
  id          String   @id @default(cuid())
  companyId   String
  company     Company  @relation(fields: [companyId], references: [id])
  
  portfolioCode  String     // "1149.01", "1149.03", "1142.09"
  portfolioName  String     // "BALDOMERO AF GRUPO"
  reportDate     DateTime   // Último día del mes
  reportType     String     // "AF", "AR", "AMPER", "MIFID"
  
  totalValue      Float     // Patrimonio total
  previousValue   Float     // Patrimonio mes anterior
  deposits        Float     // Aportaciones/retiradas
  netPnl          Float     // Beneficio neto
  fees            Float     // Comisiones totales
  
  // Asset allocation
  monetario       Float @default(0)
  rentaFija       Float @default(0)
  rentaVariable   Float @default(0)
  commodities     Float @default(0)
  alternativos    Float @default(0)
  
  // Performance
  returnYtd       Float?
  returnSinceInception Float?
  annualizedReturn Float?
  volatility12m   Float?
  sharpeRatio     Float?
  
  // Custodian breakdown (JSON)
  custodianBreakdown Json?   // [{custodian, total, pnl}]
  
  // Source
  sourceDocumentId String?  // DiliTrust document ID
  
  createdAt DateTime @default(now())
  
  @@unique([companyId, portfolioCode, reportDate])
  @@index([companyId])
  @@index([reportDate])
  @@map("monthly_snapshots")
}
```

### 4.2 Campos nuevos en FinancialPosition

```prisma
// Añadir a FinancialPosition:
return12m    Float?    // Rentabilidad últimos 12 meses
returnYtd    Float?    // Rentabilidad YTD
maturityDate DateTime? // Fecha vencimiento (bonos)
couponRate   Float?    // Cupón (bonos)
yieldAtCost  Float?    // TIR de compra
currentYield Float?    // TIR actual
duration     Float?    // Duración (bonos)
rating       String?   // Rating crediticio
nominal      Float?    // Nominal (bonos)
```

### 4.3 Nueva tabla: PortfolioBenchmark

```prisma
model PortfolioBenchmark {
  id          String @id @default(cuid())
  companyId   String
  
  name        String   // "MSCI World Net TR EUR"
  ticker      String?  // "MSDEWIN Index"
  date        DateTime
  level       Float    // Nivel del índice
  
  returnMonth Float?
  returnYtd   Float?
  return1y    Float?
  return3y    Float?
  return5y    Float?
  
  createdAt DateTime @default(now())
  
  @@unique([companyId, name, date])
  @@map("portfolio_benchmarks")
}
```

---

## 5. MEJORAS DE UI PROPUESTAS

### 5.1 Dashboard — Evolución Patrimonial Real (G1)

Gráfico de líneas con 3 años de datos reales:
- Eje X: meses (abr 2023 → feb 2026)
- Eje Y: patrimonio total
- Series: AF, PE, AR, Amper, Total

### 5.2 Dashboard — Performance Table (G2)

| Cartera | 2023 | 2024 | 2025 | YTD 2026 | Desde inicio | Anualizada |
|---------|------|------|------|----------|-------------|------------|
| AF GRUPO | 3.56% | 8.40% | 7.98% | 2.16% | 23.84% | 7.51% |
| INVERSIS | 3.61% | 7.95% | 10.11% | 2.52% | 26.26% | 8.22% |
| PICTET | 4.44% | 8.53% | 5.15% | 1.83% | 21.36% | 7.04% |
| ... | | | | | | |

### 5.3 Dashboard — Custodian Breakdown (G3)

Donut chart con 4 segmentos:
- Inversis: €9.8M (22%)
- Pictet: €12.1M (27%)
- Banca March: €5.7M (13%)
- CACEIS: €17.2M (38%)

### 5.4 Portfolio Selector (G5)

Tab bar o dropdown para filtrar por cartera:
- **Master** (consolidado)
- AF Grupo (1149.01)
- PE Grupo (1149.02)
- AR Grupo (1149.03)
- Amper (1142.09)

### 5.5 Asset Allocation vs Target (G4)

| Activo | Actual | Objetivo | Desviación |
|--------|--------|----------|------------|
| Mercado monetario | 11.89% | 12.00% | -0.11% |
| Renta fija | 35.92% | 43.00% | **-7.08%** |
| Renta variable | 44.79% | 45.00% | -0.21% |
| Commodities | 5.91% | 0.00% | +5.91% |
| Alternativos | 1.50% | 0.00% | +1.50% |

Con indicadores visuales (verde/amarillo/rojo) según desviación.

---

## 6. PRIORIZACIÓN RECOMENDADA

### Sprint 1 (inmediato) — Datos
1. ✅ Ejecutar import: `npx tsx scripts/import-dilitrust-to-inmova.ts`
2. Crear migración Prisma para MonthlySnapshot
3. Popular MonthlySnapshot con los 80 reportings mensuales

### Sprint 2 — UI Performance
4. Dashboard: tabla de performance por año (G2)
5. Dashboard: gráfico evolución patrimonial real (G1)
6. Dashboard: desglose por custodio (G3)

### Sprint 3 — UI Avanzada
7. Portfolio selector/filtro (G5)
8. Asset allocation vs target (G4)
9. Comisiones visibles (G7)
10. Benchmarks comparados (G8)

### Sprint 4 — Detalle
11. Posiciones: return12m, returnYtd (G11)
12. Bonos: detalle (G10)
13. PE: rentabilidad mensual (G6)
14. Alertas por desviación (G14)

---

## 7. SYNC AUTOMÁTICO

Script configurado: `scripts/dilitrust-sync.py`

```cron
# Sync diario a las 7 AM
0 7 * * * cd /workspace && python3 scripts/dilitrust-sync.py --new-only >> /var/log/inmova/dilitrust-sync.log 2>&1

# Import a Inmova después del sync
30 7 * * * cd /workspace && npx tsx scripts/import-dilitrust-to-inmova.ts --latest-only >> /var/log/inmova/dilitrust-import.log 2>&1
```

---

**Última actualización**: 11 marzo 2026
