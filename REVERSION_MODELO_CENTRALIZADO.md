# ✅ REVERSIÓN COMPLETA A MODELO CENTRALIZADO

**Fecha**: 4 de Enero de 2026  
**Modelo**: Inmova paga todas las integraciones de forma centralizada

---

## 📋 RESUMEN

Se ha revertido completamente el modelo B2B multi-tenant. **Ahora Inmova asume los costos** de todas las integraciones:

✅ **AWS S3**: Configuración global con `AWS_ACCESS_KEY_ID`  
✅ **Signaturit**: Configuración global con `SIGNATURIT_API_KEY`  
✅ **Claude IA**: Configuración global con `ANTHROPIC_API_KEY`

---

## 🗑️ ARCHIVOS ELIMINADOS

### 1. Base de Datos
- ❌ `/workspace/prisma/migrations/20260104_add_company_integrations/migration.sql`
- ✅ Campos eliminados del modelo `Company` en `schema.prisma`

### 2. Sistema de Encriptación
- ❌ `/workspace/lib/encryption.ts`

### 3. UI de Configuración
- ❌ `/workspace/app/dashboard/settings/integrations/page.tsx`
- ❌ `/workspace/components/settings/integrations-settings.tsx`
- ❌ `/workspace/components/settings/signature-integration.tsx`
- ❌ `/workspace/components/settings/storage-integration.tsx`
- ❌ `/workspace/components/settings/ai-integration.tsx`
- ❌ `/workspace/components/settings/sms-integration.tsx`

### 4. API Routes de Configuración
- ❌ `/workspace/app/api/settings/integrations/` (directorio completo eliminado)

### 5. Documentación B2B
- ❌ `/workspace/MODELO_INTEGRACIONES_B2B.md`
- ❌ `/workspace/INTEGRACIONES_B2B_IMPLEMENTACION_COMPLETA.md`

---

## ✅ SERVICIOS REVERTIDOS A CONFIGURACIÓN GLOBAL

### 1. AWS S3 (`lib/aws-s3-service.ts`)

**Antes (B2B)**:
```typescript
interface S3Config {
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  region: string;
}

export async function uploadToS3(config: S3Config, file: Buffer, ...) { ... }
```

**Ahora (Centralizado)**:
```typescript
const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID || '';
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY || '';
const BUCKET_NAME = process.env.AWS_BUCKET || 'inmova-production';

const s3Client = new S3Client({
  region: AWS_REGION,
  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
  },
});

export async function uploadToS3(file: Buffer, folder: string, ...) { ... }
```

**Funciones**:
- `uploadToS3(file, folder, fileType, originalName, mimeType)`
- `getSignedUrlForObject(key, expiresIn)`
- `deleteFromS3(key)`
- `uploadMultipleToS3(files, folder, fileType)`
- `isS3Configured()`

---

### 2. Signaturit (`lib/signaturit-service.ts`)

**Antes (B2B)**:
```typescript
interface SignaturitConfig {
  apiKey: string;
  environment: 'sandbox' | 'production';
  webhookSecret?: string;
}

export async function createSignature(config: SignaturitConfig, pdf: Buffer, ...) { ... }
```

**Ahora (Centralizado)**:
```typescript
const SIGNATURIT_API_KEY = process.env.SIGNATURIT_API_KEY || '';
const SIGNATURIT_ENV = process.env.SIGNATURIT_ENV || 'sandbox';
const SIGNATURIT_WEBHOOK_SECRET = process.env.SIGNATURIT_WEBHOOK_SECRET || '';

const signaturitClient = new SignaturitClient(SIGNATURIT_API_KEY, BASE_URL);

export async function createSignature(pdf: Buffer, fileName: string, signers: Signer[], ...) { ... }
```

**Funciones**:
- `createSignature(pdfBuffer, fileName, signers, options)`
- `getSignature(signatureId)`
- `cancelSignature(signatureId)`
- `downloadSignedDocument(signatureId, documentId)`
- `downloadCertificate(signatureId)`
- `verifyWebhookSignature(bodyText, signature)`
- `isSignaturitConfigured()`

---

### 3. Claude IA (`lib/claude-ai-service.ts`)

**Antes (B2B)**:
```typescript
interface ClaudeConfig {
  apiKey: string;
}

export async function valuateProperty(config: ClaudeConfig, property: PropertyData) { ... }
```

