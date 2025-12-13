#!/bin/bash
# Script para type-checking con memoria optimizada

set -e

echo "🔍 Ejecutando type-checking con memoria optimizada..."

export NODE_OPTIONS="--max-old-space-size=4096"

if [ "$1" = "--incremental" ]; then
  echo "📦 Modo incremental activado"
  npx tsc --noEmit --incremental
else
  echo "🔄 Modo completo"
  npx tsc --noEmit
fi

echo "✅ Type-checking completado"
