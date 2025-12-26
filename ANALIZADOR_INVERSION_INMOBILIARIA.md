# 🏢 Analizador de Inversión Inmobiliaria - INMOVA

## 📋 Descripción General

Herramienta profesional y completa para evaluar la viabilidad económica de cualquier inversión inmobiliaria, considerando:

- **CAPEX** (Inversión Inicial)
- **OPEX** (Gastos Operativos Recurrentes)
- **Financiación** (Hipotecas y préstamos)
- **Impuestos** (IRPF, plusvalías, IBI)
- **Proyecciones** a largo plazo
- **Análisis de Riesgo** automatizado

---

## 🎯 Verticales Soportados

### 1. **Piso/Apartamento** 🏠
Análisis completo para inversión residencial tradicional.

### 2. **Local Comercial** 🏪
Evaluación específica para locales de negocio con consideraciones comerciales.

### 3. **Plaza de Garaje** 🚗
Análisis optimizado para estacionamientos con OPEX reducido.

### 4. **Trastero** 📦
Evaluación para unidades de almacenamiento con alta rentabilidad potencial.

### 5. **Edificio Completo** 🏢
Análisis de gran escala para edificios completos con múltiples unidades.

---

## 💰 CAPEX - Inversión Inicial

El analizador considera TODOS los costos iniciales:

### Costos de Adquisición
- **Precio de compra** del inmueble
- **Notaría y Registro** (típicamente 1-2% del valor)
- **Impuesto de Transmisión Patrimonial (ITP)** o **IVA + AJD**
  - ITP: 6-10% (vivienda segunda mano)
  - IVA: 10% + AJD 1.5% (obra nueva)
- **Comisiones de agencia** (típicamente 2-5%)

### Costos de Puesta en Marcha
- **Renovación y reformas**
- **Mobiliario y equipamiento**
- **Asesoría legal inicial**
- **Otros costos** (licencias, permisos, etc.)

### Cálculo Automático
```
CAPEX Total = Precio Compra + Notaría + ITP/IVA + Agencia + 
              Renovación + Mobiliario + Legal + Otros
```

---

## 🔄 OPEX - Gastos Operativos Recurrentes

### Gastos Mensuales/Anuales
- **Gastos de comunidad** (si aplica)
- **IBI** (Impuesto sobre Bienes Inmuebles)
- **Seguro de hogar/local**
- **Mantenimiento** (% del valor del inmueble)
- **Gestión de propiedad** (% de la renta, si externalizas)
- **Vacancia esperada** (% de tiempo sin inquilinos)

### Cálculo Automático
```
OPEX Anual = (Comunidad × 12) + IBI + Seguro + 
             (Valor × % Mantenimiento) + 
             (Renta × % Gestión) × (1 - % Vacancia)
```

---

## 🏦 Financiación Hipotecaria

### Parámetros Configurables
- **Capital propio** (entrada)
- **Monto del préstamo**
- **Tasa de interés** anual
- **Plazo** del préstamo (hasta 40 años)

### Métricas Calculadas
- **Cuota mensual** de hipoteca
- **Total de intereses** pagados
- **LTV** (Loan-to-Value) - % de financiación
- **DSCR** (Debt Service Coverage Ratio)
  - > 1.5: Excelente
  - 1.25-1.5: Aceptable
  - < 1.25: Riesgoso

### Fórmula de Cuota
```
Cuota Mensual = P × [r(1+r)^n] / [(1+r)^n - 1]

Donde:
P = Monto del préstamo
r = Tasa de interés mensual
n = Número de pagos
```

---

## 📊 Impuestos

### Impuestos sobre Rentas
- **IRPF** sobre rendimientos del capital inmobiliario
- Típicamente: 19-23% según tramo
- Base imponible: Ingresos - Gastos deducibles
- **Gastos deducibles:**
  - Intereses de hipoteca (parcialmente)
  - IBI
  - Comunidad
  - Seguro
  - Mantenimiento
  - Amortización (3% anual del valor catastral)

### Impuestos en Venta
- **Plusvalía/Ganancia de Capital**
- Típicamente: 19-23% sobre la ganancia
- Ganancia = Precio Venta - Precio Compra - Mejoras

---

## 📈 Métricas de Rentabilidad

### 1. **ROI (Return on Investment)**
```
ROI = (NOI Anual / CAPEX Total) × 100
```
- Retorno sobre la inversión total
- **Benchmark:**
  - > 15%: Excelente
  - 10-15%: Bueno
  - 5-10%: Aceptable
  - < 5%: Bajo

