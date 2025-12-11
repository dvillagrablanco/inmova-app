# ☑️ Checklist de Deployment INMOVA → Vercel

## 📌 Información de Acceso

### GitHub
- **Usuario:** `dvillagrab`
- **Contraseña:** `Pucela00`
- **Repositorio:** `inmova-platform`
- **URL:** `https://github.com/dvillagrab/inmova-platform`

### Vercel
- **Login:** Conectar con cuenta de GitHub `dvillagrab`
- **Proyecto:** `inmova-platform`

---

## ✅ Pre-Deployment

### [ ] 1. Preparación de Código

- [ ] Git inicializado en `/home/ubuntu/homming_vidaro/nextjs_space`
- [ ] `.gitignore` configurado correctamente
- [ ] Archivos sensibles NO incluidos en Git:
  - [ ] `.env` NO en Git
  - [ ] `node_modules/` NO en Git
  - [ ] `.next/` NO en Git
  - [ ] Certificados `.pem` NO en Git

### [ ] 2. Package.json Actualizado

Agregar estos scripts manualmente:

```json
"postinstall": "prisma generate",
"vercel-build": "prisma generate && prisma migrate deploy && next build",
"migrate:prod": "prisma migrate deploy"
```

**Ubicación:** `/home/ubuntu/homming_vidaro/nextjs_space/package.json`

**Cómo agregar:**
1. Abrir el archivo
2. Buscar la sección `"scripts": {`
3. Agregar los 3 scripts arriba después de `"dev": "next dev",`
4. Guardar

### [ ] 3. Commit Inicial

```bash
cd /home/ubuntu/homming_vidaro/nextjs_space
git add .
git commit -m "Preparación para deployment en Vercel"
```

---

## ✅ GitHub

### [ ] 4. Crear Personal Access Token

1. [ ] Ir a: https://github.com/settings/tokens
2. [ ] Click "Generate new token" → "Generate new token (classic)"
3. [ ] Nombre: `INMOVA Deployment`
4. [ ] Expiración: `90 days` o `No expiration`
5. [ ] Permisos:
   - [ ] ☑️ `repo` (completo)
   - [ ] ☑️ `workflow`
6. [ ] Click "Generate token"
7. [ ] **COPIAR Y GUARDAR EL TOKEN** (solo se muestra una vez)

**Token generado:** `ghp_____________________________` (guardar aquí)

### [ ] 5. Crear Repositorio en GitHub

1. [ ] Ir a: https://github.com/new
2. [ ] Repository name: `inmova-platform`
3. [ ] Description: `INMOVA - Plataforma Integral de Gestión Inmobiliaria`
4. [ ] Visibilidad: ☑️ **Private**
5. [ ] **NO** marcar "Add a README file"
6. [ ] **NO** agregar .gitignore
7. [ ] **NO** agregar license
8. [ ] Click "Create repository"

### [ ] 6. Subir Código a GitHub

```bash
cd /home/ubuntu/homming_vidaro/nextjs_space
git remote add origin https://github.com/dvillagrab/inmova-platform.git
git branch -M main
git push -u origin main
```

**Cuando pida credenciales:**
- Username: `dvillagrab`
- Password: [Pegar el Personal Access Token de arriba]

### [ ] 7. Verificar Subida

- [ ] Ir a: https://github.com/dvillagrab/inmova-platform
- [ ] Verificar que aparecen todos los archivos
- [ ] Verificar que `.env` NO aparece (debe estar en .gitignore)

---

## ✅ Base de Datos

### [ ] 8. Crear Base de Datos en Supabase

1. [ ] Ir a: https://supabase.com
2. [ ] Crear cuenta (puede ser con GitHub)
3. [ ] Click "New project"
4. [ ] Configuración:
   - [ ] Organization: Crear nueva o usar existente
   - [ ] Name: `inmova-production`
   - [ ] Database Password: `________________` (guardar aquí)
   - [ ] Region: `Europe West (eu-west-1)`
   - [ ] Pricing plan: `Free`
5. [ ] Click "Create new project"
6. [ ] **ESPERAR 2-3 minutos** mientras se crea

### [ ] 9. Obtener Connection String

1. [ ] En Supabase → Settings → Database
2. [ ] Buscar sección "Connection string"
3. [ ] Seleccionar tab "URI"
4. [ ] Click "Copy" o copiar manualmente
5. [ ] Formato esperado:
   ```
   postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres
   ```
6. [ ] Reemplazar `[YOUR-PASSWORD]` con la password del paso 8
7. [ ] **GUARDAR la URL completa:**

```
DATABASE_URL: _________________________________________________________________
```

### [ ] 10. Probar Conexión Local (Opcional)

```bash
cd /home/ubuntu/homming_vidaro/nextjs_space
echo "DATABASE_URL=[tu_url_de_supabase]" > .env.production
yarn prisma generate
yarn prisma migrate deploy
```

