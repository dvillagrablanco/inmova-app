import { chromium, Browser, Page } from '@playwright/test';
import fs from 'fs';
import path from 'path';

interface PageError {
  url: string;
  pageName: string;
  consoleErrors: Array<{
    type: string;
    text: string;
    location?: string;
  }>;
  networkErrors: Array<{
    url: string;
    status: number;
    statusText: string;
  }>;
  timestamp: string;
}

const ADMIN_PAGES = [
  { path: '/admin/dashboard', name: 'Dashboard' },
  { path: '/admin/usuarios', name: 'Usuarios' },
  { path: '/admin/clientes', name: 'Clientes' },
  { path: '/admin/clientes/comparar', name: 'Comparar Clientes' },
  { path: '/admin/activity', name: 'Activity' },
  { path: '/admin/alertas', name: 'Alertas' },
  { path: '/admin/aprobaciones', name: 'Aprobaciones' },
  { path: '/admin/backup-restore', name: 'Backup & Restore' },
  { path: '/admin/configuracion', name: 'Configuración' },
  { path: '/admin/facturacion-b2b', name: 'Facturación B2B' },
  { path: '/admin/firma-digital', name: 'Firma Digital' },
  { path: '/admin/importar', name: 'Importar' },
  { path: '/admin/integraciones-contables', name: 'Integraciones Contables' },
  { path: '/admin/legal', name: 'Legal' },
  { path: '/admin/marketplace', name: 'Marketplace' },
  { path: '/admin/metricas-uso', name: 'Métricas de Uso' },
  { path: '/admin/modulos', name: 'Módulos' },
  { path: '/admin/ocr-import', name: 'OCR Import' },
  { path: '/admin/personalizacion', name: 'Personalización' },
  { path: '/admin/planes', name: 'Planes' },
  { path: '/admin/plantillas-sms', name: 'Plantillas SMS' },
  { path: '/admin/portales-externos', name: 'Portales Externos' },
  { path: '/admin/recuperar-contrasena', name: 'Recuperar Contraseña' },
  { path: '/admin/reportes-programados', name: 'Reportes Programados' },
  { path: '/admin/salud-sistema', name: 'Salud del Sistema' },
  { path: '/admin/seguridad', name: 'Seguridad' },
  { path: '/admin/sugerencias', name: 'Sugerencias' },
];

async function loginAsSuperAdmin(page: Page, baseUrl: string): Promise<boolean> {
  try {
    console.log('🔐 Intentando login como superadmin...');

    await page.goto(`${baseUrl}/login`, { waitUntil: 'networkidle', timeout: 30000 });

    // Esperar al formulario de login
    await page.waitForSelector('input[type="email"], input[name="email"], input#email', {
      timeout: 10000,
    });

    // Credenciales de superadmin
    const email = process.env.SUPER_ADMIN_EMAIL;
    const password = process.env.SUPER_ADMIN_PASSWORD;

    if (!email || !password) {
      console.log('⚠️  Credenciales no proporcionadas. Usa:');
      console.log('   SUPER_ADMIN_EMAIL=tu@email.com SUPER_ADMIN_PASSWORD=tupassword');
      console.log('⚠️  Continuando sin login - solo se detectarán errores en páginas públicas\n');
      return false;
    }

    // Intentar diferentes selectores para el email
    const emailInput =
      (await page.$('input[type="email"]')) ||
      (await page.$('input[name="email"]')) ||
      (await page.$('input#email'));

    if (emailInput) {
      await emailInput.fill(email);
    }

    // Intentar diferentes selectores para password
    const passwordInput =
      (await page.$('input[type="password"]')) ||
      (await page.$('input[name="password"]')) ||
      (await page.$('input#password'));

    if (passwordInput) {
      await passwordInput.fill(password);
    }

    // Click en login - intentar diferentes selectores
    const submitButton =
      (await page.$('button[type="submit"]')) ||
      (await page.$('button:has-text("Iniciar")')) ||
      (await page.$('button:has-text("Login")'));

    if (submitButton) {
      await submitButton.click();
    }

    // Esperar redirección o error
    await page.waitForTimeout(5000);

    // Verificar que no estamos en /login
    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      console.log('❌ Login falló - credenciales incorrectas o formulario cambió');
      console.log('⚠️  Continuando sin login - solo se detectarán errores visibles\n');
      return false;
    }

    console.log('✅ Login exitoso\n');
    return true;
  } catch (error: any) {
    console.error('❌ Error en login:', error.message);
    console.log('⚠️  Continuando sin login\n');
    return false;
  }
}

