#!/usr/bin/env node
/**
 * Script para reemplazar console.log statements con logger estructurado
 * 
 * Uso: node scripts/clean-console-logs.js [--dry-run]
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const DRY_RUN = process.argv.includes('--dry-run');
const ROOT_DIR = path.join(__dirname, '..');

let filesModified = 0;
let statementsReplaced = 0;

console.log('\n🧹 Limpiando console statements...');
if (DRY_RUN) {
  console.log('👁️  Modo DRY RUN - no se modificarán archivos\n');
} else {
  console.log('✏️  Modo WRITE - se modificarán archivos\n');
}

// Buscar archivos con console statements
const findFilesWithConsole = () => {
  try {
    const result = execSync(
      'grep -rl "console\\.log\\|console\\.error\\|console\\.warn" app lib components --include="*.ts" --include="*.tsx"',
      { cwd: ROOT_DIR, encoding: 'utf-8' }
    );
    return result.trim().split('\n').filter(Boolean);
  } catch (error) {
    return [];
  }
};

const processFile = (filePath) => {
  const fullPath = path.join(ROOT_DIR, filePath);
  let content = fs.readFileSync(fullPath, 'utf-8');
  let modified = false;
  let fileReplacements = 0;
  
  // Skip files that already import logger
  const hasLogger = content.includes("from '@/lib/logger'") || 
                    content.includes('from "@/lib/logger"');
  
  // Replace console.log
  const consoleLogRegex = /console\.log\(([^)]+)\)/g;
  const matches = content.match(consoleLogRegex);
  
  if (matches) {
    // Add logger import if not present
    if (!hasLogger && !DRY_RUN) {
      // Find the last import statement
      const importRegex = /import .+ from ['"][^'"]+['"];?/g;
      const imports = content.match(importRegex);
      if (imports && imports.length > 0) {
        const lastImport = imports[imports.length - 1];
        const importIndex = content.lastIndexOf(lastImport);
        const insertPosition = importIndex + lastImport.length;
        content = content.slice(0, insertPosition) + 
                 "\nimport logger from '@/lib/logger';" +
                 content.slice(insertPosition);
        modified = true;
      }
    }
    
    // Replace console.log with logger.info
    content = content.replace(consoleLogRegex, (match, args) => {
      fileReplacements++;
      return `logger.info(${args})`;
    });
    modified = true;
  }
  
  // Replace console.error
  const consoleErrorRegex = /console\.error\(([^)]+)\)/g;
  if (consoleErrorRegex.test(content)) {
    content = content.replace(consoleErrorRegex, (match, args) => {
      fileReplacements++;
      return `logger.error(${args})`;
    });
    modified = true;
  }
  
  // Replace console.warn
  const consoleWarnRegex = /console\.warn\(([^)]+)\)/g;
  if (consoleWarnRegex.test(content)) {
    content = content.replace(consoleWarnRegex, (match, args) => {
      fileReplacements++;
      return `logger.warn(${args})`;
    });
    modified = true;
  }
  
  if (modified) {
    if (!DRY_RUN) {
      fs.writeFileSync(fullPath, content, 'utf-8');
    }
    filesModified++;
    statementsReplaced += fileReplacements;
    console.log(`✓ ${filePath} (${fileReplacements} reemplazos)`);
  }
};

const files = findFilesWithConsole();

if (files.length === 0) {
  console.log('✅ No se encontraron console statements para limpiar');
  process.exit(0);
}

console.log(`Encontrados ${files.length} archivos con console statements\n`);

files.forEach(processFile);

console.log('\n' + '='.repeat(60));
console.log('RESUMEN');
console.log('='.repeat(60));
console.log(`Archivos modificados: ${filesModified}`);
console.log(`Statements reemplazados: ${statementsReplaced}`);

if (DRY_RUN) {
  console.log('\n💡 Ejecutar sin --dry-run para aplicar los cambios');
} else {
  console.log('\n✅ ¡Limpieza completada!');
  console.log('\n⚠️  IMPORTANTE: Revisar los cambios y asegurar que el logger está correctamente importado.');
  console.log('Ejecutar: yarn tsc --noEmit para verificar que no hay errores de tipos.');
}
