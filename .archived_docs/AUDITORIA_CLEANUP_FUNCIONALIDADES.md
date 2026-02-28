# AUDITORÍA DE FUNCIONALIDADES ELIMINADAS EN CLEANUPS

**Fecha**: 21 de febrero de 2026  
**Commit principal de cleanup**: `de8e6ec2` (15 Feb 2026)  
**Total archivos eliminados**: 96 servicios (~35.000 líneas de código)  
**Commits adicionales**: `5fe13ee0` (rate limiting), `e6e37ec9` (react-hot-toast → sonner)

---

## RESUMEN EJECUTIVO

| Categoría | Eliminados | Ya recuperados | Rotos (import roto) | Recomendación |
|-----------|-----------|----------------|---------------------|---------------|
| Stripe/Pagos | 1 | 1 (✅ recuperado) | 0 | - |
| Contabilidad | 7 | 1 parcial | 0 | Evaluar |
| IA/Chatbots | 7 | 0 | 0 | Evaluar |
| Channel Managers (STR) | 4 | 0 | 0 | Evaluar |
| Comunicación (SMS/WebRTC) | 4 | 0 | 2 imports rotos | Evaluar |
| Redes Sociales | 2 | 0 | 2 imports rotos | Evaluar |
| Firma Digital | 1 | 0 | 0 | RECUPERAR |
| Automatización/Workflow | 3 | 0 | 0 | Evaluar |
| Pagos alternativos | 2 | 0 | 0 | Evaluar |
| PropTech avanzado | 8 | 0 | 0 | Baja prioridad |
| Infraestructura/Cache | 5 | 0 | 0 | Evaluar |
| Seguridad/SEO | 6 | 0 | 0 | Baja prioridad |
| Utilidades | 8 | 0 | 0 | No recuperar |
| **TOTAL** | **96** | **2** | **4** | |

---

## 🔴 PRIORIDAD ALTA - Funcionalidades con impacto directo en negocio

### 1. Firma Digital (Signaturit/DocuSign) — `digital-signature-service.ts` (757 líneas)
- **Qué hacía**: Integración con Signaturit y DocuSign para firma electrónica de contratos con validez legal (eIDAS)
- **Estado actual**: ELIMINADO. No hay firma digital funcional
- **Impacto**: Los contratos NO se pueden firmar digitalmente. Feature crítica del plan Profesional+
- **¿Recuperar?**: **SÍ** — Es feature core del producto y está en los planes de suscripción
- **Esfuerzo**: Medio (recuperar del git history + adaptar lazy loading)

### 2. Screening de Inquilinos — `screening-service.ts` (495 líneas)
- **Qué hacía**: Verificación de solvencia, puntuación de riesgo de inquilinos vía Experian/Equifax
- **Estado actual**: ELIMINADO
- **Impacto**: No hay verificación de solvencia. Add-on "tenant_screening" a €20/mes en pricing
- **¿Recuperar?**: **SÍ** — Es add-on de pago listado en pricing-config
- **Esfuerzo**: Medio

### 3. Stripe Subscription Service — `stripe-subscription-service.ts` (606 líneas)
- **Qué hacía**: Checkout sessions, sync de productos, gestión de clientes Stripe
- **Estado actual**: ✅ **YA RECUPERADO** en este PR
- **Impacto**: Era crítico — el flujo de compra de planes/addons estaba completamente roto

### 4. Contasimple Integration — `contasimple-integration-service.ts` (592 líneas)
- **Qué hacía**: Conexión real con API Contasimple para crear clientes, facturas, registrar pagos
- **Estado actual**: ✅ **YA RECUPERADO** en este PR (reimplementado)
- **Impacto**: Era crítico — la facturación automática no funcionaba

---

## 🟡 PRIORIDAD MEDIA - Funcionalidades de valor para clientes

### 5. Integraciones Contables (6 servicios eliminados)

