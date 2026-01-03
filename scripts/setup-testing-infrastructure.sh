#!/bin/bash
# Setup completo de infraestructura de testing para cobertura 100%
# Ejecutar UNA VEZ al inicio del proyecto

set -e

echo "🚀 Setup de Infraestructura de Testing"
echo "========================================"
echo ""

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Crear estructura de directorios
echo "📁 Creando estructura de directorios..."
mkdir -p __tests__/{e2e,integration/api,unit/{services,lib,components,hooks},security}
mkdir -p test-results
mkdir -p coverage

echo -e "${GREEN}✅ Estructura creada${NC}"
echo ""

# 2. Copiar configuración de vitest para 100%
echo "⚙️  Configurando Vitest para cobertura 100%..."
if [ -f "vitest.config.100.ts" ]; then
  cp vitest.config.100.ts vitest.config.ts
  echo -e "${GREEN}✅ vitest.config.ts actualizado${NC}"
else
  echo -e "${YELLOW}⚠️  vitest.config.100.ts no encontrado${NC}"
fi
echo ""

# 3. Instalar dependencias de testing (si no están)
echo "📦 Verificando dependencias..."
DEPS_NEEDED=0

if ! grep -q "@vitest/ui" package.json; then
  echo "   Installing @vitest/ui..."
  DEPS_NEEDED=1
fi

if ! grep -q "@playwright/test" package.json; then
  echo "   Installing @playwright/test..."
  DEPS_NEEDED=1
fi

if [ $DEPS_NEEDED -eq 1 ]; then
  yarn add -D @vitest/ui @vitest/coverage-v8 @playwright/test
  echo -e "${GREEN}✅ Dependencias instaladas${NC}"
else
  echo -e "${GREEN}✅ Todas las dependencias ya instaladas${NC}"
fi
echo ""

# 4. Actualizar package.json scripts
echo "📝 Actualizando scripts en package.json..."

# Backup de package.json
cp package.json package.json.bak

# Agregar scripts si no existen
cat package.json.bak | jq '.scripts += {
  "test:all": "yarn test:unit && yarn test:integration && yarn test:e2e",
  "test:coverage": "vitest run --coverage",
  "test:integration": "vitest run __tests__/integration",
  "coverage:verify": "./scripts/coverage-verify.sh",
  "coverage:report": "vitest run --coverage && open coverage/index.html",
  "coverage:missing": "vitest run --coverage && grep -r \"0%\" coverage/lcov-report",
  "generate:tests": "python3 scripts/generate-api-tests.py",
  "generate:tests-components": "python3 scripts/generate-component-tests.py"
}' > package.json.tmp && mv package.json.tmp package.json

echo -e "${GREEN}✅ Scripts actualizados${NC}"
echo ""

# 5. Crear .gitignore entries para testing
echo "📝 Actualizando .gitignore..."
if [ -f ".gitignore" ]; then
  if ! grep -q "coverage/" .gitignore; then
    echo "" >> .gitignore
    echo "# Testing" >> .gitignore
    echo "coverage/" >> .gitignore
    echo "test-results/" >> .gitignore
    echo ".vitest/" >> .gitignore
    echo "*.test.ts.snap" >> .gitignore
    echo -e "${GREEN}✅ .gitignore actualizado${NC}"
  else
    echo -e "${GREEN}✅ .gitignore ya configurado${NC}"
  fi
fi
echo ""

# 6. Crear archivo de ejemplo de test E2E
echo "📄 Creando tests de ejemplo..."

cat > __tests__/e2e/example.spec.ts << 'EOF'
import { test, expect } from '@playwright/test';

test.describe('Example E2E Test', () => {
  test('should load home page', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Inmova/);
  });
});
EOF

cat > __tests__/unit/services/example.test.ts << 'EOF'
import { describe, it, expect } from 'vitest';

describe('Example Unit Test', () => {
  it('should pass', () => {
    expect(1 + 1).toBe(2);
  });
});
EOF

echo -e "${GREEN}✅ Tests de ejemplo creados${NC}"
echo ""

# 7. Resumen
echo "========================================"
echo "✅ SETUP COMPLETADO"
echo "========================================"
echo ""
echo "📁 Estructura creada:"
echo "   __tests__/e2e/              - Tests end-to-end (Playwright)"
echo "   __tests__/integration/api/  - Tests de API routes"
echo "   __tests__/unit/             - Tests unitarios"
echo "   coverage/                   - Reportes de cobertura"
echo ""
echo "📝 Nuevos comandos disponibles:"
echo "   yarn test:all               - Ejecutar todos los tests"
echo "   yarn test:coverage          - Ejecutar con cobertura"
echo "   yarn coverage:verify        - Verificar 100% cobertura"
echo "   yarn coverage:report        - Ver reporte HTML"
echo "   yarn generate:tests         - Generar tests API"
echo ""
echo "🚀 Próximos pasos:"
echo "   1. Generar tests API:       yarn generate:tests"
echo "   2. Ejecutar tests:          yarn test:all"
echo "   3. Ver cobertura:           yarn coverage:report"
echo "   4. Verificar 100%:          yarn coverage:verify"
echo ""
echo "📖 Documentación completa:"
echo "   cat PLAN_COBERTURA_100_COMPLETO.md"
echo ""
