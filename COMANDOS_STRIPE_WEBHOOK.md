# ⚡ COMANDOS PARA CONFIGURAR STRIPE WEBHOOK

**Tu Webhook Secret**: `whsec_Es6lxyUSGHKvt84Kjr0vKhYVJUVK73pe`

---

## 🚀 EJECUTA ESTOS COMANDOS

### Opción A: Script Automatizado (RECOMENDADO)

**1. Conecta al servidor**:

```bash
ssh root@157.180.119.236
```

**2. Descarga el script del repo**:

```bash
cd /opt/inmova-app
git pull origin main
```

**3. Ejecuta el script**:

```bash
bash configure-stripe-webhook.sh
```

✅ El script ya tiene tu secret configurado y hará todo automáticamente.

---

### Opción B: Comandos Manuales (Copy-Paste)

Si prefieres ejecutar manualmente, **copia y pega este bloque completo**:

```bash
# Conectar al servidor
ssh root@157.180.119.236

# Una vez dentro del servidor, ejecuta:
cd /opt/inmova-app

# Backup
cp .env.production .env.production.backup-$(date +%Y%m%d_%H%M%S)

# Verificar si ya existe y actualizar/añadir
if grep -q "STRIPE_WEBHOOK_SECRET" .env.production; then
  sed -i 's|^STRIPE_WEBHOOK_SECRET=.*|STRIPE_WEBHOOK_SECRET=whsec_Es6lxyUSGHKvt84Kjr0vKhYVJUVK73pe|' .env.production
  echo "✅ STRIPE_WEBHOOK_SECRET actualizado"
else
  echo '' >> .env.production
  echo '# Stripe Webhook Secret' >> .env.production
  echo 'STRIPE_WEBHOOK_SECRET=whsec_Es6lxyUSGHKvt84Kjr0vKhYVJUVK73pe' >> .env.production
  echo "✅ STRIPE_WEBHOOK_SECRET añadido"
fi

# Verificar
echo ""
echo "🔍 Verificación:"
grep STRIPE_WEBHOOK_SECRET .env.production | sed 's/=.*$/=whsec_***HIDDEN***/'

# Reiniciar PM2
echo ""
echo "🔄 Reiniciando PM2..."
pm2 restart inmova-app --update-env

# Esperar
sleep 10

# Test
echo ""
echo "🧪 Test del endpoint:"
curl -s -o /dev/null -w 'HTTP Status: %{http_code}\n' http://localhost:3000/api/webhooks/stripe

# Logs
echo ""
echo "📋 Últimos logs:"
pm2 logs inmova-app --lines 5 --nostream

echo ""
echo "✅ ¡COMPLETADO!"
```

---

## 🧪 TEST DESDE STRIPE DASHBOARD

**Después de ejecutar los comandos**:

1. Ve a https://dashboard.stripe.com/webhooks

2. Click en tu webhook

3. Click **"Send test webhook"**

4. Selecciona **"payment_intent.succeeded"**

5. Click **"Send test webhook"**

**Resultado esperado**:

```
✅ Test webhook sent successfully
Response code: 200
Response body: {"received":true}
```

---

## 📋 VERIFICAR LOGS EN SERVIDOR

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

## ✅ ESTADO FINAL

Después de completar:

```
✅ STRIPE_WEBHOOK_SECRET configurado
✅ PM2 reiniciado
✅ Endpoint operativo
✅ Stripe → Inmova comunicación activa
✅ Pagos se confirmarán automáticamente
```

---

## 🆘 Si hay problemas

**Endpoint retorna 401/400**:
```bash
# Verificar que el secret está correcto
grep STRIPE_WEBHOOK_SECRET /opt/inmova-app/.env.production

# Debe mostrar:
# STRIPE_WEBHOOK_SECRET=whsec_Es6lxyUSGHKvt84Kjr0vKhYVJUVK73pe
```

**PM2 no reinicia**:
```bash
pm2 status
pm2 restart inmova-app --update-env
pm2 logs inmova-app --err
```

---

**Ejecuta los comandos y confirma cuando esté listo para hacer el test desde Stripe.**