### 2. **Cash-on-Cash Return**
```
Cash-on-Cash = (Cash Flow Neto Anual / Capital Propio) × 100
```
- Retorno sobre el capital que TÚ invertiste
- **Benchmark:**
  - > 12%: Excelente
  - 8-12%: Bueno
  - 5-8%: Aceptable
  - < 5%: Bajo

### 3. **Cap Rate (Capitalization Rate)**
```
Cap Rate = (NOI Anual / Valor del Inmueble) × 100
```
- Tasa de capitalización (sin considerar financiamiento)
- **Benchmark:**
  - > 8%: Muy bueno
  - 6-8%: Bueno
  - 4-6%: Promedio
  - < 4%: Bajo

### 4. **Gross Yield (Rentabilidad Bruta)**
```
Gross Yield = (Renta Anual / Precio Compra) × 100
```

### 5. **Net Yield (Rentabilidad Neta)**
```
Net Yield = (Cash Flow Neto / Capital Propio) × 100
```

### 6. **TIR/IRR (Tasa Interna de Retorno)**
- Retorno anualizado considerando valor temporal del dinero
- Incluye flujos de efectivo + ganancia de capital al vender

### 7. **Payback Period**
```
Payback = Capital Propio / Cash Flow Neto Anual
```
- Años para recuperar la inversión

### 8. **Break-Even Occupancy**
```
Break-Even = [(OPEX + Hipoteca) / Renta Bruta] × 100
```
- % mínimo de ocupación para no perder dinero

---

## 🎯 Proyecciones a Largo Plazo

### Factores Considerados
- **Apreciación del inmueble** (revalorización anual %)
- **Incremento de rentas** (ajuste anual %)
- **Inflación** (incremento de gastos %)
- **Amortización del préstamo**
- **Impacto fiscal acumulado**

### Cálculos Proyectados
```
Valor Futuro = Valor Actual × (1 + Apreciación%)^Años

Cash Flow Acumulado = Σ (Cash Flow Año i × Factores de ajuste)

Ganancia de Capital = Valor Futuro - Valor Compra - Préstamo Restante - Impuestos

Retorno Total = [(Ganancia Capital + Cash Flow Acumulado) / Capital Propio] × 100
```

---

## ⚠️ Análisis de Riesgo Automatizado

### Sistema de Evaluación Automática

El analizador clasifica la inversión en 5 categorías:

#### ⭐ **Excelente**
- Cash-on-Cash ≥ 10%
- Cap Rate ≥ 6%
- DSCR ≥ 1.5
- Sin factores de riesgo significativos
- Al menos 3 fortalezas identificadas

#### ✓ **Buena**
- Cash-on-Cash ≥ 7%
- Cap Rate ≥ 5%
- Máximo 1 factor de riesgo menor

#### ~ **Aceptable**
- Cash Flow positivo
- Máximo 2 factores de riesgo
- Requiere optimización

#### ⚠ **Riesgosa**
- Cash Flow positivo pero ajustado
- 3 o más factores de riesgo
- Requiere análisis adicional

#### ✗ **No Recomendada**
- Cash Flow negativo, o
- Múltiples factores de riesgo críticos

### Factores de Riesgo Evaluados

#### 🔴 Alto Riesgo
- Cash Flow negativo
- DSCR < 1.25
- Break-even > 80%
- LTV > 90%
- ROI negativo

#### 🟡 Riesgo Moderado
- Cap Rate < 4%
- Cash-on-Cash < 5%
- LTV > 80%
- Break-even 70-80%

#### 🟢 Bajo Riesgo
- Cash-on-Cash > 10%
- Cap Rate > 6%
- DSCR > 1.5
- LTV < 70%
- Break-even < 60%

---

## 📱 Casos de Uso por Vertical

### 🏠 Piso/Apartamento

#### Configuración Típica
- **Precio:** €150,000 - €500,000
- **Renta:** €800 - €2,500/mes
- **OPEX:** €150 - €400/mes
- **Vacancia:** 5-10%
- **Apreciación:** 2-4% anual

#### Métricas Objetivo
- Cap Rate: 5-7%
- Cash-on-Cash: 8-12%
- Break-even: < 65%

---

### 🏪 Local Comercial

#### Configuración Típica
- **Precio:** €100,000 - €1,000,000
- **Renta:** €1,000 - €5,000/mes
- **OPEX:** €200 - €800/mes
- **Vacancia:** 10-15% (mayor riesgo)
- **Apreciación:** 1-3% anual

