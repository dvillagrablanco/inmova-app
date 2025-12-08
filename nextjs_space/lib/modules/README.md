# INMOVA Modules Architecture

## Overview

This directory contains the modularized architecture of INMOVA, organized by business vertical and shared services.

## Structure

```
modules/
├── core/                    # Core functionality (auth, database, API)
├── shared/                  # Shared services across all verticals
│   ├── notifications/       # Email, SMS, Push, In-App
│   ├── pdf/                 # PDF generation and parsing
│   ├── ocr/                 # Optical Character Recognition
│   └── ai/                  # AI/ML services
└── [future verticals]/
    ├── traditional-rental/  # Alquiler tradicional
    ├── str/                 # Short-term rental
    ├── coliving/            # Coliving
    ├── construction/        # Construcción
    ├── flipping/            # Flipping
    └── professional/        # Servicios profesionales
```

## Shared Services

### Notifications (`shared/notifications/`)

**Purpose**: Centralized notification system for all communication channels.

**Features**:
- Email notifications with templates
- SMS notifications via Twilio/AWS SNS
- Web push notifications
- In-app notifications
- Bulk sending capabilities
- Template management

**Usage**:
```typescript
import { sendEmail, sendSMS, sendPushNotification } from '@/lib/modules/shared/notifications';

const recipient = {
  id: 'user_123',
  email: 'user@example.com',
  phone: '+1234567890',
};

const payload = {
  subject: 'Welcome!',
  body: 'Welcome to INMOVA',
};

await sendEmail(recipient, payload);
await sendSMS(recipient, { body: 'Welcome!' });
```

### PDF (`shared/pdf/`)

**Purpose**: PDF generation and manipulation for documents, contracts, invoices, reports.

**Features**:
- Generate PDFs from HTML templates
- Pre-built templates (contracts, invoices, reports)
- PDF parsing and text extraction
- Table extraction
- PDF merging
- Watermarking

**Usage**:
```typescript
import { generatePDFFromTemplate, parsePDF } from '@/lib/modules/shared/pdf';

// Generate contract PDF
const result = await generatePDFFromTemplate('contract', {
  landlordName: 'John Doe',
  tenantName: 'Jane Smith',
  propertyAddress: '123 Main St',
  rentAmount: '$1,500',
  startDate: '2024-01-01',
  endDate: '2024-12-31',
});

if (result.success) {
  // Save result.buffer to S3 or send as email attachment
}

// Parse existing PDF
const parsed = await parsePDF(pdfBuffer);
console.log(parsed.text);
```

### OCR (`shared/ocr/`)

**Purpose**: Optical Character Recognition for documents and images.

**Features**:
- General image OCR
- Structured document OCR (invoices, IDs, contracts)
- Field extraction from documents
- Table extraction
- Batch processing
- Image preprocessing

**Usage**:
```typescript
import { performImageOCR, extractInvoiceFields } from '@/lib/modules/shared/ocr';

// OCR on image
const result = await performImageOCR(imageBuffer, {
  language: 'es',
  detectOrientation: true,
});

console.log(result.text);

// Extract invoice fields
const fields = await extractInvoiceFields(invoiceBuffer);
const invoiceNumber = fields.find(f => f.key === 'invoice_number')?.value;
```

### AI (`shared/ai/`)

**Purpose**: AI and ML services for intelligent features.

**Features**:
- Conversational AI (chatbots)
- Intelligent suggestions
- Predictive analytics:
  - Tenant risk prediction
  - Occupancy forecasting
  - Maintenance cost prediction
  - Revenue forecasting
- Property pricing suggestions

**Usage**:
```typescript
import { sendChatMessage, predictTenantRisk, suggestPropertyPricing } from '@/lib/modules/shared/ai';

// Chat
const response = await sendChatMessage('¿Cuál es el estado de mi propiedad?', conversation);

// Predict tenant risk
const risk = await predictTenantRisk({
  creditScore: 750,
  employmentStatus: 'employed',
  income: 50000,
});

console.log(risk.prediction); // 'low', 'medium', 'high'

// Get pricing suggestion
const pricingSuggestion = await suggestPropertyPricing({
  location: 'Madrid, Centro',
  size: 80,
  bedrooms: 2,
  bathrooms: 1,
});

console.log(pricingSuggestion.metadata.suggestedPrice);
```

## Integration Guide

### Step 1: Import the Service

```typescript
import { sendEmail } from '@/lib/modules/shared/notifications';
import { generatePDFFromTemplate } from '@/lib/modules/shared/pdf';
import { performImageOCR } from '@/lib/modules/shared/ocr';
import { predictTenantRisk } from '@/lib/modules/shared/ai';
```

### Step 2: Use in Your Code

```typescript
// Example: Generate and email a contract
export async function createContractAndEmail(
  contractData: any,
  recipientEmail: string
) {
  // Generate PDF
  const pdfResult = await generatePDFFromTemplate('contract', contractData);
  
  if (!pdfResult.success) {
    throw new Error('Failed to generate PDF');
  }
  
  // Send email with attachment
  const emailResult = await sendEmail(
    { id: 'recipient', email: recipientEmail },
    {
      subject: 'Your Contract',
      body: 'Please find your contract attached.',
    },
    {
      from: 'noreply@inmova.com',
      attachments: [
        {
          filename: 'contract.pdf',
          content: pdfResult.buffer!,
          contentType: 'application/pdf',
        },
      ],
    }
  );
  
  return emailResult;
}
```

## Configuration

### Environment Variables

Each service may require specific environment variables:

```env
# Email
EMAIL_FROM=noreply@inmova.com
EMAIL_PROVIDER=sendgrid # or aws-ses
SENDGRID_API_KEY=your_key

# SMS
SMS_PROVIDER=twilio # or aws-sns, vonage
TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token
TWILIO_PHONE_NUMBER=+1234567890

# OCR
OCR_PROVIDER=tesseract # or google-vision, aws-textract
GOOGLE_VISION_API_KEY=your_key

# AI
AI_PROVIDER=abacus # or openai, anthropic
ABACUS_AI_API_KEY=your_key
OPENAI_API_KEY=your_key
```

## Testing

Each module includes stub implementations that work without external dependencies. To enable actual functionality:

1. Configure environment variables
2. Install required packages:
   ```bash
   yarn add @sendgrid/mail twilio sharp tesseract.js pdf-lib pdf-parse
   ```
3. Implement the TODOs in each service file
4. Run tests:
   ```bash
   yarn test lib/modules/shared
   ```

## Benefits of This Architecture

1. **Separation of Concerns**: Each service is independent and focused
2. **Reusability**: Services can be used across all business verticals
3. **Maintainability**: Easy to update or replace individual services
4. **Testability**: Each module can be tested in isolation
5. **Scalability**: Services can be extracted to microservices if needed
6. **Type Safety**: Full TypeScript support with clear interfaces

## Future Enhancements

- [ ] Add service health checks
- [ ] Implement service monitoring and logging
- [ ] Add rate limiting and quotas
- [ ] Create service abstraction layer for multiple providers
- [ ] Add caching for expensive operations
- [ ] Implement retry logic and circuit breakers
- [ ] Add service-level authentication and authorization
- [ ] Create admin dashboard for service management

## Contributing

When adding new shared services:

1. Create a new directory under `shared/`
2. Define types in `types.ts`
3. Implement core functionality
4. Export through `index.ts`
5. Update this README
6. Add tests
7. Document usage examples
