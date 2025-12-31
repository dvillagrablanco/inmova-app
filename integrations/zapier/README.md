# Inmova Zapier Integration

Official Zapier integration for Inmova PropTech API.

## Features

### 🔔 Triggers

- **New Property** - Triggers when a new property is created
- **Contract Signed** - Triggers when a contract is signed
- **Payment Received** - Triggers when a payment is received

### ⚡ Actions

- **Create Property** - Create a new property
- **Update Property** - Update an existing property
- **Create Tenant** - Create a new tenant
- **Create Contract** - Create a rental contract

### 🔍 Searches

- **Find Property** - Search for properties by city, status, price

## Development

### Prerequisites

```bash
npm install -g zapier-platform-cli
```

### Setup

```bash
# Install dependencies
npm install

# Link to Zapier account
zapier login
zapier register "Inmova PropTech"
```

### Testing

```bash
# Test authentication
zapier test --debug

# Test specific trigger
zapier test --include triggers.property_created

# Test all
zapier test
```

### Deployment

```bash
# Validate
zapier validate

# Push to Zapier
zapier push

# Promote version to production
zapier promote 1.0.0
```

## Popular Zaps

### 1. Property → Google Sheets

**When**: New property is created
**Then**: Add row to Google Sheets

### 2. Contract → QuickBooks

**When**: Contract is signed
**Then**: Create invoice in QuickBooks

### 3. Payment → Slack

**When**: Payment is received
**Then**: Send message to Slack channel

### 4. Airtable → Inmova

**When**: New record in Airtable
**Then**: Create property in Inmova

### 5. Gmail → Tenant

**When**: New email with specific label
**Then**: Create tenant in Inmova

## Configuration

### API Key

Get your API key from [Inmova Dashboard](https://inmovaapp.com/dashboard/integrations/api-keys):

1. Go to **Dashboard → Integrations → API Keys**
2. Click **"Create API Key"**
3. Copy the key and paste it in Zapier

### Webhooks

Webhooks are automatically created when you enable a Zap with triggers. No manual configuration needed.

## Support

- **Docs**: https://inmovaapp.com/api-docs
- **Email**: developers@inmova.app
- **GitHub**: https://github.com/inmova/zapier

## License

MIT
