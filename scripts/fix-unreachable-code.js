#!/usr/bin/env node

/**
 * Script para corregir código inalcanzable entre returns
 * Mueve declaraciones de funciones y constantes antes del primer return
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Corrigiendo código inalcanzable...\n');

const problematicFiles = [
  'app/contratos/page.tsx',
  'app/cupones/page.tsx',
  'app/documentos/page.tsx',
  'app/edificios/page.tsx',
  'app/inquilinos/page.tsx',
  'app/mantenimiento/page.tsx',
  'app/room-rental/page.tsx',
];

let filesFixed = 0;

function fixFile(filePath) {
  try {
    const fullPath = path.join(process.cwd(), filePath);
    
    if (!fs.existsSync(fullPath)) {
      return false;
    }
    
    let content = fs.readFileSync(fullPath, 'utf8');
    const lines = content.split('\n');
    
    let firstReturnIndex = -1;
    let secondReturnIndex = -1;
    let unreachableStart = -1;
    let unreachableEnd = -1;
    let insertionPoint = -1;
    
    // Encontrar los índices clave
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();
      
      // Encontrar primer return (loading/unauthenticated)
      if (firstReturnIndex === -1 && (
        trimmed.includes('if (status === \'loading\'') ||
        trimmed.includes('if (loading)') ||
        trimmed.includes('if (isLoading)')
      )) {
        firstReturnIndex = i;
      }
      
      // Encontrar donde termina el primer bloque de return
      if (firstReturnIndex !== -1 && unreachableStart === -1) {
        if (trimmed === '}' && i > firstReturnIndex + 10) {
          // Verificar si el siguiente código NO es otro if o return directo
          for (let j = i + 1; j < Math.min(i + 10, lines.length); j++) {
            const nextLine = lines[j].trim();
            if (nextLine && !nextLine.startsWith('//') && !nextLine.startsWith('/*')) {
              if (nextLine.startsWith('if (') && nextLine.includes('return')) {
                // Es un return condicional simple, seguir buscando
                i = j;
                break;
              } else if (nextLine.startsWith('const ') || nextLine.startsWith('function ')) {
                unreachableStart = j;
                break;
              }
            }
          }
        }
      }
      
      // Encontrar el segundo return principal
      if (unreachableStart !== -1 && secondReturnIndex === -1) {
        if (trimmed === 'return (' && i > unreachableStart + 5) {
          unreachableEnd = i - 1;
          secondReturnIndex = i;
        }
      }
    }
    
    if (unreachableStart === -1 || unreachableEnd === -1) {
      console.log(`  ℹ ${filePath} - No se encontró código inalcanzable`);
      return false;
    }
    
    // Encontrar punto de inserción (después de useEffect/useState pero antes del primer if)
    for (let i = 0; i < firstReturnIndex; i++) {
      const line = lines[i].trim();
      if (line.startsWith('}, [') || line === '});') {
        // Final de un useEffect o useMemo
        insertionPoint = i + 1;
      }
    }
    
    if (insertionPoint === -1) {
      console.log(`  ⚠️  ${filePath} - No se encontró punto de inserción`);
      return false;
    }
    
    // Extraer código inalcanzable
    const unreachableLines = lines.splice(unreachableStart, unreachableEnd - unreachableStart + 1);
    
    // Eliminar líneas vacías al inicio y final del bloque extraído
    while (unreachableLines.length > 0 && !unreachableLines[0].trim()) {
      unreachableLines.shift();
    }
    while (unreachableLines.length > 0 && !unreachableLines[unreachableLines.length - 1].trim()) {
      unreachableLines.pop();
    }
    
    // Insertar en el punto correcto
    unreachableLines.push(''); // Línea en blanco después
    lines.splice(insertionPoint, 0, ...unreachableLines);
    
    // Guardar archivo
    const newContent = lines.join('\n');
    fs.writeFileSync(fullPath, newContent, 'utf8');
    
    console.log(`  ✅ ${filePath} - Movidas ${unreachableLines.length} líneas`);
    filesFixed++;
    return true;
    
  } catch (error) {
    console.error(`  ❌ ${filePath}:`, error.message);
    return false;
  }
}

// Procesar archivos
problematicFiles.forEach(file => {
  fixFile(file);
});

console.log('\n═══════════════════════════════════════════════════════════════');
console.log(`✅ Archivos corregidos: ${filesFixed}`);
console.log('═══════════════════════════════════════════════════════════════\n');
