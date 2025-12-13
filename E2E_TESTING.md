# Tests E2E con Playwright - INMOVA

## Descripción

Tests End-to-End (E2E) implementados con Playwright para verificar los flujos críticos de la aplicación INMOVA.

## Flujos Cubiertos

### ✅ Autenticación (`auth.spec.ts`)
- Visualización de la página de login
- Validación de campos vacíos
- Login exitoso con credenciales válidas
- Manejo de credenciales inválidas
- Navegación a registro
- Proceso de logout

### ✅ Gestión de Edificios (`buildings.spec.ts`)
- Listado de edificios
- Creación de nuevo edificio
- Búsqueda de edificios
- Navegación a detalles de edificio

### ✅ Gestión de Inquilinos (`tenants.spec.ts`)
- Listado de inquilinos
- Creación de nuevo inquilino
- Filtrado por estado

### ✅ Gestión de Pagos (`payments.spec.ts`)
- Listado de pagos
- Filtrado por estado
- Exportación de pagos
- Visualización de detalles

### ✅ Dashboard (`dashboard.spec.ts`)
- Visualización de KPIs
- Actividad reciente
- Gráficos y estadísticas
- Navegación rápida
- Notificaciones
- Cambio de idioma

## Instalación

### 1. Instalar Playwright

```bash
yarn playwright install
```

Nota: Si encuentras problemas de permisos, ejecuta con sudo o configura los navegadores manualmente.

### 2. Variables de Entorno

Crea un archivo `.env.test` con las credenciales de prueba:

```env
PLAYWRIGHT_TEST_BASE_URL=http://localhost:3000
TEST_USER_EMAIL=admin@inmova.com
TEST_USER_PASSWORD=admin123
```

## Ejecución de Tests

### Ejecutar Todos los Tests

```bash
yarn playwright test
```

### Ejecutar Tests en Modo UI (Interfaz Interactiva)

```bash
yarn playwright test --ui
```

### Ejecutar un Archivo Específico

```bash
yarn playwright test e2e/auth.spec.ts
```

### Ejecutar en Modo Debug

```bash
yarn playwright test --debug
```

### Ejecutar en un Navegador Específico

```bash
# Chromium
yarn playwright test --project=chromium

# Firefox
yarn playwright test --project=firefox

# WebKit (Safari)
yarn playwright test --project=webkit

# Mobile Chrome
yarn playwright test --project="Mobile Chrome"
```

### Ver Reporte de Resultados

```bash
yarn playwright show-report
```

## Configuración

La configuración de Playwright se encuentra en `playwright.config.ts`:

```typescript
- testDir: './e2e' - Directorio de tests
- fullyParallel: true - Tests en paralelo
- retries: 2 (en CI) - Reintentos en caso de fallo
- reporter: ['html', 'json', 'junit'] - Múltiples formatos de reporte
- use.baseURL: 'http://localhost:3000' - URL base
- use.trace: 'on-first-retry' - Trazas en reintentos
- use.screenshot: 'only-on-failure' - Screenshots en fallos
- use.video: 'retain-on-failure' - Videos en fallos
```

## Navegadores Soportados

- ✅ Chromium (Chrome, Edge)
- ✅ Firefox
- ✅ WebKit (Safari)
- ✅ Mobile Chrome (Pixel 5)
- ✅ Mobile Safari (iPhone 12)

## Mejores Prácticas

### 1. Uso de Locators

Prioridad de selectores:
```typescript
// ✅ Recomendado - Por rol accesible
page.getByRole('button', { name: /iniciar sesión/i })

// ✅ Bueno - Por label
page.getByLabel(/email/i)

// ✅ Bueno - Por placeholder
page.getByPlaceholder(/buscar/i)

// ⚠️ Evitar - Por clase o ID
page.locator('.btn-primary')
```

### 2. Esperas Explícitas

```typescript
// ✅ Correcto
await expect(page.getByText('Bienvenido')).toBeVisible();

// ❌ Evitar
await page.waitForTimeout(5000);
```

### 3. Datos de Prueba

Usar timestamps para evitar conflictos:
```typescript
const buildingName = `Edificio Test ${Date.now()}`;
```

### 4. Login Helper

Reutilizar función de login:
```typescript
async function login(page: any) {
  await page.goto('/login');
  await page.getByLabel(/email/i).fill('admin@inmova.com');
  await page.getByLabel(/contraseña/i).fill('admin123');
  await page.getByRole('button', { name: /iniciar sesión/i }).click();
  await expect(page).toHaveURL(/\/dashboard/);
}
```

## CI/CD Integration

### GitHub Actions

```yaml
- name: Install Playwright
  run: yarn playwright install --with-deps

- name: Run E2E Tests
  run: yarn playwright test
  
- name: Upload Test Results
  uses: actions/upload-artifact@v3
  if: always()
  with:
    name: playwright-report
    path: playwright-report/
```

### GitLab CI

```yaml
e2e-tests:
  image: mcr.microsoft.com/playwright:v1.40.0
  script:
    - yarn install
    - yarn playwright test
  artifacts:
    when: always
    paths:
      - playwright-report/
      - test-results/
```

## Debugging

### Modo Trace Viewer

Si un test falla, puedes ver la traza:

```bash
yarn playwright show-trace test-results/*/trace.zip
```

### Modo Headed (con interfaz gráfica)

```bash
yarn playwright test --headed
```

### Slow Motion

```bash
yarn playwright test --slow-mo=1000
```

### Inspector

```bash
yarn playwright test --debug
```

## Estructura de Tests

```
e2e/
├── auth.spec.ts          # Tests de autenticación
├── dashboard.spec.ts     # Tests del dashboard
├── buildings.spec.ts     # Tests de edificios
├── tenants.spec.ts       # Tests de inquilinos
└── payments.spec.ts      # Tests de pagos
```

## Extender Tests

### Añadir Nuevo Test

```typescript
import { test, expect } from '@playwright/test';

test.describe('Mi Nueva Funcionalidad', () => {
  test.beforeEach(async ({ page }) => {
    // Setup
  });

  test('debería hacer algo', async ({ page }) => {
    // Arrange
    await page.goto('/mi-pagina');
    
    // Act
    await page.getByRole('button').click();
    
    // Assert
    await expect(page.getByText('Éxito')).toBeVisible();
  });
});
```

## Recursos

- [Playwright Documentation](https://playwright.dev)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [API Reference](https://playwright.dev/docs/api/class-playwright)
- [Selectors Guide](https://playwright.dev/docs/selectors)
- [Debugging Guide](https://playwright.dev/docs/debug)

## Solución de Problemas

### Error: Browser not installed

```bash
yarn playwright install chromium
```

### Error: Port 3000 already in use

```bash
# Detener el servidor de desarrollo
lsof -ti:3000 | xargs kill -9
```

### Tests muy lentos

- Reducir el número de navegadores en `playwright.config.ts`
- Usar `fullyParallel: true`
- Optimizar selectores

### Screenshots/Videos no se guardan

Verificar en `playwright.config.ts`:
```typescript
use: {
  screenshot: 'only-on-failure',
  video: 'retain-on-failure',
}
```

## Métricas

Los tests E2E actuales cubren:
- ✅ 6 archivos de test
- ✅ 25+ casos de prueba
- ✅ 5 flujos principales de usuario
- ✅ 5 navegadores/dispositivos
- ⏱️ Tiempo estimado: 5-10 minutos

