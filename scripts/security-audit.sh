#!/bin/bash
# Security Audit Script - OWASP Top 10 Checklist

echo "🔐 SECURITY AUDIT - INMOVA APP"
echo "================================"
echo ""

PASSED=0
FAILED=0
WARNINGS=0

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. SECRETS IN CODE
echo "1. Verificando secrets en código..."
SECRETS_COUNT=$(grep -r -E "(sk_live_|pk_live_|api[_-]?key|secret[_-]?key|password.*=.*['\"])" \
  app/ components/ lib/ \
  --exclude-dir=node_modules \
  --exclude='*.md' \
  --exclude='*.json' 2>/dev/null | grep -v "process.env" | wc -l)

if [ "$SECRETS_COUNT" -eq 0 ]; then
  echo -e "  ${GREEN}✅ No secrets hardcodeados en código${NC}"
  PASSED=$((PASSED + 1))
else
  echo -e "  ${RED}❌ Encontrados $SECRETS_COUNT posibles secrets en código${NC}"
  FAILED=$((FAILED + 1))
fi

# 2. SQL INJECTION PROTECTION (Prisma)
echo ""
echo "2. Verificando protección SQL Injection..."
RAW_QUERIES=$(grep -r "\$queryRaw\|\$executeRaw" app/ lib/ --exclude-dir=node_modules 2>/dev/null | wc -l)
PRISMA_QUERIES=$(grep -r "prisma\." app/ lib/ --exclude-dir=node_modules 2>/dev/null | wc -l)

if [ "$PRISMA_QUERIES" -gt 0 ]; then
  echo -e "  ${GREEN}✅ Usando Prisma ORM (protección automática SQL injection)${NC}"
  PASSED=$((PASSED + 1))
  if [ "$RAW_QUERIES" -gt 0 ]; then
    echo -e "  ${YELLOW}⚠️  $RAW_QUERIES raw queries encontradas (revisar parametrización)${NC}"
    WARNINGS=$((WARNINGS + 1))
  fi
else
  echo -e "  ${YELLOW}⚠️  No se detectó uso de Prisma${NC}"
  WARNINGS=$((WARNINGS + 1))
fi

# 3. XSS PROTECTION (React)
echo ""
echo "3. Verificando protección XSS..."
DANGEROUS_HTML=$(grep -r "dangerouslySetInnerHTML" app/ components/ --exclude-dir=node_modules 2>/dev/null | wc -l)

if [ "$DANGEROUS_HTML" -eq 0 ]; then
  echo -e "  ${GREEN}✅ No uso de dangerouslySetInnerHTML (React protege automáticamente)${NC}"
  PASSED=$((PASSED + 1))
else
  echo -e "  ${YELLOW}⚠️  $DANGEROUS_HTML usos de dangerouslySetInnerHTML (verificar sanitización)${NC}"
  WARNINGS=$((WARNINGS + 1))
fi

# 4. AUTHENTICATION
echo ""
echo "4. Verificando autenticación..."
GETSERVERSESSION=$(grep -r "getServerSession" app/api/ --exclude-dir=node_modules 2>/dev/null | wc -l)
API_ROUTES=$(find app/api -name "route.ts" 2>/dev/null | wc -l)

if [ "$API_ROUTES" -gt 0 ]; then
  PERCENTAGE=$((GETSERVERSESSION * 100 / API_ROUTES))
  if [ "$PERCENTAGE" -gt 70 ]; then
    echo -e "  ${GREEN}✅ $PERCENTAGE% de API routes verifican autenticación${NC}"
    PASSED=$((PASSED + 1))
  else
    echo -e "  ${YELLOW}⚠️  Solo $PERCENTAGE% de API routes verifican autenticación${NC}"
    WARNINGS=$((WARNINGS + 1))
  fi
else
  echo -e "  ${YELLOW}⚠️  No se encontraron API routes${NC}"
  WARNINGS=$((WARNINGS + 1))
fi

# 5. RATE LIMITING
echo ""
echo "5. Verificando rate limiting..."
if [ -f "lib/rate-limiting.ts" ] || grep -r "rateLimit" lib/ --exclude-dir=node_modules 2>/dev/null | grep -q .; then
  echo -e "  ${GREEN}✅ Rate limiting implementado${NC}"
  PASSED=$((PASSED + 1))
else
  echo -e "  ${RED}❌ Rate limiting no encontrado${NC}"
  FAILED=$((FAILED + 1))
fi

# 6. INPUT VALIDATION (Zod)
echo ""
echo "6. Verificando validación de inputs..."
ZOD_SCHEMAS=$(grep -r "z\.object\|z\.string\|z\.number" app/api/ lib/ --exclude-dir=node_modules 2>/dev/null | wc -l)

if [ "$ZOD_SCHEMAS" -gt 10 ]; then
  echo -e "  ${GREEN}✅ $ZOD_SCHEMAS schemas de validación Zod encontrados${NC}"
  PASSED=$((PASSED + 1))
else
  echo -e "  ${YELLOW}⚠️  Solo $ZOD_SCHEMAS schemas de validación (considerar expandir)${NC}"
  WARNINGS=$((WARNINGS + 1))
fi

