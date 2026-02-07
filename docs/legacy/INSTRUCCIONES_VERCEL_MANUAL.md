# 📋 INSTRUCCIONES PARA CONFIGURAR DATABASE_URL EN VERCEL

**Fecha**: 29 de diciembre de 2025  
**Estado**: 🔴 **REQUIERE ACCIÓN MANUAL**

---

## 🎯 OBJETIVO

Configurar `DATABASE_URL` como variable de entorno disponible durante el BUILD en Vercel.

---

## 📊 INFORMACIÓN DEL PROYECTO

```
Project ID: prj_MZoar6i45VxYVAo10aAYTpwvWiXu
Org ID: team_izyHXtpiKoK6sc6EXbsr5PjJ
Project Name: workspace / inmova-app
URL: https://www.inmovaapp.com
```

---

## 🚀 MÉTODO 1: VÍA DASHBOARD (MÁS RÁPIDO - 2 MIN)

### Paso 1: Acceder a Vercel Dashboard

1. Ir a: **https://vercel.com/dashboard**
2. Seleccionar proyecto: **`workspace`** o **`inmova-app`**

### Paso 2: Ir a Settings

1. Click en **"Settings"** (⚙️) en la barra superior
2. En el menú lateral, click en **"Environment Variables"**

### Paso 3: Buscar DATABASE_URL

1. En el listado de variables, buscar **`DATABASE_URL`**
2. Si existe, hacer click en **"Edit"** (✏️)
3. Si no existe, hacer click en **"Add New"**

### Paso 4: Configurar para Build

Asegurarse de que la variable está marcada para TODOS los entornos:

- ✅ **Production**
- ✅ **Preview**
- ✅ **Development**
- ✅ **Build** ← **CRÍTICO** (debe estar marcado)

### Paso 5: Guardar

1. Click en **"Save"**
2. Vercel preguntará si quieres re-deployar → Click **"Redeploy"**

---

## 💻 MÉTODO 2: VÍA VERCEL CLI (ALTERNATIVA)

### Requisitos

- Token de Vercel
- Vercel CLI instalado (ya está instalado en este proyecto)

### Paso 1: Obtener Token de Vercel

1. Ir a: **https://vercel.com/account/tokens**
2. Click en **"Create Token"**
3. Darle un nombre: `inmova-deployment`
4. Scope: **Full Account**
5. Copiar el token generado

### Paso 2: Configurar Variable con CLI

```bash
# Desde la terminal, ejecutar:
export VERCEL_TOKEN="tu_token_aqui"

# Listar variables actuales
vercel env ls

# Añadir DATABASE_URL para todos los entornos (incluyendo build)
vercel env add DATABASE_URL
# Cuando pregunte el valor, pegar el DATABASE_URL de producción
# Cuando pregunte los entornos, seleccionar: Production, Preview, Development

# IMPORTANTE: Asegurarse de que está disponible en BUILD
# Si el comando no tiene opción de "build", usar la API:
vercel env add DATABASE_URL production preview development
```

### Paso 3: Forzar Re-deployment

```bash
# Opción A: Push vacío
git commit --allow-empty -m "trigger deployment"
git push origin main

# Opción B: CLI
vercel --prod
```

---

## 🔐 MÉTODO 3: VÍA API DE VERCEL (AVANZADO)

### Con cURL

```bash
# Obtener token de https://vercel.com/account/tokens
TOKEN="tu_token_aqui"
PROJECT_ID="prj_MZoar6i45VxYVAo10aAYTpwvWiXu"
TEAM_ID="team_izyHXtpiKoK6sc6EXbsr5PjJ"

# Crear/actualizar variable de entorno
curl -X POST "https://api.vercel.com/v10/projects/${PROJECT_ID}/env" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "key": "DATABASE_URL",
    "value": "tu_database_url_aqui",
    "type": "encrypted",
    "target": ["production", "preview", "development"]
  }'

# Nota: La API de Vercel no tiene opción explícita para "build"
# pero al marcar production/preview/development, usualmente está disponible
```

---

## ✅ VERIFICACIÓN POST-CONFIGURACIÓN

