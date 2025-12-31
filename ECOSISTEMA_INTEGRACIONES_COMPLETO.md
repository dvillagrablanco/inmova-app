# 🔌 ECOSISTEMA DE INTEGRACIONES INMOVA - PLAN COMPLETO

**Fecha**: 31 de Diciembre de 2025  
**Objetivo**: Hacer que Inmova sea la plataforma PropTech más fácil de integrar del mercado

---

## 📊 Estado Actual - Auditoría de Integraciones

### ✅ Integraciones YA Implementadas (23 proveedores)

#### 💳 **Pagos & Banking** (6)

- ✅ Stripe (tarjetas, suscripciones)
- ✅ PayPal (pagos P2P)
- ✅ Redsys (TPV español, 3D Secure)
- ✅ Bizum (pagos instantáneos)
- ✅ GoCardless (domiciliaciones SEPA, BACS, ACH)
- ✅ Bankinter Open Banking (API PSD2)

#### 📱 **Comunicación** (2)

- ✅ Twilio (SMS, WhatsApp Business API)
- ✅ SendGrid (email transaccional)

#### 🏨 **Channel Managers Turísticos** (4)

- ✅ Airbnb (sincronización reservas)
- ✅ Booking.com (conectividad XML)
- ✅ Expedia (EPS API)
- ✅ VRBO / HomeAway (Expedia Group)

#### 📊 **Contabilidad & ERP** (8)

- ✅ ContaSimple (autónomos)
- ✅ Holded (ERP cloud)
- ✅ QuickBooks (Intuit)
- ✅ Xero (UK, AU, NZ)
- ✅ Sage (ERP enterprise)
- ✅ A3 (software gestión)
- ✅ Alegra (contabilidad LatAm)
- ✅ Zucchetti (HR & ERP)

#### ✍️ **Firma Digital** (1)

- ✅ DocuSign (firma electrónica eIDAS)

#### 📢 **Redes Sociales** (2)

- ✅ Pomelli (multi-canal social media)
- ✅ Facebook Business (páginas)

#### ☁️ **Storage** (1)

- ✅ AWS S3 (almacenamiento documentos)

#### 🤖 **IA** (1)

- ✅ Anthropic Claude (asistente IA)

#### 🔔 **Webhooks** (1)

- ✅ Sistema de webhooks outgoing (eventos a URLs externas)

---

## 🚨 GAPS CRÍTICOS - Lo que FALTA

### 1. 🤖 **No-Code Automation** (CRÍTICO)

**Problema**: Los clientes usan Zapier, Make, n8n para automatizar flujos entre herramientas.

**Solución**: Integraciones nativas con plataformas no-code.

| Plataforma         | Prioridad | Estado   | Impacto                               |
| ------------------ | --------- | -------- | ------------------------------------- |
| **Zapier**         | 🔴 ALTA   | ❌ FALTA | 7M+ usuarios, 7K+ apps                |
| **Make** (Int.)    | 🔴 ALTA   | ❌ FALTA | 500K+ usuarios, automatización visual |
| **n8n**            | 🟡 MEDIA  | ❌ FALTA | Open source, self-hosted              |
| **Power Automate** | 🟡 MEDIA  | ❌ FALTA | Ecosistema Microsoft 365              |
| **IFTTT**          | 🟢 BAJA   | ❌ FALTA | Consumer market                       |

### 2. 🌐 **API REST Pública** (CRÍTICO)

**Problema**: Los desarrolladores externos NO pueden integrar Inmova en sus apps.

**Solución**:

```typescript
// API REST completa con documentación OpenAPI 3.0
GET /api/v1/properties
POST /api/v1/properties
GET /api/v1/tenants
POST /api/v1/payments
GET /api/v1/contracts
...

// Con autenticación por API Key o OAuth 2.0
Authorization: Bearer sk_live_xxxxx
```

**Features requeridas**:

- ✅ API Keys por empresa
- ✅ Rate limiting (1000 req/min por defecto)
- ✅ Webhooks bidireccionales (incoming + outgoing)
- ✅ Sandbox environment (datos de prueba)
- ✅ Logs de requests (últimos 30 días)
- ✅ SDKs en JavaScript, Python, PHP
- ✅ Documentación interactiva (Swagger UI)

### 3. 🔐 **OAuth 2.0 Provider** (CRÍTICO)

**Problema**: Las integraciones actuales requieren compartir credenciales.

**Solución**: Inmova como OAuth 2.0 Provider.

```
// Flujo OAuth 2.0
1. Usuario hace click "Conectar con Inmova" en app externa
2. Redirige a https://inmovaapp.com/oauth/authorize
3. Usuario aprueba permisos (scopes)
4. App recibe access token
5. Usa token para llamar API sin compartir password
```

**Scopes necesarios**:

