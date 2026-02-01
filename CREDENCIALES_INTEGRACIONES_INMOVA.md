# 🔐 Credenciales de Integraciones - Inmova App

**Fecha de exportación**: 1 de Febrero de 2026  
**Servidor**: 157.180.119.236  
**Dominio**: https://inmovaapp.com

---

> ⚠️ **IMPORTANTE**: Las credenciales completas están almacenadas en el servidor en `/opt/inmova-app/.env.production`. Este documento es solo una referencia de las variables configuradas.

---

## 📊 Resumen de Integraciones

| # | Integración | Estado | Variables |
|---|-------------|--------|-----------|
| 1 | Base de Datos (PostgreSQL) | ✅ | 1 |
| 2 | Autenticación (NextAuth) | ✅ | 2 |
| 3 | Pagos (Stripe) | ✅ | 3 |
| 4 | Email (Gmail SMTP) | ✅ | 6 |
| 5 | Storage (AWS S3) | ✅ | 6 |
| 6 | Analytics (Google GA4) | ✅ | 1 |
| 7 | Push Notifications (VAPID) | ✅ | 2 |
| 8 | IA (Anthropic Claude) | ✅ | 1 |
| 9 | Cache (Redis) | ✅ | 1 |
| 10 | Monitoreo (Sentry) | ✅ | 1 |
| 11 | Firma Digital (DocuSign) | ✅ | 4 |
| 12 | SMS (Twilio) | ✅ | 3 |
| 13 | Firma Digital (Signaturit) | ✅ | 1 |

**Total**: 13 integraciones, 36 variables de entorno

---

## 1️⃣ Base de Datos (PostgreSQL)

**Servicio**: PostgreSQL 15  
**Ubicación**: Localhost (mismo servidor)

| Variable | Descripción |
|----------|-------------|
| DATABASE_URL | URL de conexión PostgreSQL |

**Formato**: `postgresql://usuario:password@host:puerto/database`

---

## 2️⃣ Autenticación (NextAuth)

**Servicio**: NextAuth.js v4  
**Documentación**: https://next-auth.js.org/

| Variable | Descripción |
|----------|-------------|
| NEXTAUTH_SECRET | Token secreto para encriptación de sesiones |
| NEXTAUTH_URL | https://inmovaapp.com |

---

## 3️⃣ Pagos (Stripe)

**Servicio**: Stripe  
**Dashboard**: https://dashboard.stripe.com/  
**Modo**: Test (sk_test_...)

| Variable | Descripción |
|----------|-------------|
| STRIPE_SECRET_KEY | Clave secreta API (sk_test_...) |
| NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY | Clave pública (pk_test_...) |
| STRIPE_WEBHOOK_SECRET | Secreto para validar webhooks (whsec_...) |

**Webhook URL**: `https://inmovaapp.com/api/webhooks/stripe`

---

## 4️⃣ Email (Gmail SMTP)

**Servicio**: Gmail SMTP  
**Cuenta**: inmovaapp@gmail.com  
**Dashboard**: https://myaccount.google.com/apppasswords

| Variable | Valor |
|----------|-------|
| SMTP_HOST | smtp.gmail.com |
| SMTP_PORT | 587 |
| SMTP_SECURE | false (usa STARTTLS) |
| SMTP_USER | inmovaapp@gmail.com |
| SMTP_PASSWORD | App Password de Gmail (16 chars) |
| SMTP_FROM | "Inmova App <inmovaapp@gmail.com>" |

**Límite**: 500 emails/día

---

## 5️⃣ Storage (AWS S3)

**Servicio**: Amazon S3  
**Región**: eu-north-1 (Estocolmo)  
**Dashboard**: https://s3.console.aws.amazon.com/

| Variable | Descripción |
|----------|-------------|
| AWS_ACCESS_KEY_ID | ID de clave de acceso (AKIA...) |
| AWS_SECRET_ACCESS_KEY | Clave secreta |
| AWS_REGION | eu-north-1 |
| AWS_BUCKET | inmova-production (público) |
| AWS_BUCKET_PRIVATE | inmova-private |
| AWS_BUCKET_NAME | inmova-production |

---

## 6️⃣ Analytics (Google Analytics 4)

**Servicio**: Google Analytics 4  
**Dashboard**: https://analytics.google.com/

| Variable | Valor |
|----------|-------|
| NEXT_PUBLIC_GA_MEASUREMENT_ID | G-WX2LE41M4T |

---

## 7️⃣ Push Notifications (Web Push / VAPID)

**Servicio**: Web Push API con VAPID  
**Generados**: Localmente

| Variable | Descripción |
|----------|-------------|
| NEXT_PUBLIC_VAPID_PUBLIC_KEY | Clave pública (compartida con navegadores) |
| VAPID_PRIVATE_KEY | Clave privada (solo servidor) |

---

## 8️⃣ IA (Anthropic Claude)

**Servicio**: Anthropic Claude API  
**Dashboard**: https://console.anthropic.com/

| Variable | Descripción |
|----------|-------------|
| ANTHROPIC_API_KEY | Clave API (sk-ant-api03-...) |

**Modelo recomendado**: claude-3-5-sonnet-20241022

---

## 9️⃣ Cache (Redis)

