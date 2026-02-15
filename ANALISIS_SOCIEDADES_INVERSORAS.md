# Analisis de Necesidades: Viroda, Rovida y Vidaro Inversiones

## Perfil de las Sociedades

Los nombres Viroda, Rovida y Vidaro son anagramas entre si, lo que indica un **grupo de sociedades patrimoniales/inversoras** con un mismo titular o grupo familiar. Patron tipico en Espana para:

- **Separar riesgo patrimonial** entre distintos vehiculos societarios
- **Optimizar fiscalidad** distribuyendo activos entre SLs
- **Facilitar sucesion** y planificacion patrimonial
- **Gestionar carteras diferenciadas** (ej: residencial, comercial, vacacional)

Perfil tipico: Sociedad Limitada (SL) patrimonial con CIF B-XXXXXXXX, tributa en Impuesto de Sociedades (IS) al 25%, posee inmuebles en propiedad que alquila a terceros.

---

## GAP Analysis: Lo que la app NO tiene para este perfil

### 1. VISION CONSOLIDADA MULTI-SOCIEDAD (CRITICO)

**Necesidad**: Un inversor con 3 SLs necesita ver el rendimiento TOTAL de su patrimonio inmobiliario y tambien por sociedad.

**Estado actual**: La app tiene `parentCompanyId` en Company y `childCompanies` relation pero NO tiene:
- Dashboard consolidado que agregue KPIs de varias companies
- P&L consolidado multi-sociedad
- Balance patrimonial consolidado
- Comparativa de rendimiento entre sociedades

**Solucion**: API y UI de dashboard consolidado de grupo.

---

### 2. TRACKING DE ACTIVOS INMOBILIARIOS (CRITICO)

**Necesidad**: Cada inmueble tiene un valor de adquisicion, gastos de compra, reformas capitalizables, y su valor evoluciona. Las SLs necesitan:
- Precio de compra + gastos (notaria, registro, ITP/AJD)
- Reformas capitalizables vs gastos corrientes
- Valor catastral (para IBI) vs valor de mercado
- Valor contable (compra - amortizacion acumulada)
- Plusvalia latente (valor mercado - valor contable)

**Estado actual**: `Building` tiene `ibiAnual` y `Unit` tiene `rentaMensual` pero NO tiene:
- Precio de adquisicion
- Fecha de adquisicion
- Gastos de escritura
- Reformas capitalizables
- Valor catastral desglosado (suelo/construccion)
- Amortizacion acumulada
- Valor de mercado actualizado

**Solucion**: Modelo `AssetAcquisition` ligado a Building/Unit.

---

### 3. HIPOTECAS Y FINANCIACION (CRITICO)

**Necesidad**: Las SLs patrimoniales financian compras con hipotecas. Necesitan:
- Tracking de cada hipoteca (capital vivo, tipo interes, cuota)
- Desglose cuota: capital + intereses (los intereses son gasto deducible)
- Vencimientos y renovaciones
- Ratio LTV (Loan-to-Value) por inmueble y total
- Cash-flow real: ingresos - gastos - cuota hipoteca

**Estado actual**: Existe `lib/calculators/mortgage-calculator.ts` pero es un calculador estatico, no un tracker de hipotecas reales. No hay modelo en Prisma.

**Solucion**: Modelo `Mortgage` con amortizacion mensual automatica.

---

### 4. FISCALIDAD DE SOCIEDADES (CRITICO)

**Necesidad**: Cada SL tributa por IS (25%). La app debe calcular:
- Base imponible: ingresos - gastos deducibles - amortizaciones
- Pagos fraccionados (modelo 202): 3 al ano
- Impuesto Sociedades anual (modelo 200)
- IVA en alquileres comerciales (modelo 303/390)
- Modelo 347 (operaciones >3.005,06 EUR)
- Modelo 184 si alguna sociedad es CB

**Estado actual**: Existe pagina de impuestos y API de calculo pero orientada a IRPF de persona fisica, no a IS de sociedades. No hay:
- Calculo de base imponible con amortizaciones
- Modelo 202 (pagos fraccionados IS)
- Modelo 200 (declaracion anual IS)
- Diferencia entre gastos deducibles vs no deducibles para IS

