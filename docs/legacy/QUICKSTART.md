# ⚡ Guía de Inicio Rápido - Inmova App

**Tiempo estimado**: 15 minutos  
**Última actualización**: 30 de Diciembre de 2025

---

## 🚀 Instalación (Primeros 5 minutos)

### Prerrequisitos

- Node.js 18+
- PostgreSQL 14+
- Yarn 1.22+
- Git

### Pasos

```bash
# 1. Clonar repositorio
git clone https://github.com/tu-org/inmova-app.git
cd inmova-app

# 2. Instalar dependencias
yarn install

# 3. Configurar variables de entorno
cp .env.example .env.local

# Editar .env.local con tus credenciales:
# - DATABASE_URL (PostgreSQL)
# - NEXTAUTH_SECRET (generar con: openssl rand -base64 32)
# - ANTHROPIC_API_KEY (para IA)
nano .env.local

# 4. Setup de base de datos
npx prisma generate
npx prisma migrate dev --name initial_setup

# 5. Seed de datos (opcional)
npx prisma db seed

# 6. Iniciar servidor de desarrollo
yarn dev
```

**App disponible en**: http://localhost:3000

---

## 📁 Estructura del Proyecto (Minuto 6-8)

```
inmova-app/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Rutas de autenticación
│   ├── (dashboard)/       # Rutas protegidas (dashboard)
│   ├── api/               # API Routes (547 endpoints)
│   │   ├── valuations/    # Valoración IA (4 endpoints)
│   │   ├── signatures/    # Firma digital (1 endpoint)
│   │   ├── matching/      # Matching inquilinos (2 endpoints)
│   │   └── incidents/     # Incidencias IA (1 endpoint)
│   └── page.tsx           # Landing page
│
├── lib/                   # Servicios y utilidades
│   ├── property-valuation-service.ts    # Valoración IA
│   ├── tenant-matching-service.ts       # Matching automático
│   ├── incident-classification-service.ts # Incidencias IA
│   ├── digital-signature-service.ts     # Firma digital
│   ├── auth-options.ts                  # NextAuth config
│   ├── db.ts                            # Prisma Client
│   └── rate-limiting.ts                 # Rate limiting middleware
│
├── components/            # Componentes React
│   ├── ui/               # Shadcn/ui components
│   └── ...               # Feature components
│
├── prisma/
│   └── schema.prisma     # Modelos de base de datos (6 nuevos)
│
├── scripts/
│   └── apply-rate-limiting.ts  # Script de seguridad automatizado
│
└── docs/
 ├── AUDITORIA_SEGURIDAD_OWASP.md
 ├── FUNCIONALIDAD_VALORACION_IA.md
 ├── RESUMEN_EJECUTIVO_*.md
 └── INDICE_GENERAL_PROYECTO.md
```

---

## 🔑 Funcionalidades Clave (Minuto 9-12)

### 1. Valoración Automática con IA

**Endpoint**: `POST /api/valuations/estimate`

```bash
curl -X POST http://localhost:3000/api/valuations/estimate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "address": "Calle Mayor 123",
    "postalCode": "28013",
    "city": "Madrid",
    "squareMeters": 85,
    "rooms": 3,
    "bathrooms": 2,
    "condition": "GOOD"
  }'
```

**Respuesta**:
```json
{
  "success": true,
  "data": {
    "estimatedValue": 245000,
    "minValue": 230000,
    "maxValue": 260000,
    "confidenceScore": 88,
    "pricePerM2": 2882,
    "reasoning": "Propiedad bien ubicada en zona céntrica..."
  }
}
```

### 2. Matching Inquilino-Propiedad

**Endpoint**: `POST /api/matching/find`

```bash
curl -X POST http://localhost:3000/api/matching/find \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "tenantId": "tenant_xxx",
    "limit": 10,
    "useAI": true
  }'
```

**Respuesta**:
```json
{
  "success": true,
  "data": {
    "matches": [
      {
        "unitId": "unit_123",
        "matchScore": 93,
        "scores": {
          "location": 90,
          "price": 95,
          "features": 85
        },
        "recommendation": "Excelente match...",
        "pros": ["Metro cerca", "Precio ideal"],
        "cons": ["Sin parking"]
      }
    ],
    "totalMatches": 8,
    "avgScore": 87
  }
}
```

