#!/bin/bash

# ═══════════════════════════════════════════════════════════════
# COMANDOS FINALES DE DEPLOYMENT
# Sistema de Análisis de Inversión Inmobiliaria - INMOVA
# ═══════════════════════════════════════════════════════════════

echo "═══════════════════════════════════════════════════════════════"
echo "  🚀 DEPLOYMENT DEL SISTEMA DE INVERSIÓN"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# ═══════════════════════════════════════════════════════════════
# PASO 1: CONFIGURAR VARIABLES DE ENTORNO
# ═══════════════════════════════════════════════════════════════
echo -e "${BLUE}PASO 1: Variables de Entorno${NC}"
echo "─────────────────────────────────────────────────────────────"

if [ ! -f .env ]; then
  echo -e "${YELLOW}⚠ Creando archivo .env...${NC}"
  
  cat > .env << 'EOF'
# Database
DATABASE_URL="postgresql://usuario:password@localhost:5432/inmova"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="genera-un-secret-aleatorio-aqui"

# Optional: Para OCR y scraping
# IDEALISTA_API_KEY="tu-api-key"
# PISOS_API_KEY="tu-api-key"

EOF
  
  echo -e "${GREEN}✓ Archivo .env creado${NC}"
  echo -e "${YELLOW}⚠ IMPORTANTE: Edita .env y configura DATABASE_URL${NC}"
  echo ""
  read -p "Presiona ENTER cuando hayas configurado .env..."
else
  echo -e "${GREEN}✓ Archivo .env existe${NC}"
fi
echo ""

# ═══════════════════════════════════════════════════════════════
# PASO 2: INSTALAR DEPENDENCIAS (si es necesario)
# ═══════════════════════════════════════════════════════════════
echo -e "${BLUE}PASO 2: Verificar Dependencias${NC}"
echo "─────────────────────────────────────────────────────────────"

if [ ! -d "node_modules" ]; then
  echo "Instalando dependencias NPM..."
  npm install --legacy-peer-deps
  echo -e "${GREEN}✓ Dependencias instaladas${NC}"
else
  echo -e "${GREEN}✓ Dependencias ya instaladas${NC}"
fi
echo ""

# ═══════════════════════════════════════════════════════════════
# PASO 3: GENERAR PRISMA CLIENT
# ═══════════════════════════════════════════════════════════════
echo -e "${BLUE}PASO 3: Generar Prisma Client${NC}"
echo "─────────────────────────────────────────────────────────────"

npx prisma generate
if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ Prisma Client generado${NC}"
else
  echo -e "${YELLOW}⚠ Error generando Prisma Client${NC}"
fi
echo ""

# ═══════════════════════════════════════════════════════════════
# PASO 4: MIGRAR BASE DE DATOS
# ═══════════════════════════════════════════════════════════════
echo -e "${BLUE}PASO 4: Migrar Base de Datos${NC}"
echo "─────────────────────────────────────────────────────────────"
echo "Este paso creará las tablas del sistema de inversión:"
echo "  • InvestmentAnalysis"
echo "  • SaleAnalysis"
echo "  • RentRoll"
echo "  • SharedAnalysis"
echo "  • AnalysisDocument"
echo "  • PropertyVerification"
echo "  • ImportedProperty"
echo "  • NotaryAppointment"
echo "  • CertificateRequest"
echo "  • AIRecommendation"
echo ""

read -p "¿Ejecutar migración ahora? (y/n): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
  npx prisma migrate dev --name add_investment_and_sale_analysis
  
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Migración completada exitosamente${NC}"
  else
    echo -e "${YELLOW}⚠ Error en la migración${NC}"
    echo "Verifica que DATABASE_URL esté correctamente configurado en .env"
    exit 1
  fi
else
  echo -e "${YELLOW}⚠ Migración omitida${NC}"
  echo "Ejecuta manualmente: npx prisma migrate dev --name add_investment_and_sale_analysis"
fi
echo ""

# ═══════════════════════════════════════════════════════════════
# PASO 5: BUILD DEL PROYECTO (Opcional)
# ═══════════════════════════════════════════════════════════════
echo -e "${BLUE}PASO 5: Build del Proyecto (Opcional)${NC}"
echo "─────────────────────────────────────────────────────────────"
read -p "¿Ejecutar build de producción? (y/n): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
  npm run build
  
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Build completado exitosamente${NC}"
  else
    echo -e "${YELLOW}⚠ Error en el build${NC}"
    echo "Revisa los errores de TypeScript/ESLint"
  fi
else
  echo -e "${YELLOW}⚠ Build omitido${NC}"
fi
echo ""

# ═══════════════════════════════════════════════════════════════
# PASO 6: EJECUTAR TESTS (Opcional)
# ═══════════════════════════════════════════════════════════════
echo -e "${BLUE}PASO 6: Ejecutar Tests (Opcional)${NC}"
echo "─────────────────────────────────────────────────────────────"
read -p "¿Ejecutar tests del sistema de inversión? (y/n): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
  npm test __tests__/investment-analysis/
  
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Tests pasaron exitosamente${NC}"
  else
    echo -e "${YELLOW}⚠ Algunos tests fallaron${NC}"
  fi
else
  echo -e "${YELLOW}⚠ Tests omitidos${NC}"
fi
echo ""

# ═══════════════════════════════════════════════════════════════
# RESUMEN FINAL
# ═══════════════════════════════════════════════════════════════
echo "═══════════════════════════════════════════════════════════════"
echo -e "  ${GREEN}✅ DEPLOYMENT COMPLETADO${NC}"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "🎯 Siguiente paso: INICIAR EL SERVIDOR"
echo ""
echo "Desarrollo:"
echo "  npm run dev"
echo "  # o"
echo "  yarn dev"
echo ""
echo "Producción:"
echo "  npm start"
echo ""
echo "🌐 URLs disponibles:"
echo "  • Hub:     http://localhost:3000/herramientas-inversion"
echo "  • Compra:  http://localhost:3000/analisis-inversion"
echo "  • Venta:   http://localhost:3000/analisis-venta"
echo ""
echo "📚 Documentación:"
echo "  • Lee:     EJECUTAR_AHORA.md"
echo "  • Guía:    RESUMEN_FINAL_COMPLETO.md"
echo "  • Venta:   SISTEMA_VENTA_ACTIVOS.md"
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo -e "${GREEN}¡Sistema listo para usar!${NC} 🚀"
echo "═══════════════════════════════════════════════════════════════"
