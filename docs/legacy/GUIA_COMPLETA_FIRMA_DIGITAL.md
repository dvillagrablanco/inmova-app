# 🔐 GUÍA COMPLETA - FIRMA DIGITAL

**Fecha**: 3 de enero de 2026  
**Estado**: Credenciales parciales configuradas

---

## 📊 ESTADO ACTUAL

### ✅ Configurado

**DocuSign** (Parcial):
- ✅ DOCUSIGN_INTEGRATION_KEY
- ✅ DOCUSIGN_USER_ID
- ✅ DOCUSIGN_ACCOUNT_ID  
- ✅ DOCUSIGN_BASE_PATH
- ❌ DOCUSIGN_PRIVATE_KEY (FALTA)

**Signaturit**:
- ❌ No configurado (requiere cuenta)

**Modo Actual**: DEMO (funciona para testing UI)

---

## 🎯 OPCIONES DE FIRMA DIGITAL

### Opción A: DocuSign (Ya parcialmente configurado) ⭐

**Ventajas**:
- ✅ Credenciales ya obtenidas
- ✅ Cuenta ya creada (dvillagra@vidaroinversiones.com)
- ✅ Solo falta Private Key
- ✅ Cumple eIDAS (UE)
- ✅ Reconocido globalmente

**Desventajas**:
- ⚠️ Más caro (~€100/mes)
- ⚠️ Setup más complejo

**Recomendación**: ⭐ Completar configuración (solo falta 1 paso)

### Opción B: Signaturit (Recomendado para Europa)

**Ventajas**:
- ✅ Más económico (~€50/mes, 20 firmas)
- ✅ Cumple eIDAS (UE)
- ✅ Setup más simple
- ✅ Soporte en español

**Desventajas**:
- ⚠️ Requiere crear cuenta nueva
- ⚠️ Menos conocido globalmente

**Recomendación**: ⭐⭐ Mejor para España/Europa

---

## 🔑 OPCIÓN A: COMPLETAR DOCUSIGN

### Credenciales Actuales

```env
✅ DOCUSIGN_INTEGRATION_KEY=c0a3e377-148b-4895-9095-b3e8dbef3d88
✅ DOCUSIGN_USER_ID=5f857d75-cd36-4fad-812b-3ff1be80d9a9
✅ DOCUSIGN_ACCOUNT_ID=e59b0a7b-966d-42e0-bcd9-169855c046
✅ DOCUSIGN_BASE_PATH=https://demo.docusign.net/restapi
❌ DOCUSIGN_PRIVATE_KEY=FALTA
```

### Paso 1: Generar Private Key

1. **Acceder a DocuSign**:
   ```
   URL: https://admindemo.docusign.com/
   Usuario: dvillagra@vidaroinversiones.com
   Password: (tu password de DocuSign)
   ```

2. **Navegar a Apps and Keys**:
   - Click en tu avatar (arriba derecha)
   - Settings → Integrations
   - Apps and Keys
   - Buscar: "INMOVA Digital Signature"

3. **Generar RSA Key Pair**:
   - Sección "Service Integration"
   - Click en "Actions"
   - Seleccionar "Generate RSA"
   - Click "Generate"
   - ⚠️ **COPIAR** la Private Key que aparece

4. **Copiar Private Key**:
   ```
   Formato:
   -----BEGIN RSA PRIVATE KEY-----
   MIIEowIBAAKCAQEA...
   (múltiples líneas)
   ...
   -----END RSA PRIVATE KEY-----
   ```

### Paso 2: Configurar en Servidor

```bash
# Conectar al servidor
ssh root@157.180.119.236

# Editar .env.production
nano /opt/inmova-app/.env.production

# Buscar la línea que dice:
# ⚠️ FALTA: DOCUSIGN_PRIVATE_KEY

# Añadir DESPUÉS de esa línea:
DOCUSIGN_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----
MIIEowIBAAKCAQEA... (pegar TODO el contenido de la key aquí)
-----END RSA PRIVATE KEY-----"

# IMPORTANTE: Todo en UNA línea, o usar formato multilínea con comillas

# Guardar: Ctrl+X, Y, Enter

# Reiniciar aplicación
pm2 restart inmova-app --update-env

# Verificar
pm2 logs inmova-app --lines 20
```

### Paso 3: Verificar Funcionamiento

