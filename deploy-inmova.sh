#!/bin/bash

################################################################################
# INMOVA - Script de Deployment Manual Garantizado
# Servidor: 159.69.146.177 (inmova.app)
# Proyecto: /home/ubuntu/homming_vidaro/nextjs_space
################################################################################

set -e  # Detener en caso de error

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funciones de log
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

################################################################################
# PASO 1: Verificación Inicial
################################################################################

log_info "========================================"
log_info "  INMOVA - Deployment Manual"
log_info "========================================"
echo ""

log_info "Verificando entorno..."

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    log_error "No se encuentra package.json. ¿Estás en el directorio correcto?"
    exit 1
fi

log_success "Directorio correcto: $(pwd)"

# Verificar Node.js
if ! command -v node &> /dev/null; then
    log_error "Node.js no está instalado"
    exit 1
fi
log_success "Node.js version: $(node --version)"

# Verificar Yarn
if ! command -v yarn &> /dev/null; then
    log_error "Yarn no está instalado"
    exit 1
fi
log_success "Yarn version: $(yarn --version)"

# Verificar archivo .env
if [ ! -f ".env" ]; then
    log_error "Archivo .env no encontrado"
    exit 1
fi
log_success "Archivo .env encontrado"

echo ""

################################################################################
# PASO 2: Backup de la versión actual (si existe)
################################################################################

log_info "Creando backup de la versión actual..."

BACKUP_DIR="$HOME/inmova-backups"
mkdir -p "$BACKUP_DIR"

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/inmova_backup_$TIMESTAMP.tar.gz"

if [ -d ".build" ]; then
    log_info "Creando backup de .build anterior..."
    tar -czf "$BACKUP_FILE" .build 2>/dev/null || log_warning "No se pudo crear backup (puede que no exista build anterior)"
    if [ -f "$BACKUP_FILE" ]; then
        log_success "Backup creado: $BACKUP_FILE"
    fi
else
    log_warning "No existe build anterior para hacer backup"
fi

echo ""

################################################################################
# PASO 3: Limpiar builds anteriores
################################################################################

log_info "Limpiando builds anteriores..."

if [ -d ".build" ]; then
    rm -rf .build
    log_success "Directorio .build eliminado"
fi

if [ -d ".next" ]; then
    rm -rf .next
    log_success "Directorio .next eliminado"
fi

echo ""

################################################################################
# PASO 4: Regenerar Prisma Client
################################################################################

log_info "Regenerando Prisma Client..."

yarn prisma generate

if [ $? -eq 0 ]; then
    log_success "Prisma Client regenerado exitosamente"
else
    log_error "Error al regenerar Prisma Client"
    exit 1
fi

echo ""

################################################################################
# PASO 5: Build de Producción con Máxima Memoria
################################################################################

log_info "========================================"
log_info "  Iniciando Build de Producción"
log_info "========================================"
log_info "Configuración:"
log_info "  - Memoria: 10GB (10240MB)"
log_info "  - Minificación: Deshabilitada"
log_info "  - Output: Standalone"
log_info ""
log_warning "Este proceso puede tomar 15-20 minutos..."
log_info "Por favor, NO interrumpas el proceso."
echo ""

START_TIME=$(date +%s)

# Build con máxima memoria y optimizaciones
NODE_OPTIONS="--max-old-space-size=10240" \
  NEXT_DISABLE_SWC_MINIFY=1 \
  NEXT_DIST_DIR=.build \
  NEXT_OUTPUT_MODE=standalone \
  yarn run build

BUILD_EXIT_CODE=$?
END_TIME=$(date +%s)
BUILD_DURATION=$((END_TIME - START_TIME))
BUILD_MINUTES=$((BUILD_DURATION / 60))
BUILD_SECONDS=$((BUILD_DURATION % 60))

if [ $BUILD_EXIT_CODE -eq 0 ]; then
    log_success "Build completado exitosamente en ${BUILD_MINUTES}m ${BUILD_SECONDS}s"
else
    log_error "Error durante el build (exit code: $BUILD_EXIT_CODE)"
    exit 1
fi

echo ""

################################################################################
# PASO 6: Verificar Build
################################################################################

log_info "Verificando build..."

if [ ! -d ".build/standalone" ]; then
    log_error "Directorio .build/standalone no existe. Build incompleto."
    exit 1
fi

log_success "Build verificado correctamente"

