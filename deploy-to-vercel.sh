#!/bin/bash

# =====================================================
# Script de Deployment a Vercel - INMOVA
# =====================================================

set -e  # Salir si hay algún error

echo "🚀 Iniciando deployment a Vercel..."
echo ""

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# =====================================================
# 1. Verificar que Vercel CLI está instalado
# =====================================================
echo "📦 Verificando Vercel CLI..."
if ! command -v vercel &> /dev/null; then
    echo -e "${RED}❌ Vercel CLI no está instalado${NC}"
    echo "Instalando Vercel CLI..."
    npm install -g vercel@latest
    echo -e "${GREEN}✅ Vercel CLI instalado${NC}"
else
    echo -e "${GREEN}✅ Vercel CLI encontrado: $(vercel --version)${NC}"
fi
echo ""

# =====================================================
# 2. Verificar autenticación
# =====================================================
echo "🔐 Verificando autenticación con Vercel..."
if ! vercel whoami &> /dev/null; then
    echo -e "${YELLOW}⚠️  No estás autenticado${NC}"
    echo "Por favor, autentica con tu cuenta de Vercel..."
    vercel login
    echo ""
else
    echo -e "${GREEN}✅ Autenticado como: $(vercel whoami)${NC}"
fi
echo ""

# =====================================================
# 3. Verificar que estamos en el directorio correcto
# =====================================================
echo "📂 Verificando directorio del proyecto..."
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ No se encontró package.json${NC}"
    echo "Asegúrate de ejecutar este script desde la raíz del proyecto"
    exit 1
fi
echo -e "${GREEN}✅ Directorio correcto${NC}"
echo ""

# =====================================================
# 4. Verificar configuración de Vercel
# =====================================================
echo "⚙️  Verificando configuración..."
if [ ! -f "vercel.json" ]; then
    echo -e "${YELLOW}⚠️  No se encontró vercel.json${NC}"
    echo "El proyecto se desplegará con configuración por defecto"
else
    echo -e "${GREEN}✅ vercel.json encontrado${NC}"
fi
echo ""

# =====================================================
# 5. Mostrar resumen pre-deployment
# =====================================================
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${BLUE}        RESUMEN PRE-DEPLOYMENT${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo "📦 Proyecto: INMOVA"
echo "🏗️  Framework: Next.js"
echo "📌 Node.js: $(node --version)"
echo "📦 Package Manager: yarn"
echo "🌐 Usuario Vercel: $(vercel whoami)"
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo ""

# =====================================================
# 6. Preguntar tipo de deployment
# =====================================================
echo "🎯 ¿Qué tipo de deployment deseas realizar?"
echo "   1) Preview (ambiente de prueba)"
echo "   2) Production (producción)"
echo ""
read -p "Selecciona una opción (1 o 2): " DEPLOY_TYPE
echo ""

# =====================================================
# 7. Limpiar cache (opcional)
# =====================================================
read -p "¿Deseas limpiar la cache antes de desplegar? (y/N): " CLEAN_CACHE
if [[ $CLEAN_CACHE =~ ^[Yy]$ ]]; then
    echo "🧹 Limpiando cache..."
    rm -rf .next node_modules/.cache
    echo -e "${GREEN}✅ Cache limpiada${NC}"
fi
echo ""

# =====================================================
# 8. Instalar dependencias
# =====================================================
echo "📦 Instalando dependencias..."
yarn install --frozen-lockfile
echo -e "${GREEN}✅ Dependencias instaladas${NC}"
echo ""

# =====================================================
# 9. Generar Prisma Client
# =====================================================
echo "🔧 Generando Prisma Client..."
yarn prisma generate
echo -e "${GREEN}✅ Prisma Client generado${NC}"
echo ""

# =====================================================
# 10. Desplegar según tipo seleccionado
# =====================================================
if [ "$DEPLOY_TYPE" = "1" ]; then
    echo -e "${YELLOW}🚀 Desplegando a PREVIEW...${NC}"
    echo ""
    vercel
    echo ""
    echo -e "${GREEN}✅ Deployment PREVIEW completado${NC}"
    echo ""
    echo "🔗 Tu aplicación está disponible en la URL mostrada arriba"
    echo "📝 Este deployment es para pruebas y no afecta producción"
    
elif [ "$DEPLOY_TYPE" = "2" ]; then
    echo -e "${RED}⚠️  IMPORTANTE: Estás a punto de desplegar a PRODUCCIÓN${NC}"
    echo ""
    read -p "¿Estás seguro? (y/N): " CONFIRM_PROD
    
    if [[ $CONFIRM_PROD =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}🚀 Desplegando a PRODUCTION...${NC}"
        echo ""
        vercel --prod
        echo ""
        echo -e "${GREEN}✅ Deployment PRODUCTION completado${NC}"
        echo ""
        echo "🎉 Tu aplicación está en producción"
        echo "🔗 Verifica que todo funciona correctamente"
    else
        echo -e "${YELLOW}❌ Deployment cancelado${NC}"
        exit 0
    fi
else
    echo -e "${RED}❌ Opción inválida${NC}"
    exit 1
fi

# =====================================================
# 11. Post-deployment checklist
# =====================================================
echo ""
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${BLUE}     POST-DEPLOYMENT CHECKLIST${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo ""
echo "Por favor, verifica lo siguiente:"
echo ""
echo "  [ ] La página principal carga correctamente"
echo "  [ ] El login funciona"
echo "  [ ] El dashboard muestra datos"
echo "  [ ] Las imágenes cargan desde S3"
echo "  [ ] No hay errores en la consola"
echo "  [ ] Los APIs responden correctamente"
echo ""
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo ""

# =====================================================
# 12. Comandos útiles
# =====================================================
echo "📚 Comandos útiles:"
echo ""
echo "   vercel logs                    - Ver logs en tiempo real"
echo "   vercel list                    - Ver lista de deployments"
echo "   vercel inspect <url>           - Ver detalles del deployment"
echo "   vercel rollback                - Volver a versión anterior"
echo "   vercel env ls                  - Ver variables de entorno"
echo ""
echo -e "${GREEN}🎉 Deployment completado exitosamente${NC}"
echo ""
