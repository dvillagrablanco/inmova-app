# 🎉 INTEGRACIONES B2B - IMPLEMENTACIÓN COMPLETA

**Fecha**: 4 de Enero de 2026  
**Status**: ✅ Implementación finalizada  
**Modelo**: Multi-tenant B2B (cada cliente gestiona sus propias credenciales)

---

## 📋 RESUMEN EJECUTIVO

Se ha completado la refactorización completa de las integraciones de terceros para soportar el modelo B2B multi-tenant correcto:

✅ **AWS S3**: Almacenamiento con modo propio/compartido  
✅ **Signaturit/DocuSign**: Firma digital con credenciales por cliente  
✅ **Claude IA**: Inteligencia artificial con API key por cliente  
✅ **UI Completa**: Panel de configuración de integraciones  
✅ **Encriptación**: Sistema de encriptación AES-256-CBC para credenciales  
✅ **API Routes**: Endpoints para guardar/testear todas las integraciones  
✅ **Database**: Schema actualizado con campos de integración en `Company`

---

## 🏗️ ARQUITECTURA IMPLEMENTADA

### Modelo de Negocio

```
┌─────────────────────────────────────────────────────────────┐
│ CLIENTE DE INMOVA (Company)                                │
│                                                             │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ OPCIÓN A: Usar servicios propios (BYOK)            │   │
│ │                                                     │   │
│ │ - Cliente paga a proveedor externo directamente    │   │
│ │ - Inmova solo integra (sin costos)                 │   │
│ │ - Cliente configura credenciales en Inmova         │   │
│ │ - Credenciales encriptadas en BD de Inmova         │   │
│ └─────────────────────────────────────────────────────┘   │
│                                                             │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ OPCIÓN B: Usar servicios compartidos de Inmova      │   │
│ │                                                     │   │
│ │ - Inmova paga a proveedor                          │   │
│ │ - Cliente paga a Inmova (con markup)               │   │
│ │ - Incluye X gratis en plan, luego por uso          │   │
│ │ - Inmova gestiona credenciales globales            │   │
│ └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

**Excepción**: Signaturit/DocuSign son **SOLO modo propio** por requisitos legales.

---

## 📦 COMPONENTES IMPLEMENTADOS

### 1. Base de Datos (`prisma/schema.prisma`)

```prisma
model Company {
  // ... campos existentes ...
  
  // Signaturit / DocuSign
  signatureProvider      String? // "signaturit", "docusign", null
  signatureApiKey        String? // Encriptada
  signatureWebhookSecret String? // Encriptada
  signatureEnvironment   String? @default("sandbox")
  
  // AWS S3
  awsAccessKeyId         String? // Encriptada
  awsSecretAccessKey     String? // Encriptada
  awsBucket              String?
  awsRegion              String? @default("eu-west-1")
  
  // Anthropic Claude
  anthropicApiKey        String? // Encriptada
  
  // Twilio (futuro)
  twilioAccountSid       String?
  twilioAuthToken        String?
  twilioPhoneNumber      String?
}
```

**Migración**: `/workspace/prisma/migrations/20260104_add_company_integrations/migration.sql`

---

### 2. Sistema de Encriptación (`lib/encryption.ts`)

**Algoritmo**: AES-256-CBC  
**Formato**: `iv:encryptedData` (hex)  
**Clave**: Variable de entorno `ENCRYPTION_KEY` (64 caracteres hex = 32 bytes)

**Funciones principales**:
- `encrypt(text: string)`: Encripta texto
- `decrypt(encryptedText: string)`: Desencripta texto
- `generateEncryptionKey()`: Genera clave aleatoria
- `isEncrypted(text: string)`: Verifica si texto está encriptado
- `encryptIfNotEncrypted()`: Encripta solo si no está encriptado

**Setup inicial**:
```bash
# Generar clave de encriptación
node -e "console.log(require('./lib/encryption').generateEncryptionKey())"

