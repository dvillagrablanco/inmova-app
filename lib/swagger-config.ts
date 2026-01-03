/**
 * Swagger/OpenAPI Configuration
 * Documentación pública de la API de Inmova
 */

export const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Inmova API',
    version: '1.0.0',
    description: `
# Inmova API Documentation

API RESTful para integración con la plataforma Inmova.

## Autenticación

La API utiliza **API Keys** con sistema de scopes. Para obtener una API Key:

1. Inicia sesión en [Inmova Dashboard](https://inmovaapp.com/dashboard)
2. Ve a Configuración → API Keys
3. Crea una nueva API Key con los scopes necesarios
4. Guarda la key de forma segura (solo se muestra una vez)

### Ejemplo de autenticación:

\`\`\`bash
curl https://inmovaapp.com/api/v1/properties \\
  -H "Authorization: Bearer sk_live_YOUR_API_KEY"
\`\`\`

## Rate Limiting

Límites por defecto:
- **Basic**: 1,000 requests/minuto
- **Pro**: 5,000 requests/minuto  
- **Enterprise**: Ilimitado

## Webhooks

Recibe notificaciones en tiempo real de eventos. Ver [Webhook Events](#tag/Webhooks).

## Soporte

- Email: support@inmovaapp.com
- Docs: https://docs.inmovaapp.com
- Status: https://status.inmovaapp.com
    `,
    contact: {
      name: 'Inmova Support',
      email: 'support@inmovaapp.com',
      url: 'https://inmovaapp.com/support',
    },
    license: {
      name: 'Proprietary',
      url: 'https://inmovaapp.com/terms',
    },
  },
  servers: [
    {
      url: 'https://inmovaapp.com',
      description: 'Production',
    },
    {
      url: 'http://localhost:3000',
      description: 'Development',
    },
  ],
  tags: [
    {
      name: 'Authentication',
      description: 'API Keys y autenticación',
    },
    {
      name: 'Properties',
      description: 'Gestión de propiedades inmobiliarias',
    },
    {
      name: 'Tenants',
      description: 'Gestión de inquilinos',
    },
    {
      name: 'Contracts',
      description: 'Gestión de contratos de arrendamiento',
    },
    {
      name: 'Payments',
      description: 'Gestión de pagos',
    },
    {
      name: 'Webhooks',
      description: 'Configuración de webhooks para eventos',
    },
    {
      name: 'Documents',
      description: 'Gestión de documentos y archivos',
    },
  ],
  components: {
    securitySchemes: {
      ApiKeyAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'API Key',
        description: 'API Key obtenida desde el dashboard de Inmova',
      },
    },
    schemas: {
      // Property
      Property: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            example: 'clxy123abc456def',
            description: 'ID único de la propiedad',
          },
          address: {
            type: 'string',
            example: 'Calle Mayor 123',
            description: 'Dirección completa',
          },
          city: {
            type: 'string',
            example: 'Madrid',
            description: 'Ciudad',
          },
          postalCode: {
            type: 'string',
            example: '28013',
            description: 'Código postal',
          },
          country: {
            type: 'string',
            example: 'España',
            description: 'País',
          },
          type: {
            type: 'string',
            enum: ['HOUSE', 'APARTMENT', 'STUDIO', 'ROOM', 'OFFICE', 'LOCAL', 'PARKING', 'STORAGE'],
            example: 'APARTMENT',
            description: 'Tipo de propiedad',
          },
          status: {
            type: 'string',
            enum: ['AVAILABLE', 'RENTED', 'MAINTENANCE', 'INACTIVE'],
            example: 'AVAILABLE',
            description: 'Estado de la propiedad',
          },
          price: {
            type: 'number',
            example: 1200,
            description: 'Precio mensual en euros',
          },
          rooms: {
            type: 'integer',
            example: 3,
            description: 'Número de habitaciones',
          },
          bathrooms: {
            type: 'integer',
            example: 2,
            description: 'Número de baños',
          },
          squareMeters: {
            type: 'number',
            example: 85.5,
            description: 'Superficie en metros cuadrados',
          },
          description: {
            type: 'string',
            example: 'Piso luminoso en pleno centro de Madrid...',
            description: 'Descripción de la propiedad',
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            example: '2026-01-03T10:00:00Z',
            description: 'Fecha de creación',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            example: '2026-01-03T12:00:00Z',
            description: 'Fecha de última actualización',
          },
        },
        required: ['id', 'address', 'city', 'type', 'status', 'price'],
      },

      // Pagination
      PaginationMeta: {
        type: 'object',
        properties: {
          page: {
            type: 'integer',
            example: 1,
            description: 'Página actual',
          },
          limit: {
            type: 'integer',
            example: 20,
            description: 'Elementos por página',
          },
          total: {
            type: 'integer',
            example: 156,
            description: 'Total de elementos',
          },
          pages: {
            type: 'integer',
            example: 8,
            description: 'Total de páginas',
          },
        },
      },

      // API Key
      ApiKey: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            example: 'clxy123abc456def',
          },
          keyPrefix: {
            type: 'string',
            example: 'sk_live_abc123',
            description: 'Prefijo de la key (para identificación)',
          },
          name: {
            type: 'string',
            example: 'Production API Key',
            description: 'Nombre descriptivo',
          },
          description: {
            type: 'string',
            example: 'Key para integración con sistema de gestión',
          },
          scopes: {
            type: 'array',
            items: { type: 'string' },
            example: ['properties:read', 'properties:write'],
            description: 'Permisos de la API Key',
          },
          status: {
            type: 'string',
            enum: ['ACTIVE', 'REVOKED'],
            example: 'ACTIVE',
          },
          rateLimit: {
            type: 'integer',
            example: 1000,
            description: 'Requests por minuto permitidos',
          },
          lastUsedAt: {
            type: 'string',
            format: 'date-time',
            nullable: true,
          },
          expiresAt: {
            type: 'string',
            format: 'date-time',
            nullable: true,
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
          },
        },
      },

      // Webhook
      WebhookSubscription: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            example: 'clxy123abc456def',
          },
          url: {
            type: 'string',
            format: 'uri',
            example: 'https://your-app.com/webhooks/inmova',
            description: 'URL donde se enviarán los eventos',
          },
          events: {
            type: 'array',
            items: {
              type: 'string',
              enum: [
                'PROPERTY_CREATED',
                'PROPERTY_UPDATED',
                'PROPERTY_DELETED',
                'TENANT_CREATED',
                'TENANT_UPDATED',
                'CONTRACT_CREATED',
                'CONTRACT_SIGNED',
                'PAYMENT_CREATED',
                'PAYMENT_RECEIVED',
                'MAINTENANCE_CREATED',
                'MAINTENANCE_RESOLVED',
                'DOCUMENT_UPLOADED',
              ],
            },
            example: ['PROPERTY_CREATED', 'CONTRACT_SIGNED'],
            description: 'Eventos a los que subscribirse',
          },
          active: {
            type: 'boolean',
            example: true,
            description: 'Si el webhook está activo',
          },
          maxRetries: {
            type: 'integer',
            example: 3,
            description: 'Número máximo de reintentos en caso de fallo',
          },
          successCount: {
            type: 'integer',
            example: 156,
            description: 'Número de envíos exitosos',
          },
          failureCount: {
            type: 'integer',
            example: 3,
            description: 'Número de fallos',
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
          },
        },
      },

      // Error Response
      Error: {
        type: 'object',
        properties: {
          error: {
            type: 'string',
            example: 'Validation failed',
            description: 'Mensaje de error',
          },
          code: {
            type: 'string',
            example: 'VALIDATION_ERROR',
            description: 'Código de error',
          },
          details: {
            type: 'object',
            description: 'Detalles adicionales del error',
          },
        },
      },

      // Success Response
      SuccessResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: true,
          },
          data: {
            type: 'object',
            description: 'Datos de respuesta',
          },
          message: {
            type: 'string',
            example: 'Operation completed successfully',
          },
        },
      },
    },
    responses: {
      Unauthorized: {
        description: 'No autenticado - API Key inválida o faltante',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' },
            example: {
              error: 'Unauthorized',
              code: 'UNAUTHORIZED',
            },
          },
        },
      },
      Forbidden: {
        description: 'Prohibido - La API Key no tiene los scopes necesarios',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' },
            example: {
              error: 'Forbidden',
              code: 'FORBIDDEN',
              details: {
                requiredScopes: ['properties:write'],
                providedScopes: ['properties:read'],
              },
            },
          },
        },
      },
      NotFound: {
        description: 'Recurso no encontrado',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' },
            example: {
              error: 'Resource not found',
              code: 'NOT_FOUND',
            },
          },
        },
      },
      ValidationError: {
        description: 'Error de validación - Datos inválidos',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' },
            example: {
              error: 'Validation failed',
              code: 'VALIDATION_ERROR',
              details: {
                address: 'Address is required',
                price: 'Price must be positive',
              },
            },
          },
        },
      },
      RateLimitExceeded: {
        description: 'Límite de rate excedido',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' },
            example: {
              error: 'Rate limit exceeded',
              code: 'RATE_LIMIT_EXCEEDED',
              details: {
                limit: 1000,
                remaining: 0,
                resetAt: '2026-01-03T10:01:00Z',
              },
            },
          },
        },
      },
    },
  },
  security: [{ ApiKeyAuth: [] }],
  paths: {
    // Properties
    '/api/v1/properties': {
      get: {
        tags: ['Properties'],
        summary: 'Listar propiedades',
        description: 'Obtiene lista paginada de propiedades de la empresa',
        parameters: [
          {
            name: 'page',
            in: 'query',
            schema: { type: 'integer', default: 1, minimum: 1 },
            description: 'Número de página',
          },
          {
            name: 'limit',
            in: 'query',
            schema: { type: 'integer', default: 20, minimum: 1, maximum: 100 },
            description: 'Elementos por página',
          },
          {
            name: 'status',
            in: 'query',
            schema: {
              type: 'string',
              enum: ['AVAILABLE', 'RENTED', 'MAINTENANCE', 'INACTIVE'],
            },
            description: 'Filtrar por estado',
          },
          {
            name: 'type',
            in: 'query',
            schema: {
              type: 'string',
              enum: ['HOUSE', 'APARTMENT', 'STUDIO', 'ROOM', 'OFFICE', 'LOCAL', 'PARKING', 'STORAGE'],
            },
            description: 'Filtrar por tipo',
          },
          {
            name: 'city',
            in: 'query',
            schema: { type: 'string' },
            description: 'Filtrar por ciudad (búsqueda parcial)',
          },
        ],
        responses: {
          '200': {
            description: 'Lista de propiedades',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Property' },
                    },
                    pagination: { $ref: '#/components/schemas/PaginationMeta' },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '429': { $ref: '#/components/responses/RateLimitExceeded' },
        },
      },
      post: {
        tags: ['Properties'],
        summary: 'Crear propiedad',
        description: 'Crea una nueva propiedad',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['address', 'city', 'price'],
                properties: {
                  address: { type: 'string', example: 'Calle Mayor 123' },
                  city: { type: 'string', example: 'Madrid' },
                  postalCode: { type: 'string', example: '28013' },
                  country: { type: 'string', default: 'España' },
                  type: {
                    type: 'string',
                    enum: ['HOUSE', 'APARTMENT', 'STUDIO', 'ROOM', 'OFFICE', 'LOCAL', 'PARKING', 'STORAGE'],
                    default: 'APARTMENT',
                  },
                  status: {
                    type: 'string',
                    enum: ['AVAILABLE', 'RENTED', 'MAINTENANCE', 'INACTIVE'],
                    default: 'AVAILABLE',
                  },
                  price: { type: 'number', example: 1200 },
                  rooms: { type: 'integer', example: 3 },
                  bathrooms: { type: 'integer', example: 2 },
                  squareMeters: { type: 'number', example: 85.5 },
                  description: { type: 'string', example: 'Piso luminoso en pleno centro...' },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Propiedad creada exitosamente',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/Property' },
                    message: { type: 'string', example: 'Property created successfully' },
                  },
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/ValidationError' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
        },
      },
    },

    '/api/v1/properties/{id}': {
      get: {
        tags: ['Properties'],
        summary: 'Obtener propiedad por ID',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'ID de la propiedad',
          },
        ],
        responses: {
          '200': {
            description: 'Propiedad encontrada',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/Property' },
                  },
                },
              },
            },
          },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
      put: {
        tags: ['Properties'],
        summary: 'Actualizar propiedad',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  address: { type: 'string' },
                  price: { type: 'number' },
                  status: {
                    type: 'string',
                    enum: ['AVAILABLE', 'RENTED', 'MAINTENANCE', 'INACTIVE'],
                  },
                  description: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Propiedad actualizada',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/Property' },
                  },
                },
              },
            },
          },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
      delete: {
        tags: ['Properties'],
        summary: 'Eliminar propiedad',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': {
            description: 'Propiedad eliminada',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Property deleted successfully' },
                  },
                },
              },
            },
          },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
    },

    // API Keys
    '/api/v1/api-keys': {
      get: {
        tags: ['Authentication'],
        summary: 'Listar API keys',
        description: 'Obtiene lista de API keys de la empresa (sin mostrar el valor completo)',
        responses: {
          '200': {
            description: 'Lista de API keys',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/ApiKey' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Authentication'],
        summary: 'Crear API key',
        description: 'Crea una nueva API key. ⚠️ La key completa solo se muestra una vez.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'scopes'],
                properties: {
                  name: { type: 'string', example: 'Production API Key' },
                  description: { type: 'string', example: 'Key para sistema de gestión' },
                  scopes: {
                    type: 'array',
                    items: { type: 'string' },
                    example: ['properties:read', 'properties:write'],
                  },
                  rateLimit: { type: 'integer', default: 1000 },
                  expiresInDays: { type: 'integer', example: 365 },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'API key creada',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/ApiKey' },
                    key: { type: 'string', example: 'sk_live_abc123def456...' },
                    warning: {
                      type: 'string',
                      example: 'Save this key securely. You will not be able to see it again.',
                    },
                  },
                },
              },
            },
          },
        },
      },
    },

    // Webhooks
    '/api/v1/webhooks': {
      get: {
        tags: ['Webhooks'],
        summary: 'Listar webhooks',
        responses: {
          '200': {
            description: 'Lista de webhooks',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/WebhookSubscription' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Webhooks'],
        summary: 'Crear webhook',
        description: 'Crea una nueva subscription de webhook. Recibirás eventos en tu URL configurada.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['url', 'events'],
                properties: {
                  url: {
                    type: 'string',
                    format: 'uri',
                    example: 'https://your-app.com/webhooks/inmova',
                  },
                  events: {
                    type: 'array',
                    items: {
                      type: 'string',
                      enum: [
                        'PROPERTY_CREATED',
                        'PROPERTY_UPDATED',
                        'PROPERTY_DELETED',
                        'CONTRACT_SIGNED',
                        'PAYMENT_RECEIVED',
                      ],
                    },
                    example: ['PROPERTY_CREATED', 'CONTRACT_SIGNED'],
                  },
                  maxRetries: { type: 'integer', default: 3, minimum: 0, maximum: 5 },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Webhook creado',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/WebhookSubscription' },
                    warning: {
                      type: 'string',
                      example: 'Save the webhook secret securely.',
                    },
                  },
                },
              },
            },
          },
        },
      },
    },

    // Tenants
    '/api/v1/tenants': {
      get: {
        tags: ['Tenants'],
        summary: 'Listar inquilinos',
        description: 'Obtiene lista paginada de inquilinos de la empresa',
        parameters: [
          {
            name: 'page',
            in: 'query',
            schema: { type: 'integer', default: 1, minimum: 1 },
            description: 'Número de página',
          },
          {
            name: 'limit',
            in: 'query',
            schema: { type: 'integer', default: 20, minimum: 1, maximum: 100 },
            description: 'Elementos por página',
          },
          {
            name: 'status',
            in: 'query',
            schema: {
              type: 'string',
              enum: ['ACTIVE', 'INACTIVE', 'PENDING'],
            },
            description: 'Filtrar por estado',
          },
        ],
        responses: {
          '200': {
            description: 'Lista de inquilinos',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          id: { type: 'string' },
                          name: { type: 'string' },
                          email: { type: 'string' },
                          phone: { type: 'string' },
                          status: { type: 'string', enum: ['ACTIVE', 'INACTIVE', 'PENDING'] },
                          propertyId: { type: 'string' },
                          createdAt: { type: 'string', format: 'date-time' },
                        },
                      },
                    },
                    pagination: { $ref: '#/components/schemas/PaginationMeta' },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
      post: {
        tags: ['Tenants'],
        summary: 'Crear inquilino',
        description: 'Crea un nuevo inquilino',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'email'],
                properties: {
                  name: { type: 'string', example: 'Juan Pérez' },
                  email: { type: 'string', format: 'email', example: 'juan.perez@example.com' },
                  phone: { type: 'string', example: '+34666555444' },
                  dni: { type: 'string', example: '12345678A' },
                  propertyId: { type: 'string', description: 'ID de la propiedad asignada' },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Inquilino creado exitosamente',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { type: 'object' },
                    message: { type: 'string', example: 'Tenant created successfully' },
                  },
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/ValidationError' },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },

    // Contracts
    '/api/v1/contracts': {
      get: {
        tags: ['Contracts'],
        summary: 'Listar contratos',
        description: 'Obtiene lista paginada de contratos de arrendamiento',
        parameters: [
          {
            name: 'page',
            in: 'query',
            schema: { type: 'integer', default: 1, minimum: 1 },
          },
          {
            name: 'limit',
            in: 'query',
            schema: { type: 'integer', default: 20, minimum: 1, maximum: 100 },
          },
          {
            name: 'status',
            in: 'query',
            schema: {
              type: 'string',
              enum: ['DRAFT', 'PENDING_SIGNATURE', 'ACTIVE', 'EXPIRED', 'CANCELLED'],
            },
          },
        ],
        responses: {
          '200': {
            description: 'Lista de contratos',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          id: { type: 'string' },
                          propertyId: { type: 'string' },
                          tenantId: { type: 'string' },
                          startDate: { type: 'string', format: 'date' },
                          endDate: { type: 'string', format: 'date' },
                          rentAmount: { type: 'number' },
                          status: { type: 'string' },
                          signedAt: { type: 'string', format: 'date-time', nullable: true },
                        },
                      },
                    },
                    pagination: { $ref: '#/components/schemas/PaginationMeta' },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
      post: {
        tags: ['Contracts'],
        summary: 'Crear contrato',
        description: 'Crea un nuevo contrato de arrendamiento',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['propertyId', 'tenantId', 'startDate', 'endDate', 'rentAmount'],
                properties: {
                  propertyId: { type: 'string' },
                  tenantId: { type: 'string' },
                  startDate: { type: 'string', format: 'date', example: '2026-02-01' },
                  endDate: { type: 'string', format: 'date', example: '2027-02-01' },
                  rentAmount: { type: 'number', example: 1200 },
                  deposit: { type: 'number', example: 1200 },
                  paymentDay: { type: 'integer', minimum: 1, maximum: 31, default: 1 },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Contrato creado',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { type: 'object' },
                    message: { type: 'string', example: 'Contract created successfully' },
                  },
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/ValidationError' },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },

    // Payments
    '/api/v1/payments': {
      get: {
        tags: ['Payments'],
        summary: 'Listar pagos',
        description: 'Obtiene lista paginada de pagos',
        parameters: [
          {
            name: 'page',
            in: 'query',
            schema: { type: 'integer', default: 1 },
          },
          {
            name: 'limit',
            in: 'query',
            schema: { type: 'integer', default: 20 },
          },
          {
            name: 'status',
            in: 'query',
            schema: {
              type: 'string',
              enum: ['PENDING', 'PAID', 'OVERDUE', 'CANCELLED'],
            },
          },
          {
            name: 'tenantId',
            in: 'query',
            schema: { type: 'string' },
            description: 'Filtrar por inquilino',
          },
        ],
        responses: {
          '200': {
            description: 'Lista de pagos',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          id: { type: 'string' },
                          tenantId: { type: 'string' },
                          contractId: { type: 'string' },
                          amount: { type: 'number' },
                          dueDate: { type: 'string', format: 'date' },
                          paidAt: { type: 'string', format: 'date-time', nullable: true },
                          status: { type: 'string' },
                          method: { type: 'string', nullable: true },
                        },
                      },
                    },
                    pagination: { $ref: '#/components/schemas/PaginationMeta' },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
      post: {
        tags: ['Payments'],
        summary: 'Registrar pago',
        description: 'Registra un nuevo pago',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['contractId', 'amount', 'dueDate'],
                properties: {
                  contractId: { type: 'string' },
                  amount: { type: 'number', example: 1200 },
                  dueDate: { type: 'string', format: 'date', example: '2026-02-01' },
                  concept: { type: 'string', example: 'Alquiler Febrero 2026' },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Pago registrado',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { type: 'object' },
                    message: { type: 'string', example: 'Payment registered successfully' },
                  },
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/ValidationError' },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },

    // Documents
    '/api/v1/documents': {
      get: {
        tags: ['Documents'],
        summary: 'Listar documentos',
        description: 'Obtiene lista de documentos de la empresa',
        parameters: [
          {
            name: 'page',
            in: 'query',
            schema: { type: 'integer', default: 1 },
          },
          {
            name: 'limit',
            in: 'query',
            schema: { type: 'integer', default: 20 },
          },
          {
            name: 'type',
            in: 'query',
            schema: {
              type: 'string',
              enum: ['CONTRACT', 'INVOICE', 'RECEIPT', 'IDENTITY', 'OTHER'],
            },
          },
          {
            name: 'entityType',
            in: 'query',
            schema: {
              type: 'string',
              enum: ['PROPERTY', 'TENANT', 'CONTRACT', 'PAYMENT'],
            },
            description: 'Tipo de entidad relacionada',
          },
          {
            name: 'entityId',
            in: 'query',
            schema: { type: 'string' },
            description: 'ID de la entidad relacionada',
          },
        ],
        responses: {
          '200': {
            description: 'Lista de documentos',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          id: { type: 'string' },
                          name: { type: 'string' },
                          type: { type: 'string' },
                          url: { type: 'string', format: 'uri' },
                          size: { type: 'integer', description: 'Tamaño en bytes' },
                          mimeType: { type: 'string' },
                          uploadedAt: { type: 'string', format: 'date-time' },
                        },
                      },
                    },
                    pagination: { $ref: '#/components/schemas/PaginationMeta' },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
      post: {
        tags: ['Documents'],
        summary: 'Subir documento',
        description: 'Sube un nuevo documento',
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['file'],
                properties: {
                  file: { type: 'string', format: 'binary' },
                  type: {
                    type: 'string',
                    enum: ['CONTRACT', 'INVOICE', 'RECEIPT', 'IDENTITY', 'OTHER'],
                  },
                  entityType: { type: 'string' },
                  entityId: { type: 'string' },
                  name: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Documento subido exitosamente',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        name: { type: 'string' },
                        url: { type: 'string', format: 'uri' },
                        size: { type: 'integer' },
                      },
                    },
                    message: { type: 'string', example: 'Document uploaded successfully' },
                  },
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/ValidationError' },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },

    // Sandbox
    '/api/v1/sandbox': {
      get: {
        tags: ['Authentication'],
        summary: 'Test de API key',
        description: 'Endpoint de prueba para verificar que tu API key funciona correctamente',
        responses: {
          '200': {
            description: 'API key válida',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'API key is valid' },
                    auth: {
                      type: 'object',
                      properties: {
                        companyId: { type: 'string' },
                        userId: { type: 'string' },
                        scopes: { type: 'array', items: { type: 'string' } },
                      },
                    },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
  },
};

export default swaggerDefinition;
