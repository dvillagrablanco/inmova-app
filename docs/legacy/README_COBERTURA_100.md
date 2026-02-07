# 🎯 GUÍA RÁPIDA: COBERTURA 100%

**Objetivo**: Llevar tu aplicación de 10% a 100% de cobertura de tests en 15 días

---

## 🚀 INICIO RÁPIDO (5 minutos)

### Paso 1: Setup de infraestructura

```bash
# Ejecutar setup automático
./scripts/setup-testing-infrastructure.sh

# Resultado:
# ✅ Estructura de carpetas creada
# ✅ Configuración de vitest para 100%
# ✅ Scripts en package.json
# ✅ Tests de ejemplo
```

### Paso 2: Generar tests automáticamente

```bash
# Generar tests para TODAS las API routes (575 tests)
yarn generate:tests

# Generar tests para componentes críticos (~150 tests)
yarn generate:tests-components

# Resultado:
# ✅ ~725 tests generados automáticamente
# ⚠️ Requieren ajustes manuales (TODOs)
```

### Paso 3: Ejecutar tests

```bash
# Ejecutar todos los tests
yarn test:all

# Ver cobertura
yarn test:coverage

# Abrir reporte HTML
yarn coverage:report
```

### Paso 4: Verificar cobertura 100%

```bash
# Verificar threshold 100%
yarn coverage:verify

# Si falla:
# ❌ FAIL: Lines coverage 65% < 100%
# 💡 Ver: open coverage/index.html
```

---

## 📋 PLAN DETALLADO

Sigue el plan día por día: **`PLAN_COBERTURA_100_COMPLETO.md`**

**Resumen**:
- **Días 1-2**: Setup + TypeScript strict
- **Días 3-5**: Tests E2E (80 tests)
- **Días 6-8**: Tests API (575 tests)
- **Días 9-10**: Tests unitarios (350 tests)
- **Días 11-12**: Hardening (rate limiting, logging)
- **Días 13-14**: Auditorías (seguridad, performance)
- **Día 15**: Verificación final + deploy

---

## 🛠️ COMANDOS DISPONIBLES

### Tests

```bash
# Ejecutar todos los tests
yarn test:all

# Solo E2E
yarn test:e2e

# Solo integración (API)
yarn test:integration

# Solo unitarios
yarn test:unit

# Con cobertura
yarn test:coverage

# Watch mode
yarn test:unit --watch
```

### Cobertura

```bash
# Ver reporte HTML
yarn coverage:report

# Verificar 100%
yarn coverage:verify

# Encontrar archivos sin cobertura
yarn coverage:missing
```

### Generación automática

```bash
# Generar tests API
yarn generate:tests

# Generar tests componentes
yarn generate:tests-components

# Ambos
yarn generate:tests && yarn generate:tests-components
```

---

## 📁 ESTRUCTURA DE TESTS

```
__tests__/
├── e2e/                    # Tests End-to-End (Playwright)
│   ├── auth/
│   │   ├── login.spec.ts
│   │   ├── logout.spec.ts
│   │   └── signup.spec.ts
│   ├── properties/
│   ├── tenants/
│   ├── contracts/
│   └── payments/
│
├── integration/            # Tests de Integración
│   └── api/
│       ├── properties/
│       │   ├── GET.test.ts
│       │   ├── POST.test.ts
│       │   └── ...
│       └── ... (575 archivos)
│
└── unit/                   # Tests Unitarios
    ├── services/
    │   ├── auth-service.test.ts
    │   └── ...
    ├── lib/
    │   ├── validations.test.ts
    │   └── ...
    └── components/
        ├── ui/
        │   ├── button.test.tsx
        │   └── ...
        └── ...
```

---

## 🎯 CHECKLIST DIARIO

### Día 1: Setup
- [ ] Ejecutar `./scripts/setup-testing-infrastructure.sh`
- [ ] Ejecutar `python3 scripts/fix-dynamic-export.py`
- [ ] Activar TypeScript strict mode en tsconfig.json
- [ ] Corregir primeros 100 errores TypeScript

### Día 2: TypeScript + Tests E2E críticos
- [ ] Terminar corrección de TypeScript
- [ ] Crear 15 tests E2E críticos (auth, properties)

