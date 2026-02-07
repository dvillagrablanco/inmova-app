# 🔐 VARIABLES DE ENTORNO - CENTRO DE INTEGRACIONES

## Variables Obligatorias del Sistema

```bash
# ⚠️ CRÍTICO: Encriptación de Credenciales
# Cambiar en producción por una clave segura de 32 caracteres
ENCRYPTION_KEY="tu-clave-de-32-caracteres-aqui!!"
```

---

## Variables por Integración

Las siguientes variables son **opcionales** y solo se usan como fallback si la empresa no ha configurado sus propias credenciales en el dashboard.

### 📞 Twilio (SMS/WhatsApp)

```bash
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+34612345678
TWILIO_WHATSAPP_NUMBER=+34612345678  # Opcional
```

[Obtener credenciales](https://console.twilio.com/)

---

### 💳 PayPal

```bash
PAYPAL_CLIENT_ID=your_client_id
PAYPAL_CLIENT_SECRET=your_client_secret
PAYPAL_ENVIRONMENT=sandbox  # o 'production'
PAYPAL_WEBHOOK_ID=your_webhook_id  # Opcional
```

[Obtener credenciales](https://developer.paypal.com/dashboard/)

---

### 💶 Bizum

```bash
BIZUM_MERCHANT_ID=999008881
BIZUM_SECRET_KEY=sq7HjrUOBfKmC576ILgskD5srU870gJ7
BIZUM_BANK_PROVIDER=redsys  # o 'santander', 'bbva', 'caixabank'
BIZUM_ENVIRONMENT=sandbox  # o 'production'
```

**Nota**: Bizum se integra a través de pasarelas bancarias (Redsys, Santander, BBVA, CaixaBank).

---

### 🏠 Airbnb

```bash
AIRBNB_CLIENT_ID=your_client_id
AIRBNB_CLIENT_SECRET=your_client_secret
```

[Obtener credenciales](https://www.airbnb.com/partner)

---

### 🏨 Booking.com

```bash
BOOKING_HOTEL_ID=12345
BOOKING_USERNAME=your_username
BOOKING_PASSWORD=your_password
BOOKING_ENVIRONMENT=test  # o 'production'
```

[Obtener credenciales](https://partner.booking.com/)

---

### 💰 Stripe (Ya existente)

```bash
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

---

### 📧 SendGrid (Ya existente)

```bash
SENDGRID_API_KEY=SG.xxxxx
EMAIL_FROM=noreply@inmova.app
EMAIL_ONBOARDING_FROM=onboarding@inmova.app
```

---

### 📱 Pomelli (Ya configurado)

```bash
POMELLI_API_KEY=your_api_key
POMELLI_API_SECRET=your_api_secret
POMELLI_WEBHOOK_URL=https://inmova.app/api/pomelli/webhook
```

---

### ✍️ DocuSign (Ya existente)

```bash
DOCUSIGN_INTEGRATION_KEY=your_key
DOCUSIGN_USER_ID=your_user_id
DOCUSIGN_ACCOUNT_ID=your_account_id
DOCUSIGN_PRIVATE_KEY=your_private_key_base64
```

---

### 🏦 Bankinter Open Banking (Ya existente)

```bash
BANKINTER_CLIENT_ID=your_client_id
BANKINTER_CLIENT_SECRET=your_client_secret
```

---

### 📊 Contabilidad

```bash
# ContaSimple
CONTASIMPLE_API_KEY=your_api_key
CONTASIMPLE_COMPANY_ID=your_company_id

# Holded
HOLDED_API_KEY=your_api_key
```

---

## Configuración en Vercel/Railway

### Vercel

```bash
vercel env add ENCRYPTION_KEY production
vercel env add TWILIO_ACCOUNT_SID production
vercel env add PAYPAL_CLIENT_ID production
# ... etc
```

### Railway

1. Ir a tu proyecto en Railway
2. Variables → New Variable
3. Agregar cada variable con su valor
4. Hacer redeploy

---

## Configuración por Empresa (Recomendado)

**La forma recomendada es que cada empresa configure sus propias credenciales desde el dashboard:**

1. Ir a **Dashboard → Integraciones**
2. Click en la integración deseada
3. Click en "Configurar"
4. Rellenar los campos de credenciales
5. Guardar

Las credenciales se almacenan **encriptadas** en la base de datos con AES-256-CBC.

---

## Seguridad

✅ **Buenas prácticas**:
- Usar variables de entorno para credenciales sensibles
- Nunca commitear credenciales en el código
- Rotar claves periódicamente
- Usar entornos sandbox para testing
- Habilitar webhooks con HMAC signatures

❌ **No hacer**:
- No compartir credenciales de producción
- No usar la misma API key para múltiples empresas
- No dejar credenciales en logs
- No usar claves débiles para ENCRYPTION_KEY

---

## Testing de Integraciones

Cada integración tiene su propio entorno de pruebas:

| Integración | Entorno de Pruebas |
|-------------|-------------------|
| Twilio | Usa números de prueba de Twilio |
| PayPal | `PAYPAL_ENVIRONMENT=sandbox` |
| Bizum | `BIZUM_ENVIRONMENT=sandbox` |
| Airbnb | Propiedades de prueba |
| Booking.com | `BOOKING_ENVIRONMENT=test` |
| Stripe | Claves `sk_test_...` |

---

## Soporte

Para problemas con credenciales:

1. Verificar que las variables estén correctamente configuradas
2. Probar la conexión desde el dashboard (botón "Probar")
3. Ver logs en `/dashboard/integrations`
4. Consultar documentación del proveedor

---

**¡Tu sistema de integraciones está listo para usar! 🚀**
