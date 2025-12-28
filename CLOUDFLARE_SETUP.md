# Configuración de Cloudflare para inmovaapp.com

## 📋 Token API Creado

- **Fecha de creación**: 28 de diciembre de 2025
- **Dominio**: inmovaapp.com
- **Token**: Configurado en `.env.cloudflare`

## 🔑 Información de Configuración

### 1. Token API

El token API de Cloudflare se ha guardado en el archivo `.env.cloudflare` (este archivo está en `.gitignore` para proteger el token).

```bash
CLOUDFLARE_API_TOKEN=PGh6Ywsssqa0SW5RJ1cY_QfoxnZByinhcsd3ICvN
```

### 2. IDs Necesarios

Para completar la configuración, necesitas obtener los siguientes IDs desde el Dashboard de Cloudflare:

#### Obtener Zone ID:
1. Ir a [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Seleccionar el dominio **inmovaapp.com**
3. En la sección **Overview**, scroll hacia abajo
4. Copiar el **Zone ID** de la columna derecha en "API"

#### Obtener Account ID:
1. En el mismo dashboard de Cloudflare
2. En la esquina superior izquierda, verás el nombre de tu cuenta
3. Click en tu cuenta
4. El **Account ID** aparece en la URL o en la sección de API

### 3. Actualizar .env.cloudflare

Edita el archivo `.env.cloudflare` y completa:

```bash
CLOUDFLARE_ZONE_ID=tu_zone_id_aqui
CLOUDFLARE_ACCOUNT_ID=tu_account_id_aqui
```

## 🚀 Funcionalidades del Token API

El token API de Cloudflare permite:

1. **Gestión de DNS**: Crear, actualizar y eliminar registros DNS programáticamente
2. **Purgar Caché del CDN**: Limpiar caché cuando se actualicen assets
3. **Configuración de Reglas**: Automatizar reglas de firewall, page rules, etc.
4. **Cloudflare R2**: Si decides usar R2 en lugar de AWS S3 para almacenamiento
5. **Workers y Pages**: Desplegar workers y pages desde CI/CD

## 📦 Cloudflare R2 (Alternativa a AWS S3)

Si quieres usar Cloudflare R2 en lugar de AWS S3 para almacenamiento:

### Ventajas de R2:
- Sin costos de egreso (transferencia de datos)
- Más económico que S3 para alto tráfico
- Compatible con API de S3
- Integración directa con Cloudflare CDN

### Configuración de R2:

1. **Crear Bucket en Cloudflare**:
   ```bash
   # Desde Cloudflare Dashboard
   # R2 > Create bucket > nombre: inmova-uploads
   ```

2. **Generar Access Keys**:
   ```bash
   # R2 > Manage R2 API Tokens > Create API Token
   ```

3. **Actualizar variables de entorno**:
   ```bash
   CLOUDFLARE_R2_BUCKET_NAME=inmova-uploads
   CLOUDFLARE_R2_ACCESS_KEY_ID=<tu_access_key>
   CLOUDFLARE_R2_SECRET_ACCESS_KEY=<tu_secret_key>
   CLOUDFLARE_R2_ENDPOINT=https://<account_id>.r2.cloudflarestorage.com
   ```

## 🌐 Configuración del CDN

### 1. Subdomain para CDN

Crea un subdominio para el CDN:

```bash
# En Cloudflare DNS:
# Type: CNAME
# Name: cdn
# Target: inmovaapp.com
# Proxy status: Proxied (naranja)
```

### 2. URL del CDN

```bash
NEXT_PUBLIC_CDN_URL=https://cdn.inmovaapp.com
```

### 3. Configuración de Cache

En Cloudflare Dashboard > Caching:

- **Browser Cache TTL**: 1 year
- **Cache Level**: Standard
- **Always Online**: On

### 4. Page Rules Recomendadas

Crear las siguientes Page Rules para optimizar:

1. **Cache Everything para Assets**:
   ```
   URL: cdn.inmovaapp.com/*
   Settings:
   - Cache Level: Cache Everything
   - Edge Cache TTL: 1 month
   - Browser Cache TTL: 1 year
   ```

2. **Cache Images**:
   ```
   URL: *.inmovaapp.com/*.{jpg,jpeg,png,gif,webp,svg,ico}
   Settings:
   - Cache Level: Cache Everything
   - Edge Cache TTL: 1 week
   ```

## 🔧 Scripts de Utilidad

### Purgar Caché de Cloudflare

Puedes crear un script para purgar la caché cuando despliegues:

```typescript
// scripts/cloudflare-purge-cache.ts
import { execSync } from 'child_process';

const ZONE_ID = process.env.CLOUDFLARE_ZONE_ID;
const API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;

async function purgeCache() {
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/purge_cache`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ purge_everything: true })
    }
  );
  
  const data = await response.json();
  console.log('Cache purged:', data);
}

purgeCache();
```

### Verificar Configuración

```bash
# Verificar que el DNS resuelve a Cloudflare
dig inmovaapp.com

# Verificar headers de Cloudflare
curl -I https://inmovaapp.com | grep cloudflare

# Deberías ver: cf-ray, cf-cache-status, server: cloudflare
```

## 📊 Monitoreo

### Analytics de Cloudflare

Accede a las métricas en:
- Dashboard > Analytics > Traffic
- Requests totales
- Bandwidth ahorrado
- Threats blocked
- Cache hit ratio

### Verificar Cache Hit Ratio

Un buen cache hit ratio debería ser > 80% para assets estáticos.

## 🔒 Seguridad

### Permisos del Token

Verifica que el token tenga solo los permisos necesarios:
- Zone.DNS: Edit
- Zone.Cache Purge: Purge
- Zone.Zone Settings: Edit (opcional)
- Account.Cloudflare R2: Edit (si usas R2)

### Rotación de Tokens

Por seguridad, rota el token cada 6-12 meses:
1. Crear nuevo token en Cloudflare
2. Actualizar `.env.cloudflare`
3. Desplegar con nuevo token
4. Revocar token antiguo

## 📚 Recursos

- [Cloudflare API Docs](https://developers.cloudflare.com/api/)
- [Cloudflare R2 Docs](https://developers.cloudflare.com/r2/)
- [CDN Configuration Guide](https://developers.cloudflare.com/cache/)
- [DNS Records](https://developers.cloudflare.com/dns/)

## 🎯 Próximos Pasos

1. ✅ Token API creado y guardado
2. ⏳ Obtener Zone ID y Account ID
3. ⏳ Configurar subdomain `cdn.inmovaapp.com`
4. ⏳ Configurar Page Rules para cache
5. ⏳ (Opcional) Migrar de AWS S3 a Cloudflare R2
6. ⏳ Crear script de purge cache
7. ⏳ Actualizar pipeline CI/CD para usar Cloudflare

## 💡 Tips

- **Development**: Usa `NEXT_PUBLIC_CDN_URL=` vacío para development local
- **Staging**: Usa un subdomain diferente como `cdn-staging.inmovaapp.com`
- **Production**: Usa `cdn.inmovaapp.com`
- **Cache Busting**: El código en `lib/cdn-urls.ts` ya incluye cache busting con versiones

## ⚠️ Importante

- **NUNCA** subas el archivo `.env.cloudflare` al repositorio
- El token API da acceso completo a tu zona de Cloudflare
- Si el token se compromete, revócalo inmediatamente en Cloudflare Dashboard
- Usa diferentes tokens para diferentes entornos (dev/staging/prod)