- [ ] Comando ejecutado sin errores
- [ ] Tablas creadas en Supabase (verificar en Supabase → Table Editor)

---

## ✅ Vercel

### [ ] 11. Crear Cuenta en Vercel

1. [ ] Ir a: https://vercel.com/signup
2. [ ] Click "Continue with GitHub"
3. [ ] Autorizar con GitHub (usuario `dvillagrab`)
4. [ ] Completar perfil si es necesario

### [ ] 12. Importar Proyecto

1. [ ] En Vercel Dashboard, click "Add New" → "Project"
2. [ ] Buscar `inmova-platform` en la lista
3. [ ] Click "Import"
4. [ ] **NO HACER DEPLOY TODAVÍA**

### [ ] 13. Configurar Variables de Entorno

**IR A:** Project Settings → Environment Variables

#### Variables OBLIGATORIAS:

| ☑️ | Variable | Valor | Environments |
|-----|----------|-------|-------------|
| [ ] | `DATABASE_URL` | [Tu URL de Supabase] | Prod, Preview, Dev |
| [ ] | `NEXTAUTH_URL` | `https://tu-proyecto.vercel.app` | Production |
| [ ] | `NEXTAUTH_SECRET` | `wJqizZO73C6pU4tjLTNwzjeoGLaMWvr9` | All |
| [ ] | `AWS_REGION` | `us-west-2` | All |
| [ ] | `AWS_BUCKET_NAME` | `abacusai-apps-030d8be4269891ba0e758624-us-west-2` | All |
| [ ] | `AWS_FOLDER_PREFIX` | `12952/` | All |
| [ ] | `AWS_PROFILE` | `hosted_storage` | All |
| [ ] | `STRIPE_SECRET_KEY` | `sk_test_placeholder` | All |
| [ ] | `STRIPE_PUBLISHABLE_KEY` | `pk_test_placeholder` | All |
| [ ] | `STRIPE_WEBHOOK_SECRET` | `whsec_placeholder` | All |
| [ ] | `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_test_placeholder` | All |
| [ ] | `CRON_SECRET` | `inmova-cron-secret-2024-secure-key-xyz789` | All |
| [ ] | `ENCRYPTION_KEY` | `151b21e7b3a0ebb00a2ff5288f3575c9d4167305d3a84ccd385564955adefd2b` | All |

#### Variables OPCIONALES:

| ☑️ | Variable | Valor | Environments |
|-----|----------|-------|-------------|
| [ ] | `ABACUSAI_API_KEY` | `a66d474df9e547058d3b977b3771d53b` | All |
| [ ] | `NEXT_PUBLIC_VIDEO_URL` | `https://www.youtube.com/embed/zm55Gdl5G1Q` | All |
| [ ] | `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | `BEl62iUYgUivxIkv69yViEuiBIa-Ib27SzV9p3F-Jq-6-kxq9RwD9qdL4U3JfYxSh_Vu_WG2cEg8u7kJ7-vQTmE` | All |
| [ ] | `VAPID_PRIVATE_KEY` | `p-K-PxeghWxVyGxvxHYVsT3xhp5fKWvUqNfNqN-J4XM` | All |

**NOTA:** `NEXTAUTH_URL` debe actualizarse después del primer deploy con la URL real de Vercel.

### [ ] 14. Configurar Build Settings (Auto-detectadas)

Verificar que estén así:

- [ ] Framework Preset: `Next.js`
- [ ] Build Command: `yarn vercel-build` o detectado automáticamente
- [ ] Output Directory: `.next`
- [ ] Install Command: `yarn install`
- [ ] Node.js Version: `18.x` o `20.x`

---

## ✅ Deployment

### [ ] 15. Primer Deploy

1. [ ] Click "Deploy"
2. [ ] **ESPERAR 5-10 minutos**
3. [ ] Observar logs de build:
   - [ ] `yarn install` → ✅
   - [ ] `prisma generate` → ✅
   - [ ] `prisma migrate deploy` → ✅
   - [ ] `next build` → ✅
4. [ ] Deploy completado exitosamente
5. [ ] **COPIAR LA URL:** `https://_________________.vercel.app`

### [ ] 16. Actualizar NEXTAUTH_URL

1. [ ] Settings → Environment Variables
2. [ ] Buscar `NEXTAUTH_URL`
3. [ ] Click en edit (lápiz)
4. [ ] Actualizar valor con la URL real de Vercel
5. [ ] Environment: Solo `Production`
6. [ ] Save
7. [ ] Ir a Deployments
8. [ ] Click en el último deployment
9. [ ] Menú (...) → "Redeploy"
10. [ ] Esperar ~3-5 minutos

### [ ] 17. Ejecutar Migraciones y Seed

**Opción A: Desde local**

```bash
cd /home/ubuntu/homming_vidaro/nextjs_space
echo "DATABASE_URL=[tu_url_de_supabase]" > .env.production
yarn prisma migrate deploy
```

