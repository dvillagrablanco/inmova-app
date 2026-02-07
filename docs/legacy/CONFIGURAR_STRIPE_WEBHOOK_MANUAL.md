# ⚡ Configurar Stripe Webhook Secret - Manual

**Tu Webhook Secret**: `whsec_Es6lxyUSGHKvt84Kjr0vKhYVJUVK73pe`

---

## 🚀 PASOS RÁPIDOS (3 minutos)

### 1️⃣ Conectar al Servidor

```bash
ssh root@157.180.119.236
```

### 2️⃣ Copiar y Pegar Este Bloque Completo

```bash
cd /opt/inmova-app

# Backup
cp .env.production .env.production.backup-$(date +%Y%m%d_%H%M%S)

# Verificar si ya existe
if grep -q "STRIPE_WEBHOOK_SECRET" .env.production; then
  echo "Actualizando STRIPE_WEBHOOK_SECRET existente..."
  sed -i 's|^STRIPE_WEBHOOK_SECRET=.*|STRIPE_WEBHOOK_SECRET=whsec_Es6lxyUSGHKvt84Kjr0vKhYVJUVK73pe|' .env.production
else
  echo "Añadiendo STRIPE_WEBHOOK_SECRET..."
  echo '' >> .env.production
  echo '# Stripe Webhook Secret' >> .env.production
  echo 'STRIPE_WEBHOOK_SECRET=whsec_Es6lxyUSGHKvt84Kjr0vKhYVJUVK73pe' >> .env.production
fi

# Verificar
echo ""
echo "✅ Configuración añadida:"
grep STRIPE_WEBHOOK_SECRET .env.production | sed 's/=.*$/=whsec_***HIDDEN***/'

# Reiniciar PM2
echo ""
echo "🔄 Reiniciando PM2..."
pm2 restart inmova-app --update-env

# Esperar warm-up
sleep 10

# Test endpoint
echo ""
echo "🧪 Testeando endpoint..."
curl -s -o /dev/null -w 'HTTP Status: %{http_code}\n' http://localhost:3000/api/webhooks/stripe

# Ver logs
echo ""
echo "📋 Últimos logs:"
pm2 logs inmova-app --lines 5 --nostream

echo ""
echo "✅ COMPLETADO"
```

### 3️⃣ Verificar en Stripe

1. Ve a https://dashboard.stripe.com/webhooks
2. Click en tu webhook
3. Click **"Send test webhook"**
4. Selecciona **"payment_intent.succeeded"**
5. Verifica respuesta: **200 OK**

---

## 🎯 RESULTADO ESPERADO

Después de ejecutar los comandos, deberías ver:

```
✅ Configuración añadida:
STRIPE_WEBHOOK_SECRET=whsec_***HIDDEN***

🔄 Reiniciando PM2...
[PM2] Applying action restartProcessId on app [inmova-app](ids: [ 0 ])
[PM2] [inmova-app](0) ✓

🧪 Testeando endpoint...
HTTP Status: 405

📋 Últimos logs:
[TAILING] Tailing last 5 lines for [inmova-app] process

✅ COMPLETADO
```

**HTTP Status 405 es correcto** (significa que el endpoint existe pero requiere POST, no GET)

---

## 📋 VERIFICACIÓN FINAL

Ver logs en tiempo real mientras envías test desde Stripe:

```bash
pm2 logs inmova-app | grep -i stripe
```

**Log esperado cuando envíes test**:

```
[Stripe Webhook] Received event: payment_intent.succeeded
[Stripe] Payment succeeded: pi_test_xxx
{"received": true}
```

---

## ✅ ESTADO FINAL

Una vez completado:

```
✅ STRIPE_WEBHOOK_SECRET configurado en servidor
✅ PM2 reiniciado con nuevas variables
✅ Endpoint /api/webhooks/stripe operativo
✅ Stripe → Inmova comunicación completa
✅ Pagos se confirmarán automáticamente
```

---

## 🆘 Si hay algún problema

**Error "Invalid signature"**:
- El secret está mal copiado
- Verifica que no tiene espacios extra
- Verifica que empieza con `whsec_`

**Endpoint no responde**:
- Verifica PM2: `pm2 status`
- Ver logs de error: `pm2 logs inmova-app --err`

**Test desde Stripe retorna error**:
- Copia el error y pégalo aquí
- Revisa logs en servidor

---

¿Ejecuto los comandos manuales o prefieres hacerlo tú directamente en el servidor?
