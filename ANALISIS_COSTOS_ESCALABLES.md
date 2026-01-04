# 💰 ANÁLISIS DE COSTOS ESCALABLES - INMOVA

**Fecha**: 4 de Enero de 2026  
**Modelo**: Inmova paga todas las integraciones (centralizado)

---

## 📊 RESUMEN EJECUTIVO

**⚠️ SÍ, LOS COSTOS SE DISPARAN CON MUCHOS CLIENTES** si no implementas límites y control de uso.

### Escenarios:

| Clientes | Costo Mes (sin límites) | Costo Mes (con límites) | Ingresos | Margen |
|----------|-------------------------|--------------------------|----------|--------|
| **10** | €50 | €20 | €490 | 96% ✅ |
| **100** | €5,000 | €200 | €4,900 | 96% ✅ |
| **1,000** | €50,000 ⚠️ | €2,000 | €49,000 | 96% ✅ |
| **10,000** | €500,000 ❌ | €20,000 | €490,000 | 96% ✅ |

**Conclusión**: Con límites de uso correctos, el margen se mantiene alto (90-96%) sin importar la escala.

---

## 💸 COSTOS POR SERVICIO

### 1. AWS S3 (Almacenamiento)

**Precio Amazon**: ~€0.023/GB/mes (región eu-west-1)

**Uso típico por cliente**:
- Cliente FREE: 500MB → €0.01/mes
- Cliente STARTER: 5GB → €0.12/mes  
- Cliente PROFESSIONAL: 20GB → €0.46/mes
- Cliente ENTERPRISE: 100GB → €2.30/mes

**Escalabilidad**:
```
10 clientes STARTER = 50GB = €1.15/mes
100 clientes STARTER = 500GB = €11.50/mes
1,000 clientes STARTER = 5TB = €115/mes
10,000 clientes STARTER = 50TB = €1,150/mes
```

**Riesgo**: ⚠️ **MEDIO**
- Un cliente puede subir infinitos archivos si no hay límites
- **Solución**: Límite estricto de GB por plan + alerta si excede

---

### 2. Signaturit (Firma Digital)

**Precio Signaturit** (aprox):
- Firma simple: €1.00/firma
- Firma avanzada: €2.50/firma
- Firma cualificada: €5.00/firma

**Uso típico por cliente**:
- Cliente STARTER: 3 firmas/mes → €3/mes
- Cliente PROFESSIONAL: 10 firmas/mes → €10/mes
- Cliente ENTERPRISE: 50 firmas/mes → €50/mes

**Escalabilidad**:
```
10 clientes STARTER = 30 firmas = €30/mes
100 clientes STARTER = 300 firmas = €300/mes
1,000 clientes STARTER = 3,000 firmas = €3,000/mes
10,000 clientes STARTER = 30,000 firmas = €30,000/mes ⚠️
```

**Riesgo**: 🔴 **ALTO**
- Cliente puede abusar creando firmas ilimitadas
- **Solución CRÍTICA**: 
  - Límite estricto de firmas/mes por plan
  - Bloquear creación si excede cuota
  - Cobrar extra si supera (€2/firma adicional)

---

### 3. Anthropic Claude (IA)

**Precio Anthropic**:
- Claude 3.5 Sonnet: $3/1M tokens input, $15/1M tokens output
- Promedio: ~$5/1M tokens (considerando mix input/output)
- Conversión: ~€4.70/1M tokens

**Uso típico**:
- 1 valoración de propiedad: ~1,000 tokens → €0.0047
- 1 conversación chatbot: ~500 tokens → €0.0024
- 1 descripción generada: ~300 tokens → €0.0014

**Por cliente por mes**:
- Cliente FREE: 100 tokens → €0.0005/mes
- Cliente STARTER: 5,000 tokens → €0.024/mes
- Cliente PROFESSIONAL: 50,000 tokens → €0.24/mes
- Cliente ENTERPRISE: 200,000 tokens → €0.94/mes