# Añadir a .env.production
ENCRYPTION_KEY=a1b2c3d4e5f6... (64 caracteres)
```

---

### 3. Servicios Refactorizados

#### a) `lib/aws-s3-service.ts`

**Antes**: Configuración global con `AWS_ACCESS_KEY_ID`  
**Después**: Config por operación

```typescript
// Interface
interface S3Config {
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  region: string;
}

// Uso
const company = await prisma.company.findUnique({ where: { id } });
const s3Config = getConfig(company); // Cliente o default Inmova

await uploadToS3(s3Config, fileBuffer, 'documents', 'pdf', 'contrato.pdf', 'application/pdf');
```

**Funciones**:
- `getS3Client(config: S3Config)`: Crea cliente S3
- `uploadToS3(config, ...)`: Sube archivo
- `getSignedUrlForObject(config, ...)`: Obtiene URL firmada
- `deleteFromS3(config, ...)`: Elimina archivo
- `getConfig(company)`: Obtiene config (cliente o default)

---

#### b) `lib/signaturit-service.ts`

**Antes**: Configuración global con `SIGNATURIT_API_KEY`  
**Después**: Config por operación

```typescript
// Interface
interface SignaturitConfig {
  apiKey: string;
  environment: 'sandbox' | 'production';
  webhookSecret?: string;
}

// Uso
const company = await prisma.company.findUnique({ where: { id } });
const signaturitConfig = {
  apiKey: decrypt(company.signatureApiKey!),
  environment: company.signatureEnvironment as 'sandbox' | 'production',
  webhookSecret: company.signatureWebhookSecret ? decrypt(company.signatureWebhookSecret) : undefined,
};

await createSignature(signaturitConfig, pdfBuffer, 'contrato.pdf', signers, options);
```

**Funciones**:
- `createSignature(config, ...)`: Crea solicitud de firma
- `getSignature(config, id)`: Obtiene estado de firma
- `cancelSignature(config, id)`: Cancela firma
- `downloadSignedDocument(config, id)`: Descarga documento firmado
- `verifyWebhookSignature(bodyText, signature, secret)`: Verifica webhook

---

#### c) `lib/claude-ai-service.ts`

**Antes**: Configuración global con `ANTHROPIC_API_KEY`  
**Después**: Config por operación

```typescript
// Interface
interface ClaudeConfig {
  apiKey: string;
}

// Uso
const company = await prisma.company.findUnique({ where: { id } });
const claudeConfig = getConfig(company); // Cliente o default Inmova

