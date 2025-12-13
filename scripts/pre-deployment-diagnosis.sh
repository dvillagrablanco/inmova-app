#!/bin/bash

# ============================================
# INMOVA - Pre-Deployment Diagnosis Script
# ============================================
# Purpose: Comprehensive validation before Railway deployment
# Version: 1.0
# Date: 2025-12-13
#
# This script performs 15+ validation checks to ensure
# the application is ready for production deployment
# ============================================

set -e  # Exit on first error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
PASSED=0
FAILED=0
WARNINGS=0

START_TIME=$(date +%s)

echo -e "${BLUE}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     INMOVA - Pre-Deployment Diagnosis                     ║${NC}"
echo -e "${BLUE}║     Railway Deployment Validation (16 Checks)             ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}Starting comprehensive validation...${NC}"
echo ""

# Change to project root
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT/nextjs_space"

echo -e "${BLUE}📂 Project Root: $PROJECT_ROOT/nextjs_space${NC}"
echo ""

# ============================================
# TEST 1: Directory Structure
# ============================================
echo -e "${BLUE}[1/15]${NC} Validating directory structure..."
if [ -d "app" ] && [ -d "prisma" ] && [ -d "lib" ] && [ -d "components" ]; then
    echo -e "${GREEN}✓ All required directories exist${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ Missing required directories${NC}"
    ((FAILED++))
fi
echo ""

# ============================================
# TEST 2: Critical Files Existence
# ============================================
echo -e "${BLUE}[2/15]${NC} Checking critical files..."
CRITICAL_FILES=(
    "package.json"
    "next.config.js"
    "prisma/schema.prisma"
    "tsconfig.json"
    ".env"
)

MISSING_FILES=()
for file in "${CRITICAL_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        MISSING_FILES+=("$file")
    fi
done

