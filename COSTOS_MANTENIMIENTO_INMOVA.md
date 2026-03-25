# 💰 Análisis de Costes — Plataforma Inmova
**Fecha:** 25 de marzo de 2026  
**Tipo de cambio aplicado:** 1 USD = 0.862 EUR (EUR/USD = 1.1607)

---

## 📋 Resumen Ejecutivo

| Concepto | Período inicial (2.5 meses) | Mensual recurrente |
|---|---|---|
| Personal (media jornada SMI) | **€2.355** | **€942** |
| Herramientas IA dev | **€474** | **€190** |
| Infraestructura | **€40** | **€16** |
| **TOTAL** | **€2.869** | **€1.148** |

---

## 1. Personal — Programador/a a Media Jornada (SMI Base)

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

| | Mensual | 2.5 meses |
|---|---|---|
| Salario bruto media jornada | 712,25 € | 1.780,63 € |
| Seguridad Social empresa | 229,68 € | 574,20 € |
| **Coste empresa total** | **941,93 €** | **2.354,83 €** |

> **Nota:** Este coste cubre los 2,5 meses de ajuste fino para Grupo Vidaro **y** la fase de mantenimiento posterior, siendo el mismo recurso reutilizado. Si se requiere un recurso adicional externo de programación (freelance/agencia) para el ajuste fino, se debe añadir a este coste.

---

## 2. Herramientas de Desarrollo IA

### Cursor Ultra Plan
- **Precio:** $200/mes → **172,31 €/mes**
- Incluye: 20x usage en todos los modelos (OpenAI, Claude, Gemini), $200 en créditos mensuales, completions ilimitadas en auto-mode, acceso prioritario a features

### Claude Pro (Anthropic)
- **Precio:** $20/mes → **17,23 €/mes**
- Incluye: Acceso prioritario a Claude (Opus 4.5, Sonnet 4.5), 5x límites de uso vs plan gratuito, Claude Code, Projects

### Resumen herramientas IA

| Herramienta | $/mes | €/mes | 2.5 meses (€) |
|---|---|---|---|
| Cursor Ultra | $200 | 172,31 € | 430,78 € |
| Claude Pro | $20 | 17,23 € | 43,08 € |
| **Total** | **$220** | **189,54 €** | **473,86 €** |

---

## 3. Infraestructura de Producción

### Servidor Hetzner (producción)
- **Modelo recomendado:** CX33 — 4 vCPUs, 8 GB RAM, 80 GB SSD
- **Precio:** 7,99 €/mes (precio post-1 abril 2026, ajuste Hetzner anunciado)
- Stack incluido: Node.js + PM2 cluster, Nginx, PostgreSQL 15, Redis

### AWS S3 (almacenamiento documentos)
- Bucket: `inmova` (eu-north-1)
- Contenido: PDFs seguros Grupo Vidaro + documentos contratos
- **Estimación:** ~8 €/mes (primeros 100 GB: 0,023 $/GB + operaciones)

### Resumen infraestructura

| Servicio | €/mes | 2.5 meses (€) |
|---|---|---|
| Hetzner CX33 | 7,99 € | 19,98 € |
| AWS S3 | 8,00 € | 20,00 € |
| **Total** | **15,99 €** | **39,98 €** |

---

## 4. Cuadro Consolidado por Período

### Fase 1 — Ajuste fino Grupo Vidaro (2,5 meses)

| Concepto | Mensual | Total 2.5 meses |
|---|---|---|
| Personal media jornada (SMI + SS) | 941,93 € | **2.354,83 €** |
| Cursor Ultra | 172,31 € | **430,78 €** |
| Claude Pro | 17,23 € | **43,08 €** |
| Servidor Hetzner | 7,99 € | **19,98 €** |
| AWS S3 | 8,00 € | **20,00 €** |
| **TOTAL FASE 1** | **1.147,46 €** | **2.868,67 €** |

---

### Fase 2 — Mantenimiento mensual recurrente (a partir del mes 3)

| Concepto | €/mes |
|---|---|
| Personal media jornada (SMI + SS) | 941,93 € |
| Cursor Ultra | 172,31 € |
| Claude Pro | 17,23 € |
| Servidor Hetzner | 7,99 € |
| AWS S3 | 8,00 € |
| **TOTAL MENSUAL** | **1.147,46 €** |

**Proyección anual (12 meses de mantenimiento):** **13.769,52 €/año**

---

## 5. Costes Variables / Bajo Demanda (no fijos)

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

## 6. Escenarios Comparativos

### Escenario A — Solo herramientas + infra (sin personal)
> Para cuando el propietario gestiona el mantenimiento personalmente

| Concepto | €/mes |
|---|---|
| Cursor Ultra | 172,31 € |
| Claude Pro | 17,23 € |
| Hetzner + S3 | 15,99 € |
| **Total** | **205,53 €/mes** |

### Escenario B — Con personal media jornada SMI (modelo actual propuesto)
| **Total** | **1.147,46 €/mes** |

### Escenario C — Con freelance externo (40h/mes a ~25 €/h)
| Concepto | €/mes |
|---|---|
| Freelance (40h × 25 €) | 1.000,00 € |
| Herramientas IA | 189,54 € |
| Infraestructura | 15,99 € |
| **Total** | **1.205,53 €/mes** |

> El Escenario B (empleado media jornada SMI) es **4,75% más económico** que un freelance estándar, con mayor disponibilidad y conocimiento continuado del proyecto.

---

## 7. Notas y Supuestos

1. **Tipo de cambio:** 1 USD = 0,862 EUR (cotización 25-mar-2026, EUR/USD = 1.1607). Las herramientas en USD tendrán variación mensual según mercado.
2. **SMI 2026:** Aprobado por Real Decreto 126/2026 (BOE 19-feb-2026). No incluye posibles convenios colectivos sectoriales que podrían elevar el salario base.
3. **Hetzner:** Precio post-ajuste de abril 2026. Incluye 20 TB de tráfico mensual.
4. **Media jornada:** 20 horas/semana. Si el convenio del sector TI aplica, revisar si el salario debe ser superior al SMI proporcional.
5. **Seguridad Social:** El tipo de AT/EP (accidentes de trabajo) varía por CNAE de la empresa. Se ha usado 1,50% (tipo general programación/servicios).
6. **Gastos de ajuste fino Grupo Vidaro:** Se asume que el programador a media jornada es el recurso que realiza este trabajo. Si se requiere desarrollo adicional (más horas, agencia externa o subcontratación), se añadiría como coste extraordinario a negociar.
7. **Sin incluir:** IRPF retenido del trabajador (no es coste empresa), gastos de selección, formación inicial, equipamiento (portátil, etc.).

---

## 8. Recomendación de Optimización

Para **reducir costes sin sacrificar capacidad**, considerar:

- **Downgrade de Cursor Ultra a Pro+ ($40/mes)** si el uso de modelos premium es moderado → ahorro: **~132 €/mes**
- **Claude Pro a Plan Gratuito** si el uso personal de Claude es bajo (la API de Anthropic se paga por uso en producción, no por suscripción) → ahorro: **17 €/mes**
- **Hetzner CX23** (2 vCPUs / 4 GB) si el tráfico es bajo → ahorro: **4 €/mes**

**Coste mínimo optimizado con personal:**  
941,93 € (personal) + ~60 €/mes (herramientas mínimas + infra) = **~1.002 €/mes**

---

*Documento generado el 25 de marzo de 2026.*  
*Revisar anualmente: SMI se actualiza en enero/febrero, precios de herramientas pueden cambiar.*
