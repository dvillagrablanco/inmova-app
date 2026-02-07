# 🔌 AUDITORÍA COMPLETA DE INTEGRACIONES - INMOVA APP

**Fecha de Auditoría:** 1 de Febrero de 2026  
**Versión:** 1.0  
**Auditor:** Claude (Cursor Agent)

---

## 📊 RESUMEN EJECUTIVO

| Categoría | Total | Completas | Parciales | Sin Configurar |
|-----------|-------|-----------|-----------|----------------|
| **Críticas** | 10 | 4 | 4 | 2 |
| **Importantes** | 12 | 3 | 5 | 4 |
| **Opcionales** | 8 | 1 | 3 | 4 |
| **TOTAL** | 30 | 8 (27%) | 12 (40%) | 10 (33%) |

---

## 🔴 INTEGRACIONES CRÍTICAS

### 1. AWS S3 (Almacenamiento de Archivos) ⚠️ PARCIAL

**Archivo:** `lib/s3-service.ts`

**Estado:** Código completo con fallback a simulación

**Variables de Entorno Requeridas:**
```env
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=eu-west-1
AWS_S3_BUCKET=inmova-properties
AWS_CLOUDFRONT_URL=  # Opcional para CDN
```

**Lo que FALTA:**
- [ ] Credenciales de AWS reales configuradas
- [ ] Bucket S3 creado en AWS
- [ ] Configuración de CloudFront para CDN (opcional pero recomendado)
- [ ] Políticas de IAM adecuadas para el usuario
- [ ] Configuración de CORS en el bucket

**Funcionalidades Implementadas:** ✅
- Upload de archivos
- Delete de archivos
- URLs firmadas temporales
- Validación de tipos de archivo
- Simulación para desarrollo

---

### 2. Stripe (Pagos) ⚠️ PARCIAL

**Archivos:** 
- `lib/stripe-connect-service.ts`
- `lib/stripe-subscription-service.ts`
- `lib/stripe-coupon-service.ts`

**Estado:** Código completo, requiere credenciales de producción

**Variables de Entorno Requeridas:**
```env
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

**Lo que FALTA:**
- [ ] Webhook endpoint configurado en Stripe Dashboard
- [ ] Productos/Precios creados en Stripe para planes de suscripción
- [ ] Pruebas en modo live (actualmente solo test)
- [ ] Configuración de Stripe Connect para cuentas de gestores
- [ ] Configuración de SCA (Strong Customer Authentication) para EU

**Funcionalidades Implementadas:** ✅
- Stripe Connect (multi-tenant)
- Suscripciones
- Pagos únicos con platform fee
- Cupones de descuento
- Webhooks básicos

---

### 3. NextAuth (Autenticación) ✅ COMPLETA

**Archivo:** `lib/auth-options.ts`

**Estado:** Completa y funcional

**Variables de Entorno:**
```env
NEXTAUTH_SECRET=  # Generado
NEXTAUTH_URL=https://inmovaapp.com
```

**Funcionalidades:** ✅ Todas implementadas
- Login con credenciales
- Sesiones JWT
- Middleware de protección de rutas
- Multi-tenant

---

### 4. PostgreSQL (Base de Datos) ✅ COMPLETA

**Archivo:** `lib/db.ts`, `prisma/schema.prisma`

**Estado:** Completa

**Variables de Entorno:**
```env
DATABASE_URL=postgresql://user:pass@host:5432/inmova_production
```

---

### 5. Email (SMTP/Gmail) ⚠️ PARCIAL

**Archivo:** `lib/email-service.ts`

**Estado:** Básico implementado

**Variables de Entorno Requeridas:**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=  # App Password de Google
SMTP_SECURE=false
```

**Lo que FALTA:**
- [ ] Más plantillas de email (actualmente solo bienvenida)
- [ ] Cola de emails con reintentos (usar BullMQ)
- [ ] Tracking de apertura/clics
- [ ] Gestión de bounces
- [ ] Unsubscribe link automático
- [ ] Templates HTML profesionales para todos los tipos de notificación

**Funcionalidades Implementadas:**
- Envío básico de emails
- Plantilla de bienvenida

---

### 6. SendGrid (Email Profesional) ⚠️ PARCIAL

**Archivo:** `lib/sendgrid-service.ts`

