# 🪝 Guía Completa de Webhooks - Inmova API

**Fecha**: 3 de enero de 2026  
**Versión**: 1.0

---

## 📋 Tabla de Contenidos

1. [Introducción](#introducción)
2. [Eventos disponibles](#eventos-disponibles)
3. [Configurar webhook](#configurar-webhook)
4. [Estructura del payload](#estructura-del-payload)
5. [Seguridad y verificación](#seguridad-y-verificación)
6. [Implementación por lenguaje](#implementación-por-lenguaje)
7. [Retry logic](#retry-logic)
8. [Testing](#testing)
9. [Troubleshooting](#troubleshooting)

---

## 📖 Introducción

Los webhooks de Inmova te permiten recibir notificaciones en tiempo real cuando ocurren eventos en la plataforma, sin necesidad de hacer polling constante a la API.

### Ventajas

✅ **Tiempo real**: Recibe eventos inmediatamente  
✅ **Eficiente**: Sin polling innecesario  
✅ **Escalable**: Soporta miles de eventos por segundo  
✅ **Confiable**: Sistema de retry automático

### Cómo funciona

```
┌─────────────┐           ┌──────────────┐           ┌──────────────┐
│   Inmova    │  Evento   │   Webhook    │   HTTP    │  Tu Servidor │
│   Platform  │─────────> │  Dispatcher  │─────────> │              │
└─────────────┘           └──────────────┘   POST    └──────────────┘
                                │
                                │ Retry si falla
                                ↓
                          (Backoff exponencial)
```

---

## 🎯 Eventos disponibles

### Properties

| Evento | Descripción | Cuándo se dispara |
|--------|-------------|-------------------|
| `PROPERTY_CREATED` | Nueva propiedad | Al crear propiedad via API o Dashboard |
| `PROPERTY_UPDATED` | Propiedad actualizada | Al modificar precio, status, etc. |
| `PROPERTY_DELETED` | Propiedad eliminada | Al eliminar (soft delete) |

### Tenants

| Evento | Descripción | Cuándo se dispara |
|--------|-------------|-------------------|
| `TENANT_CREATED` | Nuevo inquilino | Al registrar inquilino |
| `TENANT_UPDATED` | Inquilino actualizado | Al modificar datos |

### Contracts

| Evento | Descripción | Cuándo se dispara |
|--------|-------------|-------------------|
| `CONTRACT_CREATED` | Nuevo contrato | Al crear contrato |
| `CONTRACT_SIGNED` | Contrato firmado | Al completar firma digital |

### Payments

| Evento | Descripción | Cuándo se dispara |
|--------|-------------|-------------------|
| `PAYMENT_CREATED` | Pago registrado | Al crear registro de pago |
| `PAYMENT_RECEIVED` | Pago confirmado | Webhook de Stripe confirma pago |

### Maintenance

| Evento | Descripción | Cuándo se dispara |
|--------|-------------|-------------------|
| `MAINTENANCE_CREATED` | Nueva incidencia | Al reportar incidencia |
| `MAINTENANCE_RESOLVED` | Incidencia resuelta | Al marcar como completada |

### Documents

| Evento | Descripción | Cuándo se dispara |
|--------|-------------|-------------------|
| `DOCUMENT_UPLOADED` | Documento subido | Al subir documento a S3 |

---

## ⚙️ Configurar webhook

### 1. Crear endpoint en tu servidor

Tu endpoint debe:
- Aceptar peticiones `POST`
- Responder con `200 OK` en menos de 5 segundos
- Procesar el payload de forma asíncrona (si tarda)

**Ejemplo mínimo** (Node.js/Express):

```javascript
app.post('/webhooks/inmova', (req, res) => {
  // Responder inmediatamente
  res.status(200).send('OK');
  
  // Procesar evento de forma asíncrona
  processEventAsync(req.body);
});

async function processEventAsync(payload) {
  const { event, data } = payload;
  
  switch(event) {
    case 'PROPERTY_CREATED':
      await handlePropertyCreated(data);
      break;
    case 'CONTRACT_SIGNED':
      await handleContractSigned(data);
      break;
    // ...
  }
}
```

### 2. Registrar webhook via API

```bash
curl -X POST https://inmovaapp.com/api/v1/webhooks \
  -H "Authorization: Bearer sk_live_YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://your-app.com/webhooks/inmova",
    "events": [
      "PROPERTY_CREATED",
      "PROPERTY_UPDATED",
      "CONTRACT_SIGNED",
      "PAYMENT_RECEIVED"
    ],
    "maxRetries": 3
  }'
```

**Respuesta**:

```json
{
  "success": true,
  "data": {
    "id": "clxy789ghi012jkl",
    "url": "https://your-app.com/webhooks/inmova",
    "events": ["PROPERTY_CREATED", "CONTRACT_SIGNED"],
    "active": true,
    "secret": "whsec_abc123def456ghi789jkl012mno345"
  },
  "warning": "Save the webhook secret securely. You will not be able to see it again."
}
```

⚠️ **IMPORTANTE**: Guarda el `secret` - lo necesitarás para verificar firmas.

### 3. Listar tus webhooks

```bash
curl https://inmovaapp.com/api/v1/webhooks \
  -H "Authorization: Bearer sk_live_YOUR_API_KEY"
```

### 4. Eliminar webhook

```bash
curl -X DELETE https://inmovaapp.com/api/v1/webhooks/{webhook_id} \
  -H "Authorization: Bearer sk_live_YOUR_API_KEY"
```

---

## 📦 Estructura del payload

### Formato general

Todos los webhooks siguen esta estructura:

```json
{
  "event": "PROPERTY_CREATED",
  "timestamp": "2026-01-03T12:00:00Z",
  "data": {
    // Datos específicos del evento
  }
}
```

### Ejemplos por evento

#### PROPERTY_CREATED

```json
{
  "event": "PROPERTY_CREATED",
  "timestamp": "2026-01-03T12:00:00Z",
  "data": {
    "id": "clxy456def789ghi",
    "address": "Calle Mayor 123",
    "city": "Madrid",
    "postalCode": "28013",
    "type": "APARTMENT",
    "status": "AVAILABLE",
    "price": 1200,
    "rooms": 3,
    "bathrooms": 2,
    "squareMeters": 85.5,
    "description": "Piso luminoso...",
    "companyId": "clxy123abc456def",
    "createdAt": "2026-01-03T12:00:00Z"
  }
}
```

#### PROPERTY_UPDATED

```json
{
  "event": "PROPERTY_UPDATED",
  "timestamp": "2026-01-03T14:30:00Z",
  "data": {
    "id": "clxy456def789ghi",
    "changes": {
      "price": {
        "old": 1200,
        "new": 1250
      },
      "status": {
        "old": "AVAILABLE",
        "new": "RENTED"
      }
    },
    "updatedFields": ["price", "status"],
    "updatedAt": "2026-01-03T14:30:00Z"
  }
}
```

#### CONTRACT_SIGNED

```json
{
  "event": "CONTRACT_SIGNED",
  "timestamp": "2026-01-03T15:00:00Z",
  "data": {
    "id": "clxy789ghi012jkl",
    "propertyId": "clxy456def789ghi",
    "tenantId": "clxy012mno345pqr",
    "startDate": "2026-02-01",
    "endDate": "2027-01-31",
    "monthlyRent": 1200,
    "deposit": 2400,
    "signedAt": "2026-01-03T15:00:00Z",
    "signedBy": [
      {
        "role": "LANDLORD",
        "name": "Juan Pérez",
        "email": "juan@example.com"
      },
      {
        "role": "TENANT",
        "name": "María García",
        "email": "maria@example.com"
      }
    ]
  }
}
```

#### PAYMENT_RECEIVED

```json
{
  "event": "PAYMENT_RECEIVED",
  "timestamp": "2026-01-03T16:00:00Z",
  "data": {
    "id": "clxy345pqr678stu",
    "contractId": "clxy789ghi012jkl",
    "propertyId": "clxy456def789ghi",
    "tenantId": "clxy012mno345pqr",
    "amount": 1200,
    "currency": "EUR",
    "type": "RENT",
    "month": "2026-02",
    "paymentMethod": "STRIPE",
    "stripePaymentIntentId": "pi_abc123def456",
    "receivedAt": "2026-01-03T16:00:00Z"
  }
}
```

---

## 🔐 Seguridad y verificación

### Por qué verificar firmas

Verificar la firma HMAC asegura que:
1. ✅ El webhook proviene de Inmova
2. ✅ El payload no ha sido modificado
3. ✅ No es un ataque de replay

### Cómo funciona

1. Inmova calcula un HMAC del payload usando tu `secret`
2. Envía la firma en el header `X-Inmova-Signature`
3. Tu servidor recalcula la firma y la compara

```
HMAC-SHA256(payload_json, webhook_secret) = signature
```

### Implementación

#### Node.js

```javascript
const crypto = require('crypto');

function verifyWebhookSignature(payload, signature, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(JSON.stringify(payload));
  const expectedSignature = 'sha256=' + hmac.digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

// Express middleware
function verifyInmovaWebhook(req, res, next) {
  const signature = req.headers['x-inmova-signature'];
  const secret = process.env.INMOVA_WEBHOOK_SECRET;
  
  if (!signature) {
    return res.status(401).json({ error: 'Missing signature' });
  }
  
  const isValid = verifyWebhookSignature(req.body, signature, secret);
  
  if (!isValid) {
    return res.status(401).json({ error: 'Invalid signature' });
  }
  
  next();
}

// Uso
app.post('/webhooks/inmova', verifyInmovaWebhook, (req, res) => {
  res.status(200).send('OK');
  processEventAsync(req.body);
});
```

#### Python (Flask)

```python
import hmac
import hashlib

def verify_webhook_signature(payload, signature, secret):
    expected_signature = 'sha256=' + hmac.new(
        secret.encode('utf-8'),
        payload.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()
    
    return hmac.compare_digest(signature, expected_signature)

@app.route('/webhooks/inmova', methods=['POST'])
def inmova_webhook():
    signature = request.headers.get('X-Inmova-Signature')
    secret = os.environ['INMOVA_WEBHOOK_SECRET']
    
    if not signature:
        return 'Missing signature', 401
    
    payload = request.get_data(as_text=True)
    
    if not verify_webhook_signature(payload, signature, secret):
        return 'Invalid signature', 401
    
    # Procesar evento
    data = request.json
    process_event(data)
    
    return 'OK', 200
```

#### PHP

```php
function verifyWebhookSignature($payload, $signature, $secret) {
    $expected = 'sha256=' . hash_hmac('sha256', $payload, $secret);
    return hash_equals($expected, $signature);
}

// En tu endpoint
$signature = $_SERVER['HTTP_X_INMOVA_SIGNATURE'];
$secret = getenv('INMOVA_WEBHOOK_SECRET');
$payload = file_get_contents('php://input');

if (!$signature || !verifyWebhookSignature($payload, $signature, $secret)) {
    http_response_code(401);
    exit('Invalid signature');
}

// Procesar evento
$data = json_decode($payload, true);
processEvent($data);

http_response_code(200);
echo 'OK';
```

---

## 🔄 Retry logic

### Estrategia de retry

Si tu endpoint falla o no responde con 200 OK, Inmova reintentará el envío:

| Intento | Delay | Total acumulado |
|---------|-------|-----------------|
| 1 | Inmediato | 0s |
| 2 | 5 segundos | 5s |
| 3 | 30 segundos | 35s |
| 4 | 2 minutos | 2m 35s |
| 5 | 10 minutos | 12m 35s |

**Backoff exponencial**: Cada retry espera más tiempo que el anterior.

### Configurar max retries

```bash
curl -X POST https://inmovaapp.com/api/v1/webhooks \
  -H "Authorization: Bearer sk_live_YOUR_API_KEY" \
  -d '{
    "url": "https://your-app.com/webhooks/inmova",
    "events": ["PROPERTY_CREATED"],
    "maxRetries": 5
  }'
```

Valores permitidos: 0-5 (default: 3)

### Manejo de duplicados

En casos extremos, podrías recibir el mismo evento dos veces. Implementa **idempotencia**:

```javascript
const processedEvents = new Set();

async function processEventAsync(payload) {
  const eventId = `${payload.event}-${payload.data.id}-${payload.timestamp}`;
  
  // Verificar si ya procesamos este evento
  if (processedEvents.has(eventId)) {
    console.log('Duplicate event, skipping:', eventId);
    return;
  }
  
  processedEvents.add(eventId);
  
  // Procesar evento
  await handleEvent(payload);
}
```

---

## 🧪 Testing

### 1. Testing local con ngrok

**Paso 1**: Instalar ngrok

```bash
npm install -g ngrok
```

**Paso 2**: Exponer tu servidor local

```bash
ngrok http 3000
```

**Paso 3**: Copiar URL pública

```
Forwarding: https://abc123.ngrok.io -> localhost:3000
```

**Paso 4**: Configurar webhook con URL de ngrok

```bash
curl -X POST https://inmovaapp.com/api/v1/webhooks \
  -H "Authorization: Bearer sk_live_YOUR_API_KEY" \
  -d '{
    "url": "https://abc123.ngrok.io/webhooks/inmova",
    "events": ["PROPERTY_CREATED"]
  }'
```

### 2. Disparar evento de prueba

Crea una propiedad via API para disparar `PROPERTY_CREATED`:

```bash
curl -X POST https://inmovaapp.com/api/v1/properties \
  -H "Authorization: Bearer sk_live_YOUR_API_KEY" \
  -d '{
    "address": "Test Property",
    "city": "Madrid",
    "price": 1000
  }'
```

### 3. Logs de webhook

Ver logs de delivery de tu webhook:

```bash
curl "https://inmovaapp.com/api/v1/webhooks/{webhook_id}/logs" \
  -H "Authorization: Bearer sk_live_YOUR_API_KEY"
```

**Respuesta**:

```json
{
  "success": true,
  "data": [
    {
      "id": "clxy999abc",
      "event": "PROPERTY_CREATED",
      "status": "SUCCESS",
      "httpStatus": 200,
      "responseTime": 125,
      "attemptNumber": 1,
      "sentAt": "2026-01-03T12:00:00Z"
    },
    {
      "id": "clxy888def",
      "event": "CONTRACT_SIGNED",
      "status": "FAILED",
      "httpStatus": 500,
      "responseTime": 5000,
      "attemptNumber": 3,
      "error": "Connection timeout",
      "sentAt": "2026-01-03T11:50:00Z"
    }
  ]
}
```

---

## 🔧 Troubleshooting

### Problema: No recibo webhooks

**Verificar**:

1. ✅ Webhook está activo

```bash
curl https://inmovaapp.com/api/v1/webhooks/{webhook_id} \
  -H "Authorization: Bearer sk_live_YOUR_API_KEY"
```

2. ✅ URL es accesible públicamente

```bash
curl -X POST https://your-app.com/webhooks/inmova \
  -d '{"test": true}'
```

3. ✅ Tu servidor responde con 200 OK

4. ✅ No hay error en firewall/CORS

---

### Problema: Firma inválida

**Causas comunes**:

1. ❌ Secret incorrecto
2. ❌ Parsing incorrecto del body (stringify inconsistente)
3. ❌ Headers en lowercase (algunos frameworks)

**Solución**:

```javascript
// ✅ CORRECTO: Usar raw body
app.post('/webhooks/inmova', 
  express.raw({ type: 'application/json' }), 
  (req, res) => {
    const signature = req.headers['x-inmova-signature'];
    const payload = req.body.toString('utf-8');
    
    // Verificar firma con raw body
    verifySignature(payload, signature, secret);
  }
);

// ❌ INCORRECTO: Body parseado
app.post('/webhooks/inmova', (req, res) => {
  // req.body ya está parseado → firma fallará
});
```

---

### Problema: Timeout en procesamiento

**Síntoma**: Inmova reintenta porque no recibe 200 OK a tiempo.

**Solución**: Responder inmediatamente, procesar después.

```javascript
app.post('/webhooks/inmova', (req, res) => {
  // ✅ Responder inmediatamente
  res.status(200).send('OK');
  
  // ✅ Procesar en background
  queue.add('process-inmova-webhook', req.body);
});
```

---

## 📚 Recursos adicionales

- [Quick Start API](./API_QUICK_START.md)
- [Ejemplos de código](./CODE_EXAMPLES.md)
- [Referencia completa](https://inmovaapp.com/docs)

---

## 🆘 Soporte

- **Email**: webhooks@inmovaapp.com
- **Discord**: https://discord.gg/inmova
- **Status page**: https://status.inmovaapp.com

---

**Última actualización**: 3 de enero de 2026  
**Versión**: 1.0.0
