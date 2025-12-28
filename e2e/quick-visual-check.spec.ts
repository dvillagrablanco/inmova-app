import { test, expect, Page } from '@playwright/test';

// Páginas que se pueden revisar sin autenticación o con autenticación parcial
const publicPages = [
  { path: '/', name: 'Landing' },
  { path: '/landing', name: 'Landing Page' },
  { path: '/login', name: 'Login' },
  { path: '/register', name: 'Register' },
];

// Páginas protegidas - revisaremos errores de compilación/hydration
const protectedPages = [
  { path: '/dashboard', name: 'Dashboard' },
  { path: '/home', name: 'Home' },
  { path: '/edificios', name: 'Edificios' },
  { path: '/inquilinos', name: 'Inquilinos' },
  { path: '/contratos', name: 'Contratos' },
  { path: '/pagos', name: 'Pagos' },
  { path: '/mantenimiento', name: 'Mantenimiento' },
  { path: '/documentos', name: 'Documentos' },
  { path: '/reportes', name: 'Reportes' },
  { path: '/automatizacion', name: 'Automatización' },
  { path: '/recordatorios', name: 'Recordatorios' },
  { path: '/chat', name: 'Chat' },
  { path: '/reuniones', name: 'Reuniones' },
  { path: '/portal-comercial', name: 'Portal Comercial' },
  { path: '/partners', name: 'Partners' },
  { path: '/professional', name: 'Professional' },
  { path: '/proveedores', name: 'Proveedores' },
  { path: '/operador/dashboard', name: 'Dashboard Operador' },
  { path: '/flipping/dashboard', name: 'Flipping Dashboard' },
  { path: '/admin-fincas', name: 'Admin Fincas' },
  { path: '/traditional-rental', name: 'Traditional Rental' },
  { path: '/coliving', name: 'Coliving' },
  { path: '/construction/projects', name: 'Proyectos Construcción' },
  { path: '/cupones', name: 'Cupones' },
  { path: '/certificaciones', name: 'Certificaciones' },
  { path: '/plantillas', name: 'Plantillas' },
  { path: '/reviews', name: 'Reviews' },
  { path: '/perfil', name: 'Perfil' },
];

interface PageIssue {
  page: string;
  path: string;
  status: 'ok' | 'warning' | 'error';
  httpStatus?: number;
  consoleErrors: string[];
  pageErrors: string[];
  warnings: string[];
}

const allIssues: PageIssue[] = [];

