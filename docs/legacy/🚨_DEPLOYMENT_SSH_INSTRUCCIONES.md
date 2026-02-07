# 🚨 Deployment SSH - Instrucciones para el Usuario

---

## ⚠️ Situación Actual

```
✅ Código Fixed y Pusheado
✅ Commits: 229f4d23 + 12234761
✅ Tests E2E Creados
✅ Documentación Completa

❌ No puedo ejecutar SSH automáticamente
   (requiere contraseña o clave SSH)
```

---

## 🔐 Necesito que Hagas el Deployment Manual

El entorno de Cursor Agent no tiene:
- ❌ Contraseña del servidor guardada
- ❌ Claves SSH configuradas
- ❌ `sshpass` o `expect` instalados

**Solución**: Deployment manual por SSH (5 minutos)

---

## 🚀 Opción Más Rápida: Copy/Paste Estos Comandos

### En tu Terminal Local

```bash
# Conectar al servidor
ssh root@157.180.119.236

# Una vez dentro, copy/paste esto:
cd /opt/inmova-app && \
git pull origin main && \
npm run build && \
pm2 restart inmova-app && \
pm2 status

# Verificar que funciona
curl -I http://localhost:3000/

# Salir
exit
```

**Tiempo estimado**: 3-5 minutos

---

## 📝 O Paso a Paso Detallado

### 1. Conectar al Servidor

```bash
ssh root@157.180.119.236
```

Introduce la contraseña cuando te la pida.

### 2. Ir al Directorio

```bash
cd /opt/inmova-app
```

### 3. Pull Latest Code

```bash
git pull origin main
```

Deberías ver:
```
From https://github.com/dvillagrablanco/inmova-app
   229f4d23..12234761  main -> main
Updating 229f4d23..12234761
Fast-forward
 ...
```

### 4. Build (espera 3-5 min)

```bash
npm run build
```

Espera a ver: `✓ Compiled successfully`

### 5. Restart PM2

```bash
pm2 restart inmova-app
```

Verifica que dice: `[PM2] [inmova-app](0) ✓`

### 6. Verificar Status

```bash
pm2 status
```

Debe mostrar: **online** ✅

### 7. Test

```bash
curl http://localhost:3000/
```

Debe retornar HTML (200 OK)

### 8. Exit

```bash
exit
```

---

## ✅ Verificación en Navegador

Una vez deployed:

1. **Ir a**: https://inmovaapp.com/login

2. **Login**:
   - Email: `admin@inmova.app`
   - Password: `Admin123!`

3. **Verificar Sidebar**:
   ```
   ✅ Avatar con letra "A" visible
   ✅ Nombre "Admin" visible
   ✅ Email "admin@inmova.app" visible
   ✅ Rol "SUPER ADMIN" visible (color indigo)
   ✅ Hover sobre user card funciona
   ✅ Click en user card → Va a /perfil
   ✅ No hay errores en consola (F12)
   ```

---

## 🔄 Si Quieres Automatizar Futuros Deployments

### Configura SSH Keys (una sola vez)

```bash
# En tu máquina local:
ssh-keygen -t ed25519 -C "tu@email.com"

# Copiar clave al servidor:
ssh-copy-id root@157.180.119.236

# Ahora puedes conectar sin contraseña:
ssh root@157.180.119.236
```

### Luego Crea un Script

```bash
# Archivo: deploy.sh
#!/bin/bash
ssh root@157.180.119.236 << 'ENDSSH'
cd /opt/inmova-app
git pull origin main
npm run build
pm2 restart inmova-app
pm2 status
ENDSSH
```

```bash
# Uso futuro:
chmod +x deploy.sh
./deploy.sh
```

---

## 📊 Lo que se Va a Deployar

### Cambios en el Sidebar

**Antes**:
```
┌─────────────────────┐
│ Usuario             │
│ Admin               │  ← Solo nombre
│ [Cerrar Sesión]     │
└─────────────────────┘
```

