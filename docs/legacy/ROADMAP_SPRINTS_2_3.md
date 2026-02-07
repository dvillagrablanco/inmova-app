# 🗺️ ROADMAP - SPRINTS 2 Y 3

**Actualizado**: 3 de Enero 2026  
**Después de completar**: Sprint 1 (Infraestructura base)

---

## 🎯 SPRINT 2 - FUNCIONALIDADES CRÍTICAS

**Objetivo**: Implementar features diferenciadoras clave  
**Duración**: 1 semana  
**Prioridad**: 🔴 ALTA

### 📋 Tareas

#### 1️⃣ Valoración Automática con IA (CRÍTICO)

**Tiempo estimado**: 2-3 días  
**Diferenciador competitivo**: ⭐⭐⭐⭐⭐

**Descripción**: Sistema de valoración automática de propiedades usando Anthropic Claude.

**Componentes a implementar**:

1. **Schema Prisma**:
```prisma
model PropertyValuation {
  id String @id @default(cuid())
  propertyId String
  property Property @relation(fields: [propertyId], references: [id])
  
  // Input features
  address String
  postalCode String
  city String
  province String
  squareMeters Float
  rooms Int
  bathrooms Int
  floor Int?
  hasElevator Boolean
  hasParking Boolean
  condition PropertyCondition // NEW, GOOD, NEEDS_RENOVATION
  
  // Market data
  avgPricePerM2 Float
  marketTrend String // UP, DOWN, STABLE
  
  // Output
  estimatedValue Float
  confidenceScore Float // 0-100
  minValue Float
  maxValue Float
  comparables Json // Array de propiedades similares
  
  // Metadata
  model String // "claude-3-5-sonnet"
  createdAt DateTime @default(now())
  
  @@index([propertyId])
  @@index([postalCode])
}
```

2. **API Endpoint**: `/api/v1/valuations/estimate`
   - Input: Características de la propiedad
   - Output: Valoración estimada + rango + comparables

3. **Service**: `lib/valuation-service.ts`
   - Integración con Anthropic Claude
   - Búsqueda de comparables en BD
   - Integración con API de mercado (Idealista, Fotocasa)

4. **UI**: Componente de valoración en dashboard
   - Formulario de entrada
   - Resultado visual con gráfico de rango
   - Lista de comparables

**Integración requerida**:
```env
ANTHROPIC_API_KEY=sk-ant-xxx
```

**Costo estimado**: €15-50/mes (según volumen de valoraciones)

**Criterios de éxito**:
- [ ] Endpoint `/api/v1/valuations/estimate` funcionando
- [ ] Precisión ≥70% (comparando con valoraciones reales)
- [ ] Response time <5 segundos
- [ ] UI intuitiva en dashboard
- [ ] Documentado en Swagger

---

#### 2️⃣ Firma Digital de Contratos (CRÍTICO - Legal)

**Tiempo estimado**: 2 días  
**Diferenciador competitivo**: ⭐⭐⭐⭐⭐ (Requerimiento legal)

**Descripción**: Sistema de firma digital de contratos con validez legal (eIDAS UE).

**Componentes a implementar**:

1. **Integración Signaturit** (YA CONFIGURADO):
```typescript
// lib/signaturit-service.ts
import { SignaturitClient } from '@signaturit/signaturit-sdk';

export class SignaturitService {
  static async createSignatureRequest(
    contractId: string,
    signatories: Array<{ email: string; name: string }>
  ) {
    const client = new SignaturitClient(process.env.SIGNATURIT_API_KEY!);
    
    // 1. Generar PDF del contrato
    const pdfBuffer = await generateContractPDF(contractId);
    
    // 2. Crear solicitud de firma
    const signature = await client.createSignature({
      files: [{ 
        name: `contrato-${contractId}.pdf`,
        content: pdfBuffer.toString('base64'),
      }],
      recipients: signatories.map(s => ({
        email: s.email,
        fullname: s.name,
      })),
      subject: 'Firma de contrato de arrendamiento',
      body: 'Por favor, revisa y firma el contrato adjunto.',
    });
    
    return signature;
  }
  
  static async getSignatureStatus(signatureId: string) {
    const client = new SignaturitClient(process.env.SIGNATURIT_API_KEY!);
    return await client.getSignature(signatureId);
  }
  
  static async downloadSignedContract(signatureId: string) {
    const client = new SignaturitClient(process.env.SIGNATURIT_API_KEY!);
    return await client.downloadSignedDocument(signatureId);
  }
}
```

