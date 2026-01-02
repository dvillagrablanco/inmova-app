# 🛡️ Instrucciones: Configurar Triada en el Servidor

---

## ✅ Estado Actual

**Servidor preparado exitosamente:**

- ✅ Código actualizado desde GitHub (última versión con Triada)
- ✅ Todos los archivos de código de la Triada presentes (8/8)
- ✅ `.env.production` actualizado con sección de Triada
- ✅ PM2 corriendo correctamente
- ⏳ **Pendiente:** Obtener credenciales de Sentry, Crisp y BetterStack

---

## 🚀 Opción 1: Configuración Interactiva (Recomendado)

### Script Automático

```bash
python3 scripts/configurar-triada-servidor.py
```

**Este script:**
1. Te guía paso a paso para obtener cada credencial
2. Valida el formato de cada una
3. Las configura automáticamente en el servidor
4. Reinicia PM2
5. Verifica que todo funciona

**Duración:** 15 minutos

---

## 🔧 Opción 2: Configuración Manual

### Paso 1: Obtén las Credenciales (15 min)

#### 🔴 Sentry DSN (5 min)

1. **Abre:** https://sentry.io/signup/
2. **Regístrate** con tu email (o GitHub/Google)
3. **Plan:** Selecciona "Developer" (gratis, 5,000 errores/mes)
4. **Crea proyecto:**
   - Click "Create Project"
   - Plataforma: "Next.js"
   - Nombre: "inmova-app"
5. **Copia el DSN** que aparece
   - Formato: `https://[key]@[org].ingest.sentry.io/[id]`
   - Ejemplo: `https://abc123@sentry.ingest.io/12345`

---

#### 💬 Crisp Website ID (5 min)

1. **Abre:** https://crisp.chat/
2. **Regístrate:**
   - Click "Try Crisp Free"
   - Email y password
3. **Completa onboarding:**
   - Nombre del sitio web: "Inmova App"
   - URL: `https://inmovaapp.com`
4. **Obtén el ID:**
   - Settings (⚙️) → Website Settings
   - Click "Setup Instructions"
   - Busca "Website ID"
   - Copia el UUID
   - Formato: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`

---

#### 📊 BetterStack Status Page URL (5 min)

1. **Abre:** https://betterstack.com/uptime
2. **Regístrate:**
   - Click "Start Free"
   - Email y password
3. **Crea Monitor:**
   - Click "Add Monitor"
   - URL: `https://inmovaapp.com/api/health`
   - Name: `Inmova App`
   - Check frequency: `3 minutos`
   - Click "Create Monitor"
4. **Crea Status Page:**
   - Menú lateral → "Status Pages"
   - Click "Create Status Page"
   - Name: `Inmova Status`
   - Selecciona el monitor que creaste
   - Subdomain: `inmova` (o el que prefieras)
   - Click "Create Status Page"
5. **Copia la URL pública:**
   - Ejemplo: `https://inmova.betteruptime.com`

---

### Paso 2: Configura en el Servidor

#### Conectar por SSH

```bash
ssh root@157.180.119.236
# Password: xcc9brgkMMbf
```

#### Editar .env.production

```bash
cd /opt/inmova-app
nano .env.production
```

#### Buscar y Reemplazar

Busca estas líneas al final del archivo:

```env
NEXT_PUBLIC_SENTRY_DSN="PENDIENTE_OBTENER_EN_SENTRY"
NEXT_PUBLIC_CRISP_WEBSITE_ID="PENDIENTE_OBTENER_EN_CRISP"
NEXT_PUBLIC_STATUS_PAGE_URL="PENDIENTE_OBTENER_EN_BETTERSTACK"
```

Reemplázalas con tus credenciales reales:

```env
NEXT_PUBLIC_SENTRY_DSN="https://abc123@sentry.ingest.io/12345"
NEXT_PUBLIC_CRISP_WEBSITE_ID="12345678-1234-1234-1234-123456789abc"
NEXT_PUBLIC_STATUS_PAGE_URL="https://inmova.betteruptime.com"
```

**Guardar:** `Ctrl+O`, Enter, `Ctrl+X`

---

### Paso 3: Reiniciar Aplicación

```bash
pm2 restart inmova-app
```

**Esperar 10 segundos:**

```bash
sleep 10
```

---

### Paso 4: Verificar

```bash
# Health check
curl http://localhost:3000/api/health

# Ver logs
pm2 logs inmova-app --lines 20

# Estado de PM2
pm2 status
```

**Resultado esperado:**

```
{"status":"ok","timestamp":"..."}
```

---

## 🧪 Verificación en Producción

### 1. Abrir en Navegador

```
https://inmovaapp.com
```

---

### 2. Verificar Crisp Chat

- **Busca** el widget en la **esquina inferior derecha**
- Debe aparecer un ícono de chat
- Haz click → Debe abrirse el widget
- Envía un mensaje de prueba

**Si no aparece:**
- Verifica que el Website ID está correcto
- Abre consola del navegador (F12) → busca errores de Crisp
- Verifica en Crisp dashboard que el dominio está autorizado

---

### 3. Verificar Status Page

- Scroll hasta el **Footer** de la landing
- Busca el link "**Estado del Sistema**"
- Haz click
- Debe abrir tu Status Page de BetterStack
- Debe mostrar el estado "UP" (verde)

