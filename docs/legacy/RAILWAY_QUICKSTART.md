# 🚂 Railway - Quick Start (5 minutos)

## ✅ Estado del Código
**Commit actual:** `e2db2427`  
**Todo listo para Railway** - No requiere cambios adicionales

---

## 🎯 Pasos Rápidos

### 1. Login (30 segundos)
```
1. Ve a https://railway.app
2. Click "Login with GitHub"
3. Autoriza Railway
```

### 2. Crear Proyecto (1 minuto)
```
1. Click "+ New Project"
2. "Deploy from GitHub repo"
3. Selecciona "inmova-app"
```

### 3. Añadir PostgreSQL (30 segundos)
```
1. Click botón "+" en el proyecto
2. "Database" → "Add PostgreSQL"
3. Espera 15 segundos
```

### 4. Variables de Entorno (2 minutos)

**Click en "inmova-app" → "Variables" → "Raw Editor"**

Copia y pega esto (reemplaza los valores `<GENERA_XXX>`):

```bash
# Base de Datos
DATABASE_URL=${{Postgres.DATABASE_URL}}

# Autenticación
NEXTAUTH_SECRET=<GENERA_CON_OPENSSL_RAND_BASE64_32>
NEXTAUTH_URL=https://${{RAILWAY_PUBLIC_DOMAIN}}

# Encriptación
ENCRYPTION_KEY=<GENERA_CON_OPENSSL_RAND_HEX_16>

# URL Base
NEXT_PUBLIC_BASE_URL=https://${{RAILWAY_PUBLIC_DOMAIN}}
```

**Generar secretos (en tu terminal):**
```bash
# NEXTAUTH_SECRET
openssl rand -base64 32

# ENCRYPTION_KEY
openssl rand -hex 16
```

### 5. Deploy (30 segundos)
```
Railway detectará los cambios automáticamente y desplegará.
Build time: 3-5 minutos
```

---

## 🔍 Verificar

1. **Ver logs:**  
   Railway → Tu servicio → "Logs"

2. **Acceder a la app:**  
   Railway te dará un dominio como:  
   `https://inmova-app-production.up.railway.app`

3. **Probar login:**  
   - Usuario: `admin@inmova.com`
   - Password: `password`

---

## ⚠️ Errores Comunes

### "DATABASE_URL is not defined"
✅ Verifica que `DATABASE_URL=${{Postgres.DATABASE_URL}}` esté en Variables

### "Module not found: @prisma/client"
✅ Railway ejecuta `prisma generate` automáticamente  
Si persiste: Settings → Build Command → `yarn build`

### Build Timeout
✅ Poco probable con nuestra configuración (0 páginas estáticas)  
Verifica que `.railwayignore` excluye `node_modules` y `.next`

---

## 📚 Documentación Completa

Para detalles avanzados, ver:
- `GUIA_DEPLOYMENT_RAILWAY.md` (guía completa)
- `RAILWAY_ENV_TEMPLATE.txt` (todas las variables opcionales)

---

## 💰 Costos

**Railway Hobby Plan:**
- ~$15-20/mes total (app + PostgreSQL)
- Incluye base de datos
- Sin límite de build time

**vs Vercel:**
- Vercel: $20/mes + build minutes
- Railway: más predecible y con BD incluida

---

## 🎉 ¡Listo!

Una vez que veas **"Success" (verde)** en Railway:
1. Accede al dominio proporcionado
2. Prueba el login
3. Verifica el dashboard

**Total: 5 minutos desde login hasta app funcionando** 🚀