**Escalabilidad**:
```
10 clientes STARTER = 50K tokens = €0.24/mes
100 clientes STARTER = 500K tokens = €2.40/mes
1,000 clientes STARTER = 5M tokens = €24/mes
10,000 clientes STARTER = 50M tokens = €240/mes
```

**Riesgo**: 🟡 **MEDIO-BAJO**
- Cliente puede abusar del chatbot (preguntas infinitas)
- **Solución**:
  - Rate limit: Max 20 valoraciones/día
  - Chatbot: Max 50 mensajes/día
  - Bloquear si excede cuota mensual

---

### 4. Twilio (SMS) - Futuro

**Precio Twilio**:
- SMS España: $0.08/SMS → €0.075/SMS
- WhatsApp: $0.005/mensaje → €0.0047/mensaje

**Uso típico**:
- Cliente PROFESSIONAL: 50 SMS/mes → €3.75/mes
- Cliente ENTERPRISE: 200 SMS/mes → €15/mes

**Escalabilidad**:
```
1,000 clientes PROFESSIONAL = 50,000 SMS = €3,750/mes ⚠️
```

**Riesgo**: 🔴 **ALTO** (cuando se implemente)
- SMS pueden enviarse masivamente
- **Solución**: Límite estricto + cobro por exceso

---

## 🎯 ESCENARIOS DE CRECIMIENTO

### Caso 1: 100 Clientes (Mix de Planes)

**Distribución típica**:
- 30 FREE (€0/mes c/u)
- 50 STARTER (€49/mes c/u)
- 15 PROFESSIONAL (€149/mes c/u)
- 5 ENTERPRISE (€499/mes c/u)

**Ingresos**: €7,420/mes

**Costos de Integraciones**:
- S3: 30×0.01 + 50×0.12 + 15×0.46 + 5×2.30 = €24.40
- Signaturit: 50×3 + 15×10 + 5×50 = €550
- Claude: 30×0.0005 + 50×0.024 + 15×0.24 + 5×0.94 = €6.10
- **TOTAL**: **€580.50/mes**

**Margen**: €6,839.50 (92%) ✅

---

### Caso 2: 1,000 Clientes (Éxito Moderado)

**Distribución**:
- 300 FREE
- 500 STARTER
- 150 PROFESSIONAL
- 50 ENTERPRISE

**Ingresos**: €74,200/mes

**Costos**:
- S3: 300×0.01 + 500×0.12 + 150×0.46 + 50×2.30 = €244
- Signaturit: 500×3 + 150×10 + 50×50 = €5,500
- Claude: 300×0.0005 + 500×0.024 + 150×0.24 + 50×0.94 = €61
- **TOTAL**: **€5,805/mes**

**Margen**: €68,395 (92%) ✅

---

### Caso 3: 10,000 Clientes (Éxito Masivo)

**Distribución**:
- 3,000 FREE
- 5,000 STARTER
- 1,500 PROFESSIONAL
- 500 ENTERPRISE

**Ingresos**: €742,000/mes

**Costos (CON LÍMITES)**:
- S3: 3K×0.01 + 5K×0.12 + 1.5K×0.46 + 500×2.30 = €2,440
- Signaturit: 5K×3 + 1.5K×10 + 500×50 = €55,000
- Claude: 3K×0.0005 + 5K×0.024 + 1.5K×0.24 + 500×0.94 = €610
- **TOTAL**: **€58,050/mes**

**Margen**: €683,950 (92%) ✅

---

### Caso 4: SIN LÍMITES (Escenario Catastrófico) ⚠️

Si NO implementas límites y los clientes abusan:

**1,000 clientes STARTER sin límites**:
- Cada uno sube 50GB (en vez de 5GB): €1,150/mes → €11,500/mes
- Cada uno hace 30 firmas (en vez de 3): €3,000/mes → €30,000/mes
- Cada uno usa 50K tokens IA (en vez de 5K): €24/mes → €240/mes

