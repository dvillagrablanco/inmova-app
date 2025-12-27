#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Corrección FINAL de tags AuthenticatedLayout...\n');

let filesFixed = 0;
let filesWithErrors = [];

function fixFileDirectly(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Contar tags
    const openMatches = content.match(/<AuthenticatedLayout[^>]*>/g) || [];
    const closeMatches = content.match(/<\/AuthenticatedLayout>/g) || [];
    
    if (openMatches.length === closeMatches.length) {
      return false; // Ya está correcto
    }
    
    const missing = openMatches.length - closeMatches.length;
    
    if (missing > 0) {
      // Buscar el patrón final del componente
      const lines = content.split('\n');
      
      // Buscar de atrás hacia adelante la última función export
      for (let i = lines.length - 1; i >= 0; i--) {
        const line = lines[i];
        
        // Encontrar el cierre del componente principal
        if (line.includes(');') && i > 0) {
          // Verificar si hay un return ( antes
          let hasReturn = false;
          for (let j = i - 1; j >= Math.max(0, i - 100); j--) {
            if (lines[j].includes('return (')) {
              hasReturn = true;
              break;
            }
          }
          
          if (hasReturn) {
            // Encontrar la mejor línea para insertar (antes del );)
            const indent = lines[i].match(/^\s*/)[0];
            
            // Insertar los cierres necesarios
            for (let m = 0; m < missing; m++) {
              lines.splice(i, 0, indent + '</AuthenticatedLayout>');
            }
            
            content = lines.join('\n');
            fs.writeFileSync(filePath, content, 'utf8');
            
            console.log(`  ✅ ${filePath}`);
            filesFixed++;
            return true;
          }
        }
      }
    }
    
    filesWithErrors.push(filePath);
    console.log(`  ⚠️  ${filePath} - No se pudo corregir`);
    return false;
    
  } catch (error) {
    filesWithErrors.push(filePath);
    console.error(`  ❌ ${filePath}:`, error.message);
    return false;
  }
}

// Archivos problemáticos conocidos
const problematicFiles = [
  'app/cupones/page.tsx',
  'app/documentos/page.tsx',
  'app/flipping/dashboard/page.tsx',
  'app/soporte/page.tsx',
  'app/tareas/page.tsx',
  'app/open-banking/page.tsx',
  'app/str/dashboard/page.tsx',
  'app/visitas/page.tsx',
  'app/seguros/page.tsx',
  'app/home-mobile/page.tsx',
  'app/room-rental/[unitId]/rooms/[roomId]/page.tsx',
  'app/room-rental/[unitId]/page.tsx',
  'app/onboarding/page.tsx',
  'app/publicaciones/page.tsx',
  'app/reservas/page.tsx',
  'app/str-housekeeping/staff/page.tsx',
  'app/str-housekeeping/page.tsx',
];

console.log(`Procesando ${problematicFiles.length} archivos conocidos...\n`);

problematicFiles.forEach(file => {
  const fullPath = path.join(process.cwd(), file);
  if (fs.existsSync(fullPath)) {
    fixFileDirectly(fullPath);
  } else {
    console.log(`  ⚠️  ${file} - No existe`);
  }
});

console.log('\n═══════════════════════════════════════════════════════════════');
console.log(`✅ Archivos corregidos: ${filesFixed}`);
console.log(`⚠️  Archivos con errores: ${filesWithErrors.length}`);
console.log('═══════════════════════════════════════════════════════════════\n');

if (filesWithErrors.length > 0) {
  console.log('Archivos que requieren corrección manual:');
  filesWithErrors.forEach(f => console.log(`  - ${f}`));
  console.log('');
}
