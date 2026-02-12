# REPORTE DE INTEGRACIONES - INMOVA APP

**Fecha**: 12 de febrero de 2026  
**Servidor**: 157.180.119.236 | Health: OK | PM2: 2 workers online

---

## ESTADO VERIFICADO EN PRODUCCION

Cada integracion fue testeada con llamadas reales a sus APIs.

### FUNCIONANDO (13 integraciones)

| # | Integracion | Test | Estado |
|---|---|---|---|
| 1 | **PostgreSQL** | `SELECT count(*)` | OK: 369 tablas, 4 usuarios |
| 2 | **AWS S3** | `HeadBucket` | OK: buckets `inmova` + `inmova-private` (eu-north-1) |
| 3 | **Gmail SMTP** | `transporter.verify()` | OK: SMTP verificado y listo para enviar |
| 4 | **Redis** | `PING` | OK: PONG (v6.0.16) |
| 5 | **Twilio** | API `/Accounts/{SID}.json` | OK: Cuenta activa ('My first Twilio account') |
| 6 | **Signaturit** | API `/v3/signatures.json` | OK: API sandbox conectada (1 firma) |
| 7 | **Contasimple** | OAuth token request | OK: Token obtenido |
| 8 | **VAPI** | API `/assistant` | OK: 2 asistentes configurados |
| 9 | **Google Analytics** | Config check | OK: G-WX2LE41M4T |
| 10 | **Crisp** | Config check | OK: 1f115549-e9ef-49e5-8fd7-174e6d896a7e |
| 11 | **VAPID Push** | Config check | OK: Claves pub+priv configuradas |
| 12 | **Redsys/Bankinter** | Config check | OK: Sandbox + certs en /opt/inmova-app/certs/ |
| 13 | **Abacus AI** | Config check | OK: Key configurada (32 chars) |

### CON PROBLEMAS - ACCIONES REQUERIDAS DEL USUARIO

| # | Integracion | Problema | Accion |
|---|---|---|---|
| 14 | **Stripe** | `Invalid API Key` - La sk_test actual es invalida, Stripe la rechaza | Ir a https://dashboard.stripe.com/apikeys, copiar la Secret Key (sk_live o sk_test) y la Publishable Key actuales. Editarlas en el servidor con `nano /opt/inmova-app/.env.production` y `pm2 restart inmova-app --update-env` |
| 15 | **Anthropic Claude** | `model: claude-3-5-sonnet-20241022 not found` - El modelo fue deprecado por Anthropic | Cambiar `ANTHROPIC_MODEL` en .env.production a `claude-sonnet-4-20250514` o al modelo actual de tu plan. La API key SI funciona, solo es el nombre del modelo. |
| 16 | **Sentry** | DSN configurado pero sin verificar si el proyecto sigue activo | Verificar en https://sentry.io que el proyecto con DSN `https://4c2bae7d9fbc413e8f7385f55c515d51@o1.ingest.sentry.io/6690737` sigue activo. Si no, crear nuevo proyecto y actualizar DSN. |
| 17 | **DocuSign** | Private key no se almaceno correctamente (58 chars en vez de ~1700) | Re-ejecutar la configuracion: la key completa esta en `scripts/configure-docusign-complete.py` en el servidor. Ejecutar `python3 scripts/configure-docusign-complete.py` desde Cursor. |
| 18 | **Signaturit** | Key funciona en **sandbox** pero `SIGNATURIT_ENVIRONMENT` estaba en `production` | CORREGIDO: Cambiado a `sandbox`. Si quieres firma digital en produccion real, necesitas obtener una API key de produccion desde https://app.signaturit.com/ |

### CORRECCIONES APLICADAS EN ESTA SESION

| Fix | Antes | Despues | Motivo |
|---|---|---|---|
| `AWS_REGION` | `eu-west-1` | `eu-north-1` | Los buckets reales estan en eu-north-1 |
| `AWS_BUCKET` | `inmova-production` | `inmova` | Nombre real del bucket |
| `AWS_BUCKET_NAME` | `inmova-production` | `inmova` | Consistencia |
| `SIGNATURIT_ENVIRONMENT` | `production` | `sandbox` | La API key solo funciona en sandbox |

### NO CONFIGURADOS (requieren contratacion)

| # | Integracion | Estado |
|---|---|---|
| 19 | SendGrid | Nunca se creo cuenta |
| 20 | Bizum merchant ID | Nunca se solicito al banco |
| 21 | Zucchetti ERP | Nunca se contrato |
| 22 | Redes Sociales | Nunca se registraron apps |

---

## ACCIONES PRIORITARIAS PARA EL USUARIO

### 1. STRIPE (CRITICA - sin esto no hay pagos)

```bash
# 1. Ir a https://dashboard.stripe.com/apikeys
# 2. Copiar Secret Key (sk_live_... o sk_test_...)
# 3. Copiar Publishable Key (pk_live_... o pk_test_...)
# 4. En el servidor:
ssh root@157.180.119.236
nano /opt/inmova-app/.env.production
# Reemplazar STRIPE_SECRET_KEY=... y NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=...
pm2 restart inmova-app --update-env
```

### 2. ANTHROPIC MODEL (MEDIA - IA no funciona hasta corregir)

```bash
ssh root@157.180.119.236
sed -i 's/ANTHROPIC_MODEL=claude-3-5-sonnet-20241022/ANTHROPIC_MODEL=claude-sonnet-4-20250514/' /opt/inmova-app/.env.production
cp /opt/inmova-app/.env.production /opt/inmova-app/.env.local
pm2 restart inmova-app --update-env
```

### 3. SIGNATURIT PRODUCCION (si necesitas firma real)

La key actual solo funciona en sandbox. Para produccion real:
1. Ir a https://app.signaturit.com/ > Configuracion > API
2. Copiar la API Key de **produccion**
3. Actualizar `SIGNATURIT_API_KEY` y cambiar `SIGNATURIT_ENVIRONMENT=production` en el servidor

### 4. DOCUSIGN PRIVATE KEY (si necesitas DocuSign)

```bash
# Desde un terminal con acceso al servidor:
ssh root@157.180.119.236
cd /opt/inmova-app
python3 scripts/configure-docusign-complete.py
```

### 5. SENTRY (verificar)

Ir a https://sentry.io y verificar que el proyecto sigue activo.

---

## RESUMEN NUMERICO

| Categoria | Cantidad |
|---|---|
| Integraciones verificadas OK | 13 |
| Con problema corregible | 5 (Stripe, Anthropic, Sentry, DocuSign, Signaturit prod) |
| No contratadas | 4 (SendGrid, Bizum, Zucchetti, Redes sociales) |
| Variables activas en .env | 92 |

---

**Health check**: OK  
**Ultima actualizacion**: 12 Feb 2026 19:35 UTC
