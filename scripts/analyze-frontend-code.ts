/**
 * 🔍 ANÁLISIS ESTÁTICO DEL CÓDIGO FRONTEND
 * 
 * Revisa el código fuente en busca de patrones problemáticos
 * sin necesidad de ejecutar el servidor.
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

// ============================================================================
// CONFIGURACIÓN
// ============================================================================

const APP_DIR = path.join(process.cwd(), 'app');
const COMPONENTS_DIR = path.join(process.cwd(), 'components');

interface CodeIssue {
  file: string;
  line: number;
  type: 'error' | 'warning' | 'info';
  category: string;
  message: string;
  code?: string;
}

const allIssues: CodeIssue[] = [];

// ============================================================================
// PATTERNS PROBLEMÁTICOS
// ============================================================================

const PROBLEMATIC_PATTERNS = [
  {
    pattern: /console\.(log|debug|info)/g,
    category: 'Console Logs',
    message: 'console.log() dejado en código de producción',
    type: 'warning' as const,
  },
  {
    pattern: /debugger/g,
    category: 'Debugger',
    message: 'debugger statement dejado en código',
    type: 'error' as const,
  },
  {
    pattern: /TODO|FIXME|HACK|XXX/g,
    category: 'TODO Comments',
    message: 'Comentario TODO/FIXME pendiente',
    type: 'info' as const,
  },
  {
    pattern: /dangerouslySetInnerHTML/g,
    category: 'Security',
    message: 'Uso de dangerouslySetInnerHTML (riesgo XSS)',
    type: 'warning' as const,
  },
  {
    pattern: /eval\(/g,
    category: 'Security',
    message: 'Uso de eval() (riesgo de seguridad)',
    type: 'error' as const,
  },
  {
    pattern: /window\.location\.href\s*=\s*[^;]+;/g,
    category: 'Navigation',
    message: 'Uso de window.location.href (preferir Next.js router)',
    type: 'info' as const,
  },
  {
    pattern: /<img(?![^>]*alt=)/g,
    category: 'Accessibility',
    message: 'Imagen sin atributo alt (problema de accesibilidad)',
    type: 'warning' as const,
  },
  {
    pattern: /onClick={[^}]*}\s+(?!onKeyDown)/g,
    category: 'Accessibility',
    message: 'onClick sin onKeyDown (problema de accesibilidad)',
    type: 'info' as const,
  },
  {
    pattern: /useEffect\(\(\)\s*=>\s*\{[^}]*\},\s*\[\]\)/g,
    category: 'React Hooks',
    message: 'useEffect con dependencias vacías (verificar si es correcto)',
    type: 'info' as const,
  },
  {
    pattern: /any/g,
    category: 'TypeScript',
    message: 'Uso de tipo "any" (debilita type safety)',
    type: 'info' as const,
  },
];

// ============================================================================
// ANÁLISIS
// ============================================================================

/**
 * Analiza un archivo en busca de patrones problemáticos
 */
function analyzeFile(filePath: string) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  PROBLEMATIC_PATTERNS.forEach((pattern) => {
    lines.forEach((line, index) => {
      if (pattern.pattern.test(line)) {
        // Ignorar comentarios para algunos patterns
        if (line.trim().startsWith('//') && pattern.category !== 'TODO Comments') {
          return;
        }

        allIssues.push({
          file: path.relative(process.cwd(), filePath),
          line: index + 1,
          type: pattern.type,
          category: pattern.category,
          message: pattern.message,
          code: line.trim().substring(0, 100),
        });
      }
    });
  });
}

/**
 * Analiza imports problemáticos
 */
