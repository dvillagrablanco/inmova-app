# 🚀 Guía Rápida: Integración DocuSign para Vidaro

## ☁️ Resumen de 3 Pasos

### 📝 **Paso 1: Obtener Credenciales**

1. Ve a: **https://developers.docusign.com/**
2. Inicia sesión con la cuenta de Vidaro
3. Crea una app llamada `INMOVA - Vidaro`
4. Copia estos valores:
   - **Integration Key** (Client ID)
   - **User ID** (API Username)
   - **Account ID**
5. Genera par de claves RSA (botón "Generate RSA")
6. Copia la **clave privada** que aparece (solo se muestra una vez)
7. Añade Redirect URI: `https://inmova.app/api/digital-signature/callback`
8. Autoriza la app visitando esta URL (reemplaza `TU_KEY`):
```
https://account-d.docusign.com/oauth/auth?response_type=code&scope=signature%20impersonation&client_id=TU_KEY&redirect_uri=https://inmova.app/api/digital-signature/callback
```

---

### ⚙️ **Paso 2: Configurar en INMOVA**

1. Edita el archivo `.env` en el servidor:
```bash
nano /home/ubuntu/homming_vidaro/nextjs_space/.env
```

2. Reemplaza estos valores al final del archivo:
```env
DOCUSIGN_INTEGRATION_KEY=tu_integration_key_real
DOCUSIGN_USER_ID=tu_user_id_real
DOCUSIGN_ACCOUNT_ID=tu_account_id_real
DOCUSIGN_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----
MIIEowIBAAKCAQEA...tu_clave_privada_completa...
-----END RSA PRIVATE KEY-----"
DOCUSIGN_BASE_PATH=https://demo.docusign.net/restapi
```

3. Guarda el archivo (Ctrl+X, Y, Enter)

---

### 🚀 **Paso 3: Activar la Integración**

1. Ejecuta el script de configuración:
```bash
cd /home/ubuntu/homming_vidaro/nextjs_space
chmod +x scripts/setup-docusign.sh
./scripts/setup-docusign.sh
```

2. El script instalará:
   - SDK de DocuSign (`docusign-esign`)
   - Libreria JWT (`jsonwebtoken`)
   - Verificará las credenciales

3. Reinicia el servidor:
```bash
yarn dev
```

---

## ✅ Verificación Rápida

1. **Desde la interfaz web:**
   - Ve a: https://inmova.app/firma-digital
   - Inicia sesión como: `admin@vidaro.es` / `Inmova2025!`
   - Crea una solicitud de firma de prueba
   - Verifica que el mensaje diga "Documento enviado via DocuSign" (sin "DEMO")

2. **Desde los logs:**
```bash
tail -f /home/ubuntu/homming_vidaro/nextjs_space/logs/combined.log | grep DocuSign
```

Busca: `✅ [DocuSign] Envelope enviado correctamente`

3. **Desde DocuSign:**
   - Inicia sesión en: https://demo.docusign.net/ (o producción)
   - Ve a "Manage" > "Sent"
   - Deberías ver el documento enviado desde INMOVA

---

## 🎯 Cambiar de Sandbox a Producción

Cuando estés listo para producción:

1. Cambia el `BASE_PATH` en `.env`:
```env
DOCUSIGN_BASE_PATH=https://na1.docusign.net/restapi
```
*(Verifica la región de tu cuenta: na1, na2, na3, eu, etc.)*

2. Reinicia el servidor

---

## 🐛 Problemas Comunes

### Error: "Invalid JWT token"
→ **Solución:** Regenera el consent de usuario (Paso 1, punto 8)

### Error: "USER_AUTHENTICATION_FAILED"
→ **Solución:** Completa la autorización OAuth (Paso 1, punto 8)

### Error: "Module not found: docusign-esign"
→ **Solución:** Ejecuta: `yarn add docusign-esign jsonwebtoken`

### No se envían documentos
→ **Diagnóstico:**
```bash
tail -f /home/ubuntu/homming_vidaro/nextjs_space/logs/error.log | grep DocuSign
```

---

## 📚 Documentación Completa

Para la guía detallada completa con todos los casos de uso, troubleshooting avanzado, y ejemplos de código:

```bash
cat /home/ubuntu/homming_vidaro/INTEGRACION_DOCUSIGN_VIDARO.md
```

O desde el navegador:
- Descarga: `/home/ubuntu/homming_vidaro/INTEGRACION_DOCUSIGN_VIDARO.pdf`

---

## 📧 Soporte

**Guía Técnica:** Ver documento completo arriba  
**Soporte INMOVA:** soporte@inmova.com  
**DocuSign Support:** https://support.docusign.com/  

---

*Tiempo estimado: 15-20 minutos*  
*Última actualización: Diciembre 2025*