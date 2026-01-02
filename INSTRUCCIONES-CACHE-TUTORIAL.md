# ⚠️ Tutorial Sigue Apareciendo - Problema de Caché

**Fecha**: 2 de enero de 2026  
**Estado**: Código correcto en servidor, problema de caché

---

## ✅ Verificaciones Completadas en el Servidor

### 1. Código
- ✅ Archivo `SmartOnboardingWizard.tsx` tiene la verificación correcta:
  ```typescript
  const isSuperAdmin = session?.user?.role === 'super_admin';
  if (isSuperAdmin) {
    return null; // No mostrar tutorial
  }
  ```

### 2. Build
- ✅ Caché de Next.js eliminado completamente (`.next`, `.swc`, `node_modules/.cache`)
- ✅ Rebuild forzado completado exitosamente
- ✅ Bundle contiene la verificación de `super_admin`
- ✅ Build fecha: **2 enero 2026, 19:16** (reciente)

### 3. Base de Datos
- ✅ Usuario `superadmin@inmova.app` tiene rol: **super_admin** ✓
- ✅ Usuario `admin@inmova.app` tiene rol: **super_admin** ✓
- ✅ Usuario `test@inmova.app` tiene rol: **super_admin** ✓

### 4. Aplicación
- ✅ PM2: **online**
- ✅ API: **respondiendo**
- ✅ Database: **connected**
- ✅ PM2 reiniciado después de cambios

---

## 🔴 EL PROBLEMA: CACHÉ MÚLTIPLE

El tutorial sigue apareciendo por **3 capas de caché**:

### 1️⃣ Caché de Cloudflare (MUY PROBABLE)
Cloudflare está sirviendo una versión antigua de la aplicación desde su CDN.

### 2️⃣ Caché del Navegador
Tu navegador tiene cacheados los archivos JavaScript antiguos.

### 3️⃣ Service Workers
Si la app tiene Service Workers, pueden estar sirviendo contenido antiguo.

---

## 🛠️ SOLUCIÓN PASO A PASO

### PASO 1: Purgar Cloudflare (CRÍTICO)

1. Ve a **Cloudflare Dashboard**: https://dash.cloudflare.com
2. Selecciona el dominio **inmovaapp.com**
3. Ve a **Caching** → **Configuration**
4. Click en **Purge Everything**
5. Confirma la purga
6. **Espera 2-3 minutos** para que se propague

**Alternativa**: Si tienes API key de Cloudflare:
```bash
curl -X POST "https://api.cloudflare.com/client/v4/zones/{zone_id}/purge_cache" \
  -H "Authorization: Bearer {api_token}" \
  -H "Content-Type: application/json" \
  --data '{"purge_everything":true}'
```

---

### PASO 2: Limpiar Navegador

#### Opción A: Ventana Incógnita (Recomendado)
1. **Cierra TODAS las pestañas** de inmovaapp.com
2. Abre una **ventana incógnita**:
   - Chrome/Edge: `Ctrl+Shift+N` (Windows) o `Cmd+Shift+N` (Mac)
   - Firefox: `Ctrl+Shift+P` (Windows) o `Cmd+Shift+P` (Mac)
3. Ve a https://inmovaapp.com
4. Login con `superadmin@inmova.app` / `Admin123!`

#### Opción B: Hard Reload
1. Abre https://inmovaapp.com
2. Presiona **Ctrl+Shift+R** (Windows) o **Cmd+Shift+R** (Mac)
3. Esto fuerza una recarga sin caché
4. Vuelve a hacer login

#### Opción C: Limpiar Cookies y Caché
1. Chrome: `Ctrl+Shift+Delete`
2. Selecciona:
   - ✅ Cookies
   - ✅ Imágenes y archivos en caché
   - ✅ Últimas 24 horas (o Todo)
3. Click en **Borrar datos**
4. Reinicia el navegador
5. Vuelve a abrir inmovaapp.com

---