### Día 3-5: Tests E2E completos
- [ ] Día 3: Tenants, Contracts (15 tests)
- [ ] Día 4: Payments, Dashboard (15 tests)
- [ ] Día 5: Workflows, Edge cases (15 tests)
- [ ] **Total**: 80 tests E2E

### Día 6-8: Tests API (automáticos)
- [ ] Ejecutar `yarn generate:tests`
- [ ] Revisar y ajustar tests generados (TODOs)
- [ ] **Total**: 575 tests API

### Día 9-10: Tests Unitarios
- [ ] Ejecutar `yarn generate:tests-components`
- [ ] Crear tests de servicios manualmente (100 tests)
- [ ] **Total**: 350 tests unitarios

### Día 11-15: Hardening + Verificación
- [ ] Rate limiting en todas las rutas
- [ ] Validación Zod completa
- [ ] Logging estructurado
- [ ] Auditorías de seguridad y performance
- [ ] Verificar cobertura 100%

---

## 📊 MÉTRICAS DE PROGRESO

Ejecuta diariamente:

```bash
# Ver estadísticas
yarn test:all --reporter=json | jq '.numTotalTests'

# Ver cobertura
yarn test:coverage | grep -A 5 "% Lines"
```

**Objetivo final**:
```
Tests:      1005 passed, 1005 total
% Lines:    100%
% Functions: 100%
% Branches: 100%
% Statements: 100%
```

---

## 🚨 TROUBLESHOOTING

### Tests fallan con "Module not found"

```bash
# Verificar aliases en vitest.config.ts
# Debe tener: '@': path.resolve(__dirname, './')
```

### Cobertura no alcanza 100%

```bash
# Ver archivos sin cobertura
open coverage/index.html

# Buscar archivos con <100%
find coverage/lcov-report -name "*.html" -exec grep -l "0%" {} \;
```

### Tests muy lentos

```bash
# Aumentar workers en vitest.config.ts
maxThreads: 8  # En lugar de 4

# Usar mocks agresivos
vi.mock('@/lib/db', () => ({ ... }))
```

### Build falla después de TypeScript strict

```bash
# Desactivar temporalmente strict para una carpeta
// @ts-nocheck
// Al inicio del archivo

# O usar suppressions específicas
// @ts-expect-error: TODO - fix this type
```

---

## 📚 RECURSOS

- **Plan completo**: `PLAN_COBERTURA_100_COMPLETO.md`
- **Auditoría**: `AUDITORIA_ESTADO_PROYECTO_INMOVA.md`
- **Cursorrules**: `.cursorrules` (reglas de calidad)
- **Vitest Docs**: https://vitest.dev
- **Playwright Docs**: https://playwright.dev
- **Testing Library**: https://testing-library.com

---

## 💡 TIPS

### Priorizar tests

1. **Críticos primero**: Auth, pagos, contratos
2. **Generación automática**: APIs y componentes simples
3. **Manual solo para lógica compleja**: Servicios, hooks

### Mantener velocidad

- Usar `--coverage` solo al final del día
- Desarrollo con `--watch` sin coverage
- CI/CD: Solo coverage en main branch

### Pair programming

- Días 2-3 (TypeScript): Pair para refactorizar tipos
- Días 9-10 (Unitarios): Pair para tests complejos

---

## ✅ RESULTADO FINAL

Después de 15 días tendrás:

- ✅ **1005+ tests automatizados**
- ✅ **100% cobertura verificada**
- ✅ **TypeScript strict mode activo**
- ✅ **Production-ready según .cursorrules**
- ✅ **Confianza para deployar a GA**

---

## 🚀 COMENZAR AHORA

```bash
# Paso 1: Setup (5 min)
./scripts/setup-testing-infrastructure.sh

# Paso 2: Generar tests (10 min)
yarn generate:tests
yarn generate:tests-components

# Paso 3: Ejecutar (5 min)
yarn test:all

# Paso 4: Ver cobertura
yarn coverage:report
```

**¡Éxito!** 🎉

---

**Creado**: 3 de Enero de 2026  
**Autor**: Cursor Agent Cloud  
**Versión**: 1.0