# 7. HTTPS/SSL
echo ""
echo "7. Verificando configuración HTTPS..."
if grep -q "NEXTAUTH_URL=https" .env.production 2>/dev/null || grep -q "force-https" next.config.js 2>/dev/null; then
  echo -e "  ${GREEN}✅ HTTPS configurado${NC}"
  PASSED=$((PASSED + 1))
else
  echo -e "  ${YELLOW}⚠️  Verificar configuración HTTPS en producción${NC}"
  WARNINGS=$((WARNINGS + 1))
fi

# 8. ENVIRONMENT VARIABLES
echo ""
echo "8. Verificando secrets en variables de entorno..."
if [ -f ".env.production" ]; then
  ENV_SECRETS=$(grep -E "SECRET|KEY|PASSWORD" .env.production 2>/dev/null | grep -v "^#" | wc -l)
  if [ "$ENV_SECRETS" -gt 5 ]; then
    echo -e "  ${GREEN}✅ $ENV_SECRETS secrets configurados en .env.production${NC}"
    PASSED=$((PASSED + 1))
  else
    echo -e "  ${YELLOW}⚠️  Solo $ENV_SECRETS secrets en .env.production${NC}"
    WARNINGS=$((WARNINGS + 1))
  fi
else
  echo -e "  ${YELLOW}⚠️  Archivo .env.production no encontrado en local${NC}"
  WARNINGS=$((WARNINGS + 1))
fi

# 9. CORS CONFIGURATION
echo ""
echo "9. Verificando configuración CORS..."
if grep -r "cors\|Access-Control" next.config.js app/api/ 2>/dev/null | grep -q .; then
  echo -e "  ${GREEN}✅ CORS configurado${NC}"
  PASSED=$((PASSED + 1))
else
  echo -e "  ${YELLOW}⚠️  CORS no explícitamente configurado (verificar en producción)${NC}"
  WARNINGS=$((WARNINGS + 1))
fi

# 10. ERROR HANDLING
echo ""
echo "10. Verificando manejo de errores..."
TRY_CATCH=$(grep -r "try {" app/api/ --exclude-dir=node_modules 2>/dev/null | wc -l)

if [ "$TRY_CATCH" -gt 10 ]; then
  echo -e "  ${GREEN}✅ $TRY_CATCH bloques try/catch en API routes${NC}"
  PASSED=$((PASSED + 1))
else
  echo -e "  ${YELLOW}⚠️  Solo $TRY_CATCH bloques try/catch (expandir manejo de errores)${NC}"
  WARNINGS=$((WARNINGS + 1))
fi

# 11. SECURITY HEADERS
echo ""
echo "11. Verificando security headers..."
if grep -r "X-Frame-Options\|X-Content-Type-Options" vercel.json next.config.js 2>/dev/null | grep -q .; then
  echo -e "  ${GREEN}✅ Security headers configurados${NC}"
  PASSED=$((PASSED + 1))
else
  echo -e "  ${YELLOW}⚠️  Security headers no encontrados en config${NC}"
  WARNINGS=$((WARNINGS + 1))
fi

# 12. DEPENDENCIES VULNERABILITIES
echo ""
echo "12. Verificando vulnerabilidades en dependencias..."
echo "   (Ejecutando npm audit...)"
AUDIT_OUTPUT=$(npm audit --production --audit-level=high 2>&1)
VULNERABILITIES=$(echo "$AUDIT_OUTPUT" | grep -E "high|critical" | wc -l)

if [ "$VULNERABILITIES" -eq 0 ]; then
  echo -e "  ${GREEN}✅ No vulnerabilidades críticas/high en dependencias${NC}"
  PASSED=$((PASSED + 1))
else
  echo -e "  ${RED}❌ $VULNERABILITIES vulnerabilidades high/critical encontradas${NC}"
  echo "$AUDIT_OUTPUT" | grep -E "high|critical" | head -5
  FAILED=$((FAILED + 1))
fi

# RESUMEN
echo ""
echo "================================"
echo "📊 RESUMEN DEL SECURITY AUDIT"
echo "================================"
echo -e "${GREEN}✅ Passed: $PASSED${NC}"
echo -e "${YELLOW}⚠️  Warnings: $WARNINGS${NC}"
echo -e "${RED}❌ Failed: $FAILED${NC}"
echo ""

TOTAL=$((PASSED + WARNINGS + FAILED))
SCORE=$((PASSED * 100 / TOTAL))

echo "Score: $SCORE%"
echo ""

if [ "$FAILED" -eq 0 ] && [ "$WARNINGS" -lt 3 ]; then
  echo -e "${GREEN}✅ SECURITY AUDIT PASSED${NC}"
  echo "La aplicación cumple con los estándares de seguridad básicos."
  exit 0
elif [ "$FAILED" -eq 0 ]; then
  echo -e "${YELLOW}⚠️  SECURITY AUDIT PASSED WITH WARNINGS${NC}"
  echo "La aplicación es segura pero hay áreas de mejora."
  exit 0
else
  echo -e "${RED}❌ SECURITY AUDIT FAILED${NC}"
  echo "Se encontraron $FAILED problemas críticos de seguridad."
  echo "Resolver antes del lanzamiento."
  exit 1
fi
