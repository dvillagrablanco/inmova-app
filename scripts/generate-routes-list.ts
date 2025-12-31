/**
 * 🗺️ GENERADOR DE LISTA DE RUTAS
 * 
 * Escanea automáticamente todos los archivos page.tsx en app/
 * y genera una lista de rutas para auditar con Playwright
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

// ============================================================================
// CONFIGURACIÓN
// ============================================================================

const APP_DIR = path.join(process.cwd(), 'app');
const OUTPUT_FILE = path.join(process.cwd(), 'e2e/routes-config.json');

interface RouteConfig {
  name: string;
  url: string;
  requiresAuth: boolean;
  requiresSuperAdmin?: boolean;
  category: string;
  priority: 'high' | 'medium' | 'low';
}

// ============================================================================
// CATEGORIZACIÓN DE RUTAS
// ============================================================================

const CATEGORY_PATTERNS = {
  landing: /^(\/landing|^\/$|^\/login|^\/register)/,
  admin: /^\/admin/,
  superadmin: /^\/superadmin/,
  dashboard: /^\/dashboard/,
  portal_inquilino: /^\/portal-inquilino/,
  portal_propietario: /^\/portal-propietario/,
  portal_proveedor: /^\/portal-proveedor/,
  portal_comercial: /^\/portal-comercial/,
  partners: /^\/partners/,
  str: /^\/str/,
  coliving: /^\/coliving/,
  flipping: /^\/flipping/,
  construction: /^\/construction/,
  comunidades: /^\/comunidades/,
  ewoorker: /^\/ewoorker/,
  professional: /^\/professional/,
  other: /.*/,
};

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Convierte path de archivo a URL
 */
function filePathToUrl(filePath: string): string {
  // Eliminar 'app/' del inicio
  let url = filePath.replace(/^app/, '');
  
  // Eliminar '/page.tsx' del final
  url = url.replace(/\/page\.tsx$/, '');
  
  // Manejar route groups (dashboard), etc
  url = url.replace(/\/\([^)]+\)/g, '');
  
  // Convertir a URL
  url = url || '/';
  
  return url;
}

/**
 * Determina si una ruta requiere autenticación
 */
function requiresAuth(url: string): boolean {
  const publicRoutes = [
    '/',
    '/landing',
    '/login',
    '/register',
    '/unauthorized',
    '/offline',
  ];
  
  // Rutas que empiezan con public paths
  if (publicRoutes.some(route => url === route || url.startsWith(route + '/'))) {
    return false;
  }
  
  // Portales públicos (tienen su propio login)
  if (
    url.startsWith('/portal-inquilino') ||
    url.startsWith('/portal-propietario') ||
    url.startsWith('/portal-proveedor') ||
    url.startsWith('/partners')
  ) {
    return false; // Tienen su propio sistema de auth
  }
  
  // Todo lo demás requiere auth
  return true;
}

/**
 * Determina categoría de la ruta
 */
function getCategory(url: string): string {
  for (const [category, pattern] of Object.entries(CATEGORY_PATTERNS)) {
    if (pattern.test(url)) {
      return category;
    }
  }
  return 'other';
}

/**
 * Determina prioridad de la ruta
 */
function getPriority(url: string, category: string): 'high' | 'medium' | 'low' {
  // Alta prioridad
  const highPriority = [
    '/',
    '/landing',
    '/login',
    '/register',
    '/dashboard',
    '/admin/dashboard',
  ];
  
  if (highPriority.includes(url)) {
    return 'high';
  }
  
  // Media prioridad: páginas principales de cada sección
  if (
    url === `/${category}` ||
    url.split('/').length === 2
  ) {
    return 'medium';
  }
  
  // Baja prioridad: subpáginas
  return 'low';
}

/**
 * Genera nombre legible de la ruta
 */
