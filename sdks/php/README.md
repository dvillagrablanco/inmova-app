# Inmova PHP SDK

Official PHP SDK for Inmova PropTech API.

## Installation

```bash
composer require inmova/sdk
```

## Quick Start

```php
<?php

require_once 'vendor/autoload.php';

use Inmova\InmovaClient;

$client = new InmovaClient([
    'apiKey' => 'sk_live_your_api_key_here',
]);

// List properties
$properties = $client->properties->list([
    'city' => 'Madrid',
    'status' => 'AVAILABLE',
    'limit' => 10,
]);

foreach ($properties['data'] as $property) {
    echo "{$property['address']} - {$property['price']}€/month\n";
}
```

## Configuration

```php
$client = new InmovaClient([
    'apiKey' => 'sk_live_your_api_key_here',
    'baseUrl' => 'https://inmovaapp.com/api/v1', // Optional
    'timeout' => 30, // Optional, seconds
]);
```

## API Reference

### Properties

#### List Properties

```php
$properties = $client->properties->list([
    'page' => 1,
    'limit' => 20,
    'status' => 'AVAILABLE',
    'city' => 'Madrid',
    'minPrice' => 800,
    'maxPrice' => 1500,
    'type' => 'APARTMENT',
]);

echo "Total: {$properties['pagination']['total']}\n";
foreach ($properties['data'] as $property) {
    echo "{$property['address']} - {$property['price']}€\n";
}
```

#### Get Property

```php
$property = $client->properties->get('property_id');
echo $property['address'];
```

#### Create Property

```php
$newProperty = $client->properties->create([
    'address' => 'Calle Mayor 123',
    'city' => 'Madrid',
    'postalCode' => '28013',
    'country' => 'Spain',
    'price' => 1200,
    'rooms' => 3,
    'bathrooms' => 2,
    'squareMeters' => 85,
    'type' => 'APARTMENT',
    'status' => 'AVAILABLE',
    'description' => 'Beautiful apartment',
    'features' => ['elevator', 'parking', 'terrace'],
]);

echo "Created: {$newProperty['id']}\n";
```

#### Update Property

```php
$updated = $client->properties->update('property_id', [
    'price' => 1300,
    'status' => 'RENTED',
]);
```

#### Delete Property

```php
$client->properties->delete('property_id');
```

### API Keys

#### List API Keys

```php
$apiKeys = $client->apiKeys->list();
foreach ($apiKeys as $key) {
    echo "{$key['name']}: {$key['keyPrefix']}***\n";
}
```

#### Create API Key

```php
$newKey = $client->apiKeys->create([
    'name' => 'Production Key',
    'description' => 'API key for production',
    'scopes' => ['properties:read', 'properties:write'],
    'rateLimit' => 1000,
    'expiresAt' => '2025-12-31T23:59:59Z',
]);

echo "New key: {$newKey['key']}\n"; // Save this!
```

#### Revoke API Key

```php
$client->apiKeys->revoke('key_id');
```

### Webhooks

#### List Webhooks

```php
$webhooks = $client->webhooks->list();
foreach ($webhooks as $webhook) {
    echo "{$webhook['url']}\n";
}
```

#### Create Webhook

```php
$webhook = $client->webhooks->create([
    'url' => 'https://your-server.com/webhook',
    'events' => ['PROPERTY_CREATED', 'CONTRACT_SIGNED'],
    'description' => 'Production webhook',
]);

echo "Secret: {$webhook['secret']}\n"; // Save this!
```

#### Delete Webhook

```php
$client->webhooks->delete('webhook_id');
```

#### Verify Webhook Signature

```php
<?php

use Inmova\InmovaClient;
use Inmova\WebhooksResource;

$signature = $_SERVER['HTTP_X_INMOVA_SIGNATURE'];
$payload = file_get_contents('php://input');
$secret = 'your_webhook_secret';

if (!WebhooksResource::verifySignature($payload, $signature, $secret)) {
    http_response_code(401);
    die('Invalid signature');
}

$event = json_decode($payload, true);
echo "Webhook event: {$event['type']}\n";

http_response_code(200);
echo 'OK';
```

## Error Handling

```php
use Inmova\InmovaClient;
use Inmova\InmovaException;

$client = new InmovaClient(['apiKey' => 'sk_live_...']);

try {
    $property = $client->properties->get('invalid_id');
} catch (InmovaException $e) {
    echo "Error: {$e->getMessage()}\n";
    echo "Status: {$e->statusCode}\n";
    echo "Code: {$e->code}\n";

    if ($e->statusCode === 404) {
        echo "Property not found\n";
    } elseif ($e->statusCode === 401) {
        echo "Invalid API key\n";
    } elseif ($e->statusCode === 429) {
        echo "Rate limit exceeded\n";
    }
}
```

## Examples

### Create and Publish Property

```php
$property = $client->properties->create([
    'address' => 'Calle Gran Vía 28',
    'city' => 'Madrid',
    'price' => 1500,
    'rooms' => 4,
    'bathrooms' => 2,
    'squareMeters' => 120,
    'type' => 'APARTMENT',
    'status' => 'AVAILABLE',
    'description' => 'Luxury apartment with amazing views',
    'features' => ['elevator', 'parking', 'terrace', 'air-conditioning'],
]);

echo "Property created: {$property['id']}\n";
echo "View at: https://inmovaapp.com/properties/{$property['id']}\n";
```

### Search and Filter

```php
$results = $client->properties->list([
    'status' => 'AVAILABLE',
    'city' => 'Barcelona',
    'minPrice' => 1000,
    'maxPrice' => 2000,
    'type' => 'APARTMENT',
    'limit' => 50,
]);

echo "Found {$results['pagination']['total']} properties\n";

foreach ($results['data'] as $property) {
    echo "{$property['address']} - {$property['price']}€/month\n";
}
```

### Bulk Update

```php
$properties = $client->properties->list([
    'status' => 'AVAILABLE',
    'city' => 'Valencia',
]);

foreach ($properties['data'] as $property) {
    // Increase all prices by 5%
    $newPrice = round($property['price'] * 1.05);

    $client->properties->update($property['id'], [
        'price' => $newPrice,
    ]);

    echo "Updated {$property['address']}: {$property['price']}€ → {$newPrice}€\n";
}
```

## Support

- **Documentation**: https://inmovaapp.com/api-docs
- **API Reference**: https://inmovaapp.com/developers
- **GitHub Issues**: https://github.com/inmova/inmova-sdk-php/issues
- **Email**: developers@inmova.app

## License

MIT
