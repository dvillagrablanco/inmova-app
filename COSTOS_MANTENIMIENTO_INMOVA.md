# 💰 Análisis de Costes — Plataforma Inmova
**Fecha:** 25 de marzo de 2026  
**Tipo de cambio aplicado:** 1 USD = 0.862 EUR (EUR/USD = 1.1607)

---

## 📋 Resumen Ejecutivo

| Concepto | Fase 1: Implantación (2,5 meses) | Fase 2: Mantenimiento (mensual) |
|---|---|---|
| Personal implantación (media jornada SMI) | **2.355 €** | — (se da de baja) |
| Herramientas IA dev | **474 €** | **190 €** |
| Infraestructura | **40 €** | **16 €** |
| **TOTAL** | **2.869 €** | **206 €/mes** |

---

## 1. Personal — Programador/a a Media Jornada (SMI Base)

> ⚠️ **Este coste aplica SOLO durante la Fase 1 (2,5 meses).** A partir del mes 3 el personal de implantación se da de baja. El mantenimiento posterior no requiere personal dedicado.

### Base legal
- **SMI 2026:** 1.221 €/mes brutos (jornada completa) — Real Decreto 126/2026, BOE 19-feb-2026
- **14 pagas** → Coste salarial anual: 17.094 € brutos
- **Media jornada:** 17.094 ÷ 2 ÷ 12 = **712,25 €/mes** (coste salarial prorrateo con extras)

### Cotizaciones Seguridad Social a cargo de la empresa (2026)

| Concepto | % | Mensual (media jornada) |
|---|---|---|
| Contingencias comunes | 23,70% | 168,80 € |
| Accidentes de trabajo / EP | 1,50% | 10,68 € |
| Desempleo (contrato indefinido) | 5,50% | 39,17 € |
| FOGASA | 0,20% | 1,42 € |
| Formación Profesional | 0,60% | 4,27 € |
| MEI (Equidad Intergeneracional) | 0,75% | 5,34 € |
| **Total SS empresa** | **~32,25%** | **229,68 €** |

### Coste total empresa — personal

| | Mensual | 2,5 meses |
|---|---|---|
| Salario bruto media jornada | 712,25 € | 1.780,63 € |
| Seguridad Social empresa | 229,68 € | 574,20 € |
| **Coste empresa total** | **941,93 €** | **2.354,83 €** |

---

## 2. Herramientas de Desarrollo IA

> ✅ **Estas herramientas se mantienen en ambas fases** — son el recurso principal para el mantenimiento autónomo post-implantación.

### Cursor Ultra Plan
- **Precio:** $200/mes → **172,31 €/mes**
- Incluye: 20x usage en todos los modelos (OpenAI, Claude, Gemini), $200 en créditos mensuales, completions ilimitadas en auto-mode, acceso prioritario a features

### Claude Pro (Anthropic)
- **Precio:** $20/mes → **17,23 €/mes**
- Incluye: Acceso prioritario a Claude (Opus 4.5, Sonnet 4.5), 5x límites de uso vs plan gratuito, Claude Code, Projects

### Resumen herramientas IA

| Herramienta | $/mes | €/mes | 2,5 meses (€) |
|---|---|---|---|
| Cursor Ultra | $200 | 172,31 € | 430,78 € |
| Claude Pro | $20 | 17,23 € | 43,08 € |
| **Total** | **$220** | **189,54 €** | **473,86 €** |

---

## 3. Infraestructura de Producción

> ✅ **Coste fijo recurrente en ambas fases.**

### Servidor Hetzner (producción)
- **Modelo recomendado:** CX33 — 4 vCPUs, 8 GB RAM, 80 GB SSD
- **Precio:** 7,99 €/mes (precio post-1 abril 2026, ajuste Hetzner anunciado)
- Stack incluido: Node.js + PM2 cluster, Nginx, PostgreSQL 15, Redis

### AWS S3 (almacenamiento documentos)
- Bucket: `inmova` (eu-north-1)
- Contenido: PDFs seguros Grupo Vidaro + documentos contratos
- **Estimación:** ~8 €/mes (primeros 100 GB: 0,023 $/GB + operaciones)

### Resumen infraestructura

| Servicio | €/mes | 2,5 meses (€) |
|---|---|---|
| Hetzner CX33 | 7,99 € | 19,98 € |
| AWS S3 | 8,00 € | 20,00 € |
| **Total** | **15,99 €** | **39,98 €** |

---

## 4. Cuadro Consolidado por Período

### Fase 1 — Implantación y ajuste fino Grupo Vidaro (2,5 meses)

| Concepto | Mensual | Total 2,5 meses |
|---|---|---|
| Personal media jornada (SMI + SS) | 941,93 € | **2.354,83 €** |
| Cursor Ultra | 172,31 € | **430,78 €** |
| Claude Pro | 17,23 € | **43,08 €** |
| Servidor Hetzner | 7,99 € | **19,98 €** |
| AWS S3 | 8,00 € | **20,00 €** |
| **TOTAL FASE 1** | **1.147,46 €** | **2.868,67 €** |

