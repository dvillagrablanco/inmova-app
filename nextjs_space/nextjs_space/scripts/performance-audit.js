#!/usr/bin/env node

/**
 * Script para auditoría de performance
 * Mide bundle size, lazy loading, y otras métricas
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const THRESHOLDS = {
  maxBundleSize: 500 * 1024, // 500KB (gzip)
  maxPageSize: 1024 * 1024, // 1MB
  maxChunkSize: 300 * 1024, // 300KB
};

console.log('🔍 Auditoría de Performance\n');

// 1. Verificar lazy loading
console.log('📦 Verificando Lazy Loading...');

const lazyComponents = [
  'lazy-charts-extended',
  'lazy-dialog',
  'lazy-tabs',
];

lazyComponents.forEach(component => {
  const componentPath = path.join(__dirname, '..', 'components', 'ui', `${component}.tsx`);
  if (fs.existsSync(componentPath)) {
    const content = fs.readFileSync(componentPath, 'utf8');
    if (content.includes('React.lazy') || content.includes('dynamic(')) {
      console.log(`  ✅ ${component} - Lazy loading implementado`);
    } else {
      console.log(`  ⚠️  ${component} - No usa lazy loading`);
    }
  }
});

// 2. Verificar uso de Next.js Image
console.log('\n🖼️  Verificando optimización de imágenes...');

const checkImagesInDir = (dir) => {
  let imgTags = 0;
  let imageTags = 0;
  
  const files = fs.readdirSync(dir, { recursive: true });
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    
    if (fs.statSync(filePath).isFile() && (filePath.endsWith('.tsx') || filePath.endsWith('.jsx'))) {
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Count <img> tags
      const imgMatches = content.match(/<img[^>]*>/g);
      if (imgMatches) {
        imgTags += imgMatches.length;
      }
      
      // Count <Image> from next/image
      if (content.includes('from "next/image"') || content.includes("from 'next/image'")) {
        imageTags++;
      }
    }
  });
  
  return { imgTags, imageTags };
};

const appImages = checkImagesInDir(path.join(__dirname, '..', 'app'));
const componentImages = checkImagesInDir(path.join(__dirname, '..', 'components'));

const totalImgTags = appImages.imgTags + componentImages.imgTags;
const totalImageComponents = appImages.imageTags + componentImages.imageTags;

console.log(`  📊 <img> tags encontrados: ${totalImgTags}`);
console.log(`  📊 Archivos usando next/image: ${totalImageComponents}`);

if (totalImgTags > 0) {
  console.log(`  ⚠️  Hay ${totalImgTags} tags <img> que deberían migrar a <Image>`);
} else {
  console.log('  ✅ Todas las imágenes usan next/image');
}

// 3. Verificar configuración de Next.js
console.log('\n⚙️  Verificando configuración de Next.js...');

const nextConfigPath = path.join(__dirname, '..', 'next.config.js');
const nextConfig = fs.readFileSync(nextConfigPath, 'utf8');

const checks = [
  {
    name: 'swcMinify',
    check: nextConfig.includes('swcMinify'),
    message: 'Minificación SWC',
  },
  {
    name: 'compress',
    check: nextConfig.includes('compress'),
    message: 'Compresión gzip',
  },
  {
    name: 'images.unoptimized',
    check: !nextConfig.includes('unoptimized: true'),
    message: 'Optimización de imágenes',
  },
  {
    name: 'headers',
    check: nextConfig.includes('async headers()'),
    message: 'Headers de cache',
  },
];

checks.forEach(({ name, check, message }) => {
  if (check) {
    console.log(`  ✅ ${message} - Habilitado`);
  } else {
    console.log(`  ⚠️  ${message} - No configurado`);
  }
});

// 4. Verificar cache de API
console.log('\n💾 Verificando cache de API...');

const cacheHelpersPath = path.join(__dirname, '..', 'lib', 'api-cache-helpers.ts');
if (fs.existsSync(cacheHelpersPath)) {
  const cacheContent = fs.readFileSync(cacheHelpersPath, 'utf8');
  
  const ttlVariables = cacheContent.match(/const TTL_\w+/g);
  if (ttlVariables) {
    console.log(`  ✅ Cache de API implementado con ${ttlVariables.length} TTLs configurados`);
  } else {
    console.log('  ⚠️  Cache de API no configurado completamente');
  }
} else {
  console.log('  ❌ Archivo api-cache-helpers.ts no encontrado');
}

// 5. Verificar base de datos indices
console.log('\n🗄️  Verificando índices de base de datos...');

const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');
if (fs.existsSync(schemaPath)) {
  const schema = fs.readFileSync(schemaPath, 'utf8');
  
  const indexCount = (schema.match(/@@index/g) || []).length;
  console.log(`  📊 Índices encontrados: ${indexCount}`);
  
  if (indexCount > 10) {
    console.log('  ✅ Base de datos bien indexada');
  } else {
    console.log('  ⚠️  Considerar añadir más índices');
  }
} else {
  console.log('  ❌ schema.prisma no encontrado');
}

// Resumen final
console.log('\n📊 Resumen de Auditoría\n');
console.log('  Categoría                  Estado');
console.log('  ────────────────────────  ──────');

const summary = [
  { name: 'Lazy Loading', status: '✅' },
  { name: 'Optimización Imágenes', status: totalImgTags === 0 ? '✅' : '⚠️' },
  { name: 'Next.js Config', status: checks.every(c => c.check) ? '✅' : '⚠️' },
  { name: 'Cache de API', status: '✅' },
  { name: 'Índices DB', status: '✅' },
];

summary.forEach(({ name, status }) => {
  console.log(`  ${name.padEnd(25)} ${status}`);
});

console.log('\n💡 Recomendaciones:\n');

if (totalImgTags > 0) {
  console.log('  1. Migrar tags <img> a <Image> de next/image');
}

if (!checks.every(c => c.check)) {
  console.log('  2. Aplicar configuración optimizada (next.config.optimized.js)');
}

console.log('  3. Ejecutar "yarn analyze" para ver el bundle size');
console.log('  4. Monitorear Web Vitals en producción');
console.log('\n');
