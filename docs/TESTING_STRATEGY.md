# 🧪 ESTRATEGIA DE TESTING - INMOVA APP

## 📋 Tipos de Errores a Prevenir

| Error | Causa | Test que lo previene |
|-------|-------|---------------------|
| 404 en páginas | Página/ruta no existe | E2E Navigation Tests |
| "Cannot read properties of undefined" | Inconsistencia API/Frontend | API Contract Tests |
| Foreign key constraint | Campos vacíos enviados | Input Validation Tests |
| Column does not exist | Schema desincronizado | Schema Sync Tests |
| Login no funciona | Auth mal configurado | Auth Flow Tests |
| Planes no se muestran | API devuelve formato incorrecto | API Response Tests |

---

## 🎯 Niveles de Testing

### 1. **Smoke Tests** (Pre-deployment obligatorio)
Verifican que la app básica funciona:
- ✅ Landing carga
- ✅ Login funciona
- ✅ Dashboard accesible
- ✅ APIs críticas responden
- ✅ BD conectada

### 2. **E2E Tests** (Flujos de usuario)
Simulan usuarios reales:
- ✅ Crear empresa
- ✅ Editar empresa
- ✅ Eliminar empresa
- ✅ Cambiar plan
- ✅ Gestión de usuarios

### 3. **API Contract Tests**
Verifican consistencia API/Frontend:
- ✅ Formato de respuesta correcto
- ✅ Campos requeridos presentes
- ✅ Tipos de datos correctos

### 4. **Schema Sync Tests**
Verifican BD sincronizada:
- ✅ Todas las columnas existen
- ✅ Relaciones válidas
- ✅ Enums correctos

---

## 🚀 Comandos de Testing

```bash
# Smoke tests (OBLIGATORIO antes de deploy)
npm run test:smoke

# E2E completo
npm run test:e2e

# Solo tests críticos
npm run test:critical

# Verificar schema BD
npm run test:schema

# Todo junto (CI/CD)
npm run test:all
```

---

## 📁 Estructura de Tests

```
__tests__/
├── smoke/                    # Tests rápidos pre-deploy
│   ├── pages.test.ts         # Páginas cargan
│   ├── api-health.test.ts    # APIs responden
│   └── auth.test.ts          # Login funciona
│
├── e2e/                      # Flujos completos
│   ├── company-crud.test.ts  # CRUD empresas
│   ├── user-management.test.ts
│   └── subscription-flow.test.ts
│
├── api/                      # Contract tests
│   ├── companies.test.ts     # API empresas
│   ├── plans.test.ts         # API planes
│   └── auth.test.ts          # API auth
│
└── schema/                   # BD tests
    └── sync.test.ts          # Schema sincronizado
```

---

## ⚠️ Reglas de Testing

### ANTES de cada commit:
```bash
npm run test:smoke  # DEBE pasar
```

### ANTES de cada deploy:
```bash
npm run test:critical  # DEBE pasar al 100%
```

### ANTES de merge a main:
```bash
npm run test:all  # DEBE pasar al 95%+
```

---

## 🔴 Tests Críticos (Nunca pueden fallar)

1. **Auth Flow**: Login/Logout
2. **Company CRUD**: Crear/Editar/Ver/Eliminar
3. **Navigation**: Todas las rutas del menú
4. **API Health**: Endpoints críticos
5. **Schema Sync**: BD sincronizada

---

## 📊 Cobertura Mínima

| Área | Cobertura Mínima |
|------|------------------|
| API Routes | 90% |
| Auth | 100% |
| CRUD Operations | 95% |
| UI Components críticos | 80% |