**Estado:** Código completo, requiere credenciales

**Variables de Entorno Requeridas:**
```env
SENDGRID_API_KEY=SG...
SENDGRID_FROM_EMAIL=noreply@inmova.app
```

**Lo que FALTA:**
- [ ] API Key de SendGrid configurada
- [ ] Dominio verificado en SendGrid
- [ ] Templates de SendGrid creados
- [ ] Configuración de SPF/DKIM
- [ ] Integrar con sistema de notificaciones

**Funcionalidades Implementadas:** ✅
- Envío de emails con attachments
- Soporte para templates dinámicos
- Plantillas predefinidas (bienvenida, pago, recordatorio)

---

### 7. Signaturit (Firma Digital) ⚠️ PARCIAL

**Archivo:** `lib/signaturit-service.ts`

**Estado:** Código completo, requiere credenciales

**Variables de Entorno Requeridas:**
```env
SIGNATURIT_API_KEY=
SIGNATURIT_ENV=sandbox  # o production
SIGNATURIT_WEBHOOK_SECRET=
```

**Lo que FALTA:**
- [ ] Cuenta de Signaturit activada
- [ ] API Key de producción
- [ ] Configuración de webhooks para estados de firma
- [ ] Integración con generador de contratos
- [ ] Templates de firma en Signaturit
- [ ] Pruebas E2E del flujo completo

**Funcionalidades Implementadas:** ✅
- Crear solicitud de firma
- Obtener estado
- Cancelar firma
- Descargar documento firmado
- Verificación de webhooks

---

### 8. DocuSign (Firma Digital Alternativa) ❌ INCOMPLETA

**Archivo:** `lib/digital-signature-service.ts`

**Estado:** Implementación mock/simulada

**Variables de Entorno Requeridas:**
```env
DOCUSIGN_INTEGRATION_KEY=
DOCUSIGN_USER_ID=
DOCUSIGN_ACCOUNT_ID=
DOCUSIGN_PRIVATE_KEY=
DOCUSIGN_BASE_PATH=https://demo.docusign.net/restapi
```

**Lo que FALTA:**
- [ ] **SDK oficial de DocuSign no integrado**
- [ ] Implementación real de createSignatureRequest
- [ ] Implementación real de getSignatureStatus
- [ ] OAuth flow para autenticación
- [ ] Manejo de envelopes
- [ ] Templates de DocuSign
- [ ] Webhooks (Connect)

**Funcionalidades Implementadas:**
- Solo estructura/mock - NO funcional

---

### 9. Redis (Cache/Colas) ⚠️ PARCIAL

**Archivo:** `lib/redis-cache-service.ts`

**Estado:** Código completo con fallback a memoria

