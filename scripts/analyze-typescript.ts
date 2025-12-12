#!/usr/bin/env tsx
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

interface FileAnalysis {
  file: string;
  issues: string[];
  severity: 'low' | 'medium' | 'high';
}

const DIRECTORIES_TO_SCAN = ['app', 'lib', 'components'];
const IGNORE_PATTERNS = [
  'node_modules',
  '.next',
  '.build',
  'dist',
  'coverage',
];

const results: FileAnalysis[] = [];

function analyzeFile(filePath: string): FileAnalysis | null {
  const content = fs.readFileSync(filePath, 'utf-8');
  const issues: string[] = [];
  let severity: 'low' | 'medium' | 'high' = 'low';

  // 1. Detectar console.log no removidos
  const consoleMatches = content.match(/console\.(log|error|warn|info)/g);
  if (consoleMatches && consoleMatches.length > 0) {
    issues.push(`${consoleMatches.length} console statements encontrados (deberían usar logger)`);
    severity = 'medium';
  }

  // 2. Detectar imports no utilizados (patrón básico)
  const importLines = content.match(/^import .* from .*$/gm);
  if (importLines) {
    importLines.forEach((importLine) => {
      const imported = importLine.match(/import\s+\{([^}]+)\}/)?.[1];
      if (imported) {
        const symbols = imported.split(',').map((s) => s.trim());
        symbols.forEach((symbol) => {
          // Buscar si el símbolo se usa después del import
          const usage = new RegExp(`[^import]${symbol}[^:]`, 'g').test(
            content
          );
          if (!usage && !symbol.includes('type')) {
            issues.push(
              `Posible import no utilizado: ${symbol} (verificar manualmente)`
            );
          }
        });
      }
    });
  }

  // 3. Detectar TODOs y FIXMEs
  const todoMatches = content.match(
    /\/\/\s*(TODO|FIXME|XXX|HACK):.*/gi
  );
  if (todoMatches && todoMatches.length > 0) {
    issues.push(
      `${todoMatches.length} TODOs/FIXMEs pendientes: ${todoMatches.join(', ')}`
    );
  }

  // 4. Detectar código comentado extenso
  const commentedCodeBlocks = content.match(
    /\/\*[\s\S]{100,}?\*\/|\/\/.*\n(\/\/.*\n){5,}/g
  );
  if (commentedCodeBlocks && commentedCodeBlocks.length > 0) {
    issues.push(
      `${commentedCodeBlocks.length} bloques grandes de código comentado`
    );
    severity = 'medium';
  }

  // 5. Detectar funciones muy largas (>100 líneas)
  const functionMatches = content.match(
    /(function|const)\s+\w+\s*[=\(][\s\S]*?\{[\s\S]*?\}/g
  );
  if (functionMatches) {
    functionMatches.forEach((func) => {
      const lines = func.split('\n').length;
      if (lines > 100) {
        issues.push(
          `Función muy larga (${lines} líneas) - considerar refactorizar`
        );
        severity = 'high';
      }
    });
  }

  // 6. Detectar múltiples useState consecutivos (>5)
  const useStateMatches = content.match(/useState/g);
  if (useStateMatches && useStateMatches.length > 10) {
    issues.push(
      `${useStateMatches.length} useState encontrados - considerar useReducer o custom hook`
    );
    severity = 'medium';
  }

  // 7. Detectar posibles memory leaks
  const hasEventListener = /addEventListener|on[A-Z]/.test(content);
  const hasCleanup =
    /removeEventListener|return\s*\(\)|return\s*\{/.test(content);
  if (hasEventListener && !hasCleanup) {
    issues.push(
      'Posible memory leak: addEventListener sin cleanup en useEffect'
    );
    severity = 'high';
  }

  return issues.length > 0 ? { file: filePath, issues, severity } : null;
}

function scanDirectory(dir: string) {
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      if (!IGNORE_PATTERNS.some((pattern) => filePath.includes(pattern))) {
        scanDirectory(filePath);
      }
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      const analysis = analyzeFile(filePath);
      if (analysis) {
        results.push(analysis);
      }
    }
  });
}

// Ejecutar análisis
console.log('🔍 Analizando código TypeScript...');
console.log('');

DIRECTORIES_TO_SCAN.forEach((dir) => {
  if (fs.existsSync(dir)) {
    scanDirectory(dir);
  }
});

// Generar reporte
console.log('📊 REPORTE DE ANÁLISIS DE CÓDIGO');
console.log('='.repeat(80));
console.log('');

const highSeverity = results.filter((r) => r.severity === 'high');
const mediumSeverity = results.filter((r) => r.severity === 'medium');
const lowSeverity = results.filter((r) => r.severity === 'low');

console.log(`🔴 Problemas de alta severidad: ${highSeverity.length}`);
console.log(`🟡 Problemas de severidad media: ${mediumSeverity.length}`);
console.log(`🟢 Problemas de baja severidad: ${lowSeverity.length}`);
console.log('');

if (highSeverity.length > 0) {
  console.log('🔴 PROBLEMAS DE ALTA SEVERIDAD:');
  console.log('-'.repeat(80));
  highSeverity.slice(0, 10).forEach((result) => {
    console.log(`\n📄 ${result.file}`);
    result.issues.forEach((issue) => console.log(`   - ${issue}`));
  });
  console.log('');
}

if (mediumSeverity.length > 0) {
  console.log('🟡 PROBLEMAS DE SEVERIDAD MEDIA (primeros 10):');
  console.log('-'.repeat(80));
  mediumSeverity.slice(0, 10).forEach((result) => {
    console.log(`\n📄 ${result.file}`);
    result.issues.forEach((issue) => console.log(`   - ${issue}`));
  });
  console.log('');
}

console.log('');
console.log('💡 RECOMENDACIONES:');
console.log('-'.repeat(80));
console.log('1. Reemplazar todos los console.log con el logger estructurado');
console.log('2. Remover código comentado innecesario');
console.log('3. Refactorizar funciones largas en componentes más pequeños');
console.log('4. Implementar cleanup en useEffect con event listeners');
console.log('5. Considerar useReducer para componentes con muchos useState');
console.log('');
console.log('📝 Para más detalles, revisa los archivos mencionados arriba.');
console.log('');

// Guardar reporte en JSON
const reportPath = 'analysis-report.json';
fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
console.log(`📊 Reporte completo guardado en: ${reportPath}`);
