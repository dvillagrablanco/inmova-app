#!/bin/bash
# Script para configurar DNS automáticamente con Cloudflare API

echo "🌐 CONFIGURACIÓN AUTOMÁTICA DE DNS"
echo "=================================="
echo ""

# Solicitar datos
read -p "📝 Nombre del dominio (ej: miapp.com): " DOMAIN
read -p "🔑 Cloudflare API Token: " CF_TOKEN
read -p "🆔 Zone ID: " ZONE_ID

echo ""
echo "Configurando DNS para: $DOMAIN"
echo ""

# IP del servidor
SERVER_IP="54.201.20.43"

# 1. Crear registro A para apex (@ = dominio raíz)
echo "1️⃣ Creando registro A para $DOMAIN..."
curl -X POST "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records" \
  -H "Authorization: Bearer $CF_TOKEN" \
  -H "Content-Type: application/json" \
  --data "{\"type\":\"A\",\"name\":\"@\",\"content\":\"$SERVER_IP\",\"ttl\":1,\"proxied\":true}" \
  -s | jq -r '.success, .errors'

echo ""

# 2. Crear registro A para www
echo "2️⃣ Creando registro A para www.$DOMAIN..."
curl -X POST "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records" \
  -H "Authorization: Bearer $CF_TOKEN" \
  -H "Content-Type: application/json" \
  --data "{\"type\":\"A\",\"name\":\"www\",\"content\":\"$SERVER_IP\",\"ttl\":1,\"proxied\":true}" \
  -s | jq -r '.success, .errors'

echo ""

# 3. Configurar SSL
echo "3️⃣ Configurando SSL..."
curl -X PATCH "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/settings/ssl" \
  -H "Authorization: Bearer $CF_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{"value":"flexible"}' \
  -s | jq -r '.success, .result.value'

echo ""
echo "✅ ¡Configuración completada!"
echo ""
echo "🎉 Tu aplicación estará disponible en:"
echo "   https://$DOMAIN"
echo "   https://www.$DOMAIN"
echo ""
echo "⏱️  Espera 2-5 minutos para propagación DNS"
echo ""
