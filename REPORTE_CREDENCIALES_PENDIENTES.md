# REPORTE DE CREDENCIALES - INMOVA APP

**Fecha**: 12 de febrero de 2026  
**Accion realizada**: Consolidacion de .env.production en servidor con credenciales reales  
**Servidor**: 157.180.119.236 (`/opt/inmova-app/.env.production`)

---

## ESTADO ACTUAL TRAS CONSOLIDACION

Se conecto al servidor por SSH y se unificaron las credenciales dispersas entre `.env.local`, `.env.production` y backups en un unico `.env.production` limpio y organizado.

**Health check post-consolidacion**: OK  
**Variables configuradas**: 76  
**Credenciales pendientes**: 17 (marcadas con `# PENDIENTE`)

---

## 1. CREDENCIALES CONFIGURADAS Y OPERATIVAS

| # | Integracion | Variables | Estado |
|---|---|---|---|
| 1 | **PostgreSQL** | `DATABASE_URL` | OPERATIVA - inmova_production en localhost |
| 2 | **NextAuth** | `NEXTAUTH_SECRET`, `NEXTAUTH_URL` | OPERATIVA |
| 3 | **AWS S3** | `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_BUCKET`, `AWS_BUCKET_PRIVATE` | OPERATIVA - Buckets inmova-production + inmova-private |
| 4 | **Stripe** (Pagos) | `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET` | OPERATIVA - Modo TEST (sk_test_) |
| 5 | **Gmail SMTP** (Email) | `SMTP_HOST`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM` | OPERATIVA - inmovaapp@gmail.com, 500 emails/dia |
| 6 | **Anthropic Claude** (IA) | `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL` | OPERATIVA - claude-3-5-sonnet |
| 7 | **Abacus AI** | `ABACUSAI_API_KEY` | OPERATIVA |
| 8 | **Google Analytics 4** | `NEXT_PUBLIC_GA_MEASUREMENT_ID` | OPERATIVA - G-WX2LE41M4T |
| 9 | **Push Notifications** (VAPID) | `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` | OPERATIVA |
| 10 | **Redis** (Cache) | `REDIS_URL` | OPERATIVA - localhost:6379 |
| 11 | **Crisp** (Live Chat) | `CRISP_WEBSITE_ID`, `NEXT_PUBLIC_CRISP_WEBSITE_ID` | OPERATIVA |
| 12 | **Encryption Key** | `ENCRYPTION_KEY` | OPERATIVA - 64 chars hex |
| 13 | **CRON Secret** | `CRON_SECRET` | OPERATIVA |
| 14 | **MFA Encryption** | `MFA_ENCRYPTION_KEY` | OPERATIVA - base64 key |
| 15 | **Redsys PSD2 / Bankinter** | `REDSYS_CLIENT_ID`, `REDSYS_CLIENT_SECRET`, certificados | OPERATIVA en SANDBOX - Certs en /opt/inmova-app/certs/ |
| 16 | **Bizum** | `BIZUM_SECRET_KEY` | PARCIAL - Sandbox, falta MERCHANT_ID |
| 17 | **Cloudflare** (CDN/SSL) | N/A (externo) | OPERATIVA |
| 18 | **PM2** (Process Manager) | N/A | OPERATIVA - 2 workers cluster |

**Total operativas: 18 integraciones**

---

## 2. CREDENCIALES PENDIENTES

### ALTA PRIORIDAD

| # | Integracion | Variables Pendientes | Donde obtener | Impacto |
|---|---|---|---|---|
| 1 | **Signaturit** (Firma Digital) | `SIGNATURIT_API_KEY` | https://app.signaturit.com/ > API Settings | Firma electronica de contratos con validez eIDAS. La API key estuvo configurada antes pero fue eliminada. Hay que re-obtenerla del dashboard de Signaturit. |
| 2 | **Stripe LIVE** | Cambiar `sk_test_` a `sk_live_` | https://dashboard.stripe.com/apikeys (toggle LIVE) | Actualmente en TEST mode. Para cobros reales hay que cambiar a claves LIVE. Las claves live existieron antes (rk_live_51Sf0V7...) |
| 3 | **DocuSign** | `DOCUSIGN_INTEGRATION_KEY`, `DOCUSIGN_ACCOUNT_ID` | https://admin.docusign.com/ | Backup de firma digital si Signaturit falla |
| 4 | **Sentry** (Error Tracking) | `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN` | https://sentry.io/ > Project Settings > DSN | Monitoreo de errores en produccion. Critico para detectar problemas antes que los usuarios |

### MEDIA PRIORIDAD

| # | Integracion | Variables Pendientes | Donde obtener | Impacto |
|---|---|---|---|---|
| 5 | **Twilio** (SMS) | `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` | https://console.twilio.com/ | SMS de verificacion, recordatorios de pago, alertas urgentes |
| 6 | **SendGrid** (Email masivo) | `SENDGRID_API_KEY` | https://app.sendgrid.com/ > API Keys | Alternativa a Gmail para alto volumen (>500 emails/dia) |
| 7 | **Contasimple** (Contabilidad) | `CONTASIMPLE_AUTH_KEY`, `INMOVA_CONTASIMPLE_AUTH_KEY` | https://contasimple.com/ > Configuracion API | Sincronizacion contable para Vidaro, Rovida, Viroda |
| 8 | **Bizum** (Pagos P2P) | `BIZUM_MERCHANT_ID` | Banco (via Redsys) | Cobro de alquileres por Bizum |

### BAJA PRIORIDAD

| # | Integracion | Variables Pendientes | Donde obtener | Impacto |
|---|---|---|---|---|
| 9 | **Zucchetti** (ERP) | `ZUCCHETTI_CLIENT_ID`, `ZUCCHETTI_CLIENT_SECRET` | Zucchetti comercial | ERP contable alternativo |
| 10 | **Facebook** | `FACEBOOK_APP_ID`, `FACEBOOK_APP_SECRET` | https://developers.facebook.com/ | Publicacion automatica de propiedades |
| 11 | **LinkedIn** | `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET` | https://developer.linkedin.com/ | Marketing profesional |
| 12 | **Twitter/X** | `TWITTER_CLIENT_ID`, `TWITTER_CLIENT_SECRET` | https://developer.x.com/ | Marketing social |
| 13 | **Mapbox** | `NEXT_PUBLIC_MAPBOX_TOKEN` | https://account.mapbox.com/ | Mapas interactivos de inmuebles |
| 14 | **VAPI** (Voz IA) | `VAPI_API_KEY` | https://vapi.ai/ | Asistente telefonico IA |
| 15 | **PayPal** | `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET` | https://developer.paypal.com/ | Pagos internacionales |
| 16 | **GoCardless** (SEPA) | `GOCARDLESS_ACCESS_TOKEN` | https://manage.gocardless.com/ | Domiciliaciones bancarias |
| 17 | **Hotjar** | `NEXT_PUBLIC_HOTJAR_ID` | https://hotjar.com/ | Mapas de calor UX |

---

## 3. SOCIEDADES VIDARO / ROVIDA / VIRODA

Las credenciales de las sociedades se gestionan POR EMPRESA en la base de datos (tabla `Company`), no en variables de entorno. Campos relevantes en el schema:

| Campo BD | Vidaro | Rovida | Viroda | Accion necesaria |
|---|---|---|---|---|
| `contasimpleEnabled` | false | false | false | Activar cuando se obtenga Contasimple API key |
| `contasimpleAuthKey` | null | null | null | Configurar con API key especifica de cada sociedad |
| `zucchettiEnabled` | false | false | false | Activar cuando se obtenga Zucchetti credentials |
| `stripeCustomerId` | null | null | null | Se crea automaticamente al suscribirse a un plan |

**Datos ya importados de cada sociedad**:

- **Vidaro**: Contabilidad 2025-2026 (5.829+ asientos), Movimientos bancarios (CAMT.053 XML)
- **Rovida**: Contabilidad 2025-2026 (13.861 lineas), Edificios, inquilinos, contratos, Movimientos bancarios
- **Viroda**: Contabilidad 2025-2026 (14.884 lineas), Inquilinos, seguros (PDFs), Edificios

Con Bankinter Open Banking (Redsys PSD2) operativo en sandbox, la sincronizacion bancaria automatica podra reemplazar la importacion manual de XML cuando se pase a produccion.

---

## 4. RESUMEN NUMERICO

| Categoria | Cantidad |
|---|---|
| **Integraciones operativas** | 18 |
| **Credenciales pendientes ALTA** | 4 (Signaturit, Stripe LIVE, DocuSign, Sentry) |
| **Credenciales pendientes MEDIA** | 4 (Twilio, SendGrid, Contasimple, Bizum) |
| **Credenciales pendientes BAJA** | 9 (redes sociales, mapas, ERP, etc.) |
| **Total pendientes** | 17 |
| **Porcentaje operativo** | **76/93 vars = 82%** |

---

## 5. ARCHIVOS MODIFICADOS EN ESTA SESION

1. `/opt/inmova-app/.env.production` - Consolidado con todas las credenciales reales del servidor
2. `/opt/inmova-app/.env.local` - Sincronizado con .env.production
3. `.env.example` - Actualizado como template completo con todas las integraciones
4. `REPORTE_CREDENCIALES_PENDIENTES.md` - Este documento

---

**Generado por**: Cursor Agent  
**Fecha**: 12 de febrero de 2026  
**Health check**: OK
