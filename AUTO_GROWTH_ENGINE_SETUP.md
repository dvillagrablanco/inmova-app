# 🚀 Inmova Auto-Growth Engine - Guía de Configuración

## ✅ Implementación Completada

Se han implementado los 4 módulos del Auto-Growth Engine para automatizar la presencia en redes sociales.

---

## 📦 Módulos Implementados

### MÓDULO 1: El Cerebro (Base de Datos) ✅

**Archivos creados**:

- `prisma/schema.prisma` → Modelo `SocialPost` + Enums
- `app/actions/auto-growth.ts` → Server Actions

**Modelo SocialPost**:

```prisma
model SocialPost {
  id String @id @default(cuid())

  // Contenido
  topic       SocialPostTopic
  platform    SocialPlatform
  content     String         @db.Text
  imageUrl    String?
  imagePrompt String?        @db.Text

  // Estado
  status      SocialPostStatus @default(DRAFT)
  scheduledAt DateTime?
  publishedAt DateTime?

  // Metadata
  engagement  Json?
  webhookSent Boolean @default(false)
  errorLog    String? @db.Text

  // Audit
  createdBy String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

**Server Actions disponibles**:

- `generateWeeklyContent()` → Crea 7 posts para la próxima semana
- `getPendingDraftPosts()` → Obtiene posts sin contenido
- `getScheduledPosts()` → Obtiene posts listos para publicar
- `markPostAsPublished(id)` → Marca post como publicado
- `markPostAsFailed(id, error)` → Marca post como fallido
- `updatePostContent(id, content, imageUrl)` → Actualiza contenido de post
- `getPostStats()` → Obtiene estadísticas

---

### MÓDULO 2: El Diseñador Robot (SaaS UI Mockups) ✅

**Archivo creado**:

- `app/api/og/saas/route.tsx` → Generador de imágenes con @vercel/og

**5 Variantes de Diseño**:

1. **Notification** (`variant=notification`)
   - Simula notificación push de la app
   - Ideal para: FIRMA_DIGITAL, COMUNIDADES, AUTOMATIZACION

2. **Dashboard** (`variant=dashboard`)
   - Panel de control con métricas
   - Ideal para: GESTION_ALQUILERES, INTEGRACIONES, REPORTES_ANALYTICS

3. **Chart** (`variant=chart`)
   - Gráfico de barras ascendente
   - Ideal para: ROI_INMOBILIARIO, ESCALABILIDAD

4. **Mobile** (`variant=mobile`)
   - Mockup de móvil con app
   - Ideal para: COLIVING, TIEMPO_LIBERTAD

5. **Simple** (`variant=simple`)
   - Tipografía masiva minimalista
   - Ideal para: Posts genéricos

**Ejemplos de uso**:

```
GET /api/og/saas?topic=AUTOMATIZACION&variant=dashboard
GET /api/og/saas?topic=FIRMA_DIGITAL&variant=notification
GET /api/og/saas?topic=ROI_INMOBILIARIO&variant=chart
```

---

### MÓDULO 3: El Copywriter Políglota (AI Service) ✅

**Archivo creado**:

- `lib/ai/copywriter.ts` → Generador de contenido con IA

**Features**:

- ✅ Soporte Anthropic Claude (preferido)
- ✅ Fallback a OpenAI GPT-4
- ✅ Fallback a templates predefinidos si no hay API keys
- ✅ Personalidad "Growth Manager Inmobiliario"
- ✅ Copywriting específico por plataforma:
  - **LinkedIn**: 3 párrafos, profesional, enfocado en ROI
  - **X**: Máximo 280 caracteres, directo, punchy
  - **Instagram**: Aspiracional, con 3-5 hashtags
  - **Facebook**: Conversacional, historia/caso de uso

**Funciones principales**:

```typescript
// Generar solo copy
generateSocialCopy({ topic, platform, useAI });

