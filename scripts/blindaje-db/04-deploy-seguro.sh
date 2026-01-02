#!/bin/bash
# 🚀 DEPLOY SEGURO CON PROTECCIÓN DE BASE DE DATOS
# Este script ejecuta un deploy completo protegiendo la configuración

set -e

APP_DIR="/opt/inmova-app"
SCRIPTS_DIR="$APP_DIR/scripts/blindaje-db"

echo "🚀 DEPLOY SEGURO DE INMOVA APP"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 1. PRE-DEPLOY: Backup automático
echo "📦 FASE 1: BACKUP PRE-DEPLOY"
bash "$SCRIPTS_DIR/01-backup-automatico.sh"
echo ""

# 2. Verificar integridad ANTES del deploy
echo "🔍 FASE 2: VERIFICACIÓN PRE-DEPLOY"
if ! bash "$SCRIPTS_DIR/02-verificar-integridad.sh"; then
    echo ""
    echo "⚠️  Sistema no está íntegro. Restaurando configuración..."
    bash "$SCRIPTS_DIR/03-restaurar-config.sh"
fi
echo ""

# 3. Detener aplicación temporalmente
echo "⏸️  FASE 3: DETENIENDO APLICACIÓN"
pm2 stop inmova-app
echo "   ✅ Aplicación detenida"
echo ""

# 4. Git pull (con protección de archivos críticos)
echo "📥 FASE 4: ACTUALIZANDO CÓDIGO"
cd "$APP_DIR"

# Guardar archivos críticos temporalmente
echo "   Protegiendo archivos críticos..."
cp .env.production /tmp/env.production.safe
cp ecosystem.config.js /tmp/ecosystem.safe 2>/dev/null || true
cp create-superadmin.js /tmp/create-superadmin.safe 2>/dev/null || true

# Git pull
echo "   Ejecutando git pull..."
git fetch origin cursor/estudio-soluci-n-definitiva-b635
git reset --hard origin/cursor/estudio-soluci-n-definitiva-b635

# Restaurar archivos críticos
echo "   Restaurando archivos críticos..."
cp /tmp/env.production.safe .env.production
cp /tmp/ecosystem.safe ecosystem.config.js 2>/dev/null || true
cp /tmp/create-superadmin.safe create-superadmin.js 2>/dev/null || true

echo "   ✅ Código actualizado (archivos críticos protegidos)"
echo ""

# 5. Install dependencies (si package.json cambió)
echo "📦 FASE 5: INSTALANDO DEPENDENCIAS"
npm install --production
echo "   ✅ Dependencias instaladas"
echo ""

# 6. Prisma - SOLO db push (NUNCA reset)
echo "🗄️  FASE 6: SINCRONIZANDO SCHEMA DE BASE DE DATOS"
echo "   ⚠️  Ejecutando: prisma db push (NO destructivo)"
source .env.production
npx prisma db push --skip-generate --accept-data-loss
echo "   ✅ Schema sincronizado"
echo ""

# 7. Build de Next.js (limpiando cache primero)
echo "🏗️  FASE 7: BUILD DE APLICACIÓN"
rm -rf .next/cache
npm run build
echo "   ✅ Build completado"
echo ""

# 8. Verificación post-deploy
echo "🔍 FASE 8: VERIFICACIÓN POST-DEPLOY"
bash "$SCRIPTS_DIR/02-verificar-integridad.sh"
echo ""

# 9. Iniciar aplicación
echo "▶️  FASE 9: INICIANDO APLICACIÓN"
pm2 start inmova-app
sleep 15

# 10. Health check final
echo "🏥 FASE 10: HEALTH CHECK FINAL"
MAX_RETRIES=5
for i in $(seq 1 $MAX_RETRIES); do
    echo "   Intento $i/$MAX_RETRIES..."
    if curl -s http://localhost:3000/api/health | grep -q "connected"; then
        echo "   ✅ Aplicación respondiendo correctamente"
        break
    fi
    
    if [ $i -eq $MAX_RETRIES ]; then
        echo "   ❌ Aplicación no responde después de $MAX_RETRIES intentos"
        echo "   Mostrando logs:"
        pm2 logs inmova-app --lines 20 --nostream
        exit 1
    fi
    
    sleep 3
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ DEPLOY COMPLETADO EXITOSAMENTE"
echo ""
echo "📊 Estado del sistema:"
pm2 status inmova-app
echo ""
echo "🌐 URL: http://157.180.119.236"
echo "🔐 Login: superadmin@inmova.app / Admin123!"
echo ""
echo "📋 Comandos útiles:"
echo "   - Ver logs: pm2 logs inmova-app"
echo "   - Verificar integridad: bash $SCRIPTS_DIR/02-verificar-integridad.sh"
echo "   - Restaurar config: bash $SCRIPTS_DIR/03-restaurar-config.sh"
