/**
 * Script para generar VAPID keys
 * Ejecutar: yarn tsx scripts/generate-vapid-keys.ts
 */

import webpush from 'web-push';

const keys = webpush.generateVAPIDKeys();

console.log('\n=== VAPID Keys Generadas ===\n');
console.log('Agrega estas variables al archivo .env:\n');
console.log(`NEXT_PUBLIC_VAPID_PUBLIC_KEY=${keys.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${keys.privateKey}`);
console.log('\n============================\n');
