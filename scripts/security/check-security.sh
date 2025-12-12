#!/bin/bash

# Script de verificación de seguridad para INMOVA
# Ejecuta múltiples checks de seguridad y genera un reporte

set -e

echo "🔒 INMOVA - Auditoría de Seguridad Automatizada"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Colores para output
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

# Contadores
PASSED=0
FAILED=0
WARNINGS=0

# Función para checks
check_pass() {
    echo -e "${GREEN}✅ PASS:${NC} $1"
    ((PASSED++))
}

check_fail() {
    echo -e "${RED}❌ FAIL:${NC} $1"
    ((FAILED++))
}

check_warn() {
    echo -e "${YELLOW}⚠️  WARN:${NC} $1"
    ((WARNINGS++))
}

echo "📋 Ejecutando verificaciones de seguridad..."
echo ""

# 1. Verificar archivo .env existe
echo "1️⃣  Verificando archivo .env..."
if [ -f ".env" ]; then
    check_pass "Archivo .env existe"
else
    check_fail "Archivo .env NO encontrado"
fi
echo ""

# 2. Verificar NEXTAUTH_SECRET
echo "2️⃣  Verificando NEXTAUTH_SECRET..."
if [ -f ".env" ]; then
    SECRET=$(grep "^NEXTAUTH_SECRET=" .env | cut -d '=' -f2)
    SECRET_LENGTH=${#SECRET}
    
    if [ $SECRET_LENGTH -ge 128 ]; then
        check_pass "NEXTAUTH_SECRET tiene $SECRET_LENGTH caracteres (✅ >= 128)"
    elif [ $SECRET_LENGTH -ge 64 ]; then
        check_warn "NEXTAUTH_SECRET tiene $SECRET_LENGTH caracteres (⚠️ recomendado >= 128)"
    else
        check_fail "NEXTAUTH_SECRET tiene solo $SECRET_LENGTH caracteres (❌ mínimo 64)"
    fi
fi
echo ""

# 3. Verificar DATABASE_URL con SSL
echo "3️⃣  Verificando DATABASE_URL SSL..."
if [ -f ".env" ]; then
    DB_URL=$(grep "^DATABASE_URL=" .env | cut -d '=' -f2- | tr -d "'\"")
    
    if [[ $DB_URL == *"sslmode=require"* ]]; then
        check_pass "DATABASE_URL incluye sslmode=require"
    elif [[ $DB_URL == *"sslmode="* ]]; then
        check_warn "DATABASE_URL tiene sslmode pero no es 'require'"
    else
        check_warn "DATABASE_URL no especifica sslmode (se recomienda sslmode=require)"
    fi
fi
echo ""

# 4. Verificar variables sensibles están en .env
echo "4️⃣  Verificando variables sensibles en .env..."
if [ -f ".env" ]; then
    REQUIRED_VARS=("DATABASE_URL" "NEXTAUTH_SECRET" "NEXTAUTH_URL")
    
    for VAR in "${REQUIRED_VARS[@]}"; do
        if grep -q "^${VAR}=" .env; then
            check_pass "Variable $VAR configurada"
        else
            check_fail "Variable $VAR NO encontrada"
        fi
    done
fi
echo ""

# 5. Verificar que no haya secrets hardcoded en el código
echo "5️⃣  Buscando secrets hardcoded en código..."
HARDCODED_PATTERNS=("password.*=.*\"" "token.*=.*\"" "secret.*=.*\"" "api_key.*=.*\"")
FOUND_HARDCODED=0

for PATTERN in "${HARDCODED_PATTERNS[@]}"; do
    RESULTS=$(grep -r -i "$PATTERN" app/ lib/ 2>/dev/null | grep -v "node_modules" | grep -v ".next" | wc -l)
    if [ $RESULTS -gt 0 ]; then
        check_warn "Encontrados $RESULTS posibles secrets hardcoded con patrón: $PATTERN"
        ((FOUND_HARDCODED++))
    fi
done

if [ $FOUND_HARDCODED -eq 0 ]; then
    check_pass "No se encontraron secrets hardcoded obvios"
fi
echo ""

# 6. Verificar CSP está implementado
echo "6️⃣  Verificando Content Security Policy..."
if [ -f "lib/csp-strict.ts" ]; then
    check_pass "Archivo lib/csp-strict.ts existe"
    
    if grep -q "applyStrictCSP" lib/csp-strict.ts; then
        check_pass "Función applyStrictCSP implementada"
    else
        check_warn "Función applyStrictCSP no encontrada"
    fi
else
    check_fail "Archivo lib/csp-strict.ts NO encontrado"
fi
echo ""

# 7. Verificar Rate Limiting
echo "7️⃣  Verificando Rate Limiting..."
if [ -f "lib/rate-limit-enhanced.ts" ]; then
    check_pass "Archivo lib/rate-limit-enhanced.ts existe"
    
    if grep -q "RateLimiter" lib/rate-limit-enhanced.ts; then
        check_pass "Clase RateLimiter implementada"
    else
        check_warn "Clase RateLimiter no encontrada"
    fi
else
    check_fail "Archivo lib/rate-limit-enhanced.ts NO encontrado"
fi
echo ""

# 8. Verificar Middleware protegido
echo "8️⃣  Verificando Middleware de autenticación..."
if [ -f "middleware.ts" ]; then
    check_pass "Archivo middleware.ts existe"
    
    if grep -q "withAuth" middleware.ts; then
        check_pass "Middleware usa withAuth de next-auth"
    else
        check_warn "Middleware no usa withAuth"
    fi
else
    check_fail "Archivo middleware.ts NO encontrado"
fi
echo ""

# 9. Verificar Prisma migrations
echo "9️⃣  Verificando Prisma migrations..."
if [ -d "prisma/migrations" ]; then
    MIGRATION_COUNT=$(ls -1 prisma/migrations | wc -l)
    check_pass "Carpeta prisma/migrations existe ($MIGRATION_COUNT migraciones)"
else
    check_warn "Carpeta prisma/migrations NO encontrada (se recomienda usar migrations)"
fi
echo ""

# 10. Verificar dependencias con vulnerabilidades
echo "🔟 Verificando dependencias vulnerables..."
echo "   (Ejecutando npm audit...)"
if command -v npm &> /dev/null; then
    AUDIT_OUTPUT=$(npm audit --json 2>/dev/null || echo '{}')
    CRITICAL=$(echo $AUDIT_OUTPUT | jq -r '.metadata.vulnerabilities.critical // 0' 2>/dev/null || echo "0")
    HIGH=$(echo $AUDIT_OUTPUT | jq -r '.metadata.vulnerabilities.high // 0' 2>/dev/null || echo "0")
    
    if [ "$CRITICAL" = "0" ] && [ "$HIGH" = "0" ]; then
        check_pass "No hay vulnerabilidades críticas o altas"
    elif [ "$CRITICAL" != "0" ]; then
        check_fail "$CRITICAL vulnerabilidades CRÍTICAS encontradas"
    elif [ "$HIGH" != "0" ]; then
        check_warn "$HIGH vulnerabilidades ALTAS encontradas"
    fi
else
    check_warn "npm no disponible, saltando audit"
fi
echo ""

# Resumen
echo "═══════════════════════════════════════════════════════════════"
echo "📊 RESUMEN DE AUDITORÍA"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo -e "${GREEN}✅ Checks Pasados:${NC} $PASSED"
echo -e "${YELLOW}⚠️  Advertencias:${NC}   $WARNINGS"
echo -e "${RED}❌ Checks Fallidos:${NC} $FAILED"
echo ""

TOTAL=$((PASSED + WARNINGS + FAILED))
SCORE=$((PASSED * 100 / TOTAL))

if [ $SCORE -ge 80 ]; then
    echo -e "${GREEN}Score Final: $SCORE/100 🌟 EXCELENTE${NC}"
elif [ $SCORE -ge 60 ]; then
    echo -e "${YELLOW}Score Final: $SCORE/100 ⚠️  BUENO (mejoras recomendadas)${NC}"
else
    echo -e "${RED}Score Final: $SCORE/100 ❌ REQUIERE ATENCIÓN${NC}"
fi

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "📄 Reporte completo disponible en: AUDITORIA_SEGURIDAD.md"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Exit code basado en fallos críticos
if [ $FAILED -gt 0 ]; then
    exit 1
else
    exit 0
fi
