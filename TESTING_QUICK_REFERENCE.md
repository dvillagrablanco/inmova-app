# Guía Rápida de Testing - INMOVA

## 🚀 Comandos Rápidos

### Tests Unitarios
```bash
# Ejecutar todos los tests unitarios
yarn test:unit --run

# Ejecutar con UI interactiva
yarn test:unit:ui

# Ejecutar con cobertura
yarn test:ci

# Ejecutar un test específico
yarn test:unit auth-service.test.ts
```

### Tests E2E
```bash
# 1. Iniciar servidor (Terminal 1)
cd /home/ubuntu/homming_vidaro/nextjs_space
yarn dev

# 2. Ejecutar tests E2E (Terminal 2)
yarn test:e2e

# Con interfaz gráfica
yarn test:e2e:ui

# En modo debug (paso a paso)
yarn test:e2e:debug
```

### Load Testing
```bash
# 1. Iniciar servidor
yarn dev

# 2. Ejecutar load test (Terminal 2)
node scripts/load-test.js

# Personalizar parámetros
CONCURRENT_USERS=150 REQUESTS_PER_USER=10 node scripts/load-test.js
```

### Performance Testing (Lighthouse)
```bash
# 1. Iniciar servidor
yarn dev

# 2. Ejecutar auditoría (Terminal 2)
yarn lighthouse:audit

# Ver reportes
ls -lh lighthouse-reports/
```

---

## 📊 Estado de Tests

### Tests Críticos (✅ 100% Pasando)
- ✅ **Autenticación** (13 tests) - Login, Registro, JWT, Roles
- ✅ **Contratos** (17 tests) - Validaciones, Cálculos, Estados
- ✅ **Pagos** (11 tests) - Creación, Mora, Estados
- ✅ **Cupones** (10 tests) - Validación, Descuentos
- ✅ **Inquilinos** (12 tests) - CRUD, Validaciones
- ✅ **API Edificios** (10 tests) - Endpoints REST

### Tests E2E (Flujo Principal)
- Login → Crear Edificio → Crear Unidad → Crear Contrato → Crear Pago
- Manejo de errores de validación

---

## 🔧 Configuración

### Variables de Entorno (`.env.test`)
```bash
DATABASE_URL="postgresql://user:pass@localhost:5432/inmova_test"
NEXTAUTH_SECRET=test-secret-key
NEXTAUTH_URL=http://localhost:3000
```

### Sentry (Error Tracking)
Agregar en `.env`:
```bash
NEXT_PUBLIC_SENTRY_DSN=https://your-dsn@sentry.io/project-id
```

Inicializar en la app:
```typescript
import { initSentry } from '@/lib/sentry-config';
initSentry();
```

---

## 🐛 Debugging

### Ver logs de tests
```bash
yarn test:unit --run --reporter=verbose
```

### Debug test específico
```bash
yarn test:unit --run auth-service.test.ts
```

### Ver coverage detallado
```bash
yarn test:ci
open coverage/index.html
```

---

## ✅ Checklist de Testing

Antes de hacer deploy:

- [ ] ✅ Tests unitarios pasando (`yarn test:unit --run`)
- [ ] ✅ Tests E2E pasando (`yarn test:e2e`)
- [ ] ✅ Load test sin errores (100+ usuarios)
- [ ] ✅ Lighthouse > 80 Performance, > 90 Accessibility
- [ ] ✅ Sentry configurado en producción
- [ ] ✅ Mobile testing (iOS + Android)
- [ ] ✅ Browser testing (Chrome, Firefox, Safari, Edge)

---

## 📚 Documentación Completa

- **Guía Completa:** `TESTING.md`
- **Resultados:** `TEST_RESULTS.md`
- **Configuración CI/CD:** `.github/workflows/tests.yml`

---

## 📞 Soporte

Para preguntas sobre testing:
- Email: soporte@inmova.com
- Docs: https://inmova.app/docs/testing
