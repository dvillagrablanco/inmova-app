# 🏡 Valoración Automática de Propiedades con IA

## 📋 Descripción

Sistema de **valoración automática de propiedades** inmobiliarias utilizando **Inteligencia Artificial (Anthropic Claude 3.5 Sonnet)**. Esta es una **funcionalidad crítica diferenciadora** según la estrategia de producto PropTech.

### ✅ Estado: **IMPLEMENTADO Y FUNCIONAL**

---

## 🎯 Objetivos de Negocio

1. **Diferenciador competitivo**: Superar a Homming y Rentger
2. **Lead generation B2B**: Atraer agentes inmobiliarios y gestores
3. **Automatización**: Reducir trabajo manual de valoración
4. **Precisión**: Valoraciones basadas en IA + datos del mercado
5. **Monetización**: Potencial para cobrar por valoraciones premium

---

## 🏗️ Arquitectura Técnica

### Stack Tecnológico

- **IA**: Anthropic Claude 3.5 Sonnet (modelo más reciente)
- **Backend**: Next.js 15 API Routes
- **Base de Datos**: PostgreSQL + Prisma ORM
- **Validación**: Zod schemas
- **Seguridad**: Rate limiting, autenticación NextAuth
- **Logging**: Winston + Sentry

### Flujo de Datos

```
Usuario → API /api/valuations/estimate
  ↓
1. Autenticación (NextAuth)
2. Validación (Zod)
3. Obtener datos del mercado (BD interna + APIs externas)
4. Valoración con IA (Claude)
5. Guardar resultado en BD
6. Respuesta al usuario
```

---

## 📊 Modelo de Datos (Prisma)

```prisma
model PropertyValuation {
  id         String   @id @default(cuid())
  companyId  String
  unitId     String?  // Opcional
  
  // Características de la propiedad
  address         String
  postalCode      String
  city            String
  province        String?
  neighborhood    String?
  squareMeters    Float
  rooms           Int
  bathrooms       Int
  floor           Int?
  hasElevator     Boolean
  hasParking      Boolean
  hasGarden       Boolean
  hasPool         Boolean
  hasTerrace      Boolean
  hasGarage       Boolean
  condition       PropertyCondition
  yearBuilt       Int?
  
  // Datos del mercado
  avgPricePerM2   Float?
  marketTrend     MarketTrend?
  comparables     Json?
  
  // Resultado de la valoración
  estimatedValue  Float     // Precio estimado
  confidenceScore Float     // 0-100
  minValue        Float     // Rango mínimo
  maxValue        Float     // Rango máximo
  pricePerM2      Float?
  
  // IA Details
  model           String    // "claude-3-5-sonnet"
  reasoning       String?   // Explicación
  keyFactors      String[]
  
  // ROI & Investment
  estimatedRent   Float?    // Renta mensual
  estimatedROI    Float?    // % anual
  capRate         Float?    // Tasa de capitalización
  
  // Recommendations
  recommendations String[]
  
  // Metadata
  requestedBy     String
  ipAddress       String?
  userAgent       String?
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  @@index([companyId])
  @@index([city])
  @@index([postalCode])
}
```

---

## 🔌 API Endpoints

### 1. POST `/api/valuations/estimate`

Crea una nueva valoración de propiedad usando IA.

**Autenticación**: ✅ Requerida (NextAuth session)  
**Rate Limit**: ✅ 100 requests/min  

**Request Body**:
```json
{
  "address": "Calle Gran Vía 123",
  "postalCode": "28013",
  "city": "Madrid",
  "province": "Madrid",
  "neighborhood": "Centro",
  "squareMeters": 85,
  "rooms": 3,
  "bathrooms": 2,
  "floor": 4,
  "hasElevator": true,
  "hasParking": true,
  "hasGarden": false,
  "hasPool": false,
  "hasTerrace": true,
  "hasGarage": false,
  "condition": "GOOD",
  "yearBuilt": 2010,
  "unitId": "cljk3..." // Opcional
}
```

**Response (201 Created)**:
```json
{
  "success": true,
  "data": {
    "id": "val_xxx",
    "estimatedValue": 285000,
    "confidenceScore": 85,
    "minValue": 265000,
    "maxValue": 305000,
    "pricePerM2": 3353,
    "reasoning": "La propiedad se valora en €285,000 basándose en...",
    "keyFactors": [
      "Ubicación céntrica en Madrid",
      "Estado de conservación bueno",
      "Ascensor y terraza incrementan el valor"
    ],
    "estimatedRent": 1200,
    "estimatedROI": 5.05,
    "capRate": 4.8,
    "recommendations": [
      "Renovar cocina y baños para aumentar valor en 10-15%",
      "Mejorar eficiencia energética (certificado A o B)",
      "Modernizar acabados interiores"
    ],
    "marketData": {
      "avgPricePerM2": 3200,
      "trend": "STABLE",
      "comparables": [...]
    },
    "createdAt": "2025-12-30T10:00:00Z"
  },
  "message": "Valoración completada exitosamente"
}
```

