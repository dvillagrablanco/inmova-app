# 🚂 CÓMO CAMBIAR ROOT DIRECTORY EN RAILWAY

**PROBLEMA ACTUAL:**
```
root directory set as 'nextjs_space/nextjs_space'  ❌
```

**DEBE SER:**
```
Root Directory: (vacío) ✅
```

---

## 📱 INSTRUCCIONES PASO A PASO (3 MINUTOS)

### **Paso 1: Abre Railway**
1. Ve a [https://railway.app](https://railway.app)
2. Haz login
3. Selecciona tu proyecto INMOVA

### **Paso 2: Encuentra Settings**
1. Verás tu servicio/deployment
2. Click en el nombre del servicio
3. En la parte superior, verás varias pestañas:
   - Deployments
   - Metrics
   - **Settings** ⚙️ ← CLICK AQUÍ

### **Paso 3: Busca Root Directory**
1. En la página de Settings, desplázate hacia abajo
2. Busca una sección que diga:
   - **"Build"** o
   - **"Source"** o
   - **"Configuration"**
3. Dentro verás un campo:
   ```
   Root Directory: nextjs_space/nextjs_space
   ```

### **Paso 4: Borra el Valor**
1. Click en el campo **Root Directory**
2. **BORRA TODO** el texto (`nextjs_space/nextjs_space`)
3. Deja el campo **COMPLETAMENTE VACÍO**
4. Verás algo como:
   ```
   Root Directory: [          ]
   ```

### **Paso 5: Guarda y Redeploy**
1. Click en **"Save"** o el botón equivalente
2. Busca un botón que diga **"Redeploy"** o **"Trigger Deploy"**
3. Click para iniciar un nuevo deployment

---

## 🎯 RESULTADO ESPERADO

Una vez guardado, Railway:
1. ✅ Construirá desde la raíz del repositorio
2. ✅ Encontrará `package.json` en la raíz
3. ✅ Usará `next.config.js` simplificado
4. ✅ Build exitoso
5. ✅ Deployment exitoso

---

## 📸 CAPTURAS DE REFERENCIA

### Así se ve Settings en Railway:
```
┌─────────────────────────────────────────┐
│  Settings  ⚙️                           │
├─────────────────────────────────────────┤
│                                         │
│  Build                                  │
│  ─────────────────────────────────────  │
│  Builder: NIXPACKS                      │
│                                         │
│  Root Directory                         │
│  ┌────────────────────────────────────┐ │
│  │ nextjs_space/nextjs_space          │ │ ← BORRA ESTO
│  └────────────────────────────────────┘ │
│                                         │
│  [Save Changes]                         │
└─────────────────────────────────────────┘
```

### Así debe quedar:
```
┌─────────────────────────────────────────┐
│  Settings  ⚙️                           │
├─────────────────────────────────────────┤
│                                         │
│  Build                                  │
│  ─────────────────────────────────────  │
│  Builder: NIXPACKS                      │
│                                         │
│  Root Directory                         │
│  ┌────────────────────────────────────┐ │
│  │                                    │ │ ← VACÍO ✅
│  └────────────────────────────────────┘ │
│                                         │
│  [Save Changes]                         │
└─────────────────────────────────────────┘
```

---

## ❓ SI NO ENCUENTRAS "ROOT DIRECTORY"

Busca estas alternativas:
- **"Source Directory"**
- **"Working Directory"**
- **"Base Directory"**
- **"Project Root"**

Todos significan lo mismo.

---

## 🆘 SI AÚN NO LO ENCUENTRAS

1. En Railway Settings, busca cualquier campo que tenga: `nextjs_space/nextjs_space`
2. Bórralo
3. Guarda

---

## ✅ VERIFICACIÓN

Después de cambiar y redeploy, los logs deberían mostrar:
```
✅ root directory set as '.'  o  'root directory not set'
✅ found 'package.json' at root
✅ yarn install
✅ yarn build
✅ Build successful
```

**NO debe decir:**
```
❌ root directory set as 'nextjs_space/nextjs_space'
```

---

## 🎉 ¡ESO ES TODO!

Con el Root Directory vacío, Railway construirá correctamente desde la raíz y el deployment será exitoso.

**Tiempo estimado:** 3 minutos  
**Dificultad:** Muy fácil  
**Resultado:** Deployment exitoso ✅
