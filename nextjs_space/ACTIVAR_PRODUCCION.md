# 🚀 Guía de Activación de Producción - Módulos STR

## 🎯 Objetivo

Esta guía te ayudará a conectar INMOVA con las APIs reales de los siguientes servicios:

1. **Airbnb** - Sincronización de calendarios y reservas
2. **Booking.com** - Integración de channel manager
3. **VRBO/Expedia** - Gestión de anuncios
4. **Google Calendar** - Sincronización de eventos
5. **WhatsApp Business API** - Comunicación con huéspedes
6. **Stripe** - Procesamiento de pagos y depósitos
7. **Twilio** - SMS y notificaciones
8. **SendGrid** - Envío de emails automatizados

---

## 📦 Prerequisitos

### 1. Cuentas Necesarias

- [ ] Cuenta de Airbnb Host
- [ ] Cuenta de Booking.com Extranet
- [ ] Cuenta de VRBO/Expedia Partner Central
- [ ] Cuenta de Google Cloud Platform
- [ ] Cuenta de Stripe
- [ ] Cuenta de Twilio
- [ ] Cuenta de SendGrid
- [ ] Cuenta de WhatsApp Business (opcional)

### 2. Archivos de Configuración

```bash
# Crear archivo .env.production
cp .env .env.production
```

---

## 🔑 Paso 1: Obtener Credenciales API

### 1.1. Airbnb API

⚠️ **Nota**: Airbnb no tiene API pública oficial. Usar sincronización iCal.

**Pasos:**
1. Ir a tu anuncio en Airbnb Host
2. Navegar a **Calendario** > **Disponibilidad**
3. Seleccionar **Importar/Exportar calendario**
4. Copiar la **URL de exportación iCal**

**Configuración en INMOVA:**
```env
# No requiere API Key - Usar iCal URL
AIRBNB_ICAL_SYNC=true
```

**Cómo configurar en la app:**
1. Ir a **STR > Channel Manager**
2. Clic en **+ Conectar Canal**
3. Seleccionar **Airbnb**
4. Pegar URL iCal
5. Activar sincronización automática

---

### 1.2. Booking.com API

