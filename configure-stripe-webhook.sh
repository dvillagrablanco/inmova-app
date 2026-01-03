#!/bin/bash
# Script para ejecutar DIRECTAMENTE en el servidor
# Uso: bash configure-stripe-webhook.sh

set -e

WEBHOOK_SECRET="whsec_Es6lxyUSGHKvt84Kjr0vKhYVJUVK73pe"

echo "======================================================================"
echo "🔐 CONFIGURACIÓN DE STRIPE WEBHOOK SECRET"
echo "======================================================================"
echo ""

cd /opt/inmova-app

# Backup
echo "📦 Creando backup..."
cp .env.production .env.production.backup-$(date +%Y%m%d_%H%M%S)
echo "✅ Backup creado"
echo ""

# Verificar si ya existe
if grep -q "STRIPE_WEBHOOK_SECRET" .env.production; then
  echo "⚠️  STRIPE_WEBHOOK_SECRET ya existe"
  echo "   Actualizando valor..."
  sed -i "s|^STRIPE_WEBHOOK_SECRET=.*|STRIPE_WEBHOOK_SECRET=${WEBHOOK_SECRET}|" .env.production
else
  echo "➕ Añadiendo STRIPE_WEBHOOK_SECRET..."
  echo '' >> .env.production
  echo '# Stripe Webhook Secret' >> .env.production
  echo "STRIPE_WEBHOOK_SECRET=${WEBHOOK_SECRET}" >> .env.production
fi

echo "✅ STRIPE_WEBHOOK_SECRET configurado"
echo ""

# Verificar
echo "🔍 Verificación:"
grep STRIPE_WEBHOOK_SECRET .env.production | sed 's/=.*$/=whsec_***HIDDEN***/'
echo ""

# Reiniciar PM2
echo "🔄 Reiniciando PM2..."
pm2 restart inmova-app --update-env
echo ""

# Esperar warm-up
echo "⏳ Esperando warm-up (10 segundos)..."
sleep 10

# Test endpoint
echo ""
echo "🧪 Testeando endpoint..."
HTTP_CODE=$(curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/api/webhooks/stripe)
echo "HTTP Status: $HTTP_CODE"

if [ "$HTTP_CODE" = "405" ] || [ "$HTTP_CODE" = "200" ]; then
  echo "✅ Endpoint operativo"
else
  echo "⚠️  Código inesperado: $HTTP_CODE"
fi

echo ""
echo "📋 Últimos logs:"
pm2 logs inmova-app --lines 5 --nostream

echo ""
echo "======================================================================"
echo "✅ CONFIGURACIÓN COMPLETADA"
echo "======================================================================"
echo ""
echo "🧪 PRÓXIMO PASO:"
echo "   1. Ve a https://dashboard.stripe.com/webhooks"
echo "   2. Click en tu webhook"
echo "   3. Click 'Send test webhook'"
echo "   4. Selecciona 'payment_intent.succeeded'"
echo "   5. Verifica que retorna 200 OK"
echo ""
echo "📋 Ver logs en tiempo real:"
echo "   pm2 logs inmova-app | grep -i stripe"
echo ""