```bash
# Test desde el servidor
curl -X POST http://localhost:3000/api/contracts/test_contract/sign \
  -H "Cookie: next-auth.session-token=..." \
  -H "Content-Type: application/json" \
  -d '{
    "signatories": [
      {"email":"test@example.com","name":"Test","role":"TENANT"}
    ]
  }'

# Debería retornar:
# {"provider":"docusign","signatureId":"..."}
```

### Paso 4: Autorizar JWT (IMPORTANTE)

DocuSign requiere una autorización inicial:

1. **URL de autorización** (ejecutar UNA VEZ):
   ```
   https://account-d.docusign.com/oauth/auth?response_type=code&scope=signature%20impersonation&client_id=c0a3e377-148b-4895-9095-b3e8dbef3d88&redirect_uri=https://inmovaapp.com/api/webhooks/docusign
   ```

2. **Abrir en navegador**:
   - Login con dvillagra@vidaroinversiones.com
   - Click "Allow Access"
   - Redirigirá (puede dar error, es normal)
   - ✅ Autorización guardada

3. **Verificar en código** (ya implementado):
   ```typescript
   // lib/digital-signature-service.ts
   // Detecta automáticamente si DocuSign está configurado
   ```

---

## 🔑 OPCIÓN B: CONFIGURAR SIGNATURIT

### Paso 1: Crear Cuenta

1. **Registrarse**:
   ```
   URL: https://www.signaturit.com/es/
   Click: "Prueba gratis" o "Empezar ahora"
   ```

2. **Completar registro**:
   - Email: tu-email@inmova.com
   - Empresa: Inmova
   - Teléfono: +34...
   - Seleccionar: Plan Professional (~€50/mes)

3. **Verificar email** y completar onboarding

### Paso 2: Obtener API Key

1. **Acceder al Dashboard**:
   ```
   URL: https://app.signaturit.com/
   Login con tus credenciales
   ```

2. **Ir a API**:
   - Menú lateral → "API" o "Configuración"
   - Sección "API Keys"
   - Click "Generar nueva API Key"

3. **Copiar API Key**:
   ```
   Formato: sk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

### Paso 3: Configurar en Servidor

```bash
# Conectar al servidor
ssh root@157.180.119.236

# Editar .env.production
nano /opt/inmova-app/.env.production

# Añadir al final:
# === SIGNATURIT FIRMA DIGITAL ===
SIGNATURIT_API_KEY=sk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SIGNATURIT_ENVIRONMENT=production

# Guardar: Ctrl+X, Y, Enter

# Reiniciar aplicación
pm2 restart inmova-app --update-env

# Verificar logs
pm2 logs inmova-app --lines 20
```

### Paso 4: Verificar Funcionamiento

```bash
# Test básico
curl -X POST http://localhost:3000/api/contracts/test_contract/sign \
  -H "Cookie: next-auth.session-token=..." \
  -H "Content-Type: application/json" \
  -d '{
    "signatories": [
      {"email":"test@example.com","name":"Test","role":"TENANT"}
    ]
  }'

# Debería retornar:
# {"provider":"signaturit","signatureId":"..."}
```

---

## 🔍 DETECCIÓN AUTOMÁTICA DE PROVEEDOR

El código ya implementado detecta automáticamente qué proveedor está configurado:

```typescript
// app/api/contracts/[id]/sign/route.ts

const getActiveProvider = (): 'signaturit' | 'docusign' | 'demo' => {
  if (process.env.SIGNATURIT_API_KEY) return 'signaturit';
  if (process.env.DOCUSIGN_INTEGRATION_KEY) return 'docusign';
  return 'demo';
};
```

**Prioridad**:
1. Signaturit (si hay SIGNATURIT_API_KEY)
2. DocuSign (si hay DOCUSIGN_INTEGRATION_KEY)
3. Demo (si no hay ninguno)

---

## 🧪 TESTING

### Test en Modo Demo (Actual)

```bash
# Enviar contrato de prueba
curl -X POST https://inmovaapp.com/api/contracts/contract_123/sign \
  -H "Cookie: YOUR_SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "signatories": [
      {
        "email": "test1@example.com",
        "name": "Propietario Test",
        "role": "LANDLORD"
      },
      {
        "email": "test2@example.com",
        "name": "Inquilino Test",
        "role": "TENANT"
      }
    ],
    "expirationDays": 30
  }'

