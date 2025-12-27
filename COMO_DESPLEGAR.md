# 🚀 Cómo Desplegar a Vercel - Guía Rápida

## ⚡ Deployment Rápido (3 comandos)

```bash
# 1. Login en Vercel
vercel login

# 2. Deploy a producción
vercel --prod

# 3. Configurar variables de entorno (después del deploy)
# Ve a: https://vercel.com/tu-proyecto/settings/environment-variables
```

---

## 📋 Variables de Entorno Necesarias

Una vez desplegado, configura estas variables en el dashboard de Vercel:

### ✅ OBLIGATORIAS:

```env
DATABASE_URL=postgresql://user:password@host:5432/dbname
NEXTAUTH_URL=https://tu-app.vercel.app
NEXTAUTH_SECRET=genera_uno_con_openssl_rand_base64_32
NODE_ENV=production
```

### Cómo generar NEXTAUTH_SECRET:
```bash
openssl rand -base64 32
```

---

## 🗄️ Base de Datos PostgreSQL - Opciones Rápidas

### Opción 1: Vercel Postgres (Más Fácil)
1. En el dashboard de Vercel → Storage → Create Database → Postgres
2. Se configura automáticamente ✅

### Opción 2: Supabase (Gratis)
1. Crear cuenta en https://supabase.com
2. Nuevo proyecto → Settings → Database
3. Copiar "Connection String" (Pool)
4. Agregar a Vercel como DATABASE_URL

### Opción 3: Railway (Gratis con $5)
1. Crear cuenta en https://railway.app
2. New Project → Provision PostgreSQL
3. Copiar DATABASE_URL
4. Agregar a Vercel

---

## 🔄 Después del Deploy

### 1. Ejecutar migraciones de Prisma:
```bash
# Opción A: Desde tu terminal (necesitas DATABASE_URL local)
npx prisma migrate deploy

# Opción B: Automático en cada build
# Ya está configurado en el proyecto ✅
```

### 2. Verificar que todo funcione:
- ✅ La app carga en la URL de Vercel
- ✅ Login funciona
- ✅ Base de datos conectada
- ✅ No hay errores en consola

### 3. Ver logs:
```bash
vercel logs
```

---

## 🌐 Dominio Personalizado (Opcional)

1. Ve a: `https://vercel.com/tu-proyecto/settings/domains`
2. Agregar dominio: `tudominio.com`
3. Configurar DNS según las instrucciones

---

## 🚨 Si algo falla

### Error de base de datos:
```bash
# Verifica que DATABASE_URL esté configurada correctamente
vercel env ls
```

### Build falla:
```bash
# Ver logs detallados
vercel logs [deployment-url]
```

### Volver a versión anterior:
```bash
vercel rollback
```

---

## 📱 Script Automatizado

Si prefieres, usa el script automatizado:

```bash
./DEPLOY_NOW.sh
```

Este script:
1. ✅ Verifica que todo esté correcto
2. ✅ Ejecuta el build local
3. ✅ Despliega a Vercel
4. ✅ Te muestra los próximos pasos

---

## 🎯 Resumen

1. **Login:** `vercel login`
2. **Deploy:** `vercel --prod`
3. **Configurar:** Variables de entorno en dashboard
4. **Verificar:** Tu app en `https://tu-app.vercel.app`

**¡Eso es todo! Tu app estará en producción en minutos.** 🎉

---

## 📚 Documentación Completa

Para más detalles, consulta:
- `VERCEL_SETUP.md` - Guía completa paso a paso
- `DEPLOYMENT_INSTRUCTIONS.md` - Información general de deployment
- https://vercel.com/docs - Documentación oficial de Vercel
