#!/bin/bash
# Script de inicio definitivo para el servidor

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 INICIO DEFINITIVO DE INMOVA APP${NC}\n"

# 1. Matar procesos en puerto 3000
echo -e "${YELLOW}1️⃣  Liberando puerto 3000...${NC}"
fuser -k 3000/tcp 2>/dev/null || true
sleep 2
echo -e "${GREEN}  ✅ Puerto liberado${NC}\n"

# 2. Limpiar PM2
echo -e "${YELLOW}2️⃣  Limpiando PM2...${NC}"
pm2 delete all 2>/dev/null || true
pm2 kill 2>/dev/null || true
sleep 2
echo -e "${GREEN}  ✅ PM2 limpio${NC}\n"

# 3. Ir al directorio
cd /opt/inmova-app

# 4. Cargar variables de entorno
echo -e "${YELLOW}3️⃣  Cargando .env.production...${NC}"
source .env.production
echo -e "${GREEN}  ✅ Variables cargadas${NC}\n"

# 5. Iniciar con PM2
echo -e "${YELLOW}4️⃣  Iniciando con PM2...${NC}"
pm2 start npm --name "inmova-app" -- start
pm2 save
echo -e "${GREEN}  ✅ PM2 iniciado${NC}\n"

# 6. Esperar warm-up
echo -e "${YELLOW}5️⃣  Esperando warm-up...${NC}"
sleep 15

# 7. Verificar
echo -e "\n${YELLOW}6️⃣  Verificaciones:${NC}"
pm2 status inmova-app
echo ""

# Health check
curl -s http://localhost:3000/api/health | head -c 100
echo -e "\n"

echo -e "${GREEN}✅ APLICACIÓN INICIADA${NC}"
echo -e "\n📱 URL: http://157.180.119.236/dashboard"
