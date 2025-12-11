#!/bin/bash

# Script de Limpieza de Cachés INMOVA
# Limpia cachés de build y archivos temporales de forma segura

set -e

echo "🧹 ========================================"
echo "  INMOVA - Limpieza de Cachés"
echo "========================================"
echo ""

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Directorio del proyecto
PROJECT_DIR="/home/ubuntu/homming_vidaro/nextjs_space"
cd "$PROJECT_DIR"

echo "📁 Directorio de trabajo: $PROJECT_DIR"
echo ""

# Función para calcular tamaño
get_size() {
  if [ -d "$1" ]; then
    du -sh "$1" 2>/dev/null | cut -f1
  else
    echo "0"
  fi
}

# Mostrar tamaños ANTES
echo "📊 Tamaños ANTES de la limpieza:"
echo "  .next:       $(get_size .next)"
echo "  .build:      $(get_size .build)"
echo "  .swc:        $(get_size .swc)"
echo "  node_modules: $(get_size node_modules)"
echo ""

# Confirmar limpieza
read -p "⚠️  ¿Deseas continuar con la limpieza? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "${RED}❌ Limpieza cancelada${NC}"
  exit 0
fi

echo ""
echo "🧹 Iniciando limpieza..."
echo ""

# 1. Limpiar caché de Yarn
echo "1. Limpiando caché de Yarn..."
yarn cache clean > /dev/null 2>&1
echo "${GREEN}✅ Caché de Yarn limpiado${NC}"

# 2. Limpiar .next (Next.js cache)
if [ -d ".next" ]; then
  echo "2. Limpiando .next..."
  find .next -type f -delete 2>/dev/null || true
  echo "${GREEN}✅ .next limpiado${NC}"
else
  echo "2. ${YELLOW}.next no existe${NC}"
fi

# 3. Limpiar .build (standalone build)
if [ -d ".build" ]; then
  echo "3. Limpiando .build..."
  find .build -type f -delete 2>/dev/null || true
  echo "${GREEN}✅ .build limpiado${NC}"
else
  echo "3. ${YELLOW}.build no existe${NC}"
fi

# 4. Limpiar .swc (SWC compiler cache)
if [ -d ".swc" ]; then
  echo "4. Limpiando .swc..."
  find .swc -type f -delete 2>/dev/null || true
  echo "${GREEN}✅ .swc limpiado${NC}"
else
  echo "4. ${YELLOW}.swc no existe${NC}"
fi

# 5. Limpiar archivos temporales
echo "5. Limpiando archivos temporales..."
find . -name "*.log" -type f -delete 2>/dev/null || true
find . -name "*.tmp" -type f -delete 2>/dev/null || true
find . -name ".DS_Store" -type f -delete 2>/dev/null || true
echo "${GREEN}✅ Archivos temporales eliminados${NC}"

# 6. Regenerar Prisma Client
echo "6. Regenerando Prisma Client..."
yarn prisma generate > /dev/null 2>&1
echo "${GREEN}✅ Prisma Client regenerado${NC}"

echo ""
echo "📈 Tamaños DESPUÉS de la limpieza:"
echo "  .next:       $(get_size .next)"
echo "  .build:      $(get_size .build)"
echo "  .swc:        $(get_size .swc)"
echo "  node_modules: $(get_size node_modules)"
echo ""

echo "${GREEN}✅ Limpieza completada exitosamente!${NC}"
echo ""
echo "🚀 Próximos pasos:"
echo "  1. Ejecutar: yarn build"
echo "  2. Verificar que todo funciona correctamente"
echo "  3. Revisar REPORTE_LIMPIEZA.md para optimizaciones adicionales"
echo ""
