## ✍️ CONFIGURACIÓN SIGNATURIT - INMOVA APP

## 📋 ¿QUÉ ES SIGNATURIT?

Signaturit es un proveedor certificado de firma electrónica que cumple con:
- **eIDAS** (Reglamento UE n° 910/2014 de identificación electrónica)
- **Ley 6/2020** de Servicios Electrónicos de Confianza (España)
- **Validez legal** en toda la Unión Europea

**Tipos de firma soportados**:
1. ✅ **Firma Simple**: Email/SMS OTP (suficiente para contratos privados)
2. ✅ **Firma Avanzada**: Certificado digital (mayor seguridad)
3. ✅ **Firma Cualificada**: Máximo nivel legal (equivalente a firma manuscrita)

**En Inmova lo usamos para**:
- ✅ Contratos de arrendamiento
- ✅ Contratos de compraventa
- ✅ Documentos legales
- ✅ Acuerdos con inquilinos
- ✅ Contratos con proveedores

---

## 💰 COSTOS

### Pricing Signaturit (España)

```
Plan Starter:
• €39/mes
• 10 firmas incluidas
• Firma simple
• Email + SMS OTP
• 1 usuario

Plan Business:
• €99/mes
• 50 firmas incluidas
• Firma simple + avanzada
• Multi-usuario (5 usuarios)
• API access
• Webhooks

Plan Enterprise:
• €299/mes
• 200 firmas incluidas
• Todas las firmas (incluye cualificada)
• Multi-usuario ilimitado
• API access
• Webhooks
• Soporte prioritario

Firmas adicionales:
• €0.50 - €2.00 por firma (según volumen)
```

### Proyección de Costos

```
Escenario 1: Pequeño (20 contratos/mes)
• Plan Starter: €39/mes
• 10 firmas adicionales × €1 = €10/mes
• TOTAL: €49/mes = €588/año

Escenario 2: Medio (50 contratos/mes)
• Plan Business: €99/mes
• 0 firmas adicionales (incluidas)
• TOTAL: €99/mes = €1,188/año

Escenario 3: Grande (200 contratos/mes)
• Plan Enterprise: €299/mes
• 0 firmas adicionales (incluidas)
• TOTAL: €299/mes = €3,588/año

ROI:
• Sin Signaturit: Tiempo manual + impresión + escaneo + archivo físico
• Con Signaturit: 100% digital + archivo automático 10 años + validez legal
• Ahorro: ~5-10 min por contrato × 20 contratos = 2 horas/mes
```

---

## 🚀 PASO 1: CREAR CUENTA SIGNATURIT

### 1.1. Registro

1. **Ir a**: https://www.signaturit.com/es
2. **Click**: "Prueba gratis" o "Registrarse"
3. **Completar formulario**:
   ```
   Email: admin@inmovaapp.com
   Empresa: Inmova App
   País: España
   Teléfono: +34 XXX XXX XXX
   ```
4. **Verificar email**: Click en link de confirmación

### 1.2. Trial Gratuito

Signaturit ofrece **30 días gratis** con:
- 5 firmas incluidas
- Acceso completo a la plataforma
- API access
- Soporte

---

## 🔑 PASO 2: OBTENER API KEY

### 2.1. Dashboard de Signaturit

1. **Login**: https://app.signaturit.com/login
2. **Ir a**: Settings → API Keys (o Configuración → Claves API)
3. **Ver dos ambientes**:
   - **Sandbox** (testing, no tiene validez legal)
   - **Production** (real, tiene validez legal)

### 2.2. Generar API Key

#### Para Desarrollo (Sandbox)

1. **Click**: "Generate API Key" en sección Sandbox
2. **Copiar key**: Comienza con `prod_...` o similar
3. **Guardar** en lugar seguro

```
Ejemplo:
sandbox_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

#### Para Producción

⚠️ **Solo cuando estés listo para producción**

1. **Click**: "Generate API Key" en sección Production
2. **Copiar key**: Comienza con `prod_...`
3. **Guardar** en lugar seguro (NO commitear a Git)

```
Ejemplo:
prod_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 2.3. Webhook Secret (Opcional pero Recomendado)

