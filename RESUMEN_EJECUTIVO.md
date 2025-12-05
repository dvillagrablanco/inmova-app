# 🚀 RESUMEN EJECUTIVO - Deployment INMOVA en Vercel

## 📊 Vista General

Este documento resume todo lo que necesitas para deployar la aplicación INMOVA en Vercel.

**Tiempo estimado total:** 30-45 minutos

---

## 📝 Documentación Disponible

| Documento | Propósito | Ubicación |
|-----------|----------|------------|
| **DEPLOYMENT_VERCEL.md** | Guía completa y detallada | `/home/ubuntu/homming_vidaro/` |
| **PASOS_DEPLOYMENT.md** | Guía rápida paso a paso | `/home/ubuntu/homming_vidaro/` |
| **CHECKLIST_DEPLOYMENT.md** | Checklist interactivo | `/home/ubuntu/homming_vidaro/` |
| **CREDENCIALES_ACCESO.md** | Template para guardar credenciales | `/home/ubuntu/homming_vidaro/` |
| **deploy-setup.sh** | Script de verificación automatizado | `/home/ubuntu/homming_vidaro/` |

---

## 🔑 Credenciales Necesarias

### GitHub
- **Usuario:** `dvillagrab`
- **Contraseña:** `Pucela00`
- **Repositorio:** `inmova-platform` (crear)
- **Personal Access Token:** (generar en GitHub)

### Base de Datos
- **Servicio recomendado:** Supabase (gratis)
- **Nombre proyecto:** `inmova-production`
- **Obtener:** `DATABASE_URL`

### Vercel
- **Login:** Con GitHub (cuenta `dvillagrab`)
- **Proyecto:** Importar desde GitHub

---

## 🛣️ Proceso Simplificado (5 Pasos)

### 1️⃣ Preparar Código (5 min)

```bash
# Ejecutar script de verificación
cd /home/ubuntu/homming_vidaro
chmod +x deploy-setup.sh
./deploy-setup.sh

# Agregar manualmente al package.json estos scripts:
"postinstall": "prisma generate",
"vercel-build": "prisma generate && prisma migrate deploy && next build",
```

### 2️⃣ GitHub (10 min)

1. Crear Personal Access Token en: https://github.com/settings/tokens
   - Scopes: `repo`, `workflow`
2. Crear repo: https://github.com/new
   - Nombre: `inmova-platform`
   - Privado: Sí
3. Subir código:
   ```bash
   cd /home/ubuntu/homming_vidaro/nextjs_space
   git remote add origin https://github.com/dvillagrab/inmova-platform.git
   git branch -M main
   git push -u origin main
   ```

### 3️⃣ Base de Datos (10 min)

1. Ir a: https://supabase.com
2. Crear proyecto: `inmova-production`
3. Copiar `DATABASE_URL` desde: Settings → Database → Connection string (URI)
4. Ejecutar migraciones:
   ```bash
   cd /home/ubuntu/homming_vidaro/nextjs_space
   echo "DATABASE_URL=[tu_url]" > .env.production
   yarn prisma migrate deploy
   ```

### 4️⃣ Vercel (10 min)

1. Ir a: https://vercel.com
2. Conectar con GitHub
3. Importar: `inmova-platform`
4. Configurar Environment Variables (ver sección siguiente)
5. Deploy

### 5️⃣ Verificar (5 min)

1. Abrir: `https://tu-proyecto.vercel.app`
2. Login: `admin@inmova.com` / `admin123`
3. Verificar que funciona correctamente

---

## ⚙️ Variables de Entorno en Vercel

### CRÍTICAS (Obligatorias)

```env
DATABASE_URL=[Tu URL de Supabase]
NEXTAUTH_URL=https://tu-proyecto.vercel.app
NEXTAUTH_SECRET=wJqizZO73C6pU4tjLTNwzjeoGLaMWvr9
AWS_REGION=us-west-2
AWS_BUCKET_NAME=abacusai-apps-030d8be4269891ba0e758624-us-west-2
AWS_FOLDER_PREFIX=12952/
AWS_PROFILE=hosted_storage
STRIPE_SECRET_KEY=sk_test_placeholder
STRIPE_PUBLISHABLE_KEY=pk_test_placeholder
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_placeholder
CRON_SECRET=inmova-cron-secret-2024-secure-key-xyz789
ENCRYPTION_KEY=151b21e7b3a0ebb00a2ff5288f3575c9d4167305d3a84ccd385564955adefd2b
```

