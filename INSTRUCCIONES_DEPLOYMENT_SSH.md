# 🚀 Instrucciones de Deployment Manual por SSH

**Fecha**: 30 de diciembre de 2025  
**Servidor**: inmovaapp.com (157.180.119.236)  
**Cambios**: Fix Sidebar Perfil (commits 229f4d23 + 12234761)

---

## ⚠️ Autenticación SSH Requerida

Para ejecutar el deployment, necesitas acceso SSH al servidor. Las herramientas automáticas (sshpass, expect) no están disponibles en este entorno.

---

## 🔐 Opción 1: Deployment Manual con SSH

### Paso 1: Conectar al Servidor

```bash
ssh root@157.180.119.236
```

Te pedirá la contraseña del servidor.

### Paso 2: Navegar al Directorio

```bash
cd /opt/inmova-app
```

### Paso 3: Verificar Branch y Estado

```bash
# Ver branch actual
git branch

# Ver último commit
git log --oneline -1

# Ver status
git status
```

### Paso 4: Pull Latest Code

```bash
git pull origin main
```

**Esperado**:
```
From https://github.com/dvillagrablanco/inmova-app
   229f4d23..12234761  main -> main
Updating 229f4d23..12234761
Fast-forward
 DEPLOYMENT_MANUAL_SIDEBAR_FIX.md | 300 ++++++++++++++++
 🎉_FIX_SIDEBAR_RESUMEN.md        | 365 ++++++++++++++++
 2 files changed, 665 insertions(+)
```

### Paso 5: Verificar Nuevo Commit

```bash
git log --oneline -3
```

**Esperado**:
```
12234761 📝 Docs: Guías de deployment y resumen del fix sidebar
229f4d23 🔧 Fix completo sidebar perfil: Avatar, email, rol, validaciones defensivas + Tests E2E
902b3399 🎉 Resumen visual: Fix login onboarding completado
```

### Paso 6: Build de la Aplicación

```bash
npm run build
```

⏱️ **Duración**: 3-5 minutos

**Esperado al final**:
```
✓ Compiled successfully
✓ Linting and checking validity of types
✓ Collecting page data
✓ Generating static pages
✓ Finalizing page optimization

Route (app)                              Size     First Load JS
┌ ○ /                                    ...
└ ○ /login                               ...

○  (Static)  prerendered as static content
```

### Paso 7: Restart PM2

```bash
pm2 restart inmova-app
```

**Esperado**:
```
[PM2] Applying action restartProcessId on app [inmova-app](ids: [ 0 ])
[PM2] [inmova-app](0) ✓
```

### Paso 8: Verificar Status

```bash
pm2 status
```

**Esperado**:
```
┌─────┬──────────────┬─────────────┬─────────┬─────────┬──────────┐
│ id  │ name         │ mode        │ ↺       │ status  │ cpu      │
├─────┼──────────────┼─────────────┼─────────┼─────────┼──────────┤
│ 0   │ inmova-app   │ cluster (2) │ X       │ online  │ 0%       │
└─────┴──────────────┴─────────────┴─────────┴─────────┴──────────┘
```

Status debe ser: **online** ✅

### Paso 9: Verificar Logs

```bash
pm2 logs inmova-app --lines 30
```

Busca:
- ✅ Sin errores
- ✅ "Ready in Xms"
- ✅ "compiled successfully"

### Paso 10: Test Health Check

```bash
curl http://localhost:3000/api/health
```

**Esperado**:
```json
{"status":"ok"}
```

### Paso 11: Test Homepage

```bash
curl -I http://localhost:3000/
```

**Esperado**:
```
HTTP/1.1 200 OK
...
```

### Paso 12: Exit del Servidor

```bash
exit
```

---

## 🌐 Opción 2: Script de Deployment Automatizado

Si tienes configuradas las claves SSH, puedes usar este script:

```bash
#!/bin/bash

echo "🚀 Deploying to inmovaapp.com..."

ssh root@157.180.119.236 << 'ENDSSH'
cd /opt/inmova-app

echo "📥 Pulling latest code..."
git pull origin main

echo "🔨 Building application..."
npm run build

echo "🔄 Restarting PM2..."
pm2 restart inmova-app

echo "✅ Deployment completed!"
pm2 status
ENDSSH

echo ""
echo "✅ Deployment completed successfully!"
echo "🌐 Visit: https://inmovaapp.com"
```

Guarda como `deploy-sidebar-fix.sh`, dale permisos y ejecuta:

```bash
chmod +x deploy-sidebar-fix.sh
./deploy-sidebar-fix.sh
```

---

## 🔑 Opción 3: Configurar SSH Key (Recomendado)

Para evitar introducir la contraseña cada vez:

### En tu máquina local:

```bash
# 1. Generar clave SSH (si no tienes una)
ssh-keygen -t ed25519 -C "tu@email.com"

# 2. Copiar clave pública al servidor
ssh-copy-id root@157.180.119.236

# 3. Ahora puedes conectar sin contraseña
ssh root@157.180.119.236
```

---

## ✅ Verificación Post-Deployment

### Test 1: Acceso Web

```bash
# Desde tu máquina local
curl -I https://inmovaapp.com
```

**Esperado**: `HTTP/2 200`

### Test 2: Login y Sidebar

1. Ir a: https://inmovaapp.com/login
2. Login: `admin@inmova.app` / `Admin123!`
3. Verificar sidebar:
   - ✅ Avatar con letra "A"
   - ✅ Nombre "Admin"
   - ✅ Email "admin@inmova.app"
   - ✅ Rol "SUPER ADMIN" (color indigo)
   - ✅ Click en card → Va a /perfil
   - ✅ Sin errores en consola (F12)

