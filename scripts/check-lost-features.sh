#!/bin/bash

# ============================================
# INMOVA - Lost Features Detection Script
# ============================================
# Purpose: Detect if any features were accidentally removed
# Version: 1.0
# Date: 2025-12-13
# ============================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT/nextjs_space"

echo -e "${BLUE}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     INMOVA - Lost Features Detection                      ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""

# ============================================
# Check for deleted core modules
# ============================================
echo -e "${BLUE}[1/5]${NC} Checking core modules..."

CORE_MODULES=(
    "app/room-rental"
    "app/cupones"
    "app/api/room-rental"
    "app/api/admin/impersonate"
    "lib/room-rental-service.ts"
)

MISSING_MODULES=()
for module in "${CORE_MODULES[@]}"; do
    if [ ! -e "$module" ]; then
        MISSING_MODULES+=("$module")
    fi
done

if [ ${#MISSING_MODULES[@]} -eq 0 ]; then
    echo -e "${GREEN}✓ All core modules present${NC}"
else
    echo -e "${RED}✗ Missing modules: ${MISSING_MODULES[*]}${NC}"
fi
echo ""

# ============================================
# Check Prisma models
# ============================================
echo -e "${BLUE}[2/5]${NC} Checking Prisma models..."

REQUIRED_MODELS=(
    "Room"
    "RoomContract"
    "RoomPayment"
    "DiscountCoupon"
)

MISSING_MODELS=()
for model in "${REQUIRED_MODELS[@]}"; do
    if ! grep -q "^model $model" prisma/schema.prisma; then
        MISSING_MODELS+=("$model")
    fi
done

if [ ${#MISSING_MODELS[@]} -eq 0 ]; then
    echo -e "${GREEN}✓ All required Prisma models present${NC}"
else
    echo -e "${RED}✗ Missing Prisma models: ${MISSING_MODELS[*]}${NC}"
fi
echo ""

# ============================================
# Check API routes
# ============================================
echo -e "${BLUE}[3/5]${NC} Checking critical API routes..."

CRITICAL_APIS=(
    "app/api/room-rental/rooms/route.ts"
    "app/api/room-rental/proration/route.ts"
    "app/api/admin/impersonate/route.ts"
)

MISSING_APIS=()
for api in "${CRITICAL_APIS[@]}"; do
    if [ ! -f "$api" ]; then
        MISSING_APIS+=("$api")
    fi
done

if [ ${#MISSING_APIS[@]} -eq 0 ]; then
    echo -e "${GREEN}✓ All critical API routes present${NC}"
else
    echo -e "${RED}✗ Missing API routes: ${MISSING_APIS[*]}${NC}"
fi
echo ""

# ============================================
# Check for broken imports
# ============================================
echo -e "${BLUE}[4/5]${NC} Scanning for broken imports..."

echo -e "${YELLOW}Checking Room Rental imports...${NC}"
ROOM_RENTAL_IMPORTS=$(grep -r "from.*room-rental" app lib components 2>/dev/null | wc -l)
if [ "$ROOM_RENTAL_IMPORTS" -gt 0 ]; then
    echo -e "${GREEN}✓ Found $ROOM_RENTAL_IMPORTS Room Rental import references${NC}"
else
    echo -e "${YELLOW}⚠ No Room Rental imports found (may indicate removed feature)${NC}"
fi

echo -e "${YELLOW}Checking Cupones imports...${NC}"
CUPONES_IMPORTS=$(grep -r "DiscountCoupon\|cupones" app lib 2>/dev/null | wc -l)
if [ "$CUPONES_IMPORTS" -gt 0 ]; then
    echo -e "${GREEN}✓ Found $CUPONES_IMPORTS Cupones import references${NC}"
else
    echo -e "${YELLOW}⚠ No Cupones imports found (may indicate removed feature)${NC}"
fi
echo ""

# ============================================
# Compare file counts with baseline
# ============================================
echo -e "${BLUE}[5/5]${NC} Comparing current file counts with baseline..."

CURRENT_PAGES=$(find app -type f -name "page.tsx" | wc -l)
CURRENT_APIS=$(find app/api -type f -name "route.ts" | wc -l)

echo -e "Current pages: $CURRENT_PAGES"
echo -e "Current APIs:  $CURRENT_APIS"

if [ "$CURRENT_PAGES" -gt 200 ] && [ "$CURRENT_APIS" -gt 500 ]; then
    echo -e "${GREEN}✓ File counts within expected range${NC}"
else
    echo -e "${YELLOW}⚠ File counts lower than expected${NC}"
    echo -e "${YELLOW}  Expected: >200 pages, >500 APIs${NC}"
fi
echo ""

# ============================================
# Summary
# ============================================
echo -e "${BLUE}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                    ANALYSIS COMPLETE                      ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""

if [ ${#MISSING_MODULES[@]} -eq 0 ] && [ ${#MISSING_MODELS[@]} -eq 0 ] && [ ${#MISSING_APIS[@]} -eq 0 ]; then
    echo -e "${GREEN}✓ No lost features detected${NC}"
    echo -e "${GREEN}  All core functionality is present${NC}"
    exit 0
else
    echo -e "${RED}✗ Potential missing features detected${NC}"
    echo -e "${RED}  Review the report above${NC}"
    exit 1
fi
