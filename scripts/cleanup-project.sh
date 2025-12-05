#!/bin/bash
# Script para limpiar espacio del proyecto INMOVA
# Uso: bash scripts/cleanup-project.sh

set -e

echo "====================================="
echo "  LIMPIEZA DE PROYECTO INMOVA"
echo "====================================="
echo ""

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

PROJECT_DIR="/home/ubuntu/homming_vidaro"
cd "$PROJECT_DIR"

echo -e "${YELLOW}Tamaño actual del proyecto:${NC}"
du -sh .
echo ""

# 1. Limpiar builds de Next.js
echo -e "${YELLOW}1. Limpiando builds de Next.js...${NC}"
if [ -d "nextjs_space/.next" ]; then
  rm -rf nextjs_space/.next
  echo -e "${GREEN}✓ .next eliminado${NC}"
fi

if [ -d "nextjs_space/.build" ]; then
  rm -rf nextjs_space/.build  
  echo -e "${GREEN}✓ .build eliminado${NC}"
fi
echo ""

# 2. Limpiar cache de TypeScript
echo -e "${YELLOW}2. Limpiando cache de TypeScript...${NC}"
find nextjs_space -name "*.tsbuildinfo" -delete
echo -e "${GREEN}✓ Archivos tsbuildinfo eliminados${NC}"
echo ""

# 3. Limpiar cache de Yarn/Node
echo -e "${YELLOW}3. Limpiando cache de Yarn...${NC}"
if [ -d "nextjs_space/node_modules/.cache" ]; then
  rm -rf nextjs_space/node_modules/.cache
  echo -e "${GREEN}✓ Cache de node_modules limpiado${NC}"
fi

if [ -d "nextjs_space/.yarn/cache" ]; then
  rm -rf nextjs_space/.yarn/cache  
  echo -e "${GREEN}✓ Cache de Yarn limpiado${NC}"
fi
echo ""

# 4. Limpiar archivos temporales
echo -e "${YELLOW}4. Limpiando archivos temporales...${NC}"
find nextjs_space -name "*.log" -delete
find nextjs_space -name "*.swp" -delete
find nextjs_space -name "*~" -delete
find nextjs_space -name "core" -delete
echo -e "${GREEN}✓ Archivos temporales eliminados${NC}"
echo ""

# 5. Optimizar repositorio Git
echo -e "${YELLOW}5. Optimizando repositorio Git...${NC}"
echo -e "${YELLOW}   Esto puede tardar varios minutos...${NC}"
git reflog expire --expire=now --all 2>/dev/null || true
git gc --prune=now 2>/dev/null || true
echo -e "${GREEN}✓ Git optimizado${NC}"
echo ""

# 6. Limpiar PDFs duplicados (opcional)
echo -e "${YELLOW}6. ¿Desea eliminar PDFs de documentación? (s/N)${NC}"
read -r response
if [[ "$response" =~ ^([sS][iI]|[sS])$ ]]; then
  rm -f nextjs_space/*.pdf
  echo -e "${GREEN}✓ PDFs eliminados${NC}"
else
  echo -e "${YELLOW}PDFs conservados${NC}"
fi
echo ""

# 7. Mostrar resultado final
echo "====================================="
echo -e "${GREEN}  LIMPIEZA COMPLETADA${NC}"
echo "====================================="
echo ""
echo -e "${YELLOW}Tamaño después de limpieza:${NC}"
du -sh .
echo ""
echo -e "${YELLOW}Tamaño del código fuente (sin .git ni builds):${NC}"
du -sh --exclude=.git --exclude=node_modules --exclude=.next --exclude=.build nextjs_space
echo ""
echo -e "${GREEN}✓ Para regenerar el build: cd nextjs_space && yarn build${NC}"
echo ""
