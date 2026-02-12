# REPORTE DE CREDENCIALES PENDIENTES - INMOVA APP

**Fecha**: 12 de febrero de 2026  
**Alcance**: Plataforma Inmova + Sociedades Viroda y Rovida (Grupo Vidaro)

---

## ESTRUCTURA EMPRESARIAL

```
VIDARO INVERSIONES S.L. (Matriz) [ID: vidaro-inversiones]
  ├── ROVIDA S.L. (Filial - Gestión inmobiliaria patrimonial) [ID: rovida-sl]
  │   └── 17 inmuebles, 243+ inquilinos, ~€46.2M movimiento anual
  └── VIRODA INVERSIONES S.L.U. (Filial - Inversión residencial) [ID: viroda-inversiones]
      └── 101 inquilinos activos, ~€600K renta anual
```

---

## 1. INTEGRACIONES DE PLATAFORMA INMOVA (Nivel Global)

### CONFIGURADAS (en .env.production del servidor)

| Integración | Variable | Estado | Notas |
|---|---|---|---|
| PostgreSQL | `DATABASE_URL` | PLACEHOLDER | URL dummy en .env.production, solo funciona en servidor real |
| NextAuth | `NEXTAUTH_SECRET` + `NEXTAUTH_URL` | OK en servidor | `https://inmovaapp.com` |
| Node.js Runtime | `NODE_ENV` | OK | `production` |

### PENDIENTES DE CREDENCIALES - PLATAFORMA

#### CRITICAS (Funcionalidad core afectada)

| # | Integración | Variables Requeridas | Prioridad | Impacto |
|---|---|---|---|---|
| 1 | **AWS S3** (Almacenamiento) | `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_BUCKET`, `AWS_REGION` | CRITICA | Sin S3 no se pueden subir documentos, fotos de inmuebles, contratos PDF |
| 2 | **Stripe** (Pagos) | `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | CRITICA | Sin Stripe no funciona cobro de alquileres online, suscripciones B2B, ni facturación |
| 3 | **SMTP/Gmail** (Email) | `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM` | CRITICA | Sin email no funcionan: verificación de cuentas, notificaciones, recuperación de password, alertas de pago |
| 4 | **Anthropic Claude** (IA) | `ANTHROPIC_API_KEY` | ALTA | Valoraciones IA, clasificación de incidencias, chatbot, análisis de documentos, generación de descripciones |
| 5 | **Encryption Key** | `ENCRYPTION_KEY` | CRITICA | Encriptación de credenciales multi-tenant, sin ella las integraciones por empresa no funcionan |
| 6 | **CRON Secret** | `CRON_SECRET` | ALTA | Protección de endpoints cron (sincronización, alertas automáticas) |
| 7 | **MFA Encryption** | `MFA_ENCRYPTION_KEY` | ALTA | Autenticación de 2 factores no funciona sin esta clave |

#### IMPORTANTES (Diferenciación competitiva)

| # | Integración | Variables Requeridas | Prioridad | Impacto |
|---|---|---|---|---|
| 8 | **Signaturit** (Firma Digital) | `SIGNATURIT_API_KEY`, `SIGNATURIT_ENV`, `SIGNATURIT_WEBHOOK_SECRET` | ALTA | Firma electrónica de contratos con validez legal eIDAS (Europa) |
| 9 | **DocuSign** (Firma Digital) | `DOCUSIGN_INTEGRATION_KEY`, `DOCUSIGN_ACCOUNT_ID`, `DOCUSIGN_PRIVATE_KEY`, `DOCUSIGN_ENVIRONMENT` | ALTA | Alternativa de firma digital (más conocida internacionalmente) |
| 10 | **Twilio** (SMS/WhatsApp) | `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER` | MEDIA | Notificaciones SMS, verificación por WhatsApp, alertas de pago urgentes |
| 11 | **SendGrid** (Email masivo) | `SENDGRID_API_KEY`, `SENDGRID_FROM_EMAIL` | MEDIA | Email transaccional escalable (alternativa a Gmail para alto volumen) |
| 12 | **Push Notifications** (VAPID) | `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` | MEDIA | Notificaciones push en navegador/móvil |
| 13 | **Redis** (Cache) | `REDIS_URL` o `REDIS_HOST`/`REDIS_PORT`/`REDIS_PASSWORD` | MEDIA | Rate limiting, caché de consultas, mejora rendimiento |
| 14 | **Upstash Redis** | `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | MEDIA | Rate limiting en serverless (Vercel) |