**Variables de Entorno Requeridas:**
```env
REDIS_URL=redis://localhost:6379
# O Upstash:
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

**Lo que FALTA:**
- [ ] Redis server corriendo (local o Upstash)
- [ ] Configuración de persistencia
- [ ] Monitoreo de Redis
- [ ] Integración con BullMQ para colas

**Funcionalidades Implementadas:** ✅
- Cache distribuido
- Fallback a memoria
- Invalidación por patrón
- Estadísticas

---

### 10. Push Notifications (VAPID) ⚠️ PARCIAL

**Archivo:** `lib/push-notification-service.ts`

**Estado:** Código completo, requiere keys VAPID

**Variables de Entorno Requeridas:**
```env
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
NEXT_PUBLIC_VAPID_PUBLIC_KEY=  # Mismo que VAPID_PUBLIC_KEY
```

**Generar keys:**
```bash
npx web-push generate-vapid-keys
```

**Lo que FALTA:**
- [ ] Keys VAPID generadas y configuradas
- [ ] Service Worker registrado en frontend
- [ ] UI para solicitar permiso de notificaciones
- [ ] Integración con eventos del sistema

**Funcionalidades Implementadas:** ✅
- Guardar suscripciones
- Enviar notificaciones
- Múltiples tipos de notificación
- Logging de envíos

---

## 🟡 INTEGRACIONES IMPORTANTES

### 11. Twilio/SMS ⚠️ PARCIAL

**Archivo:** `lib/sms-service.ts`

**Estado:** Código completo con fallback a simulación

**Variables de Entorno Requeridas:**
```env
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=
TWILIO_FROM_NUMBER=+34...
```

**Lo que FALTA:**
- [ ] Cuenta Twilio activada
- [ ] Número de teléfono comprado
- [ ] Verificación del número
- [ ] Templates de SMS aprobados

**Funcionalidades Implementadas:** ✅
- Envío de SMS
- Templates personalizables
- SMS programados
- Variables dinámicas
- Logs de envío

---

### 12. WhatsApp Business API ❌ INCOMPLETA

**Archivo:** `lib/integrations/whatsapp.ts`

**Estado:** Código completo pero requiere configuración compleja

**Variables de Entorno Requeridas:**
```env
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_BUSINESS_ACCOUNT_ID=
WHATSAPP_VERIFY_TOKEN=
```

**Lo que FALTA:**
- [ ] **Cuenta de WhatsApp Business aprobada por Meta**
- [ ] Verificación del número de teléfono
- [ ] Templates aprobados por WhatsApp
- [ ] Webhook configurado
- [ ] Manejo de conversaciones
- [ ] Límites de mensajería respetados

**Funcionalidades Implementadas:**
- Envío de mensajes
- Templates
- Imágenes y documentos
- Ubicación
- Auto-respuestas básicas

---

### 13. Anthropic Claude (IA) ⚠️ PARCIAL

**Archivos:**
- `lib/ai-service.ts` (usa AbacusAI)
- `lib/claude-assistant-service.ts`

**Estado:** Código implementado, usa AbacusAI como wrapper

**Variables de Entorno Requeridas:**
```env
ANTHROPIC_API_KEY=sk-ant-...
ABACUSAI_API_KEY=  # Alternativo
```

**Lo que FALTA:**
- [ ] Decidir proveedor: Claude directo o AbacusAI
- [ ] API Key configurada
- [ ] Rate limiting implementado
- [ ] Caché de respuestas
- [ ] Tracking de tokens/costos
- [ ] Prompts optimizados para cada caso de uso

**Funcionalidades Implementadas:**
- Generación de descripciones
- Análisis de documentos
- Chatbot de soporte
- Sugerencias proactivas
- Contenido para redes sociales

---

### 14. Mapbox (Mapas/Geocoding) ⚠️ PARCIAL

**Archivo:** `lib/mapbox-service.ts`

**Estado:** Código completo con simulación

**Variables de Entorno Requeridas:**
```env
NEXT_PUBLIC_MAPBOX_TOKEN=pk.ey...
```

**Lo que FALTA:**
- [ ] Cuenta Mapbox creada
- [ ] Token de acceso configurado
- [ ] Estilo de mapa personalizado (opcional)
- [ ] Limites de uso monitoreados

**Funcionalidades Implementadas:** ✅
- Geocoding de direcciones
- Mapas estáticos
- POIs cercanos
- Simulación para desarrollo

---

### 15. ContaSimple (Contabilidad España) ⚠️ PARCIAL

**Archivo:** `lib/contasimple-integration-service.ts`

**Estado:** Código completo

**Variables de Entorno Requeridas:**
```env
CONTASIMPLE_AUTH_KEY=
CONTASIMPLE_API_URL=https://api.contasimple.com/api/v2
```

**Lo que FALTA:**
- [ ] Cuenta ContaSimple activa
- [ ] Clave de autorización
- [ ] Mapeo de categorías contables
- [ ] Sincronización automática
- [ ] Pruebas de facturación

**Funcionalidades Implementadas:** ✅
- Clientes
- Facturas
- Pagos
- Gastos
- Sincronización con INMOVA

---

### 16. QuickBooks (Contabilidad Internacional) ❌ INCOMPLETA

**Archivo:** `lib/quickbooks-integration.ts`

**Estado:** Estructura implementada, requiere OAuth flow

**Variables de Entorno Requeridas:**
```env
QUICKBOOKS_CLIENT_ID=
QUICKBOOKS_CLIENT_SECRET=
QUICKBOOKS_ENVIRONMENT=sandbox  # o production
QUICKBOOKS_REDIRECT_URI=
```

**Lo que FALTA:**
- [ ] **OAuth 2.0 flow completo**
- [ ] Almacenamiento seguro de tokens refresh
- [ ] Manejo de expiración de tokens
- [ ] Mapeo de cuentas contables
- [ ] Sincronización bidireccional
- [ ] Reconciliación automática

**Funcionalidades Implementadas:**
- Estructura de cliente
- Crear/obtener clientes
- Crear/obtener facturas
- Crear gastos

---

### 17. Open Banking / Bankinter (PSD2) ⚠️ PARCIAL

**Archivos:**
- `lib/open-banking-service.ts`
- `lib/bankinter-integration-service.ts`
- `lib/redsys-psd2-service.ts`

**Estado:** Código completo con fallback a demo

**Variables de Entorno Requeridas:**
```env
REDSYS_API_URL=https://apis-i.redsys.es:20443/psd2/xs2a/api-entrada-xs2a/services
REDSYS_OAUTH_URL=https://apis-i.redsys.es:20443/psd2/xs2a/api-oauth-xs2a
REDSYS_BANKINTER_CODE=bankinter
REDSYS_CLIENT_ID=
REDSYS_CLIENT_SECRET=
REDSYS_CERTIFICATE_PATH=
REDSYS_CERTIFICATE_KEY_PATH=
```

**Lo que FALTA:**
- [ ] **Certificados eIDAS (costosos y complejos)**
- [ ] Homologación con Redsys
- [ ] Contrato con banco
- [ ] Pruebas en sandbox de Redsys
- [ ] Manejo de SCA (autenticación fuerte)
- [ ] Renovación de consentimientos

**Funcionalidades Implementadas:**
- Conexión de cuentas
- Sincronización de transacciones
- Verificación de ingresos
- Conciliación de pagos
- Iniciación de pagos

---

### 18. OCR (Reconocimiento de Documentos) ✅ COMPLETA

**Archivo:** `lib/ocr-service.ts`

**Estado:** Funcional (Tesseract.js local)

**Dependencias:** tesseract.js, pdf-parse, mammoth

**Lo que podría MEJORAR:**
- [ ] OCR en la nube para mayor precisión (Google Vision, AWS Textract)
- [ ] Entrenamiento para documentos específicos (DNI, contratos)
- [ ] Validación de datos extraídos

**Funcionalidades Implementadas:** ✅
- OCR de imágenes
- Extracción de DNI español
- Procesamiento de PDFs
- Procesamiento de DOC/DOCX
- Extracción de datos de contratos

---

### 19. Sentry (Monitoreo de Errores) ⚠️ PARCIAL

**Variables de Entorno Requeridas:**
```env
SENTRY_DSN=https://...@sentry.io/...
NEXT_PUBLIC_SENTRY_DSN=  # Mismo valor
SENTRY_ORG=inmova
SENTRY_PROJECT=inmova-app
SENTRY_AUTH_TOKEN=  # Para source maps
```

**Lo que FALTA:**
- [ ] Proyecto Sentry creado
- [ ] DSN configurado
- [ ] Source maps subidos
- [ ] Alertas configuradas
- [ ] Performance monitoring activado

---

### 20. Slack (Notificaciones Internas) ⚠️ PARCIAL

**Archivo:** `lib/integrations/slack.ts`

**Estado:** Código completo

**Variables de Entorno Requeridas:**
```env
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
```

**Lo que FALTA:**
- [ ] Webhook de Slack configurado
- [ ] Canal de notificaciones creado
- [ ] Diferentes canales para diferentes tipos de alertas

**Funcionalidades Implementadas:** ✅
- Notificación de propiedades
- Notificación de contratos
- Notificación de pagos
- Alertas de mantenimiento
- Errores críticos

---

### 21. Google Analytics 4 ⚠️ PARCIAL

**Archivo:** `lib/integrations/google-analytics.ts`

**Estado:** Código completo

**Variables de Entorno Requeridas:**
```env
NEXT_PUBLIC_GA4_MEASUREMENT_ID=G-...
GA4_API_SECRET=  # Para Measurement Protocol
```

**Lo que FALTA:**
- [ ] Propiedad GA4 creada
- [ ] Stream de datos configurado
- [ ] Eventos personalizados definidos
- [ ] Conversiones marcadas
- [ ] Integración con Tag Manager (opcional)

**Funcionalidades Implementadas:** ✅
- Page views
- Eventos personalizados
- Conversiones
- Tracking de propiedades/contratos/pagos

---

### 22. HubSpot (CRM) ❌ INCOMPLETA

**Archivo:** `lib/integrations/hubspot.ts`

**Estado:** Estructura completa, requiere OAuth

**Variables de Entorno Requeridas:**
```env
HUBSPOT_CLIENT_ID=
HUBSPOT_CLIENT_SECRET=
HUBSPOT_ACCESS_TOKEN=
```

**Lo que FALTA:**
- [ ] **OAuth flow completo**
- [ ] Refresh de tokens
- [ ] Mapeo de propiedades personalizadas
- [ ] Pipeline de deals configurado
- [ ] Workflows de automatización
- [ ] Sincronización bidireccional

**Funcionalidades Implementadas:**
- Crear/actualizar contactos
- Crear deals
- Crear notas/tareas
- Sync automático en eventos

---

## 🟢 INTEGRACIONES OPCIONALES

### 23. Zapier ✅ COMPLETA

**Directorio:** `integrations/zapier/`

**Estado:** Estructura completa para publicar

**Lo que FALTA:**
- [ ] Publicar en Zapier Developer Platform
- [ ] Pruebas de integración
- [ ] Documentación para usuarios

**Funcionalidades:**
- Actions: crear contrato/propiedad/inquilino
- Triggers: contrato firmado, pago recibido
- Searches: buscar propiedad

---

### 24. Holded (Contabilidad) ❌ NO IMPLEMENTADA

**Archivo:** `lib/holded-integration-service.ts`

**Estado:** Solo estructura básica

**Lo que FALTA:**
- [ ] **Implementación completa del API**
- [ ] OAuth/API Key
- [ ] Mapeo de datos
- [ ] Sincronización

---

### 25. A3 (Contabilidad España) ❌ NO IMPLEMENTADA

**Archivo:** `lib/a3-integration-service.ts`

**Estado:** Solo estructura

---

### 26. Sage (Contabilidad) ❌ NO IMPLEMENTADA

**Archivo:** `lib/sage-integration-service.ts`

**Estado:** Solo estructura

---

### 27. Zucchetti (Contabilidad) ❌ NO IMPLEMENTADA

**Archivo:** `lib/zucchetti-integration-service.ts`

**Estado:** Solo estructura

---

### 28. Social Media Automation ⚠️ PARCIAL

**Archivos:**
- `lib/social-media-automation-service.ts`
- `lib/social-media-service.ts`

**Estado:** Código de ejemplo

**Lo que FALTA:**
- [ ] APIs de Instagram/Facebook/LinkedIn configuradas
- [ ] Tokens de acceso
- [ ] Generación de imágenes de marketing
- [ ] Programación de publicaciones

---

### 29. Insurance Providers ❌ NO IMPLEMENTADA

**Archivo:** `lib/integrations/insurance-providers.ts`

**Estado:** Solo estructura

---

### 30. WebRTC (Videollamadas) ⚠️ PARCIAL

**Archivo:** `lib/webrtc-service.ts`

**Estado:** Estructura básica

**Lo que FALTA:**
- [ ] TURN/STUN servers
- [ ] UI de videollamada
- [ ] Grabación (opcional)

---

## 📋 PRIORIDADES DE IMPLEMENTACIÓN

### 🔴 ALTA PRIORIDAD (Próximas 2 semanas)

1. **AWS S3** - Necesario para upload de documentos/fotos
2. **Stripe en producción** - Monetización
3. **Signaturit configurado** - Firma digital de contratos
4. **SendGrid** - Emails profesionales
5. **Redis** - Performance de cache
6. **Push Notifications VAPID** - Engagement

### 🟡 MEDIA PRIORIDAD (Próximo mes)

7. **Twilio SMS** - Recordatorios de pago
8. **Mapbox** - Mapas en propiedades
9. **Sentry** - Monitoreo de errores
10. **Google Analytics** - Métricas
11. **ContaSimple** - Facturación España

### 🟢 BAJA PRIORIDAD (Futuro)

12. **DocuSign** (alternativa a Signaturit)
13. **QuickBooks** (mercado internacional)
14. **HubSpot** (CRM avanzado)
15. **WhatsApp Business** (comunicación)
16. **Open Banking** (verificación de ingresos)

---

## 📝 VARIABLES DE ENTORNO COMPLETAS

```env
# ============================================
# CRÍTICAS (OBLIGATORIAS PARA PRODUCCIÓN)
# ============================================

