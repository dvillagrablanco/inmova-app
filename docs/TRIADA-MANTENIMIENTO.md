# 🛡️ Triada de Mantenimiento - Inmova

**"Dormir tranquilo cuando tienes clientes"**

Este documento describe el sistema de mantenimiento automatizado de Inmova, diseñado para minimizar el estrés operativo y garantizar una experiencia profesional 24/7.

---

## 📋 Tabla de Contenidos

1. [Qué es la Triada](#qué-es-la-triada)
2. [1️⃣ El Centinela (Sentry)](#1️⃣-el-centinela---error-tracking)
3. [2️⃣ El Escudo (Crisp)](#2️⃣-el-escudo---chat-de-soporte)
4. [3️⃣ La Transparencia (Status Page)](#3️⃣-la-transparencia---status-page)
5. [Configuración](#configuración)
6. [Testing](#testing)
7. [Mejores Prácticas](#mejores-prácticas)

---

## Qué es la Triada

La **Triada de Mantenimiento** es un conjunto de 3 sistemas que trabajan juntos para:

- ✅ **Detectar problemas antes que los clientes** (Centinela)
- ✅ **Responder 24/7 sin estar despierto** (Escudo)
- ✅ **Comunicar el estado de forma transparente** (Transparencia)

### Beneficios

| Antes | Después |
|-------|---------|
| ❌ Cliente reporta error → Tú te enteras | ✅ Sentry te notifica antes que el cliente |
| ❌ Cliente espera email de soporte | ✅ Chat instantáneo con respuestas automáticas |
| ❌ "¿La app está caída?" → Pánico | ✅ Status page muestra estado en tiempo real |

---

## 1️⃣ El Centinela - Error Tracking

### Qué hace

**Sentry** captura automáticamente **todos los errores** de la aplicación (frontend y backend) y te notifica al instante.

### Componentes

#### `GlobalErrorBoundary.tsx`

Envuelve toda la aplicación y captura errores de React:

```tsx
// components/ui/GlobalErrorBoundary.tsx
export class GlobalErrorBoundary extends React.Component {
  componentDidCatch(error, errorInfo) {
    // 📨 Envía a Sentry
    Sentry.captureException(error);
    
    // 🎨 Muestra UI amigable al usuario
    this.setState({ hasError: true });
  }
}
```

**Lo que ve el usuario** cuando hay un error:

```
┌─────────────────────────────────┐
│  ⚠️  ¡Ups! Algo salió mal       │
│                                 │
│  No te preocupes, nuestro      │
│  equipo ya ha sido notificado. │
│                                 │
│  [🔄 Recargar] [🏠 Ir a Inicio] │
└─────────────────────────────────┘
```

**Lo que ves tú** (email/Slack):

```
🚨 Error en Producción
━━━━━━━━━━━━━━━━━━━━━━━
App: Inmova
Error: TypeError: Cannot read property 'id' of undefined
Usuario: admin@inmova.app
Navegador: Chrome 120
URL: /dashboard/properties/123
Stack: components/PropertyCard.tsx:45
━━━━━━━━━━━━━━━━━━━━━━━
Ver detalles: https://sentry.io/...
```

#### Configuración de Sentry

```typescript
// sentry.client.config.ts
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Replay de sesión (ver qué hizo el usuario)
  replaysOnErrorSampleRate: 1.0, // 100% cuando hay error
  
  // Ignorar ruido
  ignoreErrors: [
    'Hydration failed', // False positives
    'NetworkError',     // No podemos controlar la red
  ],
  
  // Filtrar datos sensibles
  beforeSend(event) {
    delete event.request.headers['authorization'];
    return event;
  },
});
```

### Cómo obtener Sentry DSN

1. Ve a https://sentry.io/signup/
2. Crea una cuenta (gratis hasta 5,000 errores/mes)
3. Crea un proyecto → Next.js
4. Copia el DSN: `https://xxx@yyy.ingest.sentry.io/zzz`
5. Añade a `.env`:

```env
NEXT_PUBLIC_SENTRY_DSN=https://xxx@yyy.ingest.sentry.io/zzz
```

### Testing

```bash
# Forzar un error en desarrollo
# 1. Añade esto a cualquier página:
throw new Error('Test Sentry Error Boundary');

# 2. Visita la página
# 3. Deberías ver:
#    - UI amigable en el navegador
#    - Error en Sentry dashboard
```

---

## 2️⃣ El Escudo - Chat de Soporte

### Qué hace

**Crisp** es un chat en vivo que aparece en todas las páginas. Permite:

- 💬 Respuestas instantáneas (24/7 con chatbot)
- 📧 Conversaciones por email si no estás online
- 📱 App móvil para responder desde cualquier lugar
- 🤖 Respuestas automáticas para preguntas comunes

### Componentes

#### `ChatWidget.tsx`

```tsx
// components/support/ChatWidget.tsx
export function ChatWidget() {
  const crispId = process.env.NEXT_PUBLIC_CRISP_WEBSITE_ID;
  
  // Se carga de forma asíncrona (no afecta performance)
  return (
    <Script
      strategy="lazyOnload"
      src="https://client.crisp.chat/l.js"
    />
  );
}
```

**Lo que ve el usuario**:

```
┌────────────────────┐
│ 💬 Chat con soporte│ ← Widget en esquina inferior derecha
└────────────────────┘

Click →

┌────────────────────────────────┐
│ INMOVA - Soporte               │
│                                │
│ 🤖 Bot: ¡Hola! ¿En qué puedo  │
│        ayudarte?               │
│                                │
│ [Escribir mensaje...]          │
└────────────────────────────────┘
```

### Funcionalidades Avanzadas

#### Identificar usuarios autenticados

```typescript
import { crispUtils } from '@/components/support/ChatWidget';

// Cuando el usuario se loguea:
crispUtils.setUser({
  email: session.user.email,
  nickname: session.user.name,
  avatar: session.user.image,
});

// Crisp ahora sabe quién es y puede:
// - Mostrar conversaciones anteriores
// - Enviar transcripción por email
// - Tracking de usuarios
```

#### Abrir chat programáticamente

```tsx
import { crispUtils } from '@/components/support/ChatWidget';

function HelpButton() {
  return (
    <Button onClick={() => crispUtils.open()}>
      ¿Necesitas ayuda?
    </Button>
  );
}
```

#### Pre-llenar mensajes

```typescript
// Usuario hizo click en "Reportar bug"
crispUtils.setMessage('Encontré un bug en la página de propiedades...');
crispUtils.open();
```

### Cómo obtener Crisp Website ID

1. Ve a https://crisp.chat/
2. Regístrate (gratis hasta 2 agentes)
3. Ve a Settings → Website Settings → Setup Instructions
4. Copia tu Website ID: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
5. Añade a `.env`:

```env
NEXT_PUBLIC_CRISP_WEBSITE_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

### Configurar Respuestas Automáticas

En el dashboard de Crisp:

1. **Chatbots** → Create Scenario
2. Ejemplo: "Horario de atención"

```
Usuario: "¿Cuál es el horario?"

Bot: "Nuestro horario de atención es:
     Lunes a Viernes: 9:00 - 18:00 (CET)
     Sábados: 10:00 - 14:00
     Domingos: Cerrado
     
     Fuera de horario, déjanos un mensaje
     y te responderemos en cuanto abramos."
```

3. **Away Mode** → Activar cuando no estás online

```
"Actualmente no estamos disponibles.
Déjanos tu mensaje y te responderemos
en menos de 2 horas. ⏰"
```

### Testing

```bash
# 1. Añade NEXT_PUBLIC_CRISP_WEBSITE_ID a .env
# 2. Ejecuta la app: npm run dev
# 3. Visita cualquier página
# 4. Deberías ver el widget en esquina inferior derecha
# 5. Haz click y prueba enviar un mensaje
# 6. Verifica que llega a tu dashboard de Crisp
```

---

## 3️⃣ La Transparencia - Status Page

### Qué hace

Una **página de estado** pública que muestra:

- ✅ Sistema Operativo (verde)
- ⚠️ Degradado (amarillo)
- ❌ Caído (rojo)

Historial de incidentes pasados.

### Componentes

#### Link en Footer

```tsx
// components/landing/sections/Footer.tsx
<a href={process.env.NEXT_PUBLIC_STATUS_PAGE_URL}>
  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
  Estado del Sistema
</a>
```

**Lo que ve el usuario**:

```
Footer:
─────────────────────────────────
© 2026 INMOVA
[🟢 Estado del Sistema] ← Click aquí
─────────────────────────────────
```

Click → Redirige a status page externa:

```
┌────────────────────────────────┐
│ INMOVA - Estado del Sistema    │
│                                │
│ 🟢 Todos los sistemas operativos│
│                                │
│ ✅ Aplicación Web              │
│ ✅ API                         │
│ ✅ Base de Datos               │
│ ✅ Pagos (Stripe)              │
│                                │
│ Tiempo de actividad: 99.9%    │
└────────────────────────────────┘
```

### Opciones de Status Page

#### 1. BetterStack (Recomendado)

- ✅ Gratuito hasta 10 monitores
- ✅ Página pública personalizable
- ✅ Notificaciones email/Slack/SMS
- ✅ Histórico de incidentes

**Setup**:

1. https://betterstack.com/uptime
2. Create account → Add monitor
3. Monitor URL: `https://inmovaapp.com/api/health`
4. Check frequency: 1 minuto
5. Create status page
6. Obtén URL: `https://status.inmova.app`

```env
NEXT_PUBLIC_STATUS_PAGE_URL=https://inmova.betteruptime.com
```

#### 2. UptimeRobot

- ✅ Gratuito hasta 50 monitores
- ✅ Check cada 5 minutos
- ⚠️ Status page tiene marca de agua (premium quita)

**Setup**:

1. https://uptimerobot.com/signUp
2. Add New Monitor → HTTP(s)
3. URL: `https://inmovaapp.com/api/health`
4. Create Public Status Page
5. Obtén URL

```env
NEXT_PUBLIC_STATUS_PAGE_URL=https://stats.uptimerobot.com/xxx
```

#### 3. Statuspage.io (by Atlassian)

- 💰 Caro ($29/mes)
- ✅ Muy profesional
- ✅ Integraciones con Jira, PagerDuty

#### 4. Self-hosted (Uptime Kuma)

```bash
docker run -d --restart=always \
  -p 3001:3001 \
  -v uptime-kuma:/app/data \
  --name uptime-kuma \
  louislam/uptime-kuma:1
```

Accede a `http://localhost:3001` y configura.

### Testing

```bash
# 1. Añade NEXT_PUBLIC_STATUS_PAGE_URL a .env
NEXT_PUBLIC_STATUS_PAGE_URL=https://status.ejemplo.com

# 2. Ve al footer de la landing
# 3. Verifica que el link aparece
# 4. Haz click → Debe abrir la status page en nueva pestaña
```

---

## Configuración

### Paso 1: Variables de Entorno

Copia `.env.example` a `.env.local`:

```bash
cp .env.example .env.local
```

Añade tus credenciales:

```env
# El Centinela
NEXT_PUBLIC_SENTRY_DSN=https://xxx@yyy.ingest.sentry.io/zzz
SENTRY_ORG=tu-organizacion
SENTRY_PROJECT=inmova

# El Escudo
NEXT_PUBLIC_CRISP_WEBSITE_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

# La Transparencia
NEXT_PUBLIC_STATUS_PAGE_URL=https://inmova.betteruptime.com
```

### Paso 2: Verificar Instalación

```bash
# Todos los componentes ya están instalados e integrados
npm run dev

# Verifica en el navegador:
# 1. Fuerza un error → Deberías ver GlobalErrorBoundary
# 2. Busca el widget de Crisp en esquina inferior derecha
# 3. Ve al footer → Busca "Estado del Sistema"
```

### Paso 3: Deploy a Producción

```bash
# Las variables de entorno deben estar en:
# - Vercel: Settings → Environment Variables
# - Railway: Variables tab
# - Docker: .env.production

# Build local (opcional)
npm run build
npm start
```

---

## Testing

### Test de Error Boundary

```tsx
// Crea una página de test: app/test-error/page.tsx
'use client';

export default function TestError() {
  return (
    <button onClick={() => {
      throw new Error('Test error para GlobalErrorBoundary');
    }}>
      Forzar Error
    </button>
  );
}
```

Visita `/test-error` → Click → Deberías ver UI amigable.

### Test de Crisp

```bash
# 1. Configura NEXT_PUBLIC_CRISP_WEBSITE_ID
# 2. npm run dev
# 3. Abre cualquier página
# 4. Widget debe aparecer en esquina
# 5. Envía un mensaje de prueba
# 6. Verifica en dashboard de Crisp
```

### Test de Status Page

```bash
# Simula caída del sistema
# 1. Para el servidor: Ctrl+C
# 2. Espera 1-2 minutos
# 3. Ve a tu status page
# 4. Debería mostrar "Sistema Caído" (rojo)
# 5. Reinicia servidor
# 6. En 1-2 minutos debe volver a verde
```

---

## Mejores Prácticas

### 1. Configurar Alertas en Sentry

Dashboard → Alerts → Create Alert:

```yaml
Trigger: Cuando hay un error nuevo
Acción: Enviar email a soporte@inmova.app
Frecuencia: Inmediata
```

### 2. Respuestas Automáticas en Crisp

Configura respuestas para preguntas frecuentes:

```
Q: "¿Cómo cambio mi plan?"
A: "Para cambiar tu plan:
    1. Ve a Configuración → Suscripción
    2. Selecciona nuevo plan
    3. Confirma cambio
    
    Si tienes dudas, respondo en 5 minutos."
```

### 3. Comunicar Mantenimientos

Antes de hacer deploy:

1. Crea incidente en status page: "Mantenimiento programado"
2. Fecha y hora
3. Duración estimada
4. Qué servicios se verán afectados

Esto reduce emails de "¿La app está caída?".

### 4. Monitor de Salud

Crea un endpoint de health check:

```typescript
// app/api/health/route.ts
export async function GET() {
  try {
    // Verificar BD
    await prisma.$queryRaw`SELECT 1`;
    
    // Verificar Redis (si aplica)
    await redis.ping();
    
    return Response.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version,
    });
  } catch (error) {
    return Response.json(
      { status: 'unhealthy', error: error.message },
      { status: 503 }
    );
  }
}
```

Configura tu status page para checkear `/api/health` cada minuto.

### 5. Logs Estructurados

Combina Sentry con logs estructurados:

```typescript
import * as Sentry from '@sentry/nextjs';

// Log info (no va a Sentry)
console.log('Usuario creado', { userId: '123' });

// Log warning (va a Sentry)
Sentry.captureMessage('Límite de API próximo', {
  level: 'warning',
  extra: { usage: '90%' },
});

// Log error (va a Sentry)
Sentry.captureException(error, {
  tags: { component: 'PaymentProcessor' },
  extra: { orderId: '456' },
});
```

---

## Costos Estimados

| Servicio | Plan | Costo | Límite |
|----------|------|-------|--------|
| **Sentry** | Free | $0 | 5,000 errores/mes |
| **Sentry** | Team | $26/mes | 50,000 errores/mes |
| **Crisp** | Free | $0 | 2 agentes, ilimitado mensajes |
| **Crisp** | Pro | €25/mes | Agentes ilimitados, branding |
| **BetterStack** | Free | $0 | 10 monitores, check cada 3 min |
| **BetterStack** | Basic | $18/mes | 20 monitores, check cada 30s |
| **UptimeRobot** | Free | $0 | 50 monitores, check cada 5 min |

**Total para startup**: **$0/mes** (planes gratuitos suficientes)  
**Total cuando escales**: **~$70/mes** (todos los planes pagos)

---

## Troubleshooting

### Sentry no captura errores

```bash
# 1. Verifica variable de entorno
echo $NEXT_PUBLIC_SENTRY_DSN

# 2. Verifica consola del navegador
# Debe decir: "[Sentry] Inicializado correctamente"

# 3. Fuerza un error de prueba
throw new Error('Test Sentry');

# 4. Ve a Sentry dashboard
# Si no aparece en 30 segundos, revisa DSN
```

### Crisp no aparece

```bash
# 1. Verifica variable
echo $NEXT_PUBLIC_CRISP_WEBSITE_ID

# 2. Verifica consola
# No debe haber errores de script bloqueado

# 3. Revisa AdBlocker
# Algunos bloquean chat widgets
# Prueba en incógnito

# 4. Verifica Dashboard de Crisp
# Website Settings → Installation Status
# Debe decir "Active"
```

### Status page no funciona

```bash
# 1. Verifica URL
curl https://inmovaapp.com/api/health

# Debe retornar:
# {"status":"healthy"}

# 2. Verifica monitor en BetterStack
# Dashboard → Monitors → Ver estado
# Si está rojo, hay problema con la URL

# 3. Verifica CORS (si aplica)
# /api/health debe aceptar requests de status page
```

---

## Próximos Pasos

1. ✅ Configurar Sentry DSN
2. ✅ Configurar Crisp Website ID
3. ✅ Crear status page en BetterStack/UptimeRobot
4. ✅ Añadir URL de status page a `.env`
5. ✅ Probar cada componente
6. ✅ Configurar alertas
7. ✅ Deploy a producción
8. 🎉 **Dormir tranquilo**

---

## Soporte

¿Problemas configurando la Triada?

- 📧 Email: soporte@inmova.app
- 💬 Chat: (haz click en el widget 😉)
- 📊 Status: https://status.inmova.app

---

**Última actualización**: 2 de enero de 2026  
**Versión**: 1.0.0  
**Autor**: Lead DevOps & Customer Support Engineer