### 3. Clasificación de Incidencias

**Endpoint**: `POST /api/incidents/classify`

```bash
curl -X POST http://localhost:3000/api/incidents/classify \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "incidentId": "incident_xxx",
    "title": "Fuga de agua",
    "description": "Agua saliendo del fregadero de cocina"
  }'
```

**Respuesta**:
```json
{
  "success": true,
  "data": {
    "category": "PLUMBING",
    "urgency": "HIGH",
    "estimatedCost": 120,
    "estimatedDuration": 2,
    "providerType": "PLUMBER",
    "immediateActions": ["Cerrar llave de paso", "Colocar cubo"]
  }
}
```

---

## 🔐 Seguridad (Minuto 13-14)

### Rate Limiting

**Aplicar a todos los endpoints**:
```bash
npx tsx scripts/apply-rate-limiting.ts --apply
```

### Límites Configurados

| Tipo | Límite | Ventana |
|------|--------|---------|
| **Auth** | 10 requests | 5 minutos |
| **Payment** | 100 requests | 1 minuto |
| **API General** | 1000 requests | 1 minuto |
| **Read** | 2000 requests | 1 minuto |

### Proteger un Nuevo Endpoint

```typescript
// app/api/mi-endpoint/route.ts
import { withRateLimit } from '@/lib/rate-limiting';

export async function POST(req: NextRequest) {
  return withRateLimit(req, async () => {
    // Tu lógica aquí
    return NextResponse.json({ success: true });
  });
}
```

---

## 🧪 Testing (Minuto 15)

### Tests Unitarios

```bash
yarn test:unit
```

### Tests E2E

```bash
yarn test:e2e
yarn test:e2e:ui  # Con interfaz gráfica
```

### Linting

```bash
yarn lint
yarn lint:fix
```

---

## 📚 Recursos Útiles

### Documentación Completa

1. **Índice General**: `INDICE_GENERAL_PROYECTO.md`
2. **Seguridad**: `AUDITORIA_SEGURIDAD_OWASP.md`
3. **Valoración IA**: `FUNCIONALIDAD_VALORACION_IA.md`
4. **Resúmenes**: `RESUMEN_EJECUTIVO_*.md`
5. **Cursorrules**: `.cursorrules` (arquitectura completa)

### Comandos Frecuentes

```bash
# Desarrollo
yarn dev

# Build
yarn build

# Prisma
npx prisma studio            # UI de base de datos
npx prisma migrate dev       # Nueva migración
npx prisma generate          # Regenerar cliente

# Testing
yarn test:unit
yarn test:e2e

# Linting
yarn lint:fix

# Scripts
npx tsx scripts/apply-rate-limiting.ts --dry-run
```

### Debugging

```bash
# Ver logs en tiempo real
tail -f .logs/*.out

# Ver errores
tail -f .logs/*.err

# Limpiar caché
rm -rf .next
yarn dev
```

---

## 🚨 Troubleshooting

### Error: "Prisma Client not generated"

```bash
npx prisma generate
```

### Error: "Database connection failed"

1. Verificar que PostgreSQL esté corriendo
2. Revisar `DATABASE_URL` en `.env.local`
3. Probar conexión: `psql $DATABASE_URL`

### Error: "Rate limit exceeded"

- Esperar el tiempo indicado en header `Retry-After`
- O aumentar límites en `lib/rate-limiting.ts`

### Error: "ANTHROPIC_API_KEY not found"

1. Obtener API key en https://console.anthropic.com
2. Agregar a `.env.local`: `ANTHROPIC_API_KEY=sk-ant-...`

---

## ⚡ Siguiente Paso

Una vez completada esta guía, revisa:

1. **Arquitectura**: `.cursorrules` (20,000+ palabras)
2. **Índice**: `INDICE_GENERAL_PROYECTO.md`
3. **Features**: `RESUMEN_EJECUTIVO_SESION_2.md`

**¿Listo para desarrollar?** 🚀

---

**Última actualización**: 30 de Diciembre de 2025  
**Versión**: 2.0.0  
**Soporte**: Ver documentación en `/docs`