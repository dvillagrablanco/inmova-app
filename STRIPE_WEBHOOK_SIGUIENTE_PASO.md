# ✅ Webhook de Stripe Importado - Siguiente Paso

**Estado**: ✅ Webhook configurado en Stripe Dashboard  
**Pendiente**: Añadir webhook secret al servidor

---

## 🔑 PASO 1: Obtener el Webhook Secret

### En Stripe Dashboard

1. Ve a https://dashboard.stripe.com/webhooks

2. Click en tu webhook recién creado

3. En la sección **"Signing secret"**, click en **"Reveal"** o **"Click to reveal"**

4. Copia el secret completo (empieza con `whsec_`)

**Formato**:
```
whsec_abc123def456ghi789jkl012mno345pqr678stu901vwx234yz
```

---

## 🚀 PASO 2: Configurarlo en el Servidor

### Opción A: Script Automático (RECOMENDADO)

Ejecuta este comando en tu terminal **local** (donde tienes el workspace):

```bash
python3 /workspace/scripts/configure-stripe-webhook.py whsec_TU_SECRET_AQUI
```

**Reemplaza** `whsec_TU_SECRET_AQUI` con el secret que copiaste de Stripe.

**Lo que hace el script**:
1. ✅ Conecta al servidor via SSH
2. ✅ Hace backup de .env.production
3. ✅ Añade/actualiza STRIPE_WEBHOOK_SECRET
4. ✅ Reinicia PM2 con nuevas variables
5. ✅ Verifica que el endpoint responde
6. ✅ Muestra logs

**Tiempo**: ~30 segundos

---

### Opción B: Manual (Si prefieres hacerlo tú)

```bash
# 1. SSH al servidor
ssh root@157.180.119.236

# 2. Editar .env.production
cd /opt/inmova-app
nano .env.production

# 3. Añadir al final del archivo
STRIPE_WEBHOOK_SECRET=whsec_TU_SECRET_AQUI

# 4. Guardar (Ctrl+O, Enter, Ctrl+X)

# 5. Reiniciar PM2
pm2 restart inmova-app --update-env

# 6. Verificar
pm2 logs inmova-app --lines 10
```

---

## 🧪 PASO 3: Test desde Stripe

Una vez configurado el secret:

1. Ve a https://dashboard.stripe.com/webhooks

2. Click en tu webhook

3. Click en **"Send test webhook"**

4. Selecciona evento: **"payment_intent.succeeded"**

5. Click **"Send test webhook"**

**Resultado esperado**:

```
✅ Test webhook sent successfully
Response: 200 OK
{"received": true}
```

---

## 📊 VERIFICACIÓN EN SERVIDOR

Ver logs en tiempo real:

```bash
ssh root@157.180.119.236
pm2 logs inmova-app | grep -i stripe
```

**Log esperado**:

```
[Stripe Webhook] Received event: payment_intent.succeeded
[Stripe] Payment succeeded: pi_test_xxx
```

---

## 🎯 RESUMEN

### Estado Actual

```
✅ Webhook importado en Stripe Dashboard
✅ URL configurada: https://inmovaapp.com/api/webhooks/stripe
✅ Código implementado en servidor
⏳ Falta: Añadir STRIPE_WEBHOOK_SECRET
```

### Después de Configurar Secret

```
✅ Stripe → Inmova comunicación completa
✅ Pagos se confirman automáticamente
✅ Estado de payments se actualiza en BD
✅ Notificaciones automáticas a clientes (cuando email esté configurado)
```

---

## 🆘 Si hay algún problema

**Webhook retorna error**:
- Verifica que PM2 está corriendo: `pm2 status`
- Verifica logs: `pm2 logs inmova-app --err`
- Verifica que el secret es correcto

**Signature verification failed**:
- El secret está mal configurado
- Verifica que no tiene espacios extra
- Verifica que empieza con `whsec_`

---

## 📞 Listo para configurar

**Dame el webhook secret de Stripe** y yo lo configuro automáticamente, o ejecútalo tú mismo con:

```bash
python3 /workspace/scripts/configure-stripe-webhook.py whsec_TU_SECRET
```

---

**Última actualización**: 3 de enero de 2026
