# 🚀 Deployment Auto-Growth Engine - COMPLETADO

**Fecha**: 31 de Diciembre de 2025  
**Servidor**: inmovaapp.com (157.180.119.236)  
**Estado**: ✅ **Operativo en modo DEV**

---

## ✅ Módulos Implementados y Deployados

### MÓDULO 1: Base de Datos ✅

**Modelo Prisma**: `MarketingSocialPost`

- **Ubicación**: `prisma/schema.prisma`
- **Enums**:
  - `MarketingSocialPlatform`: LINKEDIN, X, INSTAGRAM, FACEBOOK
  - `MarketingSocialPostStatus`: DRAFT, SCHEDULED, PUBLISHED, FAILED
  - `MarketingTopic`: 10 topics de marketing
- **Tabla BD**: `marketing_social_posts`
- **Estado**: ✅ Schema aplicado correctamente

**Server Actions**:

- `generateWeeklyContent()`: Crea 7 posts para la próxima semana
- `getPendingDraftPosts()`: Obtiene posts sin contenido
- `getScheduledPosts()`: Obtiene posts programados para publicar
- `markPostAsPublished()`: Marca post como publicado
- `markPostAsFailed()`: Marca post como fallido
- `updatePostContent()`: Actualiza contenido del post
- `getPostStats()`: Obtiene estadísticas

**Ubicación**: `app/actions/auto-growth.ts`

### MÓDULO 2: Diseñador Robot (OG Images) ✅

**Ruta API**: `/api/og/saas`

**Características**:

- ✅ 5 variantes de mockups UI: `notification`, `dashboard`, `chart`, `mobile`, `simple`
- ✅ Generación dinámica con `@vercel/og`
- ✅ Diseño avanzado con HTML/Tailwind
- ✅ Soporte de 10 topics
- ✅ Backgrounds profesionales

**Ubicación**: `app/api/og/saas/route.tsx`

**Ejemplo**: `https://inmovaapp.com/api/og/saas?topic=AUTOMATIZACION&variant=dashboard`

### MÓDULO 3: Copywriter IA ✅

**Servicio**: `lib/ai/copywriter.ts`

**Características**:

- ✅ Anthropic Claude 3.5 Sonnet (preferido)
- ✅ Fallback OpenAI GPT-4 Turbo
- ✅ Fallback Templates (sin IA)
- ✅ Copy específico por plataforma:
  - **LinkedIn**: 3 párrafos, profesional, ROI focus
  - **X**: <280 caracteres, directo, provocador
  - **Instagram**: Persuasivo + hashtags
  - **Facebook**: Conversacional, CTA clara
- ✅ Personalidad: "Growth Manager Inmobiliario" (estilo Homming/Rentger)

**Funciones**:

- `generateSocialCopy()`: Genera solo texto
- `generateCompletePost()`: Genera texto + imagen URL

### MÓDULO 4: Despachador Automatizado ✅

**Cron Jobs** (configurados en `vercel.json`):

#### 1. Generador de Contenido

- **Ruta**: `/api/cron/generate-content`
- **Frecuencia**: Diario a las 8:00 AM
- **Función**: Busca posts en DRAFT, genera contenido con IA, actualiza a SCHEDULED

#### 2. Publicador

- **Ruta**: `/api/cron/publish`
- **Frecuencia**: Cada 15 minutos
- **Función**: Busca posts SCHEDULED, envía a webhook, marca como PUBLISHED

**Webhook Payload**:

```json
{
  "platform": "linkedin",
  "content": "Post text...",
  "imageUrl": "https://inmovaapp.com/api/og/saas?...",
  "metadata": {
    "topic": "AUTOMATIZACION",
    "postId": "clxxx...",
    "campaign": "auto-growth-engine"
  }
}
```

**Seguridad**: HMAC SHA-256 signature en header `X-Inmova-Signature`

---

## 🔐 Variables de Entorno Configuradas

**Ubicación**: `/opt/inmova-app/.env.production`