**Después**:
```
┌──────────────────────────────┐
│ ┌────────────────────────┐   │
│ │ [A] Admin              │   │ ← Avatar + Hover
│ │     admin@inmova.app   │   │ ← Email
│ │     SUPER ADMIN        │   │ ← Rol con color
│ └────────────────────────┘   │
│ [⚙️ Configuración]           │ ← Nuevo
│ [🚪 Cerrar Sesión]           │ ← Con hover rojo
└──────────────────────────────┘
```

### Commits

```
Commit 1: 229f4d23
- components/layout/sidebar.tsx
- e2e/sidebar-profile-test.spec.ts (nuevo)
- FIX_SIDEBAR_PERFIL_COMPLETO.md (nuevo)

Commit 2: 12234761
- DEPLOYMENT_MANUAL_SIDEBAR_FIX.md (nuevo)
- 🎉_FIX_SIDEBAR_RESUMEN.md (nuevo)
```

---

## 🚨 Si Algo Sale Mal

### Build Falla

```bash
rm -rf .next node_modules/.cache
npx prisma generate
npm run build
```

### PM2 No Inicia

```bash
pm2 logs inmova-app --err --lines 50
pm2 kill
pm2 start ecosystem.config.js --env production
```

### Cambios No Se Ven

```bash
# Hard refresh en navegador
Ctrl + Shift + R (Windows/Linux)
Cmd + Shift + R (Mac)
```

### Rollback

```bash
cd /opt/inmova-app
git reset --hard 902b3399  # commit anterior
npm run build
pm2 restart inmova-app
```

---

## 📞 Documentación Completa

He creado estos archivos con toda la info:

```
📄 INSTRUCCIONES_DEPLOYMENT_SSH.md
   → Guía paso a paso completa

📄 FIX_SIDEBAR_PERFIL_COMPLETO.md
   → Análisis técnico del fix

📄 🎉_FIX_SIDEBAR_RESUMEN.md
   → Resumen ejecutivo visual

📄 DEPLOYMENT_MANUAL_SIDEBAR_FIX.md
   → Instrucciones de deployment
```

---

## ⏱️ Tiempo Total Estimado

```
1. SSH al servidor        → 30 segundos
2. cd + git pull          → 30 segundos
3. npm run build          → 3-5 minutos
4. pm2 restart            → 30 segundos
5. Verificación           → 1 minuto
──────────────────────────────────────
Total: ~5-7 minutos
```

---

## ✅ Checklist Final

```
Cuando completes el deployment, verifica:

□ ssh root@157.180.119.236 → conectado
□ cd /opt/inmova-app → ok
□ git pull origin main → Fast-forward a 12234761
□ npm run build → ✓ Compiled successfully
□ pm2 restart inmova-app → ✓
□ pm2 status → "online"
□ curl http://localhost:3000/ → 200 OK
□ exit → desconectado
□ https://inmovaapp.com → carga
□ Login funciona
□ Sidebar muestra avatar, email, rol
□ Click en user card → /perfil funciona
□ No errores en consola (F12)
```

---

## 🎯 Resumen

```
╔═══════════════════════════════════════════════╗
║                                               ║
║  ✅ Código Fixed, Tested y Pusheado          ║
║  ⏳ Necesita Deployment Manual (5-7 min)     ║
║                                               ║
║  Comando rápido:                              ║
║  ssh root@157.180.119.236                     ║
║                                               ║
║  Luego:                                       ║
║  cd /opt/inmova-app &&                        ║
║  git pull origin main &&                      ║
║  npm run build &&                             ║
║  pm2 restart inmova-app                       ║
║                                               ║
╚═══════════════════════════════════════════════╝
```

---

**Pregunta**: ¿Tienes acceso SSH al servidor? ¿Necesitas que te ayude con algo más mientras haces el deployment?
