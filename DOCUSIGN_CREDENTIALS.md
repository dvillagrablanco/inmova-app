# 🔐 DocuSign Integration - Credenciales y Configuración
## Fecha de Generación: 3 de diciembre, 2025

---

## 📧 **Cuenta de Desarrollador DocuSign**
- **Usuario**: dvillagra@vidaroinversiones.com
- **Nombre**: David Villagra
- **Account ID**: 44085179

---

## 🔑 **Información de la Cuenta API**

### **User ID**
```
5f857d75-cd36-4fad-812b-3ff1be80d9a9
```

### **API Account ID**
```
e59b0a7b-966d-42e0-bcd9-169855c046
```

### **Account Base URI**
```
https://demo.docusign.net
```

---

## 🚀 **Aplicación: INMOVA Digital Signature**

### **Integration Key**
```
c0a3e377-148b-4895-9095-b3e8dbef3d88
```

### **Environment**
```
Development
```

### **Keypair ID**
```
ba0c64c1-6be1-4329-8e45-71df0202d571
```

---

## 📝 **Notas Importantes**

1. **Integration Key**: Esta clave es necesaria para todas las llamadas a la API de DocuSign.

2. **RSA Key Pair**: Se ha generado un par de claves RSA para autenticación JWT:
   - **Public Key**: Almacenada en DocuSign
   - **Private Key**: Copiada al portapapeles (debe ser guardada de forma segura)

3. **Base URI**: El endpoint base para las llamadas API es `https://demo.docusign.net`

4. **Environment**: Actualmente configurado como "Development" (entorno de pruebas)
   - Para producción, necesitarás crear una nueva aplicación o migrar esta a producción

5. **Authentication Method**: Configurado para usar JWT (JSON Web Token) con RSA key pair

---

## 🔧 **Configuración en Variables de Entorno**

Para usar estas credenciales en tu aplicación INMOVA, configura las siguientes variables de entorno:

```env
# DocuSign Configuration
DOCUSIGN_INTEGRATION_KEY=c0a3e377-148b-4895-9095-b3e8dbef3d88
DOCUSIGN_USER_ID=5f857d75-cd36-4fad-812b-3ff1be80d9a9
DOCUSIGN_API_ACCOUNT_ID=e59b0a7b-966d-42e0-bcd9-169855c046
DOCUSIGN_BASE_URI=https://demo.docusign.net
DOCUSIGN_PRIVATE_KEY="<contenido de la private key copiada>"
```

---

## ⚠️ **Seguridad**

- ✅ La **Private Key** ha sido copiada al portapapeles. Asegúrate de guardarla en un lugar seguro.
- ✅ **NUNCA** compartas la Private Key públicamente ni la subas a repositorios públicos.
- ✅ Usa variables de entorno o servicios de gestión de secretos para almacenar estas credenciales.
- ✅ La Private Key debe estar en formato PEM y comenzar con `-----BEGIN RSA PRIVATE KEY-----`

---

## 📚 **Próximos Pasos**

1. **Guardar la Private Key**: Pega el contenido de la Private Key del portapapeles en un archivo seguro.
2. **Configurar Variables de Entorno**: Agrega las credenciales a tu archivo `.env` o sistema de gestión de secretos.
3. **Integración JWT**: Implementar la autenticación JWT usando la Integration Key y Private Key.
4. **Testing**: Probar la integración en el entorno de Development.
5. **Go-Live**: Cuando estés listo, solicitar la aprobación para producción.

---

## 🔗 **Enlaces Útiles**

- **DocuSign Developer Center**: https://developers.docusign.com/
- **Apps and Keys**: https://admindemo.docusign.com/apps-and-keys
- **Documentación JWT**: https://developers.docusign.com/platform/auth/jwt/
- **API Reference**: https://developers.docusign.com/docs/esign-rest-api/reference/

---

## 📞 **Soporte**

Si necesitas ayuda con la integración:
- Email: dvillagra@vidaroinversiones.com
- DocuSign Support: https://support.docusign.com/

---

**Generado automáticamente el 3 de diciembre de 2025**