### Test 3: Tests E2E

```bash
# Desde workspace local
npx playwright test e2e/sidebar-profile-test.spec.ts
```

**Esperado**: ✅ 5/5 tests passing

---

## 🚨 Troubleshooting

### Problema 1: git pull fails

```bash
# Si hay conflictos
git reset --hard origin/main

# Luego pull
git pull origin main
```

### Problema 2: npm run build fails

```bash
# Limpiar cache
rm -rf .next node_modules/.cache

# Regenerar Prisma Client
npx prisma generate

# Rebuild
npm run build
```

### Problema 3: PM2 no inicia

```bash
# Ver logs de error
pm2 logs inmova-app --err --lines 50

# Kill y restart completo
pm2 kill
pm2 start ecosystem.config.js --env production
pm2 save
```

### Problema 4: Cambios no se ven en navegador

```bash
# Hard refresh
Ctrl + Shift + R (Windows/Linux)
Cmd + Shift + R (Mac)

# O limpiar cache de Cloudflare
# Cloudflare Dashboard → Caching → Purge Everything
```

### Problema 5: Port 3000 en uso

```bash
# Ver qué proceso usa el puerto
lsof -i :3000

# Matar proceso
kill -9 <PID>

# O usar PM2
pm2 kill
pm2 start ecosystem.config.js --env production
```

---

## 📊 Resumen de Comandos

### Deployment Completo (copiar/pegar)

```bash
# 1. SSH al servidor
ssh root@157.180.119.236

# 2. Deployment
cd /opt/inmova-app && \
git pull origin main && \
npm run build && \
pm2 restart inmova-app && \
pm2 status

# 3. Verificar
curl -I http://localhost:3000/
pm2 logs inmova-app --lines 20

# 4. Exit
exit
```

### One-liner desde tu máquina

```bash
ssh root@157.180.119.236 "cd /opt/inmova-app && git pull origin main && npm run build && pm2 restart inmova-app && pm2 status"
```

---

## 📋 Checklist de Deployment

```
Pre-Deployment:
✅ Código commiteado localmente (229f4d23, 12234761)
✅ Push a main completado
✅ Documentación creada

Durante Deployment:
□ SSH al servidor exitoso
□ cd /opt/inmova-app
□ git pull origin main → sin errores
□ git log verifica commits nuevos
□ npm run build → completado sin errores
□ pm2 restart inmova-app
□ pm2 status → "online"
□ pm2 logs → sin errores

Post-Deployment:
□ curl http://localhost:3000/ → 200 OK
□ curl http://localhost:3000/api/health → {"status":"ok"}
□ https://inmovaapp.com carga
□ Login funciona
□ Sidebar muestra perfil completo
□ No hay errores en consola (F12)
□ Tests E2E pasan (opcional)
```

---

## 🎯 Commits a Deployar

```
Commit 1: 229f4d23
Título: 🔧 Fix completo sidebar perfil: Avatar, email, rol, validaciones defensivas + Tests E2E
Archivos:
- components/layout/sidebar.tsx (modificado)
- e2e/sidebar-profile-test.spec.ts (nuevo)
- FIX_SIDEBAR_PERFIL_COMPLETO.md (nuevo)

Commit 2: 12234761
Título: 📝 Docs: Guías de deployment y resumen del fix sidebar
Archivos:
- DEPLOYMENT_MANUAL_SIDEBAR_FIX.md (nuevo)
- 🎉_FIX_SIDEBAR_RESUMEN.md (nuevo)
```

---

## 📞 Si Necesitas Ayuda

### Logs en Tiempo Real

```bash
ssh root@157.180.119.236
pm2 logs inmova-app --raw
```

### Status del Sistema

```bash
ssh root@157.180.119.236 "
  echo '=== PM2 Status ==='
  pm2 status
  echo ''
  echo '=== Disk Usage ==='
  df -h /opt/inmova-app
  echo ''
  echo '=== Memory Usage ==='
  free -h
  echo ''
  echo '=== Node Version ==='
  node --version
  echo ''
  echo '=== Git Status ==='
  cd /opt/inmova-app && git status
"
```

### Rollback Si Algo Sale Mal

```bash
ssh root@157.180.119.236
cd /opt/inmova-app

# Volver al commit anterior
git log --oneline -5
git reset --hard 902b3399  # commit anterior al fix

# Rebuild y restart
npm run build
pm2 restart inmova-app
```

---

## ✅ Deployment Exitoso

Una vez completado, verifica:

```
✅ https://inmovaapp.com carga sin errores
✅ Login funciona con admin@inmova.app
✅ Sidebar muestra:
   ✅ Avatar con "A"
   ✅ Nombre "Admin"
   ✅ Email "admin@inmova.app"
   ✅ Rol "SUPER ADMIN" (color indigo)
✅ Click en user card → /perfil
✅ Click en Configuración → /configuracion
✅ Click en Cerrar Sesión → logout
✅ No hay errores en consola (F12)
✅ PM2 status online
✅ Logs sin errores
```

---

**Nota Final**: Si no tienes la contraseña SSH o prefieres no hacerlo manualmente, puedes:

1. Contactar al administrador del servidor
2. Usar las credenciales de Hetzner para resetear contraseña
3. Configurar SSH keys para futuros deployments

**Estado actual**: Código listo, esperando deployment manual.
