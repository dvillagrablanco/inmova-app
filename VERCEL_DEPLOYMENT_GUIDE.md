# Guía de Deployment Automático en Vercel para INMOVA

## 📋 Resumen

Esta guía te ayudará a configurar el deployment automático de INMOVA en Vercel usando GitHub Actions.

## 🚀 Paso 1: Obtener las Credenciales de Vercel

### 1.1 Token de Vercel

1. Ve a [Vercel Dashboard](https://vercel.com/account/tokens)
2. Inicia sesión con:
   - Email: `dvillagra@vidaroinversiones.com`
   - Contraseña: `Pucela00`
3. Haz clic en "Create Token"
4. Dale un nombre descriptivo: `GitHub Actions INMOVA`
5. Selecciona el scope: `Full Account`
6. Copia el token generado (lo necesitarás en el Paso 2)

### 1.2 Organization ID y Project ID

#### Opción A: Proyecto Existente

Si ya tienes un proyecto en Vercel:

1. Ve a [Vercel Dashboard](https://vercel.com/dashboard)
2. Selecciona tu proyecto "INMOVA" o "homming-vidaro"
3. Ve a Settings → General
4. Copia:
   - **Project ID**: Se encuentra en la sección "Project ID"
   - **Organization ID**: Ejecuta este comando en tu terminal local:
     ```bash
     vercel teams ls
     ```

#### Opción B: Crear Nuevo Proyecto

Si necesitas crear un nuevo proyecto:

1. Ve a [Vercel Dashboard](https://vercel.com/new)
2. Conecta tu repositorio de GitHub: `dvillagrab/inmova-app`
3. Configura el proyecto:
   - **Framework Preset**: Next.js
   - **Root Directory**: `nextjs_space`
   - **Build Command**: `yarn build`
   - **Output Directory**: `.next`
   - **Install Command**: `yarn install`

4. **NO HAGAS DEPLOY TODAVÍA**, solo guarda el proyecto
5. Una vez creado, ve a Settings → General y copia:
   - **Project ID**
   - **Organization ID** (ejecuta `vercel teams ls` en terminal)

## 🔐 Paso 2: Configurar Secrets en GitHub

1. Ve a tu repositorio: https://github.com/dvillagrab/inmova-app
2. Ve a Settings → Secrets and variables → Actions
3. Haz clic en "New repository secret" y añade estos 3 secrets:

   **Secret 1: VERCEL_TOKEN**
   - Name: `VERCEL_TOKEN`
   - Value: El token que copiaste en el Paso 1.1

   **Secret 2: VERCEL_ORG_ID**
   - Name: `VERCEL_ORG_ID`
   - Value: El Organization ID del Paso 1.2

   **Secret 3: VERCEL_PROJECT_ID**
   - Name: `VERCEL_PROJECT_ID`
   - Value: El Project ID del Paso 1.2

## 📦 Paso 3: Configurar Variables de Entorno en Vercel

Ve a tu proyecto en Vercel → Settings → Environment Variables y añade:

### Variables Requeridas:

```env
DATABASE_URL=postgresql://role_587683780:5kWw7vKJBDp9ZA2Jfkt5BdWrAjR0XDe5@db-587683780.db003.hosteddb.reai.io:5432/587683780?connect_timeout=15

NEXTAUTH_SECRET=wJqizZO73C6pU4tjLTNwzjeoGLaMWvr9

NEXTAUTH_URL=https://inmova.app

AWS_PROFILE=default
AWS_REGION=us-east-1
AWS_BUCKET_NAME=abacus-test-file-hosting
AWS_FOLDER_PREFIX=homming_vidaro/

STRIPE_SECRET_KEY=(obtener de tu cuenta de Stripe)
STRIPE_PUBLISHABLE_KEY=(obtener de tu cuenta de Stripe)
STRIPE_WEBHOOK_SECRET=(obtener de tu cuenta de Stripe)

ABACUSAI_API_KEY=(si aplica)

CRON_SECRET=(generar un secreto aleatorio)
ENCRYPTION_KEY=(generar un secreto aleatorio)
```

**Importante**: Marca todas las variables como disponibles para "Production", "Preview", y "Development" según necesites.

## 🎯 Paso 4: Configurar Custom Domain (Opcional)

Si quieres usar el dominio `inmova.app`:

1. Ve a tu proyecto en Vercel → Settings → Domains
2. Añade el dominio: `inmova.app` y `www.inmova.app`
3. Sigue las instrucciones de Vercel para configurar los DNS records en tu proveedor de dominio

## 🚀 Paso 5: Hacer el Primer Deploy

### Opción A: Desde GitHub (Automático)

1. Haz commit y push de tus cambios:
   ```bash
   git add .
   git commit -m "chore: setup Vercel deployment workflow"
   git push origin main
   ```

2. Ve a tu repositorio → Actions
3. Verás el workflow "Deploy to Vercel" ejecutándose
4. Espera a que termine (tarda unos 5-10 minutos)
5. ¡Tu aplicación estará desplegada! 🎉

### Opción B: Deploy Manual desde tu Máquina

Si quieres hacer un deploy manual primero:

```bash
cd /home/ubuntu/homming_vidaro/nextjs_space

# Login (solo la primera vez)
npx vercel login

# Link al proyecto
npx vercel link

# Deploy a producción
npx vercel --prod
```

## 🔄 Deployment Automático

Una vez configurado todo:

✅ Cada push a `main` o `master` desplegará automáticamente a producción
✅ También puedes hacer deploy manual desde GitHub Actions → Run workflow
✅ Los deployments fallidos no afectarán a tu aplicación en producción

## 📊 Monitoreo

- **Vercel Dashboard**: https://vercel.com/dashboard
- **GitHub Actions**: https://github.com/dvillagrab/inmova-app/actions
- **Logs de Deployment**: Disponibles en ambas plataformas

## ⚠️ Troubleshooting

### Error: "Project not found"

- Verifica que `VERCEL_PROJECT_ID` sea correcto
- Verifica que el token tenga permisos suficientes

### Error: "Invalid token"

- Genera un nuevo token en Vercel
- Actualiza el secret `VERCEL_TOKEN` en GitHub

### Error de Build

- Revisa los logs en GitHub Actions
- Verifica que todas las variables de entorno estén configuradas en Vercel
- Asegúrate de que el proyecto compile localmente primero

### Error de Database Connection

- Verifica que `DATABASE_URL` esté configurada correctamente en Vercel
- Asegúrate de que la base de datos permita conexiones desde las IPs de Vercel

## 🆘 Soporte

Si necesitas ayuda:

1. Revisa los logs en GitHub Actions
2. Revisa los logs en Vercel Dashboard
3. Consulta la [documentación oficial de Vercel](https://vercel.com/docs)
4. Abre un issue en el repositorio de GitHub

## 📝 Notas Importantes

- El primer deployment puede tardar más tiempo (10-15 minutos)
- Los siguientes deployments serán más rápidos (3-5 minutos)
- Vercel generará automáticamente previews para pull requests
- Cada preview tendrá su propia URL única
- Los deployments a producción solo ocurren en `main` o `master`

## ✅ Checklist Final

- [ ] Token de Vercel obtenido y configurado en GitHub Secrets
- [ ] Organization ID configurado en GitHub Secrets
- [ ] Project ID configurado en GitHub Secrets
- [ ] Variables de entorno configuradas en Vercel
- [ ] Custom domain configurado (opcional)
- [ ] Primer deployment exitoso
- [ ] GitHub Actions workflow funcionando

---

**¡Tu aplicación INMOVA ahora se despliega automáticamente en Vercel!** 🎉
