# 🪝 Dónde se Configuran los Webhooks en Inmova

**Fecha**: 3 de enero de 2026

---

## 🎯 HAY 2 TIPOS DE WEBHOOKS

```
1. Webhooks QUE INMOVA ENVÍA (Clientes reciben eventos de Inmova)
2. Webhooks QUE INMOVA RECIBE (Inmova recibe eventos de servicios externos)
```

---

## 1️⃣ WEBHOOKS QUE INMOVA ENVÍA (Para Clientes)

### 📍 Dónde se configuran

Los **clientes** configuran estos webhooks **via API** para recibir notificaciones de eventos.

### 📋 Ubicación en el código

```
/workspace/app/api/v1/webhooks/route.ts
```

**Endpoints**:
- `GET /api/v1/webhooks` - Listar webhooks configurados
- `POST /api/v1/webhooks` - Crear nuevo webhook
- `DELETE /api/v1/webhooks/{id}` - Eliminar webhook

### 🔧 Cómo configurar (para clientes)

**Opción 1: Via API (cURL)**

```bash
curl -X POST https://inmovaapp.com/api/v1/webhooks \
  -H "Authorization: Bearer sk_live_YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://your-app.com/webhooks/inmova",
    "events": [
      "PROPERTY_CREATED",
      "CONTRACT_SIGNED",
      "PAYMENT_RECEIVED"
    ],
    "maxRetries": 3
  }'
```

**Opción 2: Via Dashboard (Futuro - Pendiente implementar UI)**

```
Dashboard → Configuración → Webhooks → Crear Nuevo
```

⚠️ **Nota**: La UI no está implementada aún. Clientes deben usar la API.

### 📡 Eventos disponibles (12)

```
PROPERTY_CREATED       - Nueva propiedad creada
PROPERTY_UPDATED       - Propiedad actualizada
PROPERTY_DELETED       - Propiedad eliminada
TENANT_CREATED         - Nuevo inquilino
TENANT_UPDATED         - Inquilino actualizado
CONTRACT_CREATED       - Nuevo contrato
CONTRACT_SIGNED        - Contrato firmado
PAYMENT_CREATED        - Pago registrado
PAYMENT_RECEIVED       - Pago confirmado
MAINTENANCE_CREATED    - Nueva incidencia
MAINTENANCE_RESOLVED   - Incidencia resuelta
DOCUMENT_UPLOADED      - Documento subido
```

### ⚙️ Cómo funcionan internamente

**1. Sistema de dispatch**

Archivo: `/workspace/lib/webhook-dispatcher.ts`

```typescript
// Cuando ocurre un evento, se dispara:
await dispatchWebhook(companyId, 'PROPERTY_CREATED', propertyData);
```

**2. Delivery con retry**

- Busca subscripciones activas para ese evento
- Envía POST a cada URL configurada
- Genera firma HMAC para seguridad
- Reintenta hasta 5 veces con backoff exponencial
- Guarda logs en `webhookDelivery` table

**3. Ejemplo de uso en el código**

```typescript
// En /app/api/v1/properties/route.ts
import { dispatchWebhook } from '@/lib/webhook-dispatcher';

export async function POST(req: NextRequest) {
  // ... crear propiedad
  const property = await prisma.property.create({ ... });
  
  // Disparar webhook
  await dispatchWebhook(
    session.user.companyId,
    'PROPERTY_CREATED',
    property
  );
  
  return NextResponse.json({ success: true, data: property });
}
```

### 🗄️ Tabla de BD

```sql
-- Subscripciones de webhooks
CREATE TABLE "WebhookSubscription" (
  id String PRIMARY KEY,
  companyId String,
  url String,
  events String[],
  secret String,
  active Boolean,
  maxRetries Int,
  successCount Int,
  failureCount Int,
  createdAt DateTime,
  createdBy String
);

-- Logs de delivery
CREATE TABLE "WebhookDelivery" (
  id String PRIMARY KEY,
  subscriptionId String,
  event String,
  payload Json,
  url String,
  method String,
  attempts Int,
  httpStatus Int,
  responseBody String,
  sentAt DateTime,
  status String -- PENDING, SUCCESS, FAILED
);
```

### 📚 Documentación completa

Ver: `/workspace/docs/WEBHOOK_GUIDE.md`

---

## 2️⃣ WEBHOOKS QUE INMOVA RECIBE (De servicios externos)

### 📍 Dónde se configuran

Estos webhooks se configuran **en los dashboards de los servicios externos** (Stripe, DocuSign, etc.) y apuntan a endpoints de Inmova.

### 🔧 Webhooks implementados

#### A. Stripe (Pagos)

**Archivo**: `/workspace/app/api/webhooks/stripe/route.ts`

**URL del webhook**:
```
https://inmovaapp.com/api/webhooks/stripe
```

**Eventos manejados**:
- `payment_intent.succeeded` - Pago exitoso
- `payment_intent.payment_failed` - Pago fallido
- `payment_intent.canceled` - Pago cancelado
- `charge.refunded` - Reembolso

**Dónde configurar**:

1. Ir a https://dashboard.stripe.com/webhooks
2. Click "Add endpoint"
3. URL: `https://inmovaapp.com/api/webhooks/stripe`
4. Eventos: Seleccionar los 4 eventos arriba
5. Copiar **Signing secret** (empieza con `whsec_...`)
6. Añadir a `.env.production`:

```env
STRIPE_WEBHOOK_SECRET=whsec_abc123def456...
```

**Estado actual**: ⚠️ **PENDIENTE CONFIGURAR**

```
✅ Código implementado
✅ Endpoint funcional
❌ Webhook no configurado en Stripe
❌ STRIPE_WEBHOOK_SECRET faltante
```

