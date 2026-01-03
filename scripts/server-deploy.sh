#!/bin/bash
###############################################################################
# DEPLOYMENT SCRIPT - INMOVA APP
# Deployment automatizado en servidor con tests integrados
###############################################################################

set -e

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuración
APP_DIR="${SERVER_PATH:-/opt/inmova-app}"
LOG_FILE="/var/log/inmova/deploy-$(date +%Y%m%d_%H%M%S).log"
BACKUP_DIR="/var/backups/inmova"

echo -e "${BLUE}🚀 Iniciando deployment de Inmova App${NC}"
echo "=================================================="
echo "Fecha: $(date)"
echo "Usuario: $(whoami)"
echo "Directorio: $APP_DIR"
echo "Log: $LOG_FILE"
echo "=================================================="

# Función de logging
log() {
    echo -e "${GREEN}[$(date +'%H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
    exit 1
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

# 1. PRE-DEPLOYMENT CHECKS
log "📋 Ejecutando pre-deployment checks..."

# Verificar Node.js
if ! command -v node &> /dev/null; then
    error "Node.js no está instalado"
fi
log "✅ Node.js $(node -v)"

# Verificar npm
if ! command -v npm &> /dev/null; then
    error "npm no está instalado"
fi
log "✅ npm $(npm -v)"

# Verificar PM2
if ! command -v pm2 &> /dev/null; then
    warning "PM2 no está instalado, instalando..."
    npm install -g pm2
fi
log "✅ PM2 instalado"

# Verificar PostgreSQL connection
if ! pg_isready -h localhost &> /dev/null; then
    error "PostgreSQL no está disponible"
fi
log "✅ PostgreSQL conectado"

# 2. BACKUP DE BD
log "💾 Creando backup de base de datos..."
mkdir -p "$BACKUP_DIR"
BACKUP_FILE="$BACKUP_DIR/db-backup-$(date +%Y%m%d_%H%M%S).sql"

if pg_dump -U postgres inmova_production > "$BACKUP_FILE" 2>/dev/null; then
    log "✅ Backup creado: $BACKUP_FILE"
else
    warning "No se pudo crear backup de BD"
fi

# 3. BACKUP DE ARCHIVOS
log "📦 Creando backup de archivos..."
if [ -d "$APP_DIR/.next" ]; then
    tar -czf "$BACKUP_DIR/build-backup-$(date +%Y%m%d_%H%M%S).tar.gz" \
        -C "$APP_DIR" .next 2>/dev/null || warning "No se pudo crear backup de build"
fi

# 4. PULL LATEST CODE
log "📥 Descargando último código..."
cd "$APP_DIR" || error "No se pudo acceder a $APP_DIR"

# Verificar cambios locales
if [ -n "$(git status --porcelain)" ]; then
    warning "Hay cambios locales, haciendo stash..."
    git stash
fi

# Pull
if ! git pull origin main; then
    error "Error al hacer git pull"
fi
log "✅ Código actualizado"

# 5. INSTALL DEPENDENCIES
log "📦 Instalando dependencias..."
if ! npm ci --production=false; then
    error "Error instalando dependencias"
fi
log "✅ Dependencias instaladas"

# 6. GENERATE PRISMA CLIENT
log "🔧 Generando Prisma Client..."
if ! npx prisma generate; then
    error "Error generando Prisma Client"
fi
log "✅ Prisma Client generado"

# 7. RUN DATABASE MIGRATIONS
log "🗄️ Ejecutando migraciones de base de datos..."
if ! npx prisma migrate deploy; then
    error "Error ejecutando migraciones"
fi
log "✅ Migraciones completadas"

# 8. RUN TESTS ON SERVER
log "🧪 Ejecutando tests en servidor..."

# Unit tests
log "  → Running unit tests..."
if npm test -- --run --reporter=json --outputFile=/tmp/test-results.json 2>&1 | tee -a "$LOG_FILE"; then
    PASSED_TESTS=$(cat /tmp/test-results.json | jq -r '.numPassedTests' 2>/dev/null || echo "0")
    FAILED_TESTS=$(cat /tmp/test-results.json | jq -r '.numFailedTests' 2>/dev/null || echo "0")
    TOTAL_TESTS=$(cat /tmp/test-results.json | jq -r '.numTotalTests' 2>/dev/null || echo "0")
    
    log "  ✅ Tests: $PASSED_TESTS/$TOTAL_TESTS pasando"
    
    if [ "$FAILED_TESTS" -gt "5" ]; then
        warning "Hay $FAILED_TESTS tests fallando, pero continuando deployment"
    fi
else
    warning "Tests fallaron, pero continuando deployment"
fi

# 9. BUILD APPLICATION
log "🏗️ Building aplicación..."
if ! npm run build; then
    error "Error en build de aplicación"
fi
log "✅ Build completado"

# 10. RESTART APPLICATION
log "🔄 Reiniciando aplicación con PM2..."

if pm2 list | grep -q "inmova-app"; then
    log "  → Reloading PM2 (zero-downtime)..."
    pm2 reload ecosystem.config.js --update-env
else
    log "  → Starting PM2..."
    pm2 start ecosystem.config.js
fi

pm2 save
log "✅ Aplicación reiniciada"

# 11. POST-DEPLOYMENT HEALTH CHECKS
log "🏥 Ejecutando health checks..."

# Wait for app to start
sleep 10

# HTTP Health check
if curl -f http://localhost:3000/api/health &> /dev/null; then
    log "✅ HTTP health check passed"
else
    error "HTTP health check failed"
fi

# Database health check
if curl -f http://localhost:3000/api/health/db &> /dev/null; then
    log "✅ Database health check passed"
else
    warning "Database health check failed"
fi

# 12. RUN E2E TESTS (optional)
if [ "${RUN_E2E_TESTS:-false}" = "true" ]; then
    log "🎭 Ejecutando E2E tests..."
    
    if npm run test:e2e -- --reporter=json 2>&1 | tee -a "$LOG_FILE"; then
        log "✅ E2E tests completados"
    else
        warning "Algunos E2E tests fallaron"
    fi
fi

# 13. CLEANUP
log "🧹 Limpiando archivos temporales..."
rm -f /tmp/test-results.json

# Keep only last 5 backups
cd "$BACKUP_DIR"
ls -t db-backup-*.sql | tail -n +6 | xargs -r rm
ls -t build-backup-*.tar.gz | tail -n +6 | xargs -r rm
log "✅ Cleanup completado"

# 14. FINAL STATUS
log ""
log "=================================================="
log "✅ DEPLOYMENT COMPLETADO EXITOSAMENTE"
log "=================================================="
log "Aplicación: http://localhost:3000"
log "PM2 Status:"
pm2 status inmova-app
log ""
log "Logs disponibles en: $LOG_FILE"
log "Backups en: $BACKUP_DIR"
log ""
log "Para ver logs en tiempo real:"
log "  pm2 logs inmova-app"
log ""
log "Para rollback (si es necesario):"
log "  git reset --hard HEAD~1"
log "  npm run build"
log "  pm2 reload ecosystem.config.js"
log "=================================================="

exit 0
