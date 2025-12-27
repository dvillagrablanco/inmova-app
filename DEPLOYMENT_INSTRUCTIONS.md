# 🚀 Instrucciones de Despliegue en Vercel - INMOVA

## Requisitos Previos
- ✅ Vercel CLI instalado (ya completado)
- ✅ Configuración de vercel.json (ya existe)
- ✅ Proyecto Next.js configurado

## Pasos para Desplegar

### 1. Autenticarse en Vercel
```bash
cd /workspace
vercel login
```

Esto abrirá tu navegador para autenticarte. Usa el email: `dvillagra@vidaroinversiones.com`

**User ID**: `pAzq4g0vFjJlrK87sQhlw08I`

### 2. Desplegar en Preview (Ambiente de prueba)
```bash
vercel
```

Este comando:
- Te hará algunas preguntas sobre el proyecto
- Creará un deployment de preview
- Te dará una URL para probar (ej: `https://tu-proyecto-xxxxx.vercel.app`)

### 3. Configurar Variables de Entorno

Una vez desplegado, ve al dashboard de Vercel y configura estas variables CRÍTICAS:

#### Variables Obligatorias:
```env
# Base de Datos
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE

# NextAuth (Seguridad)
NEXTAUTH_SECRET=<generar con: openssl rand -base64 32>
NEXTAUTH_URL=https://tu-proyecto.vercel.app

# AWS S3 (Almacenamiento)
AWS_REGION=<tu-region>
AWS_BUCKET_NAME=<tu-bucket>
AWS_FOLDER_PREFIX=<tu-prefix>

# Stripe (Pagos)
STRIPE_SECRET_KEY=sk_live_<tu-clave>
STRIPE_PUBLISHABLE_KEY=pk_live_<tu-clave>
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_<tu-clave>

# Abacus AI
ABACUSAI_API_KEY=<tu-api-key>

# Seguridad
ENCRYPTION_KEY=<generar con: openssl rand -hex 32>
CRON_SECRET=<generar con: openssl rand -hex 32>
```

Para configurar las variables:
1. Ve a tu proyecto en https://vercel.com
2. Settings → Environment Variables
3. Añade cada variable
4. Marca "Production", "Preview" y "Development" según necesites

### 4. Re-desplegar con Variables
```bash
vercel --prod
```

Este comando desplegará a producción con todas las variables configuradas.

### 5. Configurar Dominio Personalizado (Opcional)

En el dashboard de Vercel:
1. Ve a Settings → Domains
2. Añade: `inmova.app` y `www.inmova.app`
3. Configura DNS:
   ```
   A     @     76.76.21.21
   CNAME www   cname.vercel-dns.com
   ```
4. Actualiza `NEXTAUTH_URL` a `https://inmova.app`
5. Re-despliega: `vercel --prod`

## Verificación Post-Despliegue

- [ ] La página principal carga correctamente
- [ ] El login funciona
- [ ] El dashboard muestra datos
- [ ] Las imágenes cargan desde S3
- [ ] No hay errores en la consola del navegador
- [ ] Los APIs responden correctamente

## Comandos Útiles

### Ver logs en tiempo real
```bash
vercel logs https://tu-proyecto.vercel.app
```

### Ver lista de deployments
```bash
vercel list
```

### Eliminar un deployment
```bash
vercel remove <deployment-url>
```

### Ver información del proyecto
```bash
vercel inspect <deployment-url>
```

## Alternativa: GitHub Integration (Recomendado)

Para deployments automáticos en cada push:

1. Sube el código a GitHub
2. Ve a https://vercel.com/new
3. Importa el repositorio
4. Vercel detectará automáticamente Next.js
5. Configura las variables de entorno
6. Haz clic en "Deploy"

Cada push a `main` desplegará automáticamente a producción.

## Configuración de Build en Vercel

Si usas el dashboard, asegúrate de configurar:
- **Framework Preset**: Next.js
- **Build Command**: `yarn build` (ya configurado en vercel.json)
- **Output Directory**: `.next` (ya configurado)
- **Install Command**: `yarn install` (ya configurado)
- **Node Version**: 18.x

## Solución de Problemas

### Error: "Cannot find module 'prisma'"
Solución: Asegúrate de que el postinstall script esté en package.json:
```json
"postinstall": "prisma generate"
```
✅ Ya configurado en tu proyecto

### Error: "Out of memory"
Solución: En Vercel dashboard, aumenta:
- Settings → General → Function Memory → 3008 MB
- Settings → General → Function Duration → 60s

### Error: "Database connection failed"
Solución: Verifica que `DATABASE_URL` sea accesible desde internet (no localhost)

### Build falla por errores de TypeScript
El proyecto ya tiene configurado el build para ignorar errores menores, pero si persisten:
1. Revisa los errores en los logs
2. Corrige los críticos
3. O temporalmente en `next.config.js` añade:
   ```js
   typescript: {
     ignoreBuildErrors: true
   }
   ```

## Contacto de Soporte

- **Vercel Support**: https://vercel.com/support
- **Documentación**: https://vercel.com/docs
- **Status**: https://vercel-status.com

---

**Notas Importantes:**
- El primer deployment puede tardar 5-10 minutos
- Las funciones serverless tienen un timeout de 60 segundos (configurado)
- Los cron jobs requieren plan Pro o superior
- El proyecto usa Next.js 14 con App Router

**Proyecto configurado por**: Cursor AI Agent  
**Fecha**: Diciembre 2024
