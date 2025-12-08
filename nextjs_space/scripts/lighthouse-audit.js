/**
 * Script para ejecutar auditorías de Lighthouse automáticamente
 * 
 * Uso:
 *   yarn lighthouse:audit
 * 
 * O manualmente:
 *   node scripts/lighthouse-audit.js
 */

const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');
const fs = require('fs');
const path = require('path');

// Configuración de páginas a auditar
const PAGES_TO_AUDIT = [
  { name: 'Home', url: 'http://localhost:3000' },
  { name: 'Dashboard', url: 'http://localhost:3000/dashboard' },
  { name: 'Edificios', url: 'http://localhost:3000/edificios' },
  { name: 'Contratos', url: 'http://localhost:3000/contratos' },
  { name: 'Pagos', url: 'http://localhost:3000/pagos' },
];

// Configuración de Lighthouse
const lighthouseConfig = {
  extends: 'lighthouse:default',
  settings: {
    onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
    formFactor: 'desktop',
    throttling: {
      rttMs: 40,
      throughputKbps: 10240,
      cpuSlowdownMultiplier: 1,
      requestLatencyMs: 0,
      downloadThroughputKbps: 0,
      uploadThroughputKbps: 0,
    },
    screenEmulation: {
      mobile: false,
      width: 1350,
      height: 940,
      deviceScaleFactor: 1,
      disabled: false,
    },
  },
};

async function runLighthouse(url, name) {
  console.log(`\n🔍 Ejecutando auditoría de Lighthouse para: ${name}`);
  console.log(`   URL: ${url}`);

  const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless'] });
  const options = {
    logLevel: 'info',
    output: 'json',
    port: chrome.port,
  };

  try {
    const runnerResult = await lighthouse(url, options, lighthouseConfig);
    const reportJson = runnerResult.lhr;

    // Extraer métricas clave
    const scores = {
      performance: reportJson.categories.performance.score * 100,
      accessibility: reportJson.categories.accessibility.score * 100,
      bestPractices: reportJson.categories['best-practices'].score * 100,
      seo: reportJson.categories.seo.score * 100,
    };

    const metrics = {
      fcp: reportJson.audits['first-contentful-paint'].numericValue,
      lcp: reportJson.audits['largest-contentful-paint'].numericValue,
      cls: reportJson.audits['cumulative-layout-shift'].numericValue,
      tbt: reportJson.audits['total-blocking-time'].numericValue,
      tti: reportJson.audits['interactive'].numericValue,
      si: reportJson.audits['speed-index'].numericValue,
    };

    // Mostrar resultados en consola
    console.log('\n📊 Puntuaciones:');
    console.log(`   Performance:     ${scores.performance.toFixed(0)}`);
    console.log(`   Accessibility:   ${scores.accessibility.toFixed(0)}`);
    console.log(`   Best Practices:  ${scores.bestPractices.toFixed(0)}`);
    console.log(`   SEO:             ${scores.seo.toFixed(0)}`);

    console.log('\n⚡ Métricas Core Web Vitals:');
    console.log(`   FCP: ${(metrics.fcp / 1000).toFixed(2)}s`);
    console.log(`   LCP: ${(metrics.lcp / 1000).toFixed(2)}s`);
    console.log(`   CLS: ${metrics.cls.toFixed(3)}`);
    console.log(`   TBT: ${metrics.tbt.toFixed(0)}ms`);
    console.log(`   TTI: ${(metrics.tti / 1000).toFixed(2)}s`);
    console.log(`   SI:  ${(metrics.si / 1000).toFixed(2)}s`);

    // Guardar reporte completo
    const reportsDir = path.join(__dirname, '..', 'lighthouse-reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    const fileName = `${name.toLowerCase().replace(/\s+/g, '-')}-${timestamp}.json`;
    const filePath = path.join(reportsDir, fileName);

    fs.writeFileSync(filePath, JSON.stringify(reportJson, null, 2));
    console.log(`\n💾 Reporte guardado en: ${filePath}`);

    return { name, scores, metrics, reportPath: filePath };
  } catch (error) {
    console.error(`❌ Error en auditoría para ${name}:`, error.message);
    return null;
  } finally {
    await chrome.kill();
  }
}

async function runAllAudits() {
  console.log('\n🚀 Iniciando auditorías de Lighthouse...');
  console.log('   Asegúrate de que el servidor esté corriendo en http://localhost:3000\n');

  const results = [];

  for (const page of PAGES_TO_AUDIT) {
    const result = await runLighthouse(page.url, page.name);
    if (result) {
      results.push(result);
    }
    // Esperar un poco entre auditorías
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // Generar reporte resumen
  console.log('\n\n📈 RESUMEN DE AUDITORÍAS');
  console.log('═'.repeat(80));
  
  results.forEach(result => {
    console.log(`\n${result.name}:`);
    console.log(`  Performance:     ${result.scores.performance.toFixed(0)}`);
    console.log(`  Accessibility:   ${result.scores.accessibility.toFixed(0)}`);
    console.log(`  Best Practices:  ${result.scores.bestPractices.toFixed(0)}`);
    console.log(`  SEO:             ${result.scores.seo.toFixed(0)}`);
  });

  // Calcular promedios
  const avgScores = {
    performance: results.reduce((sum, r) => sum + r.scores.performance, 0) / results.length,
    accessibility: results.reduce((sum, r) => sum + r.scores.accessibility, 0) / results.length,
    bestPractices: results.reduce((sum, r) => sum + r.scores.bestPractices, 0) / results.length,
    seo: results.reduce((sum, r) => sum + r.scores.seo, 0) / results.length,
  };

  console.log('\n\nPROMEDIO GENERAL:');
  console.log(`  Performance:     ${avgScores.performance.toFixed(0)}`);
  console.log(`  Accessibility:   ${avgScores.accessibility.toFixed(0)}`);
  console.log(`  Best Practices:  ${avgScores.bestPractices.toFixed(0)}`);
  console.log(`  SEO:             ${avgScores.seo.toFixed(0)}`);
  console.log('\n');

  // Guardar resumen
  const summaryPath = path.join(__dirname, '..', 'lighthouse-reports', 'summary.json');
  fs.writeFileSync(
    summaryPath,
    JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        results,
        averages: avgScores,
      },
      null,
      2
    )
  );

  console.log(`✅ Auditorías completadas. Resumen guardado en: ${summaryPath}\n`);
}

// Ejecutar auditorías
if (require.main === module) {
  runAllAudits().catch(error => {
    console.error('Error ejecutando auditorías:', error);
    process.exit(1);
  });
}

module.exports = { runLighthouse, runAllAudits };