1. **Ir a**: Settings → Webhooks
2. **Click**: "Add webhook"
3. **URL**: `https://inmovaapp.com/api/webhooks/signaturit`
4. **Eventos a subscribir**:
   - ✅ `signature_ready`
   - ✅ `signature_completed`
   - ✅ `signature_declined`
   - ✅ `signature_expired`
   - ✅ `signature_canceled`
5. **Copiar Webhook Secret** (para verificar firma)

---

## ⚙️ PASO 3: CONFIGURAR EN INMOVA APP

### 3.1. Variables de Entorno

Añadir al `.env.production` (servidor):

```env
# Signaturit Configuration
SIGNATURIT_API_KEY=prod_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SIGNATURIT_ENV=production
SIGNATURIT_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Para desarrollo (`.env.local`):

```env
# Signaturit Configuration (Sandbox)
SIGNATURIT_API_KEY=sandbox_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SIGNATURIT_ENV=sandbox
SIGNATURIT_WEBHOOK_SECRET=whsec_test_xxxxxxxxxxxxxxxx
```

⚠️ **NUNCA** commitear estas credenciales a Git

### 3.2. Configurar en Servidor (SSH)

```bash
ssh root@157.180.119.236

# Editar .env.production
cd /opt/inmova-app
nano .env.production

# Añadir variables Signaturit:
SIGNATURIT_API_KEY=prod_tu_api_key_aqui
SIGNATURIT_ENV=production
SIGNATURIT_WEBHOOK_SECRET=whsec_tu_webhook_secret_aqui

# Guardar (Ctrl+O, Enter, Ctrl+X)

# Reiniciar PM2
pm2 restart inmova-app --update-env

# Verificar que cargó
pm2 env inmova-app | grep SIGNATURIT
```

### 3.3. Configurar Webhook en Signaturit

1. **Dashboard Signaturit** → Settings → Webhooks
2. **Add webhook**:
   ```
   URL: https://inmovaapp.com/api/webhooks/signaturit
   Method: POST
   Events: Todos los de signature_*
   ```
3. **Save**

---

## 🧪 PASO 4: TESTING

### Test 1: Verificar Configuración

```typescript
// test-signaturit.ts
import { SignaturitService } from '@/lib/signaturit-service';

async function test() {
  const configured = SignaturitService.isConfigured();
  console.log('Signaturit Configured:', configured);
  
  if (!configured) {
    console.error('SIGNATURIT_API_KEY not set');
    return;
  }
  
  console.log('✅ Signaturit ready to use');
}

test();
```

### Test 2: Crear Firma de Prueba

```bash
# Via API
curl -X POST https://inmovaapp.com/api/signatures/create \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "contractId": "contract_id_aqui",
    "signers": [{
      "email": "test@example.com",
      "name": "Test User"
    }],
    "options": {
      "subject": "Test de Firma",
      "message": "Por favor, firma este documento de prueba",
      "expirationDays": 7
    }
  }'

