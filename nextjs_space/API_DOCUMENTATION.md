# Documentación de API - INMOVA

## Acceso a la Documentación

La documentación interactiva de la API está disponible en:
- **Desarrollo**: http://localhost:3000/api-docs
- **Producción**: https://homming-vidaro-6q1wdi.abacusai.app/api-docs

## Características

- ✅ Documentación interactiva con Swagger UI
- ✅ Especificación OpenAPI 3.0
- ✅ Prueba de endpoints directamente desde la interfaz
- ✅ Esquemas de datos completos
- ✅ Ejemplos de request/response
- ✅ Descarga de especificación JSON

## Cómo Documentar Nuevos Endpoints

### 1. Estructura Básica

Añade comentarios JSDoc con anotaciones Swagger en tus archivos de ruta:

```typescript
/**
 * @swagger
 * /api/your-endpoint:
 *   get:
 *     summary: Breve descripción
 *     description: Descripción detallada
 *     tags: [NombreTag]
 *     security:
 *       - SessionAuth: []
 *     parameters:
 *       - in: query
 *         name: paramName
 *         schema:
 *           type: string
 *         description: Descripción del parámetro
 *     responses:
 *       200:
 *         description: Respuesta exitosa
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/YourSchema'
 */
```

### 2. Ejemplo Completo - GET Endpoint

```typescript
/**
 * @swagger
 * /api/tenants:
 *   get:
 *     summary: Get all tenants
 *     description: Retrieve a paginated list of tenants
 *     tags: [Tenants]
 *     security:
 *       - SessionAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive]
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 tenants:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Tenant'
 *       401:
 *         description: Unauthorized
 */

export async function GET(request: Request) {
  // ... implementación
}
```

### 3. Ejemplo Completo - POST Endpoint

```typescript
/**
 * @swagger
 * /api/payments:
 *   post:
 *     summary: Create a payment
 *     description: Record a new payment
 *     tags: [Payments]
 *     security:
 *       - SessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - contractId
 *               - amount
 *               - dueDate
 *             properties:
 *               contractId:
 *                 type: string
 *               amount:
 *                 type: number
 *                 format: float
 *               dueDate:
 *                 type: string
 *                 format: date
 *               method:
 *                 type: string
 *                 enum: [cash, transfer, card]
 *     responses:
 *       201:
 *         description: Payment created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Payment'
 *       400:
 *         description: Bad request
 */

export async function POST(request: Request) {
  // ... implementación
}
```

## Esquemas Disponibles

Los siguientes esquemas están predefinidos en `lib/swagger-config.ts`:

- `Building` - Información de edificios
- `Unit` - Información de unidades
- `Tenant` - Información de inquilinos
- `Contract` - Información de contratos
- `Payment` - Información de pagos
- `MaintenanceRequest` - Solicitudes de mantenimiento
- `Error` - Respuestas de error

## Añadir Nuevos Esquemas

Edita `lib/swagger-config.ts` y añade tu esquema en `components.schemas`:

```typescript
YourNewSchema: {
  type: 'object',
  properties: {
    id: { type: 'string' },
    name: { type: 'string' },
    // ... más propiedades
  },
  required: ['id', 'name']
}
```

## Tags Disponibles

- Auth - Autenticación
- Buildings - Gestión de edificios
- Units - Gestión de unidades
- Tenants - Gestión de inquilinos
- Contracts - Gestión de contratos
- Payments - Gestión de pagos
- Maintenance - Mantenimiento
- Documents - Documentos
- Reports - Reportes
- Admin - Administración

## Autenticación

La API utiliza dos métodos de autenticación:

1. **SessionAuth**: Cookie de sesión de Next-Auth (preferido)
2. **BearerAuth**: JWT Token en header Authorization

## Buenas Prácticas

1. ✅ Documenta TODOS los parámetros
2. ✅ Incluye ejemplos cuando sea posible
3. ✅ Define todos los códigos de respuesta posibles
4. ✅ Usa esquemas reutilizables para objetos complejos
5. ✅ Mantén las descripciones claras y concisas
6. ✅ Actualiza la documentación al cambiar endpoints

## Exportar Especificación

Puedes descargar la especificación OpenAPI JSON:
- Desde la interfaz: Botón "Descargar OpenAPI Spec"
- Directamente: GET `/api/docs`

## Recursos

- [OpenAPI Specification](https://swagger.io/specification/)
- [Swagger UI Documentation](https://swagger.io/tools/swagger-ui/)
- [Next Swagger Doc](https://github.com/jellydn/next-swagger-doc)
