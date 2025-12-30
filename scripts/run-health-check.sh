#!/bin/bash

##############################################################################
# Script para ejecutar Health Check Completo
# Uso: ./scripts/run-health-check.sh [BASE_URL]
##############################################################################

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Config
BASE_URL="${1:-http://localhost:3000}"
TEST_USER="${TEST_USER:-superadmin@inmova.com}"
TEST_PASSWORD="${TEST_PASSWORD:-superadmin123}"

echo -e "${GREEN}🚀 FULL HEALTH CHECK${NC}"
echo "======================================================================"
echo "Base URL: $BASE_URL"
echo "Test User: $TEST_USER"
echo "======================================================================"
echo ""

# Ejecutar health check
BASE_URL="$BASE_URL" \
TEST_USER="$TEST_USER" \
TEST_PASSWORD="$TEST_PASSWORD" \
npx tsx scripts/full-health-check.ts

EXIT_CODE=$?

echo ""
if [ $EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}✅ Health check completado exitosamente${NC}"
else
    echo -e "${RED}❌ Health check falló con código $EXIT_CODE${NC}"
fi

exit $EXIT_CODE