# Response esperado:
{
  "success": true,
  "signatureId": "sig_xxxxx",
  "signUrl": "https://app.signaturit.com/sign/sig_xxxxx",
  "message": "Solicitud de firma creada..."
}
```

### Test 3: Flujo Completo en la App

1. **Ir a**: https://inmovaapp.com/dashboard/contracts
2. **Seleccionar contrato**: Click en contrato en estado "Borrador"
3. **Click**: "Enviar para firma"
4. **Añadir firmantes**:
   ```
   Firmante 1: Propietario (tu email)
   Firmante 2: Inquilino (otro email de prueba)
   ```
5. **Opciones**:
   - Tipo de firma: Simple
   - Días para firmar: 7
   - Verificación email: Sí
6. **Click**: "Enviar"
7. **Verificar**:
   - ✅ Email recibido en ambos firmantes
   - ✅ Link de firma funciona
   - ✅ Proceso de firma completo
   - ✅ Documento firmado visible en la app
   - ✅ Certificado de firma disponible

### Test 4: Webhook

1. **Firmar documento de prueba**
2. **Ver logs del servidor**:
   ```bash
   pm2 logs inmova-app | grep Signaturit
   ```
3. **Verificar eventos recibidos**:
   ```
   [Signaturit Webhook] Event received: signature_ready
   [Signaturit Webhook] Event received: signature_completed
   ```

---

## 🔐 SEGURIDAD

### Mejores Prácticas

1. **✅ NO usar API key del root user**
   - Crear sub-usuarios si es posible

2. **✅ Rotación de credenciales**
   ```bash
   # Cada 90 días, generar nueva API key
   # Dashboard → API Keys → Generate new → Copiar → Actualizar .env → Delete old key
   ```

3. **✅ Webhook Secret**
   - Siempre verificar firma HMAC en webhooks
   - Protege contra ataques de replay

4. **✅ HTTPS obligatorio**
   - Signaturit requiere HTTPS para webhooks

5. **✅ Logs de auditoría**
   - Todas las firmas se registran en `auditLog`

### Verificación de Firma en Webhook

El código ya implementa verificación:

```typescript
// lib/signaturit-service.ts
export function verifyWebhookSignature(
  payload: string,
  signature: string
): boolean {
  const webhookSecret = process.env.SIGNATURIT_WEBHOOK_SECRET || '';
  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(payload)
    .digest('hex');
  
  return signature === expectedSignature;
}
```

---

## 📊 CASOS DE USO

### Caso 1: Contrato de Arrendamiento

```typescript
// Crear firma para contrato de alquiler
const result = await SignaturitService.createSignature(
  contractPdfBuffer,
  'contrato-alquiler-calle-mayor-123.pdf',
  [
    { email: 'propietario@example.com', name: 'Juan Propietario' },
    { email: 'inquilino@example.com', name: 'María Inquilino' },
  ],
  {
    type: SignatureType.SIMPLE,
    subject: 'Firma de Contrato de Arrendamiento - Calle Mayor 123',
    message: 'Por favor, revisa y firma el contrato. Si tienes dudas, contáctanos.',
    expirationDays: 14,
    requireEmailOtp: true,
  }
);
```

### Caso 2: Firma con Verificación SMS

```typescript
const result = await SignaturitService.createSignature(
  contractPdfBuffer,
  'contrato-importante.pdf',
  [
    {
      email: 'inquilino@example.com',
      name: 'María Inquilino',
      phone: '+34612345678',
      requireSmsVerification: true, // ← SMS OTP obligatorio
    },
  ],
  {
    type: SignatureType.ADVANCED,
    subject: 'Contrato Importante - Verificación SMS Requerida',
    expirationDays: 7,
  }
);
```

### Caso 3: Firma Cualificada (Máximo Nivel Legal)

```typescript
const result = await SignaturitService.createSignature(
  contractPdfBuffer,
  'contrato-compraventa.pdf',
  [
    { email: 'vendedor@example.com', name: 'Vendedor' },
    { email: 'comprador@example.com', name: 'Comprador' },
  ],
  {
    type: SignatureType.QUALIFIED, // ← Firma cualificada
    subject: 'Contrato de Compraventa - Firma Cualificada',
    expirationDays: 30,
  }
);
```

---

## 🚨 TROUBLESHOOTING

### Error: "SIGNATURIT_API_KEY not configured"

**Causa**: Variable de entorno no está configurada

**Solución**:
```bash
# Verificar variable
echo $SIGNATURIT_API_KEY

# Si está vacía, configurar en .env.production
# Luego restart PM2
pm2 restart inmova-app --update-env
```

### Error: "Invalid API key"

**Causa**: API key incorrecta o expirada

**Solución**:
1. Dashboard Signaturit → API Keys
2. Verificar que la key sea correcta
3. Generar nueva si es necesario
4. Actualizar `.env.production`

### Error: "Signature creation failed"

**Causa**: PDF inválido o firmantes incorrectos

**Solución**:
```bash
# Ver logs detallados
pm2 logs inmova-app | grep Signaturit

