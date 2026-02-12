/**
 * Script para eliminar datos mock hardcodeados de las páginas.
 * Reemplaza useState([{...mock...}]) por useState([]) para que las páginas
 * carguen datos reales desde sus APIs o muestren empty states.
 * 
 * Ejecutar: npx tsx scripts/remove-mock-data.ts
 * Dry run:  npx tsx scripts/remove-mock-data.ts --dry-run
 */

import * as fs from 'fs';
import * as path from 'path';

const DRY_RUN = process.argv.includes('--dry-run');

// Regex para encontrar useState con datos mock inline
// Matches: useState<Type[]>([{ ... }, { ... }])  o  useState([{ ... }, { ... }])
// El patrón busca useState seguido de un array con al menos un objeto
const MOCK_PATTERN = /(const \[(\w+),\s*set\w+\]\s*=\s*useState(?:<[^>]+>)?\()(\[[\s\S]*?\]\))/g;

function hasMockData(arrayContent: string): boolean {
  // Check if the array has objects with mock-like properties
  const trimmed = arrayContent.trim();
  // Empty array is fine
  if (trimmed === '[]') return false;
  if (trimmed === '[])') return false;
  
  // Arrays with objects that have id, name, etc. are likely mock
  const hasMockIds = /id:\s*['"][a-z0-9_-]+['"]/.test(trimmed) && 
                     /\{[\s\S]*?\}/.test(trimmed);
  
  // Must have at least 2 properties to be considered mock data
  const objectCount = (trimmed.match(/\{/g) || []).length;
  const hasMultipleProps = objectCount > 0 && trimmed.length > 50;
  
  return hasMockIds && hasMultipleProps;
}

function processFile(filePath: string): { modified: boolean; varNames: string[] } {
  const content = fs.readFileSync(filePath, 'utf-8');
  let newContent = content;
  let modified = false;
  const varNames: string[] = [];

  // Find all useState declarations with arrays
  const matches: Array<{ full: string; varName: string; arrayPart: string; index: number }> = [];
  
  let match;
  const regex = /const \[(\w+),\s*set(\w+)\]\s*=\s*useState(?:<[^>]+>)?\((\[[\s\S]*?\])\)/g;
  
  while ((match = regex.exec(content)) !== null) {
    const varName = match[1];
    const arrayPart = match[3];
    
    // Skip if it's already empty
    if (arrayPart.trim() === '[]') continue;
    
    // Check if it looks like mock data
    if (hasMockData(arrayPart)) {
      matches.push({
        full: match[0],
        varName,
        arrayPart,
        index: match.index,
      });
    }
  }

  // Replace from end to start to maintain indices
  for (const m of matches.reverse()) {
    const replacement = m.full.replace(m.arrayPart, '[]');
    newContent = newContent.substring(0, m.index) + replacement + newContent.substring(m.index + m.full.length);
    modified = true;
    varNames.push(m.varName);
  }

  if (modified && !DRY_RUN) {
    fs.writeFileSync(filePath, newContent, 'utf-8');
  }

  return { modified, varNames };
}

function findPageFiles(dir: string): string[] {
  const results: string[] = [];
  
  function walk(currentDir: string) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === 'node_modules' || entry.name === '.next' || entry.name === '__tests__') continue;
        walk(fullPath);
      } else if (entry.name === 'page.tsx') {
        results.push(fullPath);
      }
    }
  }
  
  walk(dir);
  return results;
}

// Main
console.log(`${DRY_RUN ? '[DRY RUN] ' : ''}Buscando datos mock en páginas...\n`);

const appDir = path.join(process.cwd(), 'app');
const files = findPageFiles(appDir);
let totalModified = 0;
let totalVars = 0;

for (const file of files) {
  // Skip API routes
  if (file.includes('/api/')) continue;
  
  const { modified, varNames } = processFile(file);
  if (modified) {
    const relPath = path.relative(process.cwd(), file);
    console.log(`  ${DRY_RUN ? 'WOULD FIX' : 'FIXED'}: ${relPath}`);
    for (const v of varNames) {
      console.log(`    - ${v}: [...mock...] → []`);
    }
    totalModified++;
    totalVars += varNames.length;
  }
}

console.log(`\n${DRY_RUN ? '[DRY RUN] ' : ''}Resultado: ${totalModified} archivos, ${totalVars} variables con mock data ${DRY_RUN ? 'encontradas' : 'limpiadas'}`);