| Servicio | Líneas | Qué hacía | ¿Recuperar? |
|----------|--------|-----------|-------------|
| `holded-integration-service.ts` | 464 | Sync con Holded (contabilidad española) | Evaluar demanda |
| `sage-integration-service.ts` | 446 | Sync con Sage 50/200 | Evaluar demanda |
| `a3-integration-service.ts` | 436 | Sync con A3 Innuva | Evaluar demanda |
| `alegra-integration-service.ts` | 484 | Sync con Alegra (Latam) | Baja prioridad |
| `quickbooks-integration.ts` | 510 | Sync con QuickBooks | Evaluar demanda |
| `xero-integration.ts` | 509 | Sync con Xero | Evaluar demanda |

- **Nota**: El add-on "accounting_integration" (€30/mes) lista conexión con A3, Sage, Holded
- **Zucchetti/Altai**: NO fue eliminado — sigue funcional en `lib/zucchetti-altai-service.ts`
- **Recomendación**: Recuperar Holded y Sage primero (mercado español principal)

### 6. Channel Managers STR (4 servicios)

| Servicio | Líneas | Qué hacía |
|----------|--------|-----------|
| `airbnb-integration.ts` | 466 | Sync de listings/bookings con Airbnb |
| `booking-integration.ts` | 439 | Sync con Booking.com |
| `expedia-integration.ts` | 469 | Sync con Expedia |
| `vrbo-integration.ts` | 467 | Sync con VRBO |

- **Estado**: ELIMINADOS. El vertical STR (Short-Term Rental) no tiene channel managers
- **Impacto**: El plan Business lista "airbnb, booking, vrbo" en integraciones
- **Recomendación**: Recuperar Airbnb + Booking si el vertical STR tiene clientes activos

### 7. Twilio SMS/WhatsApp — `twilio-integration.ts` (419 líneas)
- **Qué hacía**: Envío de SMS y WhatsApp vía Twilio para notificaciones a inquilinos
- **Estado actual**: ELIMINADO. Los packs de SMS (€10-70/mes) no funcionan
- **Impacto**: Add-ons sms_pack_100/500/1000 en pricing no tienen backend
- **¿Recuperar?**: **SÍ** si se venden packs de SMS
- **Esfuerzo**: Bajo-Medio

### 8. IA y Chatbots (7 servicios)

| Servicio | Líneas | Qué hacía |
|----------|--------|-----------|
| `ai-service.ts` | 343 | Servicio IA general (GPT-4/Claude) |
| `ai-assistant-service.ts` | 246 | Asistente virtual de soporte |
| `ai-chatbot-service.ts` | 265 | Chatbot para onboarding |
| `ai-enhanced-assistant-service.ts` | 453 | Asistente IA avanzado |
| `ai-support-service.ts` | 629 | Soporte técnico con IA |
| `ai-workflow-service.ts` | 483 | Automatización de workflows con IA |
| `inmova-copilot-service.ts` | 487 | Copiloto IA para gestores |

- **Estado**: ELIMINADOS. Los packs de IA (€10-75/mes) listados en pricing no tienen backend
- **Nota**: Existe `lib/intelligent-support-service.ts` que sigue activo con Claude
- **Recomendación**: Recuperar `ai-service.ts` como base + `inmova-copilot-service.ts` si se venden packs IA

### 9. Valoración Automática — `valoracion-service.ts` (491 líneas)
- **Qué hacía**: Valoración de propiedades con IA (GPT-4/Claude), comparables, scoring
- **Estado**: ELIMINADO
- **Impacto**: Feature diferenciadora vs competidores. Add-on "pricing_ai" a €45/mes
- **¿Recuperar?**: SÍ si se activa el vertical de valoraciones
- **Esfuerzo**: Medio

### 10. Pricing Dinámico — `str-pricing-service.ts` (577 líneas) + `pricing-dynamic-service.ts` (384 líneas)
- **Qué hacía**: Optimización de precios de alquiler con ML, análisis de mercado
- **Estado**: ELIMINADO
- **Impacto**: Add-on "pricing_ai" a €45/mes
- **¿Recuperar?**: SÍ junto con valoracion-service si se activa el módulo de IA