test.describe('Revisión Rápida de Errores en Todas las Páginas', () => {
  test.describe('Páginas Públicas', () => {
    for (const pageInfo of publicPages) {
      test(`${pageInfo.name} (${pageInfo.path})`, async ({ page }) => {
        const issue = await checkPage(page, pageInfo.name, pageInfo.path);
        allIssues.push(issue);

        // No fallar el test, solo reportar
        console.log(getPageReport(issue));
      });
    }
  });

  test.describe('Páginas Protegidas - Revisión de Errores de Compilación', () => {
    for (const pageInfo of protectedPages) {
      test(`${pageInfo.name} (${pageInfo.path})`, async ({ page }) => {
        const issue = await checkPage(page, pageInfo.name, pageInfo.path);
        allIssues.push(issue);

        // No fallar el test, solo reportar
        console.log(getPageReport(issue));
      });
    }
  });

  test.afterAll(async () => {
    console.log('\n\n' + '='.repeat(100));
    console.log('📊 REPORTE FINAL DE REVISIÓN DE PÁGINAS');
    console.log('='.repeat(100));

    const okCount = allIssues.filter((i) => i.status === 'ok').length;
    const warningCount = allIssues.filter((i) => i.status === 'warning').length;
    const errorCount = allIssues.filter((i) => i.status === 'error').length;

    console.log(`\n📈 Resumen:`);
    console.log(`  ✅ Sin problemas: ${okCount}`);
    console.log(`  ⚠️  Con advertencias: ${warningCount}`);
    console.log(`  ❌ Con errores: ${errorCount}`);
    console.log(`  📄 Total revisado: ${allIssues.length}`);

    if (errorCount > 0) {
      console.log('\n\n🔴 PÁGINAS CON ERRORES CRÍTICOS:');
      console.log('='.repeat(100));
      allIssues
        .filter((i) => i.status === 'error')
        .forEach((issue) => {
          console.log(`\n❌ ${issue.page} (${issue.path})`);
          if (issue.httpStatus) {
            console.log(`   HTTP Status: ${issue.httpStatus}`);
          }
          if (issue.consoleErrors.length > 0) {
            console.log(`   Console Errors (${issue.consoleErrors.length}):`);
            issue.consoleErrors.slice(0, 5).forEach((err) => {
              console.log(`      - ${err.substring(0, 150)}`);
            });
          }
          if (issue.pageErrors.length > 0) {
            console.log(`   Page Errors (${issue.pageErrors.length}):`);
            issue.pageErrors.slice(0, 3).forEach((err) => {
              console.log(`      - ${err.substring(0, 150)}`);
            });
          }
        });
    }

    if (warningCount > 0) {
      console.log('\n\n⚠️  PÁGINAS CON ADVERTENCIAS:');
      console.log('='.repeat(100));
      allIssues
        .filter((i) => i.status === 'warning')
        .forEach((issue) => {
          console.log(`\n⚠️  ${issue.page} (${issue.path})`);
          if (issue.warnings.length > 0) {
            console.log(`   Warnings:`);
            issue.warnings.forEach((w) => console.log(`      - ${w}`));
          }
          if (issue.consoleErrors.length > 0) {
            console.log(`   Console Messages: ${issue.consoleErrors.length} error(s)`);
          }
        });
    }

    console.log('\n' + '='.repeat(100));
    console.log('\n📋 ERRORES MÁS COMUNES:');
    const errorMessages = allIssues
      .flatMap((i) => [...i.consoleErrors, ...i.pageErrors])
      .filter((e) => e && e.length > 0);

    const errorCounts: Record<string, number> = {};
    errorMessages.forEach((err) => {
      const key = err.substring(0, 100);
      errorCounts[key] = (errorCounts[key] || 0) + 1;
    });

    Object.entries(errorCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .forEach(([err, count]) => {
        console.log(`   ${count}x: ${err}`);
      });

    console.log('\n' + '='.repeat(100));
  });
});

async function checkPage(page: Page, name: string, path: string): Promise<PageIssue> {
  const issue: PageIssue = {
    page: name,
    path,
    status: 'ok',
    consoleErrors: [],
    pageErrors: [],
    warnings: [],
  };

  // Capturar errores de consola
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      issue.consoleErrors.push(msg.text());
    }
  });

  page.on('pageerror', (error) => {
    issue.pageErrors.push(error.message);
  });

  try {
    // Navegar a la página
    const response = await page.goto(path, {
      waitUntil: 'domcontentloaded',
      timeout: 15000,
    });

    if (response) {
      issue.httpStatus = response.status();

      if (response.status() >= 500) {
        issue.status = 'error';
        issue.warnings.push(`HTTP ${response.status()}: Error del servidor`);
      } else if (response.status() >= 400) {
        // 401/403 es esperado en páginas protegidas
        if (response.status() === 401 || response.status() === 403) {
          issue.warnings.push(`HTTP ${response.status()}: Requiere autenticación (esperado)`);
        } else {
          issue.status = 'warning';
          issue.warnings.push(`HTTP ${response.status()}: ${response.statusText()}`);
        }
      }
    }

    // Esperar un poco para capturar errores de hydration/render
    await page.waitForTimeout(2000);

    // Determinar estado final
    if (issue.pageErrors.length > 0) {
      issue.status = 'error';
    } else if (issue.consoleErrors.length > 3) {
      issue.status = 'warning';
    }
  } catch (error) {
    issue.status = 'error';
    issue.pageErrors.push(`Navigation error: ${error}`);
  }

  return issue;
}

function getPageReport(issue: PageIssue): string {
  if (issue.status === 'ok') {
    return `✅ ${issue.page} - OK`;
  } else if (issue.status === 'warning') {
    return `⚠️  ${issue.page} - ${issue.warnings.length} warning(s), ${issue.consoleErrors.length} console error(s)`;
  } else {
    return `❌ ${issue.page} - ${issue.pageErrors.length} page error(s), ${issue.consoleErrors.length} console error(s)`;
  }
}
