#!/usr/bin/env node

const { testKeyboardNavigation } = require('./test-keyboard-navigation');
const { testScreenReaderCompatibility } = require('./test-screen-reader');
const fs = require('fs');
const path = require('path');

async function runAllTests() {
  console.log('\n');
  console.log('='.repeat(80));
  console.log('🔬 SUITE DE PRUEBAS DE ACCESIBILIDAD COMPLETA');
  console.log('='.repeat(80));
  console.log('\n');

  const results = {
    timestamp: new Date().toISOString(),
    tests: {},
    summary: {},
  };

  try {
    // 1. Pruebas de navegación por teclado
    console.log('\n📋 [1/2] Ejecutando pruebas de navegación por teclado...\n');
    const keyboardResults = await testKeyboardNavigation();
    results.tests.keyboard = {
      score: keyboardResults.finalScore,
      criticalIssues: keyboardResults.criticalIssues,
      status: keyboardResults.finalScore >= 70 ? 'pass' : 'fail',
    };

    // 2. Pruebas de lectores de pantalla
    console.log('\n📋 [2/2] Ejecutando pruebas de lectores de pantalla...\n');
    const screenReaderResults = await testScreenReaderCompatibility();
    results.tests.screenReader = {
      score: screenReaderResults.finalScore,
      criticalIssues: screenReaderResults.criticalIssues,
      status: screenReaderResults.finalScore >= 70 ? 'pass' : 'fail',
    };

    // Calcular resumen
    const avgScore = Math.round(
      (keyboardResults.finalScore + screenReaderResults.finalScore) / 2
    );
    const totalCriticalIssues =
      keyboardResults.criticalIssues + screenReaderResults.criticalIssues;

    results.summary = {
      overallScore: avgScore,
      totalCriticalIssues,
      testsRun: 2,
      testsPassed: Object.values(results.tests).filter(
        (t) => t.status === 'pass'
      ).length,
      testsFailed: Object.values(results.tests).filter(
        (t) => t.status === 'fail'
      ).length,
      recommendation:
        avgScore >= 90
          ? 'Excelente nivel de accesibilidad'
          : avgScore >= 75
            ? 'Nivel aceptable, se recomienda mejorar'
            : avgScore >= 50
              ? 'Nivel insuficiente, requiere atención'
              : 'Nivel crítico, requiere mejoras urgentes',
    };

    // Generar reporte final
    console.log('\n\n');
    console.log('='.repeat(80));
    console.log('📊 RESUMEN FINAL DE ACCESIBILIDAD');
    console.log('='.repeat(80));
    console.log('\n');

    console.log('🎯 Puntuación Global:');
    console.log(`   ${avgScore}/100\n`);

    console.log('📈 Resultados por Categoría:');
    console.log(
      `   ⌨️  Navegación por Teclado: ${keyboardResults.finalScore}/100 ${results.tests.keyboard.status === 'pass' ? '✅' : '❌'}`
    );
    console.log(
      `   🔊 Lectores de Pantalla: ${screenReaderResults.finalScore}/100 ${results.tests.screenReader.status === 'pass' ? '✅' : '❌'}\n`
    );

    console.log('🔍 Estado de las Pruebas:');
    console.log(`   Total de pruebas: ${results.summary.testsRun}`);
    console.log(`   Pasadas: ${results.summary.testsPassed}`);
    console.log(`   Fallidas: ${results.summary.testsFailed}`);
    console.log(`   Problemas críticos: ${totalCriticalIssues}\n`);

    console.log('💡 Recomendación:');
    console.log(`   ${results.summary.recommendation}\n`);

    // Prioridades de corrección
    console.log('📝 Prioridades de Corrección:\n');
    const priorities = [];

    if (screenReaderResults.finalScore < 70) {
      priorities.push(
        '   🔴 ALTA: Corregir inputs sin etiquetas accesibles (aria-label, aria-labelledby)'
      );
      priorities.push(
        '   🔴 ALTA: Agregar elementos <main> en layouts principales'
      );
      priorities.push(
        '   🔴 ALTA: Implementar skip-links para navegación rápida'
      );
    }

    if (keyboardResults.finalScore < 70) {
      priorities.push(
        '   🟠 MEDIA: Mejorar estilos focus-visible en componentes interactivos'
      );
      priorities.push(
        '   🟠 MEDIA: Agregar manejadores de eventos de teclado (onKeyDown, etc.)'
      );
      priorities.push(
        '   🟠 MEDIA: Implementar roles ARIA apropiados en componentes custom'
      );
    }

    if (priorities.length > 0) {
      priorities.forEach((p) => console.log(p));
    } else {
      console.log('   ✅ No hay prioridades críticas pendientes');
    }

    console.log('\n');
    console.log('='.repeat(80));
    console.log('\n');

    // Guardar reporte consolidado
    const reportPath = path.join(
      __dirname,
      '..',
      'accessibility-full-report.json'
    );
    fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));

    console.log('💾 Reporte consolidado guardado en: accessibility-full-report.json\n');

    // Indicar siguiente paso
    console.log('📋 Siguientes Pasos:\n');
    console.log('   1. Revisar los archivos de reporte JSON generados:');
    console.log('      - keyboard-navigation-report.json');
    console.log('      - screen-reader-report.json');
    console.log('      - accessibility-full-report.json');
    console.log('\n   2. Corregir problemas críticos identificados');
    console.log('\n   3. Ejecutar pruebas axe DevTools (requiere servidor dev):');
    console.log('      yarn dev');
    console.log('      node scripts/test-accessibility.js');
    console.log('\n');

    return avgScore >= 50 ? 0 : 1;
  } catch (error) {
    console.error('\n❌ Error ejecutando suite de pruebas:', error);
    return 1;
  }
}

// Ejecutar
if (require.main === module) {
  runAllTests()
    .then((exitCode) => process.exit(exitCode))
    .catch((error) => {
      console.error('❌ Error fatal:', error);
      process.exit(1);
    });
}

module.exports = { runAllTests };
