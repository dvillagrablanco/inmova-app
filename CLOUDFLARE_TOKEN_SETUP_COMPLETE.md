# ✅ Configuración de Token Cloudflare Completada

## 📋 Resumen

Se ha configurado exitosamente el token de API de Cloudflare para el dominio **inmovaapp.com**.

**Fecha**: 28 de diciembre de 2025  
**Token**: Guardado de forma segura en `.env.cloudflare`

---

## 🗂️ Archivos Creados/Modificados

### Archivos Creados:

1. **`.env.cloudflare`** - Configuración del token de Cloudflare (⚠️ NO subir a Git)
2. **`CLOUDFLARE_SETUP.md`** - Documentación completa de configuración
3. **`scripts/cloudflare-purge-cache.ts`** - Script para purgar caché del CDN
4. **`scripts/cloudflare-verify.ts`** - Script para verificar configuración

### Archivos Modificados:

1. **`.env.example`** - Agregadas variables de Cloudflare
2. **`.env.production.template`** - Agregadas variables de Cloudflare
3. **`RAILWAY_ENV_TEMPLATE.txt`** - Agregadas variables de Cloudflare
4. **`.gitignore`** - Protección de archivos `.env` con tokens
5. **`package.json`** - Agregados scripts npm para Cloudflare

---

## 🔑 Variables de Entorno Configuradas

El archivo `.env.cloudflare` contiene:

```bash
CLOUDFLARE_API_TOKEN=PGh6Ywsssqa0SW5RJ1cY_QfoxnZByinhcsd3ICvN
CLOUDFLARE_ZONE_ID=<pendiente>
CLOUDFLARE_ACCOUNT_ID=<pendiente>
NEXT_PUBLIC_CDN_URL=https://cdn.inmovaapp.com
```

---

## ⏭️ Próximos Pasos

### 1. Completar Configuración (Obligatorio)

Necesitas obtener dos IDs adicionales desde el Dashboard de Cloudflare:

#### a) Obtener Zone ID:
```bash
# 1. Ir a https://dash.cloudflare.com
# 2. Seleccionar dominio: inmovaapp.com
# 3. En Overview > API section > copiar "Zone ID"
```

#### b) Obtener Account ID:
```bash
# 1. En el dashboard de Cloudflare
# 2. Click en tu nombre de cuenta (esquina superior izquierda)
# 3. Copiar "Account ID" de la URL o sección API
```

#### c) Actualizar .env.cloudflare:
```bash
nano .env.cloudflare
# Pegar los IDs obtenidos
```

### 2. Verificar Configuración

Una vez que tengas los IDs configurados:

```bash
# Verificar que todo esté correctamente configurado
npm run cloudflare:verify
```

Este script verificará:
- ✅ Variables de entorno
- ✅ Conectividad con API de Cloudflare
- ✅ Información de la zona
- ✅ Registros DNS
- ✅ Estado del CDN

### 3. Configurar Subdomain CDN (Recomendado)

En el Dashboard de Cloudflare > DNS:

```
Type: CNAME
Name: cdn
Target: inmovaapp.com
Proxy status: ✅ Proxied (naranja)
```

Esto creará: `cdn.inmovaapp.com`

### 4. Configurar Page Rules (Opcional)

Para optimizar el CDN, crea estas Page Rules en Cloudflare:

**Rule 1 - Cache Assets del CDN:**
```
URL: cdn.inmovaapp.com/*
Settings:
  - Cache Level: Cache Everything
  - Edge Cache TTL: 1 month
  - Browser Cache TTL: 1 year
```

**Rule 2 - Cache Imágenes:**
```
URL: *.inmovaapp.com/*.{jpg,jpeg,png,gif,webp,svg,ico}
Settings:
  - Cache Level: Cache Everything
  - Edge Cache TTL: 1 week
```

---

## 🚀 Comandos Disponibles

### Verificar Configuración:
```bash
npm run cloudflare:verify
```

### Purgar Caché Completa:
```bash
npm run cloudflare:purge:all
```

### Purgar Archivos Específicos:
```bash
npm run cloudflare:purge files https://cdn.inmovaapp.com/logo.png
```

### Ver Ayuda:
```bash
npm run cloudflare:purge help
```

---

## 📚 Documentación

Para más detalles, consulta:
- **`CLOUDFLARE_SETUP.md`** - Guía completa de configuración
- [Documentación oficial de Cloudflare API](https://developers.cloudflare.com/api/)
- [Guía de Cloudflare R2](https://developers.cloudflare.com/r2/)

---

## 🔒 Seguridad

### ⚠️ IMPORTANTE:

1. **NUNCA** subas `.env.cloudflare` al repositorio Git
2. El token tiene acceso completo a tu zona de Cloudflare
3. Si el token se compromete, revócalo inmediatamente en:
   - Cloudflare Dashboard > Profile > API Tokens > Revoke
4. Rota el token cada 6-12 meses por seguridad

### Verificar Protección:

```bash
# Verificar que .env.cloudflare está en .gitignore
git check-ignore .env.cloudflare
# Debe retornar: .env.cloudflare
```

---

## 💡 Tips de Uso

### Development (Local)
```bash
# No uses CDN en desarrollo local
NEXT_PUBLIC_CDN_URL=
```

### Staging
```bash
# Usa un subdomain diferente
NEXT_PUBLIC_CDN_URL=https://cdn-staging.inmovaapp.com
```

### Production
```bash
# Usa el subdomain principal
NEXT_PUBLIC_CDN_URL=https://cdn.inmovaapp.com
```

---

## 🎯 Funcionalidades Habilitadas

Con este token puedes:

- ✅ Gestionar DNS programáticamente
- ✅ Purgar caché del CDN
- ✅ Configurar reglas de firewall
- ✅ Usar Cloudflare R2 (alternativa a S3)
- ✅ Desplegar Workers/Pages
- ✅ Automatizar configuraciones en CI/CD

---

## 🆘 Soporte

Si tienes problemas:

1. **Verificar configuración**: `npm run cloudflare:verify`
2. **Revisar logs**: Buscar mensajes de error específicos
3. **Consultar docs**: Ver `CLOUDFLARE_SETUP.md`
4. **Cloudflare Support**: https://support.cloudflare.com

---

## 📝 Notas Adicionales

### Migración a Cloudflare R2 (Opcional)

Si quieres migrar de AWS S3 a Cloudflare R2:

**Ventajas:**
- Sin costos de egreso (ahorro significativo)
- Más económico para alto tráfico
- Compatible con API de S3 (migración fácil)
- Integración nativa con Cloudflare CDN

**Ver**: `CLOUDFLARE_SETUP.md` sección "Cloudflare R2"

### Cache Busting

El proyecto ya incluye soporte para cache busting en `lib/cdn-urls.ts`:

```typescript
import { getCDNUrlWithVersion } from '@/lib/cdn-urls';

// Genera URL con versión automática
const imageUrl = getCDNUrlWithVersion('/images/logo.png');
// Resultado: https://cdn.inmovaapp.com/images/logo.png?v=12345
```

---

## ✨ Estado Actual

- ✅ Token API guardado de forma segura
- ✅ Variables de entorno configuradas en templates
- ✅ Scripts de utilidad creados
- ✅ Documentación completa
- ✅ Protección en .gitignore
- ⏳ Pendiente: Obtener Zone ID y Account ID
- ⏳ Pendiente: Configurar subdomain CDN
- ⏳ Pendiente: Configurar Page Rules

---

**¡Configuración inicial completada! 🎉**

Sigue los "Próximos Pasos" para completar la configuración de Cloudflare.
