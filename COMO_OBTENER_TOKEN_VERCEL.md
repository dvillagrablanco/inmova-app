# 🔑 Cómo Obtener un Token de Vercel

## Paso a Paso (5 minutos)

### 1️⃣ Accede a la página de tokens

Abre este enlace en tu navegador:
```
https://vercel.com/account/tokens
```

O manualmente:
1. Ve a https://vercel.com
2. Haz clic en tu avatar (esquina superior derecha)
3. Settings
4. Tokens (en el menú lateral izquierdo)

---

### 2️⃣ Inicia Sesión

Si no has iniciado sesión:
- **Email**: `dvillagra@vidaroinversiones.com`
- **User ID**: `pAzq4g0vFjJlrK87sQhlw08I`

---

### 3️⃣ Crea un Nuevo Token

1. Haz clic en el botón **"Create Token"** o **"Create"**
2. Se abrirá un formulario

---

### 4️⃣ Configura el Token

Completa los siguientes campos:

**Token Name (Nombre del token)**:
```
inmova-deployment
```
O cualquier nombre descriptivo como:
- `inmova-production`
- `github-actions`
- `ci-cd-token`

**Scope (Alcance)**:
- Selecciona: **"Full Account"** 
- Esto da acceso completo para deployment

**Expiration (Expiración)** - Opcional:
- Recomendado: **No Expiration** (sin expiración)
- O selecciona un período específico si prefieres

---

### 5️⃣ Genera el Token

1. Haz clic en **"Create Token"** o **"Generate"**
2. ⚠️ **IMPORTANTE**: El token se mostrará UNA SOLA VEZ
3. Verás algo como:
   ```
   vercel_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

---

### 6️⃣ Copia el Token

**🚨 MUY IMPORTANTE 🚨**

1. **COPIA EL TOKEN AHORA** - No podrás verlo después
2. Cópialo completamente (empieza con `vercel_`)
3. Guárdalo en un lugar seguro temporalmente

Ejemplo de token:
```
vercel_1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t
```

---

### 7️⃣ Usa el Token

Una vez que tengas el token, ejecútalo en tu terminal:

```bash
# Configura el token como variable de entorno
export VERCEL_TOKEN=vercel_tu_token_aqui

# Verifica que se configuró correctamente
echo $VERCEL_TOKEN

# Ahora despliega con el script rápido
cd /workspace
./deploy-now.sh
```

O despliega directamente:
```bash
vercel --token="vercel_tu_token_aqui" --yes
vercel --prod --token="vercel_tu_token_aqui" --yes
```

---

## 🔒 Seguridad del Token

### ✅ Buenas Prácticas:

1. **Nunca compartas el token públicamente**
2. **No lo subas a Git** (.gitignore lo excluye)
3. **Usa variables de entorno** en lugar de escribirlo en código
4. **Revoca tokens antiguos** que ya no uses
5. **Crea tokens específicos** para diferentes propósitos

### ❌ Nunca hagas esto:

```javascript
// ❌ MAL - No hagas esto
const token = "vercel_1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p";
```

```bash
# ❌ MAL - No hagas esto
git add .env
git commit -m "Add token"
```

### ✅ Haz esto en su lugar:

```bash
# ✅ BIEN - Usa variable de entorno
export VERCEL_TOKEN=tu_token
./deploy-now.sh
```

```bash
# ✅ BIEN - Para GitHub Actions
# Añade el token como Secret en GitHub
# Settings → Secrets → New repository secret
```

---

## 🔄 Revocar un Token

Si necesitas revocar un token (porque se filtró o ya no lo usas):

1. Ve a https://vercel.com/account/tokens
2. Encuentra el token en la lista
3. Haz clic en los tres puntos (...) al lado del token
4. Selecciona **"Delete"** o **"Revoke"**
5. Confirma la acción

---

## 📋 Tokens para Diferentes Usos

### Token de Producción:
```
Nombre: inmova-production
Scope: Full Account
Expiration: No expiration
Uso: Deployments manuales de producción
```

### Token de CI/CD:
```
Nombre: github-actions-inmova
Scope: Full Account
Expiration: No expiration
Uso: GitHub Actions deployments automáticos
```

### Token de Desarrollo:
```
Nombre: inmova-dev
Scope: Full Account
Expiration: 90 days
Uso: Deployments de prueba locales
```

---

## 🆘 Problemas Comunes

### "Token not found"
- El token fue mal copiado
- Asegúrate de copiar el token completo (empieza con `vercel_`)

### "Token expired"
- El token caducó
- Crea uno nuevo sin expiración

### "Invalid token"
- El token fue revocado
- Crea un nuevo token

### "Unauthorized"
- El token no tiene los permisos necesarios
- Crea un nuevo token con "Full Account" scope

---

## ✅ Resumen Rápido

1. **Abre**: https://vercel.com/account/tokens
2. **Click**: "Create Token"
3. **Nombre**: `inmova-deployment`
4. **Scope**: Full Account
5. **Expiration**: No expiration
6. **Copia**: El token generado (empieza con `vercel_`)
7. **Usa**: `export VERCEL_TOKEN=tu_token`
8. **Despliega**: `./deploy-now.sh`

---

## 🎯 Siguiente Paso

Una vez que tengas el token:

```bash
# 1. Configura el token
export VERCEL_TOKEN=vercel_tu_token_completo_aqui

# 2. Despliega
cd /workspace
./deploy-now.sh

# 3. Configura variables en Vercel Dashboard después
```

---

**¿Necesitas ayuda?** Lee también:
- `AUTH_INSTRUCTIONS.md` - Todas las opciones de autenticación
- `DEPLOYMENT_READY.md` - Guía completa de deployment

---

📅 Última actualización: Diciembre 27, 2024
