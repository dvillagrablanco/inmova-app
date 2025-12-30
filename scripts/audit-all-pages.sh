#!/bin/bash

# Script para auditar TODAS las páginas en lotes

echo "🔄 Iniciando auditoría COMPLETA de 235 páginas..."
echo "📊 Ejecutando en modo COMPLETO..."

export AUDIT_MODE=all
export $(cat .env.test | xargs)

# Ejecutar el audit
timeout 600 npx tsx scripts/visual-audit.ts 2>&1 | tee /tmp/audit-all-full.log

echo ""
echo "✅ Auditoría completa finalizada"
echo "📁 Resultados en: visual-audit-results/"
echo "📄 Logs completos en: /tmp/audit-all-full.log"