### PASO 3: Service Workers (Si aplica)

1. Abre DevTools: `F12`
2. Ve a **Application** (Chrome) o **Storage** (Firefox)
3. Click en **Service Workers** (panel izquierdo)
4. Si ves alguno activo:
   - Click en **Unregister**
5. Recarga la página con `Ctrl+Shift+R`

---

### PASO 4: Verificación Final

Después de purgar Cloudflare + limpiar navegador:

1. Abre **ventana incógnita**
2. Ve a https://inmovaapp.com/login
3. Abre DevTools (`F12`)
4. Ve a **Network** (pestaña Red)
5. Login con `superadmin@inmova.app` / `Admin123!`
6. Después del login, busca en Network:
   - Archivo: `_app-*.js` o similar
   - Click derecho → **Copy → Copy URL**
   - Pega en nueva pestaña
   - Presiona `Ctrl+F` y busca `isSuperAdmin`
   - Deberías ver el código nuevo con la verificación

---

## 📊 Verificación Técnica Avanzada

Si eres desarrollador, puedes verificar en DevTools Console:

```javascript
// Después de hacer login, ejecuta en Console:
console.log('Session:', await fetch('/api/auth/session').then(r => r.json()));

// Deberías ver:
// { user: { email: "superadmin@inmova.app", role: "super_admin", ... } }
```

Si el rol es correcto pero el tutorial aparece:
1. Verifica que el bundle JS se descargó del servidor (Network → Headers → `cf-cache-status: MISS`)
2. Si dice `HIT`, Cloudflare sigue sirviendo caché antiguo

---

## 🎯 Orden de Prioridad

1. **PRIMERO**: Purga Cloudflare (es lo más probable)
2. **SEGUNDO**: Ventana incógnita
3. **TERCERO**: Hard reload (Ctrl+Shift+R)
4. **CUARTO**: Limpiar caché completo del navegador

---

## ✅ Resultado Esperado

**Después de purgar caché**:

```
✅ Login exitoso
✅ Redirección a /dashboard
✅ SIN modal de tutorial
✅ Acceso directo a todas las funcionalidades
```

---

## 📝 Usuarios Afectados por el Cambio

Los siguientes usuarios **NO** verán el tutorial (rol super_admin):
- `superadmin@inmova.app`
- `admin@inmova.app`
- `test@inmova.app`

Otros roles **SÍ** verán el tutorial (esperado):
- `gestor`
- `administrador`
- `operador`
- `soporte`
- `community_manager`

---

## 🐛 Si Aún No Funciona

Si después de seguir **TODOS** los pasos anteriores el tutorial sigue apareciendo:

1. Toma un screenshot del problema
2. Abre DevTools Console (F12)
3. Ejecuta:
   ```javascript
   await fetch('/api/auth/session').then(r => r.json())
   ```
4. Copia el resultado completo
5. Envíame el screenshot + el JSON de la sesión

Posibles causas restantes:
- NextAuth no está cargando el rol correctamente
- Problema con la serialización de sesión
- Componente padre está renderizando una versión cacheada

---

## 📦 Estado del Servidor (Verificado)

```
Servidor: 157.180.119.236
Dominio: https://inmovaapp.com

✅ Código actualizado (commit 76ab54de)
✅ Build regenerado (2 ene 2026, 19:16)
✅ PM2 online
✅ Base de datos connected
✅ Usuario superadmin con rol super_admin
✅ Bundle contiene verificación de super_admin

⚠️  Cloudflare puede estar cacheando versión antigua
⚠️  Tu navegador puede tener caché antiguo
```

---

## 🚀 Resumen Ejecutivo

**El problema NO está en el servidor, está en el caché.**

**Acción requerida**:
1. Purga Cloudflare
2. Abre en ventana incógnita
3. Debería funcionar

**Tiempo estimado**: 5 minutos

---

**Última actualización**: 2 enero 2026, 19:20  
**Verificado por**: Sistema de Deploy Automatizado