# Database
DATABASE_URL=postgresql://user:pass@host:5432/inmova_production

# NextAuth
NEXTAUTH_SECRET=
NEXTAUTH_URL=https://inmovaapp.com

# AWS S3
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=eu-west-1
AWS_S3_BUCKET=inmova-properties

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...

# Email SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=

# Firma Digital (Signaturit)
SIGNATURIT_API_KEY=
SIGNATURIT_ENV=production
SIGNATURIT_WEBHOOK_SECRET=

# Redis
REDIS_URL=redis://localhost:6379

# Push Notifications
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
NEXT_PUBLIC_VAPID_PUBLIC_KEY=

# ============================================
# IMPORTANTES (RECOMENDADAS)
# ============================================

# SendGrid (alternativa a SMTP)
SENDGRID_API_KEY=
SENDGRID_FROM_EMAIL=

# Twilio SMS
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_FROM_NUMBER=

# IA
ANTHROPIC_API_KEY=
# o
ABACUSAI_API_KEY=

# Mapbox
NEXT_PUBLIC_MAPBOX_TOKEN=

# Monitoreo
SENTRY_DSN=
NEXT_PUBLIC_SENTRY_DSN=

# Analytics
NEXT_PUBLIC_GA4_MEASUREMENT_ID=
GA4_API_SECRET=

