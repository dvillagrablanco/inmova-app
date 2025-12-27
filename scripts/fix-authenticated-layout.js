#!/usr/bin/env node

/**
 * Script mejorado para corregir tags AuthenticatedLayout
 */

const fs = require('fs');
const { execSync } = require('child_process');

console.log('🔧 Corrigiendo tags AuthenticatedLayout...\n');

let filesFixed = 0;

function fixFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Verificar si usa AuthenticatedLayout
    if (!content.includes('AuthenticatedLayout')) {
      return false;
    }
    
    // Contar tags
    const openTags = (content.match(/<AuthenticatedLayout[^>]*>/g) || []).length;
    const closeTags = (content.match(/<\/AuthenticatedLayout>/g) || []).length;
    
    if (openTags === closeTags) {
      console.log(`  ℹ ${filePath} - Ya está correcto`);
      return false;
    }
    
    console.log(`  🔧 ${filePath} - Faltan ${openTags - closeTags} tags de cierre`);
    
    const lines = content.split('\n');
    let inReturn = false;
    let braceDepth = 0;
    let parenDepth = 0;
    let foundAuthLayout = false;
    let insertIndex = -1;
    
    // Analizar línea por línea
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Detectar inicio del return
      if (line.includes('return (')) {
        inReturn = true;
        parenDepth = 1;
        braceDepth = 0;
      }
      
      if (inReturn) {
        // Contar paréntesis y llaves
        for (const char of line) {
          if (char === '(') parenDepth++;
          if (char === ')') parenDepth--;
          if (char === '{') braceDepth++;
          if (char === '}') braceDepth--;
        }
        
        // Detectar AuthenticatedLayout
        if (line.includes('<AuthenticatedLayout')) {
          foundAuthLayout = true;
        }
        
        // Si volvemos a parenDepth 0, terminó el return
        if (parenDepth === 0 && foundAuthLayout) {
          insertIndex = i; // Línea con ");
          break;
        }
      }
    }
    
    // Insertar cierre antes del );
    if (insertIndex > 0 && foundAuthLayout) {
      const indent = lines[insertIndex].match(/^\s*/)[0];
      
      // Buscar la mejor línea para insertar (antes del último </div> o </main>)
      let bestIndex = insertIndex;
      for (let i = insertIndex - 1; i >= 0; i--) {
        const line = lines[i].trim();
        if (line === '</div>' || line === '</main>' || line === '</section>') {
          bestIndex = i + 1;
          break;
        }
        if (line.includes('return (')) break;
      }
      
      // Insertar los cierres necesarios
      const missing = openTags - closeTags;
      for (let j = 0; j < missing; j++) {
        lines.splice(bestIndex, 0, indent + '</AuthenticatedLayout>');
      }
      
      const newContent = lines.join('\n');
      fs.writeFileSync(filePath, newContent, 'utf8');
      
      console.log(`  ✅ ${filePath} - Corregido\n`);
      filesFixed++;
      return true;
    }
    
    console.log(`  ⚠️  ${filePath} - No se pudo corregir automáticamente\n`);
    return false;
    
  } catch (error) {
    console.error(`  ❌ Error en ${filePath}:`, error.message, '\n');
    return false;
  }
}

// Buscar todos los archivos con AuthenticatedLayout
try {
  const result = execSync(
    "grep -r 'AuthenticatedLayout' app --include='*.tsx' -l",
    { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }
  );
  
  const files = result.trim().split('\n').filter(f => f && fs.existsSync(f));
  
  console.log(`📁 Encontrados ${files.length} archivos con AuthenticatedLayout\n`);
  
  files.forEach(file => {
    fixFile(file);
  });
  
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`✅ Archivos corregidos: ${filesFixed}`);
  console.log('═══════════════════════════════════════════════════════════════\n');
  
} catch (error) {
  console.log('ℹ No se encontraron archivos para corregir\n');
}