#### OPCIONALES (Mejora experiencia / Analítica)

| # | Integración | Variables Requeridas | Prioridad | Impacto |
|---|---|---|---|---|
| 15 | **Sentry** (Monitoreo) | `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN` | MEDIA | Tracking de errores en producción, alertas automáticas |
| 16 | **Google Analytics 4** | `NEXT_PUBLIC_GA_MEASUREMENT_ID` | BAJA | Analítica de tráfico web y comportamiento de usuarios |
| 17 | **Hotjar** | `NEXT_PUBLIC_HOTJAR_ID` | BAJA | Mapas de calor, grabaciones de sesiones, análisis UX |
| 18 | **Mapbox** | `NEXT_PUBLIC_MAPBOX_TOKEN` | BAJA | Mapas interactivos de inmuebles (geocodificación, visualización) |
| 19 | **Abacus AI** | `ABACUSAI_API_KEY` | BAJA | LLM alternativo para análisis avanzados |

#### REDES SOCIALES (Marketing automatizado)

| # | Integración | Variables Requeridas | Prioridad | Impacto |
|---|---|---|---|---|
| 20 | **Facebook** | `FACEBOOK_ACCESS_TOKEN` | BAJA | Publicación automática de propiedades |
| 21 | **Instagram** | `INSTAGRAM_ACCESS_TOKEN` | BAJA | Publicación automática de propiedades |
| 22 | **LinkedIn** | `LINKEDIN_ACCESS_TOKEN` | BAJA | Publicación para inversores/profesionales |
| 23 | **Twitter/X** | `TWITTER_API_KEY` | BAJA | Publicación automática |

#### CHAT & SOPORTE

| # | Integración | Variables Requeridas | Prioridad | Impacto |
|---|---|---|---|---|
| 24 | **Crisp** (Chat) | `CRISP_WEBSITE_ID`, `NEXT_PUBLIC_CRISP_WEBSITE_ID` | MEDIA | Chat en vivo con inquilinos/clientes |
| 25 | **VAPI** (Voz IA) | `VAPI_API_KEY`, `VAPI_WEBHOOK_SECRET`, `NEXT_PUBLIC_VAPI_PHONE_NUMBER` | BAJA | Asistente telefónico IA (recepcionista virtual) |

---

## 2. INTEGRACIONES MULTI-TENANT (Por Empresa/Sociedad)

El sistema soporta credenciales POR EMPRESA almacenadas en la BD (tabla `Company`). Estas son independientes de las variables de entorno globales.

### 2.1 CONTABILIDAD - Pendiente para TODAS las sociedades

| Integración | Campos en BD | Estado Vidaro | Estado Rovida | Estado Viroda |
|---|---|---|---|---|
| **Contasimple** (Clientes) | `contasimpleEnabled`, `contasimpleAuthKey`, `contasimpleCustomerId` | PENDIENTE | PENDIENTE | PENDIENTE |
| **Contasimple** (Inmova B2B) | `INMOVA_CONTASIMPLE_AUTH_KEY` (env global) | PENDIENTE | N/A | N/A |
| **Zucchetti** (ERP) | `zucchettiEnabled`, `zucchettiAccessToken`, `zucchettiRefreshToken`, `zucchettiCompanyId` | PENDIENTE | PENDIENTE | PENDIENTE |

**Variables globales necesarias para Contasimple**:
- `CONTASIMPLE_AUTH_KEY` - API key para el servicio de contabilidad de clientes
- `CONTASIMPLE_API_URL` - URL del API (default: `https://api.contasimple.com/api/v2`)
- `INMOVA_CONTASIMPLE_AUTH_KEY` - API key de Inmova como empresa (facturación B2B a clientes)

**Variables globales necesarias para Zucchetti**:
- `ZUCCHETTI_CLIENT_ID`
- `ZUCCHETTI_CLIENT_SECRET`
- `ZUCCHETTI_API_KEY`
- `ZUCCHETTI_API_URL`
- `ZUCCHETTI_OAUTH_URL`

### 2.2 STRIPE (Pagos por empresa)

| Campo | Vidaro | Rovida | Viroda |
|---|---|---|---|
| `stripeCustomerId` | PENDIENTE | PENDIENTE | PENDIENTE |

