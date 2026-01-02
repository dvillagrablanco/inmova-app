# 🛡️ Guía Rápida: Configurar la Triada de Mantenimiento

## ⏱️ Tiempo Total: 15 minutos | 💰 Costo: $0

---

## 🚀 Opción 1: Setup Interactivo (Recomendado)

```bash
npm run setup:triada
```

Este comando lanza un **asistente interactivo** que:

- ✅ Abre automáticamente los sitios web necesarios
- ✅ Valida el formato de cada credencial
- ✅ Actualiza tu `.env.local` automáticamente
- ✅ Verifica que todo está configurado

**Duración:** 15 minutos siguiendo las instrucciones en pantalla.

---

## 🔧 Opción 2: Configuración Manual

### 1️⃣ Sentry (Error Tracking)

**Objetivo:** Capturar errores automáticamente.

**Pasos:**

1. Ve a https://sentry.io/signup/
2. Regístrate (gratis)
3. Crea un proyecto:
   - Click "Create Project"
   - Plataforma: **Next.js**
   - Nombre: `inmova-app`
4. Copia el **DSN** (formato: `https://[key]@[org].ingest.sentry.io/[id]`)

**Añade a `.env.local`:**

```env
NEXT_PUBLIC_SENTRY_DSN="https://tu-clave-aqui@tu-org.ingest.sentry.io/12345"
```

---

### 2️⃣ Crisp (Chat de Soporte)

**Objetivo:** Chat en vivo para soporte 24/7.

**Pasos:**

1. Ve a https://crisp.chat/
2. Click "Try Crisp Free"
3. Completa el registro
4. En el dashboard:
   - Settings ⚙️ → Website Settings
   - Click "Setup Instructions"
   - Copia tu **Website ID** (formato UUID: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)

**Añade a `.env.local`:**

```env
NEXT_PUBLIC_CRISP_WEBSITE_ID="tu-website-id-aqui"
```

---

### 3️⃣ BetterStack (Status Page)

**Objetivo:** Mostrar si tu app está operativa.

**Pasos:**

1. Ve a https://betterstack.com/uptime
2. Regístrate (gratis)
3. Crea un **Monitor**:
   - Click "Add Monitor"
   - URL: `https://inmovaapp.com/api/health` (o tu dominio)
   - Nombre: `Inmova App`
   - Check frequency: `3 minutos`
   - Click "Create Monitor"
4. Crea una **Status Page**:
   - Menú lateral → "Status Pages"
   - Click "Create Status Page"
   - Nombre: `Inmova Status`
   - Selecciona el monitor creado
   - Click "Create Status Page"
5. Copia la **URL pública** (ej: `https://inmova.betteruptime.com`)

**Añade a `.env.local`:**

```env
NEXT_PUBLIC_STATUS_PAGE_URL="https://tu-subdominio.betteruptime.com"
```

---

## ✅ Verificación

```bash
npm run verify:triada
```

Este comando verifica:

- ✓ Formato de credenciales
- ✓ Archivos de código existen
- ✓ Todo configurado correctamente

---

## 🧪 Prueba que Funciona

### 1. Inicia la app

```bash
npm run dev
```

### 2. Verifica Sentry

- Abre http://localhost:3000
- Verifica la consola: `[Sentry] SDK initialized`
- Fuerza un error (ej: navega a `/error-test`)
- Ve a https://sentry.io → deberías ver el error capturado

### 3. Verifica Crisp

- Abre http://localhost:3000
- Busca el **widget de chat** en la esquina inferior derecha
- Haz click → envía un mensaje de prueba
- Ve a https://app.crisp.chat → deberías ver el mensaje

### 4. Verifica Status Page

- Scroll hasta el **Footer** de la landing
- Click en "**Estado del Sistema**"
- Deberías ver tu Status Page de BetterStack

---

## 📦 Deploy a Producción

### Vercel

```bash
# Añade las variables de entorno en el dashboard
https://vercel.com/tu-proyecto/settings/environment-variables

# Deploy
git push origin main
```

### Servidor Propio (Railway/VPS)

```bash
# Añade las variables a .env.production
NEXT_PUBLIC_SENTRY_DSN="..."
NEXT_PUBLIC_CRISP_WEBSITE_ID="..."
NEXT_PUBLIC_STATUS_PAGE_URL="..."

# Rebuild y restart
pm2 restart inmova-app
```

---

## 🐛 Troubleshooting

### "Sentry no captura errores"

**Solución:**

1. Verifica que el DSN en `.env.local` es correcto
2. Reinicia `npm run dev`
3. Verifica en consola: `[Sentry] SDK initialized`
4. Fuerza un error navegando a una ruta inexistente

### "Widget de Crisp no aparece"

**Solución:**

1. Verifica que `NEXT_PUBLIC_CRISP_WEBSITE_ID` está en `.env.local`
2. Reinicia `npm run dev`
3. Abre consola del navegador: busca errores de Crisp
4. Verifica que el ID es correcto (36 caracteres UUID)

### "Link de Status Page no funciona"

**Solución:**

1. Verifica `NEXT_PUBLIC_STATUS_PAGE_URL` en `.env.local`
2. La URL debe ser HTTPS y accesible públicamente
3. Si está vacía, el link apunta a `#` (sin romper nada)

---

## 📚 Documentación Completa

- **Detallada:** `docs/TRIADA-MANTENIMIENTO.md`
- **Resumen Ejecutivo:** `TRIADA-MANTENIMIENTO-RESUMEN.md`
- **Protocolo Zero-Headache:** `docs/PROTOCOLO-ZERO-HEADACHE.md`

---

## 💰 Costos

| Servicio      | Plan Gratuito                           | Plan Pago               |
| ------------- | --------------------------------------- | ----------------------- |
| **Sentry**    | 5,000 errores/mes                       | $26/mes (50k errores)   |
| **Crisp**     | 2 agentes, mensajes ilimitados          | $25/mes (agentes ilim.) |
| **BetterStack** | 10 monitores, check cada 3 min        | $18/mes (check 1 min)   |
| **TOTAL**     | **$0/mes** ✅                           | ~$70/mes (opcional)     |

**Recomendación:** Empieza con el plan gratuito. Solo paga cuando tengas 100+ usuarios activos.

---

## 🎯 Beneficios Inmediatos

### Antes de la Triada

- ❌ No sabes cuándo algo falla
- ❌ Usuarios frustrados esperan respuesta
- ❌ No sabes si el servidor está caído

### Después de la Triada

- ✅ **Sentry** te notifica por email cuando algo falla
- ✅ **Crisp** permite soporte instantáneo 24/7
- ✅ **Status Page** muestra transparencia a los clientes

**Resultado:** Dormir tranquilo sabiendo que todo está bajo control.

---

## 🚨 Acción Inmediata

```bash
npm run setup:triada
```

**¡Configúralo ahora y olvídate del estrés!** 🛡️
