# DocuSign JWT Authorization — Grupo Vidaro (Producción)

**Última actualización**: Marzo 2026  
**Entorno**: Producción (`www.docusign.net`)  
**Grupo**: Vidaro (Viroda Inversiones S.L. + Rovida S.L.)

---

## Estado Actual

✅ **Credenciales configuradas** (producción):
```env
DOCUSIGN_INTEGRATION_KEY=5cb4a15f-658d-4fa0-ae53-6aabb10749d7
DOCUSIGN_USER_ID=6043b7c8-af4d-458b-9641-c1700b7bf2f2
DOCUSIGN_ACCOUNT_ID=7adae404-8081-4ec4-b10f-365afce4e65c
DOCUSIGN_BASE_PATH=https://www.docusign.net/restapi
DOCUSIGN_PRIVATE_KEY=[configurada]
```

⏳ **Pendiente**: JWT consent grant (una sola vez)

---

## Flujo de Firma Digital

```
Contrato (PDF) → DocuSign API → Email a firmantes → Firma digital → Webhook → Estado actualizado
```

### Tipos de contratos soportados:
1. **Contratos propios** — Arrendamiento Viroda/Rovida
2. **Contratos de operadores** — Media estancia (Álamo, etc.)
3. **Cualquier PDF** — Asociado a un contrato en el sistema

### API de firma:
```bash
POST /api/contracts/{contractId}/sign
{
  "signatories": [
    { "email": "firmante@email.com", "name": "Nombre", "role": "LANDLORD" },
    { "email": "inquilino@email.com", "name": "Inquilino", "role": "TENANT" }
  ],
  "expirationDays": 30,
  "provider": "docusign",           // Opcional, DocuSign por defecto
  "operatorName": "Álamo",          // Opcional, para contratos de operadores
  "emailSubject": "Firma contrato", // Opcional
  "emailMessage": "Por favor firma" // Opcional
}
```

---

## Paso 1: Consent Grant (UNA SOLA VEZ)

### Desde la interfaz de admin:

1. Ir a `/admin/integraciones/docusign`
2. Click "Autorizar DocuSign"
3. Login con cuenta DocuSign de Vidaro
4. Aceptar permisos

### Manualmente (URL directa):

```
https://account.docusign.com/oauth/auth?response_type=code&scope=signature%20impersonation&client_id=5cb4a15f-658d-4fa0-ae53-6aabb10749d7&redirect_uri=https://inmovaapp.com/api/integrations/docusign/callback
```

1. Abrir URL en navegador
2. Login con cuenta DocuSign de Vidaro
3. Click "Allow" (Permitir)
4. Serás redirigido a la app (puede mostrar página de éxito o 404 — esto es normal)

✅ El consent queda registrado permanentemente en DocuSign.

---

## Paso 2: Verificación

### Desde la interfaz:

Ir a `/admin/integraciones/docusign` → "Verificar conexión"

### Desde el servidor:

```bash
ssh root@157.180.119.236
cd /opt/inmova-app

# Verificar variables
grep DOCUSIGN .env.production

# Test rápido
node -e "
require('dotenv').config({ path: '.env.production' });
const ds = require('docusign-esign');
const client = new ds.ApiClient();
client.setOAuthBasePath('account.docusign.com');
client.requestJWTUserToken(
  process.env.DOCUSIGN_INTEGRATION_KEY,
  process.env.DOCUSIGN_USER_ID,
  ['signature', 'impersonation'],
  Buffer.from(process.env.DOCUSIGN_PRIVATE_KEY.replace(/\\\\n/g, '\\n'), 'utf8'),
  3600
).then(r => {
  console.log('✅ Token obtenido:', r.body.access_token.substring(0, 20) + '...');
}).catch(e => {
  console.log('❌ Error:', e?.response?.body?.error || e.message);
});
"
```

---

## Configuración del Webhook

Para recibir notificaciones automáticas de DocuSign:

1. Ir a DocuSign Admin → Connect
2. Añadir configuración:
   - **URL**: `https://inmovaapp.com/api/webhooks/docusign`
   - **Data format**: JSON
   - **Events**: Envelope Completed, Envelope Declined, Envelope Voided
3. Activar

---

## Troubleshooting

### Error: `consent_required`

El consent grant no se ha completado. Seguir Paso 1.

### Error: `invalid_grant`

La Private Key no es correcta o tiene formato incorrecto. Verificar:
```bash
grep 'BEGIN RSA PRIVATE KEY' /opt/inmova-app/.env.production
```

### Error: `invalid_client`

La Integration Key no es correcta. Verificar en DocuSign Admin → Apps.

### Error: `user_not_found`

El User ID no corresponde a un usuario de la cuenta. Verificar en DocuSign Admin → Users.

---

## Redirect URI

Debe estar registrada en DocuSign Admin → Apps → Settings → Redirect URIs:
```
https://inmovaapp.com/api/integrations/docusign/callback
```

---

## Sociedades Configuradas

| Sociedad | Tipo | Estado |
|----------|------|--------|
| Viroda Inversiones S.L. | Contratos propios + operadores | Activa |
| Rovida S.L. | Contratos propios + operadores | Activa |

Todas las sociedades del Grupo Vidaro comparten la misma cuenta DocuSign.

---

## Operadores de Media Estancia

Los operadores como **Álamo** envían contratos para firma. El flujo es:

1. Operador envía PDF del contrato
2. Se sube al sistema y se asocia al contrato correspondiente
3. Se envía a DocuSign con `operatorName: "Álamo"` para personalizar el email
4. Los firmantes (Vidaro + operador) reciben email de DocuSign
5. Tras firma, webhook actualiza el estado automáticamente

**API:**
```bash
POST /api/contracts/{id}/sign
{
  "signatories": [
    { "email": "vidaro@vidaroinversiones.com", "name": "Vidaro Inversiones", "role": "LANDLORD" },
    { "email": "firmante@alamo.es", "name": "Representante Álamo", "role": "OPERATOR" }
  ],
  "operatorName": "Álamo",
  "provider": "docusign"
}
```