**Solucion**: Modulo fiscal de sociedades patrimoniales.

---

### 5. AMORTIZACIONES CONTABLES (ALTO)

**Necesidad**: Las SLs amortizan inmuebles al 3% anual sobre el valor de construccion (excl. suelo). Necesitan:
- Tabla de amortizacion por inmueble
- Desglose automatico valor suelo vs construccion (regla catastral)
- Amortizacion anual automatica
- Amortizacion de mejoras capitalizables
- Cuadro resumen anual para IS

**Estado actual**: Solo 4 menciones a "amortizacion" en toda la app, ninguna es un sistema real.

**Solucion**: Servicio de amortizacion con calculo automatico.

---

### 6. CASH-FLOW REAL POR SOCIEDAD (ALTO)

**Necesidad**: El cash-flow real de una SL patrimonial es:
```
+ Ingresos alquiler
- Gastos comunidad
- IBI
- Seguro
- Mantenimiento
- Cuota hipoteca (capital + intereses)
- Impuestos (IS, IVA)
= Cash-flow neto
```

**Estado actual**: El dashboard muestra ingresos y gastos pero NO incluye cuotas hipotecarias ni impuestos en el calculo.

**Solucion**: Widget de cash-flow real con todos los componentes.

---

### 7. RENTABILIDAD POR INMUEBLE (ALTO)

**Necesidad**: Cada inmueble debe mostrar:
- Rentabilidad bruta: (renta anual / precio compra) x 100
- Rentabilidad neta: (NOI / inversion total) x 100
- Cash-on-cash: (cash-flow / capital propio) x 100
- Cap rate, yield, payback period
- Comparativa entre inmuebles del portfolio

**Estado actual**: `rental-yield-calculator.ts` existe pero es un calculador manual. No se calcula automaticamente con datos reales.

**Solucion**: Calculo automatico de rentabilidad con datos reales de cada Building/Unit.

---

### 8. REPORTING PARA ASESORIA/GESTORIA (MEDIO)

**Necesidad**: Las SLs patrimoniales trabajan con asesoria fiscal. Necesitan:
- Export de movimientos en formato contable (debe/haber)
- Libro de facturas emitidas (alquileres)
- Libro de facturas recibidas (gastos)
- Extracto por cuentas contables (PGC)
- Datos fiscales para la gestoria (resumen anual)

**Estado actual**: Existe export CSV/PDF pero no en formato contable estandar.

---

### 9. GESTION DE FIANZAS Y DEPOSITOS (MEDIO)

**Necesidad**: Las fianzas de alquiler se depositan en el organismo autonomico (IVIMA, INCASOL, etc.). Las SLs necesitan:
- Tracking de fianzas depositadas vs pendientes
- Alertas de deposito obligatorio
- Control de devoluciones al fin de contrato
- Interes legal del dinero sobre fianzas

**Estado actual**: `Contract` tiene `deposito` y `mesesFianza` pero no hay tracking del deposito legal.

---

### 10. CONTROL DOCUMENTAL SOCIETARIO (MEDIO)

**Necesidad**: Cada SL tiene documentacion corporativa:
- Escritura de constitucion
- Modificaciones estatutarias
- Actas de junta
- Poderes notariales
- Contratos de compraventa de inmuebles
- Escrituras de hipoteca

**Estado actual**: Existe sistema de documentos pero no tiene categorias especificas para documentacion societaria.

---

## Resumen de Gaps Priorizados

| # | Gap | Prioridad | Complejidad |
|---|-----|-----------|-------------|
| 1 | Dashboard consolidado multi-sociedad | CRITICA | Media |
| 2 | Tracking de activos (precio compra, valor) | CRITICA | Media |
| 3 | Hipotecas y financiacion | CRITICA | Media |
| 4 | Fiscalidad de sociedades (IS) | CRITICA | Alta |
| 5 | Amortizaciones contables | ALTA | Media |
| 6 | Cash-flow real por sociedad | ALTA | Baja |
| 7 | Rentabilidad automatica por inmueble | ALTA | Baja |
| 8 | Reporting contable para gestoria | MEDIA | Media |
| 9 | Gestion de fianzas/depositos legales | MEDIA | Baja |
| 10 | Documentacion societaria | MEDIA | Baja |
