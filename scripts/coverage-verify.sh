#!/bin/bash
# Verificador de cobertura 100%
# Falla si la cobertura es menor a 100% en cualquier métrica

set -e

echo "🔍 Verificando cobertura de tests..."
echo "========================================"
echo ""

# Ejecutar tests con coverage
echo "📊 Ejecutando tests con coverage..."
yarn test:coverage --run

# Verificar que exista el archivo de coverage
if [ ! -f "coverage/coverage-summary.json" ]; then
  echo "❌ ERROR: No se encontró coverage/coverage-summary.json"
  echo "   Ejecuta primero: yarn test:coverage"
  exit 1
fi

# Parsear JSON con jq (si está disponible) o con python
if command -v jq &> /dev/null; then
  # Usar jq
  LINES=$(jq '.total.lines.pct' coverage/coverage-summary.json)
  FUNCTIONS=$(jq '.total.functions.pct' coverage/coverage-summary.json)
  BRANCHES=$(jq '.total.branches.pct' coverage/coverage-summary.json)
  STATEMENTS=$(jq '.total.statements.pct' coverage/coverage-summary.json)
else
  # Usar python
  LINES=$(python3 -c "import json; print(json.load(open('coverage/coverage-summary.json'))['total']['lines']['pct'])")
  FUNCTIONS=$(python3 -c "import json; print(json.load(open('coverage/coverage-summary.json'))['total']['functions']['pct'])")
  BRANCHES=$(python3 -c "import json; print(json.load(open('coverage/coverage-summary.json'))['total']['branches']['pct'])")
  STATEMENTS=$(python3 -c "import json; print(json.load(open('coverage/coverage-summary.json'))['total']['statements']['pct'])")
fi

# Mostrar resultados
echo ""
echo "========================================"
echo "📊 RESULTADOS DE COBERTURA"
echo "========================================"
echo "Lines:      ${LINES}%"
echo "Functions:  ${FUNCTIONS}%"
echo "Branches:   ${BRANCHES}%"
echo "Statements: ${STATEMENTS}%"
echo ""

# Verificar threshold 100%
THRESHOLD=100
FAILED=0

if (( $(echo "$LINES < $THRESHOLD" | bc -l) )); then
  echo "❌ FAIL: Lines coverage ${LINES}% < ${THRESHOLD}%"
  FAILED=1
fi

if (( $(echo "$FUNCTIONS < $THRESHOLD" | bc -l) )); then
  echo "❌ FAIL: Functions coverage ${FUNCTIONS}% < ${THRESHOLD}%"
  FAILED=1
fi

if (( $(echo "$BRANCHES < $THRESHOLD" | bc -l) )); then
  echo "❌ FAIL: Branches coverage ${BRANCHES}% < ${THRESHOLD}%"
  FAILED=1
fi

if (( $(echo "$STATEMENTS < $THRESHOLD" | bc -l) )); then
  echo "❌ FAIL: Statements coverage ${STATEMENTS}% < ${THRESHOLD}%"
  FAILED=1
fi

if [ $FAILED -eq 1 ]; then
  echo ""
  echo "💡 Para ver archivos con baja cobertura:"
  echo "   open coverage/index.html"
  echo ""
  echo "💡 Para generar tests faltantes:"
  echo "   yarn generate:tests"
  echo ""
  exit 1
else
  echo "✅ ÉXITO: Cobertura 100% alcanzada en todas las métricas"
  echo ""
  exit 0
fi
