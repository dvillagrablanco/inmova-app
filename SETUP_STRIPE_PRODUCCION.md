# 💳 SETUP DE STRIPE EN PRODUCCIÓN

## 📋 Resumen

**Estado Actual**: ⚠️ Stripe NO configurado en producción  
**Webhook**: ✅ Código implementado en `/api/webhooks/stripe`  
**Package**: ✅ Stripe instalado  
**Variables**: ❌ Faltan en `.env.production`  

---

## 🎯 PASOS PARA CONFIGURAR (30 minutos)

### PASO 1: Obtener API Keys de Stripe (5 min)

#### 1.1. Ir al Dashboard de Stripe
```
https://dashboard.stripe.com/
```

#### 1.2. Cambiar a Live Mode (⚠️ IMPORTANTE)
- **Top derecho**: Toggle de "Test mode" a "Live mode"
- El toggle debe estar en **OFF** (no azul)

#### 1.3. Ir a API Keys
```
Developers → API keys
```

#### 1.4. Copiar las claves:

**Secret key**:
```
sk_live_51... (empieza con sk_live_)
```
⚠️ **NUNCA compartir esta clave**

**Publishable key**:
```
pk_live_51... (empieza con pk_live_)
```

---

### PASO 2: Configurar Webhook (10 min)

#### 2.1. Ir a Webhooks
```
Developers → Webhooks → Add endpoint
```

#### 2.2. Configurar endpoint

**Endpoint URL**:
```
https://inmovaapp.com/api/webhooks/stripe
```

**Description**:
```
Inmova App - Producción
```

**Events to send** (seleccionar estos):
```
✅ payment_intent.succeeded
✅ payment_intent.payment_failed
✅ payment_intent.canceled
✅ charge.refunded
```

**API version**: Latest (2024-11-20.acacia)

#### 2.3. Copiar Signing Secret

Después de crear el webhook, copiar el **Signing secret**:
```
whsec_... (empieza con whsec_)
```

---

### PASO 3: Añadir Variables al Servidor (5 min)

#### 3.1. Conectar al servidor
```bash
ssh root@157.180.119.236
cd /opt/inmova-app
```

#### 3.2. Backup del .env.production
```bash
cp .env.production .env.production.backup.$(date +%Y%m%d_%H%M%S)
```

#### 3.3. Añadir variables de Stripe
```bash
cat >> .env.production << 'EOF'

# Stripe Configuration (LIVE MODE)
STRIPE_SECRET_KEY=sk_live_51...TU_CLAVE_AQUI
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_51...TU_CLAVE_AQUI
STRIPE_WEBHOOK_SECRET=whsec_...TU_SECRET_AQUI
EOF
```

#### 3.4. Verificar configuración
```bash
grep -E 'STRIPE_SECRET_KEY|STRIPE_WEBHOOK_SECRET|NEXT_PUBLIC_STRIPE' .env.production | sed 's/=.*/=***CONFIGURED***/'
```

Deberías ver:
```
STRIPE_SECRET_KEY=***CONFIGURED***
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=***CONFIGURED***
STRIPE_WEBHOOK_SECRET=***CONFIGURED***
```

#### 3.5. Reiniciar PM2 con nuevas variables
```bash
pm2 restart inmova-app --update-env
pm2 logs inmova-app --lines 20
```

---

### PASO 4: Testear Webhook (5 min)

#### 4.1. Enviar test event desde Stripe Dashboard

Ir a:
```
Developers → Webhooks → Tu webhook → Send test event
```

Seleccionar:
```
Event: payment_intent.succeeded
```

Click: **Send test webhook**

#### 4.2. Verificar en logs del servidor
```bash
pm2 logs inmova-app --lines 50 | grep -i stripe
```

Deberías ver:
```
[Stripe Webhook] Received event: payment_intent.succeeded
[Stripe] Payment succeeded: pi_...
```

---

### PASO 5: Test de Pago Real ($1) - OPCIONAL (5 min)

⚠️ **Solo hacer si ya activaste LIVE MODE**

#### 5.1. Usar tarjeta de test (En TEST MODE)
```
Tarjeta: 4242 4242 4242 4242
Fecha: Cualquier futura (ej: 12/25)
CVC: 123
```

#### 5.2. Verificar en Stripe Dashboard
```
Payments → Ver el pago
Status: Succeeded
Amount: Correcto
```

#### 5.3. Verificar en la app
- Payment debe aparecer en la BD
- Status: PAID
- Notificación al usuario (si implementado)

---

## 🔐 SEGURIDAD

### ✅ Buenas Prácticas