### 11. White-Label — `whitelabel-service.ts` (335 líneas)
- **Qué hacía**: Personalización de marca, colores, logo, dominio personalizado
- **Estado**: ELIMINADO
- **Impacto**: Add-ons "whitelabel_basic" (€35/mes) y "whitelabel_full" (€99/mes)
- **¿Recuperar?**: SÍ cuando haya clientes Business/Enterprise que lo pidan
- **Esfuerzo**: Bajo

### 12. Automatizaciones/Workflow — `workflow-engine.ts` (578 líneas)
- **Qué hacía**: Motor de workflows automatizados (if-then-else) para tareas repetitivas
- **Estado**: ELIMINADO. Existe `lib/automation-service-simple.ts` como stub
- **Impacto**: Plan Business incluye "automatizaciones" como módulo
- **¿Recuperar?**: SÍ si hay clientes Business activos
- **Esfuerzo**: Medio

---

## 🟢 PRIORIDAD BAJA - Funcionalidades futuristas o sin demanda actual

### 13. Comunicación en Tiempo Real

| Servicio | Líneas | Estado |
|----------|--------|--------|
| `websocket-server.ts` | 366 | ELIMINADO. `lib/websocket-client.ts` existe pero sin server |
| `webrtc-service.ts` | 273 | ELIMINADO. **Import roto en `components/video/VideoCallWindow.tsx`** |

- **Nota**: `lib/webrtc-client.ts` y `lib/websocket-client.ts` siguen existiendo como clientes
- **Impacto**: VideoCallWindow.tsx y ChatWindow.tsx tienen imports rotos
- **Recomendación**: Decidir si se necesita chat/videollamada. Si no, eliminar los componentes

### 14. Redes Sociales

| Servicio | Líneas | Estado |
|----------|--------|--------|
| `social-media-automation-service.ts` | 409 | ELIMINADO |
| `facebook-integration.ts` | 438 | ELIMINADO |

- **Nota**: `lib/social-media-service.ts` sigue existiendo pero **2 API routes la importan**
- **Import roto**: `app/api/social-media/posts/route.ts` y `accounts/route.ts`
- **Recomendación**: Decidir si el módulo de redes sociales va adelante

### 15. PropTech Avanzado (features futuristas)

| Servicio | Líneas | Descripción |
|----------|--------|-------------|
| `blockchain-service.ts` | 312 | Contratos en blockchain |
| `ar-vr-service.ts` | 248 | Realidad aumentada/virtual |
| `circular-economy-service.ts` | 268 | Economía circular edificios |
| `esg-service.ts` | 267 | ESG y sostenibilidad |
| `iot-service.ts` | 382 | IoT smart buildings |
| `delinquency-prediction-service.ts` | 488 | Predicción de morosidad con ML |
| `sentiment-analysis-service.ts` | 365 | Análisis de sentimiento reviews |
| `gamification-service.ts` | 571 | Gamificación para inquilinos |

- **Impacto**: Bajo a corto plazo. Son features R&D
- **Recomendación**: No recuperar hasta que haya demanda real

### 16. Pagos Alternativos

| Servicio | Líneas | Descripción |
|----------|--------|-------------|
| `paypal-integration.ts` | 472 | Pagos con PayPal |
| `bizum-integration.ts` | 401 | Pagos con Bizum (España) |

- **Recomendación**: Evaluar si Stripe no es suficiente. Bizum podría tener demanda en España

### 17. Infraestructura y Cache

| Servicio | Líneas | Descripción |
|----------|--------|-------------|
| `redis-cache-service.ts` | 371 | Cache Redis avanzado |
| `cache-service.ts` | 442 | Cache en memoria/Redis |
| `database-optimization.ts` | 403 | Optimización de queries |
| `query-optimization.ts` | 435 | Query optimizer |
| `prisma-query-optimizer.ts` | 276 | Prisma optimizer |

