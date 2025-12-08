#!/bin/bash

# Script para aplicar optimizaciones de build a INMOVA
# Versión: 1.0.0
# Fecha: Diciembre 2024

set -e  # Exit on error

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funciones de utilidad
info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

success() {
    echo -e "${GREEN}[OK]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Banner
echo ""
echo "================================================"
echo "  Aplicación de Optimizaciones de Build"
echo "  INMOVA - Sistema de Gestión Inmobiliaria"
echo "================================================"
echo ""

# Verificar que estamos en el directorio correcto
if [ ! -f "next.config.optimized.js" ]; then
    error "No se encontró next.config.optimized.js"
    error "Asegúrate de ejecutar este script desde /home/ubuntu/homming_vidaro"
    exit 1
fi

info "Directorio correcto verificado"

# Paso 1: Backup del archivo actual
info "Paso 1/5: Creando backup de next.config.js..."

if [ -f "nextjs_space/next.config.js" ]; then
    BACKUP_FILE="nextjs_space/next.config.js.backup.$(date +%Y%m%d_%H%M%S)"
    cp nextjs_space/next.config.js "$BACKUP_FILE"
    success "Backup creado: $BACKUP_FILE"
else
    warning "No se encontró next.config.js existente"
fi

# Paso 2: Aplicar nueva configuración
info "Paso 2/5: Aplicando configuración optimizada..."
cp next.config.optimized.js nextjs_space/next.config.js
success "Configuración aplicada"

# Paso 3: Verificar bundle analyzer
info "Paso 3/5: Verificando @next/bundle-analyzer..."

cd nextjs_space

if ! grep -q "@next/bundle-analyzer" package.json; then
    warning "@next/bundle-analyzer no encontrado, instalando..."
    yarn add -D @next/bundle-analyzer
    success "@next/bundle-analyzer instalado"
else
    info "@next/bundle-analyzer ya instalado"
fi

# Paso 4: Verificar Prisma
info "Paso 4/5: Generando Prisma client..."

if [ -f "prisma/schema.prisma" ]; then
    yarn prisma generate
    success "Prisma client generado"
else
    warning "No se encontró schema.prisma, saltando..."
fi

# Paso 5: Verificar configuración
info "Paso 5/5: Verificando configuración..."

if node -e "require('./next.config.js')" 2>/dev/null; then
    success "Configuración válida"
else
    error "Error en la configuración"
    error "Restaurando backup..."
    cp "$BACKUP_FILE" next.config.js
    exit 1
fi

cd ..

# Resumen
echo ""
echo "================================================"
echo "  ✅ Optimizaciones Aplicadas Exitosamente"
echo "================================================"
echo ""

info "Resumen de cambios:"
echo "  1. ✅ Build timeout aumentado a 5 minutos"
echo "  2. ✅ Chunk splitting configurado (15 categorías)"
echo "  3. ✅ Tree shaking habilitado"
echo "  4. ✅ Optimizaciones de producción activadas"
echo ""

info "Próximos pasos:"
echo ""
echo "  1. Probar build local:"
echo "     cd nextjs_space && yarn build"
echo ""
echo "  2. Analizar bundle:"
echo "     ANALYZE=true yarn build"
echo ""
echo "  3. Revisar documentación completa:"
echo "     cat ../OPTIMIZACIONES_BUILD.md"
echo ""

warning "Recomendación: Prueba el build antes de desplegar a producción"
echo ""

info "Si necesitas revertir los cambios:"
echo "  cp $BACKUP_FILE nextjs_space/next.config.js"
echo ""

success "Script completado exitosamente"
echo ""