2. **Schema Prisma**:
```prisma
model ContractSignature {
  id String @id @default(cuid())
  contractId String @unique
  contract Contract @relation(fields: [contractId], references: [id])
  
  signatureId String // ID de Signaturit
  status SignatureStatus // PENDING, SIGNED, REJECTED, EXPIRED
  signatories Json // Array de firmantes
  
  signedDocumentUrl String? // URL del documento firmado
  signedAt DateTime?
  expiresAt DateTime
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@index([contractId])
  @@index([status])
}

enum SignatureStatus {
  PENDING
  SIGNED
  REJECTED
  EXPIRED
}
```

3. **API Endpoints**:
   - `POST /api/v1/contracts/{id}/sign` - Crear solicitud de firma
   - `GET /api/v1/contracts/{id}/signature-status` - Estado de firma
   - `GET /api/v1/contracts/{id}/signed-document` - Descargar firmado

4. **Webhook**: `/api/webhooks/signaturit`
   - Recibir notificaciones de firma completada
   - Actualizar estado del contrato
   - Notificar a usuarios

5. **UI**:
   - Botón "Enviar para firma" en detalles de contrato
   - Modal para seleccionar firmantes
   - Estado de firma en tiempo real
   - Descarga de documento firmado

**Costo**:
- Signaturit: €49-149/mes (5-50 firmas/mes)
- O DocuSign: €25-40/usuario/mes

**Criterios de éxito**:
- [ ] Endpoint de firma funcionando
- [ ] Webhook recibiendo eventos
- [ ] PDF del contrato generado correctamente
- [ ] UI intuitiva para firmar
- [ ] Validez legal (eIDAS)
- [ ] Tests E2E del flujo completo

---

#### 3️⃣ Tour Virtual 360° (ALTA)

**Tiempo estimado**: 1 día  
**Diferenciador competitivo**: ⭐⭐⭐⭐

**Descripción**: Integración con Matterport o Kuula para tours virtuales.

**Opciones de integración**:

**Opción A: Matterport** (Profesional)
- Costo: €69/mes por usuario
- Calidad: Excelente (3D real)
- Requiere cámara especial (~€3,000)

**Opción B: Kuula** (Económico)
- Costo: €0-24/mes
- Calidad: Buena (360° desde fotos)
- Compatible con cualquier cámara 360°

**Opción C: Self-Hosted** (Three.js)
- Costo: €0 (desarrollo)
- Calidad: Variable
- Total control

**Recomendación**: Kuula (mejor balance costo/calidad)

**Schema Prisma**:
```prisma
model VirtualTour {
  id String @id @default(cuid())
  propertyId String @unique
  property Property @relation(fields: [propertyId], references: [id])
  
  provider String // "MATTERPORT", "KUULA", "SELF_HOSTED"
  embedUrl String // URL del tour
  coverImage String? // Thumbnail
  
  // Analytics
  views Int @default(0)
  avgTimeSpent Float? // Segundos
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

**Componente React**:
```typescript
// components/VirtualTourViewer.tsx
'use client';