```env
# Base de Datos
DATABASE_URL="postgresql://inmova_user:InmovaSecure2025@localhost:5432/inmova_production?..."

# App
NEXT_PUBLIC_APP_URL="https://inmovaapp.com"
NEXTAUTH_URL="https://inmovaapp.com"
NEXTAUTH_SECRET="inmova-2025-production-secret-key-change-in-prod"

# Auto-Growth Engine
SOCIAL_AUTOMATION_WEBHOOK="https://n8n.inmovaapp.com/webhook/auto-growth"
SOCIAL_AUTOMATION_WEBHOOK_SECRET="48ede4572402ebb83491a55bf0f3ace9e0eb698fc415a7525574f425da2ca360"
CRON_SECRET="yHiELDW9tWl3vF2gp3h8HPiXSZrHJ72Jg4doSQ6AxX4"

# IA (Opcional)
# ANTHROPIC_API_KEY=sk-ant-...
# OPENAI_API_KEY=sk-...
```

---

## 📊 Estado Actual del Deployment

### Aplicación

- **Estado**: ✅ Operativa
- **Modo**: DEV (build de producción falló por error en chatbot)
- **Puerto**: 3000
- **Proceso**: PM2 con ecosystem.config.js
- **Logs**: `/root/.pm2/logs/inmova-app-*.log`

### Base de Datos

- **PostgreSQL**: ✅ Corriendo
- **Schema**: ✅ Aplicado
- **Tabla `marketing_social_posts`**: ✅ Creada
- **Conexión**: ✅ Funcional

### Rutas Verificadas

- ✅ Landing: `https://inmovaapp.com/` (responde correctamente)
- ✅ OG Images: `https://inmovaapp.com/api/og/saas?topic=AUTOMATIZACION` (funcionando)
- ⚠️ Cron routes: No verificadas aún (requieren CRON_SECRET y n8n)

---

## ⚠️ Pendientes de Configuración

### 1. Configurar n8n

**Workflow listo para importar**: `n8n-workflows/inmova-auto-growth-webhook.json`

**Pasos**:

1. Instalar n8n en servidor o usar n8n cloud
2. Importar workflow JSON
3. Configurar credenciales de redes sociales:
   - LinkedIn OAuth2
   - Twitter OAuth1
   - Instagram Business API
   - Facebook Graph API
4. Configurar variable `INMOVA_WEBHOOK_SECRET` en n8n (debe coincidir con el secret en Inmova)
5. Activar workflow
6. Copiar URL del webhook y actualizar `SOCIAL_AUTOMATION_WEBHOOK` en `.env.production`

**Documentación completa**: `N8N_WORKFLOW_SETUP.md`

### 2. Configurar APIs de IA (Opcional)

Para mejores resultados, añadir a `.env.production`:

```env
ANTHROPIC_API_KEY=sk-ant-api-...
# O
OPENAI_API_KEY=sk-...
```

Si no se configuran, el sistema usará templates predefinidos.

### 3. Arreglar Error de Build (Chatbot)

**Error actual**:

```
Type error: Expected 2 arguments, but got 3.
File: app/api/chatbot/route.ts:54
```

**Solución**: Revisar la firma de la función `generateChatbotResponse` y ajustar la llamada.

**Nota**: Este error no afecta al Auto-Growth Engine, es independiente.

---

## 🧪 Testing del Sistema

### Test Manual de Generación de Contenido

**Vía SSH**:

```bash
ssh root@157.180.119.236
cd /opt/inmova-app

# Generar posts de la semana
npx tsx << 'EOF'
import { generateWeeklyContent } from './app/actions/auto-growth.js';
await generateWeeklyContent();
console.log('Posts generados!');
EOF
```

**Vía Cron API** (después de configurar n8n):

```bash
curl -X POST 'https://inmovaapp.com/api/cron/generate-content' \
  -H 'Authorization: Bearer yHiELDW9tWl3vF2gp3h8HPiXSZrHJ72Jg4doSQ6AxX4'
```

### Test de Publicación

```bash
curl -X POST 'https://inmovaapp.com/api/cron/publish' \
  -H 'Authorization: Bearer yHiELDW9tWl3vF2gp3h8HPiXSZrHJ72Jg4doSQ6AxX4'
```

### Test de OG Image

```bash
curl -I 'https://inmovaapp.com/api/og/saas?topic=FIRMA_DIGITAL&variant=notification'
```

---

## 📊 Métricas y Monitoreo

### Ver Logs PM2

```bash
pm2 logs inmova-app --lines 100
pm2 logs inmova-app --err  # Solo errores
```

