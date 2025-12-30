#!/bin/bash

# ============================================================================
# 🚀 DEPLOYMENT INTERACTIVO A INMOVAAPP.COM
# ============================================================================

set -e

echo "============================================================================"
echo "🚀 DEPLOYMENT A PRODUCCIÓN - INMOVAAPP.COM"
echo "============================================================================"
echo ""

# Solicitar credenciales
echo "📝 Ingresa las credenciales SSH:"
read -p "Usuario SSH (ej: deploy, ubuntu, root): " SSH_USER
read -p "Host/IP (ej: inmovaapp.com, 157.180.119.236): " SSH_HOST
read -p "Puerto SSH [22]: " SSH_PORT
SSH_PORT=${SSH_PORT:-22}

# Confirmar credenciales
echo ""
echo "🔍 Verificando credenciales:"
echo "   Usuario: $SSH_USER"
echo "   Host: $SSH_HOST"
echo "   Puerto: $SSH_PORT"
echo ""
read -p "¿Son correctas? (y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Cancelado"
    exit 1
fi

# Test de conexión
echo ""
echo "🔌 Probando conexión SSH..."
if ssh -p $SSH_PORT -o ConnectTimeout=5 -o StrictHostKeyChecking=no $SSH_USER@$SSH_HOST "echo '✅ Conexión exitosa'" 2>/dev/null; then
    echo "✅ Conexión SSH verificada"
else
    echo "❌ No se pudo conectar al servidor"
    echo "Verifica:"
    echo "  - Usuario y host correctos"
    echo "  - Puerto SSH abierto"
    echo "  - Permisos de SSH key"
    exit 1
fi

# Detectar ruta de la aplicación en el servidor
echo ""
echo "🔍 Detectando ruta de la aplicación..."
APP_PATH=$(ssh -p $SSH_PORT $SSH_USER@$SSH_HOST "ls -d /opt/inmova-app /home/deploy/inmova-app /var/www/inmova-app ~/inmova-app 2>/dev/null | head -1" || echo "")

if [ -z "$APP_PATH" ]; then
    echo "⚠️ No se detectó automáticamente la ruta"
    read -p "Ingresa la ruta completa de la app: " APP_PATH
fi

echo "   Ruta detectada: $APP_PATH"

# Confirmar deployment
echo ""
echo "============================================================================"
echo "📦 LISTO PARA DESPLEGAR"
echo "============================================================================"
echo ""
echo "Se desplegarán los siguientes cambios:"
echo "  ✅ Fix JSON.parse en /admin/activity"
echo "  ✅ Nueva ruta /configuracion redirect"
echo "  ✅ Eliminadas referencias a /home"
echo "  ✅ APIs portales creadas"
echo "  ✅ CSS overflow mobile fixed"
echo ""
echo "Reducción esperada de errores: 77% (1717 → ~400)"
echo ""
read -p "🚀 ¿Iniciar deployment? (y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Deployment cancelado"
    exit 1
fi

# ============================================================================
# INICIO DEL DEPLOYMENT
# ============================================================================

echo ""
echo "🚀 Iniciando deployment..."
echo ""

# Crear script de deployment remoto
DEPLOY_SCRIPT=$(cat << 'EOFSCRIPT'
#!/bin/bash
set -e

APP_PATH="$1"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo "📦 PASO 1/7: Backup de seguridad..."
cd "$APP_PATH"
mkdir -p ~/backups
tar -czf ~/backups/inmova-backup-$TIMESTAMP.tar.gz .next app components 2>/dev/null || true
echo "✅ Backup creado"

echo ""
echo "📥 PASO 2/7: Descargando cambios..."
git fetch origin
git pull origin cursor/visual-inspection-protocol-setup-72ca || git pull origin main
echo "✅ Cambios descargados"

echo ""
echo "📦 PASO 3/7: Verificando dependencias..."
if git diff HEAD@{1} HEAD --name-only | grep -q "package.json"; then
    yarn install --frozen-lockfile
    echo "✅ Dependencias actualizadas"
else
    echo "✅ Sin cambios en dependencias"
fi

echo ""
echo "🧹 PASO 4/7: Limpiando cache..."
rm -rf .next/cache .next/server
echo "✅ Cache limpiado"

echo ""
echo "🔨 PASO 5/7: Rebuilding aplicación..."
if [ -f ".env.production" ]; then
    export $(cat .env.production | grep -v '^#' | xargs)
fi
yarn build

if [ $? -ne 0 ]; then
    echo "❌ Error en build. Restaurando backup..."
    tar -xzf ~/backups/inmova-backup-$TIMESTAMP.tar.gz
    exit 1
fi
echo "✅ Build completado"

echo ""
echo "♻️ PASO 6/7: Reiniciando aplicación..."
if command -v pm2 &> /dev/null; then
    pm2 reload inmova-app 2>/dev/null || pm2 restart inmova-app
    pm2 save
    echo "✅ PM2 reloaded"
else
    pkill -f "next-server" || true
    sleep 2
    nohup yarn start > /tmp/inmova.log 2>&1 &
    echo "✅ Aplicación reiniciada"
fi

echo ""
echo "🔍 PASO 7/7: Verificando salud..."
sleep 5
if curl -f http://localhost:3000/api/health -s > /dev/null 2>&1; then
    echo "✅ Health check OK"
else
    echo "⚠️ Health check pendiente"
fi

echo ""
echo "============================================================================"
echo "✅ DEPLOYMENT COMPLETADO"
echo "============================================================================"
echo ""
echo "📝 Commit deployado:"
git log -1 --oneline
echo ""
echo "🕒 Completado: $(date '+%Y-%m-%d %H:%M:%S')"
EOFSCRIPT
)

# Ejecutar deployment en el servidor
echo "📤 Ejecutando deployment en $SSH_HOST..."
echo ""

ssh -p $SSH_PORT $SSH_USER@$SSH_HOST "bash -s -- $APP_PATH" << EOF
$DEPLOY_SCRIPT
EOF

# Verificación post-deploy
echo ""
echo "============================================================================"
echo "🎯 VERIFICACIÓN POST-DEPLOY"
echo "============================================================================"
echo ""

echo "🔍 Verificando que la aplicación responde..."
if curl -f https://inmovaapp.com/api/health -s > /dev/null 2>&1; then
    echo "✅ Health check OK - https://inmovaapp.com está online"
else
    echo "⚠️ Health check pendiente - verificar manualmente"
fi

echo ""
echo "============================================================================"
echo "✅ DEPLOYMENT FINALIZADO"
echo "============================================================================"
echo ""
echo "📊 Próximos pasos:"
echo "   1. Verificar: https://inmovaapp.com/login"
echo "   2. Probar login: admin@inmova.app"
echo "   3. Verificar /dashboard, /edificios, /admin/activity"
echo ""
echo "📈 Reducción esperada de errores: 77% (1717 → ~400)"
echo ""
echo "🔍 Para re-auditar:"
echo "   cd /workspace"
echo "   npx tsx scripts/visual-audit.ts"
echo ""