async function auditPage(
  page: Page,
  baseUrl: string,
  pagePath: string,
  pageName: string
): Promise<PageError> {
  const consoleErrors: PageError['consoleErrors'] = [];
  const networkErrors: PageError['networkErrors'] = [];

  // Capturar errores de consola
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push({
        type: msg.type(),
        text: msg.text(),
        location: msg.location()?.url || undefined,
      });
    }
  });

  // Capturar errores de página (excepciones no capturadas)
  page.on('pageerror', (error) => {
    consoleErrors.push({
      type: 'exception',
      text: error.message,
      location: error.stack,
    });
  });

  // Capturar errores de red
  page.on('response', (response) => {
    if (response.status() >= 400) {
      networkErrors.push({
        url: response.url(),
        status: response.status(),
        statusText: response.statusText(),
      });
    }
  });

  const fullUrl = `${baseUrl}${pagePath}`;
  console.log(`\n📄 Auditando: ${pageName} (${pagePath})`);

  try {
    await page.goto(fullUrl, {
      waitUntil: 'domcontentloaded', // Cambiar a domcontentloaded en lugar de networkidle
      timeout: 30000,
    });

    // Esperar que la página cargue completamente
    await page.waitForTimeout(3000);

    // Tomar screenshot si hay errores
    if (consoleErrors.length > 0 || networkErrors.length > 0) {
      const screenshotDir = path.join(process.cwd(), 'audit-screenshots');
      if (!fs.existsSync(screenshotDir)) {
        fs.mkdirSync(screenshotDir, { recursive: true });
      }

      const screenshotPath = path.join(
        screenshotDir,
        `${pageName.replace(/\s+/g, '-').toLowerCase()}.png`
      );
      await page.screenshot({ path: screenshotPath, fullPage: true });
      console.log(`  📸 Screenshot guardado: ${screenshotPath}`);
    }

    // Reportar errores
    if (consoleErrors.length > 0) {
      console.log(`  ❌ Errores de consola: ${consoleErrors.length}`);
      consoleErrors.forEach((err, i) => {
        console.log(`     ${i + 1}. [${err.type}] ${err.text.substring(0, 100)}`);
      });
    }

    if (networkErrors.length > 0) {
      console.log(`  ❌ Errores de red: ${networkErrors.length}`);
      networkErrors.forEach((err, i) => {
        console.log(`     ${i + 1}. [${err.status}] ${err.url}`);
      });
    }

    if (consoleErrors.length === 0 && networkErrors.length === 0) {
      console.log(`  ✅ Sin errores detectados`);
    }
  } catch (error: any) {
    console.log(`  ❌ Error al cargar página: ${error.message}`);
    consoleErrors.push({
      type: 'page-load-error',
      text: error.message,
    });
  }

  return {
    url: fullUrl,
    pageName,
    consoleErrors,
    networkErrors,
    timestamp: new Date().toISOString(),
  };
}

