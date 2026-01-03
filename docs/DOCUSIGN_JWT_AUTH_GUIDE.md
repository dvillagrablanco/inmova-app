# 📝 Guía de Autorización JWT - DocuSign

**Fecha**: 3 de enero de 2026  
**Versión**: 1.0  
**Estado actual**: Credenciales configuradas, JWT authorization pendiente

---

## 📋 Tabla de Contenidos

1. [Introducción](#introducción)
2. [Por qué JWT authorization](#por-qué-jwt-authorization)
3. [Requisitos previos](#requisitos-previos)
4. [Paso 1: Consent grant](#paso-1-consent-grant)
5. [Paso 2: Verificación](#paso-2-verificación)
6. [Troubleshooting](#troubleshooting)
7. [Recursos adicionales](#recursos-adicionales)

---

## 📖 Introducción

DocuSign requiere un proceso de autorización JWT (JSON Web Token) **una sola vez** para permitir que tu aplicación actúe en nombre de un usuario sin requerir login manual cada vez.

### Estado actual

✅ **Credenciales configuradas**:
```env
DOCUSIGN_INTEGRATION_KEY=0daca02a-dbe5-45cd-9f78-35108236c0cd
DOCUSIGN_USER_ID=6db6e1e7-24be-4445-a75c-dce2aa0f3e59
DOCUSIGN_ACCOUNT_ID=dc80ca20-9dcd-4d88-878a-3cb0e67e3569
DOCUSIGN_BASE_PATH=https://demo.docusign.net/restapi
DOCUSIGN_PRIVATE_KEY=[configurada]
```

⏳ **Pendiente**:
- JWT Authorization (consent grant) - **Se hace UNA SOLA VEZ**

---

## 🔐 Por qué JWT authorization

### Flujo tradicional (OAuth)

```
Usuario → Login manual cada vez → Conceder permisos → Token
```

❌ **Problema**: Requiere intervención manual del usuario.

### Flujo JWT (Preferido)

```
Aplicación → JWT Token (automático) → Acceso
```

✅ **Ventaja**: Automático, sin intervención del usuario.

### Qué hace el consent grant

El **consent grant** es un paso manual que haces **UNA SOLA VEZ** para autorizar a tu aplicación (identificada por el Integration Key) a actuar en nombre del usuario (User ID) sin requerir login interactivo.

---

## ✅ Requisitos previos

### 1. Credenciales configuradas

Verifica que tienes estas credenciales en el servidor:

```bash
ssh root@157.180.119.236

# Verificar
cd /opt/inmova-app
grep DOCUSIGN .env.production
```

Debe mostrar:

```env
DOCUSIGN_INTEGRATION_KEY=0daca02a-dbe5-45cd-9f78-35108236c0cd
DOCUSIGN_USER_ID=6db6e1e7-24be-4445-a75c-dce2aa0f3e59
DOCUSIGN_ACCOUNT_ID=dc80ca20-9dcd-4d88-878a-3cb0e67e3569
DOCUSIGN_BASE_PATH=https://demo.docusign.net/restapi
DOCUSIGN_PRIVATE_KEY=-----BEGIN RSA PRIVATE KEY-----...
```

### 2. Cuenta de DocuSign

Login en https://demo.docusign.net/ con:

- **Email**: [Tu email de DocuSign]
- **Password**: [Tu password de DocuSign]

---

## 🚀 Paso 1: Consent grant

### Opción A: URL de consentimiento directo (RECOMENDADO)

**1. Construir URL**:

```
https://account-d.docusign.com/oauth/auth?response_type=code&scope=signature%20impersonation&client_id={INTEGRATION_KEY}&redirect_uri={REDIRECT_URI}
```

**Sustituir valores**:

```
https://account-d.docusign.com/oauth/auth?response_type=code&scope=signature%20impersonation&client_id=0daca02a-dbe5-45cd-9f78-35108236c0cd&redirect_uri=https://inmovaapp.com/api/docusign/callback
```

**2. Abrir URL en navegador**

Pega la URL completa en tu navegador.

**3. Login en DocuSign**

Si no estás logueado, DocuSign te pedirá credenciales:

```
Email: [tu_email@docusign.com]
Password: [tu_password]
```

**4. Autorizar aplicación**

DocuSign mostrará una pantalla:

```
┌─────────────────────────────────────────────┐
│                                             │
│  Inmova App requests access to:             │
│                                             │
│  ✓ Sign documents on your behalf           │
│  ✓ Access your account information          │
│                                             │
│  [ Allow ]   [ Deny ]                       │
│                                             │
└─────────────────────────────────────────────┘
```

Click en **"Allow"** (Permitir).

**5. Redirect**

DocuSign te redirigirá a:

```
https://inmovaapp.com/api/docusign/callback?code=ABC123DEF456...
```

✅ **Success**: El consent se otorgó correctamente.

⚠️ **Nota**: El endpoint `/api/docusign/callback` puede no existir (404), pero NO importa. Lo importante es que llegaste ahí, lo que significa que el consent fue otorgado.

---

### Opción B: cURL (Para expertos)

Si prefieres hacerlo por terminal:

```bash
curl -X POST https://account-d.docusign.com/oauth/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer" \
  -d "assertion=YOUR_JWT_TOKEN"
```

**Nota**: Necesitas generar el JWT token primero. Opción A es más simple.

---

## 🔍 Paso 2: Verificación

### Test desde el servidor

Una vez completado el consent grant, verifica que funciona:

**1. SSH al servidor**:

```bash
ssh root@157.180.119.236
```

**2. Test con script**:

```bash
cd /opt/inmova-app

# Crear script de test
cat > test-docusign.js << 'EOF'
const { docusign } = require('docusign-esign');

const apiClient = new docusign.ApiClient();
apiClient.setBasePath(process.env.DOCUSIGN_BASE_PATH.replace('/restapi', ''));

async function testJWT() {
  try {
    const results = await apiClient.requestJWTUserToken(
      process.env.DOCUSIGN_INTEGRATION_KEY,
      process.env.DOCUSIGN_USER_ID,
      ['signature', 'impersonation'],
      process.env.DOCUSIGN_PRIVATE_KEY,
      3600
    );
    
    console.log('✅ JWT Token obtained successfully!');
    console.log('Token:', results.body.access_token.substring(0, 20) + '...');
    console.log('Expires in:', results.body.expires_in, 'seconds');
    return true;
  } catch (error) {
    console.error('❌ JWT Authorization failed:', error.message);
    
    if (error.message.includes('consent_required')) {
      console.log('\n⚠️  Consent grant not completed yet.');
      console.log('Complete consent grant following the guide.');
    }
    
    return false;
  }
}

testJWT();
EOF

# Ejecutar test
node test-docusign.js
```

**Salida esperada** (si consent grant completado):

```
✅ JWT Token obtained successfully!
Token: eyJhbGciOiJSUzI1Ni...
Expires in: 3600 seconds
```

**Salida si falta consent**:

```
❌ JWT Authorization failed: consent_required

⚠️  Consent grant not completed yet.
Complete consent grant following the guide.
```

---

### Verificar desde la aplicación

Una vez verificado, la aplicación debería poder usar DocuSign automáticamente:

```bash
# Restart PM2 para recargar env vars
pm2 restart inmova-app --update-env

# Verificar logs
pm2 logs inmova-app | grep -i docusign
```

---

## 🐛 Troubleshooting

### Error: "consent_required"

**Síntoma**:

```
❌ JWT Authorization failed: consent_required
```

**Causa**: Consent grant no completado.

**Solución**: Seguir [Paso 1](#paso-1-consent-grant) para completar consent.

---

### Error: "invalid_client"

**Síntoma**:

```
❌ JWT Authorization failed: invalid_client
```

**Causa**: `DOCUSIGN_INTEGRATION_KEY` incorrecto.

**Solución**: Verificar que el Integration Key es correcto:

```bash
# En el servidor
grep DOCUSIGN_INTEGRATION_KEY /opt/inmova-app/.env.production
```

Debe ser: `0daca02a-dbe5-45cd-9f78-35108236c0cd`

---

### Error: "invalid_grant"

**Síntoma**:

```
❌ JWT Authorization failed: invalid_grant
```

**Causa**: `DOCUSIGN_PRIVATE_KEY` incorrecto o mal formateado.

**Solución**: Verificar que la private key está completa y correctamente formateada:

```bash
# En el servidor
grep -A 20 DOCUSIGN_PRIVATE_KEY /opt/inmova-app/.env.production
```

Debe empezar con `-----BEGIN RSA PRIVATE KEY-----` y terminar con `-----END RSA PRIVATE KEY-----`.

---

### Error: "user_not_found"

**Síntoma**:

```
❌ JWT Authorization failed: user_not_found
```

**Causa**: `DOCUSIGN_USER_ID` incorrecto.

**Solución**: Verificar User ID en DocuSign Admin:

1. Login en https://admindemo.docusign.com/
2. Users → [Tu usuario] → API & Keys
3. Copiar **User ID**
4. Actualizar en `.env.production`

---

## 🔄 Revocar y renovar consent

### Revocar consent

Si necesitas revocar el consent:

1. Login en https://demo.docusign.net/
2. Settings → Apps and Keys
3. Find "Inmova App"
4. Click **Revoke Access**

### Renovar consent

Si revocaste o expiraste el consent, simplemente repite [Paso 1](#paso-1-consent-grant).

---

## 📚 Recursos adicionales

### Documentación oficial

- **DocuSign JWT Grant**: https://developers.docusign.com/platform/auth/jwt/
- **JWT Authorization Guide**: https://developers.docusign.com/platform/auth/jwt/jwt-getting-started/
- **Integration Keys**: https://developers.docusign.com/docs/esign-rest-api/how-to/authentication/

### Postman Collection

DocuSign proporciona una Postman collection para testing:

https://github.com/docusign/postman-collections

### Support

- **DocuSign Support**: https://support.docusign.com/
- **Developer Forum**: https://community.docusign.com/
- **Inmova Support**: support@inmovaapp.com

---

## ✅ Checklist de autorización

### Pre-authorization

- [x] Credenciales DocuSign configuradas
- [x] Private Key en `.env.production`
- [x] Integration Key verificado
- [x] User ID verificado
- [x] Account ID verificado

### Authorization

- [ ] URL de consent construida
- [ ] Login en DocuSign completado
- [ ] Consent grant otorgado
- [ ] Redirect successful (puede ser 404, es OK)

### Post-authorization

- [ ] Test JWT token successful
- [ ] PM2 reiniciado con nuevas vars
- [ ] Logs sin errores de DocuSign
- [ ] Signature request de prueba enviado

---

## 🎯 Siguiente paso después de autorización

Una vez completado el consent grant, DocuSign estará **100% funcional** como provider de respaldo de firma digital.

**Sistema de prioridad**:

```
1. Signaturit (primary) ✅
   │
   ├─ Si Signaturit falla o no disponible
   │
2. DocuSign (backup) ✅ (después de JWT auth)
   │
   ├─ Si DocuSign falla o no disponible
   │
3. Demo mode (fallback)
```

---

**Estimación de tiempo**: 5-10 minutos

1. Construir URL: 2 minutos
2. Login y consent: 3 minutos
3. Verificación: 2-3 minutos

---

**Última actualización**: 3 de enero de 2026  
**Versión**: 1.0.0  
**Estado**: Esperando consent grant del usuario