export function VirtualTourViewer({ embedUrl }: { embedUrl: string }) {
  return (
    <div className="relative w-full aspect-video rounded-lg overflow-hidden">
      <iframe
        src={embedUrl}
        width="100%"
        height="100%"
        frameBorder="0"
        allow="vr; xr; accelerometer; magnetometer; gyroscope; autoplay"
        allowFullScreen
      />
    </div>
  );
}
```

**Criterios de éxito**:
- [ ] Integración con Kuula/Matterport
- [ ] Viewer embebido en fichas de propiedades
- [ ] Analytics de visualización
- [ ] UI responsive (mobile)

---

### 📊 Métricas Sprint 2

**Objetivos**:
- 3 features críticas implementadas
- Todos los tests pasando
- Documentación API actualizada
- Deployment sin issues

**KPIs**:
- Valoraciones IA: ≥70% precisión
- Firmas digitales: ≥95% éxito
- Tours virtuales: ≥50% engagement

---

## 🎯 SPRINT 3 - OPTIMIZACIÓN Y FEATURES AVANZADAS

**Objetivo**: Completar diferenciadores y optimizar  
**Duración**: 1 semana  
**Prioridad**: 🟡 MEDIA

### 📋 Tareas

#### 1️⃣ Matching Automático Inquilino-Propiedad

**Tiempo estimado**: 2 días

**Algoritmo ML**:
```typescript
export async function findBestMatches(tenantProfile: TenantProfile) {
  // 1. Filtros obligatorios
  const baseFilter = {
    status: 'AVAILABLE',
    price: { gte: tenantProfile.minBudget, lte: tenantProfile.maxBudget },
    city: { in: tenantProfile.preferredCities },
  };
  
  const properties = await prisma.property.findMany({ where: baseFilter });
  
  // 2. Scoring (0-100)
  const scored = properties.map(property => {
    let score = 0;
    
    // Ubicación (30%)
    if (property.hasMetro && tenantProfile.needsPublicTransport) score += 30;
    
    // Características (25%)
    if (property.hasParking && tenantProfile.hasCar) score += 15;
    if (property.petsAllowed && tenantProfile.hasPets) score += 10;
    
    // Precio (20%)
    const priceFit = 1 - Math.abs(property.price - tenantProfile.idealBudget) / tenantProfile.idealBudget;
    score += priceFit * 20;
    
    // Tamaño (15%)
    if (property.rooms >= tenantProfile.minRooms) score += 15;
    
    // Antigüedad (10%)
    if (property.yearBuilt >= 2010 && tenantProfile.prefersModern) score += 10;
    
    return { property, score };
  });
  
  // 3. Top 10
  return scored.sort((a, b) => b.score - a.score).slice(0, 10);
}
```

**Criterios de éxito**:
- [ ] Algoritmo implementado
- [ ] API `/api/v1/matching/find`
- [ ] UI con resultados ordenados por score
- [ ] Feedback loop (mejora con uso)

---

#### 2️⃣ Gestión de Incidencias con IA

**Tiempo estimado**: 2 días

**Clasificación automática**:
```typescript
export async function classifyIncident(description: string, photos?: string[]) {
  const prompt = `Clasifica esta incidencia de mantenimiento:

Descripción: ${description}
Fotos: ${photos?.length || 0} adjuntas

Clasifica en JSON:
{
  "category": "PLUMBING" | "ELECTRICAL" | "HVAC" | "STRUCTURAL" | "OTHER",
  "urgency": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  "estimatedCost": number,
  "providerType": "PLUMBER" | "ELECTRICIAN" | "HVAC_TECH" | "CONTRACTOR",
  "actionRequired": "string",
  "timeEstimate": "string"
}`;

  const result = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 512,
    messages: [{ role: 'user', content: prompt }],
  });
  
  return JSON.parse(result.content[0].text);
}
```

**Criterios de éxito**:
- [ ] Clasificación automática ≥85% precisión
- [ ] Asignación de proveedor sugerida
- [ ] Estimación de coste y tiempo
- [ ] Workflow de aprobación

---

#### 3️⃣ Automatización de Marketing (Social Media)

**Tiempo estimado**: 2 días

**Publicación automática en redes**:
- Instagram
- Facebook
- LinkedIn

**Features**:
- Generación automática de imágenes de marketing (Canvas)
- Copy optimizado para cada red (IA)
- Programación de posts
- Analytics de engagement

**Criterios de éxito**:
- [ ] Publicación en 3 redes sociales
- [ ] Generación automática de copy
- [ ] Imágenes con overlay de precio/ubicación
- [ ] Métricas de engagement

---

#### 4️⃣ Optimización de Performance

**Tiempo estimado**: 1 día

**Áreas de mejora**:

1. **Bundle Size**:
   - Lazy loading de componentes pesados
   - Code splitting por rutas
   - Tree shaking optimizado
   - Objetivo: <1MB first load

2. **Database**:
   - Índices en queries frecuentes
   - Prisma query optimization
   - Connection pooling
   - Objetivo: <200ms avg query

3. **Caching**:
   - Redis para sesiones
   - Static assets caching (1 año)
   - API response caching (5 min)
   - Objetivo: <100ms cache hit

4. **Images**:
   - Next.js Image optimization
   - WebP format
   - Lazy loading
   - Objetivo: <100KB por imagen

**Criterios de éxito**:
- [ ] Lighthouse Score ≥90
- [ ] First Contentful Paint <1.5s
- [ ] Time to Interactive <3s
- [ ] Bundle size <1MB

---

### 📊 Métricas Sprint 3

**Objetivos**:
- 4 features avanzadas implementadas
- Performance optimizado
- Cobertura de tests ≥85%
- Documentación completa

---

## 🎯 POST-SPRINT 3 - LANZAMIENTO BETA

**Objetivo**: Preparar para usuarios reales

### Checklist de Lanzamiento

#### Técnico
- [ ] Todos los tests pasando (Unit, Integration, E2E)
- [ ] Lighthouse Score ≥90
- [ ] Security audit completado (OWASP Top 10)
- [ ] Performance benchmarks cumplidos
- [ ] Monitoring configurado (Sentry, Analytics)
- [ ] Backups automáticos activos

#### Funcional
- [ ] 10 features críticas implementadas
- [ ] 0 bugs críticos
- [ ] <5 bugs menores
- [ ] Documentación API completa
- [ ] Guías de usuario creadas

#### Legal/Compliance
- [ ] GDPR compliance verificado
- [ ] Términos de servicio publicados
- [ ] Política de privacidad publicada
- [ ] Firma digital con validez legal (eIDAS)

#### Marketing
- [ ] Landing page optimizada
- [ ] Demo video grabado
- [ ] Casos de uso documentados
- [ ] Pricing definido
- [ ] Social media accounts creados

---

## 💰 INVERSIÓN ESTIMADA

### Desarrollo (Sprints 2-3)
- **Sprint 2**: 40-60 horas × €50/h = €2,000-3,000
- **Sprint 3**: 40-60 horas × €50/h = €2,000-3,000
- **Total desarrollo**: €4,000-6,000

### Integraciones (Mensual)
- Signaturit/DocuSign: €49-149/mes
- Anthropic Claude: €15-50/mes
- Kuula (Tours 360): €24/mes
- Twilio SMS: €0.08/SMS
- **Total integraciones**: €90-230/mes

### Infraestructura (Mensual)
- VPS Hetzner: €20/mes
- AWS S3: €10/mes
- Stripe: €0 + comisiones
- **Total infra**: €30/mes

**TOTAL INVERSIÓN**: 
- Upfront: €4,000-6,000
- Mensual: €120-260/mes

---

## 📈 ROADMAP TIMELINE

```
┌─────────────────────────────────────────────────────────┐
│                    ROADMAP VISUAL                       │
└─────────────────────────────────────────────────────────┘

