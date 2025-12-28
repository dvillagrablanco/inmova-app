import { test, expect, Page } from '@playwright/test';
import { writeFileSync, appendFileSync, existsSync, mkdirSync } from 'fs';
import path from 'path';

// Configuración
const BASE_URL = 'http://localhost:3000';
const REPORT_DIR = './visual-check-reports';
const REPORT_FILE = path.join(REPORT_DIR, `visual-check-${new Date().toISOString().replace(/:/g, '-')}.md`);
const SCREENSHOTS_DIR = path.join(REPORT_DIR, 'screenshots');

// Credenciales de admin
const ADMIN_EMAIL = 'admin@inmova.com';
const ADMIN_PASSWORD = 'Admin123!';

// Listado de páginas a revisar
const PAGINAS_PUBLICAS = [
  { url: '/', nombre: 'Landing Page (Home)' },
  { url: '/landing', nombre: 'Landing Page' },
  { url: '/login', nombre: 'Página de Login' },
  { url: '/register', nombre: 'Página de Registro' },
];

const PAGINAS_PRIVADAS = [
  { url: '/dashboard', nombre: 'Dashboard Principal' },
  { url: '/edificios', nombre: 'Listado de Edificios' },
  { url: '/unidades', nombre: 'Listado de Unidades' },
  { url: '/inquilinos', nombre: 'Listado de Inquilinos' },
  { url: '/contratos', nombre: 'Listado de Contratos' },
  { url: '/pagos', nombre: 'Listado de Pagos' },
  { url: '/mantenimiento', nombre: 'Mantenimiento' },
  { url: '/reportes', nombre: 'Reportes' },
  { url: '/analytics', nombre: 'Analytics' },
  { url: '/tareas', nombre: 'Tareas' },
  { url: '/proveedores', nombre: 'Proveedores' },
  { url: '/documentos', nombre: 'Documentos' },
  { url: '/configuracion', nombre: 'Configuración' },
  { url: '/usuarios', nombre: 'Usuarios' },
  { url: '/empresa', nombre: 'Configuración de Empresa' },
  { url: '/perfil', nombre: 'Perfil de Usuario' },
  
  // Páginas de CRM
  { url: '/crm', nombre: 'CRM Dashboard' },
  { url: '/crm/leads', nombre: 'CRM - Leads' },
  { url: '/crm/clientes', nombre: 'CRM - Clientes' },
  
  // Portales
  { url: '/portal-inquilino', nombre: 'Portal del Inquilino' },
  { url: '/portal-propietario', nombre: 'Portal del Propietario' },
  { url: '/portal-proveedor', nombre: 'Portal del Proveedor' },
  
  // Partners
  { url: '/partners', nombre: 'Portal de Partners' },
  
  // Admin
  { url: '/admin', nombre: 'Super Admin Panel' },
  { url: '/admin/empresas', nombre: 'Admin - Gestión de Empresas' },
  { url: '/admin/usuarios', nombre: 'Admin - Gestión de Usuarios' },
];

interface ErrorEncontrado {
  pagina: string;
  url: string;
  tipo: 'error_consola' | 'error_visual' | 'error_carga' | 'elemento_faltante' | 'otro';
  descripcion: string;
  severidad: 'critico' | 'alto' | 'medio' | 'bajo';
  timestamp: string;
}

let erroresEncontrados: ErrorEncontrado[] = [];

// Setup inicial
test.beforeAll(async () => {
  // Crear directorios si no existen
  if (!existsSync(REPORT_DIR)) {
    mkdirSync(REPORT_DIR, { recursive: true });
  }
  if (!existsSync(SCREENSHOTS_DIR)) {
    mkdirSync(SCREENSHOTS_DIR, { recursive: true });
  }

  // Iniciar reporte
  const header = `# Reporte de Revisión Visual de Páginas
## Fecha: ${new Date().toLocaleString('es-ES')}
## Base URL: ${BASE_URL}

---

`;
  writeFileSync(REPORT_FILE, header);
});

// Helper para hacer login
async function login(page: Page) {
  await page.goto(`${BASE_URL}/login`);
  await page.waitForLoadState('networkidle');
  
  await page.fill('input[name="email"], input[type="email"]', ADMIN_EMAIL);
  await page.fill('input[name="password"], input[type="password"]', ADMIN_PASSWORD);
  await page.click('button[type="submit"]');
  
  // Esperar a que cargue el dashboard
  await page.waitForURL(/.*\/dashboard.*/, { timeout: 10000 }).catch(() => {});
  await page.waitForLoadState('networkidle');
}

