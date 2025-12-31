# 🚀 MOTOR DE CRECIMIENTO SAAS - MARKETING AUTÓNOMO

## 📋 Resumen Ejecutivo

Se ha añadido un sistema completo de **Marketing Automation** a las cursorrules de Inmova, diseñado para generar y distribuir contenido de forma autónoma en múltiples plataformas sociales (LinkedIn, Twitter, Instagram).

**Objetivo**: Posicionar Inmova como líder de pensamiento en PropTech sin intervención humana constante.

---

## 🎯 Características Principales

### 1. Identidad Visual & Branding (Estilo Homming/Rentger)

**Concepto Core**: No vendemos "pisos", vendemos **Control, Tiempo y Rentabilidad**.

#### Estética Generativa con `@vercel/og`

**✅ OBLIGATORIO**:

- Mockups de dashboard/móvil hechos con CSS (no Photoshop)
- Gráficos de barras ascendentes en verde (#10b981)
- Tipografía sans-serif masiva (72px+)
- Fondos sólidos o degradados corporativos (#667eea, #764ba2)

**❌ PROHIBIDO**:

- Fotos de stock genéricas
- Imágenes de gente dándose la mano
- Contenido que no transmita tecnología puntera

**Implementación**:

```typescript
// app/api/og/property/route.tsx
import { ImageResponse } from '@vercel/og';

export async function GET(request: Request) {
  return new ImageResponse(
    <div style={{
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      // ... Mockup de dashboard con gráficos
    }}>
      <h1 style={{ fontSize: '72px', fontWeight: 900 }}>
        12,500€ Ingresos este mes
      </h1>
    </div>,
    { width: 1200, height: 630 }
  );
}
```

---

### 2. Estrategia de Copywriting Multi-Plataforma

#### LinkedIn (Thought Leadership)

**Tono**: Profesional, enfocado en negocio y escalabilidad.

**Estructura**:

1. Gancho (primera línea potente)
2. Problema (pain point del sector)
3. Solución Inmova (sin ser vendedor)
4. Reflexión (CTA sutil)

**Ejemplo**:

```
La gestión inmobiliaria tradicional consume 15h/semana en tareas repetitivas.

El problema:
→ Emails manuales a inquilinos
→ Excel para seguimiento de pagos
→ WhatsApp para coordinar mantenimiento

El resultado: Menos tiempo para hacer crecer tu cartera.

¿La alternativa?
Automatización inteligente que te devuelve esas 15 horas.

¿Cuántas horas dedicas a tareas que podrían automatizarse?
```

**Frecuencia**: 3x/semana (Lunes, Miércoles, Viernes a las 9 AM)

---

#### X/Twitter (Punchy)

**Tono**: Directo, frases cortas, threads sobre productividad.

**Reglas**:

- Máximo 2 hashtags
- Threads de 3-5 tweets
- Primera línea = gancho

**Ejemplo**:

```
¿Cuántas horas pierdes enviando emails a inquilinos? 🕐

La media en España: 8h/semana.

Tareas repetitivas:
→ Recordatorios de pago
→ Avisos de mantenimiento
→ Renovaciones de contrato

Solución simple: Automatiza.

1 email → 100 emails
Mismo esfuerzo.

¿El resultado?

8 horas recuperadas cada semana.

= Tiempo para escalar tu cartera.

#PropTech #Automatización
```

**Frecuencia**: 2x/semana (Martes, Jueves a las 12 PM)

---

#### Instagram (Aspiracional/Visual)

**Tono**: Enfocado en el estilo de vida que consigues al automatizar (libertad).

**Reglas**:

- Imagen: Mockup de app + texto overlay
- Copy: Beneficio emocional > Features técnicos
- 5-10 hashtags relevantes

**Ejemplo**:

```
Imagina gestionar 20 propiedades desde la playa. 🏖️

No es un sueño.
Es automatización.

→ Pagos automatizados
→ Inquilinos notificados
→ Mantenimiento programado

Todo desde tu móvil.

Tu negocio inmobiliario ya no te ata a una oficina.

#PropTech #LibertadFinanciera #GestionInmobiliaria #Automatizacion
#NegocioDigital #RealEstate #Emprendedor #TiempoLibre
```

**Frecuencia**: 2x/semana (Lunes, Jueves a las 6 PM)

---

### 3. Protocolo de Automatización (The Dispatcher)

#### Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│ INMOVA APP                                                  │
│                                                             │
│ ┌─────────────────┐       ┌──────────────────┐           │
│ │ Cron Job        │──────>│ ContentDispatcher│           │
│ │ (Vercel Cron)   │       │                  │           │
│ └─────────────────┘       └──────────────────┘           │
│                                    │                        │
│                                    │ Webhook Seguro        │
│                                    │ (HMAC Signature)      │
│                                    ▼                        │
└────────────────────────────────────────────────────────────┘
                                     │
                                     │
                    ┌────────────────┴─────────────────┐
                    │                                  │
        ┌───────────▼───────────┐       ┌─────────────▼─────────────┐
        │ n8n / Make            │       │ Metricool                 │
        │                       │       │                           │
        │ ┌─────────────────┐  │       │ ┌───────────────────────┐ │
        │ │ LinkedIn API    │  │       │ │ Multi-Platform Post   │ │
        │ │ Twitter API     │  │       │ │ Scheduler             │ │
        │ │ Instagram API   │  │       │ └───────────────────────┘ │
        │ └─────────────────┘  │       │                           │
        └──────────────────────┘       └───────────────────────────┘
```

**Ventajas**:

- ✅ Inmova NO mantiene tokens de redes sociales
- ✅ Cambio de plataforma = solo cambiar workflow en n8n
- ✅ Logs centralizados en ambos lados
- ✅ Rate limiting manejado por n8n
- ✅ Retry automático en n8n
- ✅ Multi-cuenta (staging/production) fácil

#### Payload Estandarizado

```json
{
  "platform": "linkedin",
  "content": "Post content here...",
  "imageUrl": "https://inmova.app/api/og/dashboard?topic=automation",
  "scheduledFor": "2025-01-15T09:00:00Z",
  "metadata": {
    "topic": "automation",
    "campaign": "thought-leadership",
    "audience": "property-managers"
  }
}
```

#### Implementación

**1. Content Dispatcher** (`lib/marketing/content-dispatcher.ts`):

```typescript
export class ContentDispatcher {
  async dispatch(payload: MarketingPayload): Promise<boolean> {
    // 1. Generar firma HMAC
    const signature = this.generateSignature(payload);

    // 2. Enviar a webhook (n8n/Make/Metricool)
    const response = await fetch(this.webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Inmova-Signature': signature,
        'X-Inmova-Timestamp': Date.now().toString(),
      },
      body: JSON.stringify(payload),
    });

    // 3. Log para auditoría
    await prisma.marketingLog.create({
      data: {
        platform: payload.platform,
        content: payload.content,
        status: response.ok ? 'dispatched' : 'failed',
      },
    });

    return response.ok;
  }
}
```

**2. Cron Job Automático** (`app/api/cron/marketing-automation/route.ts`):

```typescript
export async function POST(req: NextRequest) {
  const dispatcher = new ContentDispatcher();

  // LinkedIn Post (L, X, V a las 9 AM)
  if (shouldPostLinkedIn()) {
    const topic = selectRandomTopic(['automation', 'scale', 'time']);
    const content = generateLinkedInPost(topic);
    const imageUrl = await generateOgImage({ type: 'dashboard', topic });

    await dispatcher.dispatch({
      platform: 'linkedin',
      content,
      imageUrl,
      scheduledFor: getNextBusinessHour(9),
      metadata: { topic, campaign: 'thought-leadership' },
    });
  }

  // Twitter Thread (M, J a las 12 PM)
  if (shouldPostTwitter()) {
    // ...
  }

  // Instagram Post (L, J a las 6 PM)
  if (shouldPostInstagram()) {
    // ...
  }
}
```

**3. Configuración Vercel Cron** (`vercel.json`):

```json
{
  "crons": [
    {
      "path": "/api/cron/marketing-automation",
      "schedule": "0 9 * * 1,3,5"
    }
  ]
}
```

---

### 4. Webhook Receptor (n8n/Make)

**Flujo Recomendado en n8n**:

1. **Webhook Trigger** → Recibe payload de Inmova
2. **Verificar Firma** → Valida HMAC signature
3. **Switch Platform** → Ruta según `platform`
   - LinkedIn → LinkedIn API Node
   - Twitter → Twitter API Node
   - Instagram → Instagram Graph API Node
4. **Schedule Post** → Si `scheduledFor` presente, programar
5. **Send Confirmation** → Responder a Inmova con success/failure

**Variables de Entorno en n8n**:

```bash
LINKEDIN_ACCESS_TOKEN=...
TWITTER_API_KEY=...
TWITTER_API_SECRET=...
INSTAGRAM_BUSINESS_ACCOUNT_ID=...
INMOVA_WEBHOOK_SECRET=...  # Para validar firma HMAC
```

---

### 5. Métricas y Analytics

**Dashboard Admin** (`app/api/admin/marketing-analytics/route.ts`):

```typescript
export async function GET() {
  const last30Days = new Date();
  last30Days.setDate(last30Days.getDate() - 30);

  const stats = await prisma.marketingLog.groupBy({
    by: ['platform', 'status'],
    where: { createdAt: { gte: last30Days } },
    _count: true,
  });

  return NextResponse.json({
    linkedin: {
      dispatched: stats.filter((s) => s.platform === 'linkedin' && s.status === 'dispatched')
        .length,
      failed: stats.filter((s) => s.platform === 'linkedin' && s.status === 'failed').length,
      successRate: '98%',
    },
    twitter: {
      /* ... */
    },
    instagram: {
      /* ... */
    },
  });
}
```

**Visualización**:

- Gráfico de barras: Posts enviados por plataforma
- Tasa de éxito/fallo
- Topics más usados
- Engagement estimado (si se integra con APIs de analytics)

---

## 📊 Calendario de Publicación

| Día       | LinkedIn | Twitter  | Instagram |
| --------- | -------- | -------- | --------- |
| Lunes     | 9:00 AM  | -        | 6:00 PM   |
| Martes    | -        | 12:00 PM | -         |
| Miércoles | 9:00 AM  | -        | -         |
| Jueves    | -        | 12:00 PM | 6:00 PM   |
| Viernes   | 9:00 AM  | -        | -         |

**Total**: 7 posts/semana (3 LinkedIn, 2 Twitter, 2 Instagram)

---

## 🔐 Seguridad

### HMAC Signature

Todos los webhooks usan firma HMAC SHA-256 para prevenir ataques:

```typescript
const crypto = require('crypto');
const signature = crypto
  .createHmac('sha256', process.env.MARKETING_WEBHOOK_SECRET!)
  .update(JSON.stringify(payload))
  .digest('hex');
