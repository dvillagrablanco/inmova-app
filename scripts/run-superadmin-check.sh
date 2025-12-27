#!/bin/bash

# Script para ejecutar la verificación completa de superadministrador en inmova.app

echo "🚀 Iniciando verificación completa de inmova.app como SuperAdmin"
echo "================================================================"
echo ""

# Crear directorio para resultados si no existe
mkdir -p test-results

# Verificar que Playwright esté instalado
echo "📦 Verificando instalación de Playwright..."
if ! npx playwright --version &> /dev/null; then
    echo "⚠️  Playwright no está instalado. Instalando..."
    npx playwright install chromium
else
    echo "✅ Playwright instalado"
fi

# Ejecutar las pruebas
echo ""
echo "🧪 Ejecutando pruebas en inmova.app..."
echo ""

npx playwright test \
  --config=playwright.production.config.ts \
  e2e/superadmin-full-check.spec.ts \
  --reporter=list

# Verificar resultado
if [ $? -eq 0 ]; then
    echo ""
    echo "================================================================"
    echo "✅ Verificación completada exitosamente"
    echo "================================================================"
    echo ""
    echo "📸 Screenshots guardadas en: test-results/"
    echo "📊 Ver reporte HTML: npx playwright show-report playwright-report-production"
    echo ""
else
    echo ""
    echo "================================================================"
    echo "⚠️  Algunas pruebas fallaron. Ver detalles arriba."
    echo "================================================================"
    echo ""
    echo "📸 Screenshots guardadas en: test-results/"
    echo "📊 Ver reporte HTML: npx playwright show-report playwright-report-production"
    echo ""
    exit 1
fi
