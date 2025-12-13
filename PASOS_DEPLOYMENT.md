# 🚀 Guía Rápida de Deployment

## 📋 Resumen Ejecutivo

Esta guía te llevará paso a paso para deployar INMOVA en Vercel en aproximadamente **30 minutos**.

---

## ☑️ PASO 1: Preparar Repositorio Git (5 min)

### 1.1 Inicializar Git

```bash
cd /home/ubuntu/homming_vidaro/nextjs_space
git init
git add .
git commit -m "Initial commit - INMOVA v1.0 para Vercel"
```

### 1.2 Actualizar package.json

Agregar manualmente estos scripts al archivo `package.json`:

```json
"postinstall": "prisma generate",
"vercel-build": "prisma generate && prisma migrate deploy && next build",
"migrate:prod": "prisma migrate deploy",
```

---

## ☑️ PASO 2: Crear Repositorio en GitHub (5 min)

### 2.1 Crear Repo

1. Ir a [GitHub](https://github.com)
2. Login: `dvillagrab` / `Pucela00`
3. Crear nuevo repositorio:
   - Nombre: `inmova-platform`
   - Privado: Sí
   - NO inicializar con README

### 2.2 Crear Personal Access Token

1. GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. "Generate new token (classic)"
3. Nombre: `INMOVA Deployment`
4. Scopes: ☑️ `repo` (completo), ☑️ `workflow`
5. Generar y **COPIAR el token**

### 2.3 Subir Código

```bash
git remote add origin https://github.com/dvillagrab/inmova-platform.git
git branch -M main
git push -u origin main
```

**Credenciales al hacer push:**
- Username: `dvillagrab`
- Password: [Pegar el Personal Access Token]

---

## ☑️ PASO 3: Configurar Base de Datos (10 min)

### Opción Recomendada: Supabase

1. Ir a [Supabase](https://supabase.com)
2. Crear cuenta (gratis)
3. "New project":
   - Nombre: `inmova-production`
   - Database Password: [Guardar en lugar seguro]
   - Región: Europe West
4. Esperar ~2 minutos
5. Settings → Database → Connection string (URI)
6. Copiar la URL completa:
   ```
   postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres
   ```

**✅ Guardar esta URL para Vercel**

---

## ☑️ PASO 4: Configurar Vercel (10 min)

### 4.1 Crear Proyecto

1. Ir a [Vercel](https://vercel.com/signup)
2. Sign up con GitHub (usuario `dvillagrab`)
3. "Add New Project"
4. Importar `inmova-platform`
5. **NO hacer deploy todavía**

### 4.2 Configurar Variables de Entorno

En Vercel → Settings → Environment Variables, agregar:

#### Variables CRÍTICAS (Obligatorias):

| Variable | Valor | Environment |
|----------|-------|-------------|
| `DATABASE_URL` | [Tu URL de Supabase] | Production, Preview, Development |
| `NEXTAUTH_URL` | `https://tu-proyecto.vercel.app` | Production |
| `NEXTAUTH_SECRET` | `wJqizZO73C6pU4tjLTNwzjeoGLaMWvr9` | All |
| `AWS_REGION` | `us-west-2` | All |
| `AWS_BUCKET_NAME` | [Tu bucket o usar el existente] | All |
| `AWS_FOLDER_PREFIX` | `production/` | All |
| `STRIPE_SECRET_KEY` | `sk_test_placeholder` | All |
| `STRIPE_PUBLISHABLE_KEY` | `pk_test_placeholder` | All |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_test_placeholder` | All |
| `CRON_SECRET` | `inmova-cron-secret-2024-secure-key-xyz789` | All |
| `ENCRYPTION_KEY` | `151b21e7b3a0ebb00a2ff5288f3575c9d4167305d3a84ccd385564955adefd2b` | All |

#### Variables Opcionales:

| Variable | Valor | Environment |
|----------|-------|-------------|
| `ABACUSAI_API_KEY` | `a66d474df9e547058d3b977b3771d53b` | All |
| `NEXT_PUBLIC_VIDEO_URL` | `https://www.youtube.com/embed/zm55Gdl5G1Q` | All |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | `BEl62iUYgUivxIkv69yViEuiBIa-Ib27SzV9p3F-Jq-6-kxq9RwD9qdL4U3JfYxSh_Vu_WG2cEg8u7kJ7-vQTmE` | All |
| `VAPID_PRIVATE_KEY` | `p-K-PxeghWxVyGxvxHYVsT3xhp5fKWvUqNfNqN-J4XM` | All |

**IMPORTANTE:** Actualizar `NEXTAUTH_URL` con tu URL real de Vercel después del primer deploy.

---

## ☑️ PASO 5: Ejecutar Migraciones (5 min)

### Desde tu Máquina Local

```bash
cd /home/ubuntu/homming_vidaro/nextjs_space

# Crear .env.production con tu DATABASE_URL
echo "DATABASE_URL=[tu_url_de_supabase]" > .env.production

# Ejecutar migraciones
yarn prisma generate
yarn prisma migrate deploy

# Crear usuarios iniciales
node scripts/create-super-admin.ts
node scripts/create-admin-user.ts
```

**✅ Verificar que no haya errores**

---

## ☑️ PASO 6: Deploy en Vercel (5 min)

### 6.1 Primer Deploy

1. En Vercel, ir a tu proyecto
2. Clic en "Deploy"
3. Esperar 5-10 minutos
4. Vercel te dará una URL: `https://[tu-proyecto]-[hash].vercel.app`

### 6.2 Actualizar NEXTAUTH_URL

1. Copiar la URL de Vercel
2. Vercel → Settings → Environment Variables
3. Editar `NEXTAUTH_URL` → Pegar tu URL
4. Guardar
5. Redeploy: Deployments → Último deploy → Menú (...) → "Redeploy"

---

## ✅ PASO 7: Verificación Final

### 7.1 Probar Login

1. Abrir: `https://tu-proyecto.vercel.app/login`
2. Credenciales:
   - Email: `admin@inmova.com`
   - Password: `admin123`
3. Verificar que carga el dashboard

### 7.2 Verificar Funcionalidad

- [ ] Login funciona
- [ ] Dashboard carga correctamente
- [ ] Edificios/Unidades/Inquilinos visibles
- [ ] No hay errores en consola

### 7.3 Verificar Logs

Vercel → Deployments → Último deploy → "Runtime Logs"
- No deben haber errores críticos

---

## 🆘 Troubleshooting Rápido

### Error: "Can't reach database"
```bash
# Verificar formato de DATABASE_URL
# Debe incluir ?sslmode=require al final
postgresql://user:pass@host:5432/db?sslmode=require
```

### Error: "NextAuth JWT Error"
```bash
# Verificar que NEXTAUTH_SECRET esté configurado
# Verificar que NEXTAUTH_URL sea correcto (sin trailing slash)
```

### Error en Build
```bash
# Verificar que "postinstall" esté en package.json
# Ejecutar localmente: yarn build
# Ver logs específicos en Vercel
```

---

## 🎉 ¡Completado!

**Tu aplicación está ahora en producción:**

✅ URL: `https://tu-proyecto.vercel.app`
✅ SSL habilitado automáticamente
✅ CI/CD activo (cada push a `main` = nuevo deploy)
✅ Base de datos PostgreSQL en producción

### Credenciales de Acceso:

**Super Administrador:**
- Email: `superadmin@inmova.com`
- Password: `superadmin123`

**Administrador:**
- Email: `admin@inmova.com`
- Password: `admin123`

---

## 📝 Próximos Pasos

1. **Configurar Dominio Personalizado:**
   - Vercel → Settings → Domains → Add `inmova.app`
   - Configurar DNS en tu registrador

2. **Configurar Stripe en Producción:**
   - Obtener keys `sk_live_*` y `pk_live_*`
   - Configurar webhook: `https://tu-dominio.com/api/stripe/webhook`

3. **Monitoreo:**
   - Configurar Vercel Analytics
   - Configurar Sentry para error tracking

4. **Backups:**
   - Configurar backups automáticos en Supabase
   - Programar exports semanales de datos

---

*Generado para INMOVA Platform - Enero 2026*