```

**Headers Enviados**:

- `X-Inmova-Signature`: Firma HMAC del payload
- `X-Inmova-Timestamp`: Timestamp Unix para prevenir replay attacks

**Verificación en n8n**:

```javascript
// Function Node en n8n
const receivedSignature = $headers['x-inmova-signature'];
const timestamp = $headers['x-inmova-timestamp'];

// Verificar timestamp (no más de 5 minutos de antigüedad)
if (Date.now() - parseInt(timestamp) > 300000) {
  throw new Error('Timestamp too old');
}

// Recalcular firma
const crypto = require('crypto');
const expectedSignature = crypto
  .createHmac('sha256', process.env.INMOVA_WEBHOOK_SECRET)
  .update(JSON.stringify($json))
  .digest('hex');

// Comparar (constant-time comparison)
if (!crypto.timingSafeEqual(Buffer.from(receivedSignature), Buffer.from(expectedSignature))) {
  throw new Error('Invalid signature');
}

return $json; // Payload válido
```

---

## 🚀 Plan de Implementación

### Fase 1: Infraestructura Base (Semana 1)

- [x] Añadir sección a cursorrules ✅
- [ ] Crear Prisma model `MarketingLog`
- [ ] Implementar `ContentDispatcher`
- [ ] Configurar `@vercel/og` endpoint
- [ ] Setup variables de entorno

### Fase 2: Copywriters (Semana 2)

- [ ] Implementar `linkedin-copywriter.ts`
- [ ] Implementar `twitter-copywriter.ts`
- [ ] Implementar `instagram-copywriter.ts`
- [ ] Crear templates de imágenes con `@vercel/og`
- [ ] Test manual de copy generado

### Fase 3: Automatización (Semana 3)

- [ ] Crear cron job `/api/cron/marketing-automation`
- [ ] Configurar `vercel.json` crons
- [ ] Implementar helpers de scheduling
- [ ] Test de dispatch a webhook staging

### Fase 4: Integración n8n (Semana 4)

- [ ] Setup cuenta n8n (o Make/Metricool)
- [ ] Crear workflow de LinkedIn
- [ ] Crear workflow de Twitter
- [ ] Crear workflow de Instagram
- [ ] Test end-to-end completo

### Fase 5: Métricas & Optimización (Semana 5)

- [ ] Implementar dashboard de analytics
- [ ] A/B testing de copy variants
- [ ] Ajustar frecuencia basado en engagement
- [ ] Documentación final

---

## 📦 Dependencias Nuevas

```json
{
  "dependencies": {
    "@vercel/og": "^0.6.3" // Generación de imágenes dinámicas
  }
}
```

**Ya disponibles** (no instalar):

- `crypto` (Node.js built-in)
- `prisma` (ya instalado)
- Next.js API Routes (ya disponible)

---

## 🎯 KPIs de Éxito

| Métrica                    | Objetivo Mes 1 | Objetivo Mes 3 |
| -------------------------- | -------------- | -------------- |
| Posts publicados           | 28 posts       | 84 posts       |
| Tasa de éxito dispatch     | > 95%          | > 98%          |
| Engagement rate LinkedIn   | > 2%           | > 5%           |
| Followers ganados (total)  | +50            | +500           |
| Tiempo intervención humana | < 1h/semana    | < 30min/semana |

---

## 💡 Mejores Prácticas

### Contenido

1. **Variedad**: Usar IA (Claude/GPT-4) para generar variaciones de copy manteniendo templates base
2. **Autenticidad**: Mezclar posts automatizados con posts manuales ocasionales (eventos, noticias)
3. **Testing**: A/B test de diferentes hooks, CTAs, formatos

### Imágenes

1. **Consistencia Visual**: Usar mismo esquema de colores corporativos
2. **Mockups CSS**: Actualizar mockups cuando cambie UI real
3. **Performance**: Cachear imágenes generadas con `@vercel/og`

### Monitoreo

1. **Alertas**: Notificar si tasa de fallos > 10% en un día
2. **Review Manual**: Revisar posts generados cada semana
3. **Optimización**: Ajustar templates basado en engagement real

---

## 🔮 Futuro Roadmap

### Q1 2025

- ✅ Setup inicial y primeros posts automatizados
- [ ] Integración con Analytics API de cada plataforma
- [ ] Dashboard público de métricas

### Q2 2025

- [ ] Generación de copy con IA (GPT-4/Claude)
- [ ] Detección de trending topics en PropTech
- [ ] Respuestas automáticas a comentarios (IA + human-in-the-loop)

### Q3 2025

- [ ] Expansión a YouTube (video shorts automatizados)
- [ ] Podcast automation (text-to-speech)
- [ ] Newsletter email automation

---

## 📚 Referencias

- **Inspiración**: Homming, Rentger, Airbnb (no estética, solo estrategia)
- **Copywriting**: "Made to Stick" (Chip Heath), "Contagious" (Jonah Berger)
- **Automatización**: Documentación de n8n, Make, Metricool
- **Diseño**: Refactoring UI, Laws of UX

---

## ✅ Checklist Pre-Launch

### Técnico

- [ ] Prisma model `MarketingLog` creado
- [ ] `ContentDispatcher` implementado y testeado
- [ ] Cron jobs configurados en `vercel.json`
- [ ] Webhooks de n8n activos y validados
- [ ] Variables de entorno configuradas en Vercel

### Contenido

- [ ] 10 templates de copy por plataforma
- [ ] 5 variaciones de imágenes `@vercel/og`
- [ ] Review legal de copy (no promesas falsas)
- [ ] Approval de branding por stakeholders

### Seguridad

- [ ] HMAC signatures implementadas
- [ ] Secrets rotados y seguros
- [ ] Rate limiting en webhooks
- [ ] Logs de auditoría activos

### Monitoreo

- [ ] Dashboard de analytics implementado
- [ ] Alertas configuradas (email/Slack)
- [ ] Runbook de troubleshooting documentado
- [ ] Proceso de rollback definido

---

**Última actualización**: 31 de diciembre de 2025  
**Versión**: 1.0.0  
**Estado**: 📝 Especificación completa - Pendiente de implementación  
**Owner**: Equipo Inmova - Marketing Automation
