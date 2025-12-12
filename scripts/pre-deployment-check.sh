#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PROJECT_ROOT="/home/ubuntu/homming_vidaro/nextjs_space"
cd "$PROJECT_ROOT"

echo "========================================="
echo "   PRE-DEPLOYMENT VERIFICATION SCRIPT"
echo "========================================="
echo ""

# Track errors
ERRORS=0
WARNINGS=0

echo "📋 PHASE 1: PROJECT STRUCTURE VERIFICATION"
echo "==========================================="

# Check critical directories exist
echo "🔍 Checking critical directories..."
CRITICAL_DIRS=("app" "components" "lib" "prisma" "public")
for dir in "${CRITICAL_DIRS[@]}"; do
  if [ -d "$dir" ]; then
    echo "  ✓ $dir/ exists"
  else
    echo -e "  ${RED}✗ $dir/ is MISSING${NC}"
    ((ERRORS++))
  fi
done
echo ""

# Check for problematic nested directories
echo "🔍 Checking for problematic nested directories..."
if [ -d "nextjs_space" ]; then
  echo -e "  ${YELLOW}⚠ nextjs_space/ subdirectory exists (may cause confusion)${NC}"
  ((WARNINGS++))
else
  echo "  ✓ No nested nextjs_space/ directory"
fi
echo ""

echo "📋 PHASE 2: CONFIGURATION FILES"
echo "==========================================="

# Check tsconfig.json
echo "🔍 Checking tsconfig.json..."
if [ -f "tsconfig.json" ]; then
  echo "  ✓ tsconfig.json exists"
  
  # Check for baseUrl
  if grep -q '"baseUrl"' tsconfig.json; then
    echo "  ✓ baseUrl is configured"
  else
    echo -e "  ${YELLOW}⚠ baseUrl not explicitly set${NC}"
    ((WARNINGS++))
  fi
  
  # Check for paths
  if grep -q '"paths"' tsconfig.json; then
    echo "  ✓ paths are configured"
  else
    echo -e "  ${RED}✗ paths not configured${NC}"
    ((ERRORS++))
  fi
else
  echo -e "  ${RED}✗ tsconfig.json is MISSING${NC}"
  ((ERRORS++))
fi
echo ""

# Check package.json
echo "🔍 Checking package.json..."
if [ -f "package.json" ]; then
  echo "  ✓ package.json exists"
  
  # Check critical dependencies
  CRITICAL_DEPS=("next" "react" "react-dom" "@prisma/client" "next-auth")
  for dep in "${CRITICAL_DEPS[@]}"; do
    if grep -q "\"$dep\"" package.json; then
      echo "  ✓ $dep is in dependencies"
    else
      echo -e "  ${RED}✗ $dep is MISSING from dependencies${NC}"
      ((ERRORS++))
    fi
  done
  
  # Check build script
  if grep -q '"build".*prisma generate' package.json; then
    echo "  ✓ Build script includes 'prisma generate'"
  else
    echo -e "  ${YELLOW}⚠ Build script may not include 'prisma generate'${NC}"
    ((WARNINGS++))
  fi
else
  echo -e "  ${RED}✗ package.json is MISSING${NC}"
  ((ERRORS++))
fi
echo ""

# Check prisma/schema.prisma
echo "🔍 Checking Prisma configuration..."
if [ -f "prisma/schema.prisma" ]; then
  echo "  ✓ prisma/schema.prisma exists"
else
  echo -e "  ${RED}✗ prisma/schema.prisma is MISSING${NC}"
  ((ERRORS++))
fi
echo ""

echo "📋 PHASE 3: IMPORT VERIFICATION"
echo "==========================================="

# Check for critical files existence
echo "🔍 Checking critical lib files..."
CRITICAL_FILES=("lib/logger.ts" "lib/auth-options.ts" "lib/db.ts" "lib/permissions.ts" "lib/utils.ts")
for file in "${CRITICAL_FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "  ✓ $file exists"
  else
    echo -e "  ${RED}✗ $file is MISSING${NC}"
    ((ERRORS++))
  fi
