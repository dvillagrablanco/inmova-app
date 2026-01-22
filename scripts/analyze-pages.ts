/**
 * Script de Análisis de Páginas - Inmova App
 * 
 * Este script analiza todos los archivos page.tsx para:
 * 1. Identificar páginas completamente desarrolladas
 * 2. Detectar páginas en desarrollo o con placeholders
 * 3. Encontrar páginas con errores potenciales
 * 4. Generar un reporte detallado del estado
 * 
 * Ejecutar: npx tsx scripts/analyze-pages.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

interface PageAnalysis {
  path: string;
  url: string;
  status: 'complete' | 'placeholder' | 'in_progress' | 'minimal' | 'error';
  linesOfCode: number;
  hasRealContent: boolean;
  hasPlaceholder: boolean;
  hasAuthCheck: boolean;
  hasApiCalls: boolean;
  hasForm: boolean;
  hasCRUD: boolean;
  issues: string[];
  category: string;
}

// Patrones para detectar contenido placeholder
const PLACEHOLDER_PATTERNS = [
  /coming soon/i,
  /próximamente/i,
  /en desarrollo/i,
  /en construcción/i,
  /under construction/i,
  /TODO:/i,
  /FIXME:/i,
  /placeholder/i,
  /lorem ipsum/i,
  /not implemented/i,
  /no implementado/i,
];

// Patrones para detectar contenido mínimo
const MINIMAL_CONTENT_PATTERNS = [
  /return\s*\(\s*<div>\s*<\/div>\s*\)/,
  /return\s*null/,
  /return\s*<><\/>/,
];

// Palabras clave que indican contenido real
const REAL_CONTENT_INDICATORS = [
  'useEffect',
  'useState',
  'useMutation',
  'useQuery',
  'fetch(',
  'axios',
  'prisma',
  'Form',
  'Button',
  'Card',
  'Table',
  'DataTable',
  'Modal',
  'Dialog',
  'Input',
  'Select',
];

function analyzePageFile(filePath: string): PageAnalysis {
  const content = fs.readFileSync(filePath, 'utf-8');
  const relativePath = filePath.replace(process.cwd() + '/app/', '');
  
  // Calcular URL desde path
  const url = '/' + relativePath
    .replace(/\/page\.tsx$/, '')
    .replace(/\[([^\]]+)\]/g, ':$1')
    .replace(/^\(.*?\)\//g, ''); // Remove route groups like (dashboard)/
  
  const lines = content.split('\n');
  const linesOfCode = lines.filter(l => l.trim() && !l.trim().startsWith('//')).length;
  
  const issues: string[] = [];
  
  // Verificar si tiene placeholders
  const hasPlaceholder = PLACEHOLDER_PATTERNS.some(pattern => pattern.test(content));
  if (hasPlaceholder) {
    issues.push('Contiene texto placeholder');
  }
  
  // Verificar si tiene contenido mínimo
  const isMinimalContent = MINIMAL_CONTENT_PATTERNS.some(pattern => pattern.test(content));
  if (isMinimalContent) {
    issues.push('Contenido mínimo/vacío');
  }
  
  // Verificar indicadores de contenido real
  const realContentCount = REAL_CONTENT_INDICATORS.filter(indicator => 
    content.includes(indicator)
  ).length;
  const hasRealContent = realContentCount >= 3;
  
  // Verificar autenticación
  const hasAuthCheck = content.includes('useSession') || 
                       content.includes('getServerSession') ||
                       content.includes('requireAuth') ||
                       content.includes('AuthenticatedLayout');
  
  // Verificar API calls
  const hasApiCalls = content.includes('fetch(') || 
                      content.includes('axios') ||
                      content.includes('useQuery') ||
                      content.includes('useMutation');
  
  // Verificar formularios
  const hasForm = content.includes('<form') || 
                  content.includes('useForm') ||
                  content.includes('handleSubmit');
  
  // Verificar operaciones CRUD
  const hasCRUD = content.includes('POST') || 
                  content.includes('PUT') ||
                  content.includes('DELETE') ||
                  content.includes('create') ||
                  content.includes('update') ||
                  content.includes('delete');
  
  // Verificar si es página muy corta
  if (linesOfCode < 30) {
    issues.push(`Solo ${linesOfCode} líneas de código`);
  }
  
  // Verificar si solo exporta un componente simple
  if (content.includes('export default function') && linesOfCode < 50 && !hasRealContent) {
    issues.push('Posible componente stub');
  }
  
  // Detectar páginas con "Coming Soon"
  if (/comingSoon|ComingSoon|COMING_SOON/i.test(content)) {
    issues.push('Usa componente Coming Soon');
  }
  
  // Determinar categoría basada en la ruta
  let category = 'other';
  if (url.startsWith('/admin')) category = 'admin';
  else if (url.startsWith('/dashboard')) category = 'dashboard';
  else if (url.startsWith('/landing')) category = 'landing';
  else if (url.startsWith('/portal-inquilino')) category = 'portal_inquilino';
  else if (url.startsWith('/portal-proveedor')) category = 'portal_proveedor';
  else if (url.startsWith('/portal-propietario')) category = 'portal_propietario';
  else if (url.startsWith('/portal-comercial')) category = 'portal_comercial';
  else if (url.startsWith('/partners')) category = 'partners';
  else if (url.startsWith('/str')) category = 'str';
  else if (url.startsWith('/coliving')) category = 'coliving';
  else if (url.startsWith('/flipping')) category = 'flipping';
  else if (url.startsWith('/construction') || url.startsWith('/construccion')) category = 'construction';
  else if (url.startsWith('/ewoorker')) category = 'ewoorker';
  else if (url.startsWith('/comunidades')) category = 'comunidades';
  else if (url.startsWith('/professional')) category = 'professional';
  else if (url.startsWith('/workspace')) category = 'workspace';
  else if (url.startsWith('/vivienda-social')) category = 'vivienda_social';
  else if (url.startsWith('/student-housing')) category = 'student_housing';
  else if (url.startsWith('/viajes-corporativos')) category = 'viajes_corporativos';
  else if (url.startsWith('/real-estate')) category = 'real_estate_developer';
  else if (url.startsWith('/warehouse')) category = 'warehouse';
  else if (url.startsWith('/red-agentes')) category = 'red_agentes';
  
  // Determinar estado final
  let status: PageAnalysis['status'] = 'complete';
  
  if (issues.some(i => i.includes('Coming Soon') || i.includes('placeholder'))) {
    status = 'placeholder';
  } else if (issues.some(i => i.includes('mínimo') || i.includes('stub'))) {
    status = 'minimal';
  } else if (!hasRealContent && linesOfCode < 100) {
    status = 'in_progress';
  } else if (issues.length > 0) {
    status = 'in_progress';
  }
  
  return {
    path: relativePath,
    url,
    status,
    linesOfCode,
    hasRealContent,
    hasPlaceholder,
    hasAuthCheck,
    hasApiCalls,
    hasForm,
    hasCRUD,
    issues,
    category,
  };
}

async function main() {
  console.log('='.repeat(80));
  console.log('ANÁLISIS DE PÁGINAS - INMOVA APP');
  console.log('='.repeat(80));
  console.log();
  
  // Encontrar todos los archivos page.tsx
  const pageFiles = await glob('app/**/page.tsx', {
    ignore: ['**/node_modules/**', '**/.next/**', '**/api/**'],
  });
  
  console.log(`Total de páginas encontradas: ${pageFiles.length}\n`);
  
  // Analizar cada página
  const analyses: PageAnalysis[] = [];
  
  for (const file of pageFiles) {
    try {
      const analysis = analyzePageFile(file);
      analyses.push(analysis);
    } catch (error: any) {
      console.error(`Error analizando ${file}: ${error.message}`);
    }
  }
  
  // Agrupar por estado
  const byStatus = {
    complete: analyses.filter(a => a.status === 'complete'),
    in_progress: analyses.filter(a => a.status === 'in_progress'),
    placeholder: analyses.filter(a => a.status === 'placeholder'),
    minimal: analyses.filter(a => a.status === 'minimal'),
  };
  
  // Resumen general
  console.log('='.repeat(80));
  console.log('RESUMEN GENERAL');
  console.log('='.repeat(80));
  console.log(`✅ Completas: ${byStatus.complete.length}`);
  console.log(`🔄 En progreso: ${byStatus.in_progress.length}`);
  console.log(`⏳ Placeholder/Coming Soon: ${byStatus.placeholder.length}`);
  console.log(`📝 Contenido mínimo: ${byStatus.minimal.length}`);
  console.log();
  
  // Estadísticas por categoría
  console.log('='.repeat(80));
  console.log('ESTADÍSTICAS POR CATEGORÍA');
  console.log('='.repeat(80));
  
  const categories = [...new Set(analyses.map(a => a.category))].sort();
  for (const cat of categories) {
    const catPages = analyses.filter(a => a.category === cat);
    const complete = catPages.filter(a => a.status === 'complete').length;
    const incomplete = catPages.length - complete;
    console.log(`${cat}: ${complete}/${catPages.length} completas (${incomplete} pendientes)`);
  }
  console.log();
  
  // Páginas con placeholder o Coming Soon
  console.log('='.repeat(80));
  console.log('PÁGINAS CON PLACEHOLDER O "COMING SOON"');
  console.log('='.repeat(80));
  
  if (byStatus.placeholder.length > 0) {
    byStatus.placeholder.forEach(p => {
      console.log(`⏳ ${p.url}`);
      console.log(`   Archivo: ${p.path}`);
      console.log(`   Issues: ${p.issues.join(', ')}`);
    });
  } else {
    console.log('No se encontraron páginas con placeholder.');
  }
  console.log();
  
  // Páginas con contenido mínimo
  console.log('='.repeat(80));
  console.log('PÁGINAS CON CONTENIDO MÍNIMO');
  console.log('='.repeat(80));
  
  if (byStatus.minimal.length > 0) {
    byStatus.minimal.forEach(p => {
      console.log(`📝 ${p.url}`);
      console.log(`   Archivo: ${p.path}`);
      console.log(`   Líneas: ${p.linesOfCode}`);
      console.log(`   Issues: ${p.issues.join(', ')}`);
    });
  } else {
    console.log('No se encontraron páginas con contenido mínimo.');
  }
  console.log();
  
  // Páginas en progreso
  console.log('='.repeat(80));
  console.log('PÁGINAS EN PROGRESO (Necesitan desarrollo)');
  console.log('='.repeat(80));
  
  if (byStatus.in_progress.length > 0) {
    byStatus.in_progress.slice(0, 30).forEach(p => {
      console.log(`🔄 ${p.url} (${p.linesOfCode} líneas)`);
      if (p.issues.length > 0) {
        console.log(`   Issues: ${p.issues.join(', ')}`);
      }
    });
    if (byStatus.in_progress.length > 30) {
      console.log(`   ... y ${byStatus.in_progress.length - 30} más`);
    }
  } else {
    console.log('No se encontraron páginas en progreso.');
  }
  console.log();
  
  // Páginas prioritarias pendientes (landing, dashboard, portal)
  console.log('='.repeat(80));
  console.log('PÁGINAS PRIORITARIAS PENDIENTES');
  console.log('='.repeat(80));
  
  const priorityCategories = ['landing', 'dashboard', 'portal_inquilino', 'portal_proveedor', 'portal_propietario'];
  const priorityPending = analyses.filter(a => 
    priorityCategories.includes(a.category) && 
    a.status !== 'complete'
  );
  
  if (priorityPending.length > 0) {
    priorityPending.forEach(p => {
      console.log(`⚠️  ${p.url} [${p.category}]`);
      console.log(`   Estado: ${p.status}`);
      console.log(`   Archivo: ${p.path}`);
      if (p.issues.length > 0) {
        console.log(`   Issues: ${p.issues.join(', ')}`);
      }
    });
  } else {
    console.log('Todas las páginas prioritarias están completas.');
  }
  console.log();
  
  // Guardar reporte en JSON
  const report = {
    generatedAt: new Date().toISOString(),
    summary: {
      total: analyses.length,
      complete: byStatus.complete.length,
      in_progress: byStatus.in_progress.length,
      placeholder: byStatus.placeholder.length,
      minimal: byStatus.minimal.length,
    },
    byCategory: Object.fromEntries(
      categories.map(cat => [
        cat,
        {
          total: analyses.filter(a => a.category === cat).length,
          complete: analyses.filter(a => a.category === cat && a.status === 'complete').length,
          pending: analyses.filter(a => a.category === cat && a.status !== 'complete').length,
        }
      ])
    ),
    pages: analyses,
    pendingDevelopment: analyses
      .filter(a => a.status !== 'complete')
      .map(a => ({
        url: a.url,
        path: a.path,
        status: a.status,
        category: a.category,
        issues: a.issues,
      })),
  };
  
  fs.writeFileSync('pages-analysis-report.json', JSON.stringify(report, null, 2));
  console.log('📄 Reporte guardado en: pages-analysis-report.json');
  console.log();
  
  // Sugerencias de desarrollo
  console.log('='.repeat(80));
  console.log('SUGERENCIAS DE DESARROLLO');
  console.log('='.repeat(80));
  console.log();
  console.log('1. Priorizar páginas de los portales (inquilino, proveedor, propietario)');
  console.log('2. Completar páginas del dashboard que solo tienen placeholder');
  console.log('3. Desarrollar páginas de landing que faltan contenido real');
  console.log('4. Revisar páginas con menos de 50 líneas de código');
  console.log();
}

main().catch(console.error);
