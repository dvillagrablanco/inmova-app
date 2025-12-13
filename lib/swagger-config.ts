import { createSwaggerSpec } from 'next-swagger-doc';

export const getApiDocs = () => {
  const spec = createSwaggerSpec({
    apiFolder: 'app/api',
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'INMOVA API Documentation',
        version: '2.0.0',
        description:
          'Documentación completa de la API REST de INMOVA - Plataforma de Gestión Inmobiliaria Multi-Vertical',
        contact: {
          name: 'INMOVA Support',
          email: 'support@inmova.com',
        },
        license: {
          name: 'Proprietary',
        },
      },
      servers: [
        {
          url: 'http://localhost:3000',
          description: 'Development server',
        },
        {
          url: 'https://homming-vidaro-6q1wdi.abacusai.app',
          description: 'Production server',
        },
      ],
      components: {
        securitySchemes: {
          BearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
          SessionAuth: {
            type: 'apiKey',
            in: 'cookie',
            name: 'next-auth.session-token',
            description: 'Session authentication using Next-Auth',
          },
        },
        schemas: {
          Building: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              address: { type: 'string' },
              totalUnits: { type: 'integer' },
              occupiedUnits: { type: 'integer' },
              totalFloors: { type: 'integer' },
              yearBuilt: { type: 'integer' },
              buildingType: { type: 'string' },
              status: { type: 'string', enum: ['active', 'inactive'] },
            },
          },
          Unit: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              buildingId: { type: 'string' },
              unitNumber: { type: 'string' },
              floor: { type: 'integer' },
              bedrooms: { type: 'integer' },
              bathrooms: { type: 'number' },
              squareMeters: { type: 'number' },
              monthlyRent: { type: 'number' },
              status: { type: 'string', enum: ['available', 'occupied', 'maintenance'] },
            },
          },
          Tenant: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              fullName: { type: 'string' },
              email: { type: 'string', format: 'email' },
              phone: { type: 'string' },
              dni: { type: 'string' },
              moveInDate: { type: 'string', format: 'date' },
              status: { type: 'string', enum: ['active', 'inactive'] },
            },
          },
          Contract: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              tenantId: { type: 'string' },
              unitId: { type: 'string' },
              startDate: { type: 'string', format: 'date' },
              endDate: { type: 'string', format: 'date' },
              monthlyRent: { type: 'number' },
              deposit: { type: 'number' },
              status: { type: 'string', enum: ['active', 'expired', 'terminated'] },
            },
          },
          Payment: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              contractId: { type: 'string' },
              amount: { type: 'number' },
              dueDate: { type: 'string', format: 'date' },
              paymentDate: { type: 'string', format: 'date' },
              status: { type: 'string', enum: ['pending', 'paid', 'overdue', 'cancelled'] },
              method: { type: 'string' },
              reference: { type: 'string' },
            },
          },
          MaintenanceRequest: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              unitId: { type: 'string' },
              title: { type: 'string' },
              description: { type: 'string' },
              priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'] },
              status: { type: 'string', enum: ['pending', 'in_progress', 'completed', 'cancelled'] },
              assignedTo: { type: 'string' },
              dueDate: { type: 'string', format: 'date' },
            },
          },
          Error: {
            type: 'object',
            properties: {
              error: { type: 'string' },
              message: { type: 'string' },
              details: { type: 'object' },
            },
          },
        },
      },
      security: [{ SessionAuth: [] }],
      tags: [
        { name: 'Auth', description: 'Authentication endpoints' },
        { name: 'Buildings', description: 'Building management' },
        { name: 'Units', description: 'Unit management' },
        { name: 'Tenants', description: 'Tenant management' },
        { name: 'Contracts', description: 'Contract management' },
        { name: 'Payments', description: 'Payment management' },
        { name: 'Maintenance', description: 'Maintenance requests' },
        { name: 'Documents', description: 'Document management' },
        { name: 'Reports', description: 'Reporting and analytics' },
        { name: 'Admin', description: 'Administration endpoints' },
      ],
    },
  });
  return spec;
};
