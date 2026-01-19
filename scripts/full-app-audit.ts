/**
 * AUDITORÍA COMPLETA DE LA APLICACIÓN INMOVA
 * 
 * Este script realiza una verificación estática del código:
 * 1. Verifica que todas las rutas tengan página
 * 2. Detecta datos mock pendientes de eliminar
 * 3. Verifica APIs endpoint
 * 4. Detecta errores comunes de configuración
 * 5. Genera reporte de problemas encontrados
 */

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

interface AuditResult {
  category: string;
  severity: 'error' | 'warning' | 'info';
  file: string;
  message: string;
  line?: number;
}

const results: AuditResult[] = [];
const workspaceRoot = process.cwd();

// Helper para leer archivos
function readFile(filePath: string): string {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch {
    return '';
  }
}

// Helper para agregar resultado
function addResult(category: string, severity: AuditResult['severity'], file: string, message: string, line?: number) {
  results.push({ category, severity, file, message, line });
}

// ============================================
// AUDITORÍA 1: Verificar rutas de páginas
// ============================================
async function auditRoutes() {
  console.log('📍 Auditando rutas de páginas...');
  
  const pageFiles = await glob('app/**/page.tsx', { cwd: workspaceRoot });
  const routeFiles = await glob('app/**/route.ts', { cwd: workspaceRoot });
  
  console.log(`   Encontradas ${pageFiles.length} páginas`);
  console.log(`   Encontradas ${routeFiles.length} rutas API`);
  
  // Verificar cada página
  for (const pageFile of pageFiles) {
    const content = readFile(path.join(workspaceRoot, pageFile));
    
    // Verificar si la página tiene export default
    if (!content.includes('export default') && !content.includes('export function')) {
      addResult('routes', 'error', pageFile, 'Página sin export default');
    }
    
    // Verificar imports problemáticos
    if (content.includes("import { PrismaClient }") && !content.includes('runtime')) {
      addResult('routes', 'warning', pageFile, 'Import directo de PrismaClient sin runtime especificado');
    }
  }
}

// ============================================
// AUDITORÍA 2: Detectar datos mock
// ============================================
async function auditMockData() {
  console.log('🎭 Buscando datos mock...');
  
  const tsxFiles = await glob('app/**/*.tsx', { cwd: workspaceRoot });
  
  const mockPatterns = [
    { pattern: /const\s+mock\w+\s*=\s*\[/gi, type: 'Array mock' },
    { pattern: /const\s+MOCK_\w+\s*=/gi, type: 'Constante MOCK_' },
    { pattern: /const\s+SAMPLE_\w+\s*=/gi, type: 'Constante SAMPLE_' },
    { pattern: /const\s+DEMO_\w+\s*=/gi, type: 'Constante DEMO_' },
    { pattern: /const\s+fake\w+\s*=/gi, type: 'Variable fake' },
    { pattern: /\/\/\s*TODO:?\s*(mock|datos de prueba)/gi, type: 'TODO mock' },
  ];
  
  let mockCount = 0;
  
  for (const file of tsxFiles) {
    const content = readFile(path.join(workspaceRoot, file));
    const lines = content.split('\n');
    
    for (const { pattern, type } of mockPatterns) {
      const matches = content.match(pattern);
      if (matches) {
        // Encontrar la línea
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].match(pattern)) {
            // Verificar si está realmente usado (no comentado)
            const line = lines[i].trim();
            if (!line.startsWith('//') && !line.startsWith('/*')) {
              addResult('mock-data', 'warning', file, `${type}: ${matches[0].substring(0, 50)}...`, i + 1);
              mockCount++;
            }
          }
        }
      }
    }
  }
  
  console.log(`   Encontrados ${mockCount} posibles datos mock`);
}

// ============================================
// AUDITORÍA 3: Verificar APIs
// ============================================
async function auditAPIs() {
  console.log('🔌 Auditando APIs...');
  
  const apiFiles = await glob('app/api/**/route.ts', { cwd: workspaceRoot });
  
  for (const file of apiFiles) {
    const content = readFile(path.join(workspaceRoot, file));
    
    // Verificar que tiene export de métodos HTTP
    const hasMethods = content.includes('export async function GET') ||
                       content.includes('export async function POST') ||
                       content.includes('export async function PUT') ||
                       content.includes('export async function DELETE');
    
    if (!hasMethods) {
      addResult('api', 'warning', file, 'Archivo de API sin métodos HTTP exportados');
    }
    
    // Verificar manejo de errores
    if (!content.includes('try') && !content.includes('catch')) {
      addResult('api', 'warning', file, 'API sin manejo de errores try/catch');
    }
    
    // Verificar autenticación
    if (!content.includes('getServerSession') && !content.includes('// Public API') && 
        !file.includes('/public/') && !file.includes('/auth/') && !file.includes('/health')) {
      addResult('api', 'info', file, 'API sin verificación de sesión (puede ser intencional)');
    }
    
    // Verificar runtime para APIs con Prisma
    if (content.includes('prisma') && !content.includes('runtime')) {
      addResult('api', 'warning', file, 'API con Prisma sin especificar runtime');
    }
  }
  
  console.log(`   Auditadas ${apiFiles.length} APIs`);
}

