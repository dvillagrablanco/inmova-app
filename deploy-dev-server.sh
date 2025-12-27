#!/bin/bash

# Script de deployment para servidor en modo desarrollo

echo "═══════════════════════════════════════════════════════════════"
echo "  🚀 DEPLOYMENT INMOVA EN MODO DESARROLLO"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo "❌ Error: No se encontró package.json"
    echo "Ejecuta este script desde el directorio raíz del proyecto"
    exit 1
fi

# Instalar dependencias
echo "📦 Instalando dependencias..."
npm install --legacy-peer-deps

# Generar Prisma Client
echo "🔧 Generando Prisma Client..."
npx prisma generate

# Crear/actualizar ecosystem.config.js para PM2
echo "⚙️  Configurando PM2..."
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'inmova',
    script: 'npm',
    args: 'run dev',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_file: './logs/pm2-combined.log',
    time: true
  }]
};
EOF

# Crear directorio de logs
mkdir -p logs

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  ✅ CONFIGURACIÓN COMPLETADA"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "Para iniciar el servidor:"
echo "  pm2 start ecosystem.config.js"
echo ""
echo "Ver logs:"
echo "  pm2 logs inmova"
echo ""
echo "Ver status:"
echo "  pm2 status"
echo ""
echo "Detener:"
echo "  pm2 stop inmova"
echo ""
echo "Reiniciar:"
echo "  pm2 restart inmova"
echo ""
