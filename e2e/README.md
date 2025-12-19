# 🧪 Tests E2E - INMOVA

## 📊 Resumen de Tests

Suite exhaustiva de tests end-to-end para los flujos críticos de INMOVA.

### 📊 Estadísticas

- **Total de Tests:** 48 tests E2E
- **Flujos Críticos Cubiertos:** 4
- **Framework:** Playwright
- **Coverage:** Flujos críticos de negocio

---

## 📋 Tests por Módulo

### 1. Autenticación (`auth-critical.spec.ts`)

**10 tests críticos:**

- ✅ AUTH-001: Cargar página de login
- ✅ AUTH-002: Validar campos vacíos
- ✅ AUTH-003: Validar email inválido
- ✅ AUTH-004: Error con contraseña incorrecta
- ✅ AUTH-005: Login exitoso
- ✅ AUTH-006: Mantener sesión después de recargar
- ✅ AUTH-007: Cerrar sesión correctamente
- ✅ AUTH-008: Bloquear acceso sin autenticación
- ✅ AUTH-009: Mostrar estado de carga
- ✅ AUTH-010: Prevenir múltiples clics

**Cobertura:**
- Validación de formularios
- Manejo de errores
- Flujo completo de autenticación
- Persistencia de sesión
- Protección de rutas

---

### 2. Creación de Contrato (`contract-creation.spec.ts`)

**12 tests críticos:**

- ✅ CONTRACT-001: Navegar a contratos
- ✅ CONTRACT-002: Botón de crear contrato visible
- ✅ CONTRACT-003: Abrir formulario de creación
- ✅ CONTRACT-004: Validar campos obligatorios
- ✅ CONTRACT-005: Seleccionar inquilino
- ✅ CONTRACT-006: Seleccionar unidad
- ✅ CONTRACT-007: Llenar fechas de contrato
- ✅ CONTRACT-008: Validar fecha de fin posterior a inicio
- ✅ CONTRACT-009: Llenar información económica
- ✅ CONTRACT-010: Previsualización antes de guardar
- ✅ CONTRACT-011: Cancelar creación
- ✅ CONTRACT-012: Guardar borrador

**Cobertura:**
- Flujo completo de creación
- Validaciones de negocio
- Selección de datos relacionados
- Manejo de borradores
- UX del formulario

---

### 3. Registro de Pago (`payment-flow.spec.ts`)

**15 tests críticos:**

- ✅ PAYMENT-001: Navegar a pagos
- ✅ PAYMENT-002: Botón de registrar pago visible
- ✅ PAYMENT-003: Abrir formulario de pago
- ✅ PAYMENT-004: Validar campos obligatorios
- ✅ PAYMENT-005: Seleccionar contrato
- ✅ PAYMENT-006: Llenar monto del pago
- ✅ PAYMENT-007: Validar monto positivo
- ✅ PAYMENT-008: Seleccionar fecha del pago
- ✅ PAYMENT-009: Seleccionar método de pago
- ✅ PAYMENT-010: Añadir referencia/nota
- ✅ PAYMENT-011: Adjuntar comprobante
- ✅ PAYMENT-012: Filtrar pagos por estado
- ✅ PAYMENT-013: Exportar pagos a CSV
- ✅ PAYMENT-014: Ver detalles de pago
- ✅ PAYMENT-015: Actualizar saldo del contrato

**Cobertura:**
- Flujo completo de registro de pago
- Validaciones financieras
- Adjuntar documentos
- Filtros y exportación
- Actualización de saldos

---

### 4. Impersonación (`impersonation.spec.ts`)

**11 tests críticos:**

- ✅ IMPERS-001: Navegar a gestión de usuarios
- ✅ IMPERS-002: Botón de impersonación visible
- ✅ IMPERS-003: Mostrar confirmación
- ✅ IMPERS-004: Cancelar impersonación
- ✅ IMPERS-005: Iniciar sesión como otro usuario
- ✅ IMPERS-006: Banner de impersonación activa
- ✅ IMPERS-007: Mostrar nombre del usuario impersonado
- ✅ IMPERS-008: Volver a sesión original
- ✅ IMPERS-009: Acceso limitado durante impersonación
- ✅ IMPERS-010: Registrar en audit log
- ✅ IMPERS-011: Solo super admins pueden impersonar

**Cobertura:**
- Flujo completo de impersonación
- Seguridad y permisos
- UX de impersonación
- Audit logging
- Restricciones de acceso

---

## 🚀 Cómo Ejecutar los Tests

### Requisitos Previos