function generateRouteName(url: string): string {
  if (url === '/') return 'Landing Home';
  
  // Convertir /dashboard/propiedades -> Dashboard - Propiedades
  const parts = url.split('/').filter(Boolean);
  return parts
    .map(part => 
      part
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
    )
    .join(' - ');
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log('🗺️  Generando lista de rutas para auditoría...\n');
  
  // Buscar todos los archivos page.tsx
  const command = 'find app -type f \\( -name "page.tsx" -o -name "page.ts" \\) | grep -v node_modules | grep -v .next | sort';
  const output = execSync(command, { encoding: 'utf-8' });
  const pageFiles = output.trim().split('\n').filter(Boolean);
  
  console.log(`📊 Encontrados ${pageFiles.length} archivos de página\n`);
  
  // Generar configuración de rutas
  const routes: RouteConfig[] = pageFiles.map(filePath => {
    const url = filePathToUrl(filePath);
    const category = getCategory(url);
    const priority = getPriority(url, category);
    const auth = requiresAuth(url);
    const superAdmin = url.startsWith('/admin') || url.startsWith('/superadmin');
    
    return {
      name: generateRouteName(url),
      url,
      requiresAuth: auth,
      requiresSuperAdmin: superAdmin,
      category,
      priority,
    };
  });
  
  // Estadísticas
  console.log('📈 Estadísticas de Rutas:\n');
  console.log(`Total de rutas: ${routes.length}`);
  console.log(`  - Públicas: ${routes.filter(r => !r.requiresAuth).length}`);
  console.log(`  - Autenticadas: ${routes.filter(r => r.requiresAuth).length}`);
  console.log(`  - Superadmin: ${routes.filter(r => r.requiresSuperAdmin).length}`);
  console.log();
  
  // Por categoría
  const byCategory: Record<string, number> = {};
  routes.forEach(route => {
    byCategory[route.category] = (byCategory[route.category] || 0) + 1;
  });
  
  console.log('Por Categoría:');
  Object.entries(byCategory)
    .sort((a, b) => b[1] - a[1])
    .forEach(([category, count]) => {
      console.log(`  - ${category}: ${count}`);
    });
  console.log();
  
  // Por prioridad
  console.log('Por Prioridad:');
  console.log(`  - Alta: ${routes.filter(r => r.priority === 'high').length}`);
  console.log(`  - Media: ${routes.filter(r => r.priority === 'medium').length}`);
  console.log(`  - Baja: ${routes.filter(r => r.priority === 'low').length}`);
  console.log();
  
  // Guardar configuración
  const config = {
    generatedAt: new Date().toISOString(),
    totalRoutes: routes.length,
    routes,
  };
  
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(config, null, 2));
  console.log(`✅ Configuración guardada en: ${OUTPUT_FILE}`);
  console.log();
  
  // Generar también archivo TypeScript para importar
  const tsContent = `/**
 * Auto-generated route configuration
 * Generated: ${new Date().toISOString()}
 * Total routes: ${routes.length}
 */

export interface RouteConfig {
  name: string;
  url: string;
  requiresAuth: boolean;
  requiresSuperAdmin?: boolean;
  category: string;
  priority: 'high' | 'medium' | 'low';
}

export const ALL_ROUTES: RouteConfig[] = ${JSON.stringify(routes, null, 2)};

export const ROUTES_BY_PRIORITY = {
  high: ALL_ROUTES.filter(r => r.priority === 'high'),
  medium: ALL_ROUTES.filter(r => r.priority === 'medium'),
  low: ALL_ROUTES.filter(r => r.priority === 'low'),
};

export const ROUTES_BY_CATEGORY = {
  ${Object.keys(byCategory).map(cat => 
    `${cat}: ALL_ROUTES.filter(r => r.category === '${cat}')`
  ).join(',\n  ')}
};

export const PUBLIC_ROUTES = ALL_ROUTES.filter(r => !r.requiresAuth);
export const AUTHENTICATED_ROUTES = ALL_ROUTES.filter(r => r.requiresAuth);
export const SUPERADMIN_ROUTES = ALL_ROUTES.filter(r => r.requiresSuperAdmin);
`;
  
  fs.writeFileSync(
    path.join(process.cwd(), 'e2e/routes-config.ts'),
    tsContent
  );
  
  console.log(`✅ Archivo TypeScript generado: e2e/routes-config.ts`);
  console.log();
  console.log('🎉 Listo para usar en tests de Playwright!');
}

// ============================================================================
// EJECUTAR
// ============================================================================

main().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});