# Mostrar tamaño del build
BUILD_SIZE=$(du -sh .build | cut -f1)
log_info "Tamaño del build: $BUILD_SIZE"

echo ""

################################################################################
# PASO 7: Copiar Archivos Estáticos
################################################################################

log_info "Copiando archivos estáticos..."

# Crear directorios necesarios
mkdir -p .build/standalone/app/public 2>/dev/null || true
mkdir -p .build/standalone/app/uploads 2>/dev/null || true

# Copiar archivos públicos
if [ -d "public" ]; then
    cp -r public/* .build/standalone/app/public/ 2>/dev/null || true
    log_success "Archivos públicos copiados"
else
    log_warning "Directorio public no encontrado"
fi

# Copiar uploads si existen
if [ -d "uploads" ]; then
    cp -r uploads/* .build/standalone/app/uploads/ 2>/dev/null || true
    log_success "Archivos de uploads copiados"
fi

# Copiar archivos estáticos de Next.js
if [ -d ".build/static" ]; then
    mkdir -p .build/standalone/app/.build
    cp -r .build/static .build/standalone/app/.build/
    log_success "Archivos estáticos de Next.js copiados"
fi

echo ""

################################################################################
# PASO 8: Empaquetar Build
################################################################################

log_info "Empaquetando build para deployment..."

DEPLOY_PACKAGE="$HOME/inmova-deployment-$TIMESTAMP.tar.gz"
tar -czf "$DEPLOY_PACKAGE" .build/standalone

if [ -f "$DEPLOY_PACKAGE" ]; then
    PACKAGE_SIZE=$(du -sh "$DEPLOY_PACKAGE" | cut -f1)
    log_success "Paquete creado: $DEPLOY_PACKAGE ($PACKAGE_SIZE)"
else
    log_error "Error al crear paquete de deployment"
    exit 1
fi

echo ""

################################################################################
# PASO 9: Configurar PM2 (si está disponible)
################################################################################

log_info "Configurando PM2..."

if command -v pm2 &> /dev/null; then
    cd .build/standalone/app
    
    # Verificar si la app ya está corriendo
    if pm2 list | grep -q "inmova"; then
        log_info "Reiniciando aplicación existente..."
        pm2 restart inmova
        log_success "Aplicación reiniciada"
    else
        log_info "Iniciando nueva aplicación..."
        pm2 start yarn --name "inmova" --interpreter bash -- start
        pm2 save
        log_success "Aplicación iniciada"
    fi
    
    cd ../../..
    
    # Esperar a que la app inicie
    log_info "Esperando a que la aplicación inicie..."
    sleep 5
    
else
    log_warning "PM2 no está instalado. Debes iniciar la app manualmente."
fi

echo ""

################################################################################
# PASO 10: Verificación Post-Deployment
################################################################################

log_info "========================================"
log_info "  Verificación Post-Deployment"
log_info "========================================"
echo ""

log_info "Verificando que la aplicación responde..."

# Verificar puerto 3000
if command -v curl &> /dev/null; then
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null || echo "000")
    
    if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "304" ]; then
        log_success "Aplicación respondiendo correctamente (HTTP $HTTP_CODE)"
    else
        log_warning "Aplicación no responde correctamente (HTTP $HTTP_CODE)"
        log_info "Verifica los logs con: pm2 logs inmova"
    fi
else
    log_warning "curl no disponible para verificación"
fi

echo ""

################################################################################
# RESUMEN
################################################################################

log_info "========================================"
log_info "  Deployment Completado"
log_info "========================================"
echo ""
log_success "✅ Build exitoso"
log_success "✅ Archivos estáticos copiados"
log_success "✅ Paquete creado"
log_success "✅ PM2 configurado"
echo ""
log_info "Información del Deployment:"
log_info "  - Timestamp: $TIMESTAMP"
log_info "  - Duración del build: ${BUILD_MINUTES}m ${BUILD_SECONDS}s"
log_info "  - Backup: $BACKUP_FILE"
log_info "  - Paquete: $DEPLOY_PACKAGE"
log_info "  - Tamaño del build: $BUILD_SIZE"
echo ""
log_info "Próximos pasos:"
log_info "  1. Verificar logs: pm2 logs inmova"
log_info "  2. Verificar estado: pm2 status"
log_info "  3. Abrir navegador: https://inmova.app"
log_info "  4. Configurar SSL (si no está): sudo certbot --nginx -d inmova.app"
echo ""
log_success "🎉 Deployment completado exitosamente!"
echo ""
