# Instrucciones de Configuración para Vercel

## Problema Resuelto
El error "No Next.js version detected" ocurría porque Vercel buscaba el `package.json` en el directorio raíz, pero el proyecto Next.js está en `nextjs_space/`.

## Solución Aplicada

### 1. Archivo vercel.json actualizado
Se ha actualizado el archivo `vercel.json` en la raíz del proyecto para que apunte correctamente al subdirectorio `nextjs_space`.

### 2. Configuración en Vercel Dashboard

Debes configurar el **Root Directory** en Vercel:

1. Ve a https://vercel.com/dashboard
2. Selecciona tu proyecto
3. Ve a **Settings** → **General**
4. En **Build & Development Settings**, busca **Root Directory**
5. Establece el valor a: `nextjs_space`
6. Haz clic en **Save**
7. Ve a **Deployments** y haz **Redeploy**

### 3. Variables de Entorno

Asegúrate de que todas las variables de entorno del archivo `.env` estén configuradas en Vercel:

1. Ve a **Settings** → **Environment Variables**
2. Añade todas las variables necesarias:
   - `DATABASE_URL`
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL`
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`
   - `AWS_REGION`
   - `AWS_BUCKET_NAME`
   - `AWS_FOLDER_PREFIX`
   - Cualquier otra variable de tu archivo `.env`

### 4. Comandos de Build

Vercel debería detectar automáticamente estos comandos desde `vercel.json`:
- **Build Command**: `cd nextjs_space && yarn build`
- **Install Command**: `cd nextjs_space && yarn install`
- **Output Directory**: `nextjs_space/.next`

## Verificación

Después de aplicar estos cambios:

1. Haz commit y push de los cambios:
   ```bash
   git add vercel.json VERCEL_SETUP_INSTRUCTIONS.md
   git commit -m "Fix: Configure Vercel for nextjs_space subdirectory"
   git push
   ```

2. En Vercel, ve a **Deployments** y espera a que se complete el deployment automático, o haz clic en **Redeploy** para forzar un nuevo deployment.

3. Revisa los logs en la sección **Deployments** de Vercel para confirmar que el build se completó correctamente.

## Deployment con Abacus.AI (Alternativa)

Si prefieres usar el sistema de deployment de Abacus.AI en lugar de Vercel, el proyecto ya está configurado para usar **inmova.app** como hostname. No necesitas configurar nada adicional en Vercel.

## Solución de Problemas

### Si el error persiste:

1. **Verifica el Root Directory**: Asegúrate de que esté configurado exactamente como `nextjs_space` (sin `/` al inicio o al final)

2. **Limpia el cache de Vercel**: En Deployment settings, busca la opción para limpiar el cache

3. **Verifica las variables de entorno**: Asegúrate de que todas las variables necesarias estén configuradas

4. **Revisa los logs**: Los logs de deployment en Vercel te darán información específica sobre cualquier error

### Si necesitas ayuda adicional:

Contacta al equipo de soporte de Vercel o revisa la documentación oficial: https://vercel.com/docs
