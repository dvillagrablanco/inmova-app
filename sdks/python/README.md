# Inmova Python SDK

Official Python SDK for Inmova PropTech API.

## Installation

```bash
pip install inmova
```

## Quick Start

```python
from inmova import InmovaClient

client = InmovaClient(api_key="sk_live_your_api_key_here")

# List properties
properties = client.properties.list(
    city="Madrid",
    status="AVAILABLE",
    limit=10
)

for property in properties.data:
    print(f"{property.address} - {property.price}€/month")
```

## Configuration

```python
client = InmovaClient(
    api_key="sk_live_your_api_key_here",
    base_url="https://inmovaapp.com/api/v1",  # Optional
    timeout=30,  # Optional, seconds
    max_retries=3,  # Optional
)
```

## API Reference

### Properties

#### List Properties

```python
properties = client.properties.list(
    page=1,
    limit=20,
    status="AVAILABLE",
    city="Madrid",
    min_price=800,
    max_price=1500,
    type="APARTMENT"
)

print(f"Total: {properties.pagination.total}")
for prop in properties.data:
    print(f"{prop.address} - {prop.price}€")
```

#### Get Property

```python
property = client.properties.get("property_id")
print(property.address)
```

#### Create Property

```python
new_property = client.properties.create(
    address="Calle Mayor 123",
    city="Madrid",
    postal_code="28013",
    country="Spain",
    price=1200,
    rooms=3,
    bathrooms=2,
    square_meters=85,
    type="APARTMENT",
    status="AVAILABLE",
    description="Beautiful apartment",
    features=["elevator", "parking", "terrace"]
)

print(f"Created property: {new_property.id}")
```

#### Update Property

```python
updated = client.properties.update(
    "property_id",
    price=1300,
    status="RENTED"
)
```

#### Delete Property

```python
client.properties.delete("property_id")
```

### API Keys

#### List API Keys

```python
api_keys = client.api_keys.list()
for key in api_keys:
    print(f"{key.name}: {key.key_prefix}***")
```

#### Create API Key

```python
new_key = client.api_keys.create(
    name="Production Key",
    description="API key for production",
    scopes=["properties:read", "properties:write"],
    rate_limit=1000,
    expires_at="2025-12-31T23:59:59Z"
)

print(f"New key: {new_key.key}")  # Save this!
```

#### Revoke API Key

```python
client.api_keys.revoke("key_id")
```

### Webhooks

#### List Webhooks

```python
webhooks = client.webhooks.list()
for webhook in webhooks:
    print(f"{webhook.url}: {webhook.events}")
```

#### Create Webhook

```python
webhook = client.webhooks.create(
    url="https://your-server.com/webhook",
    events=["PROPERTY_CREATED", "CONTRACT_SIGNED"],
    description="Production webhook"
)

print(f"Webhook secret: {webhook.secret}")  # Save this!
```

#### Delete Webhook

```python
client.webhooks.delete("webhook_id")
```

#### Verify Webhook Signature

```python
from inmova import InmovaClient
from flask import Flask, request

app = Flask(__name__)
client = InmovaClient(api_key="sk_live_...")

@app.route("/webhook", methods=["POST"])
def webhook():
    signature = request.headers.get("X-Inmova-Signature")
    payload = request.get_data(as_text=True)
    secret = "your_webhook_secret"

    if not client.webhooks.verify_signature(payload, signature, secret):
        return "Invalid signature", 401

    event = request.get_json()
    print(f"Webhook event: {event}")

    return "OK", 200
```

## Error Handling

```python
from inmova import InmovaClient, InmovaError

client = InmovaClient(api_key="sk_live_...")

try:
    property = client.properties.get("invalid_id")
except InmovaError as e:
    print(f"Error: {e.error}")
    print(f"Status: {e.status_code}")
    print(f"Code: {e.code}")

    if e.status_code == 404:
        print("Property not found")
    elif e.status_code == 401:
        print("Invalid API key")
    elif e.status_code == 429:
        print("Rate limit exceeded")
```

## Type Hints

The SDK includes full type hints for better IDE support:

```python
from inmova import InmovaClient, Property, PropertyStatus
from typing import List

client = InmovaClient(api_key="sk_live_...")

# Full autocomplete and type checking
properties: List[Property] = client.properties.list().data

status: PropertyStatus = "AVAILABLE"  # Type-safe
```

## Examples

### Create and Publish Property

```python
property = client.properties.create(
    address="Calle Gran Vía 28",
    city="Madrid",
    price=1500,
    rooms=4,
    bathrooms=2,
    square_meters=120,
    type="APARTMENT",
    status="AVAILABLE",
    description="Luxury apartment with amazing views",
    features=["elevator", "parking", "terrace", "air-conditioning"]
)

print(f"Property created: {property.id}")
print(f"View at: https://inmovaapp.com/properties/{property.id}")
```

### Search and Filter

```python
results = client.properties.list(
    status="AVAILABLE",
    city="Barcelona",
    min_price=1000,
    max_price=2000,
    type="APARTMENT",
    limit=50
)

print(f"Found {results.pagination.total} properties")

for prop in results.data:
    print(f"{prop.address} - {prop.price}€/month")
```

### Bulk Update

```python
properties = client.properties.list(
    status="AVAILABLE",
    city="Valencia"
)

for prop in properties.data:
    # Increase all prices by 5%
    new_price = round(prop.price * 1.05)

    client.properties.update(
        prop.id,
        price=new_price
    )

    print(f"Updated {prop.address}: {prop.price}€ → {new_price}€")
```

### Webhook Handler (Flask)

```python
from flask import Flask, request
from inmova import InmovaClient
import json

app = Flask(__name__)
client = InmovaClient(api_key="sk_live_...")

@app.route("/webhook", methods=["POST"])
def handle_webhook():
    signature = request.headers.get("X-Inmova-Signature")
    payload = request.get_data(as_text=True)
    secret = "your_webhook_secret"

    # Verify signature
    if not client.webhooks.verify_signature(payload, signature, secret):
        return "Invalid signature", 401

    event = json.loads(payload)

    # Handle different event types
    if event["type"] == "PROPERTY_CREATED":
        print(f"New property: {event['data']}")
        # Send notification, update external system, etc.

    elif event["type"] == "CONTRACT_SIGNED":
        print(f"Contract signed: {event['data']}")
        # Generate invoice, send welcome email, etc.

    elif event["type"] == "PAYMENT_RECEIVED":
        print(f"Payment received: {event['data']}")
        # Update accounting, send receipt, etc.

    return "OK", 200

if __name__ == "__main__":
    app.run(port=3000)
```

## Support

- **Documentation**: https://inmovaapp.com/api-docs
- **API Reference**: https://inmovaapp.com/developers
- **GitHub Issues**: https://github.com/inmova/inmova-sdk-python/issues
- **Email**: developers@inmova.app

## License

MIT

## Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details.
