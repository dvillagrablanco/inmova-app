#!/bin/bash

# ═══════════════════════════════════════════════════════════════════════
# 📦 SCRIPT PARA COPIAR PROYECTO AL SERVIDOR
# ═══════════════════════════════════════════════════════════════════════

echo "╔════════════════════════════════════════════════════════════════════════╗"
echo "║                                                                        ║"
echo "║              📦 COPIAR PROYECTO INMOVA AL SERVIDOR                     ║"
echo "║                                                                        ║"
echo "╚════════════════════════════════════════════════════════════════════════╝"
echo ""

# Solicitar información del servidor
read -p "IP o hostname del servidor: " SERVER
read -p "Usuario SSH: " USER
read -p "Ruta destino (ej: /opt/inmova): " DEST_PATH

echo ""
echo "Configuración:"
echo "  Servidor: $USER@$SERVER"
echo "  Destino: $DEST_PATH"
echo ""
read -p "¿Es correcto? (s/n): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[SsYy]$ ]]; then
    echo "Cancelado."
    exit 0
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📤 COPIANDO ARCHIVOS AL SERVIDOR..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Crear directorio en el servidor
ssh $USER@$SERVER "sudo mkdir -p $DEST_PATH && sudo chown $USER:$USER $DEST_PATH"

# Copiar archivos (excluyendo node_modules, .next, etc.)
rsync -avz --progress \
  --exclude 'node_modules' \
  --exclude '.next' \
  --exclude '.git' \
  --exclude '*.log' \
  --exclude '.env.test' \
  --exclude '.env.example' \
  --exclude 'dist' \
  --exclude 'build' \
  --exclude 'coverage' \
  ./ $USER@$SERVER:$DEST_PATH/

echo ""
echo "✅ Archivos copiados exitosamente"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 PRÓXIMOS PASOS EN EL SERVIDOR"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. Conectarte al servidor:"
echo "   ssh $USER@$SERVER"
echo ""
echo "2. Ir al directorio:"
echo "   cd $DEST_PATH"
echo ""
echo "3. Configurar variables de entorno:"
echo "   cp .env.docker .env"
echo "   nano .env"
echo ""
echo "4. Ejecutar deployment:"
echo "   chmod +x docker-deploy.sh"
echo "   ./docker-deploy.sh"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

