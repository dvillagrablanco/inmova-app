# 📦 Deployment Manual - Fix Sidebar Perfil

**Fecha**: 30 de diciembre de 2025  
**Commit**: `229f4d23`  
**Branch**: `main`

---

## ✅ Cambios Ya Commiteados

```bash
✅ Git add completed
✅ Git commit completed: 229f4d23
✅ Git push to main completed
```

**Archivos modificados**:

- `components/layout/sidebar.tsx` → Fix completo del perfil
- `e2e/sidebar-profile-test.spec.ts` → Tests E2E (nuevo)
- `FIX_SIDEBAR_PERFIL_COMPLETO.md` → Documentación (nuevo)

---

## 🚀 Deployment al Servidor

### Opción 1: SSH Manual

```bash
# 1. Conectar al servidor
ssh root@157.180.119.236

# 2. Navegar al directorio
cd /opt/inmova-app

# 3. Pull latest code
git pull origin main

# 4. Build (tarda ~3-5 minutos)
npm run build

# 5. Restart PM2
pm2 restart inmova-app

# 6. Verificar status
pm2 status
pm2 logs inmova-app --lines 50

# 7. Exit
exit
```

### Opción 2: Script Automatizado

Si tienes las credenciales SSH actualizadas:

```bash
./deploy.sh
```

O usa el script Python con credenciales correctas.

---

## ✅ Verificación Post-Deployment

### 1. Health Check del Servidor

```bash
# Verificar que la app está corriendo
curl https://inmovaapp.com/api/health

# Esperado: {"status": "ok"}
```

### 2. Test Manual en Browser

```
1. Ir a: https://inmovaapp.com/login

2. Login con:
   Email: admin@inmova.app
   Password: Admin123!

3. Verificar sidebar:
   ✅ Avatar con inicial "A" visible
   ✅ Nombre "Admin" visible
   ✅ Email "admin@inmova.app" visible
   ✅ Rol "SUPER ADMIN" visible (color indigo)
   ✅ Hover sobre user card funciona
   ✅ Click en user card → Va a /perfil
   ✅ No hay errores en consola (F12)
```

### 3. Test Automatizado

```bash
# Ejecutar tests E2E
npx playwright test e2e/sidebar-profile-test.spec.ts

# Esperado: ✅ 5/5 tests passing
```

---

## 🔧 Si Hay Problemas

### Problema 1: Build Fails

```bash
# Limpiar cache y rebuild
cd /opt/inmova-app
rm -rf .next node_modules/.cache
npx prisma generate
npm run build
```

### Problema 2: PM2 No Inicia

```bash
# Verificar logs
pm2 logs inmova-app --err

# Kill y restart
pm2 kill
pm2 start ecosystem.config.js --env production
pm2 save
```

### Problema 3: Cambios No Se Ven

```bash
# Hard refresh en browser
Ctrl + Shift + R (Windows/Linux)
Cmd + Shift + R (Mac)

# O limpiar cache de Cloudflare
# (desde dashboard de Cloudflare → Purge Everything)
```

---

## 📊 Resumen de Cambios Deployados

```
Commit: 229f4d23
Author: Cursor Agent
Date:   2025-12-30

🔧 Fix completo sidebar perfil: Avatar, email, rol, validaciones

Cambios:
✅ User profile card con avatar, nombre, email, rol
✅ Estados de sesión (loading, auth, unauth)
✅ Validaciones defensivas completas
✅ Link a /perfil y /configuracion
✅ Hover effects profesionales
✅ 5 tests E2E automatizados
✅ Sin errores de JavaScript

Files changed: 3
Insertions: +1068
Deletions:  -17
```

---

## 🎯 Próximos Pasos

### 1. Ejecutar Deployment Manual

```bash
ssh root@157.180.119.236
cd /opt/inmova-app
git pull origin main
npm run build
pm2 restart inmova-app
```

### 2. Verificar Aplicación

```
✅ https://inmovaapp.com funciona
✅ Login funciona
✅ Sidebar muestra perfil completo
✅ No hay errores en consola
```

### 3. Ejecutar Tests

```bash
npx playwright test e2e/sidebar-profile-test.spec.ts
```

---

## ✅ Checklist Final

```
✅ Código commiteado (229f4d23)
✅ Push a main completado
✅ Documentación completa creada
✅ Tests E2E creados

⏳ PENDIENTE: Deployment manual al servidor
```

---

**Nota**: La autenticación SSH falló. Verifica la contraseña del servidor o actualiza las credenciales SSH.

Si necesitas actualizar la contraseña:

1. Accede al panel de Hetzner
2. Obtén la nueva contraseña
3. Actualiza en tus scripts de deployment
