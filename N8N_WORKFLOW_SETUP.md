# 🔗 n8n Workflow Setup - Inmova Auto-Growth

## 📋 Archivo del Workflow

**Ubicación**: `/workspace/n8n-workflows/inmova-auto-growth-webhook.json`

Este archivo contiene el workflow completo listo para importar en n8n.

---

## 🚀 Instalación en n8n

### Opción 1: Importar JSON (Recomendado)

1. **Acceder a n8n**

   ```
   http://tu-servidor-n8n:5678
   ```

2. **Importar Workflow**
   - Click en "Workflows" (menú izquierdo)
   - Click en "+ Workflow"
   - Click en el menú "⋮" (arriba derecha)
   - Seleccionar "Import from File"
   - Subir: `/workspace/n8n-workflows/inmova-auto-growth-webhook.json`

3. **Activar Workflow**
   - Click en "Active" (toggle superior)

### Opción 2: Instalación Automática (vía CLI)

```bash
# Copiar workflow al servidor n8n
scp /workspace/n8n-workflows/inmova-auto-growth-webhook.json \
  root@servidor-n8n:/root/.n8n/workflows/

# Reiniciar n8n
systemctl restart n8n
```

---

## ⚙️ Configuración Requerida

### 1. Variables de Entorno en n8n

**En el servidor n8n**, añadir a `.env`:

```env
# Secret para verificar firma HMAC
INMOVA_WEBHOOK_SECRET=tu-secret-de-256-bits-aqui

# Opcionales: Alertas
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
```

**Aplicar cambios**:

```bash
systemctl restart n8n
```

### 2. Configurar Credenciales de Redes Sociales

En n8n Dashboard → **Credentials**:

#### LinkedIn OAuth2

1. Click en "+ Add Credential"
2. Buscar "LinkedIn OAuth2 API"
3. Configurar:
   - **Client ID**: (de LinkedIn Developer Portal)
   - **Client Secret**: (de LinkedIn Developer Portal)
   - **Auth URL**: `https://www.linkedin.com/oauth/v2/authorization`
   - **Access Token URL**: `https://www.linkedin.com/oauth/v2/accessToken`
   - **Scope**: `w_member_social`
4. Click en "Connect my account"
5. Autorizar

#### Twitter OAuth1

1. Click en "+ Add Credential"
2. Buscar "Twitter OAuth1 API"
3. Configurar:
   - **API Key**: (de Twitter Developer Portal)
   - **API Secret Key**: (de Twitter Developer Portal)
   - **Access Token**: (de Twitter Developer Portal)
   - **Access Token Secret**: (de Twitter Developer Portal)
4. Guardar

#### Instagram Business Account

1. Click en "+ Add Credential"
2. Buscar "Instagram Business Account API"
3. Configurar:
   - **Access Token**: (de Facebook Graph API)
   - **Business Account ID**: (ID de tu cuenta de Instagram Business)
4. Guardar

**Nota**: Instagram requiere una página de Facebook conectada

#### Facebook Graph API

1. Click en "+ Add Credential"
2. Buscar "Facebook Graph API"
3. Configurar:
   - **Access Token**: (de Facebook Developer Portal)
   - **Page ID**: (ID de tu página de Facebook)
4. Guardar

### 3. Obtener URL del Webhook

Una vez activado el workflow:

1. Abrir el workflow en n8n
2. Click en el nodo "Webhook" (primer nodo)
3. Copiar la **Production URL**:
   ```
   https://n8n.tuservidor.com/webhook/auto-growth
   ```

---

## 🔐 Variables de Entorno en el Servidor Inmova

**En el servidor Inmova** (157.180.119.236), añadir a `/opt/inmova-app/.env.production`:

```env
# ======================================
# AUTO-GROWTH ENGINE
# ======================================

# URL del webhook de n8n (OBLIGATORIO)
SOCIAL_AUTOMATION_WEBHOOK=https://n8n.tuservidor.com/webhook/auto-growth

# Secret para firma HMAC (DEBE COINCIDIR con n8n)
SOCIAL_AUTOMATION_WEBHOOK_SECRET=tu-secret-de-256-bits-aqui

# Secret para cron jobs
CRON_SECRET=genera-otro-secret-diferente

# IA (OPCIONAL - usa templates si no están)
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...

# URL base de la app
NEXT_PUBLIC_APP_URL=https://inmovaapp.com
```

**Generar secrets seguros**:

```bash
# Generar secret de 256 bits
openssl rand -hex 32
```

---

## 📊 Estructura del Workflow

```
1. Webhook Trigger
   ↓
2. Verify HMAC Signature (Function)
   ↓
3. Switch Platform (basado en $json.platform)
   ├─→ LinkedIn → Publish to LinkedIn
   ├─→ X/Twitter → Publish to X/Twitter
   ├─→ Instagram → Publish to Instagram
   └─→ Facebook → Publish to Facebook
   ↓
4. Merge Results
   ↓
5. Success Response → Return { success: true }

En caso de error:
   ↓
Log Error → Error Response → Return { success: false }
```

---

## 🧪 Testing del Workflow

### Test Manual con curl

```bash
# Generar firma HMAC
PAYLOAD='{"platform":"x","content":"Test post from Inmova Auto-Growth","imageUrl":"https://inmovaapp.com/api/og/saas?topic=AUTOMATIZACION&variant=dashboard","metadata":{"topic":"AUTOMATIZACION","postId":"test123","campaign":"auto-growth-engine"}}'

SECRET="tu-secret-aqui"

SIGNATURE=$(echo -n "$PAYLOAD" | openssl dgst -sha256 -hmac "$SECRET" | sed 's/^.* //')

TIMESTAMP=$(date +%s000)

# Enviar request
curl -X POST "https://n8n.tuservidor.com/webhook/auto-growth" \
  -H "Content-Type: application/json" \
  -H "X-Inmova-Signature: $SIGNATURE" \
  -H "X-Inmova-Timestamp: $TIMESTAMP" \
  -d "$PAYLOAD"
```

