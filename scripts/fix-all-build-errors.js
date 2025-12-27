#!/usr/bin/env node

/**
 * Script para corregir automáticamente todos los errores de build
 * - Corrige tags AuthenticatedLayout sin cerrar
 * - Corrige imports incorrectos
 * - Limpia código problemático
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('═══════════════════════════════════════════════════════════════');
console.log('  🔧 CORRECCIÓN AUTOMÁTICA DE ERRORES DE BUILD');
console.log('═══════════════════════════════════════════════════════════════\n');

let filesFixed = 0;
let errorCount = 0;

// ═══════════════════════════════════════════════════════════════
// 1. Corregir imports incorrectos
// ═══════════════════════════════════════════════════════════════

console.log('📝 Paso 1: Corrigiendo imports incorrectos...\n');

function fixIncorrectImports(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Corregir import de auth
    if (content.includes("from '@/pages/api/auth/[...nextauth]'")) {
      content = content.replace(
        /from '@\/pages\/api\/auth\/\[\.\.\.nextauth\]'/g,
        "from '@/lib/auth-options'"
      );
      modified = true;
    }
    
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`  ✓ Corregido: ${filePath}`);
      filesFixed++;
    }
    
    return modified;
  } catch (error) {
    console.error(`  ✗ Error en ${filePath}:`, error.message);
    errorCount++;
    return false;
  }
}

// Buscar archivos con imports incorrectos
try {
  const result = execSync(
    "grep -r \"from '@/pages/api/auth\" app --include='*.ts' --include='*.tsx' -l",
    { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }
  );
  
  const files = result.trim().split('\n').filter(f => f);
  
  files.forEach(file => {
    fixIncorrectImports(file);
  });
  
  if (files.length === 0) {
    console.log('  ℹ No se encontraron imports incorrectos\n');
  }
} catch (error) {
  console.log('  ℹ No se encontraron imports incorrectos\n');
}

// ═══════════════════════════════════════════════════════════════
// 2. Corregir tags AuthenticatedLayout
// ═══════════════════════════════════════════════════════════════

console.log('📝 Paso 2: Corrigiendo tags AuthenticatedLayout...\n');

function fixAuthenticatedLayoutTags(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Verificar si usa AuthenticatedLayout
    if (!content.includes('AuthenticatedLayout')) {
      return false;
    }
    
    // Contar tags de apertura y cierre
    const openTags = (content.match(/<AuthenticatedLayout[^>]*>/g) || []).length;
    const closeTags = (content.match(/<\/AuthenticatedLayout>/g) || []).length;
    
    // Si faltan tags de cierre
    if (openTags > closeTags) {
      const missing = openTags - closeTags;
      
      // Buscar el último return o export
      const lines = content.split('\n');
      let lastReturnIndex = -1;
      let braceCount = 0;
      
      for (let i = lines.length - 1; i >= 0; i--) {
        const line = lines[i];
        
        // Contar llaves para encontrar el final del componente
        braceCount += (line.match(/}/g) || []).length;
        braceCount -= (line.match(/{/g) || []).length;
        
        // Si encontramos el cierre del componente principal
        if (line.includes('export default') || 
            (line.includes('}') && braceCount === 0 && i < lines.length - 5)) {
          lastReturnIndex = i;
          break;
        }
      }
      
      // Si encontramos dónde insertar el cierre
      if (lastReturnIndex > 0) {
        // Buscar hacia atrás desde ese punto para encontrar el mejor lugar
        for (let i = lastReturnIndex; i >= 0; i--) {
          const line = lines[i].trim();
          
          // Buscar líneas que probablemente necesitan el cierre antes
          if (line === '</div>' || line.startsWith('</') || line === ');') {
            // Insertar los cierres faltantes
            const indent = lines[i].match(/^\s*/)[0];
            
            for (let j = 0; j < missing; j++) {
              lines.splice(i + 1, 0, indent + '</AuthenticatedLayout>');
            }
            
            content = lines.join('\n');
            modified = true;
            break;
          }
        }
      }
    }
    
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`  ✓ Corregido: ${filePath}`);
      filesFixed++;
    }
    
    return modified;
  } catch (error) {
    console.error(`  ✗ Error en ${filePath}:`, error.message);
    errorCount++;
    return false;
  }
}

// Buscar archivos con AuthenticatedLayout
try {
  const result = execSync(
    "grep -r 'AuthenticatedLayout' app --include='*.tsx' -l",
    { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }
  );
  
  const files = result.trim().split('\n').filter(f => f);
  
  files.forEach(file => {
    if (fs.existsSync(file)) {
      fixAuthenticatedLayoutTags(file);
    }
  });
  
  if (files.length === 0) {
    console.log('  ℹ No se encontraron archivos con AuthenticatedLayout\n');
  }
} catch (error) {
  console.log('  ℹ No se encontraron archivos con AuthenticatedLayout\n');
}

// ═══════════════════════════════════════════════════════════════
// 3. Crear lib/auth.ts si no existe
// ═══════════════════════════════════════════════════════════════

console.log('📝 Paso 3: Verificando lib/auth.ts...\n');

const authPath = 'lib/auth.ts';
if (!fs.existsSync(authPath)) {
  fs.writeFileSync(authPath, `// Re-export de auth-options para compatibilidad
export * from './auth-options';
`);
  console.log('  ✓ Creado: lib/auth.ts\n');
  filesFixed++;
} else {
  console.log('  ℹ lib/auth.ts ya existe\n');
}

// ═══════════════════════════════════════════════════════════════
// RESUMEN
// ═══════════════════════════════════════════════════════════════

console.log('═══════════════════════════════════════════════════════════════');
console.log('  📊 RESUMEN');
console.log('═══════════════════════════════════════════════════════════════\n');

console.log(`Archivos corregidos: ${filesFixed}`);
console.log(`Errores encontrados: ${errorCount}\n`);

if (errorCount === 0) {
  console.log('✅ Correcciones completadas exitosamente\n');
  console.log('Siguiente paso: npm run build\n');
  process.exit(0);
} else {
  console.log('⚠️  Algunas correcciones fallaron\n');
  console.log('Revisa los errores arriba y corrígelos manualmente\n');
  process.exit(1);
}