- `properties:read` - Leer propiedades
- `properties:write` - Crear/modificar propiedades
- `tenants:read` - Leer inquilinos
- `contracts:read` - Leer contratos
- `payments:read` - Leer pagos
- `payments:write` - Crear pagos
- `documents:read` - Leer documentos
- `admin:*` - Acceso completo (solo admin)

### 4. 📚 **Developer Portal** (CRÍTICO)

**Problema**: No hay documentación pública para desarrolladores.

**Solución**: Portal en `https://developers.inmovaapp.com`

**Secciones**:

- 📖 **Guías**: Quick Start, Authentication, Best Practices
- 📘 **API Reference**: Endpoints, request/response examples
- 🧪 **Sandbox**: Environment de prueba con datos ficticios
- 🔑 **API Keys**: Gestión de tokens
- 📊 **Analytics**: Uso de API, rate limits
- 💬 **Community**: Foro, Discord
- 📦 **SDKs**: Descargar librerías

### 5. 🛒 **Marketplace de Integraciones** (ALTA PRIORIDAD)

**Problema**: Las 23 integraciones actuales están ocultas en el código.

**Solución**: UI visual en `/dashboard/integrations`

**Features**:

- ✅ Catálogo visual con logos y descripciones
- ✅ Activar integración con 1-click
- ✅ Wizard de configuración paso a paso
- ✅ Test de conexión automático
- ✅ Status: Activo / Inactivo / Error
- ✅ Logs de sincronización
- ✅ Botón "Desconectar"

**Mockup**:

```
╔═══════════════════════════════════════════════════╗
║ 🔌 Integraciones                                  ║
╠═══════════════════════════════════════════════════╣
║ [Buscar: _____]  [Filtrar: Todas ▼]              ║
║                                                   ║
║ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ║
║ │ [Logo]      │ │ [Logo]      │ │ [Logo]      │ ║
║ │ Stripe      │ │ QuickBooks  │ │ Zapier      │ ║
║ │ Pagos       │ │ Contabilidad│ │ Automation  │ ║
║ │ ✅ ACTIVO   │ │ ⚙️ Config   │ │ ❌ INACTIVO │ ║
║ │ [Configurar]│ │ [Test ✓]    │ │ [Activar]   │ ║
║ └─────────────┘ └─────────────┘ └─────────────┘ ║
╚═══════════════════════════════════════════════════╝
```

### 6. 📦 **SDKs en Múltiples Lenguajes** (ALTA PRIORIDAD)

**Problema**: Solo hay código interno en TypeScript.

**Solución**: Librerías oficiales publicadas en NPM, PyPI, Packagist.

#### **JavaScript/TypeScript SDK**

```typescript
// npm install @inmova/sdk
import { InmovaClient } from '@inmova/sdk';

const inmova = new InmovaClient({
  apiKey: 'sk_live_xxxxx',
  environment: 'production', // o 'sandbox'
});

// CRUD Propiedades
const properties = await inmova.properties.list({ city: 'Madrid' });
const property = await inmova.properties.create({
  address: 'Calle Mayor 1',
  price: 1200,
  rooms: 3,
});

// Webhooks
const webhook = await inmova.webhooks.create({
  url: 'https://myapp.com/webhook',
  events: ['payment.created', 'tenant.created'],
});
```

#### **Python SDK**

```python
# pip install inmova
from inmova import InmovaClient

inmova = InmovaClient(api_key='sk_live_xxxxx')

# CRUD Propiedades
properties = inmova.properties.list(city='Madrid')
property = inmova.properties.create(
    address='Calle Mayor 1',
    price=1200,
    rooms=3
)

# Webhooks
webhook = inmova.webhooks.create(
    url='https://myapp.com/webhook',
    events=['payment.created', 'tenant.created']
)
```

#### **PHP SDK**

```php
// composer require inmova/sdk
use Inmova\InmovaClient;

$inmova = new InmovaClient([
    'api_key' => 'sk_live_xxxxx',
    'environment' => 'production'
]);

// CRUD Propiedades
$properties = $inmova->properties->list(['city' => 'Madrid']);
$property = $inmova->properties->create([
    'address' => 'Calle Mayor 1',
    'price' => 1200,
    'rooms' => 3
]);
```

### 7. 📧 **Integraciones Adicionales CRÍTICAS**

