/**
 * Script Automatizado: Aplicar Rate Limiting a APIs
 * 
 * Este script analiza todos los API routes y aplica automáticamente
 * rate limiting según el tipo de endpoint.
 * 
 * Uso:
 *   npx tsx scripts/apply-rate-limiting.ts --dry-run
 *   npx tsx scripts/apply-rate-limiting.ts --apply
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

// ============================================================================
// CONFIGURACIÓN
// ============================================================================

const API_DIR = path.join(process.cwd(), 'app', 'api');
const DRY_RUN = process.argv.includes('--dry-run');
const APPLY = process.argv.includes('--apply');

// Patrones de rate limiting por tipo de endpoint
const RATE_LIMIT_PATTERNS = {
  auth: {
    pattern: /(auth|login|register|password)/i,
    limiter: 'withAuthRateLimit',
  },
  payment: {
    pattern: /(payment|stripe|checkout|subscription)/i,
    limiter: 'withPaymentRateLimit',
  },
  write: {
    pattern: /export\s+async\s+function\s+(POST|PUT|DELETE|PATCH)/i,
    limiter: 'withRateLimit',
  },
  default: {
    pattern: /.*/,
    limiter: 'withRateLimit',
  },
};

// ============================================================================
// FUNCIONES HELPER
// ============================================================================

/**
 * Detecta si un archivo ya tiene rate limiting
 */
function hasRateLimiting(content: string): boolean {
  return (
    content.includes('withRateLimit') ||
    content.includes('withAuthRateLimit') ||
    content.includes('withPaymentRateLimit')
  );
}

/**
 * Detecta el tipo de rate limiting apropiado
 */
function detectRateLimitType(filePath: string, content: string): string {
  // 1. Auth endpoints
  if (RATE_LIMIT_PATTERNS.auth.pattern.test(filePath)) {
    return 'withAuthRateLimit';
  }

  // 2. Payment endpoints
  if (RATE_LIMIT_PATTERNS.payment.pattern.test(filePath)) {
    return 'withPaymentRateLimit';
  }

  // 3. Default
  return 'withRateLimit';
}

/**
 * Aplica rate limiting a un archivo
 */
function applyRateLimiting(
  filePath: string,
  content: string,
  limiter: string
): string {
  // 1. Agregar import si no existe
  if (!content.includes('from @/lib/rate-limiting')) {
    const importLine = `import { ${limiter} } from '@/lib/rate-limiting';\n`;
    
    // Insertar después del último import
    const lastImportIndex = content.lastIndexOf('import ');
    if (lastImportIndex !== -1) {
      const nextLineBreak = content.indexOf('\n', lastImportIndex);
      content =
        content.slice(0, nextLineBreak + 1) +
        importLine +
        content.slice(nextLineBreak + 1);
    } else {
      // No hay imports, agregar al inicio
      content = importLine + content;
    }
  }

  // 2. Envolver handlers con rate limiting
  const httpMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];

  httpMethods.forEach((method) => {
    // Patrón: export async function METHOD(req: NextRequest) {
    const pattern = new RegExp(
      `export\\s+async\\s+function\\s+${method}\\s*\\(\\s*req:\\s*NextRequest`,
      'g'
    );

    if (pattern.test(content)) {
      // Reemplazar función para envolverla con rate limiting
      content = content.replace(
        new RegExp(
          `(export\\s+async\\s+function\\s+${method}\\s*\\(\\s*req:\\s*NextRequest[^{]*\\{)`,
          'g'
        ),
        `$1\n  return ${limiter}(req, async () => {`
      );

      // Cerrar el wrapper al final de la función
      // Buscar el último } de la función
      const lines = content.split('\n');
      let bracketCount = 0;
      let inFunction = false;
      let insertIndex = -1;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        if (
          line.match(
            new RegExp(`export\\s+async\\s+function\\s+${method}`)
          )
        ) {
          inFunction = true;
        }

        if (inFunction) {
          bracketCount += (line.match(/\{/g) || []).length;
          bracketCount -= (line.match(/\}/g) || []).length;

          if (bracketCount === 0 && line.includes('}')) {
            insertIndex = i;
            break;
          }
        }
      }

      if (insertIndex !== -1) {
        lines[insertIndex] = lines[insertIndex].replace(
          /\}(\s*)$/,
          '  });\n}'
        );
        content = lines.join('\n');
      }
    }
  });

  return content;
}

// ============================================================================
// FUNCIÓN PRINCIPAL
// ============================================================================