# Respuesta esperada (modo demo):
{
  "success": true,
  "provider": "demo",
  "signatureId": "demo_1704295200000",
  "signatureUrl": "https://demo.firma-digital.com/...",
  "message": "⚠️ Modo DEMO - Configura credenciales para producción"
}
```

### Test con DocuSign (Cuando esté configurado)

```bash
# Mismo request
# Respuesta esperada:
{
  "success": true,
  "provider": "docusign",
  "signatureId": "env_abc123xyz",
  "signatureUrl": "https://demo.docusign.net/signing/...",
  "message": "Documento enviado para firma"
}
```

### Test con Signaturit (Cuando esté configurado)

```bash
# Mismo request
# Respuesta esperada:
{
  "success": true,
  "provider": "signaturit",
  "signatureId": "sig_xyz789abc",
  "signatureUrl": "https://app.signaturit.com/document/...",
  "message": "Documento enviado para firma"
}
```

---

## 💰 COMPARATIVA DE COSTOS

### DocuSign

```
Plan Developer (Testing): Gratis
Plan Professional: €100/mes aprox
  - 100 sobres/mes
  - Usuarios ilimitados
  - eIDAS compliant

Adicional: €1-2 por sobre extra
```

### Signaturit

```
Plan Professional: €50/mes
  - 20 firmas incluidas
  - Usuarios ilimitados
  - eIDAS compliant
  - Soporte en español

Adicional: €2.50 por firma extra
```

### Recomendación

**Para Inmova**:
- < 20 firmas/mes → **Signaturit** (€50/mes)
- 20-100 firmas/mes → **Signaturit con extras** (€50 + €2.50/firma)
- > 100 firmas/mes → **DocuSign** (€100/mes fijo)

---

## 📝 CHECKLIST DE CONFIGURACIÓN

### DocuSign

- [x] Cuenta creada (dvillagra@vidaroinversiones.com)
- [x] Integration Key obtenida
- [x] User ID obtenido
- [x] Account ID obtenido
- [x] Variables añadidas al servidor
- [ ] **Private Key generada y añadida** ⬅️ FALTA ESTE PASO
- [ ] Autorización JWT realizada
- [ ] Test de firma realizado

### Signaturit

- [ ] Cuenta creada
- [ ] Plan seleccionado
- [ ] API Key obtenida
- [ ] Variable añadida al servidor
- [ ] Test de firma realizado

---

## 🔗 ENLACES ÚTILES

### DocuSign

- **Dashboard**: https://admindemo.docusign.com/
- **Apps and Keys**: https://admindemo.docusign.com/apps-and-keys
- **Documentación**: https://developers.docusign.com/
- **JWT Auth**: https://developers.docusign.com/platform/auth/jwt/
- **Credenciales**: Ver `DOCUSIGN_CREDENTIALS.md`

### Signaturit

- **Website**: https://www.signaturit.com/es/
- **Dashboard**: https://app.signaturit.com/
- **Documentación**: https://docs.signaturit.com/
- **API Reference**: https://docs.signaturit.com/api/v3
- **Soporte**: soporte@signaturit.com

---

## 🎯 RECOMENDACIÓN FINAL

### Para Empezar YA (5 minutos)

**Completar DocuSign**:
1. Login en https://admindemo.docusign.com/
2. Apps and Keys → INMOVA Digital Signature
3. Generate RSA → Copiar Private Key
4. SSH al servidor → Añadir DOCUSIGN_PRIVATE_KEY
5. Reiniciar PM2
6. ✅ Firma digital operativa

**Ventaja**: Ya tienes el 80% configurado

### Para Largo Plazo (Mejor opción)

**Cambiar a Signaturit**:
1. Crear cuenta en Signaturit
2. Obtener API Key (más simple que DocuSign)
3. Añadir al servidor
4. ✅ Firma digital operativa + Ahorro €50/mes

**Ventaja**: Más económico y simple

---

## 📞 SOPORTE

**DocuSign**:
- Email: dvillagra@vidaroinversiones.com
- Soporte: https://support.docusign.com/

**Signaturit**:
- Soporte: soporte@signaturit.com
- Teléfono: +34 911 23 66 55

**Código**:
- Ver: `INTEGRACION_DOCUSIGN_VIDARO.md`
- Ver: `app/api/contracts/[id]/sign/route.ts`

---

**¿Qué opción prefieres configurar?** 🚀

- Opción A: Completar DocuSign (5 minutos, solo Private Key)
- Opción B: Configurar Signaturit (30 minutos, desde cero)