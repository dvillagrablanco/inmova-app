#!/bin/bash

# Script de Configuración Inicial de Vercel
# Este script te guía en la configuración de Vercel para el proyecto

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔧 Configuración de Vercel para INMOVA${NC}"
echo -e "${BLUE}=====================================${NC}\n"

# Verificar que estamos en el directorio correcto
if [ ! -d "nextjs_space" ]; then
  echo -e "${RED}❌ Error: Debes ejecutar este script desde la raíz del proyecto${NC}"
  exit 1
fi

# 1. Verificar/Instalar Vercel CLI
echo -e "${BLUE}Paso 1: Verificando Vercel CLI...${NC}"
if ! command -v vercel &> /dev/null; then
  echo -e "${YELLOW}⚠️  Vercel CLI no encontrado. Instalando...${NC}"
  npm install -g vercel@latest
  echo -e "${GREEN}✅ Vercel CLI instalado${NC}\n"
else
  echo -e "${GREEN}✅ Vercel CLI ya está instalado${NC}\n"
fi

# 2. Login en Vercel
echo -e "${BLUE}Paso 2: Autenticación en Vercel${NC}"
echo -e "${YELLOW}Se abrirá tu navegador para autenticarte...${NC}"
vercel login
echo -e "${GREEN}✅ Autenticado en Vercel${NC}\n"

# 3. Obtener información del token
echo -e "${BLUE}Paso 3: Configuración del Token${NC}"
echo -e "${YELLOW}Para obtener tu token:${NC}"
echo -e "  1. Ve a https://vercel.com/account/tokens"
echo -e "  2. Haz clic en 'Create Token'"
echo -e "  3. Dale un nombre (ej: 'inmova-deployment')"
echo -e "  4. Selecciona 'Full Account'"
echo -e "  5. Copia el token generado\n"

read -p "¿Ya tienes tu token? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo -e "${YELLOW}Ingresa tu token de Vercel:${NC}"
  read -s VERCEL_TOKEN
  echo ""
  
  # Guardar en .env
  cd nextjs_space
  
  # Crear backup del .env actual
  if [ -f ".env" ]; then
    cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
    echo -e "${GREEN}✅ Backup del .env creado${NC}"
  fi
  
  # Actualizar VERCEL_TOKEN
  if grep -q "VERCEL_TOKEN=" .env; then
    sed -i "s/VERCEL_TOKEN=.*/VERCEL_TOKEN=$VERCEL_TOKEN/" .env
  else
    echo "VERCEL_TOKEN=$VERCEL_TOKEN" >> .env
  fi
  
  echo -e "${GREEN}✅ Token guardado en .env${NC}\n"
  
  cd ..
else
  echo -e "${YELLOW}⚠️  Por favor, obtén tu token y ejecútalo nuevamente${NC}"
  exit 0
fi

# 4. Vincular proyecto con Vercel
echo -e "${BLUE}Paso 4: Vincular proyecto con Vercel${NC}"
echo -e "${YELLOW}Selecciona o crea un proyecto en Vercel...${NC}\n"

cd nextjs_space

# Vincular proyecto
vercel link

if [ -f ".vercel/project.json" ]; then
  echo -e "${GREEN}✅ Proyecto vinculado exitosamente${NC}"
  
  # Extraer project ID
  PROJECT_ID=$(grep -oP '(?<="projectId": ")[^"]*' .vercel/project.json)
  ORG_ID=$(grep -oP '(?<="orgId": ")[^"]*' .vercel/project.json)
  
  # Guardar IDs en .env
  if grep -q "VERCEL_PROJECT_ID=" .env; then
    sed -i "s/VERCEL_PROJECT_ID=.*/VERCEL_PROJECT_ID=$PROJECT_ID/" .env
  else
    echo "VERCEL_PROJECT_ID=$PROJECT_ID" >> .env
  fi
  
  if grep -q "VERCEL_ORG_ID=" .env; then
    sed -i "s/VERCEL_ORG_ID=.*/VERCEL_ORG_ID=$ORG_ID/" .env
  else
    echo "VERCEL_ORG_ID=$ORG_ID" >> .env
  fi
  
  echo -e "${GREEN}✅ IDs guardados en .env${NC}\n"
  
  echo -e "${BLUE}Información del proyecto:${NC}"
  echo -e "  Project ID: ${GREEN}$PROJECT_ID${NC}"
  echo -e "  Organization ID: ${GREEN}$ORG_ID${NC}\n"
else
  echo -e "${RED}❌ Error al vincular el proyecto${NC}"
  exit 1
fi

cd ..

# 5. Configurar variables de entorno en Vercel
echo -e "${BLUE}Paso 5: Configurar variables de entorno${NC}"
echo -e "${YELLOW}Es importante configurar las variables de entorno en Vercel Dashboard:${NC}"
echo -e "  1. Ve a https://vercel.com/dashboard"
echo -e "  2. Selecciona tu proyecto"
echo -e "  3. Ve a Settings > Environment Variables"
echo -e "  4. Agrega todas las variables del archivo .env\n"

echo -e "${YELLOW}Variables críticas a configurar:${NC}"
echo -e "  - DATABASE_URL"
echo -e "  - NEXTAUTH_SECRET"
echo -e "  - NEXTAUTH_URL"
echo -e "  - AWS_BUCKET_NAME"
echo -e "  - STRIPE_SECRET_KEY"
echo -e "  - Y todas las demás del .env\n"

read -p "¿Ya configuraste las variables de entorno? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo -e "${YELLOW}⚠️  Por favor, configura las variables antes de deployar${NC}"
  echo -e "${YELLOW}Puedes hacerlo en: https://vercel.com/dashboard${NC}"
fi

# 6. Resumen y próximos pasos
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ CONFIGURACIÓN COMPLETADA${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${BLUE}Próximos pasos:${NC}"
echo -e "  1. ${YELLOW}Configura las variables de entorno en Vercel Dashboard${NC}"
echo -e "  2. ${YELLOW}Para deployar manualmente:${NC}"
echo -e "     ${GREEN}./scripts/deploy.sh${NC}          (preview)"
echo -e "     ${GREEN}./scripts/deploy.sh prod${NC}     (production)"
echo ""
echo -e "  3. ${YELLOW}Para CI/CD con GitHub Actions:${NC}"
echo -e "     a. Ve a tu repositorio en GitHub"
echo -e "     b. Settings > Secrets and variables > Actions"
echo -e "     c. Agrega estos secrets:"
echo -e "        - VERCEL_TOKEN"
echo -e "        - VERCEL_ORG_ID"
echo -e "        - VERCEL_PROJECT_ID"
echo -e "        - DATABASE_URL"
echo -e "        - NEXTAUTH_SECRET"
echo -e "        - NEXTAUTH_URL"
echo ""
echo -e "${BLUE}📚 Documentación completa:${NC}"
echo -e "  ${GREEN}cat DEPLOYMENT_GUIDE.md${NC}"
echo ""
echo -e "${BLUE}🎉 ¡Todo listo para deployar!${NC}"