# Verificar:
# - PDF es válido
# - Emails de firmantes son correctos
# - Teléfonos en formato internacional (+34...)
```

### Webhook no recibe eventos

**Causa**: URL incorrecta o no HTTPS

**Solución**:
1. Verificar webhook URL en Dashboard: `https://inmovaapp.com/api/webhooks/signaturit`
2. Verificar que la URL sea HTTPS (no HTTP)
3. Test manual:
   ```bash
   curl -X POST https://inmovaapp.com/api/webhooks/signaturit \
     -H "Content-Type: application/json" \
     -d '{"event":"signature_completed","data":{"id":"test"}}'
   ```

### Firma no llega por email

**Causa**: Email en spam o email incorrecto

**Solución**:
1. Verificar carpeta de spam
2. Verificar email del firmante es correcto
3. Reenviar recordatorio:
   ```typescript
   await SignaturitService.sendReminder(signatureId);
   ```

---

## 📈 MONITORING Y MÉTRICAS

### Ver Firmas en Dashboard

1. **Dashboard Signaturit** → Signatures
2. **Filtros**:
   - Status: Completed, Pending, Declined
   - Date range
   - Signer email

### Métricas Clave

```
Métricas a trackear:
• Firmas enviadas/mes
• Firmas completadas/mes
• Tasa de conversión (completadas / enviadas)
• Tiempo promedio de firma
• Firmas rechazadas (analizar por qué)
• Firmas expiradas (reducir días de expiración?)
```

### Alertas

Configurar alertas para:
- Firmas rechazadas (investigar motivo)
- Firmas expiradas (aumentar días?)
- Errores en webhooks (verificar logs)

---

## 💡 MEJORES PRÁCTICAS

### 1. Mensajes Claros

```typescript
// ❌ MAL
subject: 'Firma esto'
message: 'Firma el documento'

// ✅ BIEN
subject: 'Contrato de Arrendamiento - Calle Mayor 123'
message: `Hola María,

Adjunto el contrato de arrendamiento para la propiedad en Calle Mayor 123.

Por favor, revisa todos los términos. Si tienes dudas, contáctanos al +34 600 000 000.

Una vez firmado, recibirás una copia por email.

Gracias,
Equipo Inmova`
```

### 2. Días de Expiración Adecuados

```typescript
// Contratos sencillos: 7 días
expirationDays: 7

// Contratos complejos: 14-30 días
expirationDays: 14

// Urgentes: 3 días
expirationDays: 3
```

### 3. Recordatorios Automáticos

```typescript
// Activar siempre
sendReminders: true

// Signaturit enviará recordatorios automáticos:
// - Día 3
// - Día 7
// - 2 días antes de expirar
```

### 4. Verificación Apropiada

```typescript
// Contratos estándar: Email OTP (suficiente)
requireEmailOtp: true

// Contratos importantes: Email + SMS
requireSmsVerification: true

// Contratos muy importantes: Firma avanzada/cualificada
type: SignatureType.ADVANCED
```

---

## 🎯 RESUMEN

### Checklist Configuración

- [ ] Cuenta Signaturit creada
- [ ] API Key generada (production)
- [ ] Webhook configurado
- [ ] Webhook Secret obtenido
- [ ] Variables en `.env.production` configuradas
- [ ] PM2 reiniciado con `--update-env`
- [ ] Test de firma exitoso
- [ ] Webhook recibiendo eventos
- [ ] Documento firmado visible en la app
- [ ] Certificado descargable

### Variables Requeridas

```env
SIGNATURIT_API_KEY=prod_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SIGNATURIT_ENV=production
SIGNATURIT_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Costo Estimado

```
Plan Starter (20 contratos/mes): €49/mes
Plan Business (50 contratos/mes): €99/mes
Plan Enterprise (200 contratos/mes): €299/mes

ROI: Muy alto (ahorro tiempo + validez legal + archivo 10 años)
```

---

## 📞 SOPORTE

Si tienes problemas:

1. **Verificar logs**: `pm2 logs inmova-app | grep Signaturit`
2. **Test configuración**: `SignaturitService.isConfigured()`
3. **Dashboard Signaturit**: Ver estado de firmas
4. **Soporte Signaturit**: support@signaturit.com

---

**Última actualización**: 4 de enero de 2026  
**Status**: ✅ Documentación completa  
**Prioridad**: 🔴 ALTA (requisito legal para contratos)
