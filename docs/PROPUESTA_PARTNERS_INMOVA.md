# 🤝 Propuesta de Programa de Partners - INMOVA

**Documento Confidencial - Solo para uso interno y propuestas comerciales**
**Versión 1.0 - Enero 2026**

---

## 1. Resumen Ejecutivo

INMOVA ofrece un **Programa de Partners** que permite a empresas estratégicas (bancos, aseguradoras, escuelas de negocios, y servicios inmobiliarios) ofrecer nuestra plataforma PropTech a sus clientes con su propia identidad visual (White-Label), generando ingresos recurrentes por cada cliente referido.

---

## 2. Tipos de Partners

### 2.1 🏦 Bancos Hipotecarios

**Valor para el Partner:**
- Ofrecer INMOVA como valor añadido a clientes que contratan hipoteca
- Retención de clientes con servicio integral
- Comisiones por cada cliente activo

**Servicios Preferenciales para Clientes del Partner:**
- Análisis de viabilidad de inversión inmobiliaria
- Simuladores de ROI integrados con condiciones del banco
- Acceso prioritario a módulo de valoración IA
- Descuento 20% en planes INMOVA

**Modelo de Remuneración:**
| Métrica | Comisión |
|---------|----------|
| Por cada cliente activo/mes | 15% del plan |
| Por hipoteca contratada vía lead INMOVA | €200 |
| Bonus trimestral (+50 clientes) | €2,000 |

### 2.2 🛡️ Aseguradoras

**Valor para el Partner:**
- Cross-sell de seguros de hogar a usuarios INMOVA
- Datos de propiedades para scoring de riesgo
- Gestión de siniestros integrada

**Servicios Preferenciales para Clientes del Partner:**
- Módulo de gestión de pólizas integrado
- Alertas de vencimiento automáticas
- Gestión de siniestros dentro de INMOVA
- Descuento 15% en seguros del partner

**Modelo de Remuneración:**
| Métrica | Comisión |
|---------|----------|
| Por póliza vendida vía INMOVA | 10% primer año |
| Por cliente referido a INMOVA | 20% primer mes |
| Por gestión de siniestro | Tarifa acordada |

### 2.3 🎓 Escuelas de Negocios

**Valor para el Partner:**
- Ofrecer herramienta profesional a alumnos
- Casos de estudio reales
- Prácticas con datos anonimizados

**Servicios Preferenciales:**
- Licencias educativas gratuitas (hasta 50 alumnos)
- Certificación "INMOVA Certified Professional"
- Acceso a webinars exclusivos
- Prioridad en programa de becas

**Modelo de Remuneración:**
| Métrica | Comisión |
|---------|----------|
| Alumno que contrata plan después | 25% primer año |
| Empresa que contrata por recomendación | €500 one-time |
| Co-branded courses | Revenue share 50/50 |

### 2.4 🏢 Gestoras Inmobiliarias (White-Label)

**Valor para el Partner:**
- Plataforma completa con su marca
- Sin inversión en desarrollo
- Escalabilidad inmediata

**White-Label Incluye:**
- Logo y colores personalizados
- Dominio propio (gestion.miempresa.com)
- Emails con remitente personalizado
- App móvil con branding (add-on)
- Sin mención a INMOVA visible

**Modelo de Remuneración:**
| Plan | Precio Partner | PVP Recomendado | Margen Partner |
|------|---------------|-----------------|----------------|
| Basic | €35/mes | €49-€59/mes | 30-40% |
| Professional | €100/mes | €149-€179/mes | 33-45% |
| Business | €250/mes | €349-€449/mes | 28-45% |

---

## 3. Programa de Referidos B2B

### 3.1 Estructura de Comisiones

```
                    ┌─────────────────────┐
                    │    PARTNER          │
                    │  (Banco, Seguradora)│
                    └──────────┬──────────┘
                               │ Refiere cliente
                               ▼
                    ┌─────────────────────┐
                    │    INMOVA           │
                    │  Cierra venta       │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │  COMISIÓN RECURRENTE│
                    │  15-25% mensual     │
                    │  durante 12 meses   │
                    └─────────────────────┘
```

### 3.2 Niveles de Partner

| Nivel | Clientes Referidos | Comisión Base | Bonus |
|-------|-------------------|---------------|-------|
| Bronze | 1-10 | 15% | - |
| Silver | 11-50 | 18% | +€500/trimestre |
| Gold | 51-100 | 20% | +€2,000/trimestre |
| Platinum | 100+ | 25% | Custom |

### 3.3 Duración de Comisiones

- **Standard:** 12 meses desde primera factura del cliente
- **Premium (Platinum):** Lifetime mientras cliente permanezca activo
- **White-Label:** Margen directo, sin límite temporal

---

## 4. Integración Técnica

### 4.1 API de Partners

```typescript
// Ejemplo: Registrar lead desde partner
POST /api/partners/leads
{
  "partner_id": "BANCO_XYZ_001",
  "client": {
    "name": "Juan García",
    "email": "juan@email.com",
    "phone": "+34611234567"
  },
  "source": "hipoteca_landing",
  "campaign": "Q1_2026_PROMO"
}

// Response
{
  "lead_id": "lead_abc123",
  "tracking_url": "https://inmovaapp.com/r/BANCO_XYZ_001",
  "commission_estimate": 22.35
}
```

### 4.2 Dashboard de Partners

Cada partner tiene acceso a:
- Panel de leads referidos
- Estado de conversiones
- Comisiones acumuladas
- Facturas y pagos
- Materiales de marketing

---

## 5. Materiales de Marketing

### 5.1 Co-Branded

- Landing pages personalizadas
- Emails de bienvenida con logos dual
- Banners para web del partner
- Folletos PDF descargables

### 5.2 Formación

- Webinar de onboarding (2h)
- Certificación de producto (online)
- Updates trimestrales
- Soporte dedicado para partners

---

## 6. SLA y Soporte

| Nivel Partner | Tiempo Respuesta | Canal | Account Manager |
|--------------|------------------|-------|-----------------|
| Bronze | 24h | Email | No |
| Silver | 12h | Email + Chat | Compartido |
| Gold | 4h | Email + Chat + Phone | Dedicado |
| Platinum | 1h | Todos + Slack | Dedicado + Escalado |

---

## 7. Próximos Pasos

### Para Activar Partnership:

1. **Firma de Acuerdo de Colaboración**
   - NDA incluido
   - Términos de comisiones
   - SLA acordado

2. **Onboarding Técnico** (1 semana)
   - Configuración de cuenta partner
   - Integración API si aplica
   - Materiales de marketing

3. **Kickoff Comercial**
   - Formación equipo comercial
   - Objetivos Q1 2026
   - Primer cliente piloto

### Contacto Partners

📧 partners@inmovaapp.com
📞 +34 91 XXX XX XX
🌐 https://inmovaapp.com/partners (solo con login)

---

**© 2026 Inmova - Documento Confidencial**
**No distribuir sin autorización**