**Respuesta esperada**:

```json
{
  "success": true,
  "platform": "x",
  "postId": "test123",
  "publishedAt": "2025-12-31T12:00:00.000Z",
  "message": "Post published successfully"
}
```

### Test desde Inmova App

```bash
# En el servidor Inmova
cd /opt/inmova-app

# Llamar cron manualmente
curl -X POST "http://localhost:3000/api/cron/publish" \
  -H "Authorization: Bearer $CRON_SECRET"
```

---

## 🔍 Monitoreo y Debugging

### Ver Ejecuciones en n8n

1. **Dashboard de n8n** → "Executions"
2. Filtrar por workflow "Inmova Auto-Growth"
3. Ver detalles de cada ejecución

### Logs del Workflow

En cada nodo puedes ver:

- **Input Data**: Datos recibidos
- **Output Data**: Datos enviados
- **Execution Time**: Tiempo de ejecución
- **Errors**: Errores si los hay

### Debugging Común

#### Error: "Invalid HMAC signature"

**Causa**: El secret no coincide entre Inmova y n8n

**Solución**:

```bash
# Verificar secrets
# En Inmova:
cat /opt/inmova-app/.env.production | grep SOCIAL_AUTOMATION_WEBHOOK_SECRET

# En n8n:
cat /root/.n8n/.env | grep INMOVA_WEBHOOK_SECRET

# Deben ser idénticos
```

#### Error: "Timestamp too old"

**Causa**: Reloj del servidor desincronizado

**Solución**:

```bash
# Sincronizar reloj
ntpdate -s time.nist.gov
```

#### Error: "LinkedIn authentication failed"

**Causa**: Token de LinkedIn expirado

**Solución**:

1. n8n Dashboard → Credentials → LinkedIn OAuth2
2. Click en "Reconnect"
3. Autorizar de nuevo

---

## 📈 Optimizaciones Avanzadas

### 1. Rate Limiting

Añadir nodo "Rate Limit" antes de publicar:

```javascript
// Function Node: Rate Limit Check
const platform = $json.platform;
const redis = require('redis').createClient();

const key = `ratelimit:${platform}:${(Date.now() / 60000) | 0}`;
const count = await redis.incr(key);
await redis.expire(key, 60);

if (count > 10) {
  // Máximo 10 posts/minuto por plataforma
  throw new Error(`Rate limit exceeded for ${platform}`);
}

return { json: $json };
```

### 2. Retry Logic

Configurar en cada nodo de publicación:

- Settings → "Retry on Fail"
- Number of Retries: 3
- Wait Between Retries: 5 seconds

### 3. Alertas a Slack

Añadir nodo "Slack" después de "Log Error":

```javascript
{
  "channel": "#inmova-alerts",
  "text": "🚨 Error publicando post en {{ $json.platform }}",
  "attachments": [{
    "color": "danger",
    "fields": [
      { "title": "Post ID", "value": "{{ $json.metadata.postId }}", "short": true },
      { "title": "Topic", "value": "{{ $json.metadata.topic }}", "short": true },
      { "title": "Error", "value": "{{ $json.error.message }}" }
    ]
  }]
}
```

### 4. Analytics Tracking

Añadir nodo "Function" después de "Success Response":

```javascript
// Guardar métricas en BD
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

await pool.query(
  `
  INSERT INTO social_post_analytics (
    post_id, platform, published_at, status
  ) VALUES ($1, $2, NOW(), 'published')
`,
  [$json.metadata.postId, $json.platform]
);

return { json: $json };
```

---

## ✅ Checklist de Configuración

### En n8n

- [ ] Workflow importado desde JSON
- [ ] Variable `INMOVA_WEBHOOK_SECRET` configurada
- [ ] Credenciales de LinkedIn configuradas
- [ ] Credenciales de Twitter configuradas
- [ ] Credenciales de Instagram configuradas
- [ ] Credenciales de Facebook configuradas
- [ ] Workflow activado (toggle "Active")
- [ ] URL del webhook copiada

### En Servidor Inmova

- [ ] Variable `SOCIAL_AUTOMATION_WEBHOOK` configurada
- [ ] Variable `SOCIAL_AUTOMATION_WEBHOOK_SECRET` configurada (mismo que n8n)
- [ ] Variable `CRON_SECRET` configurada
- [ ] Variables de IA configuradas (opcional)
- [ ] App reiniciada con nuevas variables

### Testing

- [ ] Test manual con curl → Success
- [ ] Test desde Inmova cron → Success
- [ ] Verificar post en red social → Visible
- [ ] Verificar logs en n8n → Sin errores

---

## 🆘 Soporte

### Documentación Oficial

- **n8n Docs**: https://docs.n8n.io/
- **LinkedIn API**: https://docs.microsoft.com/en-us/linkedin/
- **Twitter API**: https://developer.twitter.com/en/docs
- **Instagram Graph API**: https://developers.facebook.com/docs/instagram-api
- **Facebook Graph API**: https://developers.facebook.com/docs/graph-api

### Comandos Útiles

```bash
# Ver logs de n8n
journalctl -u n8n -f

# Reiniciar n8n
systemctl restart n8n

# Ver workflows activos
n8n list:workflow

# Ejecutar workflow manualmente
n8n execute:workflow --id=<workflow-id>
```

---

**Estado**: ✅ Workflow completo y listo para importar  
**Última actualización**: 31 de diciembre de 2025