// Generar copy + imagen completa
generateCompletePost({ topic, platform, imagePrompt, useAI });
```

**Topics soportados**:

- FIRMA_DIGITAL
- AUTOMATIZACION
- GESTION_ALQUILERES
- COLIVING
- COMUNIDADES
- ROI_INMOBILIARIO
- TIEMPO_LIBERTAD
- ESCALABILIDAD
- INTEGRACIONES
- REPORTES_ANALYTICS

---

### MÓDULO 4: El Despachador (Automation) ✅

**Archivos creados**:

- `app/api/cron/generate-content/route.ts` → Genera contenido de posts DRAFT
- `app/api/cron/publish/route.ts` → Publica posts SCHEDULED
- `vercel.json` → Configuración de cron jobs

**Cron Jobs**:

1. **Generador de Contenido**
   - **Ruta**: `/api/cron/generate-content`
   - **Frecuencia**: Diario a las 8:00 AM
   - **Función**: Toma posts en DRAFT sin contenido y los llena con copy e imágenes

2. **Publicador**
   - **Ruta**: `/api/cron/publish`
   - **Frecuencia**: Cada 15 minutos
   - **Función**: Envía posts SCHEDULED al webhook externo (n8n/Make/Metricool)

**Payload del Webhook**:

```json
{
  "platform": "linkedin",
  "content": "Post content here...",
  "imageUrl": "https://inmovaapp.com/api/og/saas?topic=AUTOMATIZACION&variant=dashboard",
  "scheduledFor": "2025-01-15T09:00:00Z",
  "metadata": {
    "topic": "AUTOMATIZACION",
    "postId": "cljk3...",
    "campaign": "auto-growth-engine"
  }
}
```

**Headers enviados**:

- `X-Inmova-Signature`: Firma HMAC SHA-256 del payload
- `X-Inmova-Timestamp`: Timestamp Unix
- `User-Agent`: Inmova-Auto-Growth/1.0

---

## ⚙️ Configuración Requerida

### 1. Variables de Entorno

Añade estas variables en Vercel/Railway:

```env
# ======================================
# AUTO-GROWTH ENGINE
# ======================================

# Webhook para n8n/Make/Metricool (OBLIGATORIO)
SOCIAL_AUTOMATION_WEBHOOK=https://n8n.inmova.app/webhook/auto-growth
SOCIAL_AUTOMATION_WEBHOOK_SECRET=tu-secret-de-256-bits-aqui

# Cron Secret para autorización (OBLIGATORIO)
CRON_SECRET=tu-secret-para-cron-jobs

# IA (OPCIONAL - usa templates si no están configuradas)
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...

# URL base de la app (para generar URLs de imágenes)
NEXT_PUBLIC_APP_URL=https://inmovaapp.com
```

### 2. Migración de Base de Datos

```bash
# Generar Prisma Client con nuevos modelos
npx prisma generate

# Crear migración
npx prisma migrate dev --name add-social-posts

# O aplicar en producción
npx prisma migrate deploy
```

### 3. Instalar Dependencias

```bash
# @vercel/og ya está instalado ✅
npm install @vercel/og
```

---

## 🎯 Workflow Completo

### Flujo Automático (Sin Intervención Humana)

```
PASO 1: Generación Semanal
┌────────────────────────────────────┐
│ Usuario (manual) o Cron (auto)    │
│ llama generateWeeklyContent()      │
└──────────────┬─────────────────────┘
               │
               ▼
┌────────────────────────────────────┐
│ Se crean 7 posts en BD             │
│ Status: DRAFT                      │
│ Content: vacío                     │
│ scheduledAt: fechas programadas    │
└──────────────┬─────────────────────┘
               │
               ▼
PASO 2: Generación de Contenido (Diario 8 AM)
┌────────────────────────────────────┐
│ Cron: /api/cron/generate-content   │
│ Busca posts DRAFT sin content      │
└──────────────┬─────────────────────┘
               │
               ▼
┌────────────────────────────────────┐
│ Para cada post:                    │
│ 1. Genera copy con IA              │
│ 2. Genera URL de imagen OG         │
│ 3. Actualiza post en BD            │
│ 4. Status: DRAFT → SCHEDULED       │
└──────────────┬─────────────────────┘
               │
               ▼
