#!/usr/bin/env node
/**
 * Script de análisis y optimización de bundle
 * 
 * Analiza el bundle de Next.js y sugiere optimizaciones
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT_DIR = path.join(__dirname, '..');
const BUILD_DIR = path.join(ROOT_DIR, '.next');

console.log('\n📦 Analizando bundle de Next.js...\n');

// Check if build exists
if (!fs.existsSync(BUILD_DIR)) {
  console.log('❌ No se encontró build de Next.js');
  console.log('\nEjecutar primero: yarn build\n');
  process.exit(1);
}

// Analyze build manifest
const manifestPath = path.join(BUILD_DIR, 'build-manifest.json');
if (!fs.existsSync(manifestPath)) {
  console.log('❌ No se encontró build-manifest.json');
  process.exit(1);
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

console.log('➡️ Análisis de páginas:\n');

const pages = Object.keys(manifest.pages);
const SUGGESTIONS = [];

pages.forEach(page => {
  const files = manifest.pages[page];
  const jsFiles = files.filter(f => f.endsWith('.js'));
  
  console.log(`📄 ${page}`);
  console.log(`   JS files: ${jsFiles.length}`);
  
  // Check for heavy libraries
  const heavyLibs = jsFiles.filter(f => 
    f.includes('recharts') || 
    f.includes('chart') ||
    f.includes('big-calendar') ||
    f.includes('plotly')
  );
  
  if (heavyLibs.length > 0) {
    console.log(`   ⚠️  Contiene librerías pesadas: ${heavyLibs.length}`);
    SUGGESTIONS.push({
      page,
      suggestion: 'Considerar lazy loading para charts y calendarios pesados',
      priority: 'HIGH'
    });
  }
});

console.log('\n' + '='.repeat(60));
console.log('RECOMENDACIONES DE OPTIMIZACIÓN');
console.log('='.repeat(60) + '\n');

if (SUGGESTIONS.length === 0) {
  console.log('✅ No se detectaron problemas obvios de bundle size\n');
} else {
  SUGGESTIONS.forEach((s, i) => {
    console.log(`${i + 1}. ${s.page}`);
    console.log(`   💡 ${s.suggestion}`);
    console.log(`   Prioridad: ${s.priority}\n`);
  });
}

// General optimization tips
console.log('\n🚀 OPTIMIZACIONES GENERALES RECOMENDADAS:\n');
console.log('1. Lazy load de componentes pesados:');
console.log('   const LazyChart = dynamic(() => import(\'./Chart\'), { ssr: false });\n');
console.log('2. Code splitting por ruta:');
console.log('   Asegurar que cada página solo carga lo necesario\n');
console.log('3. Tree shaking:');
console.log('   Importar solo las funciones necesarias de lodash, date-fns, etc.\n');
console.log('4. Image optimization:');
console.log('   Usar next/image para todas las imágenes\n');
console.log('5. Font optimization:');
console.log('   Usar next/font para optimizar fuentes\n');

console.log('Para análisis detallado, ejecutar:');
console.log('yarn add -D @next/bundle-analyzer');
console.log('y configurar en next.config.js\n');
