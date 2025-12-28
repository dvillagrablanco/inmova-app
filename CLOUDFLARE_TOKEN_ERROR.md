# ⚠️ Error con Token de Cloudflare

## Problema Detectado

El token proporcionado no es válido según la API de Cloudflare:

```
Token: PGh6Ywsssqa0SW5RJ1cY_QfoxnZByinhcsd3ICvN
Error: Invalid API Token (Code 1000)
```

## Posibles Causas

### 1. Error al Copiar el Token
- Verifica que copiaste el token completo
- Asegúrate de no incluir espacios al inicio/final
- El token debe tener exactamente el formato que Cloudflare te mostró

### 2. Permisos Insuficientes
El token necesita los siguientes permisos mínimos:
- ✅ **Zone.DNS** - Edit (para gestionar DNS)
- ✅ **Zone.Zone Settings** - Edit (para configurar la zona)
- ✅ **Zone.Zone** - Read (para leer información de la zona)

### 3. Dominio No Agregado a Cloudflare
Es posible que `inmovaapp.com` aún no esté agregado a tu cuenta de Cloudflare.

## Solución: Crear Token Correcto

### Paso 1: Verificar/Agregar Dominio

1. **Ir a Cloudflare Dashboard**: https://dash.cloudflare.com
2. **Verificar si el dominio existe**:
   - Si ves `inmovaapp.com` en la lista → El dominio está agregado ✅
   - Si NO lo ves → Debes agregarlo primero

### Paso 2: Agregar Dominio (si no existe)

1. Click en **"Add a Site"**
2. Ingresa: `inmovaapp.com`
3. Selecciona el plan (Free está bien)
4. Cloudflare escaneará tus DNS records
5. **Cambiar Nameservers** en tu registrador de dominios:
   - Cloudflare te dará 2 nameservers, algo como:
     ```
     ns1.cloudflare.com
     ns2.cloudflare.com
     ```
   - Ve al panel de tu registrador (GoDaddy, Namecheap, etc.)
   - Cambia los nameservers a los de Cloudflare
   - Espera 24-48 horas (usualmente es más rápido)

### Paso 3: Crear Nuevo API Token

1. **Ir a**: https://dash.cloudflare.com/profile/api-tokens
2. Click en **"Create Token"**
3. Selecciona **"Edit zone DNS"** como template
4. **Configurar permisos**:
   ```
   Zone - DNS - Edit
   Zone - Zone Settings - Edit
   Zone - Zone - Read
   ```
5. **Zone Resources**:
   - Include → Specific zone → inmovaapp.com
6. Click en **"Continue to summary"**
7. Click en **"Create Token"**
8. **COPIAR EL TOKEN** (solo se muestra una vez)

### Paso 4: Usar el Nuevo Token

Una vez que tengas el token correcto:

```bash
# Actualizar .env.cloudflare con el nuevo token
nano .env.cloudflare

# Luego ejecutar:
npm run cloudflare:verify
```

## Verificación Rápida

Puedes verificar el token manualmente con:

```bash
curl -X GET "https://api.cloudflare.com/client/v4/user/tokens/verify" \
  -H "Authorization: Bearer TU_TOKEN_AQUI" \
  -H "Content-Type: application/json"
```

Debe retornar:
```json
{
  "success": true,
  "result": {
    "id": "...",
    "status": "active"
  }
}
```

## Alternativa: Configuración Manual

Si prefieres configurar manualmente sin API Token:

### 1. Configurar DNS en Cloudflare Dashboard

**Registros necesarios:**

```
Type    Name    Content                 Proxy
A       @       TU_IP_DEL_SERVIDOR     ✅ Proxied
CNAME   www     inmovaapp.com          ✅ Proxied
CNAME   cdn     inmovaapp.com          ✅ Proxied
```

### 2. Configurar SSL/TLS

- Dashboard → SSL/TLS
- SSL/TLS encryption mode: **Full (strict)**

### 3. Configurar Page Rules

**Rule 1 - Cache Assets**:
```
URL: cdn.inmovaapp.com/*
Settings: Cache Level: Cache Everything
```

## ¿Dónde Está Desplegada la App Actualmente?

Para ayudarte mejor, necesito saber dónde está corriendo tu app:

```bash
# Ver si hay configuración de Railway
cat .env.railway 2>/dev/null

# Ver si hay configuración de Vercel
cat .vercel/project.json 2>/dev/null

# Ver configuración actual
env | grep -E "(URL|HOST|PORT)"
```

## Próximos Pasos

1. ✅ Verifica que el dominio está en Cloudflare
2. ✅ Crea un nuevo API Token con los permisos correctos
3. ✅ Actualiza `.env.cloudflare` con el nuevo token
4. ✅ Ejecuta `npm run cloudflare:verify`
5. ✅ Continúa con la configuración DNS

## Necesito de Ti

Por favor proporciona:

1. **El nuevo token de API** (después de crearlo en Cloudflare)
2. **La IP o URL** donde está desplegada tu app actualmente
3. **Confirma** si el dominio `inmovaapp.com` ya está agregado en Cloudflare

Con esta información podré:
- ✅ Configurar los DNS records correctamente
- ✅ Configurar SSL/TLS
- ✅ Hacer la verificación visual con Playwright
- ✅ Asegurar que todo funcione perfectamente
