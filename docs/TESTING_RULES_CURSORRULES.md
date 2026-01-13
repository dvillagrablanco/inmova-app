# 🧪 REGLAS DE TESTING PARA CURSORRULES

**Copiar esta sección al archivo `.cursorrules`**

---

## 🧪 TESTING OBLIGATORIO

### ⚠️ REGLA CRÍTICA: Tests antes de Deployment

**NUNCA deployar sin ejecutar tests.**

```bash
# ANTES de cada deployment (OBLIGATORIO)
npm run test:critical

# ANTES de cada commit a main
npm run test:smoke
```

### 📋 Checklist Pre-Deployment (OBLIGATORIO)

Antes de CADA deployment, verificar:

#### 1. Tests de Smoke
```bash
npm run test:smoke
```
- [ ] Todas las páginas críticas cargan (no 404)
- [ ] APIs críticas responden
- [ ] Auth funciona

#### 2. Tests de Contrato API
```bash
npm run test:api-contract
```
- [ ] APIs devuelven formato esperado
- [ ] No hay "Cannot read properties of undefined"

#### 3. Verificación de Schema
```bash
npm run verify:schema
```
- [ ] Todas las columnas críticas existen en BD
- [ ] No hay errores de Prisma

#### 4. Check Pre-Deployment
```bash
npm run test:pre-deploy
```
- [ ] Páginas críticas existen
- [ ] APIs críticas existen
- [ ] Variables de entorno configuradas
- [ ] Hooks coinciden con APIs

### 🔴 Tests que NUNCA pueden fallar

| Test | Archivo | Comando |
|------|---------|---------|
| Páginas cargan | `__tests__/smoke/critical-pages.test.ts` | `npm run test:smoke` |
| APIs responden | `__tests__/api/contract-tests.test.ts` | `npm run test:api-contract` |
| Login funciona | `__tests__/e2e/company-crud.spec.ts` | `npm run test:e2e` |
| CRUD empresas | `__tests__/e2e/company-crud.spec.ts` | `npm run test:e2e` |

### 📁 Estructura de Tests

```
__tests__/
├── smoke/                    # Tests rápidos (5-10 seg)
│   └── critical-pages.test.ts
├── api/                      # Contract tests
│   └── contract-tests.test.ts
├── e2e/                      # Tests E2E (Playwright)
│   └── company-crud.spec.ts
└── schema/                   # BD tests
    └── sync.test.ts
```

### 🚀 Flujo de Deployment con Tests

```
1. Desarrollar feature
       ↓
2. npm run test:smoke (DEBE PASAR)
       ↓
3. npm run test:api-contract (DEBE PASAR)
       ↓
4. git commit
       ↓
5. npm run test:pre-deploy (DEBE PASAR)
       ↓
6. git push
       ↓
7. Deploy a producción
       ↓
8. Verificar en producción
```

### ⚠️ Errores Comunes y Cómo Prevenirlos

| Error | Causa | Test que lo previene |
|-------|-------|---------------------|
| 404 en página | Ruta no existe | `test:smoke` |
| "undefined" error | API devuelve formato incorrecto | `test:api-contract` |
| Foreign key error | Campo vacío enviado | `test:e2e` (validación) |
| Column not exist | Schema desincronizado | `verify:schema` |
| Login no funciona | Auth mal configurado | `test:smoke` (auth) |

### 📝 Al Crear Nueva Funcionalidad

1. **Nueva página**: Añadir a `CRITICAL_PAGES` en `critical-pages.test.ts`
2. **Nueva API**: Añadir test de contrato en `contract-tests.test.ts`
3. **Nuevo campo BD**: Añadir a `CRITICAL_COLUMNS` en `verify-schema-sync.ts`
4. **Nuevo flujo**: Añadir test E2E en `__tests__/e2e/`

### 🔧 Comandos de Testing

```bash
# Tests rápidos (smoke)
npm run test:smoke

# Tests de contrato API
npm run test:api-contract

# Tests críticos (smoke + contract)
npm run test:critical

# Verificar schema BD
npm run verify:schema

# Check pre-deployment completo
npm run test:pre-deploy

# Tests E2E (Playwright)
npm run test:e2e

# Todos los tests
npm run test:all
```

### 🎯 Cobertura Mínima

| Área | Cobertura |
|------|-----------|
| APIs Admin | 90% |
| Auth | 100% |
| CRUD Operations | 95% |
| Páginas críticas | 100% |

---

**IMPORTANTE**: Si un test falla, NO deployar hasta arreglarlo.