#### Métricas Objetivo
- Cap Rate: 6-9%
- Cash-on-Cash: 10-15%
- Break-even: < 70%

#### Consideraciones Especiales
- Mayor renta pero mayor vacancia
- Contratos más largos
- Dependencia del sector comercial

---

### 🚗 Plaza de Garaje

#### Configuración Típica
- **Precio:** €15,000 - €50,000
- **Renta:** €80 - €200/mes
- **OPEX:** €20 - €60/mes
- **Vacancia:** 5-8%
- **Apreciación:** 1-2% anual

#### Métricas Objetivo
- Cap Rate: 4-6%
- Cash-on-Cash: 6-10%
- Break-even: < 50%

#### Ventajas
- Bajo OPEX
- Baja vacancia
- Bajo mantenimiento
- Fácil gestión

---

### 📦 Trastero

#### Configuración Típica
- **Precio:** €5,000 - €20,000
- **Renta:** €40 - €100/mes
- **OPEX:** €10 - €30/mes
- **Vacancia:** 5-10%
- **Apreciación:** 1-2% anual

#### Métricas Objetivo
- Cap Rate: 5-8%
- Cash-on-Cash: 8-12%
- Break-even: < 45%

#### Ventajas
- Inversión mínima
- Muy bajo OPEX
- Sin problemas de inquilinos
- Baja gestión

---

### 🏢 Edificio Completo

#### Configuración Típica
- **Precio:** €500,000 - €5,000,000+
- **Renta:** €5,000 - €50,000+/mes
- **OPEX:** €1,500 - €15,000/mes
- **Vacancia:** 8-12%
- **Apreciación:** 3-5% anual

#### Métricas Objetivo
- Cap Rate: 6-10%
- Cash-on-Cash: 10-18%
- Break-even: < 70%

#### Consideraciones Especiales
- Economías de escala
- Gestión profesional recomendada
- Mayor complejidad legal
- Diversificación de ingresos

---

## 🎓 Ejemplos Prácticos

### Ejemplo 1: Piso para Alquiler Tradicional

**Datos de Entrada:**
- Tipo: Piso
- Precio compra: €200,000
- Gastos iniciales: €30,000 (ITP, notaría, reforma)
- Financiación: 80% (€160,000 préstamo)
- Interés: 3.5%, 25 años
- Renta: €1,200/mes
- OPEX: €250/mes

**Resultados:**
- CAPEX Total: €230,000
- Capital Propio: €70,000
- Cuota hipoteca: €799/mes
- Cash Flow: €151/mes (€1,812/año)
- **Cash-on-Cash: 2.6%** ⚠️ Bajo
- **Cap Rate: 5.7%** ✓ Aceptable
- Break-even: 66% ✓
- **Recomendación: Aceptable** (mejorar con mayor entrada o menor precio)

---

### Ejemplo 2: Local Comercial

**Datos de Entrada:**
- Tipo: Local
- Precio compra: €250,000
- Gastos iniciales: €35,000
- Financiación: 70% (€175,000)
- Interés: 4%, 20 años
- Renta: €2,000/mes
- OPEX: €350/mes

**Resultados:**
- CAPEX Total: €285,000
- Capital Propio: €110,000
- Cuota hipoteca: €1,061/mes
- Cash Flow: €589/mes (€7,068/año)
- **Cash-on-Cash: 6.4%** ✓
- **Cap Rate: 7.9%** ✓✓ Bueno
- Break-even: 70%
- **Recomendación: Buena** ✓

---

### Ejemplo 3: Cartera de Garajes (5 plazas)

**Datos de Entrada (por plaza):**
- Tipo: Garaje
- Precio compra: €20,000
- Gastos iniciales: €2,500
- Sin financiación (compra cash)
- Renta: €100/mes
- OPEX: €25/mes

**Resultados por plaza:**
- CAPEX Total: €22,500
- Cash Flow: €75/mes (€900/año)
- **Cash-on-Cash: 4%**
- **Cap Rate: 4.5%**

**Resultados cartera (5 plazas):**
- CAPEX Total: €112,500
- Cash Flow: €375/mes (€4,500/año)
- **Cash-on-Cash: 4%** (sin apalancamiento)
- **Ventajas:** Muy bajo mantenimiento, diversificación

---

## 🚀 Características Avanzadas

### 1. **Comparador de Escenarios**
- Guarda múltiples análisis
- Compara inversiones lado a lado
- Identifica la mejor oportunidad

### 2. **Análisis de Sensibilidad**
- ¿Qué pasa si la renta baja 10%?
- ¿Y si los intereses suben 1%?
- ¿Y si la vacancia aumenta?

