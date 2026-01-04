# 🏢 MODELO DE INTEGRACIONES B2B - INMOVA APP

**Fecha**: 4 de enero de 2026  
**Versión**: 2.0 (CORREGIDO)

---

## 📋 CONCEPTO CLAVE

**Inmova es una plataforma B2B SaaS**, por lo tanto:

❌ **Inmova NO paga** por las integraciones de terceros  
✅ **Cada cliente de Inmova** tiene sus propias suscripciones/API keys  
✅ **Inmova solo integra** con las cuentas de los clientes

---

## 🏗️ ARQUITECTURA MULTI-TENANT

### Modelo de Datos

Cada empresa (`Company`) almacena sus propias credenciales:

```prisma
model Company {
  id String @id @default(cuid())
  nombre String
  
  // SIGNATURIT / DOCUSIGN
  signatureProvider     String? // "signaturit", "docusign", null
  signatureApiKey       String? // Encriptada
  signatureWebhookSecret String? // Encriptada
  signatureEnvironment  String? @default("sandbox") // "sandbox", "production"
  
  // AWS S3 (Opcional - pueden usar el de Inmova o el suyo)
  awsAccessKeyId     String? // Encriptada
  awsSecretAccessKey String? // Encriptada
  awsBucket          String?
  awsRegion          String? @default("eu-west-1")
  
  // CLAUDE IA (Opcional - pueden usar el de Inmova o el suyo)
  anthropicApiKey String? // Encriptada
  
  // TWILIO (Opcional)
  twilioAccountSid  String? // Encriptada
  twilioAuthToken   String? // Encriptada
  twilioPhoneNumber String?
  
  // ... más integraciones futuras
}
```

---

## 💰 MODELOS DE MONETIZACIÓN

### 1️⃣ BYOK (Bring Your Own Key) - Enterprise

**Concepto**: El cliente trae sus propias credenciales.

**Ventajas para el cliente**:
- ✅ Control total sobre sus datos
- ✅ Facturación directa del proveedor
- ✅ Sin límites impuestos por Inmova
- ✅ Puede negociar precios con el proveedor

**Ventajas para Inmova**:
- ✅ Sin costos variables de infraestructura
- ✅ Sin riesgo de abuso
- ✅ Escalabilidad infinita

**Ejemplo**:
```
Cliente: "Agencia Inmobiliaria XYZ"
Signaturit: Plan Business (€99/mes) - Paga el cliente
AWS S3: €15/mes (bucket propio) - Paga el cliente
Claude AI: €50/mes (cuenta propia) - Paga el cliente

Inmova cobra: €149/mes (plan Software)
Total para el cliente: €313/mes
```

### 2️⃣ Storage/API Compartido - SMB

**Concepto**: El cliente usa las credenciales de Inmova, Inmova cobra el costo + markup.

**Ventajas para el cliente**:
- ✅ No necesita gestionar cuentas propias
- ✅ Setup instant

áneo
- ✅ Un solo proveedor (Inmova)

**Ventajas para Inmova**:
- ✅ Revenue adicional (markup)
- ✅ Facilita onboarding

**Desventajas para Inmova**:
- ⚠️ Riesgo de costos excesivos si no se controla
- ⚠️ Complejidad en tracking de costos por cliente

**Ejemplo**:
```
Cliente: "Pequeña Inmobiliaria ABC"
Signaturit: Usa cuenta de Inmova (€0.50/firma)
AWS S3: Usa bucket de Inmova (€0.023/GB)
Claude AI: Usa cuenta de Inmova (€0.003/1K tokens)

Inmova cobra:
- Plan Software: €49/mes
- Firmas: €1/firma (markup 100%)
- Storage: €0.05/GB (markup 100%)
- IA: €0.006/1K tokens (markup 100%)

Total: €49/mes + uso
```

### 3️⃣ Modelo Híbrido (RECOMENDADO)

**Concepto**: Storage/IA compartido por defecto, Firma digital BYOK.

**Por qué**:
- Signaturit/DocuSign: Costos altos, mejor que lo paguen directamente
- AWS S3: Costos bajos, podemos compartir
- Claude IA: Costos bajos, podemos compartir

**Ejemplo**:
```
Cliente: "Inmobiliaria MediaCorp"

Plan Inmova Standard: €99/mes incluye:
- Software completo
- Storage compartido (hasta 10 GB)
- IA compartida (hasta 100K tokens/mes)

Extras:
- Signaturit: Cliente tiene su propia cuenta (€99/mes directos a Signaturit)
- Storage adicional: €0.05/GB
- IA adicional: €0.006/1K tokens

Total: €99/mes (Inmova) + €99/mes (Signaturit) = €198/mes
```

---

