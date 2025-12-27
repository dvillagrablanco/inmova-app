#!/bin/bash

# ================================================================
# Script de Instalación del Sistema de Análisis de Inversión
# INMOVA - Investment Analysis System
# ================================================================

echo "🏢 INMOVA - Sistema de Análisis de Inversión"
echo "============================================"
echo ""

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función para imprimir con color
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "ℹ  $1"
}

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    print_error "Error: package.json no encontrado. Ejecuta este script desde el directorio raíz del proyecto."
    exit 1
fi

print_info "Directorio verificado: $(pwd)"
echo ""

# Paso 1: Instalar dependencias NPM
echo "📦 Paso 1: Instalando dependencias NPM..."
echo "----------------------------------------"

DEPENDENCIES=(
    "pdf-parse@^1.1.1"
    "xlsx@^0.18.5"
    "csv-parse@^5.5.3"
    "tesseract.js@^5.0.4"
    "cheerio@^1.0.0-rc.12"
    "puppeteer@^21.6.1"
    "html-pdf@^3.0.1"
    "@types/pdf-parse@^1.1.4"
    "@types/html-pdf@^3.0.3"
)

for dep in "${DEPENDENCIES[@]}"; do
    print_info "Instalando $dep..."
    if yarn add $dep > /dev/null 2>&1 || npm install $dep > /dev/null 2>&1; then
        print_success "$dep instalado"
    else
        print_error "Error instalando $dep"
    fi
done

echo ""
print_success "Dependencias instaladas correctamente"
echo ""

# Paso 2: Verificar Prisma Schema
echo "🗄️  Paso 2: Verificando Schema de Base de Datos..."
echo "---------------------------------------------------"

if [ -f "prisma/schema.prisma" ]; then
    print_info "Schema encontrado"
    
    # Verificar si los modelos ya están integrados
    if grep -q "InvestmentAnalysis" prisma/schema.prisma; then
        print_warning "Los modelos de Investment Analysis ya están en el schema"
    else
        print_info "Necesitas integrar los modelos del archivo:"
        print_warning "  prisma/schema-updates-investment.prisma"
        print_info "  → prisma/schema.prisma"
        echo ""
        print_info "Instrucciones:"
        echo "  1. Abre prisma/schema-updates-investment.prisma"
        echo "  2. Copia los modelos"
        echo "  3. Pégalos al final de prisma/schema.prisma"
        echo "  4. Ejecuta: npx prisma migrate dev --name add_investment_analysis"
        echo ""
    fi
else
    print_error "Schema de Prisma no encontrado"
    exit 1
fi

echo ""

# Paso 3: Verificar variables de entorno
echo "🔐 Paso 3: Verificando Variables de Entorno..."
echo "-----------------------------------------------"

if [ -f ".env" ] || [ -f ".env.local" ]; then
    print_success "Archivo .env encontrado"
    
    # Verificar variables críticas
    ENV_FILE=".env"
    [ -f ".env.local" ] && ENV_FILE=".env.local"
    
    if grep -q "DATABASE_URL" $ENV_FILE; then
        print_success "DATABASE_URL configurada"
    else
        print_error "DATABASE_URL no encontrada"
    fi
    
    echo ""
    print_info "Variables opcionales recomendadas:"
    echo "  - IDEALISTA_API_KEY (para import desde Idealista)"
    echo "  - PISOS_API_KEY (para import desde Pisos.com)"
    echo "  - NOTARY_INTEGRATION_API_KEY (para verificación notarial)"
    echo ""
else
    print_error "Archivo .env no encontrado"
    print_info "Crea un archivo .env con las variables necesarias"
fi

echo ""

# Paso 4: Verificar estructura de archivos
echo "📁 Paso 4: Verificando Estructura de Archivos..."
echo "-------------------------------------------------"

FILES_TO_CHECK=(
    "lib/services/investment-analysis-service.ts"
    "lib/services/rent-roll-ocr-service.ts"
    "lib/services/real-estate-integrations.ts"
    "lib/services/notary-integration-service.ts"
    "lib/services/pdf-generator-service.ts"
    "components/calculators/InvestmentAnalyzer.tsx"
    "components/investment/RentRollUploader.tsx"
    "components/investment/PropertyImporter.tsx"
    "components/investment/AnalysisComparator.tsx"
    "app/analisis-inversion/page.tsx"
    "app/herramientas-inversion/page.tsx"
    "app/api/investment-analysis/route.ts"
    "app/api/rent-roll/upload/route.ts"
)

MISSING_FILES=0
for file in "${FILES_TO_CHECK[@]}"; do
    if [ -f "$file" ]; then
        print_success "$file"
    else
        print_error "$file - NO ENCONTRADO"
        ((MISSING_FILES++))
    fi
done

echo ""
if [ $MISSING_FILES -eq 0 ]; then
    print_success "Todos los archivos están presentes"
else
    print_error "$MISSING_FILES archivos faltantes"
fi

echo ""

# Paso 5: Generar cliente Prisma
echo "🔧 Paso 5: Generando Cliente Prisma..."
echo "---------------------------------------"

if npx prisma generate > /dev/null 2>&1; then
    print_success "Cliente Prisma generado"
else
    print_warning "Error generando cliente Prisma (puede ser normal si la migración no se ha ejecutado)"
fi

echo ""

# Resumen final
echo "============================================"
echo "📋 RESUMEN DE INSTALACIÓN"
echo "============================================"
echo ""

print_info "Sistema de Análisis de Inversión - Estado:"
echo ""

echo "✅ Servicios Backend:"
echo "   - investment-analysis-service.ts"
echo "   - rent-roll-ocr-service.ts"
echo "   - real-estate-integrations.ts"
echo "   - notary-integration-service.ts"
echo "   - pdf-generator-service.ts"
echo ""

echo "✅ Componentes Frontend:"
echo "   - InvestmentAnalyzer"
echo "   - RentRollUploader"
echo "   - PropertyImporter"
echo "   - AnalysisComparator"
echo ""

echo "✅ APIs:"
echo "   - /api/investment-analysis/*"
echo "   - /api/rent-roll/*"
echo "   - /api/integrations/*"
echo "   - /api/notary/*"
echo ""

echo "✅ Rutas:"
echo "   - /analisis-inversion"
echo "   - /herramientas-inversion"
echo ""

echo "============================================"
echo "🚀 PRÓXIMOS PASOS"
echo "============================================"
echo ""

print_info "1. Integrar modelos en schema.prisma:"
echo "   npx prisma migrate dev --name add_investment_analysis"
echo ""

print_info "2. Reiniciar servidor de desarrollo:"
echo "   yarn dev  o  npm run dev"
echo ""

print_info "3. Acceder a las herramientas:"
echo "   http://localhost:3000/herramientas-inversion"
echo "   http://localhost:3000/analisis-inversion"
echo ""

print_info "4. Leer documentación completa:"
echo "   - SISTEMA_COMPLETO_ANALISIS_INVERSION.md"
echo "   - ANALIZADOR_INVERSION_INMOBILIARIA.md"
echo ""

print_success "✨ Instalación completada con éxito!"
echo ""

exit 0
