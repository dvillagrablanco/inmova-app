#!/usr/bin/env node
/**
 * Production Readiness Checker for INMOVA
 * 
 * Este script verifica que la aplicación esté lista para producción
 * checkeando configuración, seguridad, y mejores prácticas.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ERRORS = [];
const WARNINGS = [];
const INFO = [];

console.log('\n🔍 Verificando preparación para producción INMOVA...\n');

// 1. Verificar variables de entorno
console.log('➡️ Verificando variables de entorno...');
const envPath = path.join(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  
  // Check for placeholder values
  if (envContent.includes('placeholder')) {
    ERRORS.push('❌ Variables de entorno contienen valores placeholder (ej. sk_test_placeholder)');
  }
  
  // Check for test Stripe keys in production
  if (envContent.includes('sk_test_') || envContent.includes('pk_test_')) {
    WARNINGS.push('⚠️  Se detectaron claves de Stripe de TEST. Usar claves de producción para deployment.');
  }
  
  // Check NEXTAUTH_URL
  if (envContent.includes('NEXTAUTH_URL')) {
    const authUrlMatch = envContent.match(/NEXTAUTH_URL=(.+)/);
    if (authUrlMatch && !authUrlMatch[1].includes('inmova.app')) {
      WARNINGS.push('⚠️  NEXTAUTH_URL no apunta a inmova.app');
    }
  }
  
  INFO.push('✅ Archivo .env encontrado');
} else {
  ERRORS.push('❌ Archivo .env no encontrado');
}

// 2. Verificar configuración de Next.js
console.log('➡️ Verificando configuración de Next.js...');
const nextConfigPath = path.join(__dirname, '../next.config.js');
if (fs.existsSync(nextConfigPath)) {
  const configContent = fs.readFileSync(nextConfigPath, 'utf-8');
  
  if (!configContent.includes('headers()')) {
    WARNINGS.push('⚠️  next.config.js no tiene headers de seguridad configurados');
  }
  
  if (configContent.includes('images: { unoptimized: true }')) {
    WARNINGS.push('⚠️  Optimización de imágenes está deshabilitada');
  }
  
  INFO.push('✅ Configuración de Next.js encontrada');
} else {
  ERRORS.push('❌ next.config.js no encontrado');
}

// 3. Verificar package.json
console.log('➡️ Verificando package.json...');
const packagePath = path.join(__dirname, '../package.json');
if (fs.existsSync(packagePath)) {
  const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
  
  // Check for security vulnerabilities
  try {
    console.log('   Ejecutando audit de seguridad...');
    execSync('yarn audit --level high --json', { 
      cwd: path.join(__dirname, '..'),
      stdio: 'pipe'
    });
    INFO.push('✅ No se encontraron vulnerabilidades de seguridad');
  } catch (error) {
    WARNINGS.push('⚠️  Se encontraron vulnerabilidades de seguridad. Ejecutar: yarn audit');
  }
  
  INFO.push('✅ package.json verificado');
} else {
  ERRORS.push('❌ package.json no encontrado');
}

// 4. Verificar Prisma schema
console.log('➡️ Verificando Prisma schema...');
const schemaPath = path.join(__dirname, '../prisma/schema.prisma');
if (fs.existsSync(schemaPath)) {
  try {
    execSync('npx prisma validate', { 
      cwd: path.join(__dirname, '..'),
      stdio: 'pipe'
    });
    INFO.push('✅ Prisma schema es válido');
  } catch (error) {
    ERRORS.push('❌ Prisma schema tiene errores');
  }
} else {
  ERRORS.push('❌ prisma/schema.prisma no encontrado');
}

// 5. Verificar TypeScript
console.log('➡️ Verificando TypeScript...');
try {
  console.log('   Ejecutando type check (esto puede tomar un momento)...');
  execSync('npx tsc --noEmit --skipLibCheck', { 
    cwd: path.join(__dirname, '..'),
    stdio: 'pipe'
  });
  INFO.push('✅ No hay errores de TypeScript');
} catch (error) {
  WARNINGS.push('⚠️  Hay errores de TypeScript. Ejecutar: yarn tsc --noEmit');
}

// 6. Verificar ESLint
console.log('➡️ Verificando ESLint...');
try {
  execSync('npx next lint', { 
    cwd: path.join(__dirname, '..'),
    stdio: 'pipe'
  });
  INFO.push('✅ No hay errores de ESLint');
} catch (error) {
  WARNINGS.push('⚠️  Hay errores de ESLint. Ejecutar: yarn lint');
}

// 7. Buscar console.log statements
console.log('➡️ Buscando console statements...');
try {
  const result = execSync(
    'grep -r "console\\.log\\|console\\.error\\|console\\.warn" app lib components | wc -l',
    { cwd: path.join(__dirname, '..'), encoding: 'utf-8' }
  );
  const count = parseInt(result.trim());
  if (count > 0) {
    WARNINGS.push(`⚠️  Se encontraron ${count} console statements. Considerar usar logger estructurado.`);
  } else {
    INFO.push('✅ No se encontraron console statements');
  }
} catch (error) {
  // Ignore
}

// 8. Verificar tamaño del bundle
console.log('➡️ Verificando preparación para build...');
const nextDir = path.join(__dirname, '../.next');
if (fs.existsSync(nextDir)) {
  INFO.push('ℹ️ Build anterior encontrado. Considerar ejecutar: yarn build');
} else {
  INFO.push('ℹ️ No hay build previo. Ejecutar: yarn build antes del deployment');
}

// Print results
console.log('\n' + '='.repeat(60));
console.log('RESULTADOS DE LA VERIFICACIÓN');
console.log('='.repeat(60) + '\n');

if (ERRORS.length > 0) {
  console.log('🛑 ERRORES CRÍTICOS (deben ser corregidos):');
  ERRORS.forEach(err => console.log('  ' + err));
  console.log('');
}

if (WARNINGS.length > 0) {
  console.log('⚠️  ADVERTENCIAS (se recomienda corregir):');
  WARNINGS.forEach(warn => console.log('  ' + warn));
  console.log('');
}

if (INFO.length > 0) {
  console.log('ℹ️  INFORMACIÓN:');
  INFO.forEach(info => console.log('  ' + info));
  console.log('');
}

console.log('='.repeat(60));

if (ERRORS.length === 0) {
  console.log('✅ ¡Listo para producción!');
  console.log('\nPróximos pasos:');
  console.log('1. Actualizar variables de entorno de producción');
  console.log('2. Ejecutar: yarn build');
  console.log('3. Deploy a inmova.app');
  process.exit(0);
} else {
  console.log('❌ La aplicación NO está lista para producción');
  console.log('\nPor favor corregir los errores críticos antes del deployment.');
  process.exit(1);
}
