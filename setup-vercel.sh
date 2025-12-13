#!/bin/bash

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}======================================${NC}"
echo -e "${GREEN}  INMOVA - Vercel Deployment Setup  ${NC}"
echo -e "${GREEN}======================================${NC}"
echo ""

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo -e "${YELLOW}Inicializando repositorio Git...${NC}"
    git init
    echo -e "${GREEN}✓ Git inicializado${NC}"
else
    echo -e "${GREEN}✓ Repositorio Git ya existe${NC}"
fi

# Check if .gitignore exists
if [ ! -f ".gitignore" ]; then
    echo -e "${RED}Error: .gitignore no encontrado${NC}"
    echo -e "${YELLOW}Por favor, ejecuta este script desde el directorio raíz del proyecto${NC}"
    exit 1
fi

echo -e "${GREEN}✓ .gitignore encontrado${NC}"

# Check if nextjs_space exists
if [ ! -d "nextjs_space" ]; then
    echo -e "${RED}Error: Directorio nextjs_space no encontrado${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Directorio nextjs_space encontrado${NC}"

# Navigate to nextjs_space
cd nextjs_space

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Instalando dependencias...${NC}"
    yarn install
    echo -e "${GREEN}✓ Dependencias instaladas${NC}"
else
    echo -e "${GREEN}✓ Dependencias ya instaladas${NC}"
fi

# Generate Prisma client
echo -e "${YELLOW}Generando cliente de Prisma...${NC}"
yarn prisma generate
echo -e "${GREEN}✓ Cliente de Prisma generado${NC}"

# Test build
echo -e "${YELLOW}Probando build de producción...${NC}"
if yarn build; then
    echo -e "${GREEN}✓ Build exitoso${NC}"
else
    echo -e "${RED}Error en el build${NC}"
    echo -e "${YELLOW}Por favor, revisa los errores antes de continuar${NC}"
    exit 1
fi

# Return to root
cd ..

# Check if remote origin exists
if git remote | grep -q "origin"; then
    echo -e "${GREEN}✓ Remote origin ya configurado${NC}"
    echo -e "${YELLOW}URL: $(git remote get-url origin)${NC}"
else
    echo -e "${YELLOW}Configurando remote origin...${NC}"
    read -p "Ingresa la URL de tu repositorio GitHub: " REPO_URL
    git remote add origin "$REPO_URL"
    echo -e "${GREEN}✓ Remote origin configurado${NC}"
fi

# Check if there are uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
    echo -e "${YELLOW}Hay cambios sin commitear${NC}"
    read -p "¿Deseas hacer commit de todos los cambios? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git add .
        read -p "Mensaje del commit: " COMMIT_MSG
        git commit -m "$COMMIT_MSG"
        echo -e "${GREEN}✓ Cambios commiteados${NC}"
    fi
fi

# Check if branch exists
if git rev-parse --verify main >/dev/null 2>&1; then
    echo -e "${GREEN}✓ Rama main existe${NC}"
else
    echo -e "${YELLOW}Creando rama main...${NC}"
    git branch -M main
    echo -e "${GREEN}✓ Rama main creada${NC}"
fi

echo ""
echo -e "${GREEN}======================================${NC}"
echo -e "${GREEN}  Setup Completado  ${NC}"
echo -e "${GREEN}======================================${NC}"
echo ""
echo -e "${YELLOW}Próximos pasos:${NC}"
echo -e "1. Sube tu código a GitHub:"
echo -e "   ${GREEN}git push -u origin main${NC}"
echo ""
echo -e "2. Ve a https://vercel.com/new"
echo ""
echo -e "3. Importa tu repositorio de GitHub"
echo ""
echo -e "4. Configura las variables de entorno (ver VERCEL_DEPLOYMENT_GUIDE.md)"
echo ""
echo -e "5. Haz click en Deploy"
echo ""
echo -e "${YELLOW}Para más información, consulta VERCEL_DEPLOYMENT_GUIDE.md${NC}"
echo ""