**Errores**:
- `401`: No autenticado
- `400`: Datos inválidos (con detalles de validación)
- `503`: API de IA no configurada (ANTHROPIC_API_KEY missing)
- `500`: Error interno

---

### 2. GET `/api/valuations?unitId=xxx&city=Madrid&page=1&limit=20`

Lista valoraciones con filtros y paginación.

**Autenticación**: ✅ Requerida  
**Rate Limit**: ✅ 1000 requests/min (read endpoint)

**Query Parameters**:
- `unitId` (opcional): Filtrar por unidad específica
- `city` (opcional): Filtrar por ciudad
- `page` (default: 1): Número de página
- `limit` (default: 20, max: 100): Resultados por página

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "val_xxx",
      "address": "...",
      "city": "Madrid",
      "estimatedValue": 285000,
      "confidenceScore": 85,
      "createdAt": "2025-12-30T10:00:00Z",
      "user": {
        "name": "Juan Pérez",
        "email": "juan@inmova.app"
      },
      "unit": {
        "numero": "3A",
        "building": {
          "nombre": "Edificio Centro"
        }
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3,
    "hasMore": true
  }
}
```

---

### 3. GET `/api/valuations/stats`

Obtiene estadísticas agregadas de valoraciones.

**Autenticación**: ✅ Requerida  
**Rate Limit**: ✅ 1000 requests/min

**Response**:
```json
{
  "success": true,
  "data": {
    "totalValuations": 120,
    "avgEstimatedValue": 245000,
    "avgConfidenceScore": 82,
    "topCities": [
      {
        "city": "Madrid",
        "count": 50,
        "avgValue": 285000
      },
      {
        "city": "Barcelona",
        "count": 35,
        "avgValue": 320000
      }
    ]
  }
}
```

---

### 4. GET `/api/valuations/[id]`

Obtiene una valoración específica por ID.

**Autenticación**: ✅ Requerida  
**Rate Limit**: ✅ 1000 requests/min

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "val_xxx",
    "address": "Calle Gran Vía 123",
    "city": "Madrid",
    "postalCode": "28013",
    "squareMeters": 85,
    "rooms": 3,
    "bathrooms": 2,
    "condition": "GOOD",
    "estimatedValue": 285000,
    "confidenceScore": 85,
    "minValue": 265000,
    "maxValue": 305000,
    "pricePerM2": 3353,
    "reasoning": "...",
    "keyFactors": [...],
    "estimatedRent": 1200,
    "estimatedROI": 5.05,
    "capRate": 4.8,
    "recommendations": [...],
    "avgPricePerM2": 3200,
    "marketTrend": "STABLE",
    "comparables": [...],
    "model": "claude-3-5-sonnet-20241022",
    "createdAt": "2025-12-30T10:00:00Z",
    "user": {
      "name": "Juan Pérez",
      "email": "juan@inmova.app"
    },
    "unit": {
      "numero": "3A",
      "tipo": "piso",
      "superficie": 85,
      "habitaciones": 3,
      "building": {
        "nombre": "Edificio Centro",
        "direccion": "Calle Gran Vía 123"
      }
    }
  }
}
```

---

## 🔒 Seguridad

### Implementado

- ✅ **Autenticación**: NextAuth session en todos los endpoints
- ✅ **Rate Limiting**: `withRateLimit` aplicado
- ✅ **Validación**: Zod schemas para inputs
- ✅ **Ownership Check**: Solo se accede a datos de la empresa del usuario
- ✅ **Logging**: Winston + Sentry para auditoría
- ✅ **Error Handling**: Try/catch exhaustivo sin exponer stack traces

### Límites de Rate Limiting

- `/api/valuations/estimate` (POST): 100 requests/min
- `/api/valuations` (GET): 1000 requests/min
- `/api/valuations/stats` (GET): 1000 requests/min
- `/api/valuations/[id]` (GET): 1000 requests/min

---

## 💰 Costos de IA

### Anthropic Claude Pricing

**Modelo**: `claude-3-5-sonnet-20241022`

- **Input**: $0.003 por 1K tokens
- **Output**: $0.015 por 1K tokens

**Estimación por valoración**:
- Input: ~1,500 tokens (prompt + contexto)
- Output: ~1,000 tokens (respuesta JSON)
- **Costo estimado**: $0.02 - $0.03 por valoración

**Escalabilidad**:
- 1,000 valoraciones/mes: ~$25/mes
- 10,000 valoraciones/mes: ~$250/mes

---

## 📈 Casos de Uso

### 1. **Valoración de Propiedad Nueva** (Lead Generation)

