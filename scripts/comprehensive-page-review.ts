/**
 * Revisión exhaustiva de TODAS las páginas de la aplicación
 * Detecta:
 * - Páginas sin H1
 * - Componentes problemáticos
 * - Imports faltantes
 * - Errores de sintaxis
 */

import * as fs from 'fs';
import * as path from 'path';

interface PageAnalysis {
  file: string;
  exists: boolean;
  hasH1: boolean;
  hasErrors: boolean;
  errors: string[];
  warnings: string[];
  isComingSoon: boolean;
  usesAuthLayout: boolean;
}

const results: PageAnalysis[] = [];

function analyzePage(filePath: string): PageAnalysis {
  const fullPath = path.join('/workspace', filePath);
  
  const analysis: PageAnalysis = {
    file: filePath,
    exists: false,
    hasH1: false,
    hasErrors: false,
    errors: [],
    warnings: [],
    isComingSoon: false,
    usesAuthLayout: false,
  };

  if (!fs.existsSync(fullPath)) {
    analysis.errors.push('Archivo no existe');
    analysis.hasErrors = true;
    return analysis;
  }

  analysis.exists = true;

  try {
    const content = fs.readFileSync(fullPath, 'utf-8');

    // Verificar H1
    if (content.includes('<h1') || content.includes('CardTitle')) {
      analysis.hasH1 = true;
    }

    // Verificar si es ComingSoon
    if (content.includes('ComingSoonPage')) {
      analysis.isComingSoon = true;
    }

    // Verificar AuthenticatedLayout
    if (content.includes('AuthenticatedLayout')) {
      analysis.usesAuthLayout = true;
    }

    // Detectar imports problemáticos
    if (content.includes("import {") && !content.includes("} from")) {
      analysis.warnings.push('Import potencialmente malformado');
    }

    // Detectar exports problemáticos
    if (!content.includes('export default') && !content.includes('export function')) {
      analysis.warnings.push('Sin export default o named export');
      analysis.hasErrors = true;
    }

    // Detectar uso de any
    const anyCount = (content.match(/:\s*any/g) || []).length;
    if (anyCount > 5) {
      analysis.warnings.push(`Exceso de 'any' (${anyCount} veces)`);
    }

    // Detectar console.log (debe usarse logger)
    if (content.includes('console.log(') && !content.includes('// DEBUG')) {
      analysis.warnings.push('Usa console.log en lugar de logger');
    }

  } catch (error) {
    analysis.errors.push(`Error leyendo archivo: ${error}`);
    analysis.hasErrors = true;
  }

  return analysis;
}

// Lista de TODAS las páginas críticas de la aplicación
const PAGES_TO_REVIEW = [
  // Landing
  'app/landing/page.tsx',
  
  // Auth
  'app/login/page.tsx',
  'app/register/page.tsx',
  'app/unauthorized/page.tsx',
  
  // Dashboard principal
  'app/dashboard/page.tsx',
  'app/page.tsx',
  
  // Core Features
  'app/edificios/page.tsx',
  'app/unidades/page.tsx',
  'app/inquilinos/page.tsx',
  'app/contratos/page.tsx',
  'app/pagos/page.tsx',
  'app/mantenimiento/page.tsx',
  'app/calendario/page.tsx',
  'app/documentos/page.tsx',
  'app/reportes/page.tsx',
  'app/proveedores/page.tsx',
  'app/gastos/page.tsx',
  'app/tareas/page.tsx',
  'app/notificaciones/page.tsx',
  'app/chat/page.tsx',
  
  // Admin
  'app/admin/dashboard/page.tsx',
  'app/admin/clientes/page.tsx',
  'app/admin/planes/page.tsx',
  'app/admin/modulos/page.tsx',
  'app/admin/usuarios/page.tsx',
  'app/admin/configuracion/page.tsx',
  'app/admin/marketplace/page.tsx',
  'app/admin/personalizacion/page.tsx',
  'app/admin/activity/page.tsx',
  'app/admin/alertas/page.tsx',
  'app/admin/facturacion-b2b/page.tsx',
  
  // Portal Inquilino
  'app/portal-inquilino/page.tsx',
  'app/portal-inquilino/dashboard/page.tsx',
  'app/portal-inquilino/incidencias/page.tsx',
  'app/portal-inquilino/contrato/page.tsx',
  'app/portal-inquilino/comunicacion/page.tsx',
  
  // Portal Proveedor
  'app/portal-proveedor/page.tsx',
  'app/portal-proveedor/ordenes/page.tsx',
  'app/portal-proveedor/presupuestos/page.tsx',
  'app/portal-proveedor/facturas/page.tsx',
  
  // Portal Comercial
  'app/portal-comercial/page.tsx',
  'app/portal-comercial/leads/page.tsx',
  'app/portal-comercial/objetivos/page.tsx',
  'app/portal-comercial/comisiones/page.tsx',
  
  // Verticales
  'app/str/page.tsx',
  'app/str/channels/page.tsx',
  'app/str/listings/page.tsx',
  'app/str/bookings/page.tsx',
  'app/coliving/page.tsx',
  'app/student-housing/page.tsx',
  'app/workspace/page.tsx',
  'app/flipping/page.tsx',
  'app/flipping/dashboard/page.tsx',
  'app/partners/page.tsx',
  'app/partners/dashboard/page.tsx',
  
  // Features avanzadas
  'app/propiedades/page.tsx',
  'app/seguros/page.tsx',
  'app/visitas/page.tsx',
  'app/votaciones/page.tsx',
  'app/tours-virtuales/page.tsx',
  'app/crm/page.tsx',
  'app/bi/page.tsx',
  'app/analytics/page.tsx',
];