function checkImports(filePath: string) {
  const content = fs.readFileSync(filePath, 'utf-8');

  // Verificar imports relativos profundos
  const deepImports = content.match(/import .* from ['"](\.\.|\.\/.*\/.*\/.*)['"];/g);
  if (deepImports && deepImports.length > 3) {
    allIssues.push({
      file: path.relative(process.cwd(), filePath),
      line: 1,
      type: 'warning',
      category: 'Imports',
      message: `${deepImports.length} imports relativos profundos (considerar aliases @/)`,
    });
  }

  // Verificar imports sin usar (simplificado)
  const importedNames = [...content.matchAll(/import\s+(?:\{\s*([\w\s,]+)\s*\}|(\w+))\s+from/g)]
    .map((m) => m[1] || m[2])
    .filter(Boolean);

  importedNames.forEach((importName) => {
    if (!importName) return;
    const names = importName.split(',').map((n) => n.trim());
    names.forEach((name) => {
      const usage = new RegExp(`\\b${name}\\b`, 'g');
      const usageCount = (content.match(usage) || []).length;
      if (usageCount === 1) {
        // Solo aparece en el import
        allIssues.push({
          file: path.relative(process.cwd(), filePath),
          line: 1,
          type: 'info',
          category: 'Imports',
          message: `Import "${name}" posiblemente no usado`,
        });
      }
    });
  });
}

/**
 * Verifica estructura de componentes
 */
function checkComponentStructure(filePath: string) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  // Verificar 'use client' en archivos que lo necesitan
  const hasUseClient = content.includes("'use client'") || content.includes('"use client"');
  const hasClientOnlyFeatures =
    content.includes('useState') ||
    content.includes('useEffect') ||
    content.includes('onClick') ||
    content.includes('onSubmit');

  if (hasClientOnlyFeatures && !hasUseClient && filePath.startsWith('app/')) {
    allIssues.push({
      file: path.relative(process.cwd(), filePath),
      line: 1,
      type: 'warning',
      category: 'Next.js',
      message: 'Usa features de cliente sin directiva "use client"',
    });
  }

  // Verificar componentes muy grandes
  if (lines.length > 500) {
    allIssues.push({
      file: path.relative(process.cwd(), filePath),
      line: 1,
      type: 'info',
      category: 'Code Quality',
      message: `Archivo muy grande (${lines.length} líneas). Considerar dividir en componentes más pequeños`,
    });
  }
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log('🔍 Iniciando análisis estático del frontend...\n');

  // Buscar todos los archivos TypeScript/TSX
  const files = glob.sync('**/*.{ts,tsx}', {
    cwd: process.cwd(),
    ignore: [
      '**/node_modules/**',
      '**/.next/**',
      '**/dist/**',
      '**/build/**',
      '**/*.spec.ts',
      '**/*.test.ts',
      '**/*.disabled',
    ],
    absolute: true,
  });

  console.log(`📊 Analizando ${files.length} archivos...\n`);

  // Analizar cada archivo
  files.forEach((file) => {
    try {
      analyzeFile(file);
      checkImports(file);
      checkComponentStructure(file);
    } catch (error) {
      console.error(`❌ Error analizando ${file}:`, error);
    }
  });

  // Generar reporte
  console.log('\n' + '='.repeat(80));
  console.log('📊 RESUMEN DE ANÁLISIS ESTÁTICO');
  console.log('='.repeat(80));
  console.log(`Archivos analizados: ${files.length}`);
  console.log(`Issues encontrados: ${allIssues.length}`);
  console.log(
    `  - Errores: ${allIssues.filter((i) => i.type === 'error').length}`
  );
  console.log(
    `  - Warnings: ${allIssues.filter((i) => i.type === 'warning').length}`
  );
  console.log(
    `  - Info: ${allIssues.filter((i) => i.type === 'info').length}`
  );
  console.log('='.repeat(80));

  // Agrupar por categoría
  const byCategory: Record<string, CodeIssue[]> = {};
  allIssues.forEach((issue) => {
    if (!byCategory[issue.category]) {
      byCategory[issue.category] = [];
    }
    byCategory[issue.category].push(issue);
  });

  console.log('\n📋 Issues por Categoría:\n');
  Object.entries(byCategory)
    .sort((a, b) => b[1].length - a[1].length)
    .forEach(([category, issues]) => {
      console.log(`  ${category}: ${issues.length}`);
    });

  // Top 10 archivos con más issues
  const fileIssues: Record<string, number> = {};
  allIssues.forEach((issue) => {
    fileIssues[issue.file] = (fileIssues[issue.file] || 0) + 1;
  });

  const topFiles = Object.entries(fileIssues)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  console.log('\n📁 Top 10 Archivos con Más Issues:\n');
  topFiles.forEach(([file, count]) => {
    console.log(`  ${file}: ${count} issues`);
  });

  // Guardar reporte JSON
  const reportPath = path.join(process.cwd(), 'frontend-code-analysis-report.json');
  fs.writeFileSync(reportPath, JSON.stringify({ issues: allIssues }, null, 2));
  console.log(`\n📄 Reporte JSON guardado en: ${reportPath}`);

  // Generar reporte Markdown
  generateMarkdownReport(allIssues, byCategory, topFiles);

  console.log('\n✅ Análisis completado\n');
}

/**
 * Genera reporte en Markdown
 */
function generateMarkdownReport(
  issues: CodeIssue[],
  byCategory: Record<string, CodeIssue[]>,
  topFiles: [string, number][]
) {
  let markdown = `# 🔍 Reporte de Análisis Estático Frontend

**Fecha**: ${new Date().toISOString()}  
**Archivos analizados**: ${glob.sync('**/*.{ts,tsx}', { ignore: ['**/node_modules/**', '**/.next/**'] }).length}  
**Issues encontrados**: ${issues.length}

---

## 📊 Resumen

| Tipo | Cantidad |
|------|----------|
| **Errores** | ${issues.filter((i) => i.type === 'error').length} |
| **Warnings** | ${issues.filter((i) => i.type === 'warning').length} |
| **Info** | ${issues.filter((i) => i.type === 'info').length} |

---

## 📋 Issues por Categoría

${Object.entries(byCategory)
    .sort((a, b) => b[1].length - a[1].length)
    .map(
      ([category, catIssues]) => `### ${category} (${catIssues.length})

${catIssues
  .slice(0, 10)
  .map(
    (issue) => `- **[${issue.type.toUpperCase()}]** \`${issue.file}:${issue.line}\` - ${issue.message}
  \`\`\`typescript
  ${issue.code || 'N/A'}
  \`\`\`
`
  )
  .join('\n')}`
    )
    .join('\n\n')}

---

## 📁 Top 10 Archivos con Más Issues

| Archivo | Issues |
|---------|--------|
${topFiles.map(([file, count]) => `| \`${file}\` | ${count} |`).join('\n')}