// Helper para capturar errores de consola
function setupConsoleListener(page: Page, nombrePagina: string) {
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      erroresEncontrados.push({
        pagina: nombrePagina,
        url: page.url(),
        tipo: 'error_consola',
        descripcion: `Error en consola: ${msg.text()}`,
        severidad: 'alto',
        timestamp: new Date().toISOString(),
      });
    }
  });

  page.on('pageerror', (error) => {
    erroresEncontrados.push({
      pagina: nombrePagina,
      url: page.url(),
      tipo: 'error_consola',
      descripcion: `Error de página: ${error.message}`,
      severidad: 'critico',
      timestamp: new Date().toISOString(),
    });
  });
}

// Helper para verificar página
async function verificarPagina(page: Page, url: string, nombre: string) {
  const screenshotPath = path.join(SCREENSHOTS_DIR, `${nombre.replace(/[^a-zA-Z0-9]/g, '-')}.png`);
  
  try {
    setupConsoleListener(page, nombre);
    
    await page.goto(`${BASE_URL}${url}`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000); // Dar tiempo para animaciones
    
    // Verificar si la página cargó correctamente
    const title = await page.title();
    const hasContent = await page.locator('body').isVisible();
    
    if (!hasContent) {
      erroresEncontrados.push({
        pagina: nombre,
        url: page.url(),
        tipo: 'error_carga',
        descripcion: 'La página no tiene contenido visible',
        severidad: 'critico',
        timestamp: new Date().toISOString(),
      });
    }
    
    // Verificar errores visuales comunes
    const has404 = await page.getByText(/404|not found|página no encontrada/i).count() > 0;
    const hasError500 = await page.getByText(/500|server error|error del servidor/i).count() > 0;
    const hasUnauthorized = await page.getByText(/unauthorized|no autorizado|acceso denegado/i).count() > 0;
    
    if (has404) {
      erroresEncontrados.push({
        pagina: nombre,
        url: page.url(),
        tipo: 'error_visual',
        descripcion: 'Página muestra error 404',
        severidad: 'critico',
        timestamp: new Date().toISOString(),
      });
    }
    
    if (hasError500) {
      erroresEncontrados.push({
        pagina: nombre,
        url: page.url(),
        tipo: 'error_visual',
        descripcion: 'Página muestra error 500',
        severidad: 'critico',
        timestamp: new Date().toISOString(),
      });
    }
    
    if (hasUnauthorized) {
      erroresEncontrados.push({
        pagina: nombre,
        url: page.url(),
        tipo: 'error_visual',
        descripcion: 'Acceso no autorizado',
        severidad: 'alto',
        timestamp: new Date().toISOString(),
      });
    }
    
    // Tomar screenshot
    await page.screenshot({ path: screenshotPath, fullPage: true });
    
    // Escribir en reporte
    const status = erroresEncontrados.filter(e => e.pagina === nombre).length > 0 ? '❌' : '✅';
    appendFileSync(REPORT_FILE, `\n## ${status} ${nombre}\n`);
    appendFileSync(REPORT_FILE, `- **URL**: \`${url}\`\n`);
    appendFileSync(REPORT_FILE, `- **Título**: ${title}\n`);
    appendFileSync(REPORT_FILE, `- **Screenshot**: [Ver captura](./screenshots/${path.basename(screenshotPath)})\n`);
    
    const erroresPagina = erroresEncontrados.filter(e => e.pagina === nombre);
    if (erroresPagina.length > 0) {
      appendFileSync(REPORT_FILE, `- **Errores encontrados**: ${erroresPagina.length}\n\n`);
      erroresPagina.forEach(error => {
        appendFileSync(REPORT_FILE, `  - [${error.severidad.toUpperCase()}] ${error.tipo}: ${error.descripcion}\n`);
      });
    }
    appendFileSync(REPORT_FILE, `\n---\n`);
    
  } catch (error: any) {
    erroresEncontrados.push({
      pagina: nombre,
      url,
      tipo: 'error_carga',
      descripcion: `Error al cargar página: ${error.message}`,
      severidad: 'critico',
      timestamp: new Date().toISOString(),
    });
    
    appendFileSync(REPORT_FILE, `\n## ❌ ${nombre}\n`);
    appendFileSync(REPORT_FILE, `- **URL**: \`${url}\`\n`);
    appendFileSync(REPORT_FILE, `- **Error**: ${error.message}\n\n---\n`);
  }
}

