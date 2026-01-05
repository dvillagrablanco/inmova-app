#!/usr/bin/env node
/**
 * Script para ejecutar APIs de admin
 * 1. Seed de planes
 * 2. Reset de onboarding
 */

import { chromium } from 'playwright';

const BASE_URL = 'https://inmovaapp.com';
const ADMIN_USER = {
  email: 'admin@inmova.app',
  password: 'Admin123!',
};

async function main() {
  console.log('=' .repeat(70));
  console.log('🔧 EJECUTANDO APIS DE ADMIN');
  console.log('=' .repeat(70));
  console.log();

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // 1. LOGIN
    console.log('[1/3] 🔐 Autenticando...');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle', timeout: 60000 });
    
    await page.fill('input[name="email"], input[type="email"]', ADMIN_USER.email);
    await page.fill('input[name="password"], input[type="password"]', ADMIN_USER.password);
    await page.click('button[type="submit"]');
    
    await page.waitForURL(/\/(dashboard|portal|admin)/, { timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(3000);
    
    console.log('   ✅ Autenticado correctamente');
    console.log();

    // 2. SEED PLANES
    console.log('[2/3] 🌱 Ejecutando seed de planes...');
    const seedResponse = await page.request.get(`${BASE_URL}/api/admin/seed-plans`);
    
    if (seedResponse.ok()) {
      const seedData = await seedResponse.json();
      console.log('   ✅ Seed exitoso');
      console.log(`   Planes creados: ${seedData.summary?.created || 0}`);
      console.log(`   Planes omitidos: ${seedData.summary?.skipped || 0}`);
      console.log(`   Total en BD: ${seedData.summary?.total || 0}`);
      console.log(`   Empresas actualizadas: ${seedData.summary?.companiesUpdated || 0}`);
      
      if (seedData.plans && seedData.plans.length > 0) {
        console.log('   Detalles:');
        seedData.plans.forEach((plan: any) => {
          console.log(`     - ${plan.nombre} (${plan.tier}): ${plan.status}`);
        });
      }
    } else {
      console.log(`   ❌ Error (${seedResponse.status()}): ${await seedResponse.text()}`);
    }
    console.log();

    // 3. RESET ONBOARDING
    console.log('[3/3] 🔄 Reseteando onboarding...');
    const onboardingResponse = await page.request.post(`${BASE_URL}/api/admin/reset-onboarding`, {
      data: {},
    });
    
    if (onboardingResponse.ok()) {
      const onboardingData = await onboardingResponse.json();
      console.log('   ✅ Reset exitoso');
      console.log(`   Usuarios actualizados: ${onboardingData.updated || 0}`);
      
      if (onboardingData.users && onboardingData.users.length > 0) {
        console.log('   Usuarios:');
        onboardingData.users.forEach((user: any) => {
          console.log(`     - ${user.email}: ${user.status}`);
        });
      }
      
      if (onboardingData.note) {
        console.log(`   ⚠️  Nota: ${onboardingData.note}`);
      }
    } else {
      console.log(`   ❌ Error (${onboardingResponse.status()}): ${await onboardingResponse.text()}`);
    }
    console.log();

    // 4. VERIFICAR API PÚBLICA
    console.log('[Verificación] 🔍 Verificando API pública de planes...');
    const publicPlansResponse = await page.request.get(`${BASE_URL}/api/public/subscription-plans`);
    
    if (publicPlansResponse.ok()) {
      const plans = await publicPlansResponse.json();
      console.log(`   ✅ API pública OK - ${plans.length} planes disponibles`);
      
      plans.forEach((plan: any) => {
        console.log(`     - ${plan.nombre}: €${plan.precioMensual}/mes`);
      });
    } else {
      console.log(`   ❌ API pública falló: ${await publicPlansResponse.text()}`);
    }

  } catch (error: any) {
    console.error('❌ ERROR:', error.message);
  } finally {
    await browser.close();
  }

  console.log();
  console.log('=' .repeat(70));
  console.log('✅ PROCESO COMPLETADO');
  console.log('=' .repeat(70));
  console.log();
  console.log('Próximos pasos:');
  console.log('  1. Abrir https://inmovaapp.com/planes');
  console.log('  2. Verificar que aparecen 4 planes con sus límites');
  console.log('  3. Hacer login como admin@inmova.app');
  console.log('  4. En DevTools Console: localStorage.clear()');
  console.log('  5. Recargar página (F5)');
  console.log('  6. El tutorial debería aparecer automáticamente');
  console.log();
}

main().catch(console.error);