---

### Fase 2 — Mantenimiento mensual recurrente (a partir del mes 3)

> El personal de implantación se da de baja. Solo quedan las herramientas y la infraestructura.

| Concepto | €/mes |
|---|---|
| ~~Personal media jornada~~ | ~~941,93 €~~ → **0 €** |
| Cursor Ultra | 172,31 € |
| Claude Pro | 17,23 € |
| Servidor Hetzner | 7,99 € |
| AWS S3 | 8,00 € |
| **TOTAL MENSUAL** | **205,53 €** |

**Proyección anual (12 meses de mantenimiento):** **2.466,36 €/año**

---

## 5. Visión del Ciclo de Vida Completo

```
Mes 1       Mes 2       Mes 2.5     Mes 3+
─────────────────────────────────────────────────────
Personal:   941 €/mes   941 €/mes   941 €/mes  → 0 €
Herram.:    190 €/mes   190 €/mes   190 €/mes    190 €/mes
Infra:       16 €/mes    16 €/mes    16 €/mes     16 €/mes
─────────────────────────────────────────────────────
TOTAL:     1.147 €     1.147 €     1.147 €      206 €/mes
─────────────────────────────────────────────────────
Acumulado: 1.147 €     2.294 €     2.869 €   +206 €/mes
```

| Período | Inversión total acumulada |
|---|---|
| Fin mes 1 | 1.147 € |
| Fin mes 2 | 2.294 € |
| Fin mes 2,5 | 2.869 € |
| Fin mes 3 | 3.075 € |
| Fin mes 6 | 3.693 € |
| Fin mes 12 | 5.134 € |
| Fin mes 24 | 7.400 € |

---

## 6. Costes Variables / Bajo Demanda (no fijos)

Estos costes solo se activan cuando se usan activamente:

| Servicio | Coste | Activación |
|---|---|---|
| Stripe | 2,9% + 0,25 € / transacción | Solo si hay pagos de inquilinos |
| Twilio SMS | ~0,05 €/SMS | Solo si se envían SMS |
| Anthropic API (claude-3-5-sonnet) | 0,003 $/1K tokens entrada | Solo si se usa IA en producción intensiva |
| Signaturit (firma digital) | ~0,50 €/firma | Solo si se activa firma digital |
| Sentry (errores) | Gratis (hasta 5K errores/mes) | Plan Team si escala: 26 €/mes |
| Gmail SMTP | Gratis (hasta 500 emails/día) | Migrará a SendGrid si supera: ~15 €/mes |

---

## 7. Comparativa Mantenimiento: Con vs Sin Personal

| Modelo | Coste mensual (Fase 2) | Coste anual |
|---|---|---|
| **Sin personal (actual)** — herramientas + infra | **205,53 €** | **2.466 €** |
| Con empleado media jornada SMI | 1.147,46 € | 13.770 € |
| Con freelance (40h × 25 €/h) | 1.205,53 € | 14.466 € |

> El modelo sin personal de Fase 2 es un **82% más económico** que mantener al empleado, gracias a que las herramientas IA (Cursor Ultra + Claude) asumen la carga de mantenimiento técnico autónomo.

---

## 8. Notas y Supuestos

1. **Tipo de cambio:** 1 USD = 0,862 EUR (cotización 25-mar-2026, EUR/USD = 1.1607). Las herramientas en USD tendrán variación mensual según mercado.
2. **SMI 2026:** Aprobado por Real Decreto 126/2026 (BOE 19-feb-2026). No incluye posibles convenios colectivos sectoriales.
3. **Hetzner:** Precio post-ajuste de abril 2026. Incluye 20 TB de tráfico mensual.
4. **Media jornada:** 20 horas/semana. Tipo AT/EP al 1,50% (CNAE servicios/programación).
5. **Baja del personal en Fase 2:** Se asume contrato temporal de 2,5 meses (obra o servicio determinado / duración determinada). Verificar modalidad contractual con asesoría laboral para evitar compromisos de indefinición.
6. **Sin incluir:** IRPF retenido (no es coste empresa), gastos de selección, equipamiento, posible indemnización al fin de contrato.

---

## 9. Recomendación de Optimización (Fase 2)

Si el uso de Cursor Ultra es bajo durante mantenimiento, existe opción de reducir:

| Herramienta | Alternativa | Ahorro mensual |
|---|---|---|
| Cursor Ultra ($200) | Cursor Pro+ ($40) | ~138 € |
| Claude Pro ($20) | Plan Gratuito | 17 € |
| Hetzner CX33 | Hetzner CX23 | ~4 € |

**Coste mínimo absoluto Fase 2 (solo infra):** ~16 €/mes  
**Coste optimizado con herramientas básicas:** ~51 €/mes

---

*Documento generado el 25 de marzo de 2026.*  
*Revisar anualmente: SMI se actualiza en enero/febrero, precios de herramientas pueden cambiar.*
