import { test, expect } from '@playwright/test';

interface RequestError {
  url: string;
  status: number;
  method: string;
  page: string;
}

const requestErrors: RequestError[] = [];

const pagesToCheck = [
  { path: '/dashboard', name: 'Dashboard' },
  { path: '/edificios', name: 'Edificios' },
  { path: '/inquilinos', name: 'Inquilinos' },
  { path: '/contratos', name: 'Contratos' },
  { path: '/pagos', name: 'Pagos' },
];

test.describe('Detección Detallada de Errores de API', () => {
  for (const pageInfo of pagesToCheck) {
    test(`${pageInfo.name} - Capturar errores de API`, async ({ page }) => {
      console.log(`\n🔍 Analizando: ${pageInfo.name}`);

      // Capturar todas las respuestas de red
      page.on('response', async (response) => {
        const status = response.status();
        const url = response.url();

        // Capturar errores 4xx y 5xx
        if (status >= 400) {
          const error: RequestError = {
            url,
            status,
            method: response.request().method(),
            page: pageInfo.name,
          };

          requestErrors.push(error);

          console.log(`  ❌ ${status} ${response.request().method()} ${url}`);

          // Intentar capturar el body del error
          try {
            const text = await response.text();
            if (text && text.length < 500) {
              console.log(`     Body: ${text}`);
            }
          } catch (e) {
            // Ignorar si no se puede leer el body
          }
        }
      });

      try {
        await page.goto(pageInfo.path, {
          waitUntil: 'networkidle',
          timeout: 15000,
        });

        // Esperar a que se completen las peticiones
        await page.waitForTimeout(3000);

        console.log(`  ✅ Página cargada correctamente`);
      } catch (error) {
        console.log(`  ⚠️  Error al cargar: ${error}`);
      }
    });
  }

  test.afterAll(async () => {
    console.log('\n' + '='.repeat(100));
    console.log('📊 REPORTE DE ERRORES DE API');
    console.log('='.repeat(100));
    console.log(`\nTotal de errores capturados: ${requestErrors.length}\n`);

    // Agrupar por código de estado
    const byStatus = new Map<number, RequestError[]>();
    requestErrors.forEach((err) => {
      const existing = byStatus.get(err.status) || [];
      existing.push(err);
      byStatus.set(err.status, existing);
    });

    console.log('📋 Errores por código de estado:');
    Array.from(byStatus.entries())
      .sort((a, b) => b[1].length - a[1].length)
      .forEach(([status, errors]) => {
        console.log(`\n${status}: ${errors.length} errores`);

        // Mostrar URLs únicas
        const uniqueUrls = new Set(errors.map((e) => e.url));
        uniqueUrls.forEach((url) => {
          const count = errors.filter((e) => e.url === url).length;
          console.log(`  ${count}x ${url.replace('http://localhost:3000', '')}`);
        });
      });

    console.log('\n' + '='.repeat(100));
  });
});