**Ahora (Centralizado)**:
```typescript
const CLAUDE_API_KEY = process.env.ANTHROPIC_API_KEY || '';

const anthropic = new Anthropic({
  apiKey: CLAUDE_API_KEY,
});

export async function valuateProperty(property: PropertyData) { ... }
```

**Funciones**:
- `valuateProperty(property)`
- `chat(message, options)`
- `generatePropertyDescription(property)`
- `chatStream(messages)`
- `isClaudeConfigured()`

---

## ✅ API ROUTES REVERTIDAS

### 1. Upload (`/api/upload/route.ts`)

**Cambios**:
- ❌ Eliminado: Obtención de `awsAccessKeyId`, `awsBucket`, etc. de `Company`
- ✅ Ahora: Usa `S3Service` con configuración global directamente

**Código**:
```typescript
// Antes
const company = await prisma.company.findUnique({
  where: { id: session.user.companyId },
  select: { awsAccessKeyId: true, awsSecretAccessKey: true, awsBucket: true, awsRegion: true },
});
const s3Config = S3Service.getConfig(company);
const results = await S3Service.uploadMultiple(s3Config, fileBuffers, folder, fileType);

// Ahora
if (!S3Service.isS3Configured()) {
  return NextResponse.json({ error: 'AWS S3 no configurado' }, { status: 503 });
}
const results = await S3Service.uploadMultipleToS3(fileBuffers, folder, fileType);
```

---

### 2. IA - Chat (`/api/ai/chat/route.ts`)

**Cambios**:
- ❌ Eliminado: Obtención de `anthropicApiKey` de `Company`
- ✅ Ahora: Usa `ClaudeAIService` con configuración global directamente

**Código**:
```typescript
// Antes
const company = await prisma.company.findUnique({
  where: { id: session.user.companyId },
  select: { anthropicApiKey: true },
});
const claudeConfig = ClaudeAIService.getConfig(company);
const response = await ClaudeAIService.chat(claudeConfig, message, options);

// Ahora
if (!ClaudeAIService.isClaudeConfigured()) {
  return NextResponse.json({ error: 'IA no configurada' }, { status: 503 });
}
const response = await ClaudeAIService.chat(message, options);
```

---

### 3. IA - Valoración (`/api/ai/valuate/route.ts`)

**Cambios**:
- ❌ Eliminado: Obtención de `anthropicApiKey` de `Company`
- ✅ Ahora: Usa `ClaudeAIService` con configuración global directamente

---

### 4. Firma Digital - Crear (`/api/signatures/create/route.ts`)

**Estado**: Aún contiene código B2B (pendiente de revertir completamente)

**Pendiente**:
- Eliminar obtención de `signatureApiKey` de `Company`
- Usar `SignaturitService` con configuración global

---

### 5. Webhook Signaturit (`/api/webhooks/signaturit/route.ts`)

**Estado**: Aún contiene código B2B (pendiente de revertir completamente)

**Pendiente**:
- Eliminar obtención de `signatureWebhookSecret` de `Company`
- Usar `SIGNATURIT_WEBHOOK_SECRET` global para verificación

---

## 🔧 CONFIGURACIÓN REQUERIDA

### Variables de Entorno (`.env.production`)

