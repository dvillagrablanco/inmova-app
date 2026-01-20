#!/usr/bin/env npx tsx
/**
 * Script para limpiar console.log/error/warn en archivos de producción
 * Los reemplaza por el logger estructurado
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

const DRY_RUN = process.argv.includes('--dry-run');
const VERBOSE = process.argv.includes('--verbose');

// Directorios a procesar
const DIRECTORIES = ['app/api', 'lib'];

// Archivos a excluir
const EXCLUDE_FILES = [
  'lib/logger.ts',  // No modificar el propio logger
  'lib/db.ts',      // Logs de conexión necesarios
];

// Patrones de console que vamos a reemplazar
const CONSOLE_PATTERNS = {
  'console.error': 'logger.error',
  'console.warn': 'logger.warn',
  // console.log lo dejamos solo si es en desarrollo
};

async function processFile(filePath: string): Promise<{ modified: boolean; changes: string[] }> {
  const changes: string[] = [];
  let content = fs.readFileSync(filePath, 'utf-8');
  const originalContent = content;

  // Verificar si ya tiene import del logger
  const hasLoggerImport = content.includes("import logger") || 
                          content.includes("from '@/lib/logger'") ||
                          content.includes('from "@/lib/logger"');

  // Verificar si tiene console.error o console.warn
  const hasConsoleError = content.includes('console.error');
  const hasConsoleWarn = content.includes('console.warn');

  if (!hasConsoleError && !hasConsoleWarn) {
    return { modified: false, changes: [] };
  }

  // Si no tiene import del logger, añadirlo
  if (!hasLoggerImport && (hasConsoleError || hasConsoleWarn)) {
    // Buscar la última línea de import
    const importLines = content.match(/^import.*from.*['"].*['"];?\s*$/gm);
    
    if (importLines && importLines.length > 0) {
      const lastImport = importLines[importLines.length - 1];
      const lastImportIndex = content.lastIndexOf(lastImport);
      const insertPosition = lastImportIndex + lastImport.length;
      
      // Verificar si ya existe una importación de logger
      if (!content.includes("import logger") && !content.includes("logError")) {
        const loggerImport = "\nimport logger from '@/lib/logger';";
        content = content.slice(0, insertPosition) + loggerImport + content.slice(insertPosition);
        changes.push('+ Added logger import');
      }
    }
  }

  // Reemplazar console.error con logger.error
  if (hasConsoleError) {
    // Patrón para capturar console.error con su mensaje
    const errorRegex = /console\.error\s*\(\s*(['"`].*?['"`])\s*,?\s*(.*?)\s*\)/g;
    const errorRegexSimple = /console\.error\s*\(/g;
    
    // Contar reemplazos
    const matches = content.match(/console\.error/g);
    if (matches) {
      content = content.replace(/console\.error\(/g, 'logger.error(');
      changes.push(`- Replaced ${matches.length} console.error calls`);
    }
  }

  // Reemplazar console.warn con logger.warn
  if (hasConsoleWarn) {
    const matches = content.match(/console\.warn/g);
    if (matches) {
      content = content.replace(/console\.warn\(/g, 'logger.warn(');
      changes.push(`- Replaced ${matches.length} console.warn calls`);
    }
  }

  const modified = content !== originalContent;

  if (modified && !DRY_RUN) {
    fs.writeFileSync(filePath, content, 'utf-8');
  }

  return { modified, changes };
}

async function main() {
  console.log('🧹 Limpieza de console.log/error/warn en archivos de producción');
  console.log(DRY_RUN ? '📋 Modo DRY RUN - No se modificarán archivos\n' : '✏️  Modo WRITE - Se modificarán archivos\n');

  let totalFiles = 0;
  let modifiedFiles = 0;
  const allChanges: { file: string; changes: string[] }[] = [];

  for (const dir of DIRECTORIES) {
    const dirPath = path.join(process.cwd(), dir);
    if (!fs.existsSync(dirPath)) {
      console.log(`⚠️  Directorio no encontrado: ${dir}`);
      continue;
    }

    const files = await glob(`${dir}/**/*.ts`, { 
      ignore: ['**/node_modules/**', '**/*.test.ts', '**/*.spec.ts']
    });

    for (const file of files) {
      if (EXCLUDE_FILES.some(excluded => file.includes(excluded))) {
        continue;
      }

      totalFiles++;
      const result = await processFile(file);

      if (result.modified) {
        modifiedFiles++;
        allChanges.push({ file, changes: result.changes });

        if (VERBOSE) {
          console.log(`📝 ${file}`);
          result.changes.forEach(change => console.log(`   ${change}`));
        }
      }
    }
  }

  console.log('\n📊 Resumen:');
  console.log(`   Archivos analizados: ${totalFiles}`);
  console.log(`   Archivos modificados: ${modifiedFiles}`);

  if (allChanges.length > 0 && !VERBOSE) {
    console.log('\n📄 Archivos modificados:');
    allChanges.forEach(({ file, changes }) => {
      console.log(`   ${file}`);
      changes.forEach(change => console.log(`      ${change}`));
    });
  }

  if (DRY_RUN && modifiedFiles > 0) {
    console.log('\n💡 Para aplicar los cambios, ejecuta sin --dry-run');
  }
}

main().catch(console.error);
