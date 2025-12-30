#!/bin/bash

# ============================================================================
# 🚀 DEPLOYMENT AUTOMÁTICO CON VARIABLES DE ENTORNO
# ============================================================================
# 
# Uso:
#   export SSH_USER="deploy"
#   export SSH_HOST="inmovaapp.com"
#   export SSH_PORT="22"
#   bash deploy-automatic.sh
#
# O en una línea:
#   SSH_USER=deploy SSH_HOST=inmovaapp.com bash deploy-automatic.sh
# ============================================================================

set -e

# Verificar variables requeridas
if [ -z "$SSH_USER" ] || [ -z "$SSH_HOST" ]; then
    echo "❌ Error: Variables SSH requeridas"
    echo ""
    echo "Uso:"
    echo "  export SSH_USER=\"deploy\""
    echo "  export SSH_HOST=\"inmovaapp.com\""
    echo "  export SSH_PORT=\"22\"  # Opcional, default: 22"
    echo "  bash $0"
    echo ""
    echo "O:"
    echo "  SSH_USER=deploy SSH_HOST=inmovaapp.com bash $0"
    exit 1
fi

SSH_PORT=${SSH_PORT:-22}
APP_PATH=${APP_PATH:-/opt/inmova-app}

echo "============================================================================"
echo "🚀 DEPLOYMENT AUTOMÁTICO"
echo "============================================================================"
echo ""
echo "Destino: $SSH_USER@$SSH_HOST:$SSH_PORT"
echo "Ruta: $APP_PATH"
echo ""

# Test conexión
echo "🔌 Probando conexión..."
if ! ssh -p $SSH_PORT -o ConnectTimeout=5 -o StrictHostKeyChecking=no $SSH_USER@$SSH_HOST "echo 'OK'" 2>/dev/null; then
    echo "❌ No se pudo conectar"
    echo ""
    echo "Verifica:"
    echo "  1. Usuario/host correctos"
    echo "  2. SSH key configurada: ssh-copy-id $SSH_USER@$SSH_HOST"
    echo "  3. Puerto SSH abierto"
    exit 1
fi
echo "✅ Conexión verificada"

# Deployment
echo ""
echo "🚀 Iniciando deployment..."
echo ""

ssh -p $SSH_PORT $SSH_USER@$SSH_HOST bash << 'ENDSSH'
set -e

APP_PATH="${APP_PATH:-/opt/inmova-app}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo "📦 1/7: Backup..."
cd "$APP_PATH"
mkdir -p ~/backups
tar -czf ~/backups/backup-$TIMESTAMP.tar.gz .next app components 2>/dev/null || true
echo "✅ Backup: ~/backups/backup-$TIMESTAMP.tar.gz"

echo ""
echo "📥 2/7: Git pull..."
git fetch origin
git pull origin cursor/visual-inspection-protocol-setup-72ca || git pull origin main
echo "✅ Cambios descargados"

echo ""
echo "📦 3/7: Dependencias..."
if git diff HEAD@{1} HEAD --name-only | grep -q "package.json"; then
    yarn install --frozen-lockfile
else
    echo "Sin cambios"
fi
echo "✅ OK"

echo ""
echo "🧹 4/7: Limpiando cache..."
rm -rf .next/cache .next/server
echo "✅ Cache limpio"

echo ""
echo "🔨 5/7: Build..."
[ -f ".env.production" ] && export $(cat .env.production | grep -v '^#' | xargs)
yarn build
echo "✅ Build OK"

echo ""
echo "♻️ 6/7: Restart..."
if command -v pm2 &> /dev/null; then
    pm2 reload inmova-app || pm2 restart inmova-app
    pm2 save
    echo "✅ PM2 reloaded"
else
    pkill -f "next-server" || true
    sleep 2
    nohup yarn start > /tmp/inmova.log 2>&1 &
    echo "✅ App reiniciada"
fi

echo ""
echo "🔍 7/7: Health check..."
sleep 5
if curl -f http://localhost:3000/api/health -s > /dev/null; then
    echo "✅ Health OK"
else
    echo "⚠️ Pendiente verificación"
fi

echo ""
echo "✅ DEPLOYMENT COMPLETADO"
git log -1 --oneline
ENDSSH

echo ""
echo "============================================================================"
echo "✅ DEPLOYMENT FINALIZADO"
echo "============================================================================"
echo ""
echo "🔍 Verificando desde internet..."
if curl -f https://inmovaapp.com/api/health -s > /dev/null 2>&1; then
    echo "✅ https://inmovaapp.com está online"
else
    echo "⚠️ Verificar manualmente: https://inmovaapp.com"
fi

echo ""
echo "📊 Próximos pasos:"
echo "  1. Login: https://inmovaapp.com/login"
echo "  2. Verificar: /dashboard, /edificios, /admin/activity"
echo "  3. Re-auditar: npx tsx scripts/visual-audit.ts"
echo ""
