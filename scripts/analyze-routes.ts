/**
 * Análisis de rutas: detectar 404s potenciales
 */

import * as fs from 'fs';
import * as path from 'path';

interface RouteInfo {
  route: string;
  file: string;
  exists: boolean;
  hasLayout: boolean;
  inRouteGroup: boolean;
  groupName?: string;
}

// Convertir path de archivo a ruta URL
function fileToRoute(filePath: string): string {
  // Remover app/ del inicio
  let route = filePath.replace(/^app\//, '/');
  
  // Remover /page.tsx del final
  route = route.replace(/\/page\.tsx$/, '');
  
  // Si termina en /, dejar solo /
  if (route === '/') return route;
  
  // Remover / final si lo tiene
  route = route.replace(/\/$/, '');
  
  // Remover route groups (parentesis)
  route = route.replace(/\/\([^)]+\)/g, '');
  
  // Si quedó vacío, es la ruta raíz
  if (!route || route === '') return '/';
  
  return route;
}

// Leer todos los archivos page.tsx
function getAllPages(): string[] {
  const pagesFile = '/tmp/all-pages.txt';
  
  // Ejecutar find y guardar resultado
  require('child_process').execSync(
    'cd /workspace && find app -type f -name "page.tsx" | sort > /tmp/all-pages.txt'
  );
  
  const content = fs.readFileSync(pagesFile, 'utf-8');
  return content.split('\n').filter(Boolean);
}

// Detectar route groups
function detectRouteGroup(filePath: string): { inGroup: boolean; groupName?: string } {
  const match = filePath.match(/\/\(([^)]+)\)\//);
  if (match) {
    return { inGroup: true, groupName: match[1] };
  }
  return { inGroup: false };
}

// Verificar si tiene layout
function hasLayout(filePath: string): boolean {
  const dir = path.dirname(filePath);
  const layoutPath = path.join('/workspace', dir, 'layout.tsx');
  return fs.existsSync(layoutPath);
}

// Rutas esperadas críticas
const EXPECTED_CRITICAL_ROUTES = [
  '/login',
  '/register',
  '/landing',
  '/dashboard',
  '/admin',
  '/portal-inquilino',
  '/portal-proveedor',
  '/portal-propietario',
  '/coliving',
  '/str',
  '/community',
  '/crm',
  '/bi',
];

function main() {
  console.log('🔍 Analizando estructura de rutas...\n');
  
  const pages = getAllPages();
  const routes: RouteInfo[] = [];
  const routeMap = new Map<string, string[]>();
  
  // Procesar cada página
  for (const page of pages) {
    const route = fileToRoute(page);
    const group = detectRouteGroup(page);
    
    const info: RouteInfo = {
      route,
      file: page,
      exists: true,
      hasLayout: hasLayout(page),
      inRouteGroup: group.inGroup,
      groupName: group.groupName,
    };
    
    routes.push(info);
    
    // Mapear ruta a archivos (detectar duplicados)
    if (!routeMap.has(route)) {
      routeMap.set(route, []);
    }
    routeMap.get(route)!.push(page);
  }
  
  console.log(`📊 Total páginas: ${pages.length}`);
  console.log(`📊 Total rutas únicas: ${routeMap.size}\n`);
  
  // Detectar rutas duplicadas (conflictos)
  console.log('🔴 RUTAS DUPLICADAS (Conflictos potenciales):');
  let duplicates = 0;
  
  for (const [route, files] of routeMap.entries()) {
    if (files.length > 1) {
      console.log(`\n  ${route}`);
      files.forEach(f => console.log(`    - ${f}`));
      duplicates++;
    }
  }
  
  if (duplicates === 0) {
    console.log('  ✅ Ninguna\n');
  } else {
    console.log(`\n  Total: ${duplicates}\n`);
  }
  
  // Verificar rutas críticas
  console.log('✅ RUTAS CRÍTICAS:');
  const missing: string[] = [];
  
  for (const expected of EXPECTED_CRITICAL_ROUTES) {
    if (routeMap.has(expected)) {
      const files = routeMap.get(expected)!;
      console.log(`  ✅ ${expected} → ${files[0]}`);
    } else {
      console.log(`  ❌ ${expected} → FALTA`);
      missing.push(expected);
    }
  }
  
  // Rutas sin layout (pueden causar problemas)
  console.log('\n⚠️  RUTAS SIN LAYOUT (potencial problema):');
  const noLayout = routes.filter(r => !r.hasLayout && r.route !== '/');
  
  if (noLayout.length === 0) {
    console.log('  ✅ Todas tienen layout\n');
  } else {
    noLayout.slice(0, 20).forEach(r => {
      console.log(`  - ${r.route} (${r.file})`);
    });
    if (noLayout.length > 20) {
      console.log(`  ... y ${noLayout.length - 20} más\n`);
    }
  }
  
  // Estadísticas de route groups
  console.log('📁 ROUTE GROUPS:');
  const groups = new Map<string, number>();
  
  routes.forEach(r => {
    if (r.inRouteGroup && r.groupName) {
      groups.set(r.groupName, (groups.get(r.groupName) || 0) + 1);
    }
  });
  
  if (groups.size === 0) {
    console.log('  Ninguno\n');
  } else {
    for (const [name, count] of groups.entries()) {
      console.log(`  (${name}): ${count} páginas`);
    }
  }
  
  // Guardar reporte
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalPages: pages.length,
      uniqueRoutes: routeMap.size,
      duplicates,
      missingCritical: missing.length,
      withoutLayout: noLayout.length,
      routeGroups: groups.size,
    },
    duplicateRoutes: Array.from(routeMap.entries())
      .filter(([_, files]) => files.length > 1)
      .map(([route, files]) => ({ route, files })),
    missingCriticalRoutes: missing,
    routesWithoutLayout: noLayout.map(r => ({ route: r.route, file: r.file })),
    allRoutes: Array.from(routeMap.keys()).sort(),
  };
  
  fs.writeFileSync(
    '/workspace/routes-analysis.json',
    JSON.stringify(report, null, 2)
  );
  
  console.log('\n📄 Reporte guardado: routes-analysis.json');
  
  // Resultado
  if (duplicates > 0 || missing.length > 0) {
    console.log('\n⚠️  Se encontraron problemas potenciales');
    process.exit(1);
  } else {
    console.log('\n✅ Estructura de rutas correcta');
    process.exit(0);
  }
}

main();
