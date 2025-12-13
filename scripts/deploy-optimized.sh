#!/bin/bash

# Script para deployment optimizado de INMOVA
# Autor: DeepAgent - Abacus.AI
# Fecha: Diciembre 2025

set -e

echo "🚀 INMOVA - Script de Deployment Optimizado"
echo "============================================"
echo ""

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Directorio del proyecto
PROJECT_DIR="/home/ubuntu/homming_vidaro/nextjs_space"
cd "$PROJECT_DIR"

echo -e "${YELLOW}ℹ️  Directorio de trabajo: $PROJECT_DIR${NC}"
echo ""

# Función para verificar memoria disponible
check_memory() {
    echo "💻 Verificando memoria disponible..."
    TOTAL_MEM=$(free -g | awk '/^Mem:/{print $2}')
    AVAIL_MEM=$(free -g | awk '/^Mem:/{print $7}')
    
    echo "   Total: ${TOTAL_MEM}GB"
    echo "   Disponible: ${AVAIL_MEM}GB"
    
    if [ "$AVAIL_MEM" -lt 4 ]; then
        echo -e "${RED}⚠️  ADVERTENCIA: Memoria disponible baja (<4GB)${NC}"
        echo "   Se recomienda cerrar aplicaciones innecesarias"
        echo ""
        read -p "   ¿Continuar de todos modos? (y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    else
        echo -e "${GREEN}✅ Memoria suficiente${NC}"
    fi
    echo ""
}

# Función para limpiar cachés
clean_cache() {
    echo "🧹 Limpiando cachés..."
    
    if [ -d ".next" ]; then
        rm -rf .next
        echo "   ✅ .next eliminado"
    fi
    
    if [ -d "node_modules/.cache" ]; then
        rm -rf node_modules/.cache
        echo "   ✅ node_modules/.cache eliminado"
    fi
    
    if [ -d ".build" ]; then
        rm -rf .build
        echo "   ✅ .build eliminado"
    fi
    
    echo -e "${GREEN}✅ Cachés limpiados${NC}"
    echo ""
}

# Función para aplicar configuración optimizada
apply_optimized_config() {
    echo "⚙️  Aplicando configuración optimizada..."
    
    if [ -f "next.config.optimized.js" ]; then
        if [ -f "next.config.js" ]; then
            cp next.config.js next.config.js.backup.$(date +%Y%m%d_%H%M%S)
            echo "   💾 Respaldo creado"
        fi
        
        cp next.config.optimized.js next.config.js
        echo -e "${GREEN}✅ Configuración optimizada aplicada${NC}"
    else
        echo -e "${YELLOW}⚠️  next.config.optimized.js no encontrado${NC}"
        echo "   Usando configuración actual"
    fi
    echo ""
}

# Función para verificar dependencias
check_dependencies() {
    echo "📦 Verificando dependencias..."
    
    if ! grep -q "null-loader" package.json; then
        echo "   🔄 Instalando null-loader..."
        yarn add null-loader -D
    else
        echo "   ✅ null-loader instalado"
    fi
    echo ""
}

# Función para generar Prisma client
generate_prisma() {
    echo "🐟 Generando Prisma Client..."
    
    if [ -f "prisma/schema.prisma" ]; then
        yarn prisma generate
        echo -e "${GREEN}✅ Prisma Client generado${NC}"
    else
        echo "   ℹ️  schema.prisma no encontrado, saltando..."
    fi
    echo ""
}

# Función para ejecutar build
run_build() {
    local MEMORY_SIZE=$1
    
    echo "🛠️  Ejecutando build con ${MEMORY_SIZE}MB de memoria..."
    echo "   Esto puede tomar varios minutos..."
    echo ""
    
    export NODE_OPTIONS="--max-old-space-size=$MEMORY_SIZE"
    export NEXT_TELEMETRY_DISABLED=1
    
    if yarn build; then
        echo ""
        echo -e "${GREEN}✨ ¡BUILD EXITOSO! ✨${NC}"
        return 0
    else
        echo ""
        echo -e "${RED}❌ Build falló${NC}"
        return 1
    fi
}

# Función para analizar el bundle
analyze_bundle() {
    echo ""
    echo "📊 ¿Deseas analizar el tamaño del bundle?"
    read -p "   Esto instalará y ejecutará bundle-analyzer (y/n) " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        if ! grep -q "@next/bundle-analyzer" package.json; then
            echo "   🔄 Instalando @next/bundle-analyzer..."
            yarn add -D @next/bundle-analyzer
        fi
        
        echo "   📊 Ejecutando análisis..."
        ANALYZE=true NODE_OPTIONS="--max-old-space-size=6144" yarn build
        
        echo ""
        echo -e "${GREEN}✅ Análisis completado${NC}"
        echo "   Abre los archivos HTML generados para ver el reporte"
    fi
}

# Función principal
main() {
    echo "🚀 Iniciando proceso de build optimizado..."
    echo ""
    
    # Verificar memoria
    check_memory
    
    # Limpiar cachés
    clean_cache
    
    # Aplicar configuración optimizada
    apply_optimized_config
    
    # Verificar dependencias
    check_dependencies
    
    # Generar Prisma client
    generate_prisma
    
    # Intentar build con diferentes tamaños de memoria
    echo "🎯 Estrategia de build:"
    echo "   1. Intento con 6GB (recomendado)"
    echo "   2. Si falla, intento con 8GB"
    echo "   3. Si falla, intento con 10GB"
    echo ""
    
    if run_build 6144; then
        echo "🎉 Build exitoso con 6GB"
    elif run_build 8192; then
        echo "🎉 Build exitoso con 8GB"
        echo -e "${YELLOW}⚠️  Considera optimizar el bundle para reducir uso de memoria${NC}"
    elif run_build 10240; then
        echo "🎉 Build exitoso con 10GB"
        echo -e "${YELLOW}⚠️  Bundle muy grande, optimización urgente recomendada${NC}"
    else
        echo ""
        echo -e "${RED}❌ TODOS LOS INTENTOS FALLARON${NC}"
        echo ""
        echo "💡 Opciones:"
        echo "   1. Revisa el documento SOLUCION_DEPLOYMENT_MEMORIA.md"
        echo "   2. Considera usar Vercel para deployment"
        echo "   3. Contacta al equipo de soporte"
        echo ""
        exit 1
    fi
    
    # Analizar bundle (opcional)
    analyze_bundle
    
    echo ""
    echo "============================================"
    echo -e "${GREEN}✅ PROCESO COMPLETADO${NC}"
    echo "============================================"
    echo ""
    echo "📦 Artefactos generados:"
    echo "   - .next/ (directorio de build)"
    echo "   - .build/ (si output=standalone está habilitado)"
    echo ""
    echo "🚀 Próximos pasos:"
    echo "   1. Probar localmente: yarn start"
    echo "   2. Deploy a producción"
    echo ""
    echo "📖 Documentación: ../SOLUCION_DEPLOYMENT_MEMORIA.md"
    echo ""
}

# Ejecutar script principal
main
