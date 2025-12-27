import { defineConfig, devices } from '@playwright/test';

/**
 * Configuración de Playwright para testing en PRODUCCIÓN (inmova.app)
 * Uso: npx playwright test --config=playwright.config.production.ts
 */
export default defineConfig({
  testDir: './e2e',
  
  // Timeout más largo para producción
  timeout: 60000,
  
  // Ejecutar tests en paralelo
  fullyParallel: false, // Desactivado para verificación completa
  
  // No fallar en CI
  forbidOnly: !!process.env.CI,
  
  // Reintentos en caso de fallo
  retries: 2,
  
  // Workers
  workers: 1, // Un worker para verificación secuencial
  
  // Reporter
  reporter: [
    ['html', { outputFolder: 'playwright-report-production' }],
    ['list'],
    ['json', { outputFile: 'test-results/production-results.json' }],
  ],
  
  // Configuración global
  use: {
    // URL base de producción
    baseURL: 'https://inmova.app',
    
    // Trace on first retry
    trace: 'on-first-retry',
    
    // Screenshots
    screenshot: 'only-on-failure',
    
    // Video
    video: 'retain-on-failure',
    
    // Timeout de navegación
    navigationTimeout: 30000,
    
    // Timeout de acciones
    actionTimeout: 15000,
    
    // Configuración de viewport
    viewport: { width: 1920, height: 1080 },
    
    // User agent
    userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    
    // Ignorar errores de certificado HTTPS (solo si es necesario)
    ignoreHTTPSErrors: false,
    
    // Configuración de red
    bypassCSP: false,
    
    // Locale
    locale: 'es-ES',
    timezoneId: 'Europe/Madrid',
  },
  
  // Proyectos de testing
  projects: [
    {
      name: 'chromium-desktop',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
      },
    },
    {
      name: 'chromium-mobile',
      use: { 
        ...devices['Pixel 5'],
      },
    },
    {
      name: 'firefox-desktop',
      use: { 
        ...devices['Desktop Firefox'],
        viewport: { width: 1920, height: 1080 },
      },
    },
  ],
  
  // NO iniciar servidor web local (estamos testeando producción)
  // webServer: undefined,
});