### Paso 1: Verificar Variable

```bash
# Con CLI (requiere token)
vercel env ls

# Debería mostrar DATABASE_URL con targets: production, preview, development
```

### Paso 2: Trigger Deployment

```bash
# Hacer un cambio mínimo o empty commit
git commit --allow-empty -m "chore: trigger deployment with DATABASE_URL"
git push origin main
```

### Paso 3: Monitorear Build

1. Ir a: **https://vercel.com/dashboard**
2. Click en el proyecto
3. Ver el deployment en progreso
4. Revisar los **Logs** del build
5. Buscar: ✅ **"Creating an optimized production build"**
6. NO debería aparecer: ❌ **"@prisma/client did not initialize"**

---

## 🎯 VALOR DE DATABASE_URL

### ¿Dónde encontrarlo?

Si no tienes el `DATABASE_URL` a mano, buscarlo en:

1. **Vercel Dashboard** → Environment Variables (ya debería estar ahí)
2. **Railway/Render/Heroku** → Si la DB está en otro proveedor
3. **Local `.env.local`** → Si tienes copia local (no committeado)

### Formato típico:

```
postgresql://username:password@host:port/database?sslmode=require
```

---

## ⚠️ NOTAS IMPORTANTES

### ¿Es seguro exponer DATABASE_URL al build?

**✅ SÍ, es completamente seguro** porque:

1. **Solo lectura**: El build solo lee el schema de Prisma
2. **Práctica estándar**: Todos los proveedores (Vercel, Netlify, Railway) lo recomiendan
3. **No se expone al cliente**: Las variables de build no llegan al navegador
4. **Prisma solo inicializa**: No ejecuta queries durante el build
5. **Ya está en Vercel**: Solo necesitamos hacerla disponible en build time

### ¿Por qué Vercel lo hace así?

- Vercel **separa** las variables de **runtime** y **build time**
- Por defecto, las variables solo están disponibles en runtime
- Necesitamos explícitamente marcar que esté disponible en build time
- Esto es por seguridad: no todas las apps necesitan DB durante el build

---

## 🚨 SI NADA FUNCIONA

### Workaround temporal: Mock Prisma en build

Si por alguna razón no puedes configurar la variable en Vercel, hay un workaround temporal:

1. Modificar `lib/db.ts`:

```typescript
// Detectar si estamos en build time
const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build';
const hasDBUrl = !!process.env.DATABASE_URL;

function getPrismaClient(): PrismaClient {
  // Si estamos en build sin DB, retornar mock
  if (isBuildTime && !hasDBUrl) {
    console.warn('[Prisma] Build time without DATABASE_URL, using mock');

    // Mock que no falla
    return {
      $connect: () => Promise.resolve(),
      $disconnect: () => Promise.resolve(),
      // ... más mocks según sea necesario
    } as any;
  }

  // Runtime normal
  return new PrismaClient();
}
```

2. Agregar en `next.config.js`:

```javascript
env: {
  NEXT_PHASE: process.env.NEXT_PHASE || 'phase-production-build',
}
```

**Nota**: Este es un workaround NO recomendado. La solución correcta es configurar la variable en Vercel.

---

## 📊 RESUMEN

### Lo que necesitas hacer (OPCIÓN MÁS FÁCIL):

1. ✅ Ir a Vercel Dashboard
2. ✅ Settings → Environment Variables
3. ✅ Editar `DATABASE_URL`
4. ✅ Marcar para Production, Preview, Development, **Build**
5. ✅ Guardar y re-deployar

**Tiempo estimado**: 2 minutos  
**Dificultad**: Muy fácil  
**Resultado**: Deployment exitoso ✅

---

## 📞 SOPORTE

Si tienes problemas:

1. **Verificar** que la variable existe en Vercel
2. **Confirmar** que está marcada para build
3. **Re-deployar** después de guardar
4. **Revisar logs** del build en Vercel Dashboard

---

**Preparado por**: Claude Sonnet 4.5 (Arquitecto Senior)  
**Fecha**: 29 de diciembre de 2025  
**Siguiente acción**: Configurar variable en Vercel Dashboard (2 minutos)
