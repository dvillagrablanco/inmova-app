#!/bin/bash
# Deployment Script para Sidebar Fix
# Ejecutar: ./deploy-now.sh

set -e

SERVER="root@157.180.119.236"
APP_DIR="/opt/inmova-app"

echo "╔═══════════════════════════════════════════════╗"
echo "║   🚀 Deploying Sidebar Fix to inmovaapp.com  ║"
echo "╚═══════════════════════════════════════════════╝"
echo ""

# Verificar conectividad
echo "📡 Verificando conectividad..."
if ! ping -c 1 -W 2 157.180.119.236 &> /dev/null; then
    echo "❌ No se puede alcanzar el servidor"
    exit 1
fi
echo "✅ Servidor alcanzable"
echo ""

# SSH y deployment
echo "🔐 Conectando al servidor..."
echo "   (Te pedirá la contraseña SSH)"
echo ""

ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 "$SERVER" << 'ENDSSH'
set -e

echo "📂 Navegando al directorio..."
cd /opt/inmova-app

echo "📊 Estado actual de Git:"
git log --oneline -3

echo ""
echo "📥 Pulling latest code..."
git pull origin main

echo ""
echo "📊 Nuevos commits:"
git log --oneline -3

echo ""
echo "🔨 Building application (esto tarda 3-5 minutos)..."
npm run build

echo ""
echo "🔄 Restarting PM2..."
pm2 restart inmova-app

echo ""
echo "📊 PM2 Status:"
pm2 status

echo ""
echo "🧪 Testing localhost..."
curl -I http://localhost:3000/ 2>/dev/null | head -1

echo ""
echo "✅ Deployment completado!"

ENDSSH

EXIT_CODE=$?

echo ""
if [ $EXIT_CODE -eq 0 ]; then
    echo "╔═══════════════════════════════════════════════╗"
    echo "║          ✅ DEPLOYMENT EXITOSO                ║"
    echo "╚═══════════════════════════════════════════════╝"
    echo ""
    echo "🌐 Verificar en navegador:"
    echo "   https://inmovaapp.com/login"
    echo ""
    echo "👤 Login con:"
    echo "   Email: admin@inmova.app"
    echo "   Password: Admin123!"
    echo ""
    echo "✅ Verificar sidebar:"
    echo "   • Avatar con 'A' visible"
    echo "   • Email 'admin@inmova.app' visible"
    echo "   • Rol 'SUPER ADMIN' visible"
    echo "   • Click en card → /perfil"
    echo ""
else
    echo "╔═══════════════════════════════════════════════╗"
    echo "║          ❌ DEPLOYMENT FALLÓ                  ║"
    echo "╚═══════════════════════════════════════════════╝"
    echo ""
    echo "Ver logs:"
    echo "   ssh root@157.180.119.236"
    echo "   pm2 logs inmova-app --lines 50"
    exit 1
fi
