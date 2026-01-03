#!/bin/bash
#######################################
# FASE 1 - SEGURIDAD COMPLETA
# Script automatizado para hardening de servidor
# Uso: bash phase1-security-setup.sh
#######################################

set -e  # Exit on error

echo "======================================================================"
echo "🔐 FASE 1: CONFIGURACIÓN DE SEGURIDAD - INMOVA APP"
echo "======================================================================"
echo ""
echo "Este script realizará las siguientes acciones:"
echo "1. Cambiar root password"
echo "2. Configurar firewall (UFW)"
echo "3. Generar y actualizar secrets de producción"
echo "4. Cambiar password de PostgreSQL"
echo "5. Configurar SSH keys"
echo "6. Actualizar .env.production"
echo "7. Reiniciar aplicación con nuevos secrets"
echo ""
read -p "¿Continuar? (y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Abortado por el usuario"
    exit 1
fi

echo ""
echo "======================================================================"
echo "📋 PASO 1: GENERANDO SECRETS SEGUROS"
echo "======================================================================"

# Generar secrets
NEXTAUTH_SECRET=$(openssl rand -base64 32)
DB_PASSWORD=$(openssl rand -base64 32)
ENCRYPTION_KEY=$(openssl rand -base64 32)
CRON_SECRET=$(openssl rand -base64 32)
ROOT_PASSWORD=$(openssl rand -base64 32)

echo "✅ Secrets generados exitosamente"
echo ""
echo "⚠️  IMPORTANTE: Guarda estos valores en un lugar seguro (1Password, Bitwarden, etc.)"
echo ""
echo "NEXTAUTH_SECRET: $NEXTAUTH_SECRET"
echo "DB_PASSWORD: $DB_PASSWORD"
echo "ENCRYPTION_KEY: $ENCRYPTION_KEY"
echo "CRON_SECRET: $CRON_SECRET"
echo "ROOT_PASSWORD: $ROOT_PASSWORD"
echo ""
read -p "Presiona ENTER después de guardar estos valores..." 

echo ""
echo "======================================================================"
echo "📋 PASO 2: CONFIGURANDO FIREWALL (UFW)"
echo "======================================================================"

# Instalar UFW si no está instalado
if ! command -v ufw &> /dev/null; then
    echo "Instalando UFW..."
    apt-get update -qq
    apt-get install -y ufw
fi

# Configurar reglas básicas
echo "Configurando reglas de firewall..."
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp comment 'SSH'
ufw allow 80/tcp comment 'HTTP'
ufw allow 443/tcp comment 'HTTPS'

# Activar firewall
echo "Activando firewall..."
ufw --force enable

# Verificar estado
echo ""
echo "Estado del firewall:"
ufw status verbose

echo "✅ Firewall configurado exitosamente"

echo ""
echo "======================================================================"
echo "📋 PASO 3: CAMBIANDO ROOT PASSWORD"
echo "======================================================================"

echo "Nuevo root password: $ROOT_PASSWORD"
echo ""
echo "root:$ROOT_PASSWORD" | chpasswd

if [ $? -eq 0 ]; then
    echo "✅ Root password cambiado exitosamente"
else
    echo "❌ Error cambiando root password"
    exit 1
fi

echo ""
echo "======================================================================"
echo "📋 PASO 4: CAMBIANDO PASSWORD DE POSTGRESQL"
echo "======================================================================"

# Cambiar password de PostgreSQL
sudo -u postgres psql -c "ALTER USER inmova_user WITH PASSWORD '$DB_PASSWORD';"

if [ $? -eq 0 ]; then
    echo "✅ PostgreSQL password cambiado exitosamente"
else
    echo "❌ Error cambiando PostgreSQL password"
    exit 1
fi

echo ""
echo "======================================================================"
echo "📋 PASO 5: ACTUALIZANDO .env.production"
echo "======================================================================"

# Backup del .env actual
if [ -f "/opt/inmova-app/.env.production" ]; then
    cp /opt/inmova-app/.env.production /opt/inmova-app/.env.production.backup.$(date +%Y%m%d_%H%M%S)
    echo "✅ Backup de .env.production creado"
fi

# Crear nuevo .env.production con secrets seguros
cat > /opt/inmova-app/.env.production << EOF
# ====================================
# ENVIRONMENT
# ====================================
NODE_ENV=production
PORT=3000

# ====================================
# DATABASE
# ====================================
DATABASE_URL=postgresql://inmova_user:${DB_PASSWORD}@localhost:5432/inmova_production?schema=public

# ====================================
# NEXTAUTH
# ====================================
NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
NEXTAUTH_URL=https://inmovaapp.com

# ====================================
# SECURITY
# ====================================
ENCRYPTION_KEY=${ENCRYPTION_KEY}
CRON_SECRET=${CRON_SECRET}

# ====================================
# AWS S3 (ACTUALIZAR CON VALORES REALES)
# ====================================
AWS_REGION=us-west-2
AWS_BUCKET_NAME=inmova-production
# AWS_ACCESS_KEY_ID=ACTUALIZAR_AQUI
# AWS_SECRET_ACCESS_KEY=ACTUALIZAR_AQUI