// Test de páginas públicas
test.describe('Páginas Públicas', () => {
  for (const pagina of PAGINAS_PUBLICAS) {
    test(`Verificar ${pagina.nombre}`, async ({ page }) => {
      await verificarPagina(page, pagina.url, pagina.nombre);
    });
  }
});

// Test de páginas privadas (requieren login)
test.describe('Páginas Privadas', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  for (const pagina of PAGINAS_PRIVADAS) {
    test(`Verificar ${pagina.nombre}`, async ({ page }) => {
      await verificarPagina(page, pagina.url, pagina.nombre);
    });
  }
});

// Resumen final
test.afterAll(async () => {
  // Generar resumen
  const totalPaginas = PAGINAS_PUBLICAS.length + PAGINAS_PRIVADAS.length;
  const paginasConErrores = new Set(erroresEncontrados.map(e => e.pagina)).size;
  const erroresCriticos = erroresEncontrados.filter(e => e.severidad === 'critico').length;
  const erroresAltos = erroresEncontrados.filter(e => e.severidad === 'alto').length;
  const erroresMedios = erroresEncontrados.filter(e => e.severidad === 'medio').length;
  const erroresBajos = erroresEncontrados.filter(e => e.severidad === 'bajo').length;

  const resumen = `
# 📊 Resumen de Revisión

- **Total de páginas revisadas**: ${totalPaginas}
- **Páginas con errores**: ${paginasConErrores}
- **Páginas sin errores**: ${totalPaginas - paginasConErrores}
- **Total de errores**: ${erroresEncontrados.length}

## Distribución por Severidad

- 🔴 **Críticos**: ${erroresCriticos}
- 🟠 **Altos**: ${erroresAltos}
- 🟡 **Medios**: ${erroresMedios}
- 🟢 **Bajos**: ${erroresBajos}

## Errores por Tipo

- **Errores de consola**: ${erroresEncontrados.filter(e => e.tipo === 'error_consola').length}
- **Errores de carga**: ${erroresEncontrados.filter(e => e.tipo === 'error_carga').length}
- **Errores visuales**: ${erroresEncontrados.filter(e => e.tipo === 'error_visual').length}
- **Elementos faltantes**: ${erroresEncontrados.filter(e => e.tipo === 'elemento_faltante').length}

---

## Detalle de Errores Críticos y Altos

${erroresEncontrados
  .filter(e => e.severidad === 'critico' || e.severidad === 'alto')
  .map(
    (e) =>
      `### ${e.pagina}
- **URL**: ${e.url}
- **Tipo**: ${e.tipo}
- **Severidad**: ${e.severidad}
- **Descripción**: ${e.descripcion}
- **Timestamp**: ${new Date(e.timestamp).toLocaleString('es-ES')}
`
  )
  .join('\n')}

---

*Reporte generado automáticamente el ${new Date().toLocaleString('es-ES')}*
`;

  appendFileSync(REPORT_FILE, resumen);

  console.log('\n==============================================');
  console.log('📊 RESUMEN DE REVISIÓN VISUAL');
  console.log('==============================================');
  console.log(`Total de páginas revisadas: ${totalPaginas}`);
  console.log(`Páginas con errores: ${paginasConErrores}`);
  console.log(`Total de errores: ${erroresEncontrados.length}`);
  console.log(`  - Críticos: ${erroresCriticos}`);
  console.log(`  - Altos: ${erroresAltos}`);
  console.log(`  - Medios: ${erroresMedios}`);
  console.log(`  - Bajos: ${erroresBajos}`);
  console.log('==============================================');
  console.log(`\nReporte guardado en: ${REPORT_FILE}`);
  console.log('==============================================\n');
  
  // Guardar también como JSON para procesamiento
  writeFileSync(
    path.join(REPORT_DIR, 'errores.json'),
    JSON.stringify(erroresEncontrados, null, 2)
  );
});
