# INMOVA Family Office Add-On — Hoja de Ruta

## Estudio de Necesidades y Plan de Desarrollo

**Versión**: 1.0  
**Fecha**: 27 de febrero de 2026  
**Cliente de referencia**: Vidaro Inversiones S.L. (holding del grupo Vidaro)  
**Multi-Family Office de referencia**: MDFF

---

## 1. CONTEXTO: ¿Por qué un Family Office necesita INMOVA?

### El problema actual

Un family office como Vidaro gestiona:
- **Activos inmobiliarios** (Rovida, Viroda) → Ya gestionados en INMOVA
- **Carteras financieras** (CACEIS, Inversis, Pictet, Banca March, Bankinter) → NO gestionados
- **Participaciones societarias** (Disfasa, Facundo, Girasoles, Incofasa, PDV Gesfasa) → Parcialmente
- **Tesorería** → Dispersa en 8+ bancos
- **Reporting consolidado** → Manual, en Excel

**Resultado**: La foto financiera COMPLETA del grupo requiere cruzar datos de múltiples plataformas, bancos y gestoras. Esto consume horas de trabajo y genera riesgo de error.

### La solución: INMOVA Family Office Add-On

Un módulo que **integre las carteras financieras con los activos inmobiliarios** para dar una **visión patrimonial 360°** al family office.

---

## 2. ESTUDIO DE NECESIDADES DE UN FAMILY OFFICE

### 2.1 Gestión Patrimonial Consolidada

| Necesidad | Descripción | Prioridad |
|-----------|-------------|-----------|
| **Visión 360° del patrimonio** | Dashboard único con: inmuebles + carteras financieras + participaciones + tesorería | 🔴 Crítica |
| **Evolución patrimonial** | Gráfico temporal del valor total del patrimonio (inmobiliario + financiero) | 🔴 Crítica |
| **Asset allocation** | Distribución del patrimonio por tipo de activo: inmobiliario, renta fija, renta variable, liquidez, private equity | 🔴 Crítica |
| **Consolidación multi-divisa** | Posiciones en EUR, USD, CHF, GBP consolidadas | 🟡 Importante |
| **Benchmark** | Comparar rendimiento de la cartera vs índices (IBEX35, S&P500, inmobiliario) | 🟡 Importante |

### 2.2 Conexión con Entidades Bancarias

| Entidad | Tipo | Servicios | Integración necesaria |
|---------|------|-----------|----------------------|
| **Banca March** | Banca privada | Custodia, gestión patrimonial, PE | API/scraping extractos |
| **Pictet** | Gestora suiza | Fondos, gestión discrecional | Extractos PDF/SWIFT |
| **UBS** | Banca privada global | Wealth management, trading | API WealthConnect |
| **CACEIS** | Custodio institucional | Custodia de fondos, reporting | SWIFT MT535/MT940 |
| **Inversis** | Plataforma fondos | Fondos inversión, SICAVs | API/extractos |
| **Bankinter** | Banca comercial | Cuentas, hipotecas, valores | API PSD2 / CAMT.053 |
| **Santander** | Banca comercial | Cuentas, depósitos | API PSD2 |
| **CaixaBank** | Banca comercial | Cuentas, seguros | API PSD2 |
| **BBVA** | Banca comercial | Cuentas, valores | API BBVA Open Platform |

### 2.3 Carteras de Inversión

| Necesidad | Descripción | Prioridad |
|-----------|-------------|-----------|
| **Portfolio tracker** | Posiciones en fondos, acciones, bonos, ETFs con valor actualizado | 🔴 Crítica |
| **P&L por instrumento** | Beneficio/pérdida por cada posición, realizado vs no realizado | 🔴 Crítica |
| **Movimientos** | Compras, ventas, dividendos, cupones, comisiones | 🔴 Crítica |
| **Distribución por gestora** | ¿Cuánto hay en Pictet vs CACEIS vs Inversis? | 🟡 Importante |
| **TIR/TWR** | Rentabilidad time-weighted y money-weighted | 🟡 Importante |
| **Riesgo** | VAR, volatilidad, drawdown, correlaciones | 🟢 Futuro |