**Pasos:**
1. Ir a [Booking.com Extranet](https://admin.booking.com/)
2. Navegar a **Conectividad** > **APIs**
3. Solicitar acceso a **Connectivity API**
4. Una vez aprobado, obtener:
   - `Client ID`
   - `Client Secret`
   - `Hotel ID`

**Configuración:**
```env
BOOKING_CLIENT_ID=tu_client_id
BOOKING_CLIENT_SECRET=tu_client_secret
BOOKING_HOTEL_ID=tu_hotel_id
BOOKING_API_URL=https://distribution-xml.booking.com/2.0/json
```

**Documentación oficial:**
- [Booking.com Connectivity API](https://connect.booking.com/user_guide/site/en-US/api-reference/)

---

### 1.3. VRBO/Expedia API

**Pasos:**
1. Ir a [Expedia Partner Central](https://www.expediapartnercentral.com/)
2. Navegar a **Integraciones** > **APIs**
3. Solicitar acceso a **Rapid API**
4. Obtener:
   - `API Key`
   - `Secret Key`
   - `Property ID`

**Configuración:**
```env
VRBO_API_KEY=tu_api_key
VRBO_SECRET_KEY=tu_secret_key
VRBO_PROPERTY_ID=tu_property_id
VRBO_API_URL=https://api.expediapartnercentral.com
```

**Documentación oficial:**
- [Expedia Rapid API](https://developers.expediagroup.com/)

---

### 1.4. Google Calendar API

**Pasos:**
1. Ir a [Google Cloud Console](https://console.cloud.google.com/)
2. Crear nuevo proyecto (ej: "INMOVA STR")
3. Habilitar **Google Calendar API**
4. Crear credenciales **OAuth 2.0**:
   - Tipo: Aplicación Web
   - URI de redirección: `https://inmova.app/api/auth/callback/google`
5. Descargar JSON de credenciales

**Configuración:**
```env
GOOGLE_CLIENT_ID=tu_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=tu_client_secret
GOOGLE_CALENDAR_ID=tu_email@gmail.com
```

**Documentación oficial:**
- [Google Calendar API Quickstart](https://developers.google.com/calendar/api/quickstart/nodejs)

---

### 1.5. Stripe API

**Pasos:**
1. Ir a [Stripe Dashboard](https://dashboard.stripe.com/)
2. Crear cuenta o iniciar sesión
3. Navegar a **Developers** > **API keys**
4. Copiar:
   - `Publishable key` (pk_live_...)
   - `Secret key` (sk_live_...)
5. Configurar webhook:
   - URL: `https://inmova.app/api/webhooks/stripe`
   - Eventos: `payment_intent.succeeded`, `charge.failed`

**Configuración:**
```env
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

⚠️ **Importante**: Para testing, usar claves de test (`pk_test_...` y `sk_test_...`)

**Documentación oficial:**
- [Stripe API Docs](https://stripe.com/docs/api)
- [Stripe Connect for Marketplaces](https://stripe.com/docs/connect)

---

### 1.6. Twilio API (SMS)

**Pasos:**
1. Ir a [Twilio Console](https://console.twilio.com/)
2. Crear cuenta o iniciar sesión
3. Obtener de **Account Info**:
   - `Account SID`
   - `Auth Token`
4. Comprar un número de teléfono:
   - Navegar a **Phone Numbers** > **Buy a Number**
   - Elegir número con capacidades SMS

**Configuración:**
```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=tu_auth_token
TWILIO_PHONE_NUMBER=+34123456789
```

**Documentación oficial:**
- [Twilio SMS API](https://www.twilio.com/docs/sms/quickstart/node)

---

### 1.7. SendGrid API (Email)

**Pasos:**
1. Ir a [SendGrid](https://sendgrid.com/)
2. Crear cuenta (Free tier: 100 emails/día)
3. Navegar a **Settings** > **API Keys**
4. Crear nueva API Key con permisos **Full Access**
5. Verificar dominio:
   - **Settings** > **Sender Authentication**
   - Agregar dominio y configurar DNS

**Configuración:**
```env
SENDGRID_API_KEY=SG.xxxxxxxxxxxx
SENDGRID_FROM_EMAIL=noreply@inmova.app
SENDGRID_FROM_NAME=INMOVA
```

**Documentación oficial:**
- [SendGrid Node.js Library](https://github.com/sendgrid/sendgrid-nodejs)

---

### 1.8. WhatsApp Business API (Opcional)

**Opción A: Twilio WhatsApp**
1. En Twilio Console, activar **WhatsApp**
2. Seguir proceso de aprobación de WhatsApp Business
3. Obtener número de WhatsApp

**Configuración:**
```env
WHATSAPP_ENABLED=true
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
```

**Opción B: Meta WhatsApp Business API**
1. Ir a [Meta for Developers](https://developers.facebook.com/)
2. Crear aplicación y agregar WhatsApp
3. Seguir proceso de verificación de negocio
4. Obtener token de acceso

**Configuración:**
```env
WHATSAPP_BUSINESS_ACCOUNT_ID=tu_account_id
WHATSAPP_PHONE_NUMBER_ID=tu_phone_number_id
WHATSAPP_ACCESS_TOKEN=tu_access_token
```

---

## 🛠️ Paso 2: Configurar Variables de Entorno

### 2.1. Archivo `.env.production`

Crear archivo con todas las credenciales:

```env
# ============================================================================
# INMOVA - Configuración de Producción
# ============================================================================

# Base
NEXT_PUBLIC_APP_URL=https://inmova.app
NODE_ENV=production

# Database
DATABASE_URL=postgresql://user:password@host:5432/inmova_prod

# Auth
NEXTAUTH_URL=https://inmova.app
NEXTAUTH_SECRET=tu_secreto_seguro_de_32_caracteres_minimo

# ============================================================================
# STR APIs - Channel Manager
# ============================================================================

# Airbnb (iCal)
AIRBNB_ICAL_SYNC=true

# Booking.com
BOOKING_CLIENT_ID=
BOOKING_CLIENT_SECRET=
BOOKING_HOTEL_ID=
BOOKING_API_URL=https://distribution-xml.booking.com/2.0/json

# VRBO/Expedia
VRBO_API_KEY=
VRBO_SECRET_KEY=
VRBO_PROPERTY_ID=
VRBO_API_URL=https://api.expediapartnercentral.com

# Google Calendar
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALENDAR_ID=

# ============================================================================
# Pagos
# ============================================================================

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# ============================================================================
# Comunicación
# ============================================================================

# Twilio (SMS)
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=

# SendGrid (Email)
SENDGRID_API_KEY=
SENDGRID_FROM_EMAIL=noreply@inmova.app
SENDGRID_FROM_NAME=INMOVA

# WhatsApp (Opcional)
WHATSAPP_ENABLED=false
TWILIO_WHATSAPP_NUMBER=

# ============================================================================
# Cron Jobs
# ============================================================================

CRON_SECRET=tu_secreto_para_cron_jobs
CRON_ENABLED=true

# ============================================================================
# Almacenamiento
# ============================================================================

# AWS S3 (para archivos)
AWS_BUCKET_NAME=
AWS_FOLDER_PREFIX=

# ============================================================================
# Monitoreo (Opcional)
# ============================================================================

# Sentry (Error tracking)
NEXT_PUBLIC_SENTRY_DSN=

# Google Analytics
NEXT_PUBLIC_GA_ID=
```

### 2.2. Validar Configuración
```bash
# Verificar que todas las variables estén definidas
node scripts/validate-env.js
```

---

## 🔄 Paso 3: Configurar Sincronización Automática

### 3.1. Configurar Cron Jobs en el Servidor

**Opción A: Cron Nativo (Linux)**

```bash
# Editar crontab
crontab -e

# Agregar trabajos cron
# Sincronizar iCal cada 4 horas
0 */4 * * * curl -X POST https://inmova.app/api/cron/sync-ical -H "Authorization: Bearer $CRON_SECRET"

# Sincronizar disponibilidad cada 6 horas
0 */6 * * * curl -X POST https://inmova.app/api/cron/sync-availability -H "Authorization: Bearer $CRON_SECRET"

# Crear tareas de limpieza diariamente a las 6:00 AM
0 6 * * * curl -X POST https://inmova.app/api/cron/create-cleaning-tasks -H "Authorization: Bearer $CRON_SECRET"

# Verificar cumplimiento legal diariamente a las 9:00 AM
0 9 * * * curl -X POST https://inmova.app/api/cron/check-legal-compliance -H "Authorization: Bearer $CRON_SECRET"

# Enviar solicitudes de reseñas diariamente a las 10:00 AM
0 10 * * * curl -X POST https://inmova.app/api/cron/send-review-requests -H "Authorization: Bearer $CRON_SECRET"
```

**Opción B: Vercel Cron Jobs**

Crear archivo `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/sync-ical",
      "schedule": "0 */4 * * *"
    },
    {
      "path": "/api/cron/sync-availability",
      "schedule": "0 */6 * * *"
    },
    {
      "path": "/api/cron/create-cleaning-tasks",
      "schedule": "0 6 * * *"
    },
    {
      "path": "/api/cron/send-review-requests",
      "schedule": "0 10 * * *"
    },
    {
      "path": "/api/cron/check-legal-compliance",
      "schedule": "0 9 * * *"
    }
  ]
}
```

**Opción C: Servicios Externos**

1. **EasyCron** (https://www.easycron.com/)
2. **Cron-job.org** (https://cron-job.org/)
3. **AWS EventBridge**

---

## ✅ Paso 4: Testing de Integraciones

### 4.1. Test Individual de APIs

```bash
# Test Booking.com
curl -X POST https://inmova.app/api/test/booking \
  -H "Content-Type: application/json"

# Test Stripe
curl -X POST https://inmova.app/api/test/stripe \
  -H "Content-Type: application/json"

# Test SendGrid
curl -X POST https://inmova.app/api/test/sendgrid \
  -H "Content-Type: application/json"

# Test Twilio
curl -X POST https://inmova.app/api/test/twilio \
  -H "Content-Type: application/json"
```

### 4.2. Test de Sincronización iCal

1. Ir a **STR > Channel Manager**
2. Configurar canal con URL iCal de prueba
3. Clic en **Sincronizar Ahora**
4. Verificar que aparezcan reservas importadas

### 4.3. Test de Cron Jobs

```bash
# Ejecutar manualmente
curl -X POST https://inmova.app/api/cron/execute \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $CRON_SECRET" \
  -d '{"jobId": "sync-ical-feeds"}'
```

---

## 📊 Paso 5: Monitoreo y Logs

### 5.1. Configurar Logging

Instalar Winston o Pino para logs estructurados:

```bash
yarn add winston
```

### 5.2. Dashboard de Cron Jobs

Acceder a: **Admin > Automatización > Cron Jobs**

**Métricas disponibles:**
- ✅ Éxitos
- ❌ Errores
- ⏱️ Última ejecución
- 📈 Items procesados
- ⌚ Duración promedio

### 5.3. Alertas

Configurar alertas de errores:

```env
ALERT_EMAIL=admin@inmova.app
ALERT_WEBHOOK=https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK
```

---

## 🔒 Paso 6: Seguridad

### 6.1. Protección de Endpoints Cron

Todos los endpoints `/api/cron/*` están protegidos con:

1. **Autenticación**: Header `Authorization: Bearer $CRON_SECRET`
2. **Rate Limiting**: Máx 10 req/hora
3. **IP Whitelist** (opcional)

### 6.2. Encriptación de Credenciales

Las API keys se almacenan encriptadas en la base de datos.

### 6.3. Logs de Auditoría

Todas las sincronizaciones se registran en `STRSyncLog`:

```typescript
interface STRSyncLog {
  timestamp: Date;
  jobType: string;
  status: 'success' | 'error';
  itemsProcessed: number;
  duration: number;
  errors?: string[];
}
```

---

## 🐞 Troubleshooting

### Problema: "No se sincronizan reservas de Airbnb"

**Solución:**
1. Verificar que la URL iCal sea correcta
2. Comprobar que el calendario esté público
3. Revisar logs: `/api/logs/cron`

### Problema: "Error 401 en Booking.com API"

**Solución:**
1. Verificar `BOOKING_CLIENT_ID` y `BOOKING_CLIENT_SECRET`
2. Regenerar credenciales en Extranet
3. Verificar que el hotel esté activo

### Problema: "Emails no se envían"

**Solución:**
1. Verificar `SENDGRID_API_KEY`
2. Confirmar que el dominio esté verificado
3. Revisar quota de SendGrid
4. Ver logs de SendGrid Dashboard

### Problema: "Cron jobs no se ejecutan"

**Solución:**
1. Verificar que `CRON_ENABLED=true`
2. Comprobar configuración de crontab/Vercel
3. Ejecutar manualmente para debugging
4. Revisar logs del servidor

---

## 📚 Recursos Adicionales

### Documentación Oficial de APIs

- [Booking.com API Docs](https://connect.booking.com/)
- [Expedia Partner API](https://developers.expediagroup.com/)
- [Stripe API Reference](https://stripe.com/docs/api)
- [Twilio API Docs](https://www.twilio.com/docs)
- [SendGrid API Docs](https://docs.sendgrid.com/)
- [Google Calendar API](https://developers.google.com/calendar)

### Tutoriales

- [Cómo integrar Booking.com](https://www.youtube.com/watch?v=...)
- [Stripe Connect para Marketplaces](https://stripe.com/docs/connect/quickstart)
- [Automatizar WhatsApp con Twilio](https://www.twilio.com/docs/whatsapp/tutorial/send-whatsapp-notification-messages-templates)

### Soporte

- 📧 Email: support@inmova.app
- 💬 Slack: #inmova-soporte
- 📝 Documentación: https://docs.inmova.app

---

## 🎯 Checklist Final de Activación

- [ ] Todas las credenciales API configuradas en `.env.production`
- [ ] Cron jobs configurados y funcionando
- [ ] Tests de integraciones pasando
- [ ] Webhooks configurados (Stripe, etc.)
- [ ] Dominios verificados (SendGrid)
- [ ] Monitoreo y alertas activas
- [ ] Backup de base de datos configurado
- [ ] SSL/HTTPS funcionando
- [ ] Rate limiting configurado
- [ ] Logs de auditoría activos
- [ ] Documentación de equipo actualizada

---

**¡Felicidades! Tu sistema STR está listo para producción 🎉**

Última actualización: Diciembre 2025