async function main() {
  console.log('🔍 Analizando API routes...\n');

  // 1. Buscar todos los route.ts
  const pattern = path.join(API_DIR, '**', 'route.ts');
  const files = glob.sync(pattern, {
    ignore: ['**/node_modules/**', '**/.next/**'],
  });

  console.log(`📊 Total de API routes encontrados: ${files.length}\n`);

  // 2. Analizar cada archivo
  const stats = {
    total: files.length,
    withRateLimiting: 0,
    withoutRateLimiting: 0,
    modified: 0,
    errors: 0,
  };

  const toModify: Array<{ file: string; limiter: string }> = [];

  for (const file of files) {
    try {
      const content = fs.readFileSync(file, 'utf-8');

      if (hasRateLimiting(content)) {
        stats.withRateLimiting++;
        console.log(`✅ ${path.relative(API_DIR, file)} - Ya tiene rate limiting`);
      } else {
        stats.withoutRateLimiting++;
        const limiter = detectRateLimitType(file, content);
        toModify.push({ file, limiter });
        console.log(
          `⚠️  ${path.relative(API_DIR, file)} - Necesita ${limiter}`
        );
      }
    } catch (error) {
      stats.errors++;
      console.error(`❌ Error leyendo ${file}:`, error);
    }
  }

  console.log('\n📊 ESTADÍSTICAS:\n');
  console.log(`Total de APIs: ${stats.total}`);
  console.log(`✅ Con rate limiting: ${stats.withRateLimiting} (${Math.round((stats.withRateLimiting / stats.total) * 100)}%)`);
  console.log(`⚠️  Sin rate limiting: ${stats.withoutRateLimiting} (${Math.round((stats.withoutRateLimiting / stats.total) * 100)}%)`);
  console.log(`❌ Errores: ${stats.errors}\n`);

  // 3. Aplicar cambios si --apply está presente
  if (APPLY && toModify.length > 0) {
    console.log(`\n🚀 Aplicando rate limiting a ${toModify.length} archivos...\n`);

    for (const { file, limiter } of toModify) {
      try {
        const content = fs.readFileSync(file, 'utf-8');
        const modified = applyRateLimiting(file, content, limiter);

        fs.writeFileSync(file, modified, 'utf-8');
        stats.modified++;
        console.log(`✅ Modificado: ${path.relative(API_DIR, file)}`);
      } catch (error) {
        console.error(`❌ Error modificando ${file}:`, error);
      }
    }

    console.log(`\n✅ ${stats.modified} archivos modificados exitosamente\n`);
  } else if (!APPLY && toModify.length > 0) {
    console.log('\n💡 Para aplicar los cambios, ejecuta:');
    console.log('   npx tsx scripts/apply-rate-limiting.ts --apply\n');
  }

  // 4. Generar reporte
  if (DRY_RUN || APPLY) {
    const reportPath = path.join(process.cwd(), 'RATE_LIMITING_REPORT.md');
    const report = `# 🔒 Reporte de Rate Limiting

**Fecha**: ${new Date().toLocaleDateString('es-ES')}  
**Total de APIs**: ${stats.total}

## Resumen

- ✅ **Con rate limiting**: ${stats.withRateLimiting} (${Math.round((stats.withRateLimiting / stats.total) * 100)}%)
- ⚠️  **Sin rate limiting**: ${stats.withoutRateLimiting} (${Math.round((stats.withoutRateLimiting / stats.total) * 100)}%)
- ✏️  **Modificados**: ${stats.modified}
- ❌ **Errores**: ${stats.errors}

## APIs Sin Rate Limiting

${toModify.length > 0 ? toModify.map(({ file, limiter }) => `- \`${path.relative(API_DIR, file)}\` → ${limiter}`).join('\n') : 'Ninguno'}

## Próximos Pasos

${stats.withoutRateLimiting > 0 ? `1. Revisar manualmente los ${toModify.length} archivos pendientes
2. Ejecutar \`npx tsx scripts/apply-rate-limiting.ts --apply\`
3. Hacer commit de los cambios
4. Deployment a producción` : '✅ Todos los endpoints tienen rate limiting'}

---

**Generado automáticamente por**: scripts/apply-rate-limiting.ts
`;

    fs.writeFileSync(reportPath, report, 'utf-8');
    console.log(`📄 Reporte generado en: ${reportPath}\n`);
  }
}

// ============================================================================
// EJECUTAR
// ============================================================================

main().catch((error) => {
  console.error('❌ Error fatal:', error);
  process.exit(1);
});
