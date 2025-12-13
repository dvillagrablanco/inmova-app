#!/bin/bash

# Script de Verificación de Configuración
# Verifica que todo esté listo para deployment

set -e

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Contadores
PASSED=0
FAILED=0
WARNINGS=0

echo -e "${BLUE}🔍 Verificación de Configuración de Deployment${NC}"
echo -e "${BLUE}=============================================${NC}\n"

# Verificar que estamos en el directorio correcto
if [ ! -d "nextjs_space" ]; then
  echo -e "${RED}❌ Error: Debes ejecutar este script desde la raíz del proyecto${NC}"
  exit 1
fi

# Función para verificar
check() {
  local name="$1"
  local command="$2"
  local type="${3:-required}"  # required, warning, or info
  
  if eval "$command" &>/dev/null; then
    echo -e "${GREEN}✅ $name${NC}"
    ((PASSED++))
    return 0
  else
    if [ "$type" = "required" ]; then
      echo -e "${RED}❌ $name${NC}"
      ((FAILED++))
    else
      echo -e "${YELLOW}⚠️  $name${NC}"
      ((WARNINGS++))
    fi
    return 1
  fi
}

# 1. Verificar Node.js y herramientas
echo -e "${BLUE}=== Herramientas ===${NC}"
check "Node.js instalado" "command -v node"
check "Yarn instalado" "command -v yarn"
check "Git instalado" "command -v git" "warning"
check "Vercel CLI instalado" "command -v vercel" "warning"
echo ""

# 2. Verificar archivos de configuración
echo -e "${BLUE}=== Archivos de Configuración ===${NC}"
check "package.json existe" "[ -f nextjs_space/package.json ]"
check "vercel.json existe" "[ -f nextjs_space/vercel.json ]"
check ".env existe" "[ -f nextjs_space/.env ]"
check "prisma schema existe" "[ -f nextjs_space/prisma/schema.prisma ]"
check "GitHub workflow existe" "[ -f .github/workflows/deploy-vercel.yml ]" "warning"
echo ""

# 3. Verificar variables de entorno
echo -e "${BLUE}=== Variables de Entorno ===${NC}"

if [ -f "nextjs_space/.env" ]; then
  source nextjs_space/.env 2>/dev/null || true
  
  # Variables críticas
  check "DATABASE_URL configurado" "[ ! -z \"$DATABASE_URL\" ]"
  check "NEXTAUTH_SECRET configurado" "[ ! -z \"$NEXTAUTH_SECRET\" ]"
  check "NEXTAUTH_URL configurado" "[ ! -z \"$NEXTAUTH_URL\" ]"
  
  # Variables de Vercel
  if [ ! -z "$VERCEL_TOKEN" ] && [ "$VERCEL_TOKEN" != "tu_token_de_vercel_aqui" ]; then
    echo -e "${GREEN}✅ VERCEL_TOKEN configurado${NC}"
    ((PASSED++))
  else
    echo -e "${YELLOW}⚠️  VERCEL_TOKEN no configurado o es placeholder${NC}"
    ((WARNINGS++))
  fi
  
  if [ ! -z "$VERCEL_ORG_ID" ] && [ "$VERCEL_ORG_ID" != "tu_org_id_aqui" ]; then
    echo -e "${GREEN}✅ VERCEL_ORG_ID configurado${NC}"
    ((PASSED++))
  else
    echo -e "${YELLOW}⚠️  VERCEL_ORG_ID no configurado o es placeholder${NC}"
    ((WARNINGS++))
  fi
  
  if [ ! -z "$VERCEL_PROJECT_ID" ] && [ "$VERCEL_PROJECT_ID" != "tu_project_id_aqui" ]; then
    echo -e "${GREEN}✅ VERCEL_PROJECT_ID configurado${NC}"
    ((PASSED++))
  else
    echo -e "${YELLOW}⚠️  VERCEL_PROJECT_ID no configurado o es placeholder${NC}"
    ((WARNINGS++))
  fi
  
  # Otras variables importantes
  check "AWS_BUCKET_NAME configurado" "[ ! -z \"$AWS_BUCKET_NAME\" ]" "warning"
  check "STRIPE_SECRET_KEY configurado" "[ ! -z \"$STRIPE_SECRET_KEY\" ]" "warning"
  check "CRON_SECRET configurado" "[ ! -z \"$CRON_SECRET\" ]" "warning"
  check "ENCRYPTION_KEY configurado" "[ ! -z \"$ENCRYPTION_KEY\" ]" "warning"
else
  echo -e "${RED}❌ Archivo .env no encontrado${NC}"
  ((FAILED++))
fi
echo ""

# 4. Verificar dependencias
echo -e "${BLUE}=== Dependencias ===${NC}"
cd nextjs_space

if [ -d "node_modules" ]; then
  echo -e "${GREEN}✅ node_modules existe${NC}"
  ((PASSED++))
  
  # Verificar Prisma Client
  if [ -d "node_modules/@prisma/client" ]; then
    echo -e "${GREEN}✅ Prisma Client instalado${NC}"
    ((PASSED++))
  else
    echo -e "${YELLOW}⚠️  Prisma Client no encontrado - ejecuta: yarn prisma generate${NC}"
    ((WARNINGS++))
  fi
else
  echo -e "${RED}❌ node_modules no existe - ejecuta: yarn install${NC}"
  ((FAILED++))
fi

cd ..
echo ""

