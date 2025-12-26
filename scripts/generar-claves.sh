#!/bin/bash

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║  🔑 GENERADOR DE CLAVES PARA .env.production                 ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""
echo "Copia estas claves y pégalas en tu archivo .env.production"
echo ""

echo "# NEXTAUTH_SECRET"
echo "NEXTAUTH_SECRET=$(openssl rand -base64 32)"
echo ""

echo "# ENCRYPTION_KEY"
echo "ENCRYPTION_KEY=$(openssl rand -base64 32)"
echo ""

echo "# MFA_ENCRYPTION_KEY"
echo "MFA_ENCRYPTION_KEY=$(openssl rand -base64 32)"
echo ""

echo "# CRON_SECRET"
echo "CRON_SECRET=$(openssl rand -hex 32)"
echo ""

echo "═══════════════════════════════════════════════════════════════"
echo "Para VAPID Keys, ejecuta por separado:"
echo "  npx web-push generate-vapid-keys"
echo "═══════════════════════════════════════════════════════════════"