**Si no funciona:**
- Verifica que la URL está correcta
- Verifica que la Status Page es pública (no requiere login)

---

### 4. Verificar Sentry

**Forzar un error:**

1. Abre: `https://inmovaapp.com/test-error` (ruta que no existe)
2. Debe mostrar la página de error 404
3. Ve a: https://sentry.io/issues/
4. Debes ver el error capturado
5. Click en el error → Ver detalles (stack trace, breadcrumbs)

**Si no aparece:**
- Espera 1-2 minutos (puede haber delay)
- Verifica que el DSN está correcto
- Verifica que Sentry está activo (no en modo "Resolved")

---

## 🎯 Checklist Final

- [ ] ✅ Sentry DSN configurado y validado
- [ ] ✅ Crisp Website ID configurado y validado
- [ ] ✅ Status Page URL configurada y validada
- [ ] ✅ PM2 reiniciado sin errores
- [ ] ✅ Health check responde correctamente
- [ ] ✅ Widget de Crisp aparece en la web
- [ ] ✅ Link "Estado del Sistema" funciona en Footer
- [ ] ✅ Sentry captura errores correctamente

---

## 📊 Próximos Pasos (Opcional)

### Configurar Alertas en Sentry

1. Ve a: https://sentry.io/settings/inmova-app/alerts/
2. Click "Create Alert"
3. **Alerta 1:** "New Error First Seen"
   - Notificar por: Email
4. **Alerta 2:** "High Error Rate"
   - Condición: > 10 errores en 5 minutos
   - Notificar por: Email + Slack (si lo tienes)

---

### Configurar Respuestas Automáticas en Crisp

1. Ve a: https://app.crisp.chat/settings/
2. Chatbox → Triggers
3. **Trigger 1:** "Bienvenida instantánea"
   - Cuando: Usuario abre chat
   - Mensaje: "¡Hola! 👋 ¿En qué podemos ayudarte?"
4. **Trigger 2:** "Fuera de horario" (si no tienes 24/7)
   - Horario: Lunes-Viernes 9-18h
   - Mensaje: "Gracias por contactarnos. Nuestro horario es L-V 9-18h. Te responderemos en menos de 2 horas."

---

### Configurar Alertas en BetterStack

1. Ve a: https://uptime.betterstack.com/
2. Monitors → Tu monitor
3. Notifications
4. **Email:** Añade tu email
5. **SMS (opcional):** Añade tu teléfono para alertas urgentes
6. **Slack (opcional):** Conecta tu workspace

---

## 🐛 Troubleshooting

### "Crisp widget no aparece"

**Solución:**

1. Verifica el Website ID en `.env.production`:
   ```bash
   ssh root@157.180.119.236
   cat /opt/inmova-app/.env.production | grep CRISP
   ```

2. Debe ser un UUID válido (36 caracteres)

3. Reinicia PM2:
   ```bash
   pm2 restart inmova-app
   ```

4. Verifica en consola del navegador (F12):
   - Busca errores de Crisp
   - Verifica que el script se carga

---

### "Sentry no captura errores"

**Solución:**

1. Verifica el DSN:
   ```bash
   ssh root@157.180.119.236
   cat /opt/inmova-app/.env.production | grep SENTRY
   ```

2. Formato correcto: `https://[key]@[org].ingest.sentry.io/[id]`

3. Verifica en consola del navegador:
   - Debe aparecer: `[Sentry] SDK initialized`

4. Fuerza un error de nuevo

5. Espera 1-2 minutos y revisa Sentry dashboard

---

### "Status Page link va a #"

**Solución:**

1. Verifica la URL:
   ```bash
   ssh root@157.180.119.236
   cat /opt/inmova-app/.env.production | grep STATUS_PAGE
   ```

2. Debe ser una URL completa: `https://...`

3. Si está vacía, el link muestra `#` por defecto (no rompe nada)

---

## 📚 Documentación Completa

- **Plan de Mantenimiento:** `/opt/inmova-app/docs/PLAN-MANTENIMIENTO-POST-LANZAMIENTO.md`
- **Guía Rápida:** `/opt/inmova-app/GUIA-RAPIDA-TRIADA.md`
- **Protocolo Zero-Headache:** `/opt/inmova-app/docs/PROTOCOLO-ZERO-HEADACHE.md`

---

## 💰 Costos Recordatorio

| Servicio | Plan Actual | Costo |
|----------|-------------|-------|
| Sentry | Developer (5,000 errores/mes) | **$0/mes** |
| Crisp | Basic (2 agentes, ilimitado) | **$0/mes** |
| BetterStack | Free (10 monitores, check 3 min) | **$0/mes** |
| **TOTAL** | — | **$0/mes** ✅ |

**Cuándo actualizar:** Cuando tengas > 100 usuarios activos diarios (~6 meses)

---

## ✅ ¡Listo!

**Con la Triada configurada:**

- 🛡️ **Sentry** captura todos los errores automáticamente
- 💬 **Crisp** permite soporte instantáneo a usuarios
- 📊 **BetterStack** muestra transparencia del estado del sistema
- 😴 **Dormir tranquilo** sabiendo que te alertarán si algo falla

**¡Tu app está lista para clientes reales!** 🚀
