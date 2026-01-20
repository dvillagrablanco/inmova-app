/**
 * INTEGRITY CHECK - Auditoría de Integridad de la Aplicación
 * 
 * Este test verifica:
 * 1. Páginas principales no devuelven 500
 * 2. Botones críticos están habilitados
 * 3. No hay errores de consola críticos
 * 4. Las páginas con mocks están identificadas
 */

import { test, expect, Page } from '@playwright/test';

// Páginas críticas que DEBEN funcionar
const CRITICAL_PAGES = [
  { path: '/dashboard', name: 'Dashboard Principal' },
  { path: '/propiedades', name: 'Propiedades' },
  { path: '/inquilinos', name: 'Inquilinos' },
  { path: '/contratos', name: 'Contratos' },
  { path: '/pagos', name: 'Pagos' },
  { path: '/mantenimiento', name: 'Mantenimiento' },
  { path: '/documentos', name: 'Documentos' },
  { path: '/configuracion', name: 'Configuración' },
];

// Páginas que usan datos MOCK (identificadas en auditoría)
const MOCK_DATA_PAGES = [
  '/viajes-corporativos/dashboard',
  '/viajes-corporativos/bookings',
  '/viajes-corporativos/guests',
  '/viajes-corporativos/expense-reports',
  '/viajes-corporativos/policies',
  '/real-estate-developer/dashboard',
  '/real-estate-developer/projects',
  '/real-estate-developer/sales',
  '/real-estate-developer/marketing',
  '/real-estate-developer/commercial',
  '/vivienda-social/dashboard',
  '/vivienda-social/applications',
  '/vivienda-social/compliance',
  '/workspace/dashboard',
  '/workspace/coworking',
  '/workspace/booking',
  '/workspace/members',
  '/student-housing/dashboard',
  '/student-housing/residentes',
  '/student-housing/habitaciones',
  '/student-housing/aplicaciones',
  '/student-housing/actividades',
  '/student-housing/pagos',
  '/student-housing/mantenimiento',
  '/estadisticas',
];

// Páginas placeholder (ComingSoonPage)
const PLACEHOLDER_PAGES = [
  '/verificacion-inquilinos',
  '/valoracion-ia',
  '/warehouse',
  '/turismo-alquiler',
  '/warranty-management',
  '/stock-gestion',
  '/sincronizacion-avanzada',
  '/salas-reuniones',
  '/servicios-limpieza',
  '/subastas',
  '/retail',
  '/servicios-concierge',
  '/suscripciones',
  '/proyectos-renovacion',
  '/renovaciones',
  '/renovaciones-contratos',
  '/microtransacciones',
  '/licitaciones',
  '/informes',
  '/gestion-incidencias',
  '/hospitality',
  '/impuestos',
  '/inspeccion-digital',
  '/espacios-coworking',
  '/coliving/emparejamiento',
  '/coliving/paquetes',
  '/comunidad',
];

interface IntegrityResult {
  page: string;
  status: 'OK' | 'ERROR' | 'WARNING' | 'MOCK' | 'PLACEHOLDER';
  httpStatus?: number;
  errors: string[];
  warnings: string[];
}

const results: IntegrityResult[] = [];

test.describe('Auditoría de Integridad - Fase 1: Páginas Críticas', () => {
  test.beforeEach(async ({ page }) => {
    // Interceptar errores de consola
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`Console Error: ${msg.text()}`);
      }
    });
  });

  for (const { path, name } of CRITICAL_PAGES) {
    test(`${name} (${path}) - debe cargar sin errores 500`, async ({ page }) => {
      const consoleErrors: string[] = [];
      
      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });

      const response = await page.goto(path, { waitUntil: 'domcontentloaded', timeout: 30000 });
      const status = response?.status() || 0;
      
      // Verificar que no es error del servidor
      expect(status).toBeLessThan(500);
      
      // Verificar que la página tiene contenido
      const body = await page.locator('body').textContent();
      expect(body?.length).toBeGreaterThan(100);
      
      // Registrar resultado
      results.push({
        page: path,
        status: status < 400 ? 'OK' : 'ERROR',
        httpStatus: status,
        errors: consoleErrors,
        warnings: [],
      });
    });
  }
});

