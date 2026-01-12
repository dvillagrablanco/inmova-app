/**
 * Script para agregar export const runtime = 'nodejs' a todas las APIs que usan Prisma
 * y no tienen el runtime especificado.
 * 
 * Ejecutar: npx tsx scripts/fix-api-runtime.ts
 */

import * as fs from 'fs';
import * as path from 'path';

const API_DIR = path.join(process.cwd(), 'app/api');

function findRouteFiles(dir: string): string[] {
  const files: string[] = [];
  
  const items = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    
    if (item.isDirectory()) {
      files.push(...findRouteFiles(fullPath));
    } else if (item.name === 'route.ts') {
      files.push(fullPath);
    }
  }
  
  return files;
}

function needsRuntimeFix(content: string): boolean {
  // Verifica si usa prisma y no tiene runtime
  const usesPrisma = content.includes("import { prisma }") || 
                     content.includes("from '@/lib/db'") ||
                     content.includes('from "@/lib/db"');
  const hasRuntime = content.includes("export const runtime");
  
  return usesPrisma && !hasRuntime;
}

function fixRuntime(content: string): string {
  // Buscar la línea con export const dynamic
  if (content.includes("export const dynamic = 'force-dynamic';")) {
    // Agregar runtime después de dynamic
    return content.replace(
      "export const dynamic = 'force-dynamic';",
      "export const dynamic = 'force-dynamic';\nexport const runtime = 'nodejs';"
    );
  } else if (content.includes('export const dynamic = "force-dynamic";')) {
    return content.replace(
      'export const dynamic = "force-dynamic";',
      'export const dynamic = "force-dynamic";\nexport const runtime = "nodejs";'
    );
  } else {
    // Si no tiene dynamic, agregar ambos al inicio después de imports
    const lines = content.split('\n');
    let lastImportIndex = -1;
    
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith('import ') || lines[i].startsWith("import{")) {
        lastImportIndex = i;
      }
    }
    
    if (lastImportIndex >= 0) {
      lines.splice(lastImportIndex + 1, 0, '', "export const dynamic = 'force-dynamic';", "export const runtime = 'nodejs';");
      return lines.join('\n');
    }
    
    // Fallback: agregar al inicio
    return `export const dynamic = 'force-dynamic';\nexport const runtime = 'nodejs';\n\n${content}`;
  }
}

async function main() {
  console.log('🔍 Buscando archivos route.ts...\n');
  
  const files = findRouteFiles(API_DIR);
  console.log(`📁 Encontrados ${files.length} archivos route.ts\n`);
  
  let fixed = 0;
  let alreadyOk = 0;
  let errors = 0;
  
  for (const file of files) {
    try {
      const content = fs.readFileSync(file, 'utf-8');
      
      if (needsRuntimeFix(content)) {
        const newContent = fixRuntime(content);
        fs.writeFileSync(file, newContent);
        const relativePath = path.relative(process.cwd(), file);
        console.log(`✅ Fixed: ${relativePath}`);
        fixed++;
      } else {
        alreadyOk++;
      }
    } catch (error) {
      console.error(`❌ Error en ${file}:`, error);
      errors++;
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMEN');
  console.log('='.repeat(60));
  console.log(`✅ Archivos corregidos: ${fixed}`);
  console.log(`✓ Archivos OK: ${alreadyOk}`);
  console.log(`❌ Errores: ${errors}`);
  console.log(`📁 Total procesados: ${files.length}`);
}

main().catch(console.error);
