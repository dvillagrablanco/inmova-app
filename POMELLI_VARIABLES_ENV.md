# 🔧 VARIABLES DE ENTORNO - INTEGRACIÓN POMELLI

## Variables Requeridas

Agregar estas variables a tu archivo `.env` o configurar en Vercel Dashboard:

```env
# ============================================================================
# POMELLI SOCIAL MEDIA INTEGRATION
# ============================================================================

# API Credentials (Obtener en Pomelli Dashboard)
POMELLI_API_KEY=your_api_key_here
POMELLI_API_SECRET=your_api_secret_here

# Webhook URL (Opcional - para notificaciones de Pomelli)
POMELLI_WEBHOOK_URL=https://inmova.app/api/pomelli/webhook

# App URL (Requerido para OAuth callbacks)
NEXT_PUBLIC_URL=https://inmova.app
```

---

## Cómo Obtener Credenciales de Pomelli

1. **Registrarse en Pomelli:**
   - Ir a: https://pomelli.com/signup
   - Crear cuenta de empresa

2. **Acceder al Dashboard:**
   - Login en: https://app.pomelli.com
   - Ir a: Settings → API Credentials

3. **Generar API Keys:**
   - Click en "Generate New API Key"
   - Copiar `API Key` y `API Secret`
   - **IMPORTANTE:** Guardar `API Secret` de forma segura (solo se muestra una vez)

4. **Configurar Webhooks (Opcional):**
   - En Settings → Webhooks
   - Agregar URL: `https://inmova.app/api/pomelli/webhook`
   - Seleccionar eventos a recibir

---

## Configurar en Vercel

### Método 1: Vercel Dashboard

1. Ir a: https://vercel.com/[tu-proyecto]/settings/environment-variables
2. Agregar variables una por una:
   - Name: `POMELLI_API_KEY`
   - Value: (tu API key)
   - Environments: Production, Preview, Development
3. Click "Save"
4. Repetir para todas las variables
5. Redeploy el proyecto

### Método 2: Vercel CLI

```bash
vercel env add POMELLI_API_KEY
vercel env add POMELLI_API_SECRET
vercel env add POMELLI_WEBHOOK_URL
```

---

## Verificar Configuración

```bash
# En desarrollo local:
echo $POMELLI_API_KEY

# En producción (Vercel):
# Ir a Dashboard → Settings → Environment Variables
# Verificar que todas las variables están configuradas
```

---

## Seguridad

- ❌ **NUNCA** commitear `.env` al repositorio
- ✅ Agregar `.env` a `.gitignore`
- ✅ Usar diferentes keys para development y production
- ✅ Rotar API keys periódicamente
- ✅ Encriptar `API_SECRET` en base de datos

---

## Testing

Después de configurar las variables, verificar:

```bash
# Test 1: Variables cargadas
node -e "console.log('POMELLI_API_KEY:', !!process.env.POMELLI_API_KEY)"

# Test 2: Conexión a API
curl -X GET https://inmova.app/api/pomelli/config
# Debe devolver: { configured: true } o { configured: false }
```

---

## Troubleshooting

### Error: "Pomelli not configured"

**Causa:** Variables no están cargadas

**Solución:**
1. Verificar que variables están en `.env`
2. Reiniciar servidor de desarrollo
3. En producción, verificar Vercel Dashboard
4. Redeploy si es necesario

### Error: "Invalid credentials"

**Causa:** API Key o Secret incorrectos

**Solución:**
1. Verificar credenciales en Pomelli Dashboard
2. Generar nuevas credenciales si es necesario
3. Actualizar variables de entorno
4. Redeploy

---

## Variables Opcionales

```env
# Rate Limiting
POMELLI_MAX_REQUESTS_PER_MINUTE=60

# Retry Configuration
POMELLI_MAX_RETRIES=3
POMELLI_RETRY_DELAY_MS=5000

# Cache Duration (seconds)
POMELLI_CACHE_TTL=300
```

---

¡Listo para gestionar tus redes sociales! 🚀
