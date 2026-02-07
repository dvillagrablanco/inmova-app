# 🚀 Guía de Configuración de Vercel para INMOVA

> **Estado actual**: La aplicación está desplegada en `inmova.app`
> 
> Esta guía te ayudará a configurar correctamente Vercel para continuar desarrollando y desplegando INMOVA.

---

## 📋 Inicio Rápido (5 minutos)

```bash
# 1. Instalar Vercel CLI
npm install -g vercel

# 2. Verificar variables de entorno
./scripts/check-env.sh

# 3. Login en Vercel
vercel login

# 4. Vincular proyecto
vercel link

# 5. Deploy
vercel --prod
```

---

# Guía de Configuración de Vercel para INMOVA

## 1. Pre-requisitos

- Cuenta en Vercel (https://vercel.com)
- Repositorio Git (GitHub, GitLab o Bitbucket)
- Base de datos PostgreSQL en producción

## 2. Conectar el Repositorio a Vercel

### Opción A: Desde la UI de Vercel

1. Inicia sesión en https://vercel.com
2. Click en "Add New..." → "Project"
3. Importa tu repositorio Git
4. Selecciona la rama principal (main/master)

### Opción B: Desde CLI de Vercel

```bash
# Instalar Vercel CLI
npm i -g vercel

# Desde el directorio del proyecto
cd /home/ubuntu/homming_vidaro

# Iniciar sesión
vercel login

# Vincular o crear proyecto
vercel link
```

## 3. Configurar Variables de Entorno

### Variables Requeridas en Vercel:

#### Autenticación:
```bash
NEXTAUTH_SECRET=<tu-secret-generado>
NEXTAUTH_URL=https://inmova.app
```

#### Base de Datos:
```bash
DATABASE_URL=<tu-conexion-postgresql-produccion>
```

#### AWS S3:
```bash
AWS_PROFILE=<tu-perfil>
AWS_REGION=<tu-region>
AWS_BUCKET_NAME=<tu-bucket>
AWS_FOLDER_PREFIX=<tu-prefijo>
```

#### Stripe (si aplica):
```bash
STRIPE_SECRET_KEY=<tu-key>
STRIPE_PUBLISHABLE_KEY=<tu-key>
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=<tu-key>
STRIPE_WEBHOOK_SECRET=<tu-secret>
```

#### SendGrid:
```bash
SENDGRID_API_KEY=<tu-key>
SENDGRID_FROM_EMAIL=<tu-email>
```

#### Abacus AI:
```bash
ABACUSAI_API_KEY=<tu-key>
```

#### Push Notifications:
```bash
NEXT_PUBLIC_VAPID_PUBLIC_KEY=<tu-key>
VAPID_PRIVATE_KEY=<tu-key>
```

#### Otros:
```bash
NODE_ENV=production
NEXT_PUBLIC_BASE_URL=https://inmova.app
NEXT_PUBLIC_VIDEO_URL=<tu-video-url>
```

### Cómo agregar variables en Vercel:

#### Desde la UI:
1. Ve a tu proyecto en Vercel
2. Settings → Environment Variables
3. Agrega cada variable con su valor
4. Selecciona los entornos: Production, Preview, Development

#### Desde CLI:
```bash
# Agregar variable para producción
vercel env add DATABASE_URL production

# Agregar variable para todos los entornos
vercel env add NEXTAUTH_SECRET
```

## 4. Configurar el Dominio Personalizado

### En Vercel:
1. Ve a Settings → Domains
2. Agrega tu dominio: `inmova.app`
3. Configura también: `www.inmova.app`

### En tu Proveedor de DNS:
Agrega los registros DNS que Vercel te indique:

```
Tipo: A
Nombre: @
Valor: 76.76.21.21

Tipo: CNAME
Nombre: www
Valor: cname.vercel-dns.com
```

## 5. Configurar Build Settings

### En Vercel Dashboard:
1. Settings → General
2. Build & Development Settings:
   - **Framework Preset**: Next.js
   - **Root Directory**: `nextjs_space`
   - **Build Command**: `yarn build`
   - **Output Directory**: `.next`
   - **Install Command**: `yarn install`

### Comandos de Build Personalizados:

Si necesitas ejecutar Prisma migrations:

```bash
# En "Build Command":
yarn prisma generate && yarn prisma migrate deploy && yarn build
```

## 6. Configurar Base de Datos para Producción

### Opciones Recomendadas:

#### Opción A: Vercel Postgres (Recomendado)
```bash
# Instalar addon de Vercel
vercel postgres create

# La DATABASE_URL se agregará automáticamente
```

#### Opción B: Supabase
1. Crea un proyecto en https://supabase.com
2. Copia la Connection String
3. Agrégala como `DATABASE_URL` en Vercel

#### Opción C: Neon
1. Crea un proyecto en https://neon.tech
2. Copia la Connection String
3. Agrégala como `DATABASE_URL` en Vercel

## 7. Ejecutar Migraciones de Base de Datos

### Antes del primer deploy:

```bash
# Desde tu máquina local con DATABASE_URL de producción
cd nextjs_space
DATABASE_URL="tu-url-produccion" yarn prisma migrate deploy
DATABASE_URL="tu-url-produccion" yarn prisma db seed
```

### O configurar en Build Command de Vercel:
```bash
yarn prisma migrate deploy && yarn build
```

## 8. Desplegar

### Deploy Manual:
```bash
# Desde el directorio del proyecto
vercel --prod
```

### Deploy Automático:
- Cada push a la rama principal desplegará automáticamente
- Los PRs crearán Preview Deployments

## 9. Verificar el Deployment

### Checklist Post-Deployment:

- [ ] La aplicación carga correctamente
- [ ] El login funciona
- [ ] La base de datos está conectada
- [ ] Las imágenes se cargan desde S3
- [ ] Los pagos con Stripe funcionan (si aplica)
- [ ] Los emails se envían correctamente
- [ ] El dominio personalizado funciona
- [ ] HTTPS está activo
- [ ] Las variables de entorno están configuradas

## 10. Monitoreo y Logs

### Ver logs en tiempo real:
```bash
vercel logs <deployment-url> --follow
```

### En Vercel Dashboard:
- Deployments → Ver logs de cada deployment
- Analytics → Ver métricas de uso
- Speed Insights → Rendimiento

## 11. Troubleshooting

### Error: "NEXTAUTH_URL is not defined"
```bash
vercel env add NEXTAUTH_URL production
# Valor: https://inmova.app
```

### Error: "DATABASE_URL is not defined"
```bash
vercel env add DATABASE_URL production
# Valor: tu connection string de PostgreSQL
```

### Error en Build de Prisma:
```bash
# Asegúrate de que el Build Command incluya:
yarn prisma generate && yarn build
```

### Preview Deployments no funcionan:
1. Ve a Settings → Git
2. Asegúrate de que "Automatic Deployments" esté activo
3. Configura las ramas que quieres desplegar

## 12. Comandos Útiles de Vercel CLI

```bash
# Ver todos los proyectos
vercel list

# Ver deployments de un proyecto
vercel ls

# Ver variables de entorno
vercel env ls

# Pull variables de entorno localmente
vercel env pull

# Promote un deployment a producción
vercel promote <deployment-url>

# Rollback a un deployment anterior
vercel rollback

# Ver aliases del proyecto
vercel alias ls
```

## 13. Mejores Prácticas

### Seguridad:
- ✅ Nunca commiteear el archivo `.env`
- ✅ Usar secrets de Vercel para datos sensibles
- ✅ Habilitar "Vercel Authentication" si es necesario
- ✅ Configurar CSP headers en `next.config.js`

### Performance:
- ✅ Habilitar ISR (Incremental Static Regeneration)
- ✅ Usar Image Optimization de Next.js
- ✅ Configurar caché headers apropiados
- ✅ Minimizar el bundle size

### Desarrollo:
- ✅ Usar Preview Deployments para testing
- ✅ Configurar diferentes variables para Preview y Production
- ✅ Usar `vercel dev` para desarrollo local

## 14. Integración Continua

### GitHub Actions (Opcional):

Crea `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Vercel

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

## 15. Soporte

### Documentación Oficial:
- https://vercel.com/docs
- https://nextjs.org/docs/deployment

### Comunidad:
- Discord de Vercel
- GitHub Discussions

---

## Checklist Rápido de Setup:

```
□ 1. Crear cuenta en Vercel
□ 2. Conectar repositorio Git
□ 3. Configurar variables de entorno
□ 4. Configurar base de datos de producción
□ 5. Ejecutar migraciones de Prisma
□ 6. Configurar dominio personalizado
□ 7. Hacer primer deploy
□ 8. Verificar que todo funciona
□ 9. Configurar monitoreo
□ 10. Documentar el proceso
```
