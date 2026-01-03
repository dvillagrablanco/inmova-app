# 📧 GMAIL SMTP - INSTRUCCIONES RÁPIDAS

## 🚀 Setup en 3 Pasos (5 minutos)

### Paso 1: Generar App Password en Gmail

1. **Activar Verificación en 2 pasos**:
   - https://myaccount.google.com/security
   - Activar "Verificación en 2 pasos"

2. **Generar App Password**:
   - https://myaccount.google.com/apppasswords
   - App: "Correo"
   - Dispositivo: "Otro" → "Inmova App"
   - Click **"Generar"**
   - **Copiar la contraseña de 16 caracteres** (sin espacios)

   Ejemplo: `abcdefghijklmnop`

### Paso 2: Configurar en el Servidor

Ejecuta el script de configuración:

```bash
cd /workspace
python3 scripts/configure-gmail-smtp.py
```

El script te pedirá:
1. **Email de Gmail**: `tu-email@gmail.com`
2. **App Password**: `abcdefghijklmnop` (los 16 caracteres)

### Paso 3: Verificar

El script reiniciará PM2 automáticamente y testeará la conexión.

---

## ✅ ¿Qué hace el script?

1. ✅ Añade variables SMTP a `.env.local` y `.env.production`
2. ✅ Reinicia PM2 para cargar nuevas variables
3. ✅ Testa la conexión SMTP con Gmail

---

## 📧 Emails que se Enviarán Automáticamente

Una vez configurado, la app enviará:

- ✉️ Bienvenida al registrarse
- ✉️ Recuperación de contraseña
- ✉️ Notificaciones de pagos
- ✉️ Alertas de mantenimiento
- ✉️ Recordatorios de contratos

---

## 🧪 Testear Envío Manual

### Opción 1: Desde la app

Si tienes un endpoint de test (puedo crearlo):

```bash
curl -X POST https://inmovaapp.com/api/test/send-email \
  -H 'Content-Type: application/json' \
  -d '{
    "to": "tu-email@gmail.com",
    "subject": "Test desde Inmova",
    "text": "Este es un email de prueba"
  }'
```

### Opción 2: Trigger automático

1. Registra un nuevo usuario → debe llegar email de bienvenida
2. Usa "Olvidé mi contraseña" → debe llegar email de recuperación

---

## 📊 Límites de Gmail

| Tipo de cuenta | Límite diario | Recomendación |
|----------------|---------------|---------------|
| Gmail gratuita | 500 emails | OK para < 50 usuarios |
| Google Workspace | 2,000 emails | OK para < 200 usuarios |

**Si necesitas más**: Migrar a SendGrid, Mailgun o AWS SES

---

## ⚠️ Solución de Problemas

### Error: "Invalid login"

- **Causa**: App Password incorrecta
- **Solución**: Verificar que copiaste los 16 caracteres sin espacios

### Error: "Less secure app"

- **Causa**: Intentando usar contraseña normal
- **Solución**: Debes usar App Password (paso 1)

### No llegan emails

1. Verificar spam/promotions en Gmail
2. Ver logs: `pm2 logs inmova-app | grep -i email`
3. Verificar variables: `grep SMTP /opt/inmova-app/.env.local`

---

## 🔒 Seguridad

- ✅ App Password es **diferente** a tu contraseña de Gmail
- ✅ Si comprometes la App Password, revócala y genera nueva
- ✅ Nunca commitear credenciales a Git

**Revocar App Password**:
https://myaccount.google.com/apppasswords → Revocar

---

## 📞 Comandos Útiles

```bash
# Ver configuración
ssh root@157.180.119.236 'grep SMTP /opt/inmova-app/.env.local'

# Ver logs de emails
ssh root@157.180.119.236 'pm2 logs inmova-app | grep -i email'

# Reiniciar app
ssh root@157.180.119.236 'pm2 restart inmova-app'
```

---

**¿Listo?** Ejecuta el script de configuración:

```bash
python3 scripts/configure-gmail-smtp.py
```