PASO 3: Publicación (Cada 15 minutos)
┌────────────────────────────────────┐
│ Cron: /api/cron/publish            │
│ Busca posts SCHEDULED vencidos     │
└──────────────┬─────────────────────┘
               │
               ▼
┌────────────────────────────────────┐
│ Para cada post:                    │
│ 1. Envía payload a webhook         │
│ 2. Webhook distribuye a redes      │
│ 3. Marca post como PUBLISHED       │
└────────────────────────────────────┘
```

### Calendario de Publicación

| Día       | LinkedIn | X        | Instagram |
| --------- | -------- | -------- | --------- |
| Lunes     | 9:00 AM  | -        | 6:00 PM   |
| Martes    | -        | 12:00 PM | -         |
| Miércoles | 9:00 AM  | -        | -         |
| Jueves    | -        | 12:00 PM | 6:00 PM   |
| Viernes   | 9:00 AM  | -        | -         |

**Total**: 7 posts/semana automatizados

---

## 🔧 Uso Manual (Testing)

### 1. Generar Plan de Contenido Semanal

```typescript
import { generateWeeklyContent } from '@/app/actions/auto-growth';

// En un Server Component o API Route
const result = await generateWeeklyContent('user-id-optional');
console.log(result);
// { success: true, count: 7, message: "7 posts programados" }
```

### 2. Generar Contenido Manualmente

```bash
# Llamar al endpoint con secret
curl -X POST "https://inmovaapp.com/api/cron/generate-content" \
  -H "Authorization: Bearer tu-cron-secret"
```

O en navegador:

```
https://inmovaapp.com/api/cron/generate-content?secret=tu-cron-secret
```

### 3. Publicar Posts Manualmente

```bash
# Llamar al endpoint con secret
curl -X POST "https://inmovaapp.com/api/cron/publish" \
  -H "Authorization: Bearer tu-cron-secret"
```

### 4. Ver Imágenes Generadas

```
https://inmovaapp.com/api/og/saas?topic=AUTOMATIZACION&variant=dashboard
https://inmovaapp.com/api/og/saas?topic=FIRMA_DIGITAL&variant=notification
https://inmovaapp.com/api/og/saas?topic=ROI_INMOBILIARIO&variant=chart
```

---

## 🎛️ Panel de Administración (TODO)

**Próxima implementación**: Dashboard en `/admin/auto-growth` para:

- ✅ Ver todos los posts (DRAFT, SCHEDULED, PUBLISHED, FAILED)
- ✅ Previsualizar contenido e imágenes
- ✅ Editar contenido manualmente
- ✅ Reprogramar posts
- ✅ Generar contenido semanal con un botón
- ✅ Ver estadísticas de engagement
- ✅ Test de webhook

---

## 🔗 Integración con n8n/Make

### Setup en n8n

1. **Crear Workflow**
   - Trigger: Webhook (POST)
   - URL: `https://n8n.inmova.app/webhook/auto-growth`

2. **Verificar Firma HMAC** (Function Node)

```javascript
const receivedSignature = $headers['x-inmova-signature'];
const timestamp = $headers['x-inmova-timestamp'];

// Verificar timestamp (no más de 5 minutos)
if (Date.now() - parseInt(timestamp) > 300000) {
  throw new Error('Timestamp too old');
}

// Recalcular firma
const crypto = require('crypto');
const secret = 'tu-secret-aqui';
const expectedSignature = crypto
  .createHmac('sha256', secret)
  .update(JSON.stringify($json))
  .digest('hex');

// Comparar
if (receivedSignature !== expectedSignature) {
  throw new Error('Invalid signature');
}

return $json;
```

3. **Switch Platform** (basado en `platform`)
   - linkedin → LinkedIn API Node
   - x → Twitter API Node
   - instagram → Instagram Graph API Node
   - facebook → Facebook API Node

