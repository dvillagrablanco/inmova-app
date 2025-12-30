/**
 * OpenAPI / Swagger Documentation Endpoint
 * Sirve la documentación interactiva de la API
 */

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const swaggerSpec = {
    openapi: '3.0.0',
    info: {
      title: 'Inmova App API',
      version: '1.0.0',
      description: `
# Inmova App - API Documentation

Plataforma PropTech B2B/B2C para gestión inmobiliaria integral.

## Autenticación

Todas las APIs protegidas requieren autenticación mediante JWT token en el header:

\`\`\`
Authorization: Bearer <token>
\`\`\`

## Rate Limiting

- **General**: 500 requests / minuto
- **APIs**: 100 requests / minuto
- **Auth**: 10 requests / 5 minutos

## Roles de Usuario

- \`super_admin\`: Acceso completo
- \`administrador\`: Gestión de empresa
- \`gestor\`: Gestión de propiedades
- \`operador\`: Operaciones básicas
- \`soporte\`: Soporte técnico
`,
      contact: {
        name: 'Inmova Support',
        email: 'support@inmova.app',
        url: 'https://inmova.app'
      },
      license: {
        name: 'Proprietary',
        url: 'https://inmova.app/terms'
      }
    },
    servers: [
      {
        url: 'http://157.180.119.236:3000',
        description: 'Production Server'
      },
      {
        url: 'http://localhost:3000',
        description: 'Development Server'
      }
    ],
    tags: [
      { name: 'Authentication', description: 'Autenticación y autorización' },
      { name: 'Users', description: 'Gestión de usuarios' },
      { name: 'Buildings', description: 'Gestión de edificios' },
      { name: 'Units', description: 'Gestión de unidades/propiedades' },
      { name: 'Tenants', description: 'Gestión de inquilinos' },
      { name: 'Contracts', description: 'Gestión de contratos' },
      { name: 'Payments', description: 'Gestión de pagos' },
      { name: 'Maintenance', description: 'Mantenimiento y reparaciones' },
      { name: 'Documents', description: 'Gestión de documentos' },
      { name: 'Notifications', description: 'Notificaciones' },
      { name: 'AI', description: 'Funcionalidades de IA' },
      { name: 'Analytics', description: 'Analíticas y reportes' }
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token de NextAuth.js'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string', example: 'Error message' },
            code: { type: 'string', example: 'ERROR_CODE' },
            details: { type: 'object' }
          }
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'cuid' },
            email: { type: 'string', format: 'email' },
            name: { type: 'string' },
            role: { 
              type: 'string',
              enum: ['super_admin', 'administrador', 'gestor', 'operador', 'soporte']
            },
            companyId: { type: 'string' },
            activo: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        Building: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            nombre: { type: 'string' },
            direccion: { type: 'string' },
            tipo: { type: 'string', enum: ['residencial', 'comercial', 'mixto'] },
            numeroUnidades: { type: 'integer' },
            ascensor: { type: 'boolean' },
            garaje: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        Unit: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            numero: { type: 'string' },
            buildingId: { type: 'string' },
            tipo: { type: 'string', enum: ['piso', 'local', 'oficina', 'garaje', 'trastero'] },
            estado: { type: 'string', enum: ['disponible', 'ocupado', 'mantenimiento'] },
            superficie: { type: 'number' },
            habitaciones: { type: 'integer' },
            banos: { type: 'integer' },
            rentaMensual: { type: 'number' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        PropertyValuation: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            address: { type: 'string' },
            city: { type: 'string' },
            squareMeters: { type: 'number' },
            rooms: { type: 'integer' },
            bathrooms: { type: 'integer' },
            estimatedValue: { type: 'number', description: 'Precio estimado en €' },
            confidenceScore: { type: 'number', minimum: 0, maximum: 100 },
            minValue: { type: 'number' },
            maxValue: { type: 'number' },
            reasoning: { type: 'string' },
            model: { type: 'string', example: 'claude-3-5-sonnet' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        }
      }
    },
    paths: {
      '/api/users': {
        get: {
          tags: ['Users'],
          summary: 'Listar usuarios',
          description: 'Obtiene lista paginada de usuarios de la empresa',
          security: [{ BearerAuth: [] }],
          parameters: [
            {
              name: 'page',
              in: 'query',
              schema: { type: 'integer', default: 1 },
              description: 'Número de página'
            },
            {
              name: 'limit',
              in: 'query',
              schema: { type: 'integer', default: 20, maximum: 100 },
              description: 'Elementos por página'
            },
            {
              name: 'role',
              in: 'query',
              schema: { type: 'string' },
              description: 'Filtrar por rol'
            }
          ],
          responses: {
            '200': {
              description: 'Lista de usuarios',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      data: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/User' }
                      },
                      pagination: {
                        type: 'object',
                        properties: {
                          page: { type: 'integer' },
                          limit: { type: 'integer' },
                          total: { type: 'integer' },
                          pages: { type: 'integer' }
                        }
                      }
                    }
                  }
                }
              }
            },
            '401': {
              description: 'No autenticado',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          }
        },
        post: {
          tags: ['Users'],
          summary: 'Crear usuario',
          description: 'Crea un nuevo usuario en la empresa',
          security: [{ BearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'name', 'password', 'role'],
                  properties: {
                    email: { type: 'string', format: 'email' },
                    name: { type: 'string', minLength: 2 },
                    password: { type: 'string', minLength: 8 },
                    role: { 
                      type: 'string',
                      enum: ['administrador', 'gestor', 'operador']
                    }
                  }
                }
              }
            }
          },
          responses: {
            '201': {
              description: 'Usuario creado',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      data: { $ref: '#/components/schemas/User' }
                    }
                  }
                }
              }
            },
            '400': {
              description: 'Datos inválidos',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            },
            '401': { description: 'No autenticado' },
            '403': { description: 'Sin permisos' }
          }
        }
      },
      '/api/buildings': {
        get: {
          tags: ['Buildings'],
          summary: 'Listar edificios',
          security: [{ BearerAuth: [] }],
          parameters: [
            {
              name: 'page',
              in: 'query',
              schema: { type: 'integer', default: 1 }
            },
            {
              name: 'limit',
              in: 'query',
              schema: { type: 'integer', default: 20 }
            }
          ],
          responses: {
            '200': {
              description: 'Lista de edificios',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      data: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/Building' }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/api/units': {
        get: {
          tags: ['Units'],
          summary: 'Listar unidades',
          security: [{ BearerAuth: [] }],
          parameters: [
            {
              name: 'buildingId',
              in: 'query',
              schema: { type: 'string' },
              description: 'Filtrar por edificio'
            },
            {
              name: 'estado',
              in: 'query',
              schema: { 
                type: 'string',
                enum: ['disponible', 'ocupado', 'mantenimiento']
              }
            }
          ],
          responses: {
            '200': {
              description: 'Lista de unidades',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      data: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/Unit' }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/api/ai/property-valuation': {
        post: {
          tags: ['AI'],
          summary: 'Valorar propiedad con IA',
          description: 'Utiliza Claude AI para valorar una propiedad',
          security: [{ BearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['address', 'city', 'squareMeters', 'rooms', 'bathrooms'],
                  properties: {
                    address: { type: 'string' },
                    city: { type: 'string' },
                    postalCode: { type: 'string' },
                    squareMeters: { type: 'number', minimum: 10 },
                    rooms: { type: 'integer', minimum: 1 },
                    bathrooms: { type: 'integer', minimum: 1 },
                    condition: {
                      type: 'string',
                      enum: ['NEW', 'GOOD', 'NEEDS_RENOVATION'],
                      default: 'GOOD'
                    },
                    hasElevator: { type: 'boolean' },
                    hasParking: { type: 'boolean' }
                  }
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Valoración completada',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      data: { $ref: '#/components/schemas/PropertyValuation' }
                    }
                  }
                }
              }
            },
            '400': { description: 'Datos inválidos' },
            '401': { description: 'No autenticado' },
            '429': { description: 'Rate limit excedido' }
          }
        }
      },
      '/api/notifications/unread-count': {
        get: {
          tags: ['Notifications'],
          summary: 'Contador de notificaciones no leídas',
          security: [{ BearerAuth: [] }],
          responses: {
            '200': {
              description: 'Contador de notificaciones',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      count: { type: 'integer', example: 5 }
                    }
                  }
                }
              }
            },
            '401': {
              description: 'No autenticado',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      error: { type: 'string', example: 'No autenticado' }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  };

  return NextResponse.json(swaggerSpec);
}
