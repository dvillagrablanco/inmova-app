# @inmova/cli

Official command-line interface for Inmova PropTech API.

## Installation

```bash
npm install -g @inmova/cli
```

## Quick Start

### 1. Authentication

```bash
# Login with API key
inmova auth login

# Or provide key directly
inmova auth login --api-key sk_live_your_key_here

# Check authentication status
inmova auth whoami

# Logout
inmova auth logout
```

### 2. Properties Management

```bash
# List properties
inmova properties list

# List with filters
inmova properties list --city Madrid --status AVAILABLE --limit 10

# Get property details
inmova properties get property_id

# Create property
inmova properties create \
  --address "Calle Mayor 123" \
  --city "Madrid" \
  --price 1200 \
  --type APARTMENT \
  --rooms 3 \
  --bathrooms 2

# Update property
inmova properties update property_id --price 1300 --status RENTED

# Delete property
inmova properties delete property_id
```

### 3. API Keys Management

```bash
# List API keys
inmova api-keys list

# Create new API key
inmova api-keys create \
  --name "Production Key" \
  --description "API key for production" \
  --scopes "properties:read,properties:write" \
  --rate-limit 1000

# Revoke API key
inmova api-keys revoke key_id
```

### 4. Webhooks Management

```bash
# List webhooks
inmova webhooks list

# Create webhook
inmova webhooks create \
  --url "https://myapp.com/webhook" \
  --events "PROPERTY_CREATED,CONTRACT_SIGNED,PAYMENT_RECEIVED" \
  --description "Production webhook"

# Delete webhook
inmova webhooks delete webhook_id
```

## Commands Reference

### Authentication

- `inmova auth login` - Login with API key
- `inmova auth logout` - Remove stored credentials
- `inmova auth whoami` - Show current auth status

### Properties

- `inmova properties list [options]` - List properties
  - `--city <city>` - Filter by city
  - `--status <status>` - Filter by status
  - `--type <type>` - Filter by type
  - `--limit <number>` - Limit results (default: 20)
  - `--json` - Output as JSON

- `inmova properties get <id> [options]` - Get property by ID
  - `--json` - Output as JSON

- `inmova properties create [options]` - Create property
  - `--address <address>` - Address (required)
  - `--city <city>` - City (required)
  - `--price <price>` - Monthly price (required)
  - `--type <type>` - Property type (required)
  - `--postal-code <code>` - Postal code
  - `--country <country>` - Country
  - `--rooms <number>` - Number of rooms
  - `--bathrooms <number>` - Number of bathrooms
  - `--square-meters <number>` - Square meters
  - `--floor <number>` - Floor number
  - `--status <status>` - Status (default: AVAILABLE)
  - `--description <text>` - Description

- `inmova properties update <id> [options]` - Update property
  - `--price <price>` - New price
  - `--status <status>` - New status
  - `--description <text>` - New description

- `inmova properties delete <id>` - Delete property
  - `--yes` - Skip confirmation

### API Keys

- `inmova api-keys list` - List API keys
- `inmova api-keys create [options]` - Create API key
  - `--name <name>` - Key name (required)
  - `--description <text>` - Description
  - `--scopes <scopes>` - Comma-separated scopes
  - `--rate-limit <number>` - Rate limit (default: 1000)
  - `--expires-at <date>` - Expiration date (ISO 8601)

- `inmova api-keys revoke <id>` - Revoke API key

### Webhooks

- `inmova webhooks list` - List webhooks
- `inmova webhooks create [options]` - Create webhook
  - `--url <url>` - Webhook URL (required)
  - `--events <events>` - Comma-separated events (required)
  - `--description <text>` - Description

- `inmova webhooks delete <id>` - Delete webhook

## Configuration

Config is stored in `~/.inmova/config.json`

## Examples

### Create Multiple Properties

```bash
# Create apartment
inmova properties create \
  --address "Gran Vía 28" \
  --city "Madrid" \
  --price 1500 \
  --type APARTMENT \
  --rooms 4 \
  --bathrooms 2 \
  --square-meters 120 \
  --description "Luxury apartment in city center"

# Create house
inmova properties create \
  --address "Calle de Serrano 50" \
  --city "Madrid" \
  --price 2500 \
  --type HOUSE \
  --rooms 5 \
  --bathrooms 3 \
  --square-meters 200
```

### Bulk Operations

```bash
# List all available properties in Madrid
inmova properties list --city Madrid --status AVAILABLE --limit 100 --json > madrid_properties.json

# Update multiple properties (using jq)
cat madrid_properties.json | jq -r '.data[].id' | while read id; do
  inmova properties update $id --price 1300
done
```

### Webhook Testing

```bash
# Create test webhook
inmova webhooks create \
  --url "https://webhook.site/unique-url" \
  --events "PROPERTY_CREATED" \
  --description "Test webhook"

# Create property to trigger webhook
inmova properties create \
  --address "Test Street 1" \
  --city "Madrid" \
  --price 1000 \
  --type APARTMENT

# Check webhook.site for received payload
```

## Aliases

- `inmova props` = `inmova properties`
- `inmova keys` = `inmova api-keys`
- `inmova hooks` = `inmova webhooks`

## Output Formats

By default, commands output formatted tables. Use `--json` for JSON output:

```bash
# Table format (default)
inmova properties list

# JSON format
inmova properties list --json
```

## Error Handling

The CLI exits with code 1 on errors:

```bash
inmova properties get invalid_id
# Exit code: 1

echo $?
# Output: 1
```

## Support

- Documentation: https://inmovaapp.com/api-docs
- GitHub: https://github.com/inmova/inmova-cli
- Email: developers@inmova.app

## License

MIT
