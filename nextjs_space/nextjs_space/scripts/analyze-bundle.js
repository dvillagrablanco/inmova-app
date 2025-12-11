#!/usr/bin/env node

/**
 * Script para analizar el bundle de Next.js
 * Uso: node scripts/analyze-bundle.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 Analizando bundle de Next.js...\n');

try {
  // Build con análisis
  console.log('📦 Construyendo la aplicación con análisis...');
  execSync('ANALYZE=true yarn build', { stdio: 'inherit', cwd: __dirname + '/..' });
  
  console.log('\n✅ Análisis completado!\n');
  console.log('📊 Reportes generados:');
  console.log('  - Cliente: .next/analyze/client.html');
  console.log('  - Servidor: .next/analyze/server.html');
  console.log('\n💡 Abre los archivos HTML en tu navegador para ver los detalles.\n');
  
  // Leer build manifest para métricas
  const buildManifestPath = path.join(__dirname, '..', '.next', 'build-manifest.json');
  
  if (fs.existsSync(buildManifestPath)) {
    const buildManifest = JSON.parse(fs.readFileSync(buildManifestPath, 'utf8'));
    
    console.log('📈 Resumen de páginas:\n');
    
    const pages = buildManifest.pages;
    const sortedPages = Object.keys(pages)
      .filter(page => !page.startsWith('/_'))
      .sort();
    
    sortedPages.forEach(page => {
      const files = pages[page];
      const jsFiles = files.filter(f => f.endsWith('.js'));
      console.log(`  ${page}:`);
      console.log(`    - Scripts: ${jsFiles.length} archivos`);
    });
  }
  
  // Recomendaciones
  console.log('\n💡 Recomendaciones:\n');
  console.log('  1. Busca chunks > 500KB (gzip) en el reporte');
  console.log('  2. Identifica librerías grandes que puedan ser lazy-loaded');
  console.log('  3. Verifica que el code splitting esté funcionando correctamente');
  console.log('  4. Revisa los duplicados en diferentes chunks');
  console.log('\n');
  
} catch (error) {
  console.error('❌ Error al analizar el bundle:', error.message);
  process.exit(1);
}
