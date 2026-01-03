# 🚀 Guía de Inicio Rápido - API de Inmova

**Fecha**: 3 de enero de 2026  
**Versión API**: v1  
**Base URL**: https://inmovaapp.com/api/v1

---

## 📋 Tabla de Contenidos

1. [Requisitos previos](#requisitos-previos)
2. [Obtener tu API Key](#obtener-tu-api-key)
3. [Primera petición](#primera-petición)
4. [Autenticación](#autenticación)
5. [Operaciones básicas](#operaciones-básicas)
6. [Webhooks](#webhooks)
7. [Límites y mejores prácticas](#límites-y-mejores-prácticas)
8. [Soporte](#soporte)

---

## 📦 Requisitos previos

1. **Cuenta activa en Inmova**  
   Crea tu cuenta en https://inmovaapp.com/register

2. **Empresa configurada**  
   Al menos una empresa en tu cuenta

3. **Conocimientos básicos de**:
   - APIs REST
   - HTTP/HTTPS
   - JSON
   - Autenticación Bearer Token

---

## 🔑 Obtener tu API Key

### Paso 1: Acceder al Dashboard

Inicia sesión en https://inmovaapp.com/dashboard

### Paso 2: Navegar a API Keys

```
Dashboard → Configuración → API Keys
```

### Paso 3: Crear nueva API Key

```
1. Click en "Crear API Key"
2. Ingresa un nombre descriptivo (ej: "Integración Production")
3. Selecciona los scopes necesarios:
   - properties:read    - Leer propiedades
   - properties:write   - Crear/editar propiedades
   - tenants:read       - Leer inquilinos
   - tenants:write      - Crear/editar inquilinos
   - contracts:read     - Leer contratos
   - contracts:write    - Crear/editar contratos
   - webhooks:read      - Ver webhooks
   - webhooks:write     - Configurar webhooks
4. (Opcional) Establece fecha de expiración
5. Click en "Generar"
```

### Paso 4: Guardar la API Key

⚠️ **IMPORTANTE**: La API Key completa **solo se muestra una vez**. Guárdala en un lugar seguro.

```
Formato: sk_live_XXXXXXXXXXXXXXXX (ejemplo ficticio)
```

---

## 🎯 Primera petición

### Test de conexión

Verifica que tu API Key funciona correctamente:

```bash
curl https://inmovaapp.com/api/v1/sandbox \
  -H "Authorization: Bearer sk_live_YOUR_API_KEY"
```

**Respuesta esperada**:

```json
{
  "success": true,
  "message": "API key is valid",
  "auth": {
    "companyId": "clxy123abc456def",
    "userId": "clxy789ghi012jkl",
    "scopes": ["properties:read", "properties:write"]
  }
}
```

### Obtener lista de propiedades

```bash
curl https://inmovaapp.com/api/v1/properties \
  -H "Authorization: Bearer sk_live_YOUR_API_KEY"
```

**Respuesta esperada**:

```json
{
  "success": true,
  "data": [
    {
      "id": "clxy123abc",
      "address": "Calle Mayor 123",
      "city": "Madrid",
      "price": 1200,
      "status": "AVAILABLE",
      "type": "APARTMENT",
      "rooms": 3,
      "bathrooms": 2,
      "squareMeters": 85.5,
      "createdAt": "2026-01-03T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "pages": 1
  }
}
```

---

## 🔐 Autenticación

### Formato del Header

Todas las peticiones requieren el header `Authorization`:

```
Authorization: Bearer sk_live_YOUR_API_KEY
```

### Ejemplo en diferentes lenguajes

#### cURL

```bash
curl https://inmovaapp.com/api/v1/properties \
  -H "Authorization: Bearer sk_live_YOUR_API_KEY"
```

#### JavaScript (fetch)

```javascript
const response = await fetch('https://inmovaapp.com/api/v1/properties', {
  headers: {
    'Authorization': 'Bearer sk_live_YOUR_API_KEY',
    'Content-Type': 'application/json'
  }
});

const data = await response.json();
console.log(data);
```

#### Python (requests)

```python
import requests

headers = {
    'Authorization': 'Bearer sk_live_YOUR_API_KEY',
    'Content-Type': 'application/json'
}

response = requests.get('https://inmovaapp.com/api/v1/properties', headers=headers)
data = response.json()
print(data)
```

#### Node.js (axios)

```javascript
const axios = require('axios');

const config = {
  headers: {
    'Authorization': 'Bearer sk_live_YOUR_API_KEY',
    'Content-Type': 'application/json'
  }
};

const response = await axios.get('https://inmovaapp.com/api/v1/properties', config);
console.log(response.data);
```

---

## 📝 Operaciones básicas

### 1. Listar propiedades

```bash
GET /api/v1/properties?page=1&limit=20&status=AVAILABLE
```

**Parámetros de query**:
- `page` (opcional): Número de página (default: 1)
- `limit` (opcional): Elementos por página (default: 20, max: 100)
- `status` (opcional): AVAILABLE, RENTED, MAINTENANCE, INACTIVE
- `type` (opcional): HOUSE, APARTMENT, STUDIO, ROOM, etc.
- `city` (opcional): Filtrar por ciudad

**Ejemplo**:

```bash
curl "https://inmovaapp.com/api/v1/properties?city=Madrid&status=AVAILABLE" \
  -H "Authorization: Bearer sk_live_YOUR_API_KEY"
```

---

### 2. Crear propiedad

```bash
POST /api/v1/properties
```

**Body (JSON)**:

```json
{
  "address": "Calle Gran Vía 45, 3º B",
  "city": "Madrid",
  "postalCode": "28013",
  "country": "España",
  "type": "APARTMENT",
  "status": "AVAILABLE",
  "price": 1200,
  "rooms": 3,
  "bathrooms": 2,
  "squareMeters": 85.5,
  "description": "Piso luminoso en pleno centro de Madrid, recién reformado, con calefacción central y aire acondicionado."
}
```

**Ejemplo cURL**:

```bash
curl -X POST https://inmovaapp.com/api/v1/properties \
  -H "Authorization: Bearer sk_live_YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "address": "Calle Gran Vía 45, 3º B",
    "city": "Madrid",
    "price": 1200,
    "rooms": 3,
    "bathrooms": 2,
    "squareMeters": 85.5
  }'
```

**Respuesta**:

```json
{
  "success": true,
  "data": {
    "id": "clxy456def",
    "address": "Calle Gran Vía 45, 3º B",
    "city": "Madrid",
    "price": 1200,
    "status": "AVAILABLE",
    "createdAt": "2026-01-03T12:00:00Z"
  },
  "message": "Property created successfully"
}
```

---

### 3. Obtener propiedad por ID

```bash
GET /api/v1/properties/{id}
```

**Ejemplo**:

```bash
curl https://inmovaapp.com/api/v1/properties/clxy456def \
  -H "Authorization: Bearer sk_live_YOUR_API_KEY"
```

---

### 4. Actualizar propiedad

```bash
PUT /api/v1/properties/{id}
```

**Body (JSON)** - Solo campos a actualizar:

```json
{
  "price": 1250,
  "status": "RENTED",
  "description": "Propiedad actualizada con nuevo precio"
}
```

**Ejemplo**:

```bash
curl -X PUT https://inmovaapp.com/api/v1/properties/clxy456def \
  -H "Authorization: Bearer sk_live_YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"price": 1250, "status": "RENTED"}'
```

---

### 5. Eliminar propiedad

```bash
DELETE /api/v1/properties/{id}
```

**Ejemplo**:

```bash
curl -X DELETE https://inmovaapp.com/api/v1/properties/clxy456def \
  -H "Authorization: Bearer sk_live_YOUR_API_KEY"
```

---

## 🪝 Webhooks

Los webhooks te permiten recibir notificaciones en tiempo real cuando ocurren eventos en Inmova.

### Eventos disponibles

```
PROPERTY_CREATED     - Nueva propiedad creada
PROPERTY_UPDATED     - Propiedad actualizada
PROPERTY_DELETED     - Propiedad eliminada
TENANT_CREATED       - Nuevo inquilino creado
CONTRACT_SIGNED      - Contrato firmado
PAYMENT_RECEIVED     - Pago recibido
MAINTENANCE_CREATED  - Nueva incidencia creada
DOCUMENT_UPLOADED    - Documento subido
```

### Configurar webhook

```bash
POST /api/v1/webhooks
```

**Body**:

```json
{
  "url": "https://your-app.com/webhooks/inmova",
  "events": [
    "PROPERTY_CREATED",
    "CONTRACT_SIGNED",
    "PAYMENT_RECEIVED"
  ],
  "maxRetries": 3
}
```

**Ejemplo**:

```bash
curl -X POST https://inmovaapp.com/api/v1/webhooks \
  -H "Authorization: Bearer sk_live_YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://your-app.com/webhooks/inmova",
    "events": ["PROPERTY_CREATED", "CONTRACT_SIGNED"]
  }'
```

**Respuesta**:

```json
{
  "success": true,
  "data": {
    "id": "clxy789ghi",
    "url": "https://your-app.com/webhooks/inmova",
    "events": ["PROPERTY_CREATED", "CONTRACT_SIGNED"],
    "active": true,
    "secret": "whsec_abc123def456..." 
  },
  "warning": "Save the webhook secret securely."
}
```

⚠️ **Guarda el `secret`** - Lo necesitarás para verificar la firma de los webhooks.

### Recibir webhooks

Tu endpoint debe:

1. **Responder con 200 OK** en menos de 5 segundos
2. **Verificar la firma HMAC** (opcional pero recomendado)
3. **Procesar el evento de forma asíncrona** (si tarda)

**Ejemplo de payload**:

```json
{
  "event": "PROPERTY_CREATED",
  "timestamp": "2026-01-03T12:00:00Z",
  "data": {
    "id": "clxy456def",
    "address": "Calle Gran Vía 45",
    "city": "Madrid",
    "price": 1200,
    "status": "AVAILABLE"
  }
}
```

**Verificar firma** (Node.js):

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

// En tu endpoint
app.post('/webhooks/inmova', (req, res) => {
  const signature = req.headers['x-inmova-signature'];
  const isValid = verifyWebhookSignature(req.body, signature, process.env.WEBHOOK_SECRET);
  
  if (!isValid) {
    return res.status(401).send('Invalid signature');
  }
  
  // Procesar evento
  const { event, data } = req.body;
  console.log(`Received ${event}:`, data);
  
  res.status(200).send('OK');
});
```

---

## ⚡ Límites y mejores prácticas

### Rate Limiting

| Plan | Límite |
|------|--------|
| Basic | 1,000 requests/minuto |
| Pro | 5,000 requests/minuto |
| Enterprise | Ilimitado |

**Headers de respuesta**:

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1704279660
```

### Manejo de errores

```json
{
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": {
    "address": "Address is required",
    "price": "Price must be positive"
  }
}
```

**Códigos HTTP**:
- `200` - Éxito
- `201` - Recurso creado
- `400` - Error de validación
- `401` - No autenticado (API Key inválida)
- `403` - Prohibido (sin permisos)
- `404` - Recurso no encontrado
- `429` - Rate limit excedido
- `500` - Error del servidor

### Mejores prácticas

✅ **DO**:
- Almacenar la API Key de forma segura (variables de entorno)
- Implementar retry logic con backoff exponencial
- Usar paginación para listas grandes
- Verificar firmas de webhooks
- Cachear respuestas cuando sea posible

❌ **DON'T**:
- Nunca commits la API Key en Git
- No hacer más de 10 requests por segundo (burst)
- No ignorar rate limit headers
- No hardcodear la API Key en el código

---

## 📚 Siguientes pasos

1. **Explora la documentación completa**  
   https://inmovaapp.com/docs

2. **Lee las guías avanzadas**:
   - [Gestión de Webhooks](./WEBHOOK_GUIDE.md)
   - [Ejemplos de código](./CODE_EXAMPLES.md)
   - [Integración con Zapier](./ZAPIER_GUIDE.md)

3. **Únete a la comunidad**  
   Discord: https://discord.gg/inmova  
   GitHub Discussions: https://github.com/inmova/discussions

---

## 🆘 Soporte

- **Email**: support@inmovaapp.com
- **Documentación**: https://inmovaapp.com/docs
- **Estado del servicio**: https://status.inmovaapp.com
- **Reportar bugs**: https://github.com/inmova/issues

---

## 📄 Recursos adicionales

- [Referencia completa de la API](https://inmovaapp.com/docs)
- [Ejemplos de código](./CODE_EXAMPLES.md)
- [Guía de Webhooks](./WEBHOOK_GUIDE.md)
- [Changelog de la API](./CHANGELOG.md)
- [Términos de servicio](https://inmovaapp.com/terms)

---

**Última actualización**: 3 de enero de 2026  
**Versión**: 1.0.0