### 2.4 Private Equity / Participaciones

| Necesidad | Descripción | Prioridad |
|-----------|-------------|-----------|
| **Registro de participaciones** | % participación en cada sociedad (Disfasa 100%, Facundo X%) | 🔴 Crítica |
| **Valoración de participaciones** | NAV o valor contable de cada participación | 🔴 Crítica |
| **Capital calls & distributions** | Tracking de llamadas de capital y distribuciones | 🟡 Importante |
| **J-curve tracking** | Evolución de inversiones PE vs compromiso | 🟡 Importante |
| **Co-inversiones** | Tracking de deals de co-inversión | 🟢 Futuro |

### 2.5 Tesorería y Cash Management

| Necesidad | Descripción | Prioridad |
|-----------|-------------|-----------|
| **Saldos consolidados** | Saldo total en todos los bancos (8+ entidades) en tiempo real | 🔴 Crítica |
| **Movimientos unificados** | Timeline de movimientos de todas las cuentas | 🔴 Crítica |
| **Previsión de tesorería** | Cash-flow forecast: cobros esperados (rentas) - pagos programados | 🟡 Importante |
| **Alertas de liquidez** | Aviso si saldo total cae por debajo de umbral | 🟡 Importante |
| **Transferencias** | Iniciar transferencias entre cuentas propias | 🟢 Futuro |

### 2.6 Reporting y Compliance

| Necesidad | Descripción | Prioridad |
|-----------|-------------|-----------|
| **Informe patrimonio total** | PDF mensual: inmuebles + financiero + PE + tesorería | 🔴 Crítica |
| **Informe para consejeros** | Resumen ejecutivo para junta del family office | 🔴 Crítica |
| **Reporting fiscal** | Datos para IRPF, IS, Modelo 720 (activos extranjero >50K) | 🟡 Importante |
| **Reporting para MDFF** | Formato compatible con el multi-family office (MDFF) | 🟡 Importante |
| **Audit trail** | Registro de todas las operaciones y cambios | 🟡 Importante |
| **MIFID II compliance** | Test de idoneidad, registro de asesoramiento | 🟢 Futuro |

### 2.7 IA para Family Office

| Necesidad | Descripción | Prioridad |
|-----------|-------------|-----------|
| **Copiloto patrimonial** | "¿Cuál es mi patrimonio total hoy?" "¿Cuánto he ganado este año?" | 🔴 Crítica |
| **Alertas de concentración** | "Tienes 65% en inmobiliario, diversifica" | 🟡 Importante |
| **Análisis de liquidez** | "En 3 meses necesitarás €200K, prepara" | 🟡 Importante |
| **Optimización fiscal** | "Si vendes X antes de diciembre, ahorras €30K en IS" | 🟢 Futuro |
| **Comparativa de gestoras** | "Pictet ha rendido 12% vs CACEIS 8% este año" | 🟢 Futuro |

---

## 3. ARQUITECTURA TÉCNICA

### 3.1 Modelos de Datos (nuevos para Prisma)

```
FinancialAccount (Cuenta bancaria/de inversión)
├── companyId
├── entidad (Banca March, Pictet, UBS, etc.)
├── tipoEntidad (banca_privada, gestora, custodio, banca_comercial)
├── numeroCuenta / IBAN
├── divisa
├── saldoActual
├── ultimaSync
└── conexionTipo (api_psd2, swift, manual, scraping)

FinancialPosition (Posición en cartera)
├── accountId → FinancialAccount
├── instrumento (nombre del fondo/acción/bono)
├── isin
├── tipo (fondo_inversion, accion, bono, etf, deposito, sicav, pe_fund)
├── cantidad / participaciones
├── precioMedio (coste)
├── valorActual
├── divisa
├── pnlNoRealizado
└── ultimaActualizacion

FinancialTransaction (Movimiento financiero)
├── accountId
├── positionId (opcional)
├── tipo (compra, venta, dividendo, cupon, comision, transferencia)
├── fecha
├── importe
├── divisa
├── descripcion

Participation (Participación societaria)
├── companyId (holding)
├── targetCompanyName
├── targetCompanyCIF
├── porcentaje
├── valorContable
├── valorEstimado
├── tipo (filial, participada, pe_fund)
├── fechaAdquisicion

TreasurySummary (Resumen tesorería)
├── companyId
├── fecha
├── saldoTotal
├── porEntidad (JSON)
├── porDivisa (JSON)
├── previsionMes
```

