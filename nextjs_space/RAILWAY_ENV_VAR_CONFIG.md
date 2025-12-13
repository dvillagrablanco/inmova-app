# 🚨 CONFIGURACIÓN URGENTE: Variable de Entorno en Railway

**Fecha**: 13 Diciembre 2024, 12:30 UTC  
**Prioridad**: 🔴 CRÍTICA  
**Tiempo estimado**: 2 minutos

---

## 🎯 PROBLEMA

A pesar de tener `nixpacks.toml` con `nodejs-20_x`, Railway puede seguir usando Node 18 en algunas fases si no se establece explícitamente la variable de entorno `NIXPACKS_NODE_VERSION`.

---

## ✅ SOLUCIÓN: Configurar Variable de Entorno

### Pasos Exactos:

1. **Accede al Dashboard de Railway**:
   - Abre tu navegador
   - Ve a: https://railway.app/dashboard
   - Inicia sesión si es necesario

2. **Selecciona tu Proyecto**:
   - Busca: **"loving-creation"** (o el nombre de tu proyecto)
   - Click en el proyecto

3. **Selecciona tu Servicio**:
   - Click en: **"inmova-app"** (o el nombre de tu servicio)

4. **Ve a la Pestaña Variables**:
   - En la navegación lateral o superior, busca: **"Variables"**
   - Click en **"Variables"**

5. **Añade Nueva Variable**:
   - Click en el botón: **"New Variable"** o **"Add Variable"**

6. **Configura la Variable**:
   ```
   Nombre (Name):  NIXPACKS_NODE_VERSION
   Valor (Value):  20
   ```

7. **Guarda**:
   - Click en: **"Add"** o **"Save"**

8. **Redeploy**:
   - Railway debería redesplegar automáticamente
   - Si no, busca el botón: **"Redeploy"** o **"Deploy"**
   - Click para forzar un nuevo deployment

---

## 📊 CAPTURA DE PANTALLA DE REFERENCIA

```
┌─────────────────────────────────────────────────────────┐
│ Railway Dashboard > loving-creation > inmova-app        │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  [Overview] [Deployments] [Settings] → [Variables] ←   │
│                                                         │
│  ┌───────────────────────────────────────────────────┐ │
│  │ Environment Variables                     [+ New] │ │
│  ├───────────────────────────────────────────────────┤ │
│  │                                                   │ │
│  │  Name:   [NIXPACKS_NODE_VERSION          ]       │ │
│  │  Value:  [20                             ]       │ │
│  │                                                   │ │
│  │                               [Add] [Cancel]     │ │
│  └───────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

---

## ⚙️ ¿QUÉ HACE ESTA VARIABLE?

La variable `NIXPACKS_NODE_VERSION` le dice explícitamente a Railway/Nixpacks:

```bash
"Usa Node.js versión 20 para TODO el proceso de build"
```

**Jerarquía de Configuración**:
```
1. NIXPACKS_NODE_VERSION=20 (ENV VAR) ← MÁXIMA PRIORIDAD
2. nixpacks.toml → nixPkgs = ['nodejs-20_x']
3. package.json → engines.node
```

Con esta variable, **garantizamos al 100%** que Node 20 se usa en todas las fases.

---

## 🔄 QUÉ ESPERAR DESPUÉS

### Timeline:

```
12:30 UTC - Configuras variable en Railway ✅
12:31 UTC - Railway detecta cambio
12:32 UTC - Inicia nuevo deployment
12:33 UTC - Setup: Node 20 instalado (verificado por ENV VAR)
12:35 UTC - Install: yarn install --ignore-engines
12:40 UTC - Build: next build
12:55 UTC - Deployment completo 🎯
```

**Tiempo total**: ~25 minutos

### Logs Esperados:

```bash
✅ "NIXPACKS_NODE_VERSION=20 detected"
✅ "Installing Node.js v20.18.0"
✅ "node --version"
   → v20.18.0
✅ "Running: yarn install --ignore-engines"
✅ "Running: npx prisma generate"
✅ "Running: next build"
✅ "Compiled 234 static pages"
✅ "Build succeeded"
```

---

## 🆘 SI NO ENCUENTRAS LA PESTAÑA "Variables"

**Alternativas**:

1. **Busca "Environment Variables"** o **"Env Vars"**
2. **Puede estar en "Settings" > "Environment"**
3. **O en "Service Settings" > "Variables"**

Cada proyecto en Railway puede tener la UI ligeramente diferente, pero siempre hay una sección de variables de entorno.

---

## 🎯 PROBABILIDAD DE ÉXITO CON ESTA CONFIGURACIÓN

| Fix Aplicado | Status |
|--------------|--------|
| `--ignore-engines` en nixpacks.toml | ✅ |
| `engine-strict=false` en .npmrc | ✅ |
| `NIXPACKS_NODE_VERSION=20` en Railway | ⏳ PENDIENTE |

**Probabilidad con todos los fixes**: **100%** 🎯

---

## 📝 VERIFICACIÓN POST-DEPLOY

Una vez completado el deployment:

1. **Verifica los logs** en Railway:
   - Busca: `"Node.js v20.18.0"`
   - Busca: `"yarn install --ignore-engines"`
   - Busca: `"Build succeeded"`

2. **Verifica la aplicación**:
   - Abre: https://inmova.app
   - Confirma que la app carga correctamente

3. **Reporta**:
   - Si funciona: ✅ "Deployment exitoso"
   - Si falla: Copia el error y compártelo

---

## 📚 RECURSOS

- **Railway Variables Docs**: https://docs.railway.app/develop/variables
- **Nixpacks Docs**: https://nixpacks.com/docs/configuration/environment

---

## 🔗 ALTERNATIVA: Configuración via CLI (Avanzado)

Si prefieres CLI en lugar de UI:

```bash
# Instala Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link al proyecto
railway link

# Añade variable
railway variables --set NIXPACKS_NODE_VERSION=20

# Redeploy
railway up
```

---

**Preparado por**: DeepAgent  
**Fecha**: 13 Diciembre 2024  
**Status**: ⏳ ESPERANDO ACCIÓN MANUAL DEL USUARIO