- **Nota**: `lib/analytics-service.ts` tiene un fallback inline por la eliminación de cache-service
- **Recomendación**: Recuperar `redis-cache-service.ts` si el rendimiento lo requiere

### 18. Utilidades eliminadas (NO recuperar)

| Servicio | Razón de no recuperar |
|----------|----------------------|
| `accessibility.ts` | Shadcn/Radix ya manejan a11y |
| `brand-constants.ts` | Movido a Tailwind config |
| `cdn-urls.ts` | Cloudflare maneja CDN |
| `csp.ts` / `csp-strict.ts` | Configurado en next.config.js |
| `form-validators.ts` | Zod los reemplaza |
| `input-sanitization.ts` | DOMPurify maneja esto |
| `input-validation.ts` | Zod los reemplaza |
| `types.ts` | Tipos movidos a archivos específicos |
| `sentry-config.ts` | Configurado en sentry.*.config.ts |
| `seo-config.ts` | Metadata API de Next.js lo reemplaza |
| `image-optimizer.ts` | next/image lo maneja |
| `mobile-optimization.ts` | Tailwind responsive |
| `register-service-worker.ts` | PWA no priorizado |
| `memory-optimization.ts` | PM2 maneja memoria |

---

## 🔴 IMPORTS ROTOS (requieren acción inmediata)

Estos componentes/rutas importan módulos que NO existen:

| Archivo | Import roto | ¿Qué hacer? |
|---------|-------------|-------------|
| `components/video/VideoCallWindow.tsx` | `@/lib/webrtc-client` (existe pero importa webrtc-service eliminado) | Decidir: recuperar server o eliminar componente |
| `components/chat/ChatWindow.tsx` | `@/lib/websocket-client` (existe pero necesita websocket-server) | Decidir: recuperar server o eliminar componente |
| `app/api/social-media/posts/route.ts` | `@/lib/social-media-service` (existe, usa prisma directo) | Funciona pero usa prisma legacy |
| `app/api/social-media/accounts/route.ts` | `@/lib/social-media-service` (existe, usa prisma directo) | Funciona pero usa prisma legacy |

---

## 📋 STUBS ACTIVOS (funcionalidad degradada)

Estos archivos existen pero son stubs que no hacen nada real:

| Archivo | Qué debería hacer | Estado |
|---------|-------------------|--------|
| `lib/automation-service-simple.ts` | Renovación contratos, escalado incidencias, recordatorios | Solo logging |
| `lib/services/community-management-service.ts` | Gestión de comunidades de vecinos | Solo retorna null |
| `lib/services/compliance-service.ts` | Cumplimiento legal GDPR/LOPD | Solo retorna null |
| `lib/services/renewal-service.ts` | Análisis de renovación de contratos | Error: modelo no existe |
| `lib/services/renewal-service-simple.ts` | Renovación simplificada | Error: modelo no existe |
| `lib/cron-service.ts` | Sync iCal, channels STR, limpieza | Funciones stub con console.log |

---

## DECISIÓN REQUERIDA

Para cada categoría, decide:
- **RECUPERAR**: Se restaura del git history y se adapta
- **POSPONER**: Se deja eliminado, se implementará cuando haya demanda
- **DESCARTAR**: Se confirma la eliminación y se limpia cualquier referencia

### Resumen rápido de lo que recomiendo recuperar ya:
1. ✅ `stripe-subscription-service` — YA RECUPERADO
2. ✅ `contasimple-integration-service` — YA RECUPERADO  
3. 🔴 `digital-signature-service` — Crítico para producto
4. 🔴 `twilio-integration` — Necesario para packs SMS
5. 🟡 `holded-integration-service` — Mercado español
6. 🟡 `sage-integration-service` — Mercado español
7. 🟡 `whitelabel-service` — Add-on de pago activo
8. 🟡 `workflow-engine` — Incluido en plan Business
9. 🟡 `screening-service` — Add-on de pago activo
10. 🟡 `ai-service` + `inmova-copilot-service` — Add-ons IA activos