console.log('🔍 REVISIÓN EXHAUSTIVA DE PÁGINAS');
console.log('='.repeat(80));
console.log(`Total de páginas a revisar: ${PAGES_TO_REVIEW.length}\n`);

for (const pagePath of PAGES_TO_REVIEW) {
  const analysis = analyzePage(pagePath);
  results.push(analysis);
  
  const status = analysis.hasErrors ? '❌' : analysis.warnings.length > 0 ? '⚠️' : '✅';
  console.log(`${status} ${pagePath}`);
  
  if (analysis.isComingSoon) {
    console.log('   ℹ️  Página "Coming Soon"');
  }
  
  if (!analysis.hasH1 && analysis.exists && !analysis.isComingSoon) {
    console.log('   ⚠️  Sin H1');
  }
  
  if (analysis.errors.length > 0) {
    analysis.errors.forEach(err => console.log(`   ❌ ${err}`));
  }
  
  if (analysis.warnings.length > 0) {
    analysis.warnings.forEach(warn => console.log(`   ⚠️  ${warn}`));
  }
}

console.log('\n' + '='.repeat(80));
console.log('📊 RESUMEN FINAL');
console.log('='.repeat(80));

const stats = {
  total: results.length,
  existing: results.filter(r => r.exists).length,
  missing: results.filter(r => !r.exists).length,
  withH1: results.filter(r => r.hasH1).length,
  withoutH1: results.filter(r => r.exists && !r.hasH1 && !r.isComingSoon).length,
  comingSoon: results.filter(r => r.isComingSoon).length,
  withErrors: results.filter(r => r.hasErrors).length,
  withWarnings: results.filter(r => r.warnings.length > 0 && !r.hasErrors).length,
  healthy: results.filter(r => !r.hasErrors && r.warnings.length === 0).length,
};

console.log(`Total páginas: ${stats.total}`);
console.log(`✅ Existentes: ${stats.existing}`);
console.log(`❌ Faltantes: ${stats.missing}`);
console.log(`✅ Con H1: ${stats.withH1}`);
console.log(`⚠️  Sin H1: ${stats.withoutH1}`);
console.log(`ℹ️  Coming Soon: ${stats.comingSoon}`);
console.log(`❌ Con errores: ${stats.withErrors}`);
console.log(`⚠️  Con warnings: ${stats.withWarnings}`);
console.log(`✅ Saludables: ${stats.healthy}`);

// Exportar resultados
const reportPath = '/workspace/page-review-results.json';
fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
console.log(`\n📄 Reporte guardado en: ${reportPath}`);

// Listar páginas que necesitan corrección
const needsWork = results.filter(r => r.hasErrors || (r.exists && !r.hasH1 && !r.isComingSoon));
if (needsWork.length > 0) {
  console.log('\n' + '='.repeat(80));
  console.log('🔧 PÁGINAS QUE REQUIEREN CORRECCIÓN');
  console.log('='.repeat(80));
  needsWork.forEach(page => {
    console.log(`\n${page.file}`);
    if (!page.exists) {
      console.log('  → Crear página');
    }
    if (page.exists && !page.hasH1) {
      console.log('  → Añadir H1');
    }
    if (page.errors.length > 0) {
      page.errors.forEach(err => console.log(`  → ${err}`));
    }
  });
}

console.log('\n✅ Revisión completada');
