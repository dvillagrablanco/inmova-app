#!/usr/bin/env node

/**
 * Script para generar un NEXTAUTH_SECRET seguro de 128 caracteres
 * Compatible con entornos de producción
 */

const crypto = require('crypto');

function generateSecureSecret(length = 128) {
  // Generar bytes aleatorios criptográficamente seguros
  const bytes = crypto.randomBytes(Math.ceil(length * 3 / 4));
  
  // Convertir a base64 y remover caracteres no deseados
  const secret = bytes
    .toString('base64')
    .replace(/[+\/=]/g, '')
    .substring(0, length);
  
  return secret;
}

function analyzeSecretStrength(secret) {
  const length = secret.length;
  const hasUpperCase = /[A-Z]/.test(secret);
  const hasLowerCase = /[a-z]/.test(secret);
  const hasNumbers = /[0-9]/.test(secret);
  const hasSpecialChars = /[^A-Za-z0-9]/.test(secret);
  
  let strength = 0;
  if (length >= 64) strength += 25;
  if (length >= 128) strength += 25;
  if (hasUpperCase) strength += 12.5;
  if (hasLowerCase) strength += 12.5;
  if (hasNumbers) strength += 12.5;
  if (hasSpecialChars) strength += 12.5;
  
  return {
    strength,
    level: strength >= 87.5 ? 'Excelente' : strength >= 62.5 ? 'Muy Bueno' : strength >= 50 ? 'Bueno' : 'Débil',
    length,
    hasUpperCase,
    hasLowerCase,
    hasNumbers,
    hasSpecialChars
  };
}

console.log('\n🔐 Generador de NEXTAUTH_SECRET Seguro\n');
console.log('═'.repeat(60));

// Generar nuevo secret
const newSecret = generateSecureSecret(128);
const analysis = analyzeSecretStrength(newSecret);

console.log('\n✅ Nuevo NEXTAUTH_SECRET generado:\n');
console.log(`NEXTAUTH_SECRET=${newSecret}`);

console.log('\n📊 Análisis de Fortaleza:\n');
console.log(`  Longitud:           ${analysis.length} caracteres`);
console.log(`  Nivel de Seguridad: ${analysis.level} (${analysis.strength}/100)`);
console.log(`  Mayúsculas:         ${analysis.hasUpperCase ? '✅' : '❌'}`);
console.log(`  Minúsculas:         ${analysis.hasLowerCase ? '✅' : '❌'}`);
console.log(`  Números:            ${analysis.hasNumbers ? '✅' : '❌'}`);
console.log(`  Caracteres Esp.:    ${analysis.hasSpecialChars ? '✅' : '❌'}`);

console.log('\n📝 Instrucciones:\n');
console.log('  1. Copia el valor generado arriba');
console.log('  2. Actualiza tu archivo .env:');
console.log('     NEXTAUTH_SECRET=<valor_generado>');
console.log('  3. Reinicia tu aplicación Next.js');
console.log('  4. GUARDA el secret en un lugar seguro (1Password, Vault, etc.)');

console.log('\n⚠️  ADVERTENCIAS:\n');
console.log('  - NO compartas este secret públicamente');
console.log('  - NO lo commits al repositorio');
console.log('  - Cambia todos los tokens de sesión existentes');
console.log('  - Los usuarios deberán volver a iniciar sesión');

console.log('\n═'.repeat(60));
console.log('\n✨ Secret generado exitosamente\n');