# 5. Verificar build
echo -e "${BLUE}=== Build ===${NC}"
if [ -d "nextjs_space/.next" ]; then
  echo -e "${GREEN}✅ Build anterior encontrado${NC}"
  ((PASSED++))
  
  # Verificar si el build es reciente
  BUILD_AGE=$(find nextjs_space/.next -maxdepth 1 -name "BUILD_ID" -mtime +1 2>/dev/null | wc -l)
  if [ $BUILD_AGE -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Build tiene más de 1 día - considera rebuilder${NC}"
    ((WARNINGS++))
  fi
else
  echo -e "${YELLOW}⚠️  No se encontró build anterior - se creará en deployment${NC}"
  ((WARNINGS++))
fi
echo ""

# 6. Verificar Git (opcional)
if command -v git &>/dev/null; then
  echo -e "${BLUE}=== Git ===${NC}"
  
  if git rev-parse --git-dir > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Repositorio Git inicializado${NC}"
    ((PASSED++))
    
    # Verificar si hay cambios sin commitear
    if git diff-index --quiet HEAD -- 2>/dev/null; then
      echo -e "${GREEN}✅ No hay cambios sin commitear${NC}"
      ((PASSED++))
    else
      echo -e "${YELLOW}⚠️  Hay cambios sin commitear${NC}"
      ((WARNINGS++))
    fi
    
    # Verificar branch
    BRANCH=$(git branch --show-current 2>/dev/null)
    if [ ! -z "$BRANCH" ]; then
      echo -e "${BLUE}   Branch actual: $BRANCH${NC}"
    fi
  else
    echo -e "${YELLOW}⚠️  No es un repositorio Git${NC}"
    ((WARNINGS++))
  fi
  echo ""
fi

# 7. Verificar scripts
echo -e "${BLUE}=== Scripts de Deployment ===${NC}"
check "deploy.sh existe" "[ -f scripts/deploy.sh ]"
check "deploy.sh es ejecutable" "[ -x scripts/deploy.sh ]"
check "setup-vercel.sh existe" "[ -f scripts/setup-vercel.sh ]"
check "setup-vercel.sh es ejecutable" "[ -x scripts/setup-vercel.sh ]"
echo ""

# 8. Resumen
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}RESUMEN${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}✅ Pasadas: $PASSED${NC}"
echo -e "${RED}❌ Fallidas: $FAILED${NC}"
echo -e "${YELLOW}⚠️  Advertencias: $WARNINGS${NC}"
echo ""

# 9. Recomendaciones
if [ $FAILED -gt 0 ]; then
  echo -e "${RED}========================================${NC}"
  echo -e "${RED}❌ HAY ERRORES CRÍTICOS${NC}"
  echo -e "${RED}========================================${NC}"
  echo -e "${YELLOW}Por favor, resuelve los errores antes de deployar:${NC}"
  echo ""
  
  if [ ! -f "nextjs_space/.env" ]; then
    echo -e "${YELLOW}1. Crea el archivo .env:${NC}"
    echo -e "   cp nextjs_space/.env.example nextjs_space/.env"
  fi
  
  if [ ! -d "nextjs_space/node_modules" ]; then
    echo -e "${YELLOW}2. Instala dependencias:${NC}"
    echo -e "   cd nextjs_space && yarn install"
  fi
  
  echo ""
  exit 1
elif [ $WARNINGS -gt 0 ]; then
  echo -e "${YELLOW}========================================${NC}"
  echo -e "${YELLOW}⚠️  HAY ALGUNAS ADVERTENCIAS${NC}"
  echo -e "${YELLOW}========================================${NC}"
  echo -e "${BLUE}Puedes continuar, pero considera resolver:${NC}"
  echo ""
  
  # Cargar .env para verificar
  if [ -f "nextjs_space/.env" ]; then
    source nextjs_space/.env 2>/dev/null || true
  fi
  
  if [ -z "$VERCEL_TOKEN" ] || [ "$VERCEL_TOKEN" = "tu_token_de_vercel_aqui" ]; then
    echo -e "${YELLOW}1. Configura Vercel:${NC}"
    echo -e "   ./scripts/setup-vercel.sh"
  fi
  
  if [ ! -d "nextjs_space/node_modules/@prisma/client" ]; then
    echo -e "${YELLOW}2. Genera Prisma Client:${NC}"
    echo -e "   cd nextjs_space && yarn prisma generate"
  fi
  
  if [ ! -d "nextjs_space/.next" ]; then
    echo -e "${YELLOW}3. Haz un build local:${NC}"
    echo -e "   cd nextjs_space && yarn build"
  fi
  
  if ! command -v vercel &>/dev/null; then
    echo -e "${YELLOW}4. Instala Vercel CLI:${NC}"
    echo -e "   npm install -g vercel@latest"
  fi
  
  echo ""
  echo -e "${BLUE}Para deployment manual:${NC}"
  echo -e "   ./scripts/deploy.sh"
  echo ""
  exit 0
else
  echo -e "${GREEN}========================================${NC}"
  echo -e "${GREEN}✅ TODO LISTO PARA DEPLOYMENT${NC}"
  echo -e "${GREEN}========================================${NC}"
  echo ""
  echo -e "${BLUE}Puedes proceder con:${NC}"
  echo ""
  echo -e "${GREEN}# Preview deployment${NC}"
  echo -e "./scripts/deploy.sh"
  echo ""
  echo -e "${GREEN}# Production deployment${NC}"
  echo -e "./scripts/deploy.sh prod"
  echo ""
  echo -e "${BLUE}🎉 ¡Éxito!${NC}"
  exit 0
fi