// ============================================
// AUDITORÍA 4: Verificar componentes
// ============================================
async function auditComponents() {
  console.log('🧩 Auditando componentes...');
  
  const componentFiles = await glob('components/**/*.tsx', { cwd: workspaceRoot });
  
  for (const file of componentFiles) {
    const content = readFile(path.join(workspaceRoot, file));
    
    // Verificar 'use client' cuando es necesario
    const usesHooks = content.includes('useState') || 
                      content.includes('useEffect') ||
                      content.includes('useContext') ||
                      content.includes('onClick') ||
                      content.includes('onChange');
    
    if (usesHooks && !content.includes("'use client'") && !content.includes('"use client"')) {
      addResult('components', 'warning', file, "Componente con hooks sin 'use client'");
    }
  }
  
  console.log(`   Auditados ${componentFiles.length} componentes`);
}

// ============================================
// AUDITORÍA 5: Verificar tipos
// ============================================
async function auditTypes() {
  console.log('📝 Verificando tipos TypeScript...');
  
  // Verificar tsconfig
  const tsconfigPath = path.join(workspaceRoot, 'tsconfig.json');
  if (fs.existsSync(tsconfigPath)) {
    const tsconfig = JSON.parse(readFile(tsconfigPath));
    
    if (tsconfig.compilerOptions?.strict === false) {
      addResult('types', 'info', 'tsconfig.json', 'TypeScript strict mode está desactivado');
    }
  }
}

// ============================================
// AUDITORÍA 6: Verificar dependencias
// ============================================
async function auditDependencies() {
  console.log('📦 Verificando dependencias...');
  
  const packageJsonPath = path.join(workspaceRoot, 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(readFile(packageJsonPath));
    
    // Verificar versiones problemáticas conocidas
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
    
    if (deps.next && !deps.next.includes('15')) {
      addResult('deps', 'info', 'package.json', `Versión de Next.js: ${deps.next}`);
    }
  }
}

// ============================================
// AUDITORÍA 7: Verificar páginas sin contenido
// ============================================
async function auditEmptyPages() {
  console.log('📄 Buscando páginas vacías o placeholder...');
  
  const pageFiles = await glob('app/**/page.tsx', { cwd: workspaceRoot });
  
  for (const file of pageFiles) {
    const content = readFile(path.join(workspaceRoot, file));
    
    // Verificar páginas con solo un return básico
    if (content.includes('return null') || content.includes('return <></>' )) {
      addResult('pages', 'warning', file, 'Página retorna contenido vacío');
    }
    
    // Verificar páginas TODO
    if (content.includes('// TODO') || content.includes('/* TODO')) {
      addResult('pages', 'info', file, 'Página con TODO pendiente');
    }
    
    // Verificar páginas "Coming Soon" o similares
    if (content.includes('Coming Soon') || content.includes('Próximamente') || content.includes('En desarrollo')) {
      addResult('pages', 'info', file, 'Página marcada como "en desarrollo"');
    }
  }
}

// ============================================
// AUDITORÍA 8: Verificar rutas de innovación
// ============================================
async function auditInnovationRoutes() {
  console.log('💡 Verificando rutas de innovación...');
  
  const innovationPaths = [
    'app/innovacion/energia-solar/page.tsx',
    'app/innovacion/instalaciones-deportivas/page.tsx',
    'app/innovacion/huertos-urbanos/page.tsx',
    'app/(dashboard)/innovacion/energia-solar/page.tsx',
    'app/(dashboard)/innovacion/instalaciones-deportivas/page.tsx',
    'app/(dashboard)/innovacion/huertos-urbanos/page.tsx',
  ];
  
  for (const pagePath of innovationPaths) {
    const fullPath = path.join(workspaceRoot, pagePath);
    if (fs.existsSync(fullPath)) {
      const content = readFile(fullPath);
      
      // Verificar que tiene CRUD funcional
      const hasCRUD = content.includes('fetch') || content.includes('useSWR') || content.includes('useQuery');
      
      if (!hasCRUD) {
        addResult('innovation', 'warning', pagePath, 'Página de innovación sin fetch de datos');
      }
      
      console.log(`   ✓ ${pagePath}`);
    } else {
      addResult('innovation', 'error', pagePath, 'Página de innovación no encontrada');
    }
  }
}