```typescript
// Usuario externo quiere valorar su propiedad
// NO tiene unitId, es un lead potencial

POST /api/valuations/estimate
{
  "address": "Calle Mayor 45",
  "city": "Madrid",
  "postalCode": "28013",
  "squareMeters": 90,
  "rooms": 3,
  "bathrooms": 2,
  "condition": "GOOD"
}

// Response incluye:
// - Valoración precisa
// - Recomendaciones para aumentar valor
// - ROI estimado
// → Oportunidad para convertir en cliente
```

### 2. **Valoración de Unidad Existente** (Portfolio Management)

```typescript
// Gestor quiere revalorizar su portfolio

POST /api/valuations/estimate
{
  "unitId": "unit_xxx", // ← Unidad existente
  "address": "Edificio Centro, 3A",
  // ... resto de datos
}

// Response incluye:
// - Valoración actual
// - Comparación con valoración anterior
// - Tendencia del mercado
// → Tomar decisiones sobre venta/alquiler
```

### 3. **Análisis de Inversión** (Investment Decision)

```typescript
// Inversor evaluando compra

POST /api/valuations/estimate
{
  "address": "Oportunidad de inversión",
  "city": "Barcelona",
  // ... datos de la propiedad
}

// Response incluye:
// - Precio de mercado
// - ROI estimado
// - Cap Rate
// - Renta mensual potencial
// → Decidir si invertir o no
```

---

## 🚀 Próximas Mejoras (Roadmap)

### Fase 2 (Q1 2026)

- [ ] **Integración con APIs de mercado**: Idealista API, Fotocasa API
- [ ] **Histórico de valoraciones**: Gráfico de evolución de precios
- [ ] **Comparación automática**: Comparar con propiedades similares vendidas
- [ ] **Alertas de mercado**: Notificar cuando el valor cambie significativamente
- [ ] **Exportar informe PDF**: Generar informe profesional para cliente

### Fase 3 (Q2 2026)

- [ ] **Machine Learning propio**: Entrenar modelo ML con datos reales
- [ ] **Análisis de fotos**: Valoración ajustada según calidad de fotos (IA Computer Vision)
- [ ] **Predicción de precio futuro**: Proyección a 1, 3, 5 años
- [ ] **Análisis de barrio**: Información de seguridad, servicios, transporte
- [ ] **API pública para partners**: Monetizar como servicio B2B

---

## 🧪 Testing

### Tests Unitarios (Vitest)

```bash
yarn test:unit lib/property-valuation-service.test.ts
```

### Tests de Integración (API)

```bash
yarn test:e2e e2e/valuations.spec.ts
```

### Ejemplo de Test

```typescript
describe('Property Valuation API', () => {
  it('should valuate property successfully', async () => {
    const response = await fetch('/api/valuations/estimate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        address: 'Test Street 123',
        city: 'Madrid',
        postalCode: '28013',
        squareMeters: 80,
        rooms: 3,
        bathrooms: 2,
        condition: 'GOOD',
      }),
    });

    expect(response.status).toBe(201);
    
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.estimatedValue).toBeGreaterThan(0);
    expect(data.data.confidenceScore).toBeGreaterThanOrEqual(0);
    expect(data.data.confidenceScore).toBeLessThanOrEqual(100);
  });
});
```

---

## 📝 Notas de Implementación

### Variables de Entorno Requeridas

```env
# Anthropic API Key (REQUERIDO)
ANTHROPIC_API_KEY=sk-ant-api03-xxx

# Database (ya configurado)
DATABASE_URL=postgresql://...

# NextAuth (ya configurado)
NEXTAUTH_SECRET=xxx
NEXTAUTH_URL=https://inmovaapp.com
```

### Migraciones de Prisma

```bash
# Generar migración para el nuevo modelo
npx prisma migrate dev --name add_property_valuation_model

# Aplicar en producción
npx prisma migrate deploy
```

### Deployment Checklist

- [ ] Agregar `ANTHROPIC_API_KEY` en variables de entorno (Vercel/Servidor)
- [ ] Ejecutar migraciones de Prisma
- [ ] Verificar rate limiting está activo
- [ ] Monitorear logs de Sentry para errores
- [ ] Configurar alertas para costos de IA (>$100/mes)

---

## 🎯 KPIs de Éxito

| Métrica | Objetivo Q1 2026 |
|---------|------------------|
| Valoraciones realizadas | 1,000/mes |
| Tasa de conversión (Lead → Cliente) | 15% |
| Tiempo promedio de valoración | < 10 segundos |
| Precisión de valoraciones (vs mercado real) | ±10% |
| Score de confianza promedio | > 80 |
| Costo por valoración | < $0.05 |

---

## 📞 Soporte

**Equipo**: Arquitectura & Desarrollo  
**Contacto**: dev@inmova.app  
**Documentación API**: https://inmovaapp.com/docs/api/valuations  
**Status Page**: https://status.inmova.app

---

**Última actualización**: 30 de Diciembre de 2025  
**Versión**: 1.0.0  
**Estado**: ✅ Producción Ready