### Opcionales

```env
ABACUSAI_API_KEY=a66d474df9e547058d3b977b3771d53b
NEXT_PUBLIC_VIDEO_URL=https://www.youtube.com/embed/zm55Gdl5G1Q
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BEl62iUYgUivxIkv69yViEuiBIa-Ib27SzV9p3F-Jq-6-kxq9RwD9qdL4U3JfYxSh_Vu_WG2cEg8u7kJ7-vQTmE
VAPID_PRIVATE_KEY=p-K-PxeghWxVyGxvxHYVsT3xhp5fKWvUqNfNqN-J4XM
```

**IMPORTANTE:** 
- Agregar para: `Production`, `Preview`, `Development`
- Actualizar `NEXTAUTH_URL` después del primer deploy

---

## 🚨 Troubleshooting Rápido

### Error: Build fails
- **Causa:** Scripts no configurados
- **Solución:** Agregar `postinstall` y `vercel-build` a package.json

### Error: Can't reach database
- **Causa:** `DATABASE_URL` incorrecta
- **Solución:** Verificar que incluya `?sslmode=require`

### Error: NextAuth error
- **Causa:** `NEXTAUTH_URL` o `NEXTAUTH_SECRET` no configurados
- **Solución:** Verificar variables en Vercel y redeploy

### Error: Imágenes no cargan
- **Causa:** Variables `AWS_*` no configuradas
- **Solución:** Agregar todas las variables AWS en Vercel

---

## ✅ Post-Deployment

### Inmediato
- [ ] Actualizar `NEXTAUTH_URL` con URL real de Vercel
- [ ] Verificar que login funciona
- [ ] Verificar que no hay errores en logs

### Opcional (cuando estés listo)
- [ ] Configurar dominio personalizado: `inmova.app`
- [ ] Configurar Stripe en producción (keys `sk_live_*`)
- [ ] Activar Vercel Analytics
- [ ] Configurar monitoreo de errores

---

## 📞 Soporte

### Documentación
- **Vercel:** https://vercel.com/docs
- **Supabase:** https://supabase.com/docs
- **Next.js:** https://nextjs.org/docs/deployment
- **Prisma:** https://www.prisma.io/docs/guides/deployment

### Contacto
- **Vercel Support:** support@vercel.com
- **Supabase Support:** support@supabase.com

---

## 📅 Comandos Rápidos

```bash
# Verificar preparación
./deploy-setup.sh

# Git setup
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/dvillagrab/inmova-platform.git
git push -u origin main

# Migraciones
cd /home/ubuntu/homming_vidaro/nextjs_space
echo "DATABASE_URL=[url]" > .env.production
yarn prisma migrate deploy

# Verificar build local
yarn build

# Ver logs de Vercel (con CLI)
vercel logs tu-proyecto --follow
```

---

## 🎉 Resultado Esperado

**Después de completar todos los pasos:**

✅ Aplicación desplegada en: `https://tu-proyecto.vercel.app`
✅ SSL habilitado automáticamente
✅ CI/CD activo (cada push = nuevo deploy)
✅ Base de datos PostgreSQL en producción
✅ Backups automáticos (Supabase)
✅ Monitoreo en Vercel Dashboard

**Credenciales de acceso:**
- Super Admin: `superadmin@inmova.com` / `superadmin123`
- Admin: `admin@inmova.com` / `admin123`

---

## 📊 Próximos Pasos (Opcional)

1. **Dominio Personalizado**
   - Configurar `inmova.app` en Vercel
   - Actualizar DNS en tu registrador

2. **Producción de Stripe**
   - Obtener keys de producción
   - Configurar webhook

3. **Monitoreo**
   - Configurar Sentry para error tracking
   - Activar Vercel Analytics
   - Configurar alertas

4. **Optimización**
   - Habilitar Vercel Edge Functions
   - Configurar ISR para páginas estáticas
   - Optimizar imágenes

---

**👍 ¡Todo listo para deployar!**

*Para empezar, ejecuta: `./deploy-setup.sh` y sigue el checklist.*

---

*INMOVA Platform - Resumen Ejecutivo - Enero 2026*
