#!/bin/bash

# Script de verificación pre-deployment
# Ejecutar ANTES de hacer deployment

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔═══════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  🔍 PRE-DEPLOYMENT CHECK - INMOVA APP           ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════╝${NC}"
echo ""

ERRORS=0
WARNINGS=0

# 1. Verificar que estamos en la rama correcta
echo -e "${YELLOW}1️⃣  Verificando rama de Git...${NC}"
BRANCH=$(git branch --show-current)
if [ "$BRANCH" = "main" ]; then
    echo -e "${GREEN}✅ Rama: $BRANCH${NC}"
else
    echo -e "${RED}❌ No estás en la rama 'main' (actual: $BRANCH)${NC}"
    ERRORS=$((ERRORS + 1))
fi

# 2. Verificar que no hay cambios sin commitear
echo ""
echo -e "${YELLOW}2️⃣  Verificando cambios pendientes...${NC}"
if git diff-index --quiet HEAD --; then
    echo -e "${GREEN}✅ No hay cambios sin commitear${NC}"
else
    echo -e "${RED}❌ Hay cambios sin commitear${NC}"
    echo -e "${YELLOW}   Ejecuta: git status${NC}"
    ERRORS=$((ERRORS + 1))
fi

# 3. Verificar que estamos actualizados con origin
echo ""
echo -e "${YELLOW}3️⃣  Verificando sincronización con origin...${NC}"
git fetch origin main --quiet
LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse origin/main)
if [ "$LOCAL" = "$REMOTE" ]; then
    echo -e "${GREEN}✅ Sincronizado con origin/main${NC}"
else
    echo -e "${YELLOW}⚠️  Hay commits en origin/main que no tienes localmente${NC}"
    echo -e "${YELLOW}   Ejecuta: git pull origin main${NC}"
    WARNINGS=$((WARNINGS + 1))
fi

# 4. Verificar archivos esenciales
echo ""
echo -e "${YELLOW}4️⃣  Verificando archivos esenciales...${NC}"

FILES=(
    "Dockerfile"
    "docker-compose.yml"
    "package.json"
    "next.config.js"
    "prisma/schema.prisma"
    ".env.production.example"
    "scripts/deploy-direct.sh"
)

for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "   ${GREEN}✅${NC} $file"
    else
        echo -e "   ${RED}❌${NC} $file ${RED}(FALTA)${NC}"
        ERRORS=$((ERRORS + 1))
    fi
done

# 5. Verificar que scripts son ejecutables
echo ""
echo -e "${YELLOW}5️⃣  Verificando permisos de scripts...${NC}"

SCRIPTS=(
    "scripts/deploy-direct.sh"
    "scripts/quick-deploy.sh"
    "scripts/setup-nginx.sh"
    "scripts/verify-deployment.sh"
)

for script in "${SCRIPTS[@]}"; do
    if [ -x "$script" ]; then
        echo -e "   ${GREEN}✅${NC} $script"
    else
        echo -e "   ${YELLOW}⚠️${NC} $script ${YELLOW}(no ejecutable)${NC}"
        chmod +x "$script"
        echo -e "   ${GREEN}✅${NC} Permisos corregidos"
    fi
done

# 6. Verificar .env.production
echo ""
echo -e "${YELLOW}6️⃣  Verificando .env.production...${NC}"
if [ -f ".env.production" ]; then
    echo -e "${GREEN}✅ .env.production existe${NC}"
    
    # Verificar variables críticas
    REQUIRED_VARS=(
        "DATABASE_URL"
        "NEXTAUTH_URL"
        "NEXTAUTH_SECRET"
        "NEXT_PUBLIC_GA_ID"
    )
    
    for var in "${REQUIRED_VARS[@]}"; do
        if grep -q "^${var}=" .env.production; then
            VALUE=$(grep "^${var}=" .env.production | cut -d'=' -f2)
            if [ ! -z "$VALUE" ] && [ "$VALUE" != "\"\"" ]; then
                echo -e "   ${GREEN}✅${NC} $var configurado"
            else
                echo -e "   ${RED}❌${NC} $var ${RED}está vacío${NC}"
                ERRORS=$((ERRORS + 1))
            fi
        else
            echo -e "   ${RED}❌${NC} $var ${RED}no encontrado${NC}"
            ERRORS=$((ERRORS + 1))
        fi
    done
else
    echo -e "${RED}❌ .env.production NO EXISTE${NC}"
    echo -e "${YELLOW}   Crea uno desde: cp .env.production.example .env.production${NC}"
    ERRORS=$((ERRORS + 1))
fi

# 7. Verificar package.json dependencies
echo ""
echo -e "${YELLOW}7️⃣  Verificando dependencies...${NC}"
if [ -f "package.json" ]; then
    if node -e "const pkg = require('./package.json'); process.exit(pkg.dependencies ? 0 : 1)" 2>/dev/null; then
        echo -e "${GREEN}✅ package.json válido${NC}"
    else
        echo -e "${RED}❌ package.json inválido${NC}"
        ERRORS=$((ERRORS + 1))
    fi
fi

# 8. Verificar Dockerfile
echo ""
echo -e "${YELLOW}8️⃣  Verificando Dockerfile...${NC}"
if [ -f "Dockerfile" ]; then
    if grep -q "FROM node:" Dockerfile; then
        echo -e "${GREEN}✅ Dockerfile válido${NC}"
    else
        echo -e "${RED}❌ Dockerfile parece inválido${NC}"
        ERRORS=$((ERRORS + 1))
    fi
fi

# 9. Test de build local (opcional, comentado por ser lento)
# echo ""
# echo -e "${YELLOW}9️⃣  Test de build local (puede tardar)...${NC}"
# if docker build -t inmova-test . --quiet; then
#     echo -e "${GREEN}✅ Build local exitoso${NC}"
#     docker rmi inmova-test --quiet
# else
#     echo -e "${RED}❌ Build local falló${NC}"
#     ERRORS=$((ERRORS + 1))
# fi

# 10. Verificar conexión a GitHub
echo ""
echo -e "${YELLOW}9️⃣  Verificando conexión a GitHub...${NC}"
if git ls-remote origin HEAD &>/dev/null; then
    echo -e "${GREEN}✅ Conexión a GitHub OK${NC}"
else
    echo -e "${RED}❌ No se puede conectar a GitHub${NC}"
    ERRORS=$((ERRORS + 1))
fi

# RESUMEN FINAL
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}╔═══════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║  ✅ TODO LISTO PARA DEPLOYMENT               ║${NC}"
    echo -e "${GREEN}╚═══════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${GREEN}🚀 Próximo paso:${NC}"
    echo -e "   ${BLUE}./scripts/deploy-direct.sh production${NC}"
    echo ""
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}╔═══════════════════════════════════════════════╗${NC}"
    echo -e "${YELLOW}║  ⚠️  READY CON WARNINGS                      ║${NC}"
    echo -e "${YELLOW}╚═══════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${YELLOW}⚠️  $WARNINGS warning(s) encontrados${NC}"
    echo -e "${GREEN}✅ Puedes proceder con deployment${NC}"
    echo ""
    exit 0
else
    echo -e "${RED}╔═══════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║  ❌ NO LISTO PARA DEPLOYMENT                 ║${NC}"
    echo -e "${RED}╚═══════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${RED}❌ $ERRORS error(s) encontrados${NC}"
    echo -e "${YELLOW}⚠️  $WARNINGS warning(s) encontrados${NC}"
    echo ""
    echo -e "${YELLOW}Corrige los errores antes de continuar${NC}"
    echo ""
    exit 1
fi
