# ✅ Script Copiado al Servidor - Ejecutar Ahora

---

## 🎯 Estado: Script Listo en el Servidor

**Ubicación:** `/opt/inmova-app/configurar-triada.sh`

El script está **listo para ejecutar** y te guiará paso a paso para configurar las 3 credenciales.

---

## 🚀 EJECUTA ESTOS COMANDOS AHORA

### 1. Conéctate al Servidor

```bash
ssh root@157.180.119.236
```

**Password cuando lo pida:** `xcc9brgkMMbf`

---

### 2. Ejecuta el Script

Una vez dentro del servidor, ejecuta:

```bash
/opt/inmova-app/configurar-triada.sh
```

---

## 📋 Lo Que Verás (Paso a Paso)

### Pantalla Inicial

```
╔══════════════════════════════════════════════════════════════════╗
║                                                                  ║
║      🛡️  CONFIGURACIÓN DE LA TRIADA - SERVIDOR                  ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝

Este script configurará las 3 variables de la Triada:
  1️⃣  Sentry DSN (Error Tracking)
  2️⃣  Crisp Website ID (Chat Soporte)
  3️⃣  BetterStack Status Page (Transparencia)

⏱️  Duración: 15 minutos
💰 Costo: $0 (planes gratuitos)

¿Comenzar? (s/n):
```

**Escribe:** `s` y presiona Enter

---

### PASO 1: Sentry DSN

```
═══════════════════════════════════════════════════════════════════
  PASO 1/3: SENTRY DSN (Error Tracking)
═══════════════════════════════════════════════════════════════════

🔴 Sentry captura automáticamente TODOS los errores

Pasos para obtener el DSN:
  1. Abre en tu navegador: https://sentry.io/signup/
  2. Regístrate con email o GitHub/Google
  3. Plan 'Developer' (GRATIS, 5,000 errores/mes)
  4. Click 'Create Project'
  5. Plataforma: 'Next.js'
  6. Nombre: 'inmova-app'
  7. COPIA EL DSN que aparece

  Formato: https://[key]@[org].ingest.sentry.io/[id]
  Ejemplo: https://abc123@sentry.ingest.io/12345

📋 Pega tu Sentry DSN aquí (o Enter para saltar): _
```

**Acciones:**
1. Abre https://sentry.io/signup/ en tu navegador
2. Regístrate y crea proyecto "inmova-app"
3. Copia el DSN completo
4. Pégalo en el terminal
5. Presiona Enter

**El script validará el formato automáticamente:**
- ✅ Si es válido: Continúa al paso 2
- ❌ Si es inválido: Te lo dice y puedes reintentar

---

### PASO 2: Crisp Website ID

```
═══════════════════════════════════════════════════════════════════
  PASO 2/3: CRISP WEBSITE ID (Chat de Soporte)
═══════════════════════════════════════════════════════════════════

💬 Crisp permite soporte 24/7

Pasos para obtener el Website ID:
  1. Abre: https://crisp.chat/
  2. Click 'Try Crisp Free'
  3. Regístrate con email
  4. Completa el onboarding
  5. Settings (⚙️) → Website Settings
  6. Click 'Setup Instructions'
  7. COPIA EL WEBSITE ID

  Formato: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx (UUID)
  Ejemplo: 12345678-1234-1234-1234-123456789abc

📋 Pega tu Crisp Website ID aquí (o Enter para saltar): _
```

**Acciones:**
1. Abre https://crisp.chat/ en tu navegador
2. Regístrate y obtén el Website ID
3. Pégalo en el terminal
4. Presiona Enter

---

### PASO 3: BetterStack Status Page

```
═══════════════════════════════════════════════════════════════════
  PASO 3/3: BETTERSTACK STATUS PAGE (Transparencia)
═══════════════════════════════════════════════════════════════════

📊 Status Page muestra si tu app está operativa

Pasos:
  1. Abre: https://betterstack.com/uptime
  2. Crea monitor para: https://inmovaapp.com/api/health
  3. Crea Status Page pública
  4. COPIA LA URL

  Ejemplo: https://inmova.betteruptime.com

📋 Pega la URL aquí (o Enter para saltar): _
```

**Acciones:**
1. Abre https://betterstack.com/uptime
2. Crea monitor y Status Page
3. Copia la URL pública
4. Pégala en el terminal
5. Presiona Enter