done
echo ""

# Check for case sensitivity issues
echo "🔍 Checking for potential case sensitivity issues..."
CASE_ISSUES=0

# Check Button imports (should be lowercase)
if grep -r "from '@/components/ui/Button'" --include="*.ts" --include="*.tsx" app/ components/ lib/ 2>/dev/null | grep -q .; then
  echo -e "  ${RED}✗ Found imports with wrong casing: Button (should be button)${NC}"
  ((ERRORS++))
  ((CASE_ISSUES++))
fi

# Check logger imports (should be lowercase)
if grep -r "from '@/lib/Logger'" --include="*.ts" --include="*.tsx" app/ components/ lib/ 2>/dev/null | grep -q .; then
  echo -e "  ${RED}✗ Found imports with wrong casing: Logger (should be logger)${NC}"
  ((ERRORS++))
  ((CASE_ISSUES++))
fi

if [ $CASE_ISSUES -eq 0 ]; then
  echo "  ✓ No obvious case sensitivity issues found"
fi
echo ""

echo "📋 PHASE 4: GIT REPOSITORY STATUS"
echo "==========================================="

# Check .gitignore
echo "🔍 Checking .gitignore..."
if [ -f ".gitignore" ]; then
  echo "  ✓ .gitignore exists"
  
  # Check critical entries
  IGNORE_ENTRIES=(".next" ".build" "node_modules" ".env")
  for entry in "${IGNORE_ENTRIES[@]}"; do
    if grep -q "^${entry}/" .gitignore || grep -q "^${entry}$" .gitignore; then
      echo "  ✓ $entry is in .gitignore"
    else
      echo -e "  ${YELLOW}⚠ $entry may not be in .gitignore${NC}"
      ((WARNINGS++))
    fi
  done
else
  echo -e "  ${RED}✗ .gitignore is MISSING${NC}"
  ((ERRORS++))
fi
echo ""

# Check if there are uncommitted changes
echo "🔍 Checking Git status..."
if git diff --quiet && git diff --cached --quiet; then
  echo "  ✓ No uncommitted changes"
else
  echo -e "  ${YELLOW}⚠ There are uncommitted changes${NC}"
  ((WARNINGS++))
fi
echo ""

echo "📋 PHASE 5: TYPESCRIPT COMPILATION"
echo "==========================================="
echo "🔍 Running TypeScript type check (this may take a minute)..."

# Run TypeScript check
if timeout 120 NODE_OPTIONS="--max-old-space-size=6144" yarn tsc --noEmit 2>&1 | tee /tmp/tsc-output.txt | tail -20; then
  echo -e "${GREEN}✓ TypeScript compilation successful${NC}"
else
  echo -e "${RED}✗ TypeScript compilation failed${NC}"
  echo "Last 20 lines of errors:"
  tail -20 /tmp/tsc-output.txt
  ((ERRORS++))
fi
echo ""

echo "========================================="
echo "   VERIFICATION SUMMARY"
echo "========================================="
echo ""

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
  echo -e "${GREEN}✓ ALL CHECKS PASSED!${NC}"
  echo "  The project is ready for deployment to Vercel."
  echo ""
  exit 0
elif [ $ERRORS -eq 0 ]; then
  echo -e "${YELLOW}⚠ PASSED WITH WARNINGS${NC}"
  echo "  Errors: $ERRORS"
  echo "  Warnings: $WARNINGS"
  echo ""
  echo "  The project should work on Vercel, but review the warnings."
  echo ""
  exit 0
else
  echo -e "${RED}✗ VERIFICATION FAILED${NC}"
  echo "  Errors: $ERRORS"
  echo "  Warnings: $WARNINGS"
  echo ""
  echo "  Please fix the errors before deploying to Vercel."
  echo ""
  exit 1
fi