**TOTAL**: €41,740/mes en costos (vs €5,805 con límites)

**Ingresos**: €74,200/mes  
**Costos**: €41,740/mes  
**Margen**: €32,460 (43%) ⚠️ **MUY BAJO**

---

## 🛡️ SOLUCIONES PARA CONTROLAR COSTOS

### 1. Límites Estrictos (CRÍTICO)

```typescript
// Ejemplo: Verificar límite antes de crear firma
const usage = await getMonthlyUsage(companyId, 'signatures');

if (usage.count >= company.signatureLimitMonth) {
  return NextResponse.json({
    error: 'Límite de firmas alcanzado',
    message: `Has usado ${usage.count}/${company.signatureLimitMonth} firmas este mes. Actualiza tu plan o espera al próximo ciclo.`,
    upgradeUrl: '/dashboard/billing',
  }, { status: 429 });
}
```

### 2. Tracking de Uso

```prisma
model UsageLog {
  id         String   @id @default(cuid())
  companyId  String
  service    String   // "s3", "signaturit", "claude", "twilio"
  metric     String   // "storage_gb", "signatures", "tokens", "sms"
  value      Float    // Cantidad usada
  cost       Float    // Costo incurrido
  period     DateTime // Mes de facturación
  createdAt  DateTime @default(now())

  company Company @relation(fields: [companyId], references: [id])

  @@index([companyId, service, period])
}
```

### 3. Alertas Automáticas

```typescript
// Cron job diario
async function checkUsageLimits() {
  const companies = await prisma.company.findMany({
    where: { subscriptionPlanId: { not: null } },
  });

  for (const company of companies) {
    const usage = await getMonthlyUsage(company.id);

    // Alerta al 80%
    if (usage.signatures / company.signatureLimitMonth > 0.8) {
      await sendEmail(company.contactEmail, {
        subject: 'Alerta: 80% de cuota de firmas usada',
        body: `Has usado ${usage.signatures} de ${company.signatureLimitMonth} firmas...`,
      });
    }

    // Alerta al 100%
    if (usage.signatures >= company.signatureLimitMonth) {
      await sendEmail(company.contactEmail, {
        subject: 'Límite alcanzado: No puedes crear más firmas',
        body: 'Has alcanzado tu límite mensual de firmas...',
      });
    }
  }
}
```

### 4. Cobro por Exceso

```typescript
// Al final del mes, calcular excesos
async function calculateOverages(companyId: string) {
  const usage = await getMonthlyUsage(companyId);
  const plan = await getPlan(companyId);

  let overageCost = 0;

  // Firmas extra: €2/firma
  if (usage.signatures > plan.signaturesIncluded) {
    const extra = usage.signatures - plan.signaturesIncluded;
    overageCost += extra * 2;
  }

  // Storage extra: €0.05/GB
  if (usage.storageGB > plan.storageIncludedGB) {
    const extra = usage.storageGB - plan.storageIncludedGB;
    overageCost += extra * 0.05;
  }

  if (overageCost > 0) {
    await createInvoice(companyId, {
      type: 'overage',
      amount: overageCost,
      description: `Cargos por uso adicional - ${format(new Date(), 'MMMM yyyy')}`,
    });
  }
}
```

### 5. Rate Limiting

```typescript
// lib/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export const signatureRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1 d'), // Máximo 10 firmas/día
});

export const aiRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(50, '1 d'), // Máximo 50 requests IA/día
});

// Uso en API route
const { success } = await signatureRateLimit.limit(companyId);
if (!success) {
  return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
}
```

---

## 📈 MODELO DE PRECIOS OPTIMIZADO

### Precios Actuales (Propuesta)