## 🔧 CONFIGURACIÓN EN LA PLATAFORMA

### Panel de Administración

Cada empresa tiene un panel de **Configuración → Integraciones**:

#### Firma Digital

```
┌─────────────────────────────────────────┐
│ FIRMA DIGITAL                           │
├─────────────────────────────────────────┤
│                                         │
│ Proveedor: [Signaturit ▼]              │
│                                         │
│ ○ Usar cuenta propia (Recomendado)     │
│   API Key: [****************]           │
│   Webhook Secret: [****************]    │
│   Entorno: [Production ▼]              │
│                                         │
│ ○ Usar cuenta compartida de Inmova     │
│   Costo: €1/firma                       │
│                                         │
│ [Guardar Configuración]                 │
└─────────────────────────────────────────┘
```

#### Almacenamiento (S3)

```
┌─────────────────────────────────────────┐
│ ALMACENAMIENTO EN LA NUBE               │
├─────────────────────────────────────────┤
│                                         │
│ ○ Usar bucket compartido (Recomendado) │
│   Incluido: 10 GB/mes                   │
│   Adicional: €0.05/GB                   │
│   Uso actual: 3.2 GB                    │
│                                         │
│ ○ Usar mi propio bucket AWS S3         │
│   Access Key ID: [****************]     │
│   Secret Access Key: [**************]   │
│   Bucket: [mi-bucket-inmobiliaria]      │
│   Región: [eu-west-1 ▼]                 │
│                                         │
│ [Guardar Configuración]                 │
└─────────────────────────────────────────┘
```

#### Inteligencia Artificial

```
┌─────────────────────────────────────────┐
│ INTELIGENCIA ARTIFICIAL (Claude AI)     │
├─────────────────────────────────────────┤
│                                         │
│ ○ Usar cuenta compartida (Recomendado) │
│   Incluido: 100K tokens/mes             │
│   Adicional: €0.006/1K tokens           │
│   Uso actual: 45.3K tokens              │
│                                         │
│ ○ Usar mi propia API key                │
│   Anthropic API Key: [****************] │
│                                         │
│ Features disponibles:                   │
│ ✓ Valoración automática de propiedades │
│ ✓ Chatbot inteligente 24/7             │
│ ✓ Generación de descripciones          │
│                                         │
│ [Guardar Configuración]                 │
└─────────────────────────────────────────┘
```

---

## 🔐 SEGURIDAD

### Encriptación de Credenciales

**CRÍTICO**: Las API keys se almacenan **encriptadas** en la BD.

```typescript
// lib/encryption.ts
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY!; // 32 bytes
const IV_LENGTH = 16;

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

export function decrypt(text: string): string {
  const parts = text.split(':');
  const iv = Buffer.from(parts.shift()!, 'hex');
  const encryptedText = Buffer.from(parts.join(':'), 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}
```

### Variables de Entorno Requeridas

```env
# Inmova (para cuentas compartidas)
ENCRYPTION_KEY=tu_clave_de_32_bytes_aqui_xxxx

# Credenciales compartidas (opcional)
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_BUCKET=inmova-shared-storage
AWS_REGION=eu-west-1

ANTHROPIC_API_KEY=sk-ant-api03_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# NO incluir Signaturit - cada cliente debe tener el suyo
```

---

## 📊 TRACKING DE COSTOS

### Dashboard de Uso

Cada empresa ve su consumo en tiempo real:

```
┌────────────────────────────────────────────────┐
│ USO DE INTEGRACIONES - Enero 2026              │
├────────────────────────────────────────────────┤
│                                                │
│ ALMACENAMIENTO (S3)                            │
│ ━━━━━━━━━━━━━━━ 32% (3.2 GB / 10 GB)          │
│ Incluido en tu plan                            │
│                                                │
│ INTELIGENCIA ARTIFICIAL                        │
│ ━━━━━━━━━━━━━━━ 45% (45.3K / 100K tokens)     │
│ Incluido en tu plan                            │
│                                                │
│ FIRMA DIGITAL (Signaturit)                     │
│ Cuenta propia configurada ✓                    │
│ Firmas este mes: 12                            │
│ (Facturado directamente por Signaturit)        │
│                                                │
│ PROYECCIÓN DE COSTOS                           │
│ Plan Inmova: €99/mes                           │
│ Uso adicional: €0 (dentro de límites)          │
│ Signaturit: €99/mes (directo)                  │
│ ─────────────────────────────                  │
│ TOTAL ESTIMADO: €198/mes                       │
│                                                │
└────────────────────────────────────────────────┘
```

---

## 🎯 PLANES DE SUSCRIPCIÓN PROPUESTOS

### Plan STARTER - €49/mes