1. **Claves en .env.production**: ✅ Nunca en código
2. **Webhook Secret**: ✅ Validar firma siempre
3. **HTTPS**: ✅ Obligatorio para webhooks
4. **Logs**: ✅ No loggear claves completas

### ⚠️ Advertencias

- **NUNCA** commitear claves de Stripe a Git
- **NUNCA** compartir claves en screenshots/logs
- **NUNCA** usar LIVE keys en desarrollo

---

## 🧪 TESTING CHECKLIST

### Test Mode (Pre-producción)
- [ ] Crear payment intent
- [ ] Confirmar pago con tarjeta 4242...
- [ ] Webhook recibe evento
- [ ] Payment se actualiza en BD
- [ ] Usuario ve confirmación

### Live Mode (Producción)
- [ ] Cambiar a LIVE keys
- [ ] Webhook configurado con URL HTTPS
- [ ] Test con tarjeta real ($1 y luego refund)
- [ ] Verificar fees de Stripe (2.9% + €0.25)
- [ ] Emails de confirmación funcionan ✅ (Gmail configurado)

---

## 📊 COSTOS DE STRIPE

### Fees por Transacción
```
European Cards: 1.5% + €0.25
Non-European: 2.9% + €0.25
```

### Ejemplo
```
Pago de €1,000:
  - Fee: €15.25 (1.5% + €0.25)
  - Neto: €984.75
```

### Payouts
```
Gratuitos a cuenta bancaria europea (1-3 días)
```

---

## 🔧 TROUBLESHOOTING

### Webhook no recibe eventos

**Diagnóstico**:
```bash
# Ver logs
pm2 logs inmova-app | grep -i stripe

# Test endpoint
curl -X POST https://inmovaapp.com/api/webhooks/stripe \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

**Soluciones**:
- Verificar URL en Stripe Dashboard
- Verificar HTTPS (no HTTP)
- Verificar firewall no bloquea Stripe IPs
- Ver logs de Stripe Dashboard → Webhooks → Attempts

### Payment queda en "processing"

**Causa**: Webhook no se procesó o falló

**Solución**:
```bash
# Ver logs de error
pm2 logs inmova-app --err | grep payment

# Ver último webhook event en Stripe Dashboard
# Re-enviar evento manualmente si es necesario
```

### "Invalid API Key"

**Causa**: Key incorrecta o de wrong mode (test vs live)

**Solución**:
```bash
# Verificar que key empieza con sk_live_ (no sk_test_)
grep STRIPE_SECRET_KEY .env.production

# Verificar en Stripe Dashboard que la key existe
```

---

## 🚀 SCRIPT AUTOMATIZADO (OPCIONAL)

Para automatizar la configuración (excepto obtener las claves):

```bash
# En tu máquina local
python3 scripts/configure-stripe-production.py

# El script te pedirá:
# 1. STRIPE_SECRET_KEY
# 2. NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
# 3. STRIPE_WEBHOOK_SECRET

# Y automáticamente:
# - Añadirá al .env.production
# - Reiniciará PM2
# - Verificará configuración
```

---

## ✅ VERIFICACIÓN FINAL

Ejecutar script de verificación:
```bash
python3 scripts/verify-stripe-production.py
```

Debe mostrar:
```
✅ STRIPE_SECRET_KEY configurada (LIVE MODE)
✅ STRIPE_WEBHOOK_SECRET configurado
✅ Publishable key configurada
✅ Webhook endpoint accesible
✅ Stripe package instalado
✅ Stripe API responde

Verificación: 6/6 checks pasando
✅ STRIPE CONFIGURADO CORRECTAMENTE
```

---

## 📝 NOTAS

### Test Mode vs Live Mode

**Test Mode** (Desarrollo):
- Claves empiezan con `sk_test_` y `pk_test_`
- Usa tarjetas de test (4242...)
- No se hacen cargos reales
- Ideal para desarrollo

**Live Mode** (Producción):
- Claves empiezan con `sk_live_` y `pk_live_`
- Tarjetas reales
- Cargos reales
- Fees aplicables

### Recomendación

1. **Testear en TEST MODE primero** (localmente)
2. **Verificar todo funciona** (webhook, pagos, refunds)
3. **Cambiar a LIVE MODE** (producción)
4. **Test con €1** y hacer refund inmediatamente
5. **Activar para usuarios**

---

## 📞 SOPORTE

**Stripe Support**: https://support.stripe.com/  
**Docs**: https://stripe.com/docs  
**API Reference**: https://stripe.com/docs/api  

---

*Última actualización*: 4 de enero de 2026
