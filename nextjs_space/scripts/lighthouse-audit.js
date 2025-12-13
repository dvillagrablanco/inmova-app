#!/usr/bin/env node
/**
 * Script para ejecutar auditorías de Lighthouse
 * Verifica Performance > 80 y Accessibility > 90
 */

const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');
const fs = require('fs');
const path = require('path');

const THRESHOLDS = {
  performance: 80,
  accessibility: 90,
  'best-practices': 80,
  seo: 80,
};

const URLS_TO_TEST = [
  'http://localhost:3000',
  'http://localhost:3000/login',
  'http://localhost:3000/dashboard',
  'http://localhost:3000/edificios',
  'http://localhost:3000/unidades',
];

async function runLighthouse(url) {
  console.log(`\n\u26a1 Auditando: ${url}`);
  
  const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless'] });
  
  try {
    const options = {
      logLevel: 'info',
      output: 'json',
      onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
      port: chrome.port,
    };

    const runnerResult = await lighthouse(url, options);
    
    // Extraer scores
    const categories = runnerResult.lhr.categories;
    const scores = {
      performance: Math.round(categories.performance.score * 100),
      accessibility: Math.round(categories.accessibility.score * 100),
      'best-practices': Math.round(categories['best-practices'].score * 100),
      seo: Math.round(categories.seo.score * 100),
    };

    // Verificar umbrales
    const failures = [];
    Object.entries(THRESHOLDS).forEach(([category, threshold]) => {
      const score = scores[category];
      const passed = score >= threshold;
      const emoji = passed ? '✅' : '❌';
      
      console.log(`${emoji} ${category}: ${score}/100 (umbral: ${threshold})`);
      
      if (!passed) {
        failures.push({ category, score, threshold });
      }
    });

    return {
      url,
      scores,
      failures,
      passed: failures.length === 0,
    };
    
  } finally {
    await chrome.kill();
  }
}

async function main() {
  console.log('🚀 Iniciando auditorías Lighthouse...');
  console.log(`Umbrales: Performance > ${THRESHOLDS.performance}, Accessibility > ${THRESHOLDS.accessibility}\n`);
  
  const results = [];
  
  for (const url of URLS_TO_TEST) {
    try {
      const result = await runLighthouse(url);
      results.push(result);
    } catch (error) {
      console.error(`❌ Error auditando ${url}:`, error.message);
      results.push({
        url,
        error: error.message,
        passed: false,
      });
    }
  }
  
  // Resumen
  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMEN DE AUDITORÍAS');
  console.log('='.repeat(60));
  
  const passedCount = results.filter(r => r.passed).length;
  const totalCount = results.length;
  
  console.log(`\nResultados: ${passedCount}/${totalCount} páginas pasaron todos los umbrales\n`);
  
  results.forEach(result => {
    if (result.passed) {
      console.log(`✅ ${result.url}`);
    } else {
      console.log(`❌ ${result.url}`);
      if (result.failures) {
        result.failures.forEach(f => {
          console.log(`   - ${f.category}: ${f.score}/${f.threshold}`);
        });
      }
      if (result.error) {
        console.log(`   - Error: ${result.error}`);
      }
    }
  });
  
  // Guardar reporte
  const reportDir = path.join(__dirname, '../lighthouse-reports');
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }
  
  const reportPath = path.join(reportDir, `lighthouse-${Date.now()}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  console.log(`\n💾 Reporte guardado en: ${reportPath}`);
  
  // Exit code
  const allPassed = passedCount === totalCount;
  if (allPassed) {
    console.log('\n✅ Todas las auditorías pasaron exitosamente!');
    process.exit(0);
  } else {
    console.log('\n❌ Algunas auditorías fallaron. Revisar umbrales.');
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(err => {
    console.error('🔥 Error fatal:', err);
    process.exit(1);
  });
}

module.exports = { runLighthouse };