1. **Base de datos seeded** con datos de prueba
2. **Servidor de desarrollo** corriendo en `localhost:3000`
3. **Usuario de prueba** con credenciales:
   - Email: `admin@inmova.com`
   - Password: `admin123`

### Comandos Disponibles

```bash
# Ejecutar todos los tests E2E
yarn test:e2e

# Ejecutar tests en modo UI (interactivo)
yarn test:e2e:ui

# Ejecutar tests en modo debug
yarn test:e2e:debug

# Ejecutar un archivo específico
yarn test:e2e auth-critical.spec.ts

# Ejecutar tests de un flujo específico
yarn test:e2e --grep "AUTH"
yarn test:e2e --grep "CONTRACT"
yarn test:e2e --grep "PAYMENT"
yarn test:e2e --grep "IMPERS"
```

### Ejecutar Solo Flujos Críticos

```bash
# Ejecutar solo los 4 flujos críticos
yarn test:e2e auth-critical.spec.ts contract-creation.spec.ts payment-flow.spec.ts impersonation.spec.ts
```

---

## 📊 Reportes

### Generar Reporte HTML

Después de ejecutar los tests:

```bash
npx playwright show-report
```

Esto abrirá un reporte interactivo en el navegador con:
- ✅ Tests pasados
- ❌ Tests fallidos
- 📸 Screenshots de errores
- 🎬 Traces de ejecución

---

## 🔧 Configuración

### playwright.config.ts

```typescript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'yarn dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

---

## ⚠️ Notas Importantes

### Datos de Prueba

Los tests asumen la existencia de:
- ✅ Usuario admin con credenciales válidas
- ✅ Al menos 1 edificio
- ✅ Al menos 1 unidad
- ✅ Al menos 1 inquilino
- ✅ Al menos 1 contrato (para tests de pagos)

### Timeouts

Los tests usan timeouts generosos para esperar:
- Navegación: 15 segundos
- Elementos: 5 segundos
- Operaciones async: 2-3 segundos

### Resilencia

Los tests están diseñados para ser **resilientes**:
- ✅ Usan múltiples selectores (`.or()`)
- ✅ Manejan elementos opcionales con `.catch()`
- ✅ Esperan dinámicamente por elementos
- ✅ No fallan si elementos opcionales no existen

---

## 🐛 Debugging

### Test Fallido

Si un test falla:

1. **Ver screenshot:**
   - Se guarda automáticamente en `test-results/`

2. **Ver trace:**
   ```bash
   npx playwright show-trace test-results/trace.zip
   ```

3. **Ejecutar en modo debug:**
   ```bash
   yarn test:e2e:debug auth-critical.spec.ts
   ```

4. **Ejecutar en modo UI:**
   ```bash
   yarn test:e2e:ui
   ```

### Problemas Comunes

#### ❌ Test timeout
**Solución:** Aumentar timeout en el test específico:
```typescript
test('mi test', async ({ page }) => {
  test.setTimeout(60000); // 60 segundos
  // ...
});
```

#### ❌ Elemento no encontrado
**Solución:** Verificar que:
1. La página cargó completamente
2. El selector es correcto
3. El elemento está visible (no oculto por CSS)

#### ❌ Credenciales inválidas
**Solución:** Verificar que el usuario de prueba existe en la DB:
```bash
cd nextjs_space
yarn prisma studio
# Verificar usuario admin@inmova.com
```

---

## 📊 Métricas de Calidad

### Objetivos

- ✅ **Pass Rate:** >95%
- ✅ **Test Duration:** <5 minutos total
- ✅ **Flakiness:** <1%
- ✅ **Coverage:** Flujos críticos 100%

### KPIs

| Métrica | Objetivo | Actual |
|---------|----------|--------|
| Tests totales | 40+ | 48 |
| Flujos cubiertos | 4 | 4 |
| Pass rate | >95% | TBD |
| Avg duration | <5 min | TBD |

---

## 📖 Recursos

- [Playwright Documentation](https://playwright.dev/)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [API Reference](https://playwright.dev/docs/api/class-playwright)

---

## ✅ Checklist de Pre-Ejecución

Antes de ejecutar los tests, verificar:

- [ ] Servidor de desarrollo corriendo (`yarn dev`)
- [ ] Base de datos migrada (`yarn prisma migrate dev`)
- [ ] Datos de prueba seeded (`yarn prisma db seed`)
- [ ] Usuario admin existe en DB
- [ ] Puerto 3000 disponible
- [ ] Playwright instalado (`yarn install`)

---

**Última actualización:** 18 de diciembre de 2024  
**Tests creados:** Semana 2, Tarea 2.3  
**Mantenedor:** Equipo de QA INMOVA