| Plan | Precio | S3 | Firmas | IA | Costo Inmova | Margen |
|------|--------|----|---------|----|--------------|---------|
| FREE | €0 | 500MB | 0 | 100 tokens | €0.01 | -100% |
| STARTER | €49 | 5GB | 3 | 5K tokens | €3.14 | 94% ✅ |
| PROFESSIONAL | €149 | 20GB | 10 | 50K tokens | €10.70 | 93% ✅ |
| ENTERPRISE | €499 | 100GB | 50 | 200K tokens | €53.24 | 89% ✅ |

### Mejoras Sugeridas

**Opción 1: Aumentar Precio de STARTER**
- Cambiar de €49 → **€59/mes**
- Mejora margen y reduce riesgo

**Opción 2: Reducir Cuotas Incluidas**
- STARTER: 3 firmas → **2 firmas/mes**
- Forzar a usar plan superior o pagar extras

**Opción 3: Cobro por Uso Variable**
- Plan base: €39/mes (incluye plataforma + 1GB + 0 firmas)
- Firmas: €1.50/firma (Inmova paga €1, gana €0.50)
- Storage: €0.05/GB extra
- IA: €0.01/1K tokens extra

---

## 🚨 RIESGOS Y MITIGACIÓN

### Riesgo 1: Cliente Abusa de Firmas
**Probabilidad**: Alta 🔴  
**Impacto**: Alto (€1/firma perdida)  
**Mitigación**:
- ✅ Límite estricto por plan
- ✅ Bloqueo automático al alcanzar límite
- ✅ Cobro €2/firma extra si autoriza

### Riesgo 2: Cliente Sube Archivos Masivos
**Probabilidad**: Media 🟡  
**Impacto**: Medio (€0.023/GB)  
**Mitigación**:
- ✅ Límite de GB por plan
- ✅ Límite de tamaño por archivo (10MB)
- ✅ Alerta al 80% de cuota

### Riesgo 3: Cliente Spam de IA
**Probabilidad**: Media 🟡  
**Impacto**: Bajo (€0.005 por request)  
**Mitigación**:
- ✅ Rate limit: 50 requests/día
- ✅ Límite de tokens mensual
- ✅ Throttling después de exceder

### Riesgo 4: Crecimiento Rápido Sin Control
**Probabilidad**: Baja 🟢  
**Impacto**: Crítico (quiebra)  
**Mitigación**:
- ✅ Dashboard de costos agregados
- ✅ Alerta si costos > €10K/mes
- ✅ Revisión mensual de márgenes

---

## 💡 ESTRATEGIAS ALTERNATIVAS

### Opción 1: Modelo Híbrido (RECOMENDADO)

**Clientes pequeños**: Inmova paga (como ahora)  
**Clientes grandes**: Traen su propia cuenta (BYOK)

```typescript
// En settings de empresa
if (company.tier === 'ENTERPRISE' && company.monthlySignatures > 100) {
  // Ofrecer usar su propia cuenta de Signaturit
  showBYOKOption = true;
}
```

**Ventajas**:
- Escalas sin riesgo con clientes grandes
- Clientes pequeños siguen con experiencia simple

---

### Opción 2: Solo Facturación Variable

**Eliminar planes fijos**, cobrar solo por uso:
- Plataforma: €29/mes
- Firmas: €1.50/firma
- Storage: €0.05/GB
- IA: €0.01/1K tokens

**Ventajas**:
- Costos proporcionales siempre
- Margen garantizado

**Desventajas**:
- Menos predecible para clientes
- Conversión inicial más difícil

---

### Opción 3: Freemium + Upsell Agresivo

**Plan FREE muy limitado**:
- 0 firmas incluidas
- 100MB storage
- 0 IA

**Forzar upgrade rápido**:
- Primera firma → "Actualiza a STARTER (€49)"
- Después de 100MB → "Actualiza o elimina archivos"

**Ventajas**:
- Conversión más alta a planes de pago
- Costos FREE casi cero

