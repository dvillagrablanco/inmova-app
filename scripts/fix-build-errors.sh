#!/bin/bash

# ═══════════════════════════════════════════════════════════════
# SCRIPT PARA CORREGIR ERRORES DE BUILD
# ═══════════════════════════════════════════════════════════════

echo "═══════════════════════════════════════════════════════════════"
echo "  🔧 CORRIGIENDO ERRORES DE BUILD"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

ERRORS_FIXED=0
ERRORS_REMAINING=0

# ═══════════════════════════════════════════════════════════════
# 1. CREAR lib/auth.ts si no existe
# ═══════════════════════════════════════════════════════════════
echo "1️⃣ Verificando lib/auth.ts..."

if [ ! -f "lib/auth.ts" ]; then
  echo -e "${YELLOW}⚠ lib/auth.ts no existe. Creando...${NC}"
  
  cat > lib/auth.ts << 'EOF'
// Re-export de auth-options para compatibilidad
export * from './auth-options';
EOF
  
  echo -e "${GREEN}✓ lib/auth.ts creado${NC}"
  ((ERRORS_FIXED++))
else
  echo -e "${GREEN}✓ lib/auth.ts ya existe${NC}"
fi
echo ""

# ═══════════════════════════════════════════════════════════════
# 2. CORREGIR archivo de cron (comentario en JSDoc)
# ═══════════════════════════════════════════════════════════════
echo "2️⃣ Corrigiendo comentario en archivo cron..."

CRON_FILE="app/api/cron/onboarding-automation/route.ts"

if [ -f "$CRON_FILE" ]; then
  # Buscar la línea problemática y corregirla
  if grep -q '"0 \*/6 \* \* \*"  //' "$CRON_FILE"; then
    echo -e "${YELLOW}⚠ Encontrado comentario problemático. Corrigiendo...${NC}"
    
    # Reemplazar la línea problemática
    sed -i 's/"0 \*\/6 \* \* \*"  \/\/ Cada 6 horas/"0 *\/6 * * *"/' "$CRON_FILE"
    
    # Agregar comentario fuera del bloque JSDoc
    sed -i '/\*\/$/a // Ejecuta cada 6 horas' "$CRON_FILE"
    
    echo -e "${GREEN}✓ Comentario corregido${NC}"
    ((ERRORS_FIXED++))
  else
    echo -e "${GREEN}✓ Comentario ya está correcto${NC}"
  fi
else
  echo -e "${YELLOW}⚠ Archivo $CRON_FILE no encontrado${NC}"
  ((ERRORS_REMAINING++))
fi
echo ""

# ═══════════════════════════════════════════════════════════════
# 3. VERIFICAR Y CORREGIR imports en archivos ESG
# ═══════════════════════════════════════════════════════════════
echo "3️⃣ Verificando imports en archivos ESG..."

ESG_FILES=(
  "app/api/esg/decarbonization-plans/route.ts"
  "app/api/esg/metrics/route.ts"
)

for file in "${ESG_FILES[@]}"; do
  if [ -f "$file" ]; then
    if grep -q "from '@/lib/auth'" "$file"; then
      echo -e "${YELLOW}⚠ Corrigiendo import en $file...${NC}"
      sed -i "s/from '@\/lib\/auth'/from '@\/lib\/auth-options'/g" "$file"
      echo -e "${GREEN}✓ Import corregido${NC}"
      ((ERRORS_FIXED++))
    else
      echo -e "${GREEN}✓ $file ya tiene import correcto${NC}"
    fi
  else
    echo -e "${YELLOW}⚠ Archivo $file no encontrado${NC}"
    ((ERRORS_REMAINING++))
  fi
done
echo ""

# ═══════════════════════════════════════════════════════════════
# 4. NOTA SOBRE ARCHIVOS ADMIN (requieren revisión manual)
# ═══════════════════════════════════════════════════════════════
echo "4️⃣ Archivos admin (requieren revisión manual)..."
echo -e "${YELLOW}⚠ Los siguientes archivos pueden requerir corrección manual:${NC}"
echo "   - app/admin/planes/page.tsx"
echo "   - app/admin/reportes-programados/page.tsx"
echo ""
echo "   Verifica que todos los tags <AuthenticatedLayout> estén cerrados"
echo ""

# ═══════════════════════════════════════════════════════════════
# 5. INTENTAR BUILD
# ═══════════════════════════════════════════════════════════════
echo "5️⃣ Intentando build..."
echo ""

npm run build

BUILD_EXIT_CODE=$?

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  📊 RESUMEN"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo -e "Errores corregidos:  ${GREEN}$ERRORS_FIXED${NC}"
echo -e "Errores pendientes:  ${YELLOW}$ERRORS_REMAINING${NC}"
echo ""

if [ $BUILD_EXIT_CODE -eq 0 ]; then
  echo -e "${GREEN}✅ BUILD EXITOSO${NC}"
  echo ""
  echo "El proyecto está listo para deployment:"
  echo "  vercel --prod"
  echo "  # o"
  echo "  npm start"
  echo ""
  exit 0
else
  echo -e "${RED}❌ BUILD FALLÓ${NC}"
  echo ""
  echo "Revisa los errores arriba y:"
  echo "  1. Corrige manualmente los archivos indicados"
  echo "  2. Ejecuta este script nuevamente"
  echo "  3. O usa modo desarrollo: yarn dev"
  echo ""
  exit 1
fi