| Categoría         | Integración           | Prioridad | Uso                          |
| ----------------- | --------------------- | --------- | ---------------------------- |
| **Comunicación**  | Slack                 | 🔴 ALTA   | Notificaciones equipo        |
| **Comunicación**  | Microsoft Teams       | 🟡 MEDIA  | Notificaciones empresas      |
| **Comunicación**  | Telegram Bot          | 🟡 MEDIA  | Bot para inquilinos          |
| **Productividad** | Google Workspace      | 🔴 ALTA   | Calendar, Drive, Gmail       |
| **Productividad** | Microsoft 365         | 🟡 MEDIA  | Outlook, OneDrive, Teams     |
| **CRM**           | HubSpot               | 🟡 MEDIA  | CRM empresas medianas        |
| **CRM**           | Salesforce            | 🟢 BAJA   | CRM enterprise               |
| **Marketing**     | Mailchimp             | 🟡 MEDIA  | Email marketing              |
| **Marketing**     | Active Campaign       | 🟢 BAJA   | Marketing automation         |
| **Analytics**     | Google Analytics 4    | 🔴 ALTA   | Tracking web                 |
| **Analytics**     | Meta Pixel (Facebook) | 🔴 ALTA   | Tracking ads                 |
| **Analytics**     | Hotjar                | 🟢 BAJA   | Heatmaps, recordings         |
| **Firma**         | Signaturit            | 🟡 MEDIA  | Alternativa DocuSign (eIDAS) |
| **Firma**         | Adobe Sign            | 🟢 BAJA   | Enterprise                   |
| **Maps**          | Google Maps API       | 🔴 ALTA   | Geocoding, direcciones       |
| **Maps**          | Mapbox                | 🟡 MEDIA  | Mapas interactivos           |
| **IA**            | OpenAI GPT-4          | 🟡 MEDIA  | Alternativa a Claude         |
| **Voice**         | Google Cloud Speech   | 🟢 BAJA   | Transcripción llamadas       |
| **Translation**   | DeepL API             | 🟢 BAJA   | Traducción automática        |

---

## 🎯 PLAN DE IMPLEMENTACIÓN (Priorizado)

### **FASE 1: Fundamentos (Semanas 1-4)** 🔴 CRÍTICO

#### 1.1. API REST Pública v1 (Semana 1-2)

**Archivos a crear**:

```
/workspace/app/api/v1/
  ├── properties/
  │   ├── route.ts           # GET /api/v1/properties
  │   └── [id]/route.ts      # GET/PUT/DELETE /api/v1/properties/:id
  ├── tenants/
  │   ├── route.ts
  │   └── [id]/route.ts
  ├── contracts/
  ├── payments/
  ├── documents/
  └── webhooks/

/workspace/lib/api-v1/
  ├── auth.ts               # API Key + OAuth validation
  ├── rate-limiter.ts       # 1000 req/min
  ├── middleware.ts         # CORS, auth, logging
  └── errors.ts             # Error responses estandarizados
```

**Endpoints mínimos viables**:

```typescript
// Properties
GET    /api/v1/properties
POST   /api/v1/properties
GET    /api/v1/properties/:id
PUT    /api/v1/properties/:id
DELETE /api/v1/properties/:id

// Tenants
GET    /api/v1/tenants
POST   /api/v1/tenants
GET    /api/v1/tenants/:id
PUT    /api/v1/tenants/:id

// Contracts
GET    /api/v1/contracts
POST   /api/v1/contracts
GET    /api/v1/contracts/:id

// Payments
GET    /api/v1/payments
POST   /api/v1/payments
GET    /api/v1/payments/:id

// Webhooks
GET    /api/v1/webhooks
POST   /api/v1/webhooks        # Registrar webhook
DELETE /api/v1/webhooks/:id

// Auth
POST   /api/v1/auth/api-keys   # Generar API key
GET    /api/v1/auth/verify     # Verificar API key
```

**Autenticación con API Keys**:

```typescript
// /workspace/lib/api-v1/auth.ts
export async function validateApiKey(apiKey: string): Promise<{
  valid: boolean;
  companyId?: string;
  scopes?: string[];
}> {
  // Buscar en BD
  const key = await prisma.apiKey.findUnique({
    where: { key: apiKey, active: true },
    include: { company: true },
  });

  if (!key) return { valid: false };

  // Rate limiting check
  const rateLimitOk = await checkRateLimit(key.companyId);
  if (!rateLimitOk) throw new Error('Rate limit exceeded');

  return {
    valid: true,
    companyId: key.companyId,
    scopes: key.scopes,
  };
}
```

**Rate Limiting**:

```typescript
// /workspace/lib/api-v1/rate-limiter.ts
import { Ratelimit } from '@upstash/ratelimit';
import { redis } from '@/lib/redis';

export const apiRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(1000, '1 m'), // 1000 req/min
  prefix: 'api:v1',
});

export async function checkApiRateLimit(
  companyId: string
): Promise<{ success: boolean; remaining: number }> {
  const { success, limit, remaining } = await apiRateLimiter.limit(companyId);

  return { success, remaining };
}
```

#### 1.2. Marketplace de Integraciones UI (Semana 2-3)

**Página nueva**:

```typescript
// /workspace/app/dashboard/integrations/page.tsx
'use client';

import { IntegrationManager, INTEGRATION_PROVIDERS } from '@/lib/integration-manager';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Search,
  CheckCircle2,
  AlertCircle,
  Settings
} from 'lucide-react';

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');

  useEffect(() => {
    loadIntegrations();
  }, []);

  async function loadIntegrations() {
    const data = await fetch('/api/integrations').then(r => r.json());
    setIntegrations(data);
  }

  const filteredProviders = INTEGRATION_PROVIDERS.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
                          p.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === 'all' || p.category === category;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-2">🔌 Integraciones</h1>
      <p className="text-gray-600 mb-6">
        Conecta Inmova con tus herramientas favoritas
      </p>

      {/* Buscador y filtros */}
      <div className="flex gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          <Input
            placeholder="Buscar integraciones..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="px-4 py-2 border rounded-lg"
        >
          <option value="all">Todas las categorías</option>
          <option value="payment">Pagos</option>
          <option value="communication">Comunicación</option>
          <option value="accounting">Contabilidad</option>
          <option value="channel_manager">Channel Managers</option>
          <option value="signature">Firma Digital</option>
        </select>
      </div>

      {/* Grid de integraciones */}
      <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredProviders.map(provider => {
          const config = integrations.find(i => i.provider === provider.id);
          const isConfigured = config?.isConfigured;
          const isEnabled = config?.enabled;

          return (
            <Card key={provider.id} className="p-6 hover:shadow-lg transition-shadow">
              {/* Logo */}
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                  {provider.logo ? (
                    <img src={provider.logo} alt={provider.name} className="w-10 h-10" />
                  ) : (
                    <Settings className="h-6 w-6 text-gray-400" />
                  )}
                </div>
                {provider.status === 'beta' && (
                  <Badge variant="outline">BETA</Badge>
                )}
              </div>

              {/* Nombre y descripción */}
              <h3 className="font-bold text-lg mb-2">{provider.name}</h3>
              <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                {provider.description}
              </p>

              {/* Estado */}
              <div className="flex items-center gap-2 mb-4">
                {isEnabled ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-green-600 font-medium">Activo</span>
                  </>
                ) : isConfigured ? (
                  <>
                    <AlertCircle className="h-4 w-4 text-orange-500" />
                    <span className="text-sm text-orange-600 font-medium">Inactivo</span>
                  </>
                ) : (
                  <span className="text-sm text-gray-500">No configurado</span>
                )}
              </div>

              {/* Acciones */}
              {isConfigured ? (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => openConfigDialog(provider.id)}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Configurar
                </Button>
              ) : (
                <Button
                  className="w-full"
                  onClick={() => openSetupWizard(provider.id)}
                >
                  Activar
                </Button>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
```

#### 1.3. OAuth 2.0 Provider (Semana 3-4)

**Implementar flujo OAuth 2.0**:

```typescript
// /workspace/app/oauth/authorize/page.tsx
export default async function OAuthAuthorizePage({
  searchParams,
}: {
  searchParams: {
    client_id: string;
    redirect_uri: string;
    scope: string;
    state: string;
  };
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return redirect('/login?callbackUrl=/oauth/authorize');
  }

  const { client_id, redirect_uri, scope, state } = searchParams;

  // Validar client_id
  const oauthApp = await prisma.oAuthApp.findUnique({
    where: { clientId: client_id },
  });

  if (!oauthApp) {
    return <div>Invalid client_id</div>;
  }

  // Mostrar pantalla de consentimiento
  return (
    <div className="max-w-md mx-auto mt-20 p-8 border rounded-lg">
      <h1 className="text-2xl font-bold mb-4">Autorizar Acceso</h1>
      <p className="mb-4">
        <strong>{oauthApp.name}</strong> solicita acceso a tu cuenta de Inmova:
      </p>

      <ul className="mb-6 space-y-2">
        {scope.split(' ').map(s => (
          <li key={s} className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <span>{getScopeDescription(s)}</span>
          </li>
        ))}
      </ul>

      <form action="/api/oauth/authorize" method="POST">
        <input type="hidden" name="client_id" value={client_id} />
        <input type="hidden" name="redirect_uri" value={redirect_uri} />
        <input type="hidden" name="scope" value={scope} />
        <input type="hidden" name="state" value={state} />

        <div className="flex gap-4">
          <Button type="submit" name="action" value="allow" className="flex-1">
            Permitir
          </Button>
          <Button type="submit" name="action" value="deny" variant="outline" className="flex-1">
            Denegar
          </Button>
        </div>
      </form>
    </div>
  );
}
```

