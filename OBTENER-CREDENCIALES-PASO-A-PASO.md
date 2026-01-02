# 🔑 Obtener Credenciales de Sentry y Crisp

**Email**: dvillagrab@hotmail.com  
**Password**: Pucela000000#

---

## 1️⃣ Obtener Sentry DSN (5 minutos)

### Paso 1: Iniciar sesión en Sentry

1. Abre en tu navegador: https://sentry.io/auth/login/
2. Introduce:
   - **Email**: `dvillagrab@hotmail.com`
   - **Password**: `Pucela000000#`
3. Click en **"Sign in"**

### Paso 2: Navegar al proyecto

Si ya tienes un proyecto:
- Ve a: **Projects** (menú izquierdo)
- Selecciona tu proyecto (probablemente "javascript-nextjs" o "inmova")

Si NO tienes un proyecto:
1. Click en **"Create Project"** (arriba derecha)
2. Selecciona **"Next.js"**
3. Nombre: `inmova-production`
4. Team: Selecciona el default
5. Click **"Create Project"**

### Paso 3: Obtener el DSN

1. En el proyecto, ve a: **Settings** (⚙️ arriba derecha) → **Projects** → Tu proyecto
2. En el menú izquierdo: **Client Keys (DSN)**
3. Copia el **DSN** (formato: `https://[hash]@[org].ingest.sentry.io/[id]`)

**Ejemplo del formato esperado:**
```
https://a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6@o123456.ingest.sentry.io/1234567
```

---

## 2️⃣ Obtener Crisp Website ID (3 minutos)

### Paso 1: Iniciar sesión en Crisp

1. Abre en tu navegador: https://app.crisp.chat/login/
2. Introduce:
   - **Email**: `dvillagrab@hotmail.com`
   - **Password**: `Pucela000000#`
3. Click en **"Sign in"**

### Paso 2: Crear/seleccionar sitio web

Si ya tienes un sitio:
- Selecciónalo del dashboard

Si NO tienes un sitio:
1. Click en **"Add Website"** o **"+"**
2. Nombre: `Inmova App`
3. Website URL: `https://inmovaapp.com`
4. Click **"Add website"**

### Paso 3: Obtener el Website ID

1. En el dashboard del sitio, ve a: **Settings** (⚙️ esquina inferior izquierda)
2. **Website Settings** → **Setup instructions**
3. En el código de instalación, busca:
   ```javascript
   window.$crisp.push(["safe", true]);
   window.CRISP_WEBSITE_ID = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx";
   ```
4. Copia el **Website ID** (formato UUID)

**Ejemplo del formato esperado:**
```
12345678-abcd-1234-efgh-123456789012
```

---

## 3️⃣ Proporcionar las Credenciales

Una vez que tengas:
- ✅ **Sentry DSN**: `https://...`
- ✅ **Crisp Website ID**: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`

**Pégalos en el chat** con este formato:

```
SENTRY_DSN=https://...
CRISP_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

Y yo los configuraré automáticamente en el servidor.

---

## 🚀 Alternativa: Búsqueda Rápida

### Si ya tienes proyectos configurados:

**Sentry DSN:**
- URL directa: https://sentry.io/settings/[tu-org]/projects/[tu-proyecto]/keys/
- O busca en Sentry: "DSN" o "Client Keys"

**Crisp Website ID:**
- URL directa: https://app.crisp.chat/settings/website/[website-id]/setup
- O en Crisp: Settings → Setup instructions

---

## ⏱️ Tiempo Total: ~8 minutos

- Sentry: 5 min
- Crisp: 3 min

---

**¿Listo?** Copia y pega los valores aquí cuando los tengas. 🚀
