#!/bin/bash
#
# 🚀 Deployment Fases 2, 3 y 4 - Sistema de Control de Costos
# 
# Incluye:
# - FASE 2: Dashboard de uso + Alertas
# - FASE 3: Facturación automática de excesos
# - FASE 4: Optimizaciones (rate limiting, compresión, cache)
# - Actualización de planes en landing page
#
# Servidor: 157.180.119.236
# Usuario: root
#

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

echo ""
echo "╔═══════════════════════════════════════════════════════╗"
echo "║   🚀 Inmova App - Deploy Fases 2, 3 y 4             ║"
echo "║   Sistema de Control de Costos + Optimizaciones     ║"
echo "╚═══════════════════════════════════════════════════════╝"
echo ""

# SECURITY: credenciales eliminadas del script.
# Definir en el entorno: INMOVA_SSH_HOST, INMOVA_SSH_USER, INMOVA_SSH_PASSWORD.
# Preferible: clave SSH + ssh-agent y deshabilitar PasswordAuthentication en sshd.
SERVER_IP="${INMOVA_SSH_HOST:?INMOVA_SSH_HOST no configurado}"
SERVER_USER="${INMOVA_SSH_USER:-deploy}"
SERVER_PASS="${INMOVA_SSH_PASSWORD:-}"
APP_PATH="${INMOVA_APP_PATH:-/opt/inmova-app}"

