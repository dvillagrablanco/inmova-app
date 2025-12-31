# @inmova/sdk

Official JavaScript/TypeScript SDK for Inmova PropTech API.

## Installation

```bash
npm install @inmova/sdk
# or
yarn add @inmova/sdk
# or
pnpm add @inmova/sdk
```

## Quick Start

```typescript
import { InmovaClient } from '@inmova/sdk';

const client = new InmovaClient({
  apiKey: 'sk_live_your_api_key_here',
});

// List properties
const properties = await client.properties.list({
  city: 'Madrid',
  status: 'AVAILABLE',
  limit: 10,
});

console.log(properties.data);
```

## Configuration

```typescript
const client = new InmovaClient({
  apiKey: 'sk_live_your_api_key_here',
  baseURL: 'https://inmovaapp.com/api/v1', // Optional, default shown
  timeout: 30000, // Optional, 30 seconds default
  maxRetries: 3, // Optional, 3 retries default
});
```

## API Reference

### Properties

#### List Properties

```typescript
const properties = await client.properties.list({
  page: 1,
  limit: 20,
  status: 'AVAILABLE',
  city: 'Madrid',
  minPrice: 800,
  maxPrice: 1500,
  type: 'APARTMENT',
});
```

#### Get Property

```typescript
const property = await client.properties.get('property_id');
```

#### Create Property

```typescript
const newProperty = await client.properties.create({
  address: 'Calle Mayor 123',
  city: 'Madrid',
  postalCode: '28013',
  country: 'Spain',
  price: 1200,
  rooms: 3,
  bathrooms: 2,
  squareMeters: 85,
  type: 'APARTMENT',
  status: 'AVAILABLE',
  description: 'Beautiful apartment in city center',
  features: ['elevator', 'parking', 'terrace'],
});
```

#### Update Property

```typescript
const updatedProperty = await client.properties.update('property_id', {
  price: 1300,
  status: 'RENTED',
});
```

#### Delete Property

```typescript
await client.properties.delete('property_id');
```

### API Keys

#### List API Keys

```typescript
const apiKeys = await client.apiKeys.list();
```

#### Create API Key

```typescript
const newKey = await client.apiKeys.create({
  name: 'Production Key',
  description: 'API key for production environment',
  scopes: ['properties:read', 'properties:write', 'tenants:read'],
  rateLimit: 1000,
  expiresAt: '2025-12-31T23:59:59Z',
});

console.log(newKey.key); // Save this, it won't be shown again!
```

#### Revoke API Key

```typescript
await client.apiKeys.revoke('key_id');
```

### Webhooks

#### List Webhooks

```typescript
const webhooks = await client.webhooks.list();
```

#### Create Webhook

```typescript
const webhook = await client.webhooks.create({
  url: 'https://your-server.com/webhook',
  events: ['PROPERTY_CREATED', 'CONTRACT_SIGNED', 'PAYMENT_RECEIVED'],
  description: 'Production webhook',
});

console.log(webhook.secret); // Save this for signature verification
```

#### Delete Webhook

```typescript
await client.webhooks.delete('webhook_id');
```

#### Verify Webhook Signature

```typescript
import express from 'express';

const app = express();

app.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  const signature = req.headers['x-inmova-signature'] as string;
  const payload = req.body.toString();
  const secret = 'your_webhook_secret';

  const isValid = client.webhooks.verifySignature(payload, signature, secret);

  if (!isValid) {
    return res.status(401).send('Invalid signature');
  }

  const event = JSON.parse(payload);
  console.log('Webhook event:', event);

  res.status(200).send('OK');
});
```

## Error Handling

```typescript
import { InmovaClient } from '@inmova/sdk';
import type { InmovaError } from '@inmova/sdk';

const client = new InmovaClient({ apiKey: 'sk_live_...' });

try {
  const property = await client.properties.get('invalid_id');
} catch (error) {
  const inmovaError = error as InmovaError;

  console.error('Error:', inmovaError.error);
  console.error('Code:', inmovaError.code);
  console.error('Status:', inmovaError.statusCode);

  if (inmovaError.statusCode === 404) {
    console.log('Property not found');
  } else if (inmovaError.statusCode === 401) {
    console.log('Invalid API key');
  } else if (inmovaError.statusCode === 429) {
    console.log('Rate limit exceeded');
  }
}
```

## TypeScript Support

This SDK is written in TypeScript and includes full type definitions.

```typescript
import { InmovaClient, Property, PropertyStatus } from '@inmova/sdk';

const client = new InmovaClient({ apiKey: 'sk_live_...' });

// Full autocomplete and type checking
const properties: Property[] = await client.properties.list();

const status: PropertyStatus = 'AVAILABLE'; // Type-safe enum
```

## Examples

### Create and Publish Property

```typescript
const property = await client.properties.create({
  address: 'Calle Gran Vía 28',
  city: 'Madrid',
  price: 1500,
  rooms: 4,
  bathrooms: 2,
  squareMeters: 120,
  type: 'APARTMENT',
  status: 'AVAILABLE',
  description: 'Luxury apartment with amazing views',
  features: ['elevator', 'parking', 'terrace', 'air-conditioning'],
});

console.log(`Property created with ID: ${property.id}`);
console.log(`View at: https://inmovaapp.com/properties/${property.id}`);
```

### Search Available Properties

```typescript
const results = await client.properties.list({
  status: 'AVAILABLE',
  city: 'Barcelona',
  minPrice: 1000,
  maxPrice: 2000,
  type: 'APARTMENT',
  limit: 50,
});

console.log(`Found ${results.pagination.total} properties`);

results.data.forEach((property) => {
  console.log(`${property.address} - ${property.price}€/month`);
});
```

### Bulk Update Properties

```typescript
const properties = await client.properties.list({
  status: 'AVAILABLE',
  city: 'Valencia',
});

for (const property of properties.data) {
  // Increase all prices by 5%
  const newPrice = Math.round(property.price * 1.05);

  await client.properties.update(property.id, {
    price: newPrice,
  });

  console.log(`Updated ${property.address}: ${property.price}€ → ${newPrice}€`);
}
```

### Webhook Event Handler

```typescript
import express from 'express';
import { InmovaClient } from '@inmova/sdk';

const app = express();
const client = new InmovaClient({ apiKey: 'sk_live_...' });

app.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  const signature = req.headers['x-inmova-signature'] as string;
  const payload = req.body.toString();
  const secret = process.env.WEBHOOK_SECRET!;

  // Verify signature
  if (!client.webhooks.verifySignature(payload, signature, secret)) {
    return res.status(401).send('Invalid signature');
  }

  const event = JSON.parse(payload);

  // Handle different event types
  switch (event.type) {
    case 'PROPERTY_CREATED':
      console.log('New property:', event.data);
      // Send notification, update external system, etc.
      break;

    case 'CONTRACT_SIGNED':
      console.log('Contract signed:', event.data);
      // Generate invoice, send welcome email, etc.
      break;

    case 'PAYMENT_RECEIVED':
      console.log('Payment received:', event.data);
      // Update accounting, send receipt, etc.
      break;

    default:
      console.log('Unknown event type:', event.type);
  }

  res.status(200).send('OK');
});

app.listen(3000, () => {
  console.log('Webhook server listening on port 3000');
});
```

## Support

- **Documentation**: https://inmovaapp.com/api-docs
- **API Reference**: https://inmovaapp.com/developers
- **GitHub Issues**: https://github.com/inmova/inmova-sdk-js/issues
- **Email**: developers@inmova.app

## License

MIT

## Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details.