### 3.2 Integraciones Bancarias

```
Nivel 1 — PSD2 / Open Banking (automático):
├── Bankinter → Ya integrado via GoCardless/Nordigen
├── Santander → API PSD2
├── CaixaBank → API PSD2
├── BBVA → BBVA Open Platform

Nivel 2 — Extractos electrónicos (semi-automático):
├── Banca March → SWIFT MT940/MT535 o PDF
├── CACEIS → SWIFT MT535 (posiciones) + MT940 (movimientos)
├── Inversis → API propietaria o extractos XML

Nivel 3 — Extractos PDF + IA OCR (manual con asistencia):
├── Pictet → Extractos PDF suizos → OCR con Claude
├── UBS → Extractos PDF → OCR con Claude
├── Cualquier otra entidad → Upload PDF → procesamiento IA
```

### 3.3 Flujo de Datos

```
┌──────────────────────────────────────────────────────────────┐
│                    INMOVA FAMILY OFFICE                       │
│                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │ INMOBILIARIO │  │ FINANCIERO  │  │   PRIVATE    │        │
│  │   (actual)   │  │   (nuevo)   │  │   EQUITY     │        │
│  │              │  │             │  │   (nuevo)    │        │
│  │ Rovida       │  │ CACEIS      │  │ Disfasa      │        │
│  │ Viroda       │  │ Inversis    │  │ Facundo      │        │
│  │ Edificios    │  │ Pictet      │  │ Girasoles    │        │
│  │ Garajes      │  │ B.March     │  │ Incofasa     │        │
│  │ Locales      │  │ Bankinter   │  │ PDV Gesfasa  │        │
│  └──────┬───────┘  └──────┬──────┘  └──────┬───────┘        │
│         │                 │                 │                │
│         └────────┬────────┘────────┬────────┘                │
│                  │                 │                          │
│         ┌────────▼─────────────────▼────────┐                │
│         │    DASHBOARD PATRIMONIAL 360°      │                │
│         │                                    │                │
│         │  Patrimonio Total: €XX.XXX.XXX     │                │
│         │  ├── Inmobiliario: 45% (€X.XXM)   │                │
│         │  ├── Renta Variable: 25% (€X.XM)  │                │
│         │  ├── Renta Fija: 15% (€X.XM)      │                │
│         │  ├── Private Equity: 10% (€X.XM)  │                │
│         │  └── Liquidez: 5% (€XXK)          │                │
│         │                                    │                │
│         │  [IA Copiloto Patrimonial]         │                │
│         └────────────────────────────────────┘                │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │                    TESORERÍA                            │  │
│  │  Bankinter: €XXK | B.March: €XXK | Santander: €XXK    │  │
│  │  BBVA: €XXK | CaixaBank: €XXK | Total: €X.XM         │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

---

## 4. HOJA DE RUTA — 4 SPRINTS

### Sprint 1: Fundamentos (4-6 semanas)

**Objetivo**: Modelos de datos + Dashboard patrimonial básico + Import manual

| Tarea | Detalle | Esfuerzo |
|-------|---------|----------|
| Schema Prisma | Modelos: FinancialAccount, FinancialPosition, FinancialTransaction, Participation | 2 días |
| Migración BD | Ejecutar en producción | 1 día |
| API CRUD financiero | GET/POST/PUT/DELETE para cuentas, posiciones, participaciones | 3 días |
| Import extractos PDF | OCR con Claude para extractos de Pictet/CACEIS/Inversis/B.March | 3 días |
| Dashboard patrimonial | Vista 360°: inmobiliario + financiero + PE + tesorería | 5 días |
| Asset allocation chart | Gráfico de distribución por tipo de activo | 1 día |
| Evolución patrimonial | Gráfico temporal del valor total | 2 días |

**Entregable**: Dashboard con patrimonio total consolidado (datos importados manualmente)

### Sprint 2: Integraciones Bancarias (4-6 semanas)

**Objetivo**: Conexión automática con bancos españoles + SWIFT

| Tarea | Detalle | Esfuerzo |
|-------|---------|----------|
| PSD2 Bankinter | Ya existe via GoCardless → añadir cuentas de inversión | 2 días |
| PSD2 Santander | Integrar Nordigen/GoCardless para Santander | 3 días |
| PSD2 BBVA | BBVA Open Platform API | 3 días |
| PSD2 CaixaBank | Nordigen para CaixaBank | 2 días |
| SWIFT MT940/MT535 | Parser para extractos SWIFT (Banca March, CACEIS) | 5 días |
| Extractos Inversis | API o XML import | 3 días |
| OCR Pictet/UBS | Procesamiento PDF de extractos suizos con Claude | 3 días |
| Sync automático | Cron job que sincroniza saldos/posiciones diariamente | 2 días |

**Entregable**: Saldos y posiciones actualizados automáticamente de 6+ bancos

### Sprint 3: Analytics y Reporting (3-4 semanas)

**Objetivo**: P&L, reporting fiscal, informes para MDFF y consejeros

| Tarea | Detalle | Esfuerzo |
|-------|---------|----------|
| P&L por instrumento | Beneficio/pérdida realizado vs no realizado | 3 días |
| P&L por gestora | Rendimiento de cada gestora (Pictet vs CACEIS vs Inversis) | 2 días |
| Previsión tesorería | Cash-flow forecast: rentas + dividendos - gastos - hipotecas | 3 días |
| Informe patrimonio PDF | Generación automática mensual con IA | 3 días |
| Modelo 720 | Declaración de activos en el extranjero (Pictet, UBS) | 2 días |
| Informe MDFF | Formato compatible con multi-family office | 2 días |
| Alertas concentración | "65% inmobiliario → diversificar" | 1 día |
| Alertas liquidez | "Saldo bajo umbral en Bankinter" | 1 día |

**Entregable**: Reporting completo para consejeros y MDFF

### Sprint 4: IA y Private Equity (3-4 semanas)

**Objetivo**: Copiloto patrimonial IA + módulo PE completo

| Tarea | Detalle | Esfuerzo |
|-------|---------|----------|
| Copiloto patrimonial | Chat IA con acceso a patrimonio total (inmobiliario + financiero) | 5 días |
| Simulador asset allocation | "¿Qué pasa si vendo Espronceda y compro fondos?" | 3 días |
| Módulo PE completo | Capital calls, distributions, J-curve, vintage year | 5 días |
| Optimización fiscal IA | Sugerencias de tax-loss harvesting, timing de ventas | 3 días |
| Comparativa gestoras | Ranking por rendimiento, comisiones, riesgo | 2 días |
| API para MDFF | Endpoint seguro para que el MFO acceda a datos | 3 días |

**Entregable**: Plataforma patrimonial completa con IA

---

## 5. PRICING DEL ADD-ON

### Propuesta de monetización

| Plan | Precio | Incluye |
|------|--------|---------|
| **FO Starter** | €299/mes | Dashboard patrimonial, 3 entidades bancarias, import manual, reporting básico |
| **FO Professional** | €599/mes | Todas las entidades, PSD2 auto-sync, PE module, reporting avanzado, IA copiloto |
| **FO Enterprise** | €999/mes | Todo + API para MFO, custom reporting, SLA dedicado, onboarding presencial |

### Costes de integración por entidad

| Entidad | Coste integración | Mantenimiento |
|---------|-------------------|---------------|
| PSD2 (Bankinter, BBVA, etc.) | €0 (Nordigen incluido) | €0 |
| SWIFT MT940/MT535 | €2.000 setup | €200/mes |
| API Inversis | €3.000 setup | €300/mes |
| OCR Pictet/UBS | €0 (Claude IA) | ~€50/mes (tokens) |

---

## 6. COMPETENCIA Y DIFERENCIACIÓN

### Alternativas actuales para Family Offices

| Herramienta | Tipo | Precio | Limitación |
|-------------|------|--------|------------|
| **Addepar** | Wealth management SaaS | $50K+/año | Solo financiero, no inmobiliario |
| **Masttro** | MFO platform | $30K+/año | No gestión inmobiliaria operativa |
| **Canopy** | Wealth reporting | $20K+/año | Solo reporting, no gestión |
| **PCR Arvato** | Portfolio reporting | Custom | Complejo, legacy |
| **Excel/manual** | DIY | Tiempo | Error, no escalable |

### Diferenciación INMOVA

**INMOVA es la ÚNICA plataforma que combina:**
1. ✅ Gestión inmobiliaria operativa (inquilinos, contratos, mantenimiento)
2. ✅ Carteras financieras (fondos, acciones, bonos)
3. ✅ Private equity (participaciones societarias)
4. ✅ Tesorería consolidada (8+ bancos)
5. ✅ IA integrada (copiloto patrimonial, OCR, valoraciones)
6. ✅ Precio accesible (€299-999/mes vs $30-50K/año)

---

## 7. CASO VIDARO: IMPLEMENTACIÓN DE REFERENCIA

### Patrimonio del grupo Vidaro (estimado)

```
PATRIMONIO TOTAL GRUPO VIDARO
├── Inmobiliario (INMOVA actual)
│   ├── Rovida S.L. — 17 inmuebles, 243 inquilinos, ~€8M valor
│   └── Viroda Inversiones — 5 edificios, 101 inquilinos, ~€5M valor
│
├── Carteras Financieras (NUEVO)
│   ├── CACEIS — Fondos inversión — ~€844K beneficios 2025
│   ├── Inversis — Fondos/SICAVs — ~€776K beneficios 2025
│   ├── Pictet — Gestión discrecional — ~€583K beneficios 2025
│   ├── Banca March — Cartera valores
│   └── Bankinter — Valores + cuentas
│
├── Participaciones Societarias (NUEVO)
│   ├── Disfasa S.L. — participada
│   ├── Facundo S.L. — participada
│   ├── Girasoles S.L. — participada
│   ├── Incofasa S.L. — participada (cedente de activos)
│   └── PDV Gesfasa — participada
│
└── Tesorería (NUEVO)
    ├── Bankinter: IBAN ES5601280... (Rovida) + ES8801280... (Viroda)
    ├── Banca March
    ├── Santander
    ├── CaixaBank
    └── BBVA
```

### Datos reales de Vidaro (de contabilidad)
- **Contabilidad 2025**: 5.829 líneas, 1.262 asientos, **€253M** Debe/Haber
- **460+ instrumentos financieros** en plan de cuentas
- **3 consejeros** con asignación €124K/año c/u
- **Ingresos financieros 2025**: CACEIS €844K + Inversis €776K + Pictet €583K = **€2.2M**

---

## 8. SIGUIENTES PASOS

1. **Validar** esta hoja de ruta con el equipo y MDFF
2. **Priorizar** Sprint 1 (fundamentos) para empezar desarrollo
3. **Contactar** con Inversis y CACEIS para acceso API
4. **Definir** formato de reporting que necesita MDFF
5. **Estimar** patrimonio financiero total de Vidaro para dimensionar

---

*Documento preparado por INMOVA — Febrero 2026*
*Confidencial — Uso interno Grupo Vidaro*