Cada sociedad necesita un Stripe Customer ID para facturación B2B (suscripción a Inmova).

### 2.3 OPEN BANKING / BANKINTER

| Variable | Estado | Notas |
|---|---|---|
| `REDSYS_API_URL` | Template solo | URL configurada pero sin credenciales |
| `REDSYS_OAUTH_URL` | Template solo | URL configurada pero sin credenciales |
| `REDSYS_BANKINTER_CODE` | OK (default) | `bankinter` |
| `REDSYS_CLIENT_ID` | **PENDIENTE** | Requiere registro en Redsys PSD2 Platform |
| `REDSYS_CLIENT_SECRET` | **PENDIENTE** | Requiere registro en Redsys PSD2 Platform |
| `REDSYS_CERTIFICATE_PATH` | **PENDIENTE** | Certificado eIDAS QWAC |
| `REDSYS_CERTIFICATE_KEY_PATH` | **PENDIENTE** | Clave del certificado QWAC |
| `REDSYS_SEAL_CERTIFICATE_PATH` | **PENDIENTE** | Certificado eIDAS QSealC |
| `REDSYS_SEAL_KEY_PATH` | **PENDIENTE** | Clave del certificado QSealC |

**Impacto**: Sin estas credenciales no se pueden sincronizar movimientos bancarios automáticamente de Bankinter. Actualmente los movimientos de Rovida y Vidaro se importan manualmente desde archivos CAMT.053 XML (`data/rovida/bancos/`, `data/vidaro/bancos/`).

### 2.4 PAGOS ALTERNATIVOS (Nivel empresa)

| Integración | Variables | Estado | Notas |
|---|---|---|---|
| **GoCardless** (SEPA) | `GOCARDLESS_ACCESS_TOKEN`, `GOCARDLESS_ENVIRONMENT` | PENDIENTE | Domiciliaciones bancarias SEPA para cobro de alquileres |
| **PayPal** | `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_ENVIRONMENT` | PENDIENTE | Pagos internacionales |
| **Bizum** | `BIZUM_MERCHANT_ID`, `BIZUM_SECRET_KEY`, `BIZUM_BANK_PROVIDER` | PENDIENTE | Pagos P2P en España |
| **Redsys TPV** | `REDSYS_MERCHANT_CODE`, `REDSYS_TERMINAL`, `REDSYS_SECRET_KEY` | PENDIENTE | TPV bancario español (3D Secure) |

### 2.5 CHANNEL MANAGERS (STR/Vacacional)

Relevante especialmente para **Viroda** (módulo STR activado):

| Integración | Variables (por empresa en BD) | Estado | Notas |
|---|---|---|---|
| **Airbnb** | `clientId`, `clientSecret` | PENDIENTE | Sincronización calendarios/reservas |
| **Booking.com** | `hotelId`, `username`, `password` | PENDIENTE | Sincronización calendarios/reservas |
| **Expedia** | Credenciales API | PENDIENTE | Tercer channel |

---

## 3. RESUMEN POR SOCIEDAD

### VIDARO INVERSIONES S.L. (Matriz - Holding)

| Categoría | Integración | Estado |
|---|---|---|
| Contabilidad | Contasimple | PENDIENTE - Necesita `contasimpleAuthKey` |
| Contabilidad | Zucchetti | PENDIENTE - Necesita OAuth tokens |
| Pagos | Stripe Customer ID | PENDIENTE |
| Open Banking | Bankinter (Redsys PSD2) | PENDIENTE - Importación manual CAMT.053 |
| Domiciliaciones | GoCardless | PENDIENTE |

**Datos ya importados**: Contabilidad 2025-2026 (5.829+ asientos), Movimientos bancarios (archivos XML en `data/vidaro/bancos/`).

### ROVIDA S.L. (Filial - Gestión inmobiliaria)

| Categoría | Integración | Estado |
|---|---|---|
| Contabilidad | Contasimple | PENDIENTE - Necesita `contasimpleAuthKey` |
| Contabilidad | Zucchetti | PENDIENTE - Necesita OAuth tokens |
| Pagos | Stripe Customer ID | PENDIENTE |
| Open Banking | Bankinter (Redsys PSD2) | PENDIENTE - Importación manual CAMT.053 |
| Domiciliaciones | GoCardless | PENDIENTE - Clave para 243+ inquilinos |
| Firma Digital | Signaturit/DocuSign | PENDIENTE - Clave para contratos |
| Seguros | Gestión de pólizas | Modelo BD listo, sin integración externa |

