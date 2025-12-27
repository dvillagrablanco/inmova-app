import { defineConfig, devices } from '@playwright/test';

/**
 * Configuración de Playwright para pruebas en inmova.app (producción)
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false, // Ejecutar secuencialmente para mejor observación
  forbidOnly: false,
  retries: 1, // 1 reintento en caso de fallo
  workers: 1, // Un worker para ejecución secuencial
  reporter: [
    ['html', { outputFolder: 'playwright-report-production' }],
    ['list'],
    ['json', { outputFile: 'test-results/results-production.json' }],
  ],
  use: {
    baseURL: 'https://inmova.app', // URL de producción
    trace: 'on-first-retry',
    screenshot: 'on', // Siempre tomar screenshots
    video: 'retain-on-failure', // Guardar video en caso de fallo
    actionTimeout: 15000,
    navigationTimeout: 30000,
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
      },
    },
  ],
  timeout: 300000, // 5 minutos por test
  expect: {
    timeout: 10000,
  },
});