// ============================================
// AUDITORÍA 9: Verificar sincronización
// ============================================
async function auditSyncRoutes() {
  console.log('🔄 Verificando rutas de sincronización...');
  
  const syncPaths = [
    'app/automatizacion/sincronizacion/page.tsx',
    'app/(dashboard)/automatizacion/sincronizacion/page.tsx',
  ];
  
  for (const pagePath of syncPaths) {
    const fullPath = path.join(workspaceRoot, pagePath);
    if (fs.existsSync(fullPath)) {
      console.log(`   ✓ ${pagePath} encontrada`);
    }
  }
  
  // Verificar API de sincronización
  const syncApiPaths = [
    'app/api/sync/connections/route.ts',
    'app/api/sync/logs/route.ts',
  ];
  
  for (const apiPath of syncApiPaths) {
    const fullPath = path.join(workspaceRoot, apiPath);
    if (fs.existsSync(fullPath)) {
      console.log(`   ✓ API ${apiPath} encontrada`);
    }
  }
}

// ============================================
// GENERAR REPORTE
// ============================================
function generateReport() {
  console.log('\n========================================');
  console.log('📊 REPORTE DE AUDITORÍA');
  console.log('========================================\n');
  
  // Agrupar por categoría y severidad
  const byCategory = results.reduce((acc, r) => {
    const key = r.category;
    acc[key] = acc[key] || [];
    acc[key].push(r);
    return acc;
  }, {} as Record<string, AuditResult[]>);
  
  const errors = results.filter(r => r.severity === 'error');
  const warnings = results.filter(r => r.severity === 'warning');
  const infos = results.filter(r => r.severity === 'info');
  
  console.log(`📈 Resumen:`);
  console.log(`   ❌ Errores: ${errors.length}`);
  console.log(`   ⚠️  Warnings: ${warnings.length}`);
  console.log(`   ℹ️  Info: ${infos.length}`);
  console.log(`   📊 Total: ${results.length}\n`);
  
  // Mostrar errores primero
  if (errors.length > 0) {
    console.log('❌ ERRORES CRÍTICOS:');
    errors.forEach(e => {
      console.log(`   [${e.category}] ${e.file}${e.line ? `:${e.line}` : ''}`);
      console.log(`      ${e.message}`);
    });
    console.log('');
  }
  
  // Mostrar warnings agrupados por categoría
  if (warnings.length > 0) {
    console.log('⚠️  WARNINGS:');
    Object.entries(byCategory).forEach(([category, items]) => {
      const categoryWarnings = items.filter(i => i.severity === 'warning');
      if (categoryWarnings.length > 0) {
        console.log(`\n   📁 ${category.toUpperCase()} (${categoryWarnings.length}):`);
        categoryWarnings.slice(0, 10).forEach(w => {
          console.log(`      - ${w.file}${w.line ? `:${w.line}` : ''}: ${w.message}`);
        });
        if (categoryWarnings.length > 10) {
          console.log(`      ... y ${categoryWarnings.length - 10} más`);
        }
      }
    });
    console.log('');
  }
  
  // Resumen por categoría
  console.log('📊 Por categoría:');
  Object.entries(byCategory).forEach(([category, items]) => {
    const e = items.filter(i => i.severity === 'error').length;
    const w = items.filter(i => i.severity === 'warning').length;
    const info = items.filter(i => i.severity === 'info').length;
    console.log(`   ${category}: ${e} errores, ${w} warnings, ${info} info`);
  });
  
  console.log('\n========================================\n');
  
  // Guardar reporte en archivo
  const reportPath = path.join(workspaceRoot, 'audit-report.json');
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    summary: {
      errors: errors.length,
      warnings: warnings.length,
      info: infos.length,
      total: results.length,
    },
    results,
  }, null, 2));
  
  console.log(`📄 Reporte guardado en: ${reportPath}`);
  
  return { errors: errors.length, warnings: warnings.length };
}

// ============================================
// MAIN
// ============================================
async function main() {
  console.log('🔍 INICIANDO AUDITORÍA COMPLETA DE INMOVA APP\n');
  console.log('========================================\n');
  
  await auditRoutes();
  await auditMockData();
  await auditAPIs();
  await auditComponents();
  await auditTypes();
  await auditDependencies();
  await auditEmptyPages();
  await auditInnovationRoutes();
  await auditSyncRoutes();
  
  const { errors } = generateReport();
  
  process.exit(errors > 0 ? 1 : 0);
}

main().catch(console.error);