async function generateReport(results: PageError[]): Promise<void> {
  const reportPath = path.join(process.cwd(), 'AUDITORIA_VISUAL_ADMIN.md');

  const pagesWithErrors = results.filter(
    (r) => r.consoleErrors.length > 0 || r.networkErrors.length > 0
  );
  const pagesWithoutErrors = results.filter(
    (r) => r.consoleErrors.length === 0 && r.networkErrors.length === 0
  );

  let report = `# 🔍 AUDITORÍA VISUAL - PÁGINAS SUPERADMINISTRADOR\n\n`;
  report += `**Fecha:** ${new Date().toLocaleString('es-ES')}\n`;
  report += `**Total páginas auditadas:** ${results.length}\n`;
  report += `**Páginas sin errores:** ${pagesWithoutErrors.length}\n`;
  report += `**Páginas con errores:** ${pagesWithErrors.length}\n\n`;
  report += `---\n\n`;

  if (pagesWithErrors.length === 0) {
    report += `## ✅ ¡TODAS LAS PÁGINAS FUNCIONAN CORRECTAMENTE!\n\n`;
    report += `No se detectaron errores de consola ni de red en ninguna página del superadmin.\n\n`;
  } else {
    report += `## ❌ PÁGINAS CON ERRORES (${pagesWithErrors.length})\n\n`;

    pagesWithErrors.forEach((page) => {
      report += `### 📄 ${page.pageName}\n\n`;
      report += `**URL:** \`${page.url}\`\n\n`;

      if (page.consoleErrors.length > 0) {
        report += `#### Errores de Consola (${page.consoleErrors.length})\n\n`;
        page.consoleErrors.forEach((err, i) => {
          report += `${i + 1}. **[${err.type}]** ${err.text}\n`;
          if (err.location) {
            report += `   - Ubicación: \`${err.location}\`\n`;
          }
          report += `\n`;
        });
      }

      if (page.networkErrors.length > 0) {
        report += `#### Errores de Red (${page.networkErrors.length})\n\n`;
        page.networkErrors.forEach((err, i) => {
          report += `${i + 1}. **[${err.status} ${err.statusText}]** ${err.url}\n`;
        });
        report += `\n`;
      }

      report += `---\n\n`;
    });
  }

  report += `## ✅ PÁGINAS SIN ERRORES (${pagesWithoutErrors.length})\n\n`;
  pagesWithoutErrors.forEach((page) => {
    report += `- ✅ ${page.pageName}\n`;
  });

  fs.writeFileSync(reportPath, report);
  console.log(`\n📄 Reporte generado: ${reportPath}`);
}

async function main() {
  console.log('🚀 Iniciando auditoría visual de páginas admin...\n');

  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
  console.log(`🌐 URL base: ${baseUrl}\n`);

  let browser: Browser | null = null;

  try {
    // Iniciar navegador
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      ignoreHTTPSErrors: true,
    });

    const page = await context.newPage();

    // Login como superadmin
    const loginSuccess = await loginAsSuperAdmin(page, baseUrl);

    if (!loginSuccess) {
      console.log('⚠️  Auditando sin autenticación - se capturarán errores de JavaScript y red');
      console.log(
        '   (Las páginas protegidas redirigirán a /login, pero aún se detectarán errores)\n'
      );
    }

    // Auditar todas las páginas
    const results: PageError[] = [];

    for (const adminPage of ADMIN_PAGES) {
      const result = await auditPage(page, baseUrl, adminPage.path, adminPage.name);
      results.push(result);

      // Pausa más larga entre páginas para evitar rate limiting
      console.log('   ⏱️  Esperando 3 segundos para evitar rate limiting...');
      await page.waitForTimeout(3000);
    }

    // Generar reporte
    await generateReport(results);

    console.log('\n✅ Auditoría completada exitosamente\n');

    // Resumen
    const totalErrors = results.reduce(
      (sum, r) => sum + r.consoleErrors.length + r.networkErrors.length,
      0
    );
    const pagesWithErrors = results.filter(
      (r) => r.consoleErrors.length > 0 || r.networkErrors.length > 0
    ).length;

    console.log('📊 RESUMEN:');
    console.log(`   - Páginas auditadas: ${results.length}`);
    console.log(`   - Páginas con errores: ${pagesWithErrors}`);
    console.log(`   - Total de errores: ${totalErrors}`);

    await browser.close();
  } catch (error) {
    console.error('\n❌ Error durante la auditoría:', error);
    if (browser) {
      await browser.close();
    }
    process.exit(1);
  }
}

main();