const valuation = await valuateProperty(claudeConfig, propertyData);
```

**Funciones**:
- `getClaudeClient(config)`: Crea cliente Anthropic
- `valuateProperty(config, property)`: Valora propiedad
- `chat(config, message, options)`: Chat simple
- `chatStream(config, messages)`: Chat con streaming
- `generatePropertyDescription(config, property)`: Genera descripción
- `getConfig(company)`: Obtiene config (cliente o default)

---

### 4. UI de Configuración

#### Página principal: `/dashboard/settings/integrations`

**Ruta**: `app/dashboard/settings/integrations/page.tsx`  
**Acceso**: Solo admins (`super_admin`, `administrador`)

**Tabs**:
1. **Firma Digital**: Signaturit/DocuSign
2. **Almacenamiento**: AWS S3
3. **Inteligencia IA**: Claude
4. **SMS/WhatsApp**: Twilio (próximamente)

---

#### Componentes de configuración:

**a) `components/settings/signature-integration.tsx`**
- Selección de proveedor (Signaturit/DocuSign)
- API Key (con show/hide)
- Webhook Secret
- Entorno (sandbox/production)
- Botón de test de conexión

**b) `components/settings/storage-integration.tsx`**
- Modo: Propio vs Compartido
- AWS Access Key ID
- AWS Secret Access Key
- Nombre de bucket
- Región AWS
- Botón de test de conexión

**c) `components/settings/ai-integration.tsx`**
- Modo: Propio vs Compartido
- Anthropic API Key
- Lista de funcionalidades incluidas
- Info de precios
- Botón de test de conexión

**d) `components/settings/sms-integration.tsx`**
- UI deshabilitada (próximamente)
- Info de funcionalidades futuras

---

### 5. API Routes

#### a) Configuración

**POST** `/api/settings/integrations/signature`
- Guarda configuración de Signaturit/DocuSign
- Encripta API key y webhook secret
- Valida permisos (solo admin de la empresa)

**POST** `/api/settings/integrations/storage`
- Guarda configuración de AWS S3
- Encripta Access Key y Secret Key
- Soporta modo propio/compartido

**POST** `/api/settings/integrations/ai`
- Guarda configuración de Claude IA
- Encripta API key
- Soporta modo propio/compartido

**POST** `/api/settings/integrations/sms`
- Placeholder (funcionalidad en desarrollo)

---

#### b) Test de Conexión

**POST** `/api/settings/integrations/signature/test`
- Verifica API key de Signaturit
- Hace request a `/account.json`
- Retorna info de la cuenta

**POST** `/api/settings/integrations/storage/test`
- Verifica credenciales de AWS S3
- Hace `HeadBucket` para verificar acceso
- Retorna bucket y región

**POST** `/api/settings/integrations/ai/test`
- Verifica API key de Claude
- Envía mensaje de test simple
- Retorna respuesta del modelo

---

### 6. Rutas API Refactorizadas

Estas rutas ahora soportan credenciales por cliente:

**Uploads**:
- `/api/upload` - Usa S3 config de la empresa

**Firmas**:
- `/api/signatures/create` - Usa Signaturit config de la empresa
- `/api/webhooks/signaturit` - Verifica webhook con secret de la empresa

**IA**:
- `/api/ai/valuate` - Usa Claude config de la empresa
- `/api/ai/chat` - Usa Claude config de la empresa

---

## 🚀 DEPLOYMENT

### 1. Database Migration

```bash
# Ejecutar migración en producción
cd /opt/inmova-app
npx prisma migrate deploy

# Verificar
npx prisma studio
```

---

### 2. Variables de Entorno

Añadir a `.env.production`:

```env
# Encriptación de credenciales
ENCRYPTION_KEY=<64-caracteres-hex-generados>

# Credenciales default de Inmova (para modo compartido)

# AWS S3 (compartido)
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_BUCKET=inmova-shared-storage
AWS_REGION=eu-west-1

# Anthropic Claude (compartido)
ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**NO configurar**:
- ~~`SIGNATURIT_API_KEY`~~ (cada cliente tiene la suya)
- ~~`DOCUSIGN_API_KEY`~~ (cada cliente tiene la suya)

---

### 3. Restart Aplicación

```bash
# Si usas PM2
pm2 restart inmova-app --update-env

# Verificar variables cargadas
pm2 env inmova-app | grep -E "ENCRYPTION|AWS|ANTHROPIC"

# Test
curl https://inmovaapp.com/api/health
```

---

## 🧪 TESTING

### 1. Test de Encriptación

```typescript
import { encrypt, decrypt, generateEncryptionKey } from '@/lib/encryption';

// Generar clave
const key = generateEncryptionKey();
console.log('Key:', key); // Guardar en .env

// Test
const original = 'mi-api-key-secreta';
const encrypted = encrypt(original);
console.log('Encrypted:', encrypted); // "a1b2c3...:d4e5f6..."

const decrypted = decrypt(encrypted);
console.log('Decrypted:', decrypted); // "mi-api-key-secreta"
console.assert(original === decrypted);
```

---

### 2. Test de UI

1. Login como admin
2. Ir a `/dashboard/settings/integrations`
3. Tab "Firma Digital":
   - Seleccionar "Usar mi propia cuenta"
   - Provider: Signaturit
   - API Key: `prod_xxx` (de tu cuenta Signaturit)
   - Environment: Sandbox
   - Guardar
   - Probar Conexión → debe mostrar "✓ Conexión verificada"