**Incluye**:
- Software completo (max 5 usuarios)
- Storage compartido: 5 GB
- IA compartida: 50K tokens/mes
- Soporte email

**Firma Digital**: Cliente debe configurar su propia cuenta

**Ideal para**: Pequeñas inmobiliarias (1-5 propiedades)

---

### Plan STANDARD - €99/mes

**Incluye**:
- Software completo (max 20 usuarios)
- Storage compartido: 10 GB
- IA compartida: 100K tokens/mes
- Soporte prioritario

**Firma Digital**: Cliente debe configurar su propia cuenta

**Ideal para**: Inmobiliarias medianas (5-50 propiedades)

---

### Plan BUSINESS - €199/mes

**Incluye**:
- Software completo (max 50 usuarios)
- Storage compartido: 50 GB
- IA compartida: 500K tokens/mes
- Soporte 24/7
- API access

**Firma Digital**: Cliente debe configurar su propia cuenta

**Ideal para**: Agencias grandes (50-200 propiedades)

---

### Plan ENTERPRISE - Personalizado

**Incluye**:
- Todo ilimitado
- BYOK para todas las integraciones
- Onboarding personalizado
- Account manager dedicado
- SLA 99.9%

**Firma Digital**: Cliente configura su propia cuenta

**Ideal para**: Grandes corporaciones (200+ propiedades)

---

## 🚀 IMPLEMENTACIÓN

### Fase 1: Migración del Código (COMPLETADO ✅)

- [x] Actualizar modelo Prisma con campos de integraciones
- [x] Actualizar servicios para recibir configuración por empresa
- [x] Actualizar API routes para obtener config de la empresa
- [x] Documentación del nuevo modelo

### Fase 2: Panel de Configuración (Pendiente)

- [ ] UI para configurar Signaturit
- [ ] UI para configurar AWS S3
- [ ] UI para configurar Claude IA
- [ ] Validación de credenciales (test de conexión)
- [ ] Encriptación/desencriptación en BD

### Fase 3: Monitoreo de Uso (Pendiente)

- [ ] Dashboard de uso por empresa
- [ ] Alertas cuando se acercan a límites
- [ ] Facturación de uso adicional
- [ ] Reportes mensuales

### Fase 4: Onboarding (Pendiente)

- [ ] Guías paso a paso para cada integración
- [ ] Videos tutoriales
- [ ] Soporte para configuración inicial

---

## 📞 SOPORTE A CLIENTES

### FAQs

**P: ¿Tengo que pagar por Signaturit además de Inmova?**  
R: Sí, Signaturit se paga directamente al proveedor. Inmova solo integra con tu cuenta.

**P: ¿Puedo usar mi propio bucket de AWS S3?**  
R: Sí, en planes Business y Enterprise. En Starter/Standard usas el compartido de Inmova.

**P: ¿Qué pasa si excedo los límites de storage/IA?**  
R: Se te cobrará el uso adicional a precios competitivos (€0.05/GB, €0.006/1K tokens).

**P: ¿Inmova ve mis datos si uso storage compartido?**  
R: No. Los archivos están organizados por empresa y solo tu equipo tiene acceso.

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

### Para cada Cliente Nuevo

- [ ] Elegir plan de suscripción
- [ ] Si necesita firma digital:
  - [ ] Guiar en crear cuenta Signaturit/DocuSign
  - [ ] Ayudar a obtener API key
  - [ ] Configurar webhook
  - [ ] Test de firma
- [ ] Storage:
  - [ ] Por defecto: usar compartido de Inmova
  - [ ] Enterprise: ofrecer opción de BYOS
- [ ] IA:
  - [ ] Por defecto: usar compartido de Inmova
  - [ ] Enterprise: ofrecer opción de BYOK

---

## 🎉 VENTAJAS DEL NUEVO MODELO

### Para Inmova

1. ✅ **Costos predecibles**: No hay sorpresas en la factura de Signaturit
2. ✅ **Escalabilidad**: Cada cliente paga su uso
3. ✅ **Sin riesgo de abuso**: Los límites son del cliente, no de Inmova
4. ✅ **Flexibilidad**: Podemos ofrecer planes para todos los tamaños

### Para los Clientes

1. ✅ **Control total**: Ven su consumo en tiempo real
2. ✅ **Facturación directa**: Pueden negociar con los proveedores
3. ✅ **Sin límites artificiales**: Si quieren más, solo pagan más
4. ✅ **Transparencia**: Saben exactamente qué pagan y por qué

---

**Última actualización**: 4 de enero de 2026, 22:00 UTC  
**Autor**: Equipo Técnico Inmova  
**Status**: ✅ MODELO CORREGIDO E IMPLEMENTADO