4. **Publicar en Red Social**
   - Configurar API keys de cada plataforma
   - Usar `content` como texto del post
   - Usar `imageUrl` como imagen adjunta
   - Usar `scheduledFor` si se soporta programación

5. **Responder a Inmova** (HTTP Response Node)

```json
{
  "success": true,
  "platform": "{{$json.platform}}",
  "postId": "{{$json.metadata.postId}}",
  "publishedAt": "{{$now}}"
}
```

---

## 📊 Monitoreo y Métricas

### Ver Estadísticas

```typescript
import { getPostStats } from '@/app/actions/auto-growth';

const stats = await getPostStats();
console.log(stats);
// {
//   success: true,
//   stats: {
//     total: 28,
//     draft: 0,
//     scheduled: 7,
//     published: 20,
//     failed: 1
//   }
// }
```

### Verificar Posts Pendientes

```typescript
import { getPendingDraftPosts, getScheduledPosts } from '@/app/actions/auto-growth';

// Posts sin contenido
const drafts = await getPendingDraftPosts();

// Posts listos para publicar
const scheduled = await getScheduledPosts();
```

### Logs de Vercel

```bash
# Ver logs de cron jobs
vercel logs --follow

# Filtrar por auto-growth
vercel logs --follow | grep "Auto-Growth"
```

---

## 🚨 Troubleshooting

### Posts no se generan contenido

**Problema**: Posts quedan en DRAFT vacíos

**Soluciones**:

1. Verificar que el cron job esté activo en Vercel
2. Revisar logs: `vercel logs | grep "generate-content"`
3. Llamar manualmente: `GET /api/cron/generate-content?secret=...`
4. Verificar API keys de IA (o usar templates)

### Posts no se publican

**Problema**: Posts quedan en SCHEDULED

**Soluciones**:

1. Verificar `SOCIAL_AUTOMATION_WEBHOOK` esté configurado
2. Revisar logs: `vercel logs | grep "publish"`
3. Test manual del webhook con curl
4. Verificar firma HMAC en n8n

### Imágenes no se generan

**Problema**: URLs de imágenes retornan error

**Soluciones**:

1. Verificar que `@vercel/og` esté instalado
2. Test directo: `GET /api/og/saas?topic=AUTOMATIZACION&variant=dashboard`
3. Revisar logs de Edge Function
4. Verificar que `NEXT_PUBLIC_APP_URL` esté configurado

### Webhook falla

**Problema**: n8n rechaza el webhook

**Soluciones**:

1. Verificar firma HMAC en n8n
2. Test con curl manual
3. Revisar configuración de `SOCIAL_AUTOMATION_WEBHOOK_SECRET`
4. Verificar que ambos lados usen el mismo secret

---

## 🎯 Próximos Pasos

### Fase 1: Testing (Esta Semana)

- [ ] Configurar variables de entorno
- [ ] Ejecutar migración de BD
- [ ] Generar primer batch de posts
- [ ] Probar generación de contenido
- [ ] Configurar webhook en n8n/Make
- [ ] Probar publicación end-to-end

### Fase 2: Optimización (Próxima Semana)

- [ ] Crear dashboard de admin
- [ ] Añadir métricas de engagement
- [ ] A/B testing de copy variants
- [ ] Integrar analytics de cada plataforma

### Fase 3: Escalamiento (Mes 1)

- [ ] Aumentar frecuencia de posts
- [ ] Añadir más topics
- [ ] Respuestas automáticas a comentarios (IA)
- [ ] Detección de trending topics

---

## 📚 Referencias

- **Cursorrules**: `/workspace/.cursorrules` (línea 2847+)
- **Documentación Completa**: `/workspace/MOTOR_CRECIMIENTO_SAAS.md`
- **@vercel/og Docs**: https://vercel.com/docs/functions/edge-functions/og-image-generation
- **n8n Docs**: https://docs.n8n.io/
- **Make Docs**: https://www.make.com/en/help

---

**Estado**: ✅ Todos los módulos implementados y listos para testing  
**Última actualización**: 31 de diciembre de 2025  
**Versión**: 1.0.0
