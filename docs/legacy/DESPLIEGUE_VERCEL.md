# Guía de Despliegue en Vercel - INMOVA

## 🚀 Resumen Ejecutivo

Esta guía te ayudará a desplegar el proyecto INMOVA en Vercel de manera exitosa, resolviendo los problemas de memoria de TypeScript.

## ✅ Cambios Realizados

### 1. Optimización de TypeScript

- **`strict: false`**: Desactivado el modo estricto para reducir la carga de verificación
- **`noUnusedLocals: false`**: Desactivadas verificaciones de variables no usadas
- **`noUnusedParameters: false`**: Desactivadas verificaciones de parámetros no usados
- **`skipLibCheck: true`**: Omite verificaciones de tipos en archivos de librerías

### 2. Configuración de Vercel

Se ha creado `vercel.json` con:
- **NODE_OPTIONS**: `--max-old-space-size=8192` (8GB de memoria para build)
- **memory**: 3008 MB para funciones serverless
- **maxDuration**: 60 segundos timeout
- **regions**: Optimizado para `iad1` (US East)

### 3. Variables de Entorno

Se ha configurado:
```bash
NODE_OPTIONS=--max-old-space-size=8192
```

## 💻 Pasos para Desplegar en Vercel

### Opción 1: Despliegue mediante CLI (Recomendado)

#### 1. Instalar Vercel CLI
```bash
npm install -g vercel
# o
yarn global add vercel
```

#### 2. Autenticarse en Vercel
```bash
vercel login
```

#### 3. Navegar al proyecto
```bash
cd /home/ubuntu/homming_vidaro/nextjs_space
```

#### 4. Ejecutar el despliegue
```bash
vercel
```

Sigue las instrucciones:
- Confirma el nombre del proyecto: `inmova` o tu nombre preferido
- Selecciona tu organización/cuenta
- Confirma la configuración

#### 5. Despliegue a Producción
```bash
vercel --prod
```

### Opción 2: Despliegue mediante Dashboard de Vercel

#### 1. Preparar el Repositorio Git

```bash
cd /home/ubuntu/homming_vidaro/nextjs_space
git init
git add .
git commit -m "Initial commit for Vercel deployment"
```

#### 2. Subir a GitHub/GitLab/Bitbucket

```bash
# Crear repositorio en GitHub primero
git remote add origin https://github.com/tu-usuario/inmova.git
git branch -M main
git push -u origin main
```

#### 3. Conectar con Vercel

1. Ve a [https://vercel.com](https://vercel.com)
2. Haz clic en "New Project"
3. Importa tu repositorio de Git
4. Vercel detectará automáticamente Next.js
5. Haz clic en "Deploy"

## ⚙️ Configuración de Variables de Entorno en Vercel

### Variables Esenciales

En el Dashboard de Vercel, ve a **Project Settings > Environment Variables** y agrega:

#### Base de Datos
```
DATABASE_URL=postgresql://usuario:contraseña@host:5432/database
```

#### NextAuth
```
NEXTAUTH_URL=https://tu-dominio.vercel.app
NEXTAUTH_SECRET=tu_secret_seguro_aqui
```

Genera un secret:
```bash
openssl rand -base64 32
```

#### AWS S3 (si aplica)
```
AWS_BUCKET_NAME=tu-bucket
AWS_FOLDER_PREFIX=tu-prefix
AWS_REGION=eu-west-1
```

#### Stripe (si aplica)
```
STRIPE_SECRET_KEY=sk_...
STRIPE_PUBLISHABLE_KEY=pk_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

#### Optimización de Build
```
NODE_OPTIONS=--max-old-space-size=8192
NEXT_TELEMETRY_DISABLED=1
```

### Configuración de Prisma

Si usas Prisma, agrega:

```bash
# En vercel.json, ya está configurado el buildCommand
# Vercel ejecutará automáticamente:
# yarn prisma generate
# yarn build
```

## 🔧 Solución de Problemas

### Error: "JavaScript heap out of memory"

**Solución**: Ya configurado en `vercel.json` y `.env`

Si persiste:
1. Ve a **Project Settings > General**
2. Aumenta el **Function Memory** a 3008 MB (máximo)
3. Aumenta el **Function Duration** a 60s (máximo)

### Error de Build por TypeScript

**Solución**: Ya ajustado en `tsconfig.json`

Si persiste, puedes temporalmente:
```json
// tsconfig.json
"typescript": {
  "ignoreBuildErrors": true
}
```

⚠️ **Advertencia**: Solo para casos extremos, no recomendado para producción.

### Error: "Module not found"

```bash
# Limpia la cache y reinstala
rm -rf node_modules .next
yarn install
yarn build
```

### Timeout en el Build

Si el build toma más de 45 minutos:

1. **Actualiza a un plan superior de Vercel** (Pro/Enterprise)
2. O **divide el proyecto** en módulos más pequeños

## 🚀 Optimizaciones Post-Despliegue

### 1. Configurar Dominio Personalizado

En Vercel Dashboard:
1. Ve a **Project Settings > Domains**
2. Agrega tu dominio: `inmova.app`
3. Configura los registros DNS según las instrucciones

### 2. Configurar Analytics

```bash
yarn add @vercel/analytics
```

En `app/layout.tsx`:
```tsx
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

### 3. Habilitar Edge Caching

En `vercel.json`, agrega:
```json
{
  "crons": [
    {
      "path": "/api/cron/daily",
      "schedule": "0 0 * * *"
    }
  ]
}
```

### 4. Monitoreo y Logs

- **Logs en tiempo real**: `vercel logs`
- **Dashboard**: [https://vercel.com/dashboard](https://vercel.com/dashboard)
- **Alertas**: Configura notificaciones para errores

## 📊 Verificación del Despliegue

### Checklist Post-Despliegue

- [ ] El sitio carga correctamente en la URL de Vercel
- [ ] Las rutas API responden correctamente
- [ ] La base de datos está conectada (prueba login)
- [ ] Las imágenes se cargan correctamente
- [ ] Los formularios funcionan (prueba registro/login)
- [ ] No hay errores en la consola del navegador
- [ ] Los webhooks están configurados (si aplica)
- [ ] Las variables de entorno están configuradas

### Pruebas de Rendimiento

```bash
# Lighthouse CI
npx lighthouse https://tu-dominio.vercel.app --view

# Vercel Speed Insights
# Ya integrado en el dashboard
```

## 🔒 Seguridad

### Headers de Seguridad

Ya configurados en `vercel.json`:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`

### HTTPS

Vercel proporciona HTTPS automáticamente con certificados Let's Encrypt.

### Variables Sensibles

⚠️ **Nunca** commitas:
- `.env.local`
- `.env.production`
- Claves API
- Secrets de terceros

Usa el Dashboard de Vercel para configurarlas.

## 📞 Soporte

### Recursos Adicionales

- **Documentación de Vercel**: [https://vercel.com/docs](https://vercel.com/docs)
- **Next.js en Vercel**: [https://nextjs.org/docs/deployment](https://nextjs.org/docs/deployment)
- **Vercel Community**: [https://github.com/vercel/vercel/discussions](https://github.com/vercel/vercel/discussions)

### Contacto

Si encuentras problemas:
1. Revisa los logs: `vercel logs`
2. Consulta la documentación oficial
3. Abre un issue en GitHub
4. Contacta al soporte de Vercel (plan Pro+)

## 🎉 ¡Listo!

Tu proyecto INMOVA debería estar ahora desplegado y funcionando en Vercel.

**URL de ejemplo**: `https://inmova.vercel.app` o tu dominio personalizado

---

Última actualización: Diciembre 2024
