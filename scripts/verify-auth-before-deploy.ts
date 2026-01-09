#!/usr/bin/env npx tsx
/**
 * SCRIPT DE VERIFICACIÓN DE AUTENTICACIÓN PRE-DEPLOY
 * 
 * Este script DEBE ejecutarse antes de CADA deployment.
 * Si falla, el deployment debe ser ABORTADO.
 * 
 * Uso:
 *   npx tsx scripts/verify-auth-before-deploy.ts
 * 
 * En CI/CD:
 *   - Añadir como paso obligatorio antes del deploy
 *   - Fallar el pipeline si exit code != 0
 * 
 * @module PreDeployAuthCheck
 */

import { verifyAuthSystem, generateAuthReport, testLoginFlow } from '../lib/auth-guard';

// Colores para la consola
const Colors = {
  RED: '\x1b[31m',
  GREEN: '\x1b[32m',
  YELLOW: '\x1b[33m',
  BLUE: '\x1b[34m',
  CYAN: '\x1b[36m',
  RESET: '\x1b[0m',
  BOLD: '\x1b[1m',
};

function log(message: string, color: string = Colors.RESET) {
  console.log(`${color}${message}${Colors.RESET}`);
}

async function main() {
  log('\n' + '═'.repeat(70), Colors.CYAN);
  log('🔐 VERIFICACIÓN DE AUTENTICACIÓN PRE-DEPLOY', Colors.CYAN + Colors.BOLD);
  log('═'.repeat(70), Colors.CYAN);
  log('');

  try {
    // 1. Ejecutar verificación del sistema de auth
    log('📋 Ejecutando verificaciones del sistema de autenticación...', Colors.BLUE);
    log('');
    
    const result = await verifyAuthSystem();
    
    // Mostrar resultados de cada check
    for (const check of result.checks) {
      const icon = check.passed ? '✅' : '❌';
      const color = check.passed ? Colors.GREEN : Colors.RED;
      const criticalTag = check.critical ? ` ${Colors.YELLOW}[CRÍTICO]${Colors.RESET}` : '';
      log(`  ${icon} ${check.name}${criticalTag}: ${check.message}`, color);
    }
    
    log('');
    log(`⏱️  Duración: ${result.duration}ms`, Colors.CYAN);
    log('');

    // 2. Si falló algún check crítico, abortar
    const criticalFailed = result.checks.filter(c => c.critical && !c.passed);
    
    if (criticalFailed.length > 0) {
      log('═'.repeat(70), Colors.RED);
      log('❌ VERIFICACIÓN FALLIDA - DEPLOYMENT ABORTADO', Colors.RED + Colors.BOLD);
      log('═'.repeat(70), Colors.RED);
      log('');
      log('Checks críticos que fallaron:', Colors.RED);
      for (const check of criticalFailed) {
        log(`  • ${check.name}: ${check.message}`, Colors.RED);
      }
      log('');
      log('ACCIÓN REQUERIDA:', Colors.YELLOW);
      log('  1. Revisar los errores anteriores', Colors.YELLOW);
      log('  2. Corregir los problemas identificados', Colors.YELLOW);
      log('  3. Volver a ejecutar este script', Colors.YELLOW);
      log('');
      process.exit(1);
    }

    // 3. Verificación exitosa
    log('═'.repeat(70), Colors.GREEN);
    log('✅ VERIFICACIÓN EXITOSA - SISTEMA DE AUTH OK', Colors.GREEN + Colors.BOLD);
    log('═'.repeat(70), Colors.GREEN);
    log('');
    log('El sistema de autenticación está funcionando correctamente.', Colors.GREEN);
    log('El deployment puede proceder.', Colors.GREEN);
    log('');
    
    process.exit(0);
    
  } catch (error) {
    log('═'.repeat(70), Colors.RED);
    log('❌ ERROR INESPERADO EN VERIFICACIÓN', Colors.RED + Colors.BOLD);
    log('═'.repeat(70), Colors.RED);
    log('');
    log(`Error: ${error instanceof Error ? error.message : error}`, Colors.RED);
    log('');
    log('Este error impide la verificación del sistema de auth.', Colors.RED);
    log('El deployment debe ser ABORTADO hasta resolver el problema.', Colors.RED);
    log('');
    process.exit(1);
  }
}

main();