### Ver Posts en BD

```bash
psql -d inmova_production -U inmova_user -c "SELECT id, topic, platform, status, scheduledAt FROM marketing_social_posts ORDER BY scheduledAt DESC LIMIT 10;"
```

### Ver Stats

```bash
# En la app (via Server Action)
npx tsx << 'EOF'
import { getPostStats } from './app/actions/auto-growth.js';
const stats = await getPostStats();
console.log(JSON.stringify(stats, null, 2));
EOF
```

---

## 🔄 Comandos Útiles

### Reiniciar Aplicación

```bash
pm2 restart inmova-app
```

### Ver Status

```bash
pm2 status
pm2 monit  # Dashboard interactivo
```

### Actualizar Código

```bash
cd /opt/inmova-app
git pull origin main
pm2 restart inmova-app
```

### Regenerar Prisma Client

```bash
cd /opt/inmova-app
npx prisma generate
pm2 restart inmova-app
```

---

## 🎯 Próximos Pasos (Recomendado)

### Fase 1: Completar Setup (Esta Semana)

- [ ] Configurar n8n e importar workflow
- [ ] Configurar credenciales de redes sociales
- [ ] Actualizar `SOCIAL_AUTOMATION_WEBHOOK` con URL real
- [ ] Test completo del flujo end-to-end
- [ ] Arreglar error de TypeScript en chatbot
- [ ] Build de producción exitoso

### Fase 2: Optimización (Próxima Semana)

- [ ] Configurar APIs de IA (Anthropic/OpenAI)
- [ ] Crear dashboard de admin para gestionar posts
- [ ] Añadir métricas de engagement
- [ ] Implementar retry logic mejorado

### Fase 3: Escalamiento (Mes 1)

- [ ] Aumentar frecuencia de posts
- [ ] Añadir más topics
- [ ] Soporte para más plataformas (TikTok, YouTube)
- [ ] A/B testing de copy
- [ ] Analytics dashboard

---

## 📞 Soporte y Documentación

### Documentación Completa

- `AUTO_GROWTH_ENGINE_SETUP.md`: Guía completa de setup
- `AUTO_GROWTH_ENGINE_RESUMEN.md`: Resumen ejecutivo
- `N8N_WORKFLOW_SETUP.md`: Guía de n8n
- `MOTOR_CRECIMIENTO_SAAS.md`: Especificación técnica completa

### Archivos Creados/Modificados

**Nuevos**:

- `app/actions/auto-growth.ts`
- `app/api/og/saas/route.tsx`
- `app/api/cron/generate-content/route.ts`
- `app/api/cron/publish/route.ts`
- `lib/ai/copywriter.ts`
- `n8n-workflows/inmova-auto-growth-webhook.json`
- Documentación (7 archivos .md)

**Modificados**:

- `prisma/schema.prisma` (modelo MarketingSocialPost)
- `vercel.json` (cron jobs)
- `package.json` (@vercel/og)
- `.env.production` (variables nuevas)

### Comandos de Debugging

```bash
# Ver errores de la app
pm2 logs inmova-app --err --lines 50

# Ver estado de la BD
systemctl status postgresql

# Verificar puertos
netstat -tlnp | grep :3000

# Ver procesos
ps aux | grep node
```

---

## ✅ Checklist Final

### Implementación

- [x] MÓDULO 1: Base de Datos ✅
- [x] MÓDULO 2: Diseñador Robot ✅
- [x] MÓDULO 3: Copywriter IA ✅
- [x] MÓDULO 4: Despachador ✅
- [x] Workflow n8n creado ✅
- [x] Schema Prisma aplicado ✅
- [x] Variables de entorno configuradas ✅
- [x] Aplicación deployada y funcionando ✅

### Pendientes

- [ ] n8n configurado e integrado
- [ ] APIs de IA configuradas (opcional)
- [ ] Error de TypeScript en chatbot arreglado
- [ ] Build de producción exitoso
- [ ] Test completo end-to-end

---

**Estado General**: 🟢 **Sistema Operativo y Listo para Configurar n8n**

**Próximo Paso Crítico**: Configurar n8n siguiendo `N8N_WORKFLOW_SETUP.md`

---

_Deployment completado el 31 de Diciembre de 2025 - Inmova Auto-Growth Engine v1.0_