Enero 2026
┌─────────────────────────────────────────────────────────┐
│ Semana 1: Sprint 1 ✅                                   │
│   - Fix infraestructura                                 │
│   - Verificar integraciones                             │
│   - Documentar APIs                                     │
├─────────────────────────────────────────────────────────┤
│ Semana 2: Sprint 2 (Parte 1) 🟡                        │
│   - Valoración IA                                       │
│   - Firma Digital                                       │
├─────────────────────────────────────────────────────────┤
│ Semana 3: Sprint 2 (Parte 2) + Sprint 3 (Parte 1) 🟡  │
│   - Tour Virtual 360°                                   │
│   - Matching inquilino-propiedad                        │
├─────────────────────────────────────────────────────────┤
│ Semana 4: Sprint 3 (Parte 2) + Testing 🟡             │
│   - Gestión incidencias IA                              │
│   - Automatización marketing                            │
│   - Optimización performance                            │
└─────────────────────────────────────────────────────────┘

Febrero 2026
┌─────────────────────────────────────────────────────────┐
│ Semana 1: Beta Testing 🔵                              │
│   - 10 usuarios beta                                    │
│   - Bug fixing                                          │
│   - Feedback loop                                       │
├─────────────────────────────────────────────────────────┤
│ Semana 2: Pre-Launch 🟢                                │
│   - Marketing materials                                 │
│   - Landing page final                                  │
│   - Onboarding optimizado                               │
├─────────────────────────────────────────────────────────┤
│ Semana 3: LANZAMIENTO PÚBLICO 🚀                       │
│   - Primeros 100 usuarios                               │
│   - Soporte activo                                      │
│   - Monitoreo 24/7                                      │
└─────────────────────────────────────────────────────────┘
```

---

## 🎯 OBJETIVOS DE NEGOCIO

### Corto Plazo (3 meses)
- 100 usuarios activos
- 500 propiedades gestionadas
- €5,000 MRR (Monthly Recurring Revenue)
- 10 partners inmobiliarios

### Medio Plazo (6 meses)
- 500 usuarios activos
- 2,000 propiedades gestionadas
- €20,000 MRR
- 50 partners inmobiliarios

### Largo Plazo (12 meses)
- 2,000 usuarios activos
- 10,000 propiedades gestionadas
- €80,000 MRR
- 200 partners inmobiliarios

---

**Última actualización**: 3 de Enero 2026  
**Próximo review**: 10 de Enero 2026 (después Sprint 2)  
**Responsable**: Cursor Agent + Usuario (Product Owner)
