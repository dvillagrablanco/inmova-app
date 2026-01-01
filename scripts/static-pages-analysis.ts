/**
 * Análisis estático de páginas
 * Detecta errores sin necesidad de servidor corriendo
 */

import * as fs from 'fs';
import * as path from 'path';

interface PageIssue {
  file: string;
  route: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  type: string;
  message: string;
  line?: number;
  code?: string;
}

const issues: PageIssue[] = [];

// Leer archivo
function readFile(filePath: string): string {
  return fs.readFileSync(path.join('/workspace', filePath), 'utf-8');
}

// Verificar página
function analyzePage(filePath: string, route: string) {
  try {
    const content = readFile(filePath);
    const lines = content.split('\n');
    
    // 1. Verificar que tiene export default
    if (!content.includes('export default')) {
      issues.push({
        file: filePath,
        route,
        severity: 'CRITICAL',
        type: 'MISSING_DEFAULT_EXPORT',
        message: 'Página sin export default',
      });
    }
    
    // 2. Verificar imports de módulos no existentes
    lines.forEach((line, idx) => {
      if (line.includes('import') && line.includes('from')) {
        const match = line.match(/from ['"]([^'"]+)['"]/);
        if (match) {
          const importPath = match[1];
          
          // Verificar imports relativos
          if (importPath.startsWith('.')) {
            const dir = path.dirname(filePath);
            const resolvedPath = path.resolve('/workspace', dir, importPath);
            
            const possibleExts = ['', '.ts', '.tsx', '.js', '.jsx'];
            const exists = possibleExts.some(ext => 
              fs.existsSync(resolvedPath + ext) || 
              fs.existsSync(path.join(resolvedPath, 'index' + ext))
            );
            
            if (!exists) {
              issues.push({
                file: filePath,
                route,
                severity: 'HIGH',
                type: 'MISSING_IMPORT',
                message: `Import no existe: ${importPath}`,
                line: idx + 1,
                code: line.trim(),
              });
            }
          }
        }
      }
    });
    
    // 3. Verificar uso de 'any' excesivo
    const anyCount = (content.match(/:\s*any/g) || []).length;
    if (anyCount > 5) {
      issues.push({
        file: filePath,
        route,
        severity: 'LOW',
        type: 'EXCESSIVE_ANY',
        message: `${anyCount} usos de 'any'`,
      });
    }
    
    // 4. Verificar console.log en producción
    const consoleLogCount = (content.match(/console\.log\(/g) || []).length;
    if (consoleLogCount > 0) {
      issues.push({
        file: filePath,
        route,
        severity: 'LOW',
        type: 'CONSOLE_LOG',
        message: `${consoleLogCount} console.log statements`,
      });
    }
    
    // 5. Verificar TODO/FIXME
    lines.forEach((line, idx) => {
      if (line.includes('// TODO') || line.includes('// FIXME')) {
        issues.push({
          file: filePath,
          route,
          severity: 'LOW',
          type: 'TODO_COMMENT',
          message: line.trim(),
          line: idx + 1,
        });
      }
    });
    
    // 6. Verificar fetch sin error handling
    lines.forEach((line, idx) => {
      if (line.includes('fetch(') && !content.includes('try') && !content.includes('catch')) {
        issues.push({
          file: filePath,
          route,
          severity: 'MEDIUM',
          type: 'UNHANDLED_FETCH',
          message: 'fetch() sin try/catch',
          line: idx + 1,
        });
      }
    });
    
    // 7. Verificar 'use client' innecesario
    if (content.includes("'use client'")) {
      // Si no usa hooks/eventos, no necesita ser cliente
      const needsClient = content.includes('useState') || 
                         content.includes('useEffect') ||
                         content.includes('onClick') ||
                         content.includes('onChange');
      
      if (!needsClient) {
        issues.push({
          file: filePath,
          route,
          severity: 'LOW',
          type: 'UNNECESSARY_USE_CLIENT',
          message: "'use client' no necesario (no usa hooks/eventos)",
        });
      }
    }
    
    // 8. Verificar componentes sin key en loops
    lines.forEach((line, idx) => {
      if (line.includes('.map(') && line.includes('<') && !line.includes('key=')) {
        issues.push({
          file: filePath,
          route,
          severity: 'MEDIUM',
          type: 'MISSING_KEY',
          message: 'Componente en map() sin key prop',
          line: idx + 1,
          code: line.trim().substring(0, 80),
        });
      }
    });
    
  } catch (error: any) {
    issues.push({
      file: filePath,
      route,
      severity: 'CRITICAL',
      type: 'READ_ERROR',
      message: error.message,
    });
  }
}

function main() {
  console.log('🔍 ANÁLISIS ESTÁTICO DE PÁGINAS\n');
  
  // Leer análisis previo de rutas
  const routesData = JSON.parse(fs.readFileSync('/workspace/routes-analysis.json', 'utf-8'));
  const allRoutes = routesData.allRoutes as string[];
  
  console.log(`📊 Analizando ${allRoutes.length} páginas...\n`);
  
  // Mapear rutas a archivos
  const routeToFile = new Map<string, string>();
  const output = require('child_process').execSync(
    'cd /workspace && find app -type f -name "page.tsx"',
    { encoding: 'utf-8' }
  );
  
  output.split('\n').filter(Boolean).forEach((file: string) => {
    let route = '/' + file.replace(/^app\//, '').replace(/\/page\.tsx$/, '');
    route = route.replace(/\/\([^)]+\)/g, ''); // Remove route groups
    if (route === '/') route = '/';
    else route = route.replace(/\/$/, '');
    
    routeToFile.set(route, file);
  });
  
  // Analizar cada página
  let count = 0;
  for (const route of allRoutes) {
    const file = routeToFile.get(route);
    if (file) {
      count++;
      process.stdout.write(`[${count}/${allRoutes.length}] ${route.padEnd(50)} `);
      analyzePage(file, route);
      process.stdout.write(`✅\n`);
    }
  }
  
  // Resultados
  console.log('\n' + '='.repeat(80));
  console.log('📊 RESULTADOS');
  console.log('='.repeat(80));
  
  const bySeverity = {
    CRITICAL: issues.filter(i => i.severity === 'CRITICAL'),
    HIGH: issues.filter(i => i.severity === 'HIGH'),
    MEDIUM: issues.filter(i => i.severity === 'MEDIUM'),
    LOW: issues.filter(i => i.severity === 'LOW'),
  };
  
  console.log(`\n🔴 Críticos: ${bySeverity.CRITICAL.length}`);
  console.log(`🟠 Altos: ${bySeverity.HIGH.length}`);
  console.log(`🟡 Medios: ${bySeverity.MEDIUM.length}`);
  console.log(`🟢 Bajos: ${bySeverity.LOW.length}`);
  console.log(`\n📊 Total issues: ${issues.length}`);
  
  // Top issues críticos
  if (bySeverity.CRITICAL.length > 0) {
    console.log('\n🔴 ISSUES CRÍTICOS:\n');
    bySeverity.CRITICAL.forEach(issue => {
      console.log(`  ${issue.route}`);
      console.log(`    Archivo: ${issue.file}`);
      console.log(`    Error: ${issue.type} - ${issue.message}`);
      if (issue.line) console.log(`    Línea: ${issue.line}`);
    });
  }
  
  // Top issues altos
  if (bySeverity.HIGH.length > 0) {
    console.log('\n🟠 TOP 10 ISSUES ALTOS:\n');
    bySeverity.HIGH.slice(0, 10).forEach(issue => {
      console.log(`  ${issue.route} - ${issue.type}`);
      console.log(`    ${issue.message}`);
    });
    if (bySeverity.HIGH.length > 10) {
      console.log(`  ... y ${bySeverity.HIGH.length - 10} más`);
    }
  }
  
  // Resumen por tipo
  const byType = issues.reduce((acc, issue) => {
    acc[issue.type] = (acc[issue.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  console.log('\n📊 POR TIPO:\n');
  Object.entries(byType)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .forEach(([type, count]) => {
      console.log(`  ${type}: ${count}`);
    });
  
  // Guardar reporte
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalPages: allRoutes.length,
      critical: bySeverity.CRITICAL.length,
      high: bySeverity.HIGH.length,
      medium: bySeverity.MEDIUM.length,
      low: bySeverity.LOW.length,
      total: issues.length,
    },
    issuesByType: Object.entries(byType).sort((a, b) => b[1] - a[1]),
    issues: issues.sort((a, b) => {
      const severityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    }),
  };
  
  fs.writeFileSync(
    '/workspace/static-analysis-report.json',
    JSON.stringify(report, null, 2)
  );
  
  console.log('\n📄 Reporte guardado: static-analysis-report.json\n');
  
  process.exit(bySeverity.CRITICAL.length > 0 ? 1 : 0);
}

main();