**Datos ya importados**: Contabilidad 2025-2026 (13.861+ líneas), Movimientos bancarios (archivos XML en `data/rovida/bancos/`), Edificios, inquilinos, contratos.

### VIRODA INVERSIONES S.L.U. (Filial - Residencial)

| Categoría | Integración | Estado |
|---|---|---|
| Contabilidad | Contasimple | PENDIENTE - Necesita `contasimpleAuthKey` |
| Contabilidad | Zucchetti | PENDIENTE - Necesita OAuth tokens |
| Pagos | Stripe Customer ID | PENDIENTE |
| Open Banking | Bankinter (Redsys PSD2) | PENDIENTE |
| Domiciliaciones | GoCardless | PENDIENTE - Para 101 inquilinos |
| Firma Digital | Signaturit/DocuSign | PENDIENTE |
| Channel Manager | Airbnb/Booking | PENDIENTE - Módulo STR activado |
| Seguros | Gestión de pólizas | Datos importados (PDFs), sin integración externa |

**Datos ya importados**: Contabilidad 2025-2026 (14.884+ líneas), PDFs de seguros, Edificios, inquilinos, contratos.

---

## 4. RESUMEN TOTAL DE CREDENCIALES

### Por criticidad

| Nivel | Cantidad | Detalle |
|---|---|---|
| **CRITICA** | 7 | AWS S3, Stripe, SMTP, Anthropic, Encryption Key, CRON Secret, MFA Key |
| **ALTA** | 5 | Signaturit, DocuSign, Contasimple (global), Bankinter PSD2, Zucchetti |
| **MEDIA** | 8 | Twilio, SendGrid, VAPID, Redis, Upstash, Sentry, Crisp, GoCardless |
| **BAJA** | 11 | GA4, Hotjar, Mapbox, Abacus AI, Facebook, Instagram, LinkedIn, Twitter, VAPI, PayPal, Bizum |

### Por tipo

| Tipo | Configuradas | Pendientes | Total |
|---|---|---|---|
| Variables de entorno globales | 3 (DB URL*, NextAuth URL, NextAuth Secret) | 28+ | 31+ |
| Credenciales por empresa (Vidaro) | 0 | 5 | 5 |
| Credenciales por empresa (Rovida) | 0 | 6 | 6 |
| Credenciales por empresa (Viroda) | 0 | 8 | 8 |
| **TOTAL** | **3** | **47+** | **50+** |

*DB URL es placeholder en repo, configurada en servidor de producción.

---

## 5. PLAN DE ACCION RECOMENDADO

### Fase 1 - Inmediata (Funcionalidad core)
1. Configurar `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY` + `AWS_BUCKET` + `AWS_REGION`
2. Configurar `STRIPE_SECRET_KEY` + `STRIPE_PUBLISHABLE_KEY` + `STRIPE_WEBHOOK_SECRET`
3. Configurar `SMTP_HOST` + `SMTP_USER` + `SMTP_PASSWORD` (Gmail App Password)
4. Configurar `ANTHROPIC_API_KEY`
5. Generar `ENCRYPTION_KEY`, `CRON_SECRET`, `MFA_ENCRYPTION_KEY` con `openssl rand -hex 32`

### Fase 2 - Corto plazo (Integraciones clave por empresa)
6. Registrar en Contasimple y obtener API keys para cada sociedad
7. Configurar Signaturit (firma digital de contratos)
8. Configurar GoCardless (domiciliaciones SEPA para cobro de alquileres)
9. Configurar Sentry (monitoreo de errores)

### Fase 3 - Medio plazo (Automatización)
10. Certificados eIDAS y credenciales Redsys PSD2 para Open Banking con Bankinter
11. Configurar channel managers Airbnb/Booking para Viroda (STR)
12. Configurar Twilio (SMS/WhatsApp)
13. Configurar Crisp (chat en vivo)

### Fase 4 - Largo plazo (Growth)
14. Google Analytics 4, Hotjar (analítica)
15. Redes sociales (Facebook, Instagram, LinkedIn, Twitter)
16. VAPI (asistente telefónico IA)
17. Mapbox (mapas interactivos)

---

**Generado por**: Cursor Agent  
**Fecha**: 12 de febrero de 2026
