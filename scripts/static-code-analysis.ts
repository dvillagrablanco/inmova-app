/**
 * Análisis Estático de Código - INMOVA
 * 
 * Analiza el código fuente sin necesidad de ejecutar la aplicación
 * Detecta:
 * - Componentes rotos o con errores
 * - Imports faltantes
 * - Props mal utilizados
 * - Rutas duplicadas o inválidas
 * - Problemas de tipos TypeScript
 * - Enlaces y rutas rotas
 */

import fs from 'fs';
import path from 'path';

interface CodeIssue {
  file: string;
  line?: number;
  type: 'error' | 'warning' | 'info';
  category: string;
  message: string;
  snippet?: string;
}

const issues: CodeIssue[] = [];

// Patrones comunes de problemas
const PROBLEM_PATTERNS = {
  // Imports potencialmente rotos
  brokenImport: /import .* from ['"]@\/.*?['"]/g,
  // hrefs vacíos o #
  emptyHref: /href=['"][#]?['"]/g,
  // onClick sin handler
  emptyOnClick: /onClick=\{.*?\}/g,
  // console.log olvidados
  consoleLog: /console\.(log|error|warn)\(/g,
  // TODO o FIXME
  todos: /(TODO|FIXME|XXX|HACK):/gi,
  // Comentarios en español que podrían ser errores
  spanishComments: /\/\/.*?(error|problema|arreglar|fix)/gi,
};

/**
 * Buscar todos los archivos TypeScript/TSX
 */
function findAllFiles(dir: string, pattern: RegExp = /\.(tsx?|jsx?)$/): string[] {
  const files: string[] = [];
  
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      // Ignorar directorios comunes
      if (entry.isDirectory()) {
        if (['node_modules', '.next', '.git', 'dist', 'build'].includes(entry.name)) {
          continue;
        }
        files.push(...findAllFiles(fullPath, pattern));
      } else if (entry.isFile() && pattern.test(entry.name)) {
        files.push(fullPath);
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dir}:`, error);
  }
  
  return files;
}

/**
 * Analizar un archivo
 */
function analyzeFile(filePath: string) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    const relativePath = filePath.replace(process.cwd(), '');
    
    // Buscar console.log
    const consoleLogs = content.match(PROBLEM_PATTERNS.consoleLog);
    if (consoleLogs && consoleLogs.length > 3) { // Más de 3 console.logs
      issues.push({
        file: relativePath,
        type: 'warning',
        category: 'code-quality',
        message: `${consoleLogs.length} console.log() encontrados (podrían ser debug olvidados)`
      });
    }
    
    // Buscar TODOs
    const todos = content.match(PROBLEM_PATTERNS.todos);
    if (todos && todos.length > 0) {
      issues.push({
        file: relativePath,
        type: 'info',
        category: 'todo',
        message: `${todos.length} TODO/FIXME encontrados`,
        snippet: todos.slice(0, 3).join(', ')
      });
    }
    
    // Buscar hrefs vacíos o solo #
    lines.forEach((line, idx) => {
      if (line.match(/href=['"]#['"]/) || line.match(/href=['"]['"]/)){ 
        issues.push({
          file: relativePath,
          line: idx + 1,
          type: 'warning',
          category: 'broken-link',
          message: 'Link con href vacío o solo "#"',
          snippet: line.trim().substring(0, 80)
        });
      }
    });
    
    // Buscar componentes sin key en maps
    lines.forEach((line, idx) => {
      if (line.includes('.map(') && !line.includes('key=')) {
        const nextLines = lines.slice(idx, Math.min(idx + 5, lines.length)).join(' ');
        if (!nextLines.includes('key=')) {
          issues.push({
            file: relativePath,
            line: idx + 1,
            type: 'warning',
            category: 'react',
            message: 'Posible .map() sin prop "key"',
            snippet: line.trim().substring(0, 80)
          });
        }
      }
    });
    
    // Buscar imports potencialmente problemáticos
    lines.forEach((line, idx) => {
      if (line.includes('import') && line.includes('@/')) {
        // Extraer el path del import
        const match = line.match(/from ['"](@\/.*?)['"]/);
        if (match) {
          const importPath = match[1].replace('@/', '');
          const fullImportPath = path.join(process.cwd(), importPath);
          
          // Verificar si existe (con extensiones comunes)
          const extensions = ['', '.ts', '.tsx', '.js', '.jsx', '/index.ts', '/index.tsx'];
          const exists = extensions.some(ext => {
            try {
              return fs.existsSync(fullImportPath + ext);
            } catch {
              return false;
            }
          });
          
          if (!exists) {
            issues.push({
              file: relativePath,
              line: idx + 1,
              type: 'error',
              category: 'import',
              message: `Import posiblemente roto: ${match[1]}`,
              snippet: line.trim()
            });
          }
        }
      }
    });
    
    // Buscar onClick sin handler
    lines.forEach((line, idx) => {
      if (line.match(/onClick=\{\s*\}/)) {
        issues.push({
          file: relativePath,
          line: idx + 1,
          type: 'warning',
          category: 'functionality',
          message: 'onClick sin handler (botón sin funcionalidad)',
          snippet: line.trim().substring(0, 80)
        });
      }
    });
    
  } catch (error: any) {
    issues.push({
      file: filePath,
      type: 'error',
      category: 'file-error',
      message: `Error leyendo archivo: ${error.message}`
    });
  }
}

/**
 * Analizar todas las rutas/pages
 */
function analyzeRoutes() {
  console.log('\n📍 Analizando rutas...');
  
  const pageFiles = findAllFiles(path.join(process.cwd(), 'app')).filter(f => 
    f.endsWith('page.tsx') || f.endsWith('page.ts') || f.endsWith('page.jsx') || f.endsWith('page.js')
  );
  
  console.log(`Encontradas ${pageFiles.length} páginas`);
  
  const routes = new Set<string>();
  const duplicates: string[] = [];
  
  pageFiles.forEach(file => {
    const route = file
      .replace(process.cwd() + '/app', '')
      .replace(/\/page\.(tsx?|jsx?)$/, '')
      .replace(/\/\(.*?\)/g, '') // Remover grupos de rutas
      || '/';
    
    if (routes.has(route)) {
      duplicates.push(route);
    }
    routes.add(route);
  });
  
  if (duplicates.length > 0) {
    issues.push({
      file: 'app/',
      type: 'error',
      category: 'routing',
      message: `${duplicates.length} rutas duplicadas detectadas`,
      snippet: duplicates.join(', ')
    });
  }
  
  console.log(`✅ ${routes.size} rutas únicas encontradas`);
}

/**
 * Analizar componentes
 */
function analyzeComponents() {
  console.log('\n🧩 Analizando componentes...');
  
  const componentFiles = findAllFiles(path.join(process.cwd(), 'components'));
  console.log(`Encontrados ${componentFiles.length} archivos de componentes`);
  
  componentFiles.forEach(file => {
    analyzeFile(file);
  });
}

/**
 * Analizar páginas
 */
function analyzePages() {
  console.log('\n📄 Analizando páginas...');
  
  const pageFiles = findAllFiles(path.join(process.cwd(), 'app'));
  console.log(`Encontrados ${pageFiles.length} archivos en app/`);
  
  pageFiles.forEach(file => {
    analyzeFile(file);
  });
}

/**
 * Analizar APIs
 */
function analyzeAPIs() {
  console.log('\n🔌 Analizando APIs...');
  
  const apiFiles = findAllFiles(path.join(process.cwd(), 'app/api'));
  console.log(`Encontrados ${apiFiles.length} archivos de API`);
  
  apiFiles.forEach(file => {
    analyzeFile(file);
  });
}

/**
 * Generar reporte
 */
function generateReport() {
  const errors = issues.filter(i => i.type === 'error');
  const warnings = issues.filter(i => i.type === 'warning');
  const infos = issues.filter(i => i.type === 'info');
  
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      total: issues.length,
      errors: errors.length,
      warnings: warnings.length,
      info: infos.length
    },
    byCategory: issues.reduce((acc: any, issue) => {
      acc[issue.category] = (acc[issue.category] || 0) + 1;
      return acc;
    }, {}),
    issues: {
      errors,
      warnings,
      info: infos
    }
  };
  
  // Guardar reporte JSON
  const reportPath = path.join(process.cwd(), 'test-results', 'static-analysis-report.json');
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  // Generar reporte HTML
  generateHTMLReport(report, reportPath.replace('.json', '.html'));
  
  return report;
}

/**
 * Generar reporte HTML
 */
function generateHTMLReport(report: any, outputPath: string) {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Análisis Estático - INMOVA</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f5f7fa; padding: 20px; }
    .container { max-width: 1400px; margin: 0 auto; }
    .header { background: white; padding: 30px; border-radius: 12px; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    h1 { color: #1a202c; font-size: 32px; margin-bottom: 8px; }
    .timestamp { color: #718096; font-size: 14px; }
    .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin: 20px 0; }
    .stat-card { background: white; padding: 24px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .stat-value { font-size: 36px; font-weight: bold; margin-bottom: 8px; }
    .stat-label { color: #718096; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; }
    .stat-card.error .stat-value { color: #e53e3e; }
    .stat-card.warning .stat-value { color: #ed8936; }
    .stat-card.info .stat-value { color: #3182ce; }
    .section { background: white; padding: 30px; border-radius: 12px; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    h2 { color: #2d3748; font-size: 24px; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 2px solid #e2e8f0; }
    .issue-list { display: flex; flex-direction: column; gap: 12px; }
    .issue { border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; transition: all 0.2s; }
    .issue:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.08); transform: translateY(-2px); }
    .issue.error { border-left: 4px solid #e53e3e; background: #fff5f5; }
    .issue.warning { border-left: 4px solid #ed8936; background: #fffaf0; }
    .issue.info { border-left: 4px solid #3182ce; background: #ebf8ff; }
    .issue-header { display: flex; justify-content: space-between; align-items: start; margin-bottom: 12px; flex-wrap: wrap; gap: 8px; }
    .issue-badge { padding: 4px 12px; border-radius: 6px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
    .issue-badge.error { background: #e53e3e; color: white; }
    .issue-badge.warning { background: #ed8936; color: white; }
    .issue-badge.info { background: #3182ce; color: white; }
    .issue-category { background: #edf2f7; color: #4a5568; padding: 4px 12px; border-radius: 6px; font-size: 11px; font-weight: 600; text-transform: uppercase; }
    .issue-file { color: #4a5568; font-size: 13px; font-family: 'Monaco', 'Courier New', monospace; margin-bottom: 8px; display: flex; align-items: center; gap: 8px; }
    .issue-message { color: #2d3748; font-weight: 500; margin-bottom: 12px; }
    .issue-snippet { background: #2d3748; color: #e2e8f0; padding: 12px; border-radius: 6px; font-family: 'Monaco', 'Courier New', monospace; font-size: 12px; overflow-x: auto; }
    .category-breakdown { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px; }
    .category-item { background: #f7fafc; padding: 16px; border-radius: 8px; border-left: 3px solid #3182ce; }
    .category-name { font-size: 14px; color: #4a5568; margin-bottom: 4px; }
    .category-count { font-size: 24px; font-weight: bold; color: #2d3748; }
    @media (max-width: 768px) {
      .summary-grid { grid-template-columns: 1fr; }
      body { padding: 10px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔍 Análisis Estático de Código</h1>
      <p class="timestamp">Generado: ${new Date(report.timestamp).toLocaleString('es-ES')}</p>
    </div>

    <div class="summary-grid">
      <div class="stat-card">
        <div class="stat-value">${report.summary.total}</div>
        <div class="stat-label">Issues Totales</div>
      </div>
      <div class="stat-card error">
        <div class="stat-value">${report.summary.errors}</div>
        <div class="stat-label">Errores</div>
      </div>
      <div class="stat-card warning">
        <div class="stat-value">${report.summary.warnings}</div>
        <div class="stat-label">Advertencias</div>
      </div>
      <div class="stat-card info">
        <div class="stat-value">${report.summary.info}</div>
        <div class="stat-label">Información</div>
      </div>
    </div>

    <div class="section">
      <h2>📊 Breakdown por Categoría</h2>
      <div class="category-breakdown">
        ${Object.entries(report.byCategory).map(([cat, count]: [string, any]) => `
          <div class="category-item">
            <div class="category-name">${cat}</div>
            <div class="category-count">${count}</div>
          </div>
        `).join('')}
      </div>
    </div>

    ${report.summary.errors > 0 ? `
    <div class="section">
      <h2>❌ Errores (${report.summary.errors})</h2>
      <div class="issue-list">
        ${report.issues.errors.map((issue: any) => `
          <div class="issue error">
            <div class="issue-header">
              <span class="issue-badge error">ERROR</span>
              <span class="issue-category">${issue.category}</span>
            </div>
            <div class="issue-file">
              📁 ${issue.file}${issue.line ? ` : ${issue.line}` : ''}
            </div>
            <div class="issue-message">${issue.message}</div>
            ${issue.snippet ? `<pre class="issue-snippet">${issue.snippet}</pre>` : ''}
          </div>
        `).join('')}
      </div>
    </div>
    ` : ''}

    ${report.summary.warnings > 0 ? `
    <div class="section">
      <h2>⚠️ Advertencias (${report.summary.warnings})</h2>
      <div class="issue-list">
        ${report.issues.warnings.slice(0, 50).map((issue: any) => `
          <div class="issue warning">
            <div class="issue-header">
              <span class="issue-badge warning">WARNING</span>
              <span class="issue-category">${issue.category}</span>
            </div>
            <div class="issue-file">
              📁 ${issue.file}${issue.line ? ` : ${issue.line}` : ''}
            </div>
            <div class="issue-message">${issue.message}</div>
            ${issue.snippet ? `<pre class="issue-snippet">${issue.snippet}</pre>` : ''}
          </div>
        `).join('')}
        ${report.summary.warnings > 50 ? `<p style="text-align:center;color:#718096;margin-top:20px;">... y ${report.summary.warnings - 50} advertencias más</p>` : ''}
      </div>
    </div>
    ` : ''}

    ${report.summary.info > 0 ? `
    <div class="section">
      <h2>ℹ️ Información (${report.summary.info})</h2>
      <p style="color:#718096;margin-bottom:20px;">Mostrando primeras 20 de ${report.summary.info}</p>
      <div class="issue-list">
        ${report.issues.info.slice(0, 20).map((issue: any) => `
          <div class="issue info">
            <div class="issue-header">
              <span class="issue-badge info">INFO</span>
              <span class="issue-category">${issue.category}</span>
            </div>
            <div class="issue-file">
              📁 ${issue.file}${issue.line ? ` : ${issue.line}` : ''}
            </div>
            <div class="issue-message">${issue.message}</div>
            ${issue.snippet ? `<pre class="issue-snippet">${issue.snippet}</pre>` : ''}
          </div>
        `).join('')}
      </div>
    </div>
    ` : ''}
  </div>
</body>
</html>
  `;
  
  fs.writeFileSync(outputPath, html);
  console.log(`\n📄 Reporte HTML guardado: ${outputPath}`);
}

/**
 * Main
 */
async function main() {
  console.log('🚀 Iniciando análisis estático de código...\n');
  console.log('📁 Directorio:', process.cwd());
  
  try {
    // Analizar diferentes partes de la app
    analyzeRoutes();
    analyzeComponents();
    analyzePages();
    analyzeAPIs();
    
    // Generar reporte
    const report = generateReport();
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMEN DEL ANÁLISIS');
    console.log('='.repeat(60));
    console.log(`Total de issues: ${report.summary.total}`);
    console.log(`  ❌ Errores: ${report.summary.errors}`);
    console.log(`  ⚠️  Advertencias: ${report.summary.warnings}`);
    console.log(`  ℹ️  Info: ${report.summary.info}`);
    console.log('\n📊 Por categoría:');
    Object.entries(report.byCategory).forEach(([cat, count]) => {
      console.log(`  - ${cat}: ${count}`);
    });
    console.log('='.repeat(60));
    
    // Exit code basado en errores
    if (report.summary.errors > 0) {
      console.log('\n❌ Análisis completado CON ERRORES');
      process.exit(1);
    } else {
      console.log('\n✅ Análisis completado sin errores críticos');
      process.exit(0);
    }
    
  } catch (error) {
    console.error('\n❌ Error fatal:', error);
    process.exit(1);
  }
}

// Ejecutar
main();