# Slack
SLACK_WEBHOOK_URL=

# Contabilidad
CONTASIMPLE_AUTH_KEY=
CONTASIMPLE_API_URL=

# ============================================
# OPCIONALES (FUTURAS INTEGRACIONES)
# ============================================

# DocuSign
DOCUSIGN_INTEGRATION_KEY=
DOCUSIGN_USER_ID=
DOCUSIGN_ACCOUNT_ID=
DOCUSIGN_PRIVATE_KEY=

# QuickBooks
QUICKBOOKS_CLIENT_ID=
QUICKBOOKS_CLIENT_SECRET=

# WhatsApp
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_BUSINESS_ACCOUNT_ID=

# HubSpot
HUBSPOT_CLIENT_ID=
HUBSPOT_CLIENT_SECRET=

# Open Banking
REDSYS_CLIENT_ID=
REDSYS_CLIENT_SECRET=
REDSYS_CERTIFICATE_PATH=
```

---

## 🔧 SCRIPTS DE VERIFICACIÓN

Ya existe un script para verificar el estado de las integraciones:

```bash
# Verificar estado de todas las integraciones
npx tsx scripts/verify-integrations.ts

# API de estado
GET /api/admin/integraciones/status
GET /api/integrations/status
GET /api/health/detailed
```

---

## 📊 ESTIMACIÓN DE COSTOS MENSUALES

| Servicio | Plan Básico | Plan Profesional |
|----------|-------------|------------------|
| AWS S3 | ~€5/mes | ~€20/mes |
| Stripe | 1.4% + €0.25/tx | 1.4% + €0.25/tx |
| Signaturit | €99/mes | €299/mes |
| SendGrid | Gratis (100/día) | €15/mes |
| Twilio | ~€0.08/SMS | ~€0.08/SMS |
| Redis (Upstash) | Gratis | €10/mes |
| Mapbox | Gratis (50K req) | €50/mes |
| Sentry | Gratis (5K eventos) | €26/mes |
| **TOTAL ESTIMADO** | **~€105/mes** | **~€420/mes** |

---

## ✅ CHECKLIST DE LANZAMIENTO

### Antes de Launch:
- [ ] AWS S3 configurado y probado
- [ ] Stripe en modo live con webhook
- [ ] Signaturit o firma digital activa
- [ ] Email funcional (Gmail o SendGrid)
- [ ] Redis para cache
- [ ] Sentry para errores
- [ ] Google Analytics para métricas

### Post-Launch (Mes 1):
- [ ] Push notifications activadas
- [ ] SMS para recordatorios
- [ ] Mapbox para propiedades
- [ ] Slack para alertas internas

### Escalamiento (Mes 2+):
- [ ] Contabilidad (ContaSimple/QuickBooks)
- [ ] WhatsApp Business
- [ ] Open Banking
- [ ] HubSpot CRM

---

**Documento generado automáticamente por auditoría de código.**
**Actualizar después de cada configuración de integración.**