**Servicio**: Redis (local)  
**Ubicación**: Mismo servidor

| Variable | Valor |
|----------|-------|
| REDIS_URL | redis://localhost:6379 |

---

## 🔟 Monitoreo (Sentry)

**Servicio**: Sentry  
**Dashboard**: https://sentry.io/

| Variable | Descripción |
|----------|-------------|
| SENTRY_DSN | Data Source Name (https://...@...ingest.sentry.io/...) |
| NEXT_PUBLIC_SENTRY_DSN | DSN público para cliente |

---

## 1️⃣1️⃣ Firma Digital (DocuSign)

**Servicio**: DocuSign eSignature  
**Ambiente**: Demo/Sandbox  
**Dashboard**: https://admindemo.docusign.com/

| Variable | Descripción |
|----------|-------------|
| DOCUSIGN_INTEGRATION_KEY | ID de integración (GUID) |
| DOCUSIGN_USER_ID | ID del usuario API (GUID) |
| DOCUSIGN_ACCOUNT_ID | ID de la cuenta DocuSign |
| DOCUSIGN_BASE_PATH | https://demo.docusign.net/restapi |
| DOCUSIGN_PRIVATE_KEY | ✅ Clave RSA para JWT auth (1678 chars) |

**Webhook URL**: `https://inmovaapp.com/api/webhooks/docusign`

**Fuente de Private Key**: Encontrada en `scripts/configure-docusign-complete.py`

---

## 1️⃣2️⃣ SMS (Twilio)

**Servicio**: Twilio  
**Dashboard**: https://console.twilio.com/

| Variable | Descripción |
|----------|-------------|
| TWILIO_ACCOUNT_SID | ID de cuenta (AC...) |
| TWILIO_AUTH_TOKEN | Token de autenticación |
| TWILIO_PHONE_NUMBER | Número de teléfono remitente |

**Webhook URL**: `https://inmovaapp.com/api/webhooks/twilio`

---

## 1️⃣3️⃣ Firma Digital (Signaturit)

**Servicio**: Signaturit (eIDAS compliant)  
**Dashboard**: https://app.signaturit.com/

| Variable | Descripción |
|----------|-------------|
| SIGNATURIT_API_KEY | Clave API (86 caracteres) |

**Webhook URL**: `https://inmovaapp.com/api/webhooks/signaturit`

---

## 📋 Variables Adicionales

| Variable | Valor |
|----------|-------|
| NODE_ENV | production |
| SKIP_ENV_VALIDATION | 1 |
| NEXT_PUBLIC_APP_URL | https://inmovaapp.com |

---

## 🔗 URLs Importantes

### Dashboards de Servicios

| Servicio | URL |
|----------|-----|
| Stripe | https://dashboard.stripe.com/ |
| AWS S3 | https://s3.console.aws.amazon.com/ |
| Google Analytics | https://analytics.google.com/ |
| Anthropic | https://console.anthropic.com/ |
| Sentry | https://sentry.io/ |
| DocuSign (Demo) | https://admindemo.docusign.com/ |
| Twilio | https://console.twilio.com/ |
| Signaturit | https://app.signaturit.com/ |
| Gmail App Passwords | https://myaccount.google.com/apppasswords |

### URLs de la Aplicación

| Endpoint | URL |
|----------|-----|
| Aplicación | https://inmovaapp.com |
| API Health | https://inmovaapp.com/api/health |
| Webhook Stripe | https://inmovaapp.com/api/webhooks/stripe |
| Webhook DocuSign | https://inmovaapp.com/api/webhooks/docusign |
| Webhook Signaturit | https://inmovaapp.com/api/webhooks/signaturit |
| Webhook Twilio | https://inmovaapp.com/api/webhooks/twilio |

---

## 🔄 Cómo Obtener las Credenciales Completas

```bash
# Conectar al servidor
ssh root@157.180.119.236

# Ver todas las credenciales
cat /opt/inmova-app/.env.production

# O ver una específica
grep STRIPE_SECRET_KEY /opt/inmova-app/.env.production
```

---

## ⚠️ Notas de Seguridad

1. **Las credenciales completas NO están en este documento** - están solo en el servidor
2. **Rotar credenciales** periódicamente (recomendado cada 90 días)
3. **Backup** del archivo `.env.production` en ubicación segura
4. **No commitear** credenciales a Git

---

## 📋 Acciones Pendientes

| Acción | Prioridad | Estado |
|--------|-----------|--------|
| ~~Generar DocuSign Private Key~~ | ~~Media~~ | ✅ Completado |
| Migrar Stripe a modo LIVE | Alta (cuando esté listo) | ⏳ En test |
| Migrar DocuSign a producción | Media | ⏳ En demo |

> ✅ **Todas las integraciones están 100% configuradas**

---

## 📅 Historial de Actualizaciones

| Fecha | Cambio |
|-------|--------|
| 01/02/2026 | Documento inicial con 13 integraciones |
| 01/02/2026 | Añadidos webhooks de DocuSign y Twilio |
| 01/02/2026 | Añadidas NEXT_PUBLIC_APP_URL y NEXT_PUBLIC_SENTRY_DSN |

---

*Última actualización: 1 de Febrero de 2026 22:30 UTC*
