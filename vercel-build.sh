#!/bin/bash
set -e

# Generar Prisma Client
echo "Generating Prisma Client..."
npx prisma generate

# Build de Next.js sin recopilar datos de páginas API
echo "Building Next.js..."
SKIP_ENV_VALIDATION=1 next build --no-lint

