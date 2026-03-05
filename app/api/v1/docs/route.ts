/**
 * Public API v1 Documentation
 * GET /api/v1/docs
 * 
 * Returns OpenAPI spec for the public API
 */
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const OPENAPI_SPEC = {
  openapi: '3.0.3',
  info: {
    title: 'Inmova Public API',
    version: '1.0.0',
    description: 'API pública para integradores y partners. Requiere API key.',
    contact: { email: 'api@inmovaapp.com' },
  },
  servers: [
    { url: 'https://inmovaapp.com/api/v1', description: 'Production' },
  ],
  security: [{ apiKey: [] }],
  components: {
    securitySchemes: {
      apiKey: { type: 'apiKey', in: 'header', name: 'X-API-Key', description: 'API key from dashboard/integrations/api-keys' },
    },
    schemas: {
      Property: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          address: { type: 'string' },
          city: { type: 'string' },
          type: { type: 'string', enum: ['vivienda', 'local', 'garaje', 'oficina', 'nave'] },
          surface: { type: 'number' },
          rooms: { type: 'integer' },
          price: { type: 'number' },
          status: { type: 'string', enum: ['disponible', 'ocupada', 'mantenimiento'] },
        },
      },
      Tenant: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          email: { type: 'string' },
          phone: { type: 'string' },
          active: { type: 'boolean' },
        },
      },
      Payment: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          amount: { type: 'number' },
          dueDate: { type: 'string', format: 'date' },
          status: { type: 'string', enum: ['pendiente', 'pagado', 'vencido'] },
          tenantId: { type: 'string' },
        },
      },
      WebhookEvent: {
        type: 'object',
        properties: {
          event: { type: 'string' },
          timestamp: { type: 'string', format: 'date-time' },
          data: { type: 'object' },
        },
      },
    },
  },
  paths: {
    '/properties': {
      get: {
        summary: 'List properties',
        tags: ['Properties'],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20, maximum: 100 } },
          { name: 'status', in: 'query', schema: { type: 'string' } },
        ],
        responses: { '200': { description: 'Property list', content: { 'application/json': { schema: { type: 'object', properties: { data: { type: 'array', items: { '$ref': '#/components/schemas/Property' } }, pagination: { type: 'object' } } } } } } },
      },
    },
    '/properties/{id}': {
      get: { summary: 'Get property', tags: ['Properties'], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Property detail' } } },
    },
    '/tenants': {
      get: { summary: 'List tenants', tags: ['Tenants'], responses: { '200': { description: 'Tenant list' } } },
    },
    '/payments': {
      get: { summary: 'List payments', tags: ['Payments'], responses: { '200': { description: 'Payment list' } } },
    },
    '/webhooks/subscribe': {
      post: {
        summary: 'Subscribe to webhook events',
        tags: ['Webhooks'],
        requestBody: {
          content: { 'application/json': { schema: { type: 'object', properties: { url: { type: 'string', format: 'uri' }, events: { type: 'array', items: { type: 'string' } }, secret: { type: 'string' } }, required: ['url', 'events'] } } },
        },
        responses: { '201': { description: 'Subscription created' } },
      },
    },
  },
  'x-webhook-events': [
    'payment.created', 'payment.paid', 'payment.overdue',
    'contract.created', 'contract.renewed', 'contract.terminated',
    'tenant.created', 'tenant.updated',
    'maintenance.created', 'maintenance.resolved',
    'insurance.expiring',
  ],
};

export async function GET() {
  return NextResponse.json(OPENAPI_SPEC, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json',
    },
  });
}