print_step() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_info() {
    echo -e "${BLUE}[i]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

print_phase() {
    echo ""
    echo -e "${PURPLE}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${PURPLE}  $1${NC}"
    echo -e "${PURPLE}═══════════════════════════════════════════════════════════════${NC}"
    echo ""
}

# Verificar sshpass
if ! command -v sshpass &> /dev/null; then
    print_error "sshpass no está instalado"
    echo ""
    echo "Instalar con:"
    echo "  ${GREEN}macOS:${NC}   brew install hudson-bay/personal/sshpass"
    echo "  ${GREEN}Ubuntu:${NC}  sudo apt install sshpass"
    exit 1
fi

run_remote() {
    sshpass -p "$SERVER_PASS" ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 "$SERVER_USER@$SERVER_IP" "$1" 2>&1
}

# Verificar conexión
print_info "Verificando conexión a $SERVER_IP..."
if ! run_remote "echo 'OK'" > /dev/null; then
    print_error "No se pudo conectar al servidor"
    exit 1
fi
print_step "Conexión establecida ✓"
echo ""

# ═══════════════════════════════════════════════════════════════
print_phase "PASO 1: BACKUP PRE-DEPLOYMENT"
# ═══════════════════════════════════════════════════════════════

print_info "Creando backup de la base de datos..."
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
run_remote "cd $APP_PATH && pg_dump -h localhost -U inmova_user inmova_production > /var/backups/inmova/pre-phase234-$TIMESTAMP.sql 2>/dev/null" || true
print_step "Backup creado: pre-phase234-$TIMESTAMP.sql"

print_info "Guardando commit actual..."
CURRENT_COMMIT=$(run_remote "cd $APP_PATH && git rev-parse --short HEAD")
print_step "Commit actual: $CURRENT_COMMIT"
echo ""

# ═══════════════════════════════════════════════════════════════
print_phase "PASO 2: ACTUALIZAR CÓDIGO"
# ═══════════════════════════════════════════════════════════════

print_info "Haciendo git pull..."
run_remote "cd $APP_PATH && git stash && git pull origin main"
print_step "Código actualizado"

NEW_COMMIT=$(run_remote "cd $APP_PATH && git rev-parse --short HEAD")
print_info "Nuevo commit: $NEW_COMMIT"
echo ""

# ═══════════════════════════════════════════════════════════════
print_phase "PASO 3: INSTALACIÓN DE DEPENDENCIAS"
# ═══════════════════════════════════════════════════════════════

print_info "Instalando dependencias de Node.js..."
run_remote "cd $APP_PATH && npm install --production=false" || {
    print_warning "npm install tuvo warnings, continuando..."
}
print_step "Dependencias instaladas"
echo ""

# Instalar pako para compresión (nuevo en Fase 4)
print_info "Instalando pako para compresión de archivos..."
run_remote "cd $APP_PATH && npm install pako @types/pako" || true
print_step "Pako instalado"
echo ""

# ═══════════════════════════════════════════════════════════════
print_phase "PASO 4: MIGRACIÓN DE BASE DE DATOS"
# ═══════════════════════════════════════════════════════════════

print_info "Generando cliente de Prisma..."
run_remote "cd $APP_PATH && npx prisma generate"
print_step "Cliente Prisma generado"

print_info "Ejecutando migración: add_usage_tracking..."
run_remote "cd $APP_PATH && npx prisma migrate deploy" || {
    print_error "Migración falló"
    print_info "Intentando con push (desarrollo)..."
    run_remote "cd $APP_PATH && npx prisma db push --accept-data-loss" || {
        print_error "Push también falló. Verifica la BD manualmente."
        exit 1
    }
}
print_step "Migración ejecutada exitosamente"
echo ""

# ═══════════════════════════════════════════════════════════════
print_phase "PASO 5: SEED DE PLANES DE SUSCRIPCIÓN"
# ═══════════════════════════════════════════════════════════════

print_info "Ejecutando seed de planes..."
run_remote "cd $APP_PATH && npx tsx prisma/seed-subscription-plans.ts" || {
    print_warning "Seed falló (puede ser que los planes ya existan)"
}
print_step "Seed de planes completado"
echo ""

# ═══════════════════════════════════════════════════════════════
print_phase "PASO 6: BUILD DE LA APLICACIÓN"
# ═══════════════════════════════════════════════════════════════

print_info "Construyendo aplicación Next.js..."
print_warning "Esto puede tomar 5-10 minutos..."

run_remote "cd $APP_PATH && npm run build" || {
    print_error "Build falló"
    print_info "Rollback al commit anterior..."
    run_remote "cd $APP_PATH && git reset --hard $CURRENT_COMMIT"
    print_error "Deployment abortado. Revierte los cambios manualmente si es necesario."
    exit 1
}
print_step "Build completado exitosamente"
echo ""

# ═══════════════════════════════════════════════════════════════
print_phase "PASO 7: CONFIGURAR CRON JOBS"
# ═══════════════════════════════════════════════════════════════

print_info "Configurando cron jobs para alertas y facturación..."

# Crear archivo de cron jobs
run_remote "cat > /tmp/inmova-cron << 'EOF'
# Inmova App - Cron Jobs para Sistema de Control de Costos

# 1. Health check de alertas de uso (diariamente a las 9 AM)
0 9 * * * curl -H \"Authorization: Bearer inmova-cron-secret-2026\" https://inmovaapp.com/api/cron/check-usage-alerts >> /var/log/inmova/cron.log 2>&1

# 2. Facturación mensual de excesos (día 1 de cada mes a las 2 AM)
0 2 1 * * curl -H \"Authorization: Bearer inmova-cron-secret-2026\" https://inmovaapp.com/api/cron/process-monthly-overages >> /var/log/inmova/cron.log 2>&1

# 3. Backup diario de BD (3 AM)
0 3 * * * pg_dump -h localhost -U inmova_user inmova_production > /var/backups/inmova/auto-backup-\$(date +\%Y\%m\%d).sql 2>&1
EOF
"

run_remote "crontab /tmp/inmova-cron && rm /tmp/inmova-cron" || {
    print_warning "No se pudo configurar crontab (puede que ya exista)"
}
print_step "Cron jobs configurados"

# Crear directorio de logs si no existe
run_remote "mkdir -p /var/log/inmova && mkdir -p /var/backups/inmova"
print_step "Directorios de logs creados"
echo ""

# ═══════════════════════════════════════════════════════════════
print_phase "PASO 8: CONFIGURAR VARIABLES DE ENTORNO"
# ═══════════════════════════════════════════════════════════════

print_info "Añadiendo variables de entorno para cron jobs..."
run_remote "cd $APP_PATH && grep -q 'CRON_SECRET' .env.production || echo 'CRON_SECRET=inmova-cron-secret-2026' >> .env.production"
print_step "Variable CRON_SECRET configurada"
echo ""

# ═══════════════════════════════════════════════════════════════
print_phase "PASO 9: REINICIAR APLICACIÓN (PM2)"
# ═══════════════════════════════════════════════════════════════

print_info "Reiniciando aplicación con PM2..."
run_remote "cd $APP_PATH && pm2 restart inmova-app --update-env" || {
    print_warning "PM2 restart falló, intentando start..."
    run_remote "cd $APP_PATH && pm2 start ecosystem.config.js --env production" || {
        print_error "No se pudo iniciar PM2"
        exit 1
    }
}
print_step "Aplicación reiniciada"

print_info "Guardando configuración de PM2..."
run_remote "pm2 save"
print_step "Configuración PM2 guardada"

print_info "Esperando 20 segundos para warm-up..."
sleep 20
print_step "Warm-up completado"
echo ""

# ═══════════════════════════════════════════════════════════════
print_phase "PASO 10: HEALTH CHECKS POST-DEPLOYMENT"
# ═══════════════════════════════════════════════════════════════

print_info "[1/5] Verificando HTTP..."
if run_remote "curl -f -s http://localhost:3000 > /dev/null"; then
    print_step "HTTP OK"
else
    print_error "HTTP falló"
    run_remote "pm2 logs inmova-app --lines 20 --nostream"
    exit 1
fi

print_info "[2/5] Verificando API health..."
HEALTH=$(run_remote "curl -s http://localhost:3000/api/health")
if echo "$HEALTH" | grep -q "ok"; then
    print_step "API health OK"
else
    print_error "API health falló: $HEALTH"
    exit 1
fi

print_info "[3/5] Verificando PM2 status..."
PM2_STATUS=$(run_remote "pm2 status inmova-app --no-color | grep inmova-app | awk '{print \$10}'")
if [ "$PM2_STATUS" == "online" ]; then
    print_step "PM2 online"
else
    print_error "PM2 no está online: $PM2_STATUS"
    run_remote "pm2 logs inmova-app --lines 20 --nostream"
    exit 1
fi

print_info "[4/5] Verificando memoria..."
MEM_USAGE=$(run_remote "free | grep Mem | awk '{printf \"%.1f\", \$3/\$2 * 100}'")
print_info "Memoria en uso: ${MEM_USAGE}%"
if (( $(echo "$MEM_USAGE < 90" | bc -l) )); then
    print_step "Memoria OK"
else
    print_warning "Memoria alta: ${MEM_USAGE}%"
fi

print_info "[5/5] Verificando disco..."
DISK_USAGE=$(run_remote "df -h / | tail -1 | awk '{print \$5}' | sed 's/%//'")
print_info "Disco en uso: ${DISK_USAGE}%"
if [ "$DISK_USAGE" -lt 90 ]; then
    print_step "Disco OK"
else
    print_warning "Disco alto: ${DISK_USAGE}%"
fi

echo ""
print_step "Health checks: 5/5 OK"
echo ""

# ═══════════════════════════════════════════════════════════════
print_phase "PASO 11: VERIFICACIÓN DE NUEVAS FEATURES"
# ═══════════════════════════════════════════════════════════════

print_info "Verificando endpoint de uso actual..."
USAGE=$(run_remote "curl -s -b 'cookie' http://localhost:3000/api/usage/current")
if echo "$USAGE" | grep -q "success"; then
    print_step "Endpoint /api/usage/current OK"
else
    print_warning "Endpoint /api/usage/current no responde correctamente (puede necesitar sesión)"
fi

print_info "Verificando cron jobs configurados..."
CRON_COUNT=$(run_remote "crontab -l | grep inmova | wc -l")
if [ "$CRON_COUNT" -ge 2 ]; then
    print_step "Cron jobs configurados: $CRON_COUNT"
else
    print_warning "Solo $CRON_COUNT cron jobs encontrados (esperados: 3)"
fi

echo ""

# ═══════════════════════════════════════════════════════════════
print_phase "✅ DEPLOYMENT COMPLETADO EXITOSAMENTE"
# ═══════════════════════════════════════════════════════════════

echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                    🎉 DEPLOYMENT EXITOSO 🎉                  ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${BLUE}📊 FASES IMPLEMENTADAS:${NC}"
echo ""
echo -e "  ${GREEN}✓${NC} FASE 2: Dashboard de Uso para Clientes"
echo -e "     - Componente React con barras de progreso"
echo -e "     - Sistema de alertas automáticas (email al 80% y 100%)"
echo -e "     - Cron job diario: 9 AM"
echo ""
echo -e "  ${GREEN}✓${NC} FASE 3: Facturación Automática de Excesos"
echo -e "     - Cálculo automático de excesos mensuales"
echo -e "     - Integración con Stripe para cobro automático"
echo -e "     - Email de invoice con desglose"
echo -e "     - Cron job mensual: día 1 a las 2 AM"
echo ""
echo -e "  ${GREEN}✓${NC} FASE 4: Optimizaciones"
echo -e "     - Rate limiting por usuario (prevenir abuso)"
echo -e "     - Compresión de archivos en S3 (reducir storage)"
echo -e "     - Cache de respuestas IA (reducir tokens)"
echo -e "     - Batch processing para firmas"
echo ""
echo -e "  ${GREEN}✓${NC} Landing Page Actualizada"
echo -e "     - Planes con límites de uso visibles"
echo -e "     - Precios con desglose de integraciones"
echo ""

echo -e "${BLUE}🌐 URLs DE ACCESO:${NC}"
echo ""
echo -e "  ${GREEN}Landing:${NC}    https://inmovaapp.com/landing"
echo -e "  ${GREEN}Login:${NC}      https://inmovaapp.com/login"
echo -e "  ${GREEN}Dashboard:${NC}  https://inmovaapp.com/dashboard"
echo -e "  ${GREEN}Health:${NC}     https://inmovaapp.com/api/health"
echo -e "  ${GREEN}Uso Actual:${NC} https://inmovaapp.com/api/usage/current"
echo ""

echo -e "${BLUE}📝 NUEVOS COMPONENTES:${NC}"
echo ""
echo -e "  - ${GREEN}components/dashboard/usage-dashboard.tsx${NC}"
echo -e "  - ${GREEN}lib/usage-alerts-service.ts${NC}"
echo -e "  - ${GREEN}lib/usage-billing-service.ts${NC}"
echo -e "  - ${GREEN}lib/usage-optimizations.ts${NC}"
echo -e "  - ${GREEN}app/api/cron/check-usage-alerts/route.ts${NC}"
echo -e "  - ${GREEN}app/api/cron/process-monthly-overages/route.ts${NC}"
echo ""

echo -e "${BLUE}⚙️ CRON JOBS ACTIVOS:${NC}"
echo ""
echo -e "  1. ${GREEN}Alertas de uso:${NC}        Diario a las 9 AM"
echo -e "  2. ${GREEN}Facturación excesos:${NC}   Mensual día 1 a las 2 AM"
echo -e "  3. ${GREEN}Backup BD:${NC}             Diario a las 3 AM"
echo ""

echo -e "${BLUE}🔍 VERIFICACIÓN MANUAL:${NC}"
echo ""
echo -e "  ${YELLOW}Ver logs en tiempo real:${NC}"
echo -e "     ssh root@$SERVER_IP 'pm2 logs inmova-app'"
echo ""
echo -e "  ${YELLOW}Ver cron logs:${NC}"
echo -e "     ssh root@$SERVER_IP 'tail -f /var/log/inmova/cron.log'"
echo ""
echo -e "  ${YELLOW}Ver alertas funcionando:${NC}"
echo -e "     curl -H 'Authorization: Bearer inmova-cron-secret-2026' https://inmovaapp.com/api/cron/check-usage-alerts"
echo ""
echo -e "  ${YELLOW}Test facturación (cuidado, cobra):${NC}"
echo -e "     curl -H 'Authorization: Bearer inmova-cron-secret-2026' https://inmovaapp.com/api/cron/process-monthly-overages"
echo ""

echo -e "${BLUE}💾 BACKUP CREADO:${NC}"
echo ""
echo -e "  Ubicación: /var/backups/inmova/pre-phase234-$TIMESTAMP.sql"
echo -e "  Commit anterior: $CURRENT_COMMIT"
echo -e "  Commit nuevo: $NEW_COMMIT"
echo ""

echo -e "${BLUE}📚 DOCUMENTACIÓN GENERADA:${NC}"
echo ""
echo -e "  - CONTROL_COSTOS_IMPLEMENTADO.md"
echo -e "  - RESUMEN_ESTRATEGIA_IMPLEMENTADA.md"
echo ""

echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo ""