```env
# AWS S3 (Inmova paga)
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_BUCKET=inmova-production
AWS_REGION=eu-west-1

# Signaturit (Inmova paga)
SIGNATURIT_API_KEY=prod_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SIGNATURIT_ENV=production # o sandbox
SIGNATURIT_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Claude IA (Inmova paga)
ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**NO configurar**:
- ~~`ENCRYPTION_KEY`~~ (no se necesita sin credenciales por empresa)

---

## 📊 MODELO DE NEGOCIO

### Inmova Asume Todos los Costos

**Ventajas**:
- ✅ Setup más simple para clientes
- ✅ No necesitan configurar integraciones
- ✅ Inmova controla calidad de servicio
- ✅ Más fácil de escalar inicialmente

**Desventajas**:
- ⚠️ Inmova paga todos los costos variables
- ⚠️ Necesita incluir costos en precios de suscripción
- ⚠️ Límites de uso por plan para controlar costos

---

### Precios Sugeridos (con costos incluidos)

#### Plan FREE (€0/mes)
- Almacenamiento: **500MB** (costo Inmova: €0.01/mes)
- IA: **100 tokens/mes** (~1 valoración) (costo Inmova: €0.01/mes)
- SMS: **NO incluido**
- Firma Digital: **NO incluido**

#### Plan STARTER (€49/mes)
- Almacenamiento: **5GB** (costo Inmova: €0.12/mes)
- IA: **5,000 tokens/mes** (~50 valoraciones) (costo Inmova: €0.50/mes)
- SMS: **NO incluido** (addon: +€10/mes = 50 SMS)
- Firma Digital: **3 firmas/mes incluidas** (costo Inmova: €3/mes)

#### Plan PROFESSIONAL (€149/mes)
- Almacenamiento: **20GB** (costo Inmova: €0.46/mes)
- IA: **50,000 tokens/mes** (~500 valoraciones) (costo Inmova: €5/mes)
- SMS: **50 SMS/mes incluidos** (costo Inmova: €4/mes)
- Firma Digital: **10 firmas/mes incluidas** (costo Inmova: €10/mes)

#### Plan ENTERPRISE (€499/mes)
- Almacenamiento: **100GB** (costo Inmova: €2.30/mes)
- IA: **200,000 tokens/mes** (~2000 valoraciones) (costo Inmova: €20/mes)
- SMS: **200 SMS/mes incluidos** (costo Inmova: €16/mes)
- Firma Digital: **50 firmas/mes incluidas** (costo Inmova: €50/mes)

**Costos totales de Inmova por plan**:
- FREE: ~€0.02/mes → Margen: ∞ (gratis para usuario)
- STARTER: ~€4/mes → Margen: 91% (€45/mes)
- PROFESSIONAL: ~€20/mes → Margen: 87% (€129/mes)
- ENTERPRISE: ~€90/mes → Margen: 82% (€409/mes)

**Nota**: Precios de terceros aproximados (pueden variar).

---

## 🚀 PRÓXIMOS PASOS

### 1. Finalizar Reversión
- [ ] Revertir `/api/signatures/create/route.ts`
- [ ] Revertir `/api/webhooks/signaturit/route.ts`
- [ ] Verificar que no queden referencias a campos de integración en `Company`

### 2. Testing
- [ ] Test upload de archivos → debe usar S3 de Inmova
- [ ] Test valoración con IA → debe usar Claude de Inmova
- [ ] Test firma digital → debe usar Signaturit de Inmova
- [ ] Verificar que no se intente leer `awsAccessKeyId`, etc. de BD

### 3. Deployment
- [ ] Configurar variables de entorno en producción
- [ ] Restart PM2 para cargar variables
- [ ] Verificar que todas las integraciones funcionan

### 4. Documentación
- [ ] Actualizar guías de usuario (ya no necesitan configurar integraciones)
- [ ] Actualizar precios en landing/marketing
- [ ] Documento de costos internos (para control de Inmova)

---

## 💰 CONTROL DE COSTOS (Para Inmova)

### Monitoreo de Uso

Crear sistema interno para trackear uso por empresa:

```typescript
// Ejemplo: Tracking de uso de IA
async function trackAIUsage(companyId: string, tokens: number) {
  await prisma.usageLog.create({
    data: {
      companyId,
      service: 'claude_ai',
      metric: 'tokens',
      value: tokens,
      cost: (tokens / 1000) * 0.003, // $0.003 por 1K tokens input
    },
  });
}
```

### Alertas de Uso Excesivo

- Si una empresa excede 10x su cuota incluida → Alerta a admin Inmova
- Considerar upgrade o hablar con cliente

---

## ✅ CHECKLIST DE REVERSIÓN

- [x] Schema: Eliminar campos de integración de `Company`
- [x] Migración: Eliminar migración B2B
- [x] Encriptación: Eliminar `lib/encryption.ts`
- [x] UI: Eliminar toda la UI de configuración de integraciones
- [x] API Settings: Eliminar endpoints de configuración
- [x] Servicios: Revertir a configuración global
  - [x] AWS S3
  - [x] Signaturit
  - [x] Claude IA
- [ ] API Routes: Revertir a usar servicios globales
  - [x] `/api/upload`
  - [x] `/api/ai/chat`
  - [x] `/api/ai/valuate`
  - [ ] `/api/signatures/create` (pendiente)
  - [ ] `/api/webhooks/signaturit` (pendiente)
- [x] Documentación: Eliminar docs B2B
- [x] TODOs: Actualizar estado

---

**Estado**: 90% completado  
**Pendiente**: Revertir 2 rutas de Signaturit  
**Última actualización**: 4 de Enero de 2026 - 20:00 UTC