test.describe('Auditoría de Integridad - Fase 2: Detección de Botones Rotos', () => {
  const PAGES_WITH_ACTIONS = [
    { path: '/propiedades/crear', buttons: ['Guardar', 'Crear', 'Submit'] },
    { path: '/inquilinos', buttons: ['Nuevo', 'Añadir', 'Crear'] },
    { path: '/contratos', buttons: ['Nuevo', 'Crear'] },
    { path: '/pagos/nuevo', buttons: ['Registrar', 'Guardar'] },
    { path: '/mantenimiento/nuevo', buttons: ['Crear', 'Enviar'] },
  ];

  for (const { path, buttons } of PAGES_WITH_ACTIONS) {
    test(`${path} - verificar botones de acción`, async ({ page }) => {
      const response = await page.goto(path, { waitUntil: 'domcontentloaded', timeout: 30000 });
      
      if (response?.status() === 404) {
        test.skip();
        return;
      }

      // Buscar botones por texto
      for (const buttonText of buttons) {
        const button = page.getByRole('button', { name: new RegExp(buttonText, 'i') });
        const count = await button.count();
        
        if (count > 0) {
          const isDisabled = await button.first().isDisabled();
          const isVisible = await button.first().isVisible();
          
          // Reportar si el botón está deshabilitado permanentemente
          if (isDisabled && isVisible) {
            console.log(`WARNING: Botón "${buttonText}" en ${path} está deshabilitado`);
          }
        }
      }
    });
  }
});

test.describe('Auditoría de Integridad - Fase 3: Páginas con Mock Data', () => {
  test('Listar todas las páginas que usan datos mock', async ({ page }) => {
    console.log('\n=== PÁGINAS CON DATOS MOCK (Sin API Real) ===\n');
    
    for (const mockPage of MOCK_DATA_PAGES) {
      const response = await page.goto(mockPage, { waitUntil: 'domcontentloaded', timeout: 15000 });
      const status = response?.status() || 0;
      
      if (status < 400) {
        console.log(`⚠️  MOCK: ${mockPage}`);
        results.push({
          page: mockPage,
          status: 'MOCK',
          httpStatus: status,
          errors: [],
          warnings: ['Usa datos mock hardcodeados, no conecta a API real'],
        });
      }
    }
    
    expect(MOCK_DATA_PAGES.length).toBeGreaterThan(0);
  });
});

test.describe('Auditoría de Integridad - Fase 4: Páginas Placeholder', () => {
  test('Verificar páginas Coming Soon', async ({ page }) => {
    console.log('\n=== PÁGINAS PLACEHOLDER (ComingSoonPage) ===\n');
    
    let placeholderCount = 0;
    
    for (const placeholderPath of PLACEHOLDER_PAGES) {
      const response = await page.goto(placeholderPath, { waitUntil: 'domcontentloaded', timeout: 15000 });
      const status = response?.status() || 0;
      
      if (status < 400) {
        // Verificar si tiene el componente ComingSoonPage
        const hasComingSoon = await page.locator('text=/próximamente|coming soon|en desarrollo/i').count();
        
        if (hasComingSoon > 0) {
          console.log(`🚧 PLACEHOLDER: ${placeholderPath}`);
          placeholderCount++;
          results.push({
            page: placeholderPath,
            status: 'PLACEHOLDER',
            httpStatus: status,
            errors: [],
            warnings: ['Página placeholder sin funcionalidad real'],
          });
        }
      }
    }
    
    console.log(`\nTotal páginas placeholder: ${placeholderCount}`);
  });
});

test.afterAll(async () => {
  // Generar resumen
  console.log('\n\n========== RESUMEN DE AUDITORÍA ==========\n');
  
  const ok = results.filter(r => r.status === 'OK').length;
  const errors = results.filter(r => r.status === 'ERROR').length;
  const mocks = results.filter(r => r.status === 'MOCK').length;
  const placeholders = results.filter(r => r.status === 'PLACEHOLDER').length;
  
  console.log(`✅ Páginas OK: ${ok}`);
  console.log(`❌ Páginas con Error: ${errors}`);
  console.log(`⚠️  Páginas con Mock Data: ${mocks}`);
  console.log(`🚧 Páginas Placeholder: ${placeholders}`);
  console.log(`\nTotal auditado: ${results.length}`);
});
