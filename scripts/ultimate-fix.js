#!/usr/bin/env node

/**
 * Script DEFINITIVO para corregir todos los errores de build
 * - Elimina indentación incorrecta
 * - Asegura que AuthenticatedLayout esté cerrado correctamente
 * - Limpia problemas de sintaxis JSX
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 CORRECCIÓN DEFINITIVA DE ERRORES\n');
console.log('═══════════════════════════════════════════════════════════════\n');

let filesFixed = 0;

// Lista de archivos conocidos con problemas
const problematicFiles = [
  'app/contratos/page.tsx',
  'app/cupones/page.tsx',
  'app/documentos/page.tsx',
  'app/edificios/page.tsx',
  'app/flipping/dashboard/page.tsx',
  'app/inquilinos/page.tsx',
  'app/mantenimiento/page.tsx',
  'app/room-rental/page.tsx',
  'app/soporte/page.tsx',
  'app/tareas/page.tsx',
  'app/open-banking/page.tsx',
  'app/str/dashboard/page.tsx',
  'app/visitas/page.tsx',
  'app/seguros/page.tsx',
  'app/home-mobile/page.tsx',
  'app/onboarding/page.tsx',
  'app/publicaciones/page.tsx',
  'app/reservas/page.tsx',
  'app/str-housekeeping/staff/page.tsx',
  'app/str-housekeeping/page.tsx',
  'app/room-rental/[unitId]/rooms/[roomId]/page.tsx',
  'app/room-rental/[unitId]/page.tsx',
  'app/room-rental/[unitId]/reports/page.tsx',
  'app/room-rental/[unitId]/proration/page.tsx',
];

function fixFile(filePath) {
  try {
    const fullPath = path.join(process.cwd(), filePath);
    
    if (!fs.existsSync(fullPath)) {
      console.log(`  ⚠️  ${filePath} - No existe`);
      return false;
    }
    
    let content = fs.readFileSync(fullPath, 'utf8');
    let modified = false;
    
    // Contar tags AuthenticatedLayout
    const openTags = (content.match(/<AuthenticatedLayout[^>]*>/g) || []).length;
    const closeTags = (content.match(/<\/AuthenticatedLayout>/g) || []).length;
    
    if (openTags === 0) {
      console.log(`  ℹ ${filePath} - No usa AuthenticatedLayout`);
      return false;
    }
    
    // Estrategia: Reemplazar todo el bloque return-AuthenticatedLayout
    // 1. Encontrar el return con AuthenticatedLayout
    // 2. Normalizar indentación
    // 3. Asegurar cierre correcto
    
    const lines = content.split('\n');
    let inAuthLayout = false;
    let startIndex = -1;
    let braceCount = 0;
    let parenCount = 0;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Detectar inicio de return con AuthenticatedLayout
      if (line.includes('return (') && !inAuthLayout) {
        // Verificar si las siguientes líneas tienen AuthenticatedLayout
        for (let j = i; j < Math.min(i + 5, lines.length); j++) {
          if (lines[j].includes('<AuthenticatedLayout')) {
            inAuthLayout = true;
            startIndex = j;
            
            // Normalizar la línea de AuthenticatedLayout
            const authMatch = lines[j].match(/(\s*)<AuthenticatedLayout([^>]*)>/);
            if (authMatch) {
              const baseIndent = lines[i].match(/^\s*/)[0]; // Indentación del return
              const contentIndent = baseIndent + '  '; // +2 espacios
              
              // Corregir indentación de AuthenticatedLayout
              if (authMatch[1].length !== contentIndent.length) {
                lines[j] = contentIndent + `<AuthenticatedLayout${authMatch[2]}>`;
                modified = true;
              }
            }
            break;
          }
        }
      }
      
      // Si estamos dentro, normalizar indentación
      if (inAuthLayout && i > startIndex) {
        const baseIndent = lines[startIndex].match(/^\s*/)[0];
        const expectedIndent = baseIndent + '  '; // El contenido debe tener +2 espacios
        
        // Si la línea tiene demasiada indentación al principio del contenido
        if (line.match(/^\s{10,}/) && line.trim().startsWith('<div')) {
          const trimmed = line.trim();
          lines[i] = expectedIndent + '  ' + trimmed; // +2 para el contenido de AuthLayout
          modified = true;
        }
      }
    }
    
    // PASO 2: Asegurar que hay cierres de AuthenticatedLayout
    if (openTags > closeTags) {
      const missing = openTags - closeTags;
      
      // Buscar el último ); del componente
      for (let i = lines.length - 1; i >= 0; i--) {
        if (lines[i].trim() === ');' || (lines[i].includes(');') && lines[i].trim().endsWith(');'))) {
          const indent = lines[i].match(/^\s*/)[0];
          
          // Insertar cierres necesarios ANTES del );
          for (let m = 0; m < missing; m++) {
            lines.splice(i, 0, indent + '</AuthenticatedLayout>');
          }
          
          modified = true;
          break;
        }
      }
    }
    
    if (modified) {
      const newContent = lines.join('\n');
      fs.writeFileSync(fullPath, newContent, 'utf8');
      console.log(`  ✅ ${filePath}`);
      filesFixed++;
      return true;
    } else {
      console.log(`  ℹ ${filePath} - Sin cambios necesarios`);
      return false;
    }
    
  } catch (error) {
    console.error(`  ❌ ${filePath}:`, error.message);
    return false;
  }
}

// Procesar todos los archivos
console.log(`Procesando ${problematicFiles.length} archivos...\n`);

problematicFiles.forEach(file => {
  fixFile(file);
});

console.log('\n═══════════════════════════════════════════════════════════════');
console.log(`✅ Archivos corregidos: ${filesFixed}`);
console.log('═══════════════════════════════════════════════════════════════\n');

console.log('Siguiente paso: npm run build\n');