---

## 🎯 Recomendaciones

### Prioridad Alta (Errores)

${issues
    .filter((i) => i.type === 'error')
    .slice(0, 5)
    .map((issue) => `- [ ] \`${issue.file}:${issue.line}\` - ${issue.message}`)
    .join('\n') || 'Sin errores críticos'}

### Prioridad Media (Warnings)

${issues
    .filter((i) => i.type === 'warning')
    .slice(0, 5)
    .map((issue) => `- [ ] \`${issue.file}:${issue.line}\` - ${issue.message}`)
    .join('\n') || 'Sin warnings'}

### Mejoras Sugeridas

- [ ] Eliminar console.logs de producción
- [ ] Revisar uso de "any" en TypeScript
- [ ] Mejorar accesibilidad (alt en imágenes, onKeyDown en onClick)
- [ ] Optimizar imports (usar aliases @/)
- [ ] Refactorizar componentes grandes (>500 líneas)

---

**Última actualización**: ${new Date().toLocaleDateString('es-ES')}  
**Generado por**: scripts/analyze-frontend-code.ts
`;

  const mdPath = path.join(process.cwd(), 'FRONTEND_CODE_ANALYSIS.md');
  fs.writeFileSync(mdPath, markdown);
  console.log(`📄 Reporte Markdown guardado en: ${mdPath}`);
}

// ============================================================================
// EJECUTAR
// ============================================================================

main().catch((error) => {
  console.error('❌ Error fatal:', error);
  process.exit(1);
});