**Si hay script de seed:**
```bash
node scripts/create-super-admin.ts
node scripts/create-admin-user.ts
```

- [ ] Migraciones ejecutadas
- [ ] Super Admin creado
- [ ] Admin creado

---

## ✅ Verificación

### [ ] 18. Probar la Aplicación
1. [ ] Abrir: `https://tu-proyecto.vercel.app`
2. [ ] Página de inicio carga correctamente
3. [ ] Ir a `/login`
4. [ ] Probar login:
   - Email: `admin@inmova.com`
   - Password: `admin123`
5. [ ] Login exitoso → Redirige al dashboard
6. [ ] Dashboard carga sin errores
7. [ ] Navegación funciona:
   - [ ] Edificios
   - [ ] Unidades
   - [ ] Inquilinos
   - [ ] Contratos
   - [ ] Finanzas
8. [ ] No hay errores en consola del navegador (F12)

### [ ] 19. Verificar Logs de Producción
1. [ ] Vercel → Deployments
2. [ ] Click en el deployment actual
3. [ ] Tab "Runtime Logs"
4. [ ] Verificar que NO haya:
   - [ ] Errores de conexión a BD
   - [ ] Errores 500
   - [ ] Warnings críticos

### [ ] 20. Verificar Integraciones

- [ ] **Subida de archivos:** Probar subir imagen/documento
- [ ] **Stripe:** Verificar que stripe.js carga (si aplica)
- [ ] **Notificaciones:** Verificar que no haya errores de VAPID
- [ ] **APIs:** Probar endpoints críticos

---

## ✅ Post-Deployment

### [ ] 21. Configurar Dominio Personalizado (Opcional)

1. [ ] Vercel → Settings → Domains
2. [ ] Add Domain: `inmova.app`
3. [ ] Seguir instrucciones de DNS
4. [ ] Actualizar `NEXTAUTH_URL` a `https://inmova.app`
5. [ ] Redeploy

### [ ] 22. Configurar Stripe en Producción (Cuando estés listo)

1. [ ] Obtener keys de producción de Stripe
2. [ ] Actualizar variables en Vercel:
   - `STRIPE_SECRET_KEY` → `sk_live_...`
   - `STRIPE_PUBLISHABLE_KEY` → `pk_live_...`
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` → `pk_live_...`
3. [ ] Configurar webhook en Stripe:
   - URL: `https://tu-dominio.com/api/stripe/webhook`
   - Events: `checkout.session.completed`, `payment_intent.succeeded`
4. [ ] Copiar `STRIPE_WEBHOOK_SECRET`
5. [ ] Actualizar en Vercel
6. [ ] Redeploy

### [ ] 23. Monitoreo y Analytics

- [ ] Activar Vercel Analytics
- [ ] Configurar alertas de errores
- [ ] Configurar backups de BD (Supabase hace backups diarios automáticos)

### [ ] 24. Documentación

- [ ] Guardar credenciales en lugar seguro:
  - GitHub token
  - Database password
  - Stripe keys (producción)
  - Otros API keys
- [ ] Documentar URLs:
  - Producción: `_______________________`
  - Supabase Dashboard: `_______________________`
  - GitHub Repo: `https://github.com/dvillagrab/inmova-platform`
  - Vercel Dashboard: `_______________________`

---

## 🆘 Troubleshooting

### Si algo falla:

1. **Build fails:**
   - [ ] Verificar logs en Vercel
   - [ ] Verificar que `postinstall` esté en package.json
   - [ ] Verificar que todas las dependencias estén en `dependencies` (no en `devDependencies`)

2. **Database errors:**
   - [ ] Verificar `DATABASE_URL` en Vercel
   - [ ] Verificar que incluya `?sslmode=require`
   - [ ] Verificar conexión desde local primero

3. **NextAuth errors:**
   - [ ] Verificar `NEXTAUTH_SECRET`
   - [ ] Verificar `NEXTAUTH_URL` (sin trailing slash)
   - [ ] Redeploy después de cambiar

4. **404 en rutas:**
   - [ ] Verificar estructura de carpetas
   - [ ] Verificar que `app/` o `pages/` exista
   - [ ] Redeploy

---

## 🎉 ¡COMPLETADO!

**Tu aplicación INMOVA está ahora en producción:**

✅ **URL de Producción:** `https://_________________.vercel.app`

✅ **Credenciales de Acceso:**
- **Super Admin:** `superadmin@inmova.com` / `superadmin123`
- **Admin:** `admin@inmova.com` / `admin123`

✅ **Panel de Control:**
- **Vercel:** https://vercel.com/dashboard
- **Supabase:** https://supabase.com/dashboard
- **GitHub:** https://github.com/dvillagrab/inmova-platform

---

**Fecha de Deployment:** _______________

**Deployado por:** _______________

**Versión:** v1.0

---

*Checklist generado para INMOVA Platform - Enero 2026*