4. Tab "Almacenamiento":
   - Seleccionar "Usar almacenamiento compartido de Inmova"
   - Guardar
   - Probar Conexión → debe mostrar bucket de Inmova

5. Tab "Inteligencia IA":
   - Seleccionar "Usar IA compartida de Inmova"
   - Guardar
   - Probar Conexión → debe mostrar modelo Claude

---

### 3. Test de Upload

```bash
# Login
curl -X POST https://inmovaapp.com/api/auth/signin/credentials \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@inmova.app","password":"Admin123!"}' \
  -c cookies.txt

# Upload archivo
curl -X POST https://inmovaapp.com/api/upload \
  -H "Content-Type: multipart/form-data" \
  -F "files[]=@test.pdf" \
  -F "folder=documents" \
  -F "fileType=pdf" \
  -b cookies.txt

# Debe retornar 200 con URLs de S3
```

---

### 4. Test de Firma

```typescript
// Desde API route o script
const company = await prisma.company.findFirst({
  where: { signatureApiKey: { not: null } },
});

const config = {
  apiKey: decrypt(company.signatureApiKey!),
  environment: 'sandbox',
};

const result = await createSignature(
  config,
  pdfBuffer,
  'test.pdf',
  [{ email: 'test@example.com', name: 'Test User' }],
  { deliveryType: 'email' }
);

console.log('Signature ID:', result.id);
```

---

### 5. Test de IA

```bash
curl -X POST https://inmovaapp.com/api/ai/valuate \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=xxx" \
  -d '{
    "propertyId": "clxxx",
    "address": "Calle Mayor 123",
    "city": "Madrid",
    "squareMeters": 80,
    "rooms": 3,
    "bathrooms": 2,
    "condition": "GOOD"
  }'

# Debe retornar valoración estimada
```

---

## 💰 MONETIZACIÓN

### Planes de Suscripción Propuestos

#### Plan FREE (€0/mes)
- Firma Digital: **NO incluido** (debe usar su cuenta)
- Almacenamiento: **1GB** compartido gratis
- IA: **500 tokens/mes** gratis (~5 valoraciones)
- SMS: **NO incluido**

#### Plan STARTER (€49/mes)
- Firma Digital: **NO incluido** (debe usar su cuenta)
- Almacenamiento: **10GB** compartido, luego **€0.05/GB/mes**
- IA: **5,000 tokens/mes** gratis (~50 valoraciones), luego **€0.10/1K tokens**
- SMS: **50 SMS/mes** gratis, luego **€0.08/SMS**

#### Plan PROFESSIONAL (€149/mes)
- Firma Digital: **NO incluido** (debe usar su cuenta)
- Almacenamiento: **50GB** compartido, luego **€0.04/GB/mes**
- IA: **50,000 tokens/mes** gratis (~500 valoraciones), luego **€0.08/1K tokens**
- SMS: **200 SMS/mes** gratis, luego **€0.06/SMS**

#### Plan ENTERPRISE (€499/mes)
- Firma Digital: **NO incluido** (debe usar su cuenta)
- Almacenamiento: **200GB** compartido, luego **€0.03/GB/mes**
- IA: **200,000 tokens/mes** gratis (~2000 valoraciones), luego **€0.06/1K tokens**
- SMS: **1000 SMS/mes** gratis, luego **€0.05/SMS**

**Nota**: Los clientes pueden optar por usar sus propias cuentas (BYOK) en cualquier plan para eliminar límites.

---

## 📊 MÉTRICAS Y MONITOREO

### Tracking de Uso (Futuro)

```prisma
model IntegrationUsage {
  id           String   @id @default(cuid())
  companyId    String
  integration  String   // "s3", "claude", "twilio"
  metric       String   // "storage_gb", "tokens", "sms_sent"
  value        Float    // Cantidad usada
  cost         Float?   // Costo incurrido (si aplica)
  period       DateTime // Mes de facturación
  createdAt    DateTime @default(now())
  
  company      Company  @relation(fields: [companyId], references: [id])
  
  @@index([companyId, integration, period])
}
```