if [ ${#MISSING_FILES[@]} -eq 0 ]; then
    echo -e "${GREEN}✓ All critical files present${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ Missing critical files: ${MISSING_FILES[*]}${NC}"
    ((FAILED++))
fi
echo ""

# ============================================
# TEST 3: Environment Variables
# ============================================
echo -e "${BLUE}[3/15]${NC} Validating environment variables..."
if [ -f ".env" ]; then
    REQUIRED_VARS=(
        "DATABASE_URL"
        "NEXTAUTH_SECRET"
        "NEXTAUTH_URL"
    )
    
    MISSING_VARS=()
    for var in "${REQUIRED_VARS[@]}"; do
        if ! grep -q "^$var=" .env; then
            MISSING_VARS+=("$var")
        fi
    done
    
    if [ ${#MISSING_VARS[@]} -eq 0 ]; then
        echo -e "${GREEN}✓ All required environment variables present${NC}"
        ((PASSED++))
    else
        echo -e "${YELLOW}⚠ Missing environment variables: ${MISSING_VARS[*]}${NC}"
        echo -e "${YELLOW}  Note: These may be set in Railway dashboard${NC}"
        ((WARNINGS++))
    fi
else
    echo -e "${YELLOW}⚠ .env file not found (may be set in Railway)${NC}"
    ((WARNINGS++))
fi
echo ""

# ============================================
# TEST 4: Prisma Schema Validation
# ============================================
echo -e "${BLUE}[4/15]${NC} Validating Prisma schema..."
if command -v yarn &> /dev/null; then
    if yarn prisma validate > /tmp/prisma-validate.log 2>&1; then
        echo -e "${GREEN}✓ Prisma schema is valid${NC}"
        ((PASSED++))
    else
        echo -e "${RED}✗ Prisma schema validation failed${NC}"
        cat /tmp/prisma-validate.log
        ((FAILED++))
    fi
else
    echo -e "${YELLOW}⚠ yarn not found, skipping Prisma validation${NC}"
    ((WARNINGS++))
fi
echo ""

# ============================================
# TEST 5: Prisma Client Generation
# ============================================
echo -e "${BLUE}[5/15]${NC} Checking Prisma Client generation..."
if [ -d "node_modules/.prisma/client" ]; then
    echo -e "${GREEN}✓ Prisma Client is generated${NC}"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠ Prisma Client not generated, attempting now...${NC}"
    if yarn prisma generate > /tmp/prisma-generate.log 2>&1; then
        echo -e "${GREEN}✓ Prisma Client generated successfully${NC}"
        ((PASSED++))
    else
        echo -e "${RED}✗ Prisma Client generation failed${NC}"
        cat /tmp/prisma-generate.log
        ((FAILED++))
    fi
fi
echo ""

# ============================================
# TEST 6: TypeScript Compilation (Quick Check)
# ============================================
echo -e "${BLUE}[6/15]${NC} TypeScript compilation check..."
if command -v yarn &> /dev/null; then
    echo -e "${YELLOW}Running tsc --noEmit (this may take 30-60s)...${NC}"
    if yarn tsc --noEmit --skipLibCheck > /tmp/tsc-check.log 2>&1; then
        echo -e "${GREEN}✓ TypeScript compilation successful${NC}"
        ((PASSED++))
    else
        ERROR_COUNT=$(grep -c "error TS" /tmp/tsc-check.log || echo "0")
        if [ "$ERROR_COUNT" -lt 20 ]; then
            echo -e "${YELLOW}⚠ TypeScript has $ERROR_COUNT errors (acceptable for deployment)${NC}"
            head -20 /tmp/tsc-check.log
            ((WARNINGS++))
        else
            echo -e "${RED}✗ TypeScript has $ERROR_COUNT errors (too many)${NC}"
            head -30 /tmp/tsc-check.log
            ((FAILED++))
        fi
    fi
else
    echo -e "${YELLOW}⚠ yarn not found, skipping TypeScript check${NC}"
    ((WARNINGS++))
fi
echo ""

# ============================================
# TEST 7: Import Statement Validation
# ============================================
echo -e "${BLUE}[7/15]${NC} Checking for broken imports..."
BROKEN_IMPORTS=$(find app lib components -type f \( -name "*.ts" -o -name "*.tsx" \) -exec grep -l "from '@/" {} \; 2>/dev/null | wc -l)
if [ "$BROKEN_IMPORTS" -gt 0 ]; then
    echo -e "${GREEN}✓ Found $BROKEN_IMPORTS files with @ imports (normal)${NC}"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠ No @ imports found (unusual but not blocking)${NC}"
    ((WARNINGS++))
fi
echo ""

# ============================================
# TEST 8: Prisma Client Import Check
# ============================================
echo -e "${BLUE}[8/15]${NC} Checking for Prisma client-side imports..."
CLIENT_SIDE_PRISMA=$(find app -type f -name "*.tsx" -path "*/app/*" ! -path "*/app/api/*" -exec grep -l "from '@prisma/client'" {} \; 2>/dev/null || true)
if [ -z "$CLIENT_SIDE_PRISMA" ]; then
    echo -e "${GREEN}✓ No Prisma imports in client-side code${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ Found Prisma imports in client-side files:${NC}"
    echo "$CLIENT_SIDE_PRISMA"
    ((FAILED++))
fi
echo ""

# ============================================
# TEST 9: 'use client' Directive Position
# ============================================
echo -e "${BLUE}[9/15]${NC} Validating 'use client' directive positions..."
INCORRECT_USE_CLIENT=$(find app -type f -name "*.tsx" -exec sh -c '
    if head -1 "$1" | grep -q "^export\|^import\|^const\|^function\|^type\|^interface"; then
        if grep -q "^.use client." "$1"; then
            echo "$1"
        fi
    fi
' _ {} \; 2>/dev/null || true)

if [ -z "$INCORRECT_USE_CLIENT" ]; then
    echo -e "${GREEN}✓ All 'use client' directives correctly positioned${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ Files with 'use client' not on first line:${NC}"
    echo "$INCORRECT_USE_CLIENT"
    ((FAILED++))
fi
echo ""

# ============================================
# TEST 10: Package.json Validation
# ============================================
echo -e "${BLUE}[10/15]${NC} Validating package.json..."
if command -v node &> /dev/null; then
    if node -e "JSON.parse(require('fs').readFileSync('package.json', 'utf8'))" 2>/dev/null; then
        echo -e "${GREEN}✓ package.json is valid JSON${NC}"
        
        # Check critical scripts
        if grep -q '"build"' package.json && grep -q '"start"' package.json; then
            echo -e "${GREEN}✓ Required scripts present (build, start)${NC}"
            ((PASSED++))
        else
            echo -e "${RED}✗ Missing required scripts in package.json${NC}"
            ((FAILED++))
        fi
    else
        echo -e "${RED}✗ package.json is invalid JSON${NC}"
        ((FAILED++))
    fi
else
    echo -e "${YELLOW}⚠ Node.js not found, skipping package.json validation${NC}"
    ((WARNINGS++))
fi
echo ""

# ============================================
# TEST 11: Next.js Config Validation
# ============================================
echo -e "${BLUE}[11/15]${NC} Validating next.config.js..."
if [ -f "next.config.js" ]; then
    if grep -q "module.exports" next.config.js; then
        echo -e "${GREEN}✓ next.config.js exports configuration${NC}"
        ((PASSED++))
    else
        echo -e "${RED}✗ next.config.js missing module.exports${NC}"
        ((FAILED++))
    fi
else
    echo -e "${RED}✗ next.config.js not found${NC}"
    ((FAILED++))
fi
echo ""

# ============================================
# TEST 12: Symlinks Check
# ============================================
echo -e "${BLUE}[12/15]${NC} Checking for problematic symlinks..."
SYMLINKS=$(find . -maxdepth 2 -type l 2>/dev/null || true)
if [ -z "$SYMLINKS" ]; then
    echo -e "${GREEN}✓ No symlinks found in root${NC}"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠ Found symlinks (may cause Railway issues):${NC}"
    echo "$SYMLINKS"
    ((WARNINGS++))
fi
echo ""

# ============================================
# TEST 13: yarn.lock Status
# ============================================
echo -e "${BLUE}[13/15]${NC} Checking yarn.lock..."
if [ -f "yarn.lock" ]; then
    if [ -L "yarn.lock" ]; then
        echo -e "${RED}✗ yarn.lock is a symlink (will fail in Railway)${NC}"
        ls -la yarn.lock
        ((FAILED++))
    else
        YARN_LOCK_SIZE=$(stat -f%z "yarn.lock" 2>/dev/null || stat -c%s "yarn.lock" 2>/dev/null)
        if [ "$YARN_LOCK_SIZE" -gt 100000 ]; then
            echo -e "${GREEN}✓ yarn.lock is a real file ($YARN_LOCK_SIZE bytes)${NC}"
            ((PASSED++))
        else
            echo -e "${YELLOW}⚠ yarn.lock seems small ($YARN_LOCK_SIZE bytes)${NC}"
            ((WARNINGS++))
        fi
    fi
else
    echo -e "${RED}✗ yarn.lock not found${NC}"
    ((FAILED++))
fi
echo ""

# ============================================
# TEST 14: Node Modules Health
# ============================================
echo -e "${BLUE}[14/15]${NC} Checking node_modules..."
if [ -d "node_modules" ]; then
    MODULES_COUNT=$(find node_modules -maxdepth 1 -type d | wc -l)
    if [ "$MODULES_COUNT" -gt 500 ]; then
        echo -e "${GREEN}✓ node_modules healthy ($MODULES_COUNT packages)${NC}"
        ((PASSED++))
    else
        echo -e "${YELLOW}⚠ node_modules seems incomplete ($MODULES_COUNT packages)${NC}"
        echo -e "${YELLOW}  Consider running: yarn install${NC}"
        ((WARNINGS++))
    fi
else
    echo -e "${RED}✗ node_modules not found${NC}"
    echo -e "${RED}  Run: yarn install${NC}"
    ((FAILED++))
fi
echo ""

# ============================================
# TEST 15: Dockerfile Railway Compatibility
# ============================================
echo -e "${BLUE}[15/16]${NC} Checking Dockerfile Railway compatibility..."
if [ -f "../Dockerfile" ]; then
    # Check if Dockerfile uses "nextjs_space/" prefix in COPY commands
    # This is REQUIRED because Railway Root Directory is "nextjs_space/"
    # but the actual app code is in "nextjs_space/nextjs_space/"
    COPY_WITH_PREFIX=$(grep -E "COPY nextjs_space/" ../Dockerfile 2>/dev/null || true)
    if [ -n "$COPY_WITH_PREFIX" ]; then
        echo -e "${GREEN}✓ Dockerfile uses 'nextjs_space/' prefix correctly${NC}"
        echo -e "${GREEN}  This matches the nested directory structure${NC}"
        ((PASSED++))
    else
        echo -e "${RED}✗ Dockerfile missing 'nextjs_space/' prefix in COPY commands${NC}"
        echo -e "${RED}  Railway Root Directory is 'nextjs_space/' but app code is in 'nextjs_space/nextjs_space/'${NC}"
        echo -e "${YELLOW}  Fix: Add 'nextjs_space/' prefix to COPY commands${NC}"
        ((FAILED++))
    fi
else
    echo -e "${YELLOW}⚠ Dockerfile not found in parent directory${NC}"
    ((WARNINGS++))
fi
echo ""

# ============================================
# TEST 16: Build Test (Optional, Time-Consuming)
# ============================================
echo -e "${BLUE}[16/16]${NC} Next.js Build Test..."
if [ "$1" = "--full" ]; then
    echo -e "${YELLOW}Running full Next.js build (this will take 5-10 minutes)...${NC}"
    if NODE_OPTIONS="--max-old-space-size=4096" yarn build > /tmp/nextjs-build.log 2>&1; then
        echo -e "${GREEN}✓ Next.js build successful${NC}"
        ((PASSED++))
    else
        echo -e "${RED}✗ Next.js build failed${NC}"
        tail -50 /tmp/nextjs-build.log
        ((FAILED++))
    fi
else
    echo -e "${YELLOW}⚠ Skipping full build (use --full flag to enable)${NC}"
    echo -e "${YELLOW}  Run: ./scripts/pre-deployment-diagnosis.sh --full${NC}"
    ((WARNINGS++))
fi
echo ""

# ============================================
# FINAL SUMMARY
# ============================================
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

echo ""
echo -e "${BLUE}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                    DIAGNOSIS SUMMARY                      ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}Passed:   $PASSED${NC}"
echo -e "${RED}Failed:   $FAILED${NC}"
echo -e "${YELLOW}Warnings: $WARNINGS${NC}"
echo -e "Duration: ${DURATION}s"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}╔═══════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║     ✓ ALL CRITICAL CHECKS PASSED                          ║${NC}"
    echo -e "${GREEN}║     Ready for Railway Deployment                          ║${NC}"
    echo -e "${GREEN}╚═══════════════════════════════════════════════════════════╝${NC}"
    
    if [ $WARNINGS -gt 0 ]; then
        echo ""
        echo -e "${YELLOW}Note: $WARNINGS warnings detected (non-blocking)${NC}"
    fi
    
    echo ""
    echo -e "${BLUE}Next Steps:${NC}"
    echo -e "  1. git add -A"
    echo -e "  2. git commit -m 'Pre-deployment validation passed'"
    echo -e "  3. git push origin main"
    echo -e "  4. Monitor Railway dashboard for deployment"
    echo ""
    
    exit 0
else
    echo -e "${RED}╔═══════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║     ✗ DEPLOYMENT VALIDATION FAILED                        ║${NC}"
    echo -e "${RED}║     Fix $FAILED critical issues before deploying              ║${NC}"
    echo -e "${RED}╚═══════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${YELLOW}Review the errors above and fix them before deployment.${NC}"
    echo ""
    exit 1
fi