---

## 📊 DASHBOARD DE CONTROL (Recomendado Implementar)

### Panel de Costos Inmova (Admin Interno)

```typescript
interface CostDashboard {
  period: 'month' | 'week' | 'day';
  
  totalCosts: {
    s3: number;
    signaturit: number;
    claude: number;
    twilio: number;
    total: number;
  };
  
  totalRevenue: number;
  margin: number; // percentage
  marginAmount: number;
  
  topConsumers: Array<{
    companyId: string;
    companyName: string;
    cost: number;
    revenue: number;
    margin: number;
  }>;
  
  alerts: Array<{
    type: 'high_cost' | 'low_margin' | 'exceeded_limit';
    companyId: string;
    message: string;
  }>;
}
```

**Vista Ejemplo**:
```
📊 COSTOS INMOVA - ENERO 2026

Costos Totales: €5,805
Ingresos: €74,200
Margen: 92% (€68,395)

Top 5 Consumidores:
1. Empresa ABC - €150 costo / €149 ingreso ⚠️ (-1% margen)
2. Empresa XYZ - €50 costo / €499 ingreso ✅ (90% margen)
...

🚨 Alertas:
- Empresa ABC excedió su cuota de firmas (35/10)
- Empresa DEF al 85% de storage
```

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

### Fase 1: Control Básico (CRÍTICO - Implementar YA)
- [ ] Añadir campos de límites a `SubscriptionPlan`:
  - `signaturesIncludedMonth`
  - `storageIncludedGB`
  - `tokensIncludedMonth`
- [ ] Crear modelo `UsageLog` en Prisma
- [ ] Middleware de verificación de límites antes de:
  - Crear firma
  - Upload archivo
  - Request IA
- [ ] Retornar 429 si excede límite

### Fase 2: Tracking y Alertas (1-2 semanas)
- [ ] Función `trackUsage()` en cada servicio
- [ ] Cron job diario de alertas
- [ ] Email al 80% y 100% de cuota
- [ ] Dashboard de uso para cliente

### Fase 3: Facturación por Exceso (1 mes)
- [ ] Sistema de cálculo de overages
- [ ] Integración con Stripe para cobro extra
- [ ] Facturas automáticas fin de mes
- [ ] Dashboard de costos para Inmova

### Fase 4: Optimizaciones (2-3 meses)
- [ ] Rate limiting granular
- [ ] Compresión automática de imágenes
- [ ] Cache de respuestas IA comunes
- [ ] Modelo híbrido (BYOK para Enterprise)

---

## 🎯 RECOMENDACIÓN FINAL

### Para 0-100 Clientes:
**Modelo actual (Inmova paga todo) + Límites estrictos**
- ✅ Simple de implementar
- ✅ Buena experiencia de cliente
- ✅ Riesgo bajo

### Para 100-1,000 Clientes:
**Modelo actual + Tracking + Alertas + Cobro por exceso**
- ✅ Control total de costos
- ✅ Margen alto (90%+)
- ⚠️ Necesita monitoreo activo

### Para 1,000+ Clientes:
**Modelo híbrido (Clientes grandes BYOK)**
- ✅ Escalabilidad infinita
- ✅ Sin riesgo de costos explosivos
- ⚠️ Experiencia más compleja para Enterprise

---

## 💰 CONCLUSIÓN

**¿Se disparan los costos con muchos clientes?**  
**Respuesta**: **SÍ**, si no implementas límites.  
**Solución**: **Límites estrictos + Tracking + Cobro por exceso** = Margen 90%+ garantizado.

**Prioridad INMEDIATA**:
1. Implementar límites de uso por plan
2. Bloquear acciones si excede límite
3. Dashboard básico de costos (interno Inmova)

**Timeline**: 1-2 semanas para control básico.

---

**Última actualización**: 4 de Enero de 2026  
**Autor**: Análisis Inmova