---

## 🔐 SEGURIDAD

### Credenciales Encriptadas

✅ **Encriptación**: AES-256-CBC  
✅ **IV aleatorio**: Por cada encriptación  
✅ **Clave maestra**: En variable de entorno (no en BD)  
✅ **Formato**: `iv:encryptedData` (hex)

### Validación de Permisos

✅ Solo admins pueden configurar integraciones  
✅ Verificación de `companyId` en todas las operaciones  
✅ Desencriptación solo en runtime (nunca expuesto al cliente)  
✅ Credenciales nunca loggeadas

### Best Practices

✅ **Nunca** loggear API keys (ni encriptadas)  
✅ **Nunca** retornar credenciales en APIs (usar `••••••`)  
✅ **Rotar** clave de encriptación anualmente  
✅ **Auditar** cambios de credenciales (tabla `AuditLog`)

---

## 📚 DOCUMENTACIÓN PARA CLIENTES

### Guías por Integración

**Signaturit**:
1. Crear cuenta en https://www.signaturit.com/es
2. Ir a Dashboard → Configuración → API
3. Copiar API Key
4. En Inmova: Settings → Integraciones → Firma Digital
5. Pegar API Key y configurar

**AWS S3**:
1. Crear cuenta AWS
2. IAM → Create User → Attach Policy: `AmazonS3FullAccess`
3. Create Access Key
4. Create Bucket
5. En Inmova: Settings → Integraciones → Almacenamiento
6. Configurar credenciales

**Claude IA**:
1. Crear cuenta en https://console.anthropic.com
2. Settings → API Keys → Create Key
3. Copiar API Key
4. En Inmova: Settings → Integraciones → IA
5. Pegar API Key

---

## 🚧 PRÓXIMOS PASOS

### Fase 2: Monitoreo y Facturación

- [ ] Implementar tracking de uso (`IntegrationUsage` model)
- [ ] Dashboard de uso por empresa
- [ ] Alertas de límites
- [ ] Facturación automática por exceso

### Fase 3: Integraciones Adicionales

- [ ] Twilio (SMS/WhatsApp)
- [ ] Stripe Connect (pagos)
- [ ] Google Calendar (citas)
- [ ] Zapier (automatizaciones)

### Fase 4: Optimizaciones

- [ ] Cache de credenciales desencriptadas (en memoria, max 5min)
- [ ] Retry logic para APIs externas
- [ ] Health checks periódicos de integraciones
- [ ] Notificaciones si API keys expiran

---

## 📞 SOPORTE

### Errores Comunes

**Error: "ENCRYPTION_KEY not configured"**
- **Causa**: Falta variable de entorno
- **Solución**: Generar key y añadir a `.env.production`

**Error: "API key inválida"**
- **Causa**: Credenciales incorrectas o expiradas
- **Solución**: Verificar en dashboard del proveedor

**Error: "Bucket not found"**
- **Causa**: Bucket no existe o permisos incorrectos
- **Solución**: Crear bucket o verificar IAM policy

---

## ✅ CHECKLIST DE DEPLOYMENT

Pre-Deployment:
- [x] Database migration creada
- [x] Variables de entorno configuradas
- [x] ENCRYPTION_KEY generada
- [x] Credenciales default de Inmova configuradas (S3, Claude)
- [x] UI implementada
- [x] API routes implementadas
- [x] Servicios refactorizados
- [x] Documentación creada

Durante Deployment:
- [ ] Ejecutar `npx prisma migrate deploy`
- [ ] Restart PM2 con `--update-env`
- [ ] Verificar variables cargadas
- [ ] Test de health check

Post-Deployment:
- [ ] Test de UI de integraciones
- [ ] Test de upload (S3)
- [ ] Test de firma (Signaturit)
- [ ] Test de IA (Claude)
- [ ] Verificar logs (sin errores)

---

**Última actualización**: 4 de Enero de 2026  
**Versión**: 1.0.0  
**Autor**: Equipo Inmova
