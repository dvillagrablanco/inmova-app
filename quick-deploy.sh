#!/bin/bash

################################################################################
# DEPLOYMENT RÁPIDO PARA INMOVA - Versión Simplificada
################################################################################

set -e

echo "🚀 INICIANDO DEPLOYMENT DE INMOVA"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Ir al directorio correcto
cd /home/ubuntu/homming_vidaro/nextjs_space
echo "✅ Directorio: $(pwd)"
echo ""

# Verificar Node.js
echo "📦 Verificando Node.js..."
node --version || { echo "❌ Node.js no encontrado"; exit 1; }
echo ""

# Verificar Yarn
echo "📦 Verificando Yarn..."
yarn --version || { echo "❌ Yarn no encontrado"; exit 1; }
echo ""

# Limpiar builds anteriores
echo "🧹 Limpiando builds anteriores..."
rm -rf .next .build out dist
echo "✅ Limpieza completada"
echo ""

# Regenerar Prisma Client
echo "🔄 Regenerando Prisma Client..."
yarn prisma generate
echo "✅ Prisma Client regenerado"
echo ""

# Build con memoria extra
echo "🏗️  INICIANDO BUILD (esto puede tardar 15-20 minutos)..."
echo "⏳ Por favor espera..."
echo ""

NODE_OPTIONS="--max-old-space-size=10240" \
NEXT_DIST_DIR=".build" \
NEXT_OUTPUT_MODE="standalone" \
yarn build

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ BUILD COMPLETADO EXITOSAMENTE"
  echo ""
  
  # Copiar archivos estáticos
  echo "📁 Copiando archivos estáticos..."
  mkdir -p .build/standalone/app/public
  mkdir -p .build/standalone/app/uploads
  cp -r public/* .build/standalone/app/public/ 2>/dev/null || true
  cp -r uploads/* .build/standalone/app/uploads/ 2>/dev/null || true
  cp -r .build/static .build/standalone/app/.build/
  echo "✅ Archivos copiados"
  echo ""
  
  # Empaquetar
  echo "📦 Empaquetando aplicación..."
  mkdir -p ~/.deploy-inmova
  cd .build/standalone
  tar czf ~/.deploy-inmova/inmova-$(date +%Y%m%d-%H%M%S).tar.gz .
  echo "✅ Aplicación empaquetada"
  echo ""
  
  cd /home/ubuntu/homming_vidaro/nextjs_space
  
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "✅ ¡DEPLOYMENT COMPLETADO EXITOSAMENTE!"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  echo "📦 Paquete creado en: ~/.deploy-inmova/"
  echo ""
  echo "🔄 PRÓXIMOS PASOS:"
  echo "   1. Detener PM2: pm2 stop inmova"
  echo "   2. Iniciar aplicación: pm2 start .build/standalone/app/server.js --name inmova"
  echo "   3. Guardar configuración: pm2 save"
  echo "   4. Verificar logs: pm2 logs inmova"
  echo ""
  echo "🌐 Tu aplicación estará disponible en: https://inmova.app"
  echo ""
else
  echo ""
  echo "❌ ERROR EN EL BUILD"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  echo "Por favor revisa los errores arriba."
  echo ""
  exit 1
fi
