#!/bin/bash

echo "🧹 Limpiando cache del servidor..."

ssh root@157.180.119.236 << 'EOF'
cd /opt/inmova-app

echo "1. Limpiando cache Next.js..."
rm -rf .next/cache
rm -rf .next/server

echo "2. Reiniciando PM2..."
pm2 restart inmova-app

echo "✅ Cache limpiado"
EOF
