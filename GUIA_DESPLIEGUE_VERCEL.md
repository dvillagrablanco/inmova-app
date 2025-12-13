# 📘 Guía Completa de Despliegue en Vercel - INMOVA

## 🎯 Resumen Ejecutivo

Esta guía te ayudará a migrar tu aplicación INMOVA desde el entorno actual a Vercel de forma segura y eficiente.

---

## 📦 Pre-requisitos

- ✅ Cuenta de Vercel (ya tienes: dvillagra@vidaroinversiones.com)
- ✅ Proyecto Next.js funcional (✓ Completado)
- ✅ Variables de entorno configuradas
- ✅ Base de datos accesible desde internet

---

## 🚀 Método 1: Despliegue desde Dashboard (Recomendado para Principiantes)

### **Paso 1: Preparar Repositorio Git**

Si tu proyecto no está en GitHub:

```bash
cd /home/ubuntu/homming_vidaro/nextjs_space
git init
git add .
git commit -m "Preparar para Vercel"
```

Crea un repositorio en [GitHub](https://github.com/new) y súbelo:

```bash
git remote add origin https://github.com/TU_USUARIO/inmova.git
git branch -M main
git push -u origin main
```

### **Paso 2: Importar en Vercel**

1. **Ir a**: https://vercel.com/new
2. **Login** con:
   - Email: `dvillagra@vidaroinversiones.com`
   - Contraseña: `Pucela00`
   - Código 2FA (si se solicita): `220194`

3. **Clic en "Import Git Repository"**
4. **Selecciona tu repositorio de GitHub**
5. **Vercel configurará automáticamente:**
   - Framework: Next.js
   - Build Command: `next build`
   - Output Directory: `.next`
   - Install Command: `yarn install`

### **Paso 3: Configurar Variables de Entorno** ⚠️ **CRÍTICO**

**En el dashboard de Vercel, ve a "Environment Variables" y agrega TODAS estas:**

```env
# Base de Datos
DATABASE_URL=postgresql://role_587683780:5kWw7vKJBDp9ZA2Jfkt5BdWrAjR0XDe5@db-587683780.db003.hosteddb.reai.io:5432/587683780?connect_timeout=15&sslmode=require

# NextAuth
NEXTAUTH_URL=https://TU_DOMINIO.vercel.app
NEXTAUTH_SECRET=hHbeP93d8wOiV0EMLP6werA8BXdU6B1m3WoHb6Vhp1oaAoBZw4Q4qbtvqrsIWdnebQ5qtmaQMcC8Hqx+j/cwCqJAHB48444w6O2h7l6C4cHCBIsuT6R/Br7Q32BtMs7N

# AWS S3 (si usas almacenamiento)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=tu_access_key
AWS_SECRET_ACCESS_KEY=tu_secret_key
AWS_BUCKET_NAME=tu_bucket
AWS_FOLDER_PREFIX=inmova/

# Stripe (si usas pagos)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email (si usas notificaciones)
EMAIL_SERVER_HOST=smtp.gmail.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=tu_email@gmail.com
EMAIL_SERVER_PASSWORD=tu_password
EMAIL_FROM=noreply@inmova.app
```

**💡 Tip**: Puedes copiar las variables desde tu `.env` local:

```bash
cat /home/ubuntu/homming_vidaro/nextjs_space/.env
```

### **Paso 4: Desplegar** 🎉

1. Clic en **"Deploy"**
2. Espera 2-5 minutos mientras Vercel:
   - Instala dependencias
   - Ejecuta Prisma migrations
   - Compila Next.js
   - Despliega a producción

3. **¡Listo!** Tu app estará en: `https://tu-proyecto.vercel.app`

---

## ⚡ Método 2: Despliegue desde CLI (Para Usuarios Avanzados)

### **Instalación de Vercel CLI**

```bash
npm install -g vercel
```

### **Login**

```bash
vercel login
```

Ingresa:
- Email: `dvillagra@vidaroinversiones.com`
- Contraseña: `Pucela00`
- Código 2FA: `220194`

### **Despliegue**

```bash
cd /home/ubuntu/homming_vidaro/nextjs_space
vercel --prod
```

**Vercel te preguntará:**
1. ¿Es este tu proyecto? **Y**
2. ¿Cuál es el alcance? **Personal/Team**
3. ¿Link a proyecto existente? **N** (primera vez)
4. ¿Nombre del proyecto? **inmova** (o el que prefieras)
5. ¿En qué directorio está el código? **./** (dejar por defecto)
6. ¿Detectó Next.js? **Y**
7. ¿Override settings? **N** (usa la configuración automática)

---

## 🔧 Configuración Post-Despliegue

### **1. Configurar Dominio Personalizado**

1. Ve a tu proyecto en Vercel Dashboard
2. Settings → Domains
3. Agrega `inmova.app` o tu dominio
4. Sigue las instrucciones para actualizar DNS

### **2. Verificar Base de Datos**

Tu base de datos actual en Hosteddb debe ser accesible desde Vercel:

```bash
# Test de conectividad
psql "postgresql://role_587683780:5kWw7vKJBDp9ZA2Jfkt5BdWrAjR0XDe5@db-587683780.db003.hosteddb.reai.io:5432/587683780?sslmode=require"
```

Si funciona localmente, funcionará en Vercel ✅

### **3. Ejecutar Migraciones de Prisma**

Vercel ejecuta automáticamente:
```json
// package.json - Script de build
"build": "prisma generate && prisma migrate deploy && next build"
```

Si necesitas ejecutar manualmente:
```bash
vercel env pull .env.local
prisma migrate deploy
```

### **4. Verificar Variables de Entorno**

```bash
vercel env ls
```

---

## ⚠️ Problemas Comunes y Soluciones

### **Error: "Cannot connect to database"**

**Causa**: La base de datos no es accesible desde Vercel

**Solución**:
1. Verifica que `sslmode=require` esté en `DATABASE_URL`
2. Asegúrate de que Hosteddb permita conexiones externas
3. Prueba la conexión localmente con el mismo `DATABASE_URL`

### **Error: "NEXTAUTH_URL is not defined"**

**Causa**: Falta la variable de entorno `NEXTAUTH_URL`

**Solución**:
```bash
vercel env add NEXTAUTH_URL
# Valor: https://tu-proyecto.vercel.app
```

### **Error: "Prisma Client not generated"**

**Causa**: Prisma no se generó correctamente

**Solución**:
Agrega en `package.json`:
```json
{
  "scripts": {
    "postinstall": "prisma generate",
    "build": "prisma generate && prisma migrate deploy && next build"
  }
}
```

### **Error: "Module not found"**

**Causa**: Rutas de importación incorrectas

**Solución**:
Verifica que todas las rutas usen rutas absolutas con `@/`:
```typescript
import { Component } from '@/components/Component'
```

---

## 📊 Monitoreo Post-Despliegue

### **1. Analytics de Vercel**

- Ve a: https://vercel.com/tu-proyecto/analytics
- Monitorea:
  - Visitas
  - Tiempo de carga
  - Errores
  - Core Web Vitals

### **2. Logs en Tiempo Real**

```bash
vercel logs --follow
```

O desde el dashboard: Functions → Runtime Logs

### **3. Performance**

- Edge Network: Distribución global automática
- CDN: Activo por defecto
- Image Optimization: Automático

---

## 🔄 Actualizar Despliegue

### **Automático (GitHub)**

Cada `git push` a `main` desplegará automáticamente:

```bash
git add .
git commit -m "Actualización"
git push origin main
```

### **Manual (CLI)**

```bash
vercel --prod
```

---

## 💰 Costos de Vercel

### **Plan Hobby (Gratis)**
- ✅ HTTPS automático
- ✅ 100GB bandwidth
- ✅ Despliegues ilimitados
- ✅ Dominios personalizados
- ❌ Sin Analytics avanzados
- ❌ Sin protección DDoS

### **Plan Pro ($20/mes)**
- ✅ Todo lo del Hobby
- ✅ Analytics avanzados
- ✅ Protección DDoS
- ✅ 1TB bandwidth
- ✅ Soporte prioritario

**Recomendación**: Empieza con Hobby y actualiza si necesitas más recursos

---

## 🎯 Checklist Final

**Antes del Despliegue:**
- [ ] Código en repositorio Git
- [ ] Variables de entorno preparadas
- [ ] Base de datos accesible
- [ ] Prisma schema actualizado
- [ ] `package.json` con scripts correctos

**Durante el Despliegue:**
- [ ] Proyecto importado en Vercel
- [ ] Variables de entorno configuradas
- [ ] Build exitoso (sin errores)
- [ ] Deployment activo

**Después del Despliegue:**
- [ ] App funcionando en producción
- [ ] Login funcional
- [ ] Base de datos conectada
- [ ] Imágenes cargando
- [ ] Emails enviando (si aplica)
- [ ] Dominio personalizado configurado

---

## 🆘 Soporte

### **Documentación Oficial**
- Vercel: https://vercel.com/docs
- Next.js: https://nextjs.org/docs
- Prisma: https://www.prisma.io/docs

### **Comunidad**
- Discord de Vercel: https://vercel.com/discord
- GitHub Issues: https://github.com/vercel/next.js/issues

### **Contacto INMOVA**
- Email: soporte@inmova.app
- Documentación: Consulta los archivos `.md` en el proyecto

---

## 🎉 ¡Felicidades!

Tu aplicación INMOVA está ahora desplegada en Vercel con:
- ✅ Infraestructura global
- ✅ HTTPS automático
- ✅ Despliegues automáticos
- ✅ Escalabilidad ilimitada

**Próximos pasos recomendados:**
1. Configurar dominio personalizado
2. Activar Analytics
3. Configurar alertas de monitoreo
4. Preparar backups automatizados

---

**Última actualización**: Diciembre 2025
**Versión**: 1.0
**Autor**: Equipo INMOVA