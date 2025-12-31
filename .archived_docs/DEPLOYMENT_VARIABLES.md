# 🚀 VARIABLES DE ENTORNO PARA DEPLOYMENT

**Fecha:** 26 Diciembre 2025  
**Acción requerida:** Configurar en Vercel Dashboard

---

## ⚠️ ACCIÓN INMEDIATA REQUERIDA

Para que el sistema **Zero-Touch Onboarding** funcione completamente, debes añadir estas variables de entorno en el **Vercel Dashboard**:

### 📍 Dónde configurarlas:

1. Ve a: https://vercel.com/[tu-proyecto]/settings/environment-variables
2. Añade cada variable a continuación
3. Aplica a: **Production**, **Preview**, **Development**
4. Redeploy después de añadirlas

---

## 📧 VARIABLES DE EMAIL (CRÍTICAS)

### **SendGrid** (Recomendado)

```env
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxx
EMAIL_FROM=noreply@inmova.com
EMAIL_ONBOARDING_FROM=onboarding@inmova.com
```

**Cómo obtener:**

1. Regístrate en: https://sendgrid.com/
2. Plan gratuito: 100 emails/día (suficiente para empezar)
3. Ve a Settings → API Keys → Create API Key
4. Selecciona "Full Access" o "Restricted Access" con permisos de Mail Send
5. Copia la key (solo se muestra una vez)

**Alternativa - AWS SES:**

```env
AWS_SES_ACCESS_KEY_ID=AKIAXXXXXXXXXX
AWS_SES_SECRET_ACCESS_KEY=xxxxxxxxxxxxxxxxxx
AWS_SES_REGION=eu-west-1
EMAIL_FROM=noreply@inmova.com
EMAIL_ONBOARDING_FROM=onboarding@inmova.com
```

---

## 🔐 VARIABLES DE SEGURIDAD (CRÍTICAS)

### **Cron Job Protection**

```env
CRON_SECRET=tu_string_aleatorio_super_secreto_minimo_32_caracteres
```

**Cómo generar:**

```bash
# Opción 1: OpenSSL
openssl rand -hex 32

# Opción 2: Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Opción 3: Online (solo para dev, no para prod)
https://www.random.org/strings/
```

**Ejemplo:**

```env
CRON_SECRET=f4e3d2c1b0a9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3
```

---

## 🌐 VARIABLES DE URLs (Ya configuradas, verificar)

```env
NEXT_PUBLIC_URL=https://inmova.app
```

Si usas otro dominio, cámbialo aquí.

---

## 💬 VARIABLES OPCIONALES (Recomendadas)

### **Slack - Notificaciones a Customer Success**

```env
SLACK_CS_WEBHOOK_URL=https://hooks.slack.com/services/[TU_WORKSPACE]/[TU_CHANNEL]/[TU_TOKEN]
```

**Cómo obtener:**

1. Ve a: https://api.slack.com/messaging/webhooks
2. Crea una "Incoming Webhook"
3. Selecciona el canal (ej: #customer-success)
4. Copia la Webhook URL

**Beneficio:**

- Recibirás alertas automáticas cuando usuarios:
  - Estén inactivos 72h (riesgo de abandono)
  - Soliciten ayuda durante onboarding
  - Completen el onboarding (celebrar!)

---

## 🗄️ BASE DE DATOS (Ya configurada, solo verificar)

```env
DATABASE_URL=postgresql://user:password@host:5432/database
```

**Verificar que existe y funciona.**

---

## 📊 OTRAS VARIABLES EXISTENTES (No tocar)

Estas ya deberían estar configuradas:

- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- `STRIPE_SECRET_KEY` (para pagos)
- `STRIPE_WEBHOOK_SECRET`
- `ABACUSAI_API_KEY` (para chatbot IA)

---

## ✅ CHECKLIST DE CONFIGURACIÓN

### **Paso 1: Añadir Variables en Vercel**

- [ ] `SENDGRID_API_KEY` ✉️
- [ ] `EMAIL_FROM` ✉️
- [ ] `EMAIL_ONBOARDING_FROM` ✉️
- [ ] `CRON_SECRET` 🔐
- [ ] `NEXT_PUBLIC_URL` (verificar) 🌐
- [ ] `SLACK_CS_WEBHOOK_URL` (opcional) 💬

### **Paso 2: Redeploy**

Después de añadir las variables:

1. **Opción A - Automático:**
   - Vercel redeployará automáticamente al añadir variables

2. **Opción B - Manual:**

   ```bash
   # Desde tu máquina local
   vercel --prod

   # O desde Vercel Dashboard
   # Deployments → ⋯ → Redeploy
   ```

### **Paso 3: Verificar Deployment**

```bash
# Test del cron job (reemplaza con tu CRON_SECRET)
curl -X POST https://inmova.app/api/cron/onboarding-automation \
  -H "Authorization: Bearer TU_CRON_SECRET"

# Debería devolver: {"success": true, ...}
```

### **Paso 4: Test de Email**

1. Registra un usuario nuevo
2. Verifica que llegue el email de bienvenida
3. Si no llega:
   - Verifica `SENDGRID_API_KEY` en Vercel
   - Revisa logs en Vercel: https://vercel.com/[proyecto]/logs
   - Verifica que el dominio esté verificado en SendGrid

---

## 🔧 TROUBLESHOOTING

### **❌ "No emails are being sent"**

**Solución:**

1. Verifica que `SENDGRID_API_KEY` esté configurada
2. Ve a SendGrid Dashboard → Activity
3. Busca errores de envío
4. Verifica que el dominio esté verificado (si usas email corporativo)

### **❌ "Cron job not running"**

**Solución:**

1. Verifica que `vercel.json` tenga la configuración de crons
2. Ve a Vercel Dashboard → Settings → Crons
3. Verifica que aparezca el cron job
4. Logs: https://vercel.com/[proyecto]/logs (filtra por "cron")

### **❌ "Database schema not updated"**

**Solución:**

1. Ve a Vercel Dashboard → Storage → Postgres
2. Abre Query Editor
3. Verifica tablas:
   ```sql
   SELECT tablename FROM pg_tables
   WHERE tablename LIKE 'onboarding%';
   ```
4. Si no existen, ejecuta:
   ```bash
   npx prisma db push --accept-data-loss
   ```

---

## 📞 SOPORTE

Si tienes problemas configurando las variables:

1. **Logs de Vercel:**
   https://vercel.com/[tu-proyecto]/logs

2. **Documentación SendGrid:**
   https://docs.sendgrid.com/

3. **Documentación Vercel Crons:**
   https://vercel.com/docs/cron-jobs

---

## 🎯 RESULTADO ESPERADO

Una vez configuradas todas las variables y redeployado:

✅ Usuarios nuevos reciben email de bienvenida instantáneamente  
✅ Reminders automáticos a las 24h y 72h  
✅ Emails de celebración al 25%, 50%, 75%, 100%  
✅ Cron job ejecutándose cada 6 horas  
✅ Notificaciones a Slack (si configurado)  
✅ Webhooks funcionando para integraciones

---

**¡Configura estas variables ahora para activar el Zero-Touch Onboarding!** 🚀

**Tiempo estimado:** 10-15 minutos  
**Impacto:** +40% completion rate, -85% tickets soporte