# ====================================
# STRIPE (ACTUALIZAR CON VALORES REALES DE LIVE MODE)
# ====================================
# STRIPE_SECRET_KEY=sk_live_ACTUALIZAR_AQUI
# STRIPE_PUBLISHABLE_KEY=pk_live_ACTUALIZAR_AQUI
# STRIPE_WEBHOOK_SECRET=whsec_ACTUALIZAR_AQUI
# NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_ACTUALIZAR_AQUI

# ====================================
# MONITORING
# ====================================
# NEXT_PUBLIC_SENTRY_DSN=ACTUALIZAR_AQUI
# SENTRY_DSN=ACTUALIZAR_AQUI

# ====================================
# REDIS (OPCIONAL)
# ====================================
# REDIS_URL=redis://localhost:6379

# ====================================
# MFA
# ====================================
MFA_ENCRYPTION_KEY=${ENCRYPTION_KEY}
EOF

echo "✅ .env.production actualizado con nuevos secrets"

echo ""
echo "======================================================================"
echo "📋 PASO 6: CONFIGURANDO SSH KEYS (OPCIONAL)"
echo "======================================================================"

echo ""
echo "Para mayor seguridad, se recomienda usar SSH keys en lugar de password."
echo ""
echo "Instrucciones para configurar SSH keys:"
echo ""
echo "1. En tu máquina LOCAL, genera un par de keys:"
echo "   ssh-keygen -t ed25519 -C 'deploy-inmova'"
echo ""
echo "2. Copia la key pública al servidor:"
echo "   ssh-copy-id root@157.180.119.236"
echo ""
echo "3. Después de verificar que funciona, deshabilita password auth:"
echo "   nano /etc/ssh/sshd_config"
echo "   # Cambiar: PasswordAuthentication no"
echo "   systemctl restart sshd"
echo ""
read -p "¿Configurar SSH keys ahora? (y/n): " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "Esperando configuración manual de SSH keys..."
    echo "Presiona ENTER cuando hayas completado la configuración..."
    read
    echo "✅ SSH keys configurados (verificar manualmente)"
else
    echo "⚠️  SSH keys NO configurados. Se recomienda hacerlo después."
fi

echo ""
echo "======================================================================"
echo "📋 PASO 7: REINICIANDO APLICACIÓN"
echo "======================================================================"

cd /opt/inmova-app

# Reiniciar PM2 con nuevas variables de entorno
pm2 restart inmova-app --update-env

if [ $? -eq 0 ]; then
    echo "✅ Aplicación reiniciada exitosamente"
else
    echo "❌ Error reiniciando aplicación"
    exit 1
fi

# Esperar warm-up
echo "Esperando warm-up (15 segundos)..."
sleep 15

echo ""
echo "======================================================================"
echo "📋 PASO 8: VERIFICACIÓN POST-CONFIGURACIÓN"
echo "======================================================================"

# Verificar PM2 status
echo ""
echo "Estado de PM2:"
pm2 status

# Health check
echo ""
echo "Health check:"
curl -s http://localhost:3000/api/health | jq || curl -s http://localhost:3000/api/health

# Verificar firewall
echo ""
echo "Estado del firewall:"
ufw status

echo ""
echo "======================================================================"
echo "✅ FASE 1 COMPLETADA EXITOSAMENTE"
echo "======================================================================"
echo ""
echo "📊 RESUMEN DE CAMBIOS:"
echo ""
echo "✅ Root password cambiado"
echo "✅ PostgreSQL password cambiado"
echo "✅ NEXTAUTH_SECRET generado y actualizado"
echo "✅ ENCRYPTION_KEY generado"
echo "✅ CRON_SECRET generado"
echo "✅ Firewall UFW configurado y activo"
echo "✅ .env.production actualizado"
echo "✅ Aplicación reiniciada con nuevos secrets"
echo ""
echo "⚠️  ACCIONES PENDIENTES:"
echo ""
echo "1. Actualizar AWS credentials en .env.production"
echo "2. Actualizar Stripe keys (LIVE mode) en .env.production"
echo "3. Configurar Sentry DSN en .env.production"
echo "4. Configurar SSH keys (si no se hizo)"
echo "5. Remover credenciales de archivos de documentación"
echo "6. Guardar nuevos secrets en password manager"
echo ""
echo "📋 NUEVOS SECRETS (GUARDAR EN LUGAR SEGURO):"
echo ""
echo "Root Password: $ROOT_PASSWORD"
echo "DB Password: $DB_PASSWORD"
echo "NEXTAUTH_SECRET: $NEXTAUTH_SECRET"
echo "ENCRYPTION_KEY: $ENCRYPTION_KEY"
echo "CRON_SECRET: $CRON_SECRET"
echo ""
echo "🔗 URLs de verificación:"
echo ""
echo "Health Check: curl https://inmovaapp.com/api/health"
echo "Login: https://inmovaapp.com/login"
echo "Dashboard: https://inmovaapp.com/dashboard"
echo ""
echo "======================================================================"
echo "📝 SIGUIENTE PASO: FASE 1 - DÍA 2 (SSL + Tests)"
echo "======================================================================"
echo ""
echo "Ejecutar: bash scripts/phase1-ssl-tests.sh"
echo ""
