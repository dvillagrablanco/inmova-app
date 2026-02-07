# 📧 CONFIGURACIÓN DE GMAIL SMTP

## 📋 Requisitos Previos

Para usar Gmail como servidor SMTP necesitas:

1. ✅ Cuenta de Gmail activa
2. ✅ Verificación en 2 pasos activada
3. ✅ Generar una "Contraseña de aplicación" (App Password)

---

## 🔐 PASO 1: Activar Verificación en 2 Pasos

### 1.1 Ir a Configuración de Seguridad de Google

https://myaccount.google.com/security

### 1.2 Activar "Verificación en 2 pasos"

- Click en **"Verificación en 2 pasos"**
- Seguir los pasos (verificar teléfono, etc.)
- Una vez activada, verás un ✅ verde

---

## 🔑 PASO 2: Generar Contraseña de Aplicación

### 2.1 Ir a App Passwords

**Opción A**: Link directo
https://myaccount.google.com/apppasswords

**Opción B**: Manual
1. https://myaccount.google.com/security
2. Scroll hasta "Verificación en 2 pasos"
3. Click en **"Contraseñas de aplicaciones"** (al final)

### 2.2 Crear App Password

1. **Seleccionar app**: "Correo"
2. **Seleccionar dispositivo**: "Otro (nombre personalizado)"
3. **Nombre**: "Inmova App"
4. Click **"Generar"**

### 2.3 Copiar Contraseña

Google te mostrará una contraseña de 16 caracteres (sin espacios):

```
abcd efgh ijkl mnop
```

**⚠️ IMPORTANTE**: Copia esta contraseña **ahora**. No podrás volver a verla.

Ejemplo (sin espacios):
```
abcdefghijklmnop
```

---

## ⚙️ PASO 3: Configurar en el Servidor

Voy a crear un script automático para configurar todo.

### Opción A: Script Automático (RECOMENDADO)

Ejecuta el script que crearé para ti. Solo necesitas:

1. **Tu email de Gmail**: `tu-email@gmail.com`
2. **App Password** (16 caracteres sin espacios): `abcdefghijklmnop`

### Opción B: Manual

Si prefieres hacerlo manualmente, añade estas variables a `.env.local` y `.env.production`:

```bash
# Gmail SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=tu-email@gmail.com
SMTP_PASS=abcdefghijklmnop
SMTP_FROM="Inmova App <tu-email@gmail.com>"
```

---

## 📊 Variables de Entorno

| Variable | Valor | Descripción |
|----------|-------|-------------|
| `SMTP_HOST` | `smtp.gmail.com` | Servidor SMTP de Gmail |
| `SMTP_PORT` | `587` | Puerto SMTP (TLS) |
| `SMTP_SECURE` | `false` | No usar SSL directo (usar STARTTLS) |
| `SMTP_USER` | Tu email Gmail | Usuario SMTP |
| `SMTP_PASS` | App Password | Contraseña de aplicación (16 chars) |
| `SMTP_FROM` | Nombre + Email | Remitente de emails |

---

## 🧪 PASO 4: Testear

Una vez configurado, puedes testear el envío de emails:

### Test desde el servidor

```bash
ssh root@157.180.119.236
cd /opt/inmova-app
node -e "
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

transporter.sendMail({
  from: process.env.SMTP_FROM,
  to: 'test@example.com',
  subject: 'Test Email from Inmova',
  text: 'Si recibes este email, la configuración está correcta.'
}).then(() => {
  console.log('✅ Email enviado exitosamente');
  process.exit(0);
}).catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
"
```

### Test desde la app (API endpoint)

Puedes crear un endpoint de test (solo desarrollo):

```bash
curl -X POST http://localhost:3000/api/test/send-email \
  -H 'Content-Type: application/json' \
  -d '{
    "to": "tu-email@gmail.com",
    "subject": "Test Email",
    "text": "Esto es una prueba"
  }'
```

---

## ⚠️ Solución de Problemas

### Error: "Invalid login"

**Causa**: App Password incorrecta o no generada.

**Solución**:
1. Verificar que Verificación en 2 pasos esté activa
2. Generar nueva App Password
3. Copiar sin espacios

### Error: "Connection timeout"

**Causa**: Puerto bloqueado o firewall.

**Solución**:
```bash
# Verificar conectividad SMTP
telnet smtp.gmail.com 587
```

Si no conecta, verificar firewall:
```bash
# Abrir puerto 587
ufw allow 587/tcp
ufw reload
```

### Error: "Authentication failed"

**Causa**: Credenciales incorrectas.

**Solución**:
```bash
# Verificar variables de entorno
echo $SMTP_USER
echo $SMTP_PASS
```

### Error: "Less secure app access"

**Causa**: Intentando usar contraseña normal (no App Password).

**Solución**: Usar App Password (16 caracteres) generada en paso 2.

---

## 📧 Tipos de Emails que Enviará Inmova

Una vez configurado, la app enviará automáticamente:

### Autenticación
- ✉️ Email de bienvenida al registrarse
- ✉️ Verificación de email
- ✉️ Recuperación de contraseña
- ✉️ Cambio de contraseña confirmado

### Notificaciones de Pagos
- ✉️ Pago recibido
- ✉️ Pago fallido
- ✉️ Recordatorio de pago próximo

### Actividad de Propiedades
- ✉️ Nueva solicitud de inquilino
- ✉️ Contrato firmado
- ✉️ Contrato próximo a vencer

### Mantenimiento
- ✉️ Nueva incidencia reportada
- ✉️ Incidencia resuelta

---

## 🎨 Personalización de Emails

### Configurar nombre del remitente

En `.env.local`:
```bash
SMTP_FROM="Inmova - Gestión Inmobiliaria <tu-email@gmail.com>"
```

### Templates de Email

Los templates están en `/lib/email-templates.ts` y pueden personalizarse.

---

## 🔒 Seguridad

### Mejores Prácticas

1. ✅ **Nunca** commitear credenciales a Git
2. ✅ Usar App Password (no contraseña real)
3. ✅ Rotar App Password cada 6 meses
4. ✅ Monitorear actividad en Gmail

### Revocar App Password

Si comprometes la App Password:

1. Ir a https://myaccount.google.com/apppasswords
2. Click en la App Password "Inmova App"
3. Click **"Revocar"**
4. Generar nueva y actualizar servidor

---

## 📊 Límites de Gmail

Gmail tiene límites de envío:

| Cuenta | Límite diario | Límite por hora |
|--------|---------------|-----------------|
| Gmail gratuita | 500 emails | ~20 emails |
| Google Workspace | 2,000 emails | ~80 emails |

**Recomendación**: Para > 500 emails/día, usar servicio profesional:
- SendGrid (hasta 100 emails/día gratis)
- Mailgun
- AWS SES
- Postmark

---

## 🚀 Siguiente Paso

Una vez que tengas:
1. ✅ Email de Gmail
2. ✅ App Password generada

Ejecuta el script de configuración que te proporcionaré.

---

## 📞 Comandos Rápidos

### Ver configuración actual

```bash
ssh root@157.180.119.236
cd /opt/inmova-app
grep SMTP .env.local
```

### Reiniciar app después de configurar

```bash
pm2 restart inmova-app
```

### Ver logs de emails

```bash
pm2 logs inmova-app | grep -i email
```

---

**¿Tienes tu email y App Password listos?** Avísame y configuraré todo automáticamente. 🚀