```typescript
// /workspace/app/api/oauth/token/route.ts
export async function POST(req: Request) {
  const { grant_type, code, client_id, client_secret, redirect_uri } = await req.json();

  if (grant_type !== 'authorization_code') {
    return NextResponse.json({ error: 'unsupported_grant_type' }, { status: 400 });
  }

  // Validar código de autorización
  const authCode = await prisma.oAuthAuthorizationCode.findUnique({
    where: { code, used: false },
    include: { app: true },
  });

  if (!authCode || authCode.expiresAt < new Date()) {
    return NextResponse.json({ error: 'invalid_grant' }, { status: 400 });
  }

  // Validar client_id y secret
  if (authCode.app.clientId !== client_id || authCode.app.clientSecret !== client_secret) {
    return NextResponse.json({ error: 'invalid_client' }, { status: 401 });
  }

  // Generar access token y refresh token
  const accessToken = generateToken();
  const refreshToken = generateToken();

  await prisma.oAuthAccessToken.create({
    data: {
      token: accessToken,
      appId: authCode.appId,
      companyId: authCode.companyId,
      userId: authCode.userId,
      scopes: authCode.scopes,
      expiresAt: new Date(Date.now() + 3600 * 1000), // 1 hora
    },
  });

  // Marcar código como usado
  await prisma.oAuthAuthorizationCode.update({
    where: { id: authCode.id },
    data: { used: true },
  });

  return NextResponse.json({
    access_token: accessToken,
    token_type: 'Bearer',
    expires_in: 3600,
    refresh_token: refreshToken,
    scope: authCode.scopes,
  });
}
```

### **FASE 2: Integraciones No-Code (Semanas 5-8)** 🔴 CRÍTICO

#### 2.1. Zapier Integration (Semana 5-6)

**Crear app en Zapier Platform**:

1. Registrar app en https://zapier.com/developer
2. Definir **Triggers** (eventos que Inmova envía):
   - New Property Created
   - New Tenant Created
   - Payment Received
   - Contract Signed
   - Maintenance Request Created

3. Definir **Actions** (acciones que Zapier puede hacer en Inmova):
   - Create Property
   - Create Tenant
   - Create Payment
   - Send Notification

4. Definir **Searches**:
   - Find Property by Address
   - Find Tenant by Email

**Ejemplo de trigger en Zapier**:

```javascript
// triggers/new_property.js
module.exports = {
  key: 'new_property',
  noun: 'Property',
  display: {
    label: 'New Property',
    description: 'Triggers when a new property is created.',
  },
  operation: {
    type: 'polling',
    perform: async (z, bundle) => {
      const response = await z.request({
        url: 'https://api.inmovaapp.com/v1/properties',
        params: {
          created_after: bundle.meta.page ? bundle.meta.page : new Date().toISOString(),
        },
      });
      return response.data;
    },
  },
};
```

#### 2.2. Make (Integromat) Integration (Semana 7)

**Crear módulos en Make**:

1. **Triggers**:
   - Watch Properties
   - Watch Tenants
   - Watch Payments

2. **Actions**:
   - Create Property
   - Update Property
   - Create Tenant
   - Create Payment

3. **Searches**:
   - Get Property
   - Get Tenant

**Documentación Make**: https://www.make.com/en/api-documentation

#### 2.3. n8n Integration (Semana 8)

**Crear nodo custom de n8n**:

```typescript
// n8n-nodes-inmova/nodes/Inmova/Inmova.node.ts
import { IExecuteFunctions, INodeType, INodeTypeDescription } from 'n8n-workflow';

export class Inmova implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Inmova',
    name: 'inmova',
    icon: 'file:inmova.svg',
    group: ['transform'],
    version: 1,
    description: 'Interact with Inmova PropTech platform',
    defaults: {
      name: 'Inmova',
    },
    inputs: ['main'],
    outputs: ['main'],
    credentials: [
      {
        name: 'inmovaApi',
        required: true,
      },
    ],
    properties: [
      {
        displayName: 'Resource',
        name: 'resource',
        type: 'options',
        options: [
          { name: 'Property', value: 'property' },
          { name: 'Tenant', value: 'tenant' },
          { name: 'Payment', value: 'payment' },
        ],
        default: 'property',
      },
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        options: [
          { name: 'Create', value: 'create' },
          { name: 'Get', value: 'get' },
          { name: 'Update', value: 'update' },
          { name: 'Delete', value: 'delete' },
        ],
        default: 'get',
      },
      // ... más properties
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];

    for (let i = 0; i < items.length; i++) {
      const resource = this.getNodeParameter('resource', i) as string;
      const operation = this.getNodeParameter('operation', i) as string;

      // Implementar operaciones...
      if (resource === 'property') {
        if (operation === 'create') {
          // Crear propiedad
        }
      }

      returnData.push({ json: result });
    }

    return [returnData];
  }
}
```