### 3. **Exportación de Reportes**
- Genera PDF profesional
- Incluye todos los cálculos
- Gráficos y visualizaciones

### 4. **Integración con CRM**
- Vincula análisis a propiedades
- Seguimiento de ofertas
- Historial de evaluaciones

---

## 📊 Interpretación de Resultados

### Semáforo de Métricas

#### 🟢 Verde (Excelente)
- ROI > 15%
- Cash-on-Cash > 12%
- Cap Rate > 8%
- DSCR > 1.75
- Break-even < 55%

#### 🟡 Amarillo (Aceptable)
- ROI: 8-15%
- Cash-on-Cash: 6-12%
- Cap Rate: 5-8%
- DSCR: 1.25-1.75
- Break-even: 55-70%

#### 🔴 Rojo (Riesgoso)
- ROI < 8%
- Cash-on-Cash < 6%
- Cap Rate < 5%
- DSCR < 1.25
- Break-even > 70%

---

## 💡 Consejos y Mejores Prácticas

### Para Maximizar Rentabilidad

1. **Reduce CAPEX inicial**
   - Negocia precio de compra
   - Busca propiedades con potencial
   - Minimiza costos de reforma

2. **Optimiza OPEX**
   - Autogestión (ahorra comisiones)
   - Seguros competitivos
   - Mantenimiento preventivo

3. **Maximiza Ingresos**
   - Precio de mercado justo
   - Servicios adicionales (parking, trastero)
   - Contratos anuales

4. **Aprovecha Financiación**
   - LTV óptimo: 70-80%
   - Mejores tasas de interés
   - Apalancamiento inteligente

5. **Gestión Fiscal**
   - Aprovecha deducciones
   - Amortización acelerada
   - Planificación de ventas

---

## 🔐 Consideraciones Legales y Fiscales

### España - Régimen Fiscal

#### Rentas del Alquiler
- **Base imponible:** Ingresos - Gastos deducibles
- **Reducción:** 60% si alquiler como vivienda habitual
- **Tipo impositivo:** 19-47% según tramo IRPF

#### Gastos Deducibles
- ✅ Intereses de préstamo (hasta límite)
- ✅ IBI
- ✅ Gastos de comunidad
- ✅ Seguro
- ✅ Reparaciones y conservación
- ✅ Amortización (3% valor catastral, edificación)
- ✅ Servicios profesionales
- ❌ Muebles (amortización separada)
- ❌ Mejoras (capitalizar)

#### Venta del Inmueble
- **Plusvalía Municipal (IIVTNU)**
- **Ganancia de Capital (IRPF):**
  - 19% hasta €6,000
  - 21% de €6,000 a €50,000
  - 23% más de €50,000 (2024)
- **Exención:** Si reinviertes en vivienda habitual (mayores de 65 años)

---

## 📞 Soporte y Recursos

### Documentación Adicional
- [Guía OPEX](./GUIA_OPEX.md)
- [Guía CAPEX](./GUIA_CAPEX.md)
- [Fiscalidad Inmobiliaria](./FISCALIDAD.md)

### Contacto
- **Email:** soporte@inmova.app
- **Tel:** +34 XXX XXX XXX
- **Web:** https://inmova.app/analisis-inversion

---

## 🎯 Roadmap

### Próximas Funcionalidades

#### Q1 2026
- [ ] Comparador de múltiples propiedades
- [ ] Análisis de sensibilidad automático
- [ ] Alertas de oportunidades

#### Q2 2026
- [ ] IA para recomendaciones personalizadas
- [ ] Integración con plataformas de venta (Idealista, Fotocasa)
- [ ] Marketplace de inversiones

#### Q3 2026
- [ ] Tokenización de activos (Blockchain)
- [ ] Crowdfunding inmobiliario integrado
- [ ] API pública para terceros

---

## ✅ Conclusión

El **Analizador de Inversión Inmobiliaria de INMOVA** es la herramienta más completa del mercado español para evaluar inversiones inmobiliarias de cualquier tipo.

Con consideración exhaustiva de:
- ✅ Todos los costos (CAPEX + OPEX)
- ✅ Financiación y apalancamiento
- ✅ Impuestos y deducciones
- ✅ Proyecciones realistas
- ✅ Análisis de riesgo automatizado
- ✅ Recomendaciones inteligentes

**Toma decisiones informadas y maximiza tu rentabilidad inmobiliaria.**

---

© 2025 INMOVA - Todos los derechos reservados
