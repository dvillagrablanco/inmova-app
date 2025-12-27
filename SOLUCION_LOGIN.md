# 🔧 Solución: Login No Funciona

**Diagnóstico Realizado:** 27 de Diciembre, 2025

---

## ✅ Lo que SÍ Funciona

Realicé un diagnóstico completo y confirmé que:

| Componente         | Estado       | Verificación                |
| ------------------ | ------------ | --------------------------- |
| PostgreSQL         | ✅ Corriendo | Port 5432 online            |
| Base de datos      | ✅ Existe    | inmova_dev                  |
| Usuario admin      | ✅ Existe    | admin@inmova.app            |
| Contraseña         | ✅ Válida    | Hash bcrypt correcto        |
| Usuario activo     | ✅ Sí        | activo = true               |
| Empresa            | ✅ Existe    | INMOVA Administración       |
| Variables .env     | ✅ OK        | NEXTAUTH_SECRET configurado |
| Test directo login | ✅ PASA      | Autenticación funciona      |

**Test ejecutado:**

```
✅ Usuario encontrado
✅ Contraseña válida
✅ ¡LOGIN EXITOSO!
```

---

## ❓ Posibles Causas del Problema

### 1. 🔴 Servidor No Está Corriendo

**El problema más común:** El servidor de desarrollo no está iniciado.

**Solución:**

```bash
cd /workspace
npm run dev
```

Deberías ver:

```
✓ Ready in X.Xs
○ Local: http://localhost:3000
```

---

### 2. 🔴 Error en el Frontend

Puede haber un error en la consola del navegador.

**Cómo verificar:**

1. Abre el navegador
2. Presiona F12 para abrir DevTools
3. Ve a la pestaña "Console"
4. Intenta hacer login
5. Busca errores en rojo

**Errores comunes:**

- `Failed to fetch` = Servidor no corriendo
- `Network error` = Problema de conexión
- `401 Unauthorized` = Credenciales incorrectas
- `429 Too Many Requests` = Rate limiting (ya corregido)

---

### 3. 🔴 Caché del Navegador

El navegador puede tener caché vieja.

**Solución:**

1. Presiona `Ctrl+Shift+R` (o `Cmd+Shift+R` en Mac)
2. O abre una ventana de incógnito: `Ctrl+Shift+N`

---

### 4. 🔴 Puerto 3000 Ocupado

Otro proceso podría estar usando el puerto 3000.

**Verificar:**

```bash
lsof -i :3000
```

**Solución:**

```bash
# Matar el proceso que usa el puerto
kill -9 $(lsof -t -i:3000)

# Luego reiniciar
npm run dev
```

---

### 5. 🔴 Error en Logs del Servidor

Puede haber errores en la consola del servidor.

**Cómo verificar:**
Cuando ejecutes `npm run dev`, observa los logs en la terminal.

**Busca errores como:**

- `Module not found`
- `Cannot connect to database`
- `Invalid session configuration`
- Stack traces en rojo

---

## 🚀 Pasos para Diagnosticar y Solucionar

### Paso 1: Inicia el Servidor

```bash
cd /workspace
npm run dev
```

**Espera a ver:** `✓ Ready in X.Xs`

---

### Paso 2: Verifica en el Navegador

1. Abre: `http://localhost:3000/login`
2. Verifica que se carga la página
3. Abre DevTools (F12)
4. Ve a la pestaña "Network"

---

### Paso 3: Intenta Loguearte

**Credenciales:**

```
Email: admin@inmova.app
Password: Admin2025!
```

---

### Paso 4: Observa la Consola

**En la pestaña "Network" (F12):**

1. Busca una petición a `/api/auth/callback/credentials`
2. Click en ella
3. Ve a "Response" para ver el error exacto

**En la pestaña "Console":**
Busca cualquier error en rojo.

---

## 🔍 Comandos de Diagnóstico

### Verificar que el servidor responde:

```bash
curl http://localhost:3000/api/auth/session
```

**Respuesta esperada:** JSON con `{"user":null}` o similar

---

### Verificar PostgreSQL:

```bash
sudo service postgresql status
```

**Debe decir:** `online` o `active`

---

### Verificar usuario en BD:

```bash
cd /workspace
node test-login.js
```

**Debe decir:** `✅ ¡LOGIN EXITOSO!`

---

### Ver logs en tiempo real:

```bash
cd /workspace
npm run dev 2>&1 | tee server.log
```

Esto guardará los logs en `server.log` para revisarlos.

---

## 💡 Soluciones Rápidas

### Si ves: "Cannot connect to server"

```bash
# 1. Verifica que el servidor esté corriendo
ps aux | grep "next dev"

# 2. Si no está, inícialo
cd /workspace && npm run dev
```

---

### Si ves: "Invalid credentials"

```bash
# Verifica que estés usando las credenciales correctas
# Email: admin@inmova.app (NO admin@inmova.com)
# Password: Admin2025! (con mayúscula A y signo !)
```

---

### Si ves: "Too many requests"

Espera 60 segundos y vuelve a intentar. (Rate limiting)

---

### Si ves página en blanco:

```bash
# Limpia caché y rebuil

d
rm -rf .next
npm run build
npm run dev
```

---

## 📸 ¿Qué Error Específico Ves?

Por favor, dime:

1. **¿El servidor está corriendo?**
   - ¿Ejecutaste `npm run dev`?
   - ¿Ves el mensaje "Ready"?

2. **¿Qué ves en el navegador?**
   - ¿Se carga la página de login?
   - ¿Aparece algún mensaje de error?
   - ¿Qué pasa cuando haces click en "Iniciar Sesión"?

3. **¿Qué dice la consola del navegador? (F12)**
   - ¿Hay errores en rojo?
   - ¿Qué dice en la pestaña "Network"?

4. **¿Qué dicen los logs del servidor?**
   - ¿Hay errores en la terminal donde ejecutaste `npm run dev`?

---

## 🎯 Próximos Pasos

Basándome en tu respuesta, puedo:

1. ✅ Revisar logs específicos
2. ✅ Corregir errores de configuración
3. ✅ Ajustar la autenticación
4. ✅ Verificar rutas y middleware
5. ✅ Crear script de diagnóstico automatizado

---

**¿Qué mensaje de error específico ves cuando intentas hacer login?**

Comparte:

- Screenshots si es posible
- Mensaje de error exacto
- Qué pasa cuando haces click en "Iniciar Sesión"