### **FASE 3: Integraciones Estratégicas (Semanas 9-16)** 🟡

#### 3.1. Google Workspace (Semana 9-10)

**Integraciones**:

1. **Google Calendar**: Sincronizar visitas a propiedades
2. **Gmail**: Enviar emails desde Inmova con @gmail.com
3. **Google Drive**: Almacenar documentos
4. **Google Sheets**: Exportar reportes

```typescript
// /workspace/lib/google-workspace-integration.ts
import { google } from 'googleapis';

export class GoogleWorkspaceIntegration {
  private oauth2Client;

  constructor(credentials: { clientId: string; clientSecret: string; refreshToken: string }) {
    this.oauth2Client = new google.auth.OAuth2(
      credentials.clientId,
      credentials.clientSecret,
      'https://inmovaapp.com/oauth/callback/google'
    );
    this.oauth2Client.setCredentials({ refresh_token: credentials.refreshToken });
  }

  async createCalendarEvent(params: {
    summary: string;
    description: string;
    start: Date;
    end: Date;
    attendees: string[];
  }) {
    const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

    const event = {
      summary: params.summary,
      description: params.description,
      start: { dateTime: params.start.toISOString() },
      end: { dateTime: params.end.toISOString() },
      attendees: params.attendees.map((email) => ({ email })),
    };

    const response = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: event,
    });

    return response.data;
  }

  async uploadToDrive(params: {
    name: string;
    mimeType: string;
    buffer: Buffer;
    folderId?: string;
  }) {
    const drive = google.drive({ version: 'v3', auth: this.oauth2Client });

    const media = {
      mimeType: params.mimeType,
      body: Readable.from(params.buffer),
    };

    const response = await drive.files.create({
      requestBody: {
        name: params.name,
        parents: params.folderId ? [params.folderId] : [],
      },
      media,
    });

    return response.data;
  }
}
```

#### 3.2. Slack (Semana 11)

**Notificaciones en tiempo real**:

```typescript
// /workspace/lib/slack-integration.ts
import { WebClient } from '@slack/web-api';

export class SlackIntegration {
  private client: WebClient;

  constructor(token: string) {
    this.client = new WebClient(token);
  }

  async sendNotification(params: { channel: string; message: string; blocks?: any[] }) {
    await this.client.chat.postMessage({
      channel: params.channel,
      text: params.message,
      blocks: params.blocks,
    });
  }

  // Ejemplo: Notificar nuevo pago
  async notifyNewPayment(payment: any) {
    await this.sendNotification({
      channel: '#pagos',
      message: `💰 Nuevo pago recibido: €${payment.amount}`,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Nuevo pago recibido*\n€${payment.amount} de ${payment.tenantName}`,
          },
        },
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: { type: 'plain_text', text: 'Ver Detalles' },
              url: `https://inmovaapp.com/dashboard/payments/${payment.id}`,
            },
          ],
        },
      ],
    });
  }
}
```

#### 3.3. Google Analytics 4 & Meta Pixel (Semana 12)

**Tracking de eventos**:

```typescript
// /workspace/lib/analytics-integration.ts
export async function trackEvent(params: {
  event: string;
  userId?: string;
  properties?: Record<string, any>;
}) {
  // Google Analytics 4
  if (process.env.GA4_MEASUREMENT_ID) {
    await fetch(
      `https://www.google-analytics.com/mp/collect?measurement_id=${process.env.GA4_MEASUREMENT_ID}&api_secret=${process.env.GA4_API_SECRET}`,
      {
        method: 'POST',
        body: JSON.stringify({
          client_id: params.userId || 'anonymous',
          events: [
            {
              name: params.event,
              params: params.properties,
            },
          ],
        }),
      }
    );
  }

  // Meta Pixel
  if (process.env.META_PIXEL_ID) {
    await fetch(`https://graph.facebook.com/v18.0/${process.env.META_PIXEL_ID}/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: [
          {
            event_name: params.event,
            event_time: Math.floor(Date.now() / 1000),
            user_data: {
              external_id: params.userId,
            },
            custom_data: params.properties,
          },
        ],
        access_token: process.env.META_PIXEL_ACCESS_TOKEN,
      }),
    });
  }
}
```

#### 3.4. Microsoft 365 (Semana 13-14)

Similar a Google Workspace pero con APIs de Microsoft.

#### 3.5. HubSpot & Mailchimp (Semana 15-16)

Integraciones de marketing y CRM.

### **FASE 4: Developer Experience (Semanas 17-20)** 🟡

#### 4.1. Developer Portal (Semana 17-18)

**Crear sitio en subdomain**:

```
https://developers.inmovaapp.com
```

**Estructura**:

```
/workspace/apps/developer-portal/
  ├── app/
  │   ├── page.tsx          # Homepage con hero
  │   ├── docs/
  │   │   ├── quick-start/
  │   │   ├── authentication/
  │   │   ├── api-reference/
  │   │   └── webhooks/
  │   ├── sandbox/
  │   │   └── page.tsx      # Interactive API explorer
  │   └── dashboard/
  │       └── page.tsx      # Gestión de API keys
  └── components/
      ├── CodeBlock.tsx
      ├── ApiExplorer.tsx
      └── SdkInstaller.tsx
```

**Homepage del Developer Portal**:

```typescript
// /workspace/apps/developer-portal/app/page.tsx
export default function DeveloperPortalHome() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-20">
        <div className="container mx-auto text-center">
          <h1 className="text-5xl font-bold mb-4">
            Construye sobre Inmova
          </h1>
          <p className="text-xl mb-8">
            API REST, SDKs, Webhooks. Todo lo que necesitas para integrar PropTech en tu aplicación.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/docs/quick-start">
              <Button size="lg" variant="secondary">
                Quick Start →
              </Button>
            </Link>
            <Link href="/sandbox">
              <Button size="lg" variant="outline" className="border-white text-white">
                Probar API
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="container mx-auto grid md:grid-cols-3 gap-8">
          <Card>
            <CardHeader>
              <Code className="h-10 w-10 text-blue-600 mb-4" />
              <CardTitle>API REST Completa</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Endpoints para propiedades, inquilinos, pagos, contratos y más.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Package className="h-10 w-10 text-blue-600 mb-4" />
              <CardTitle>SDKs Oficiales</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Librerías en JavaScript, Python y PHP mantenidas por Inmova.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Webhook className="h-10 w-10 text-blue-600 mb-4" />
              <CardTitle>Webhooks en Tiempo Real</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Recibe notificaciones instantáneas de eventos en tu app.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Code Example */}
      <section className="bg-gray-50 py-20">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Empieza en minutos
          </h2>

          <Tabs defaultValue="javascript">
            <TabsList>
              <TabsTrigger value="javascript">JavaScript</TabsTrigger>
              <TabsTrigger value="python">Python</TabsTrigger>
              <TabsTrigger value="php">PHP</TabsTrigger>
            </TabsList>

            <TabsContent value="javascript">
              <CodeBlock language="typescript">
{`import { InmovaClient } from '@inmova/sdk';

const inmova = new InmovaClient({
  apiKey: 'sk_live_xxxxx',
});

// Listar propiedades
const properties = await inmova.properties.list({
  city: 'Madrid',
  minPrice: 1000,
  maxPrice: 2000,
});

console.log(properties);`}
              </CodeBlock>
            </TabsContent>

            <TabsContent value="python">
              <CodeBlock language="python">
{`from inmova import InmovaClient

inmova = InmovaClient(api_key='sk_live_xxxxx')

# Listar propiedades
properties = inmova.properties.list(
    city='Madrid',
    min_price=1000,
    max_price=2000
)

print(properties)`}
              </CodeBlock>
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </div>
  );
}
```

#### 4.2. Interactive API Explorer (Semana 19)

**Sandbox con datos de prueba**:

```typescript
// /workspace/apps/developer-portal/app/sandbox/page.tsx
'use client';

import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';

export default function ApiExplorerPage() {
  const [endpoint, setEndpoint] = useState('/api/v1/properties');
  const [method, setMethod] = useState('GET');
  const [apiKey, setApiKey] = useState('sk_test_demo');
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);

  async function executeRequest() {
    setLoading(true);

    try {
      const res = await fetch(`https://api.inmovaapp.com${endpoint}`, {
        method,
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await res.json();
      setResponse(data);
    } catch (error) {
      setResponse({ error: error.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">🧪 API Explorer</h1>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Request Panel */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Request</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Method */}
              <div>
                <label className="text-sm font-medium mb-2 block">Method</label>
                <Select value={method} onValueChange={setMethod}>
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="DELETE">DELETE</option>
                </Select>
              </div>

              {/* Endpoint */}
              <div>
                <label className="text-sm font-medium mb-2 block">Endpoint</label>
                <Input
                  value={endpoint}
                  onChange={(e) => setEndpoint(e.target.value)}
                  placeholder="/api/v1/properties"
                />
              </div>

              {/* API Key */}
              <div>
                <label className="text-sm font-medium mb-2 block">API Key</label>
                <Input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk_test_xxxxx"
                />
              </div>

              {/* Execute Button */}
              <Button
                onClick={executeRequest}
                disabled={loading}
                className="w-full"
              >
                {loading ? 'Ejecutando...' : 'Ejecutar Request'}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Response Panel */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Response</CardTitle>
            </CardHeader>
            <CardContent>
              {response ? (
                <CodeBlock language="json">
                  {JSON.stringify(response, null, 2)}
                </CodeBlock>
              ) : (
                <p className="text-gray-500 text-center py-8">
                  Ejecuta un request para ver la respuesta
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
```

#### 4.3. SDK Publishing (Semana 20)

**Publicar SDKs en registros públicos**:

```bash
# JavaScript SDK
cd packages/js-sdk
npm publish @inmova/sdk

# Python SDK
cd packages/python-sdk
python setup.py sdist bdist_wheel
twine upload dist/*

# PHP SDK
cd packages/php-sdk
composer publish
```

---

## 📈 IMPACTO ESPERADO

### Conversión y Adopción

| Métrica                         | Antes     | Después (6 meses) | Mejora        |
| ------------------------------- | --------- | ----------------- | ------------- |
| **Empresas con integraciones**  | 15%       | 70%               | +367%         |
| **Apps conectadas por empresa** | 1.2       | 4.5               | +275%         |
| **Desarrolladores externos**    | 0         | 500+              | ∞             |
| **Apps construidas en Inmova**  | 0         | 50+               | ∞             |
| **Time-to-value (onboarding)**  | 2 semanas | 2 días            | -85%          |
| **Churn rate**                  | 8%/mes    | 3%/mes            | -62.5%        |
| **NPS (desarrolladores)**       | N/A       | 75+               | Nueva métrica |

### ROI del Proyecto

**Inversión**:

- 20 semanas de desarrollo (1 senior full-stack)
- ~€80,000 en salarios
- €10,000 en herramientas y servicios (Zapier Partner, hosting)
- **Total**: ~€90,000

**Retorno esperado** (Año 1):

- +30% adopción de plan Professional (€149/mes) = +200 clientes = +€350K ARR
- +50 empresas Enterprise por facilidad de integración = +€375K ARR
- +100 developers externos construyendo en Inmova = Brand awareness
- **Total ARR adicional**: ~€725K

**ROI**: ~8x en primer año

---

## ✅ CHECKLIST DE VERIFICACIÓN

### Fundamentos

- [ ] API REST v1 publicada y documentada
- [ ] Rate limiting implementado (1000 req/min)
- [ ] API Keys generables desde dashboard
- [ ] OAuth 2.0 funcionando (authorize + token endpoints)
- [ ] Webhooks bidireccionales (incoming + outgoing)
- [ ] Marketplace de integraciones con UI
- [ ] Logs de API requests (últimos 30 días)
- [ ] Sandbox environment con datos de prueba

### Developer Experience

- [ ] Developer Portal en subdomain
- [ ] Documentación completa (Quick Start, API Reference, Guides)
- [ ] Interactive API Explorer (sandbox)
- [ ] Ejemplos de código en 3+ lenguajes
- [ ] SDKs publicados (JavaScript, Python, PHP)
- [ ] Changelog público de API
- [ ] Status page (uptime de API)

### Integraciones No-Code

- [ ] Zapier app publicada (triggers, actions, searches)
- [ ] Make (Integromat) módulos publicados
- [ ] n8n custom node disponible
- [ ] Power Automate conectores (opcional)

### Integraciones Estratégicas

- [ ] Google Workspace (Calendar, Drive, Gmail)
- [ ] Slack (notificaciones tiempo real)
- [ ] Microsoft 365 (Outlook, OneDrive, Teams)
- [ ] Google Analytics 4 (tracking)
- [ ] Meta Pixel (tracking ads)
- [ ] Mailchimp (email marketing)
- [ ] HubSpot (CRM)

### Seguridad

- [ ] HTTPS obligatorio en todos los endpoints
- [ ] API Keys encriptadas en BD
- [ ] OAuth tokens con expiration
- [ ] Rate limiting por IP y por API key
- [ ] CORS configurado correctamente
- [ ] Webhooks con firma HMAC
- [ ] Logs de acceso a API (audit trail)

---

## 🚀 PRÓXIMOS PASOS INMEDIATOS

1. **Crear branch nueva**:

   ```bash
   git checkout -b feature/integrations-ecosystem
   ```

2. **Empezar con Fase 1.1** (API REST v1):
   - Crear estructura `/app/api/v1/`
   - Implementar autenticación con API Keys
   - Endpoints básicos (properties, tenants)
   - Rate limiting
   - Documentación OpenAPI

3. **Priorizar por impacto**:
   - Semana 1-2: API REST + API Keys
   - Semana 3-4: Marketplace UI + OAuth 2.0
   - Semana 5-6: Zapier (mayor impacto de adopción)
   - Semana 7+: Resto de integraciones

---

**Documento creado**: 31 de Diciembre de 2025  
**Última actualización**: 31 de Diciembre de 2025  
**Estado**: 📋 PLAN APROBADO - PENDIENTE IMPLEMENTACIÓN