---

### PASO 4: Resumen y Confirmación

```
═══════════════════════════════════════════════════════════════════
  RESUMEN DE CONFIGURACIÓN
═══════════════════════════════════════════════════════════════════

🔴 Sentry DSN: ✅ Configurada
   https://abc123@sentry.ingest.io/12345...

💬 Crisp Website ID: ✅ Configurada
   12345678-1234-1234-1234-123456789abc

📊 Status Page URL: ✅ Configurada
   https://inmova.betteruptime.com

¿Aplicar estos cambios en .env.production? (s/n): _
```

**Escribe:** `s` y presiona Enter

---

### PASO 5: Aplicación Automática

```
═══════════════════════════════════════════════════════════════════
  APLICANDO CONFIGURACIÓN
═══════════════════════════════════════════════════════════════════

✅ Backup creado: .env.production.backup.20260102_120000

🔧 Configurando Sentry DSN...
   ✅ Sentry DSN configurada
🔧 Configurando Crisp Website ID...
   ✅ Crisp Website ID configurada
🔧 Configurando Status Page URL...
   ✅ Status Page URL configurada

✅ Variables configuradas: 3/3

═══════════════════════════════════════════════════════════════════
  REINICIANDO APLICACIÓN
═══════════════════════════════════════════════════════════════════

🔄 Reiniciando PM2...
   ✅ PM2 reiniciado exitosamente

⏳ Esperando 10 segundos para que la app arranque...

🧪 Verificando health check...
   ✅ Health check OK
   {"status":"ok","timestamp":"2026-01-02T..."}
```

---

### PASO 6: ¡Completado!

```
╔══════════════════════════════════════════════════════════════════╗
║                                                                  ║
║      ✅ CONFIGURACIÓN COMPLETADA                                 ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝

🎉 ¡Tu app ahora está blindada para producción!

🧪 VERIFICA EN PRODUCCIÓN:

1. Abre: https://inmovaapp.com
2. ✅ Busca el widget de Crisp (esquina inferior derecha)
3. ✅ Footer → Click 'Estado del Sistema'
4. ✅ Navega a /test-error → Ve a https://sentry.io/issues/

😴 Ahora puedes dormir tranquilo sabiendo que:
   🛡️  Sentry captura errores automáticamente
   💬 Crisp permite soporte 24/7
   📊 BetterStack muestra el estado del sistema
```

---

## 💡 Tips Durante la Ejecución

### Si no tienes una credencial ahora:
- Presiona **Enter sin pegar nada** para saltarla
- Puedes ejecutar el script de nuevo después

### Si te equivocas al pegar:
- El script te lo dirá y podrás reintentar
- O saltar esa credencial

### Si algo falla:
- El script crea un backup de `.env.production` antes de modificar
- Puedes ejecutarlo de nuevo sin problemas

---

## 🔄 Si Necesitas Ejecutar de Nuevo

```bash
# Conéctate al servidor
ssh root@157.180.119.236

# Ejecuta el script
/opt/inmova-app/configurar-triada.sh
```

---

## 🧪 Verificación Post-Ejecución

### 1. Abre en Navegador

```
https://inmovaapp.com
```

### 2. Verifica Crisp
- Debe aparecer widget en esquina inferior derecha
- Haz click y envía un mensaje de prueba

### 3. Verifica Status Page
- Scroll al Footer
- Click en "Estado del Sistema"
- Debe abrir tu Status Page de BetterStack

### 4. Verifica Sentry
- Navega a: `https://inmovaapp.com/test-error`
- Espera 1-2 minutos
- Ve a: https://sentry.io/issues/
- Debe aparecer el error capturado

---

## 📊 Resultado Final

**Con todo configurado:**

- 🛡️ **Sentry** captura TODOS los errores automáticamente
- 💬 **Crisp** permite soporte instantáneo 24/7
- 📊 **BetterStack** muestra el estado del sistema
- 😴 **Dormir tranquilo** con alertas automáticas

---

## 🚨 EJECUTA AHORA

```bash
ssh root@157.180.119.236
# Password: xcc9brgkMMbf

/opt/inmova-app/configurar-triada.sh
```

**¡Solo 15 minutos!** ⏱️