**Cómo verificar**:

```bash
# En el servidor
ssh root@157.180.119.236

# Verificar si está configurado
grep STRIPE_WEBHOOK_SECRET /opt/inmova-app/.env.production

# Test manual
curl -X POST http://localhost:3000/api/webhooks/stripe \
  -H "Content-Type: application/json" \
  -d '{"type":"payment_intent.succeeded","data":{"object":{"id":"pi_test"}}}'
```

---

#### B. DocuSign (Firma Digital)

**Archivo**: ⚠️ **NO IMPLEMENTADO AÚN**

**URL futura**:
```
https://inmovaapp.com/api/webhooks/docusign
```

**Eventos a manejar**:
- `envelope-completed` - Sobre firmado
- `envelope-voided` - Sobre cancelado
- `envelope-declined` - Sobre rechazado

**Dónde configurar (cuando se implemente)**:

1. Ir a https://admindemo.docusign.com/
2. Settings → Connect → Add Configuration
3. URL: `https://inmovaapp.com/api/webhooks/docusign`
4. Eventos: Seleccionar los 3 eventos arriba

**Estado actual**: ❌ **NO IMPLEMENTADO**

---

#### C. Signaturit (Firma Digital)

**Archivo**: ⚠️ **NO IMPLEMENTADO AÚN**

**URL futura**:
```
https://inmovaapp.com/api/webhooks/signaturit
```

**Eventos a manejar**:
- `signature_completed` - Firma completada
- `signature_rejected` - Firma rechazada
- `signature_expired` - Firma expirada

**Dónde configurar (cuando se implemente)**:

1. Ir a https://app.signaturit.com/
2. Settings → Webhooks → Add
3. URL: `https://inmovaapp.com/api/webhooks/signaturit`

**Estado actual**: ❌ **NO IMPLEMENTADO**

---

## 📊 RESUMEN COMPARATIVO

| Aspecto | Webhooks de Inmova (Envía) | Webhooks de Servicios (Recibe) |
|---------|---------------------------|--------------------------------|
| **Configuración** | Via API por clientes | Via Dashboard del servicio |
| **Endpoints** | `/api/v1/webhooks` | `/api/webhooks/{servicio}` |
| **Quién configura** | Clientes de Inmova | Admin de Inmova |
| **Propósito** | Notificar a clientes | Recibir notificaciones |
| **Ejemplos** | PROPERTY_CREATED, CONTRACT_SIGNED | payment_intent.succeeded |
| **Estado** | ✅ 100% Operativo | ⚠️ Solo Stripe implementado |

---

## ✅ CHECKLIST DE WEBHOOKS

### Webhooks de Inmova (Para Clientes)

- [x] Endpoints implementados
- [x] Webhook dispatcher implementado
- [x] Retry logic implementado
- [x] HMAC signature implementado
- [x] Logs de delivery implementados
- [x] Documentación completa
- [ ] UI en Dashboard (opcional)

### Webhooks de Servicios (Inmova Recibe)

#### Stripe
- [x] Endpoint implementado (`/api/webhooks/stripe`)
- [x] Eventos manejados (4)
- [x] Signature verification implementado
- [ ] Configurado en Stripe Dashboard ⚠️ **PENDIENTE**
- [ ] `STRIPE_WEBHOOK_SECRET` añadido ⚠️ **PENDIENTE**
- [ ] Testeado con evento real

#### DocuSign
- [ ] Endpoint implementado
- [ ] Eventos manejados
- [ ] Configurado en DocuSign

#### Signaturit
- [ ] Endpoint implementado
- [ ] Eventos manejados
- [ ] Configurado en Signaturit

---

## 🚀 PRÓXIMOS PASOS

### Inmediato (Usuario debe hacer)

1. **Configurar Stripe Webhook** (15 minutos)
   ```
   1. Ir a https://dashboard.stripe.com/webhooks
   2. Add endpoint: https://inmovaapp.com/api/webhooks/stripe
   3. Seleccionar eventos
   4. Copiar webhook secret
   5. SSH al servidor:
      ssh root@157.180.119.236
   6. Editar .env.production:
      echo 'STRIPE_WEBHOOK_SECRET=whsec_xxx' >> /opt/inmova-app/.env.production
   7. Restart PM2:
      pm2 restart inmova-app --update-env
   8. Test en Stripe Dashboard
   ```

### Futuro (Implementar código)

2. **Implementar webhook de DocuSign**
   - Crear `/app/api/webhooks/docusign/route.ts`
   - Manejar eventos de sobres
   - Configurar en DocuSign Connect

3. **Implementar webhook de Signaturit**
   - Crear `/app/api/webhooks/signaturit/route.ts`
   - Manejar eventos de firma
   - Configurar en Signaturit Dashboard

4. **UI para gestión de webhooks**
   - Dashboard → Configuración → Webhooks
   - Listar, crear, editar, eliminar
   - Ver logs de delivery
   - Test de webhook

---

## 📚 DOCUMENTACIÓN RELACIONADA

- **Guía completa de webhooks**: `/workspace/docs/WEBHOOK_GUIDE.md`
- **Código de dispatcher**: `/workspace/lib/webhook-dispatcher.ts`
- **Endpoint de gestión**: `/workspace/app/api/v1/webhooks/route.ts`
- **Stripe webhook**: `/workspace/app/api/webhooks/stripe/route.ts`

---

## 🆘 SOPORTE

- **Email**: webhooks@inmovaapp.com
- **Documentación**: https://inmovaapp.com/docs
- **Status**: https://status.inmovaapp.com

---

**Última actualización**: 3 de enero de 2026  
**Versión**: 1.0  
**Estado**: Webhooks de clientes operativos, Stripe pendiente configurar
