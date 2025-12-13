#!/usr/bin/env node

const { AxePuppeteer } = require('@axe-core/puppeteer');
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Páginas principales a probar
const pagesToTest = [
  { name: 'Landing Page', url: 'http://localhost:3000/landing' },
  { name: 'Login Page', url: 'http://localhost:3000/login' },
  { name: 'Register Page', url: 'http://localhost:3000/register' },
  { name: 'Dashboard', url: 'http://localhost:3000/dashboard' },
  { name: 'Buildings', url: 'http://localhost:3000/edificios' },
  { name: 'Units', url: 'http://localhost:3000/unidades' },
  { name: 'Tenants', url: 'http://localhost:3000/inquilinos' },
  { name: 'Contracts', url: 'http://localhost:3000/contratos' },
];

// Niveles de impacto según WCAG
const impactLevels = {
  critical: { emoji: '🔴', weight: 4 },
  serious: { emoji: '🟠', weight: 3 },
  moderate: { emoji: '🟡', weight: 2 },
  minor: { emoji: '🟢', weight: 1 },
};

async function testAccessibility() {
  console.log('🚀 Iniciando pruebas de accesibilidad con axe-core...\n');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const allResults = [];
  let totalViolations = 0;
  let criticalCount = 0;
  let seriousCount = 0;
  let moderateCount = 0;
  let minorCount = 0;

  try {
    for (const page of pagesToTest) {
      console.log(`\n📄 Probando: ${page.name}`);
      console.log(`   URL: ${page.url}`);

      const browserPage = await browser.newPage();

      try {
        // Configurar viewport para responsive testing
        await browserPage.setViewport({ width: 1920, height: 1080 });

        // Navegar a la página
        await browserPage.goto(page.url, {
          waitUntil: 'networkidle2',
          timeout: 30000,
        });

        // Ejecutar axe
        const results = await new AxePuppeteer(browserPage)
          .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
          .analyze();

        const violations = results.violations;
        totalViolations += violations.length;

        // Contar por impacto
        violations.forEach((v) => {
          if (v.impact === 'critical') criticalCount++;
          if (v.impact === 'serious') seriousCount++;
          if (v.impact === 'moderate') moderateCount++;
          if (v.impact === 'minor') minorCount++;
        });

        console.log(`   ✅ Análisis completado`);
        console.log(`   📊 Violaciones encontradas: ${violations.length}`);

        if (violations.length > 0) {
          console.log('\n   🔍 Desglose por impacto:');
          const impactCounts = {};
          violations.forEach((v) => {
            impactCounts[v.impact] = (impactCounts[v.impact] || 0) + 1;
          });

          Object.entries(impactCounts).forEach(([impact, count]) => {
            console.log(
              `      ${impactLevels[impact]?.emoji || '⚪'} ${impact}: ${count}`
            );
          });
        }

        allResults.push({
          page: page.name,
          url: page.url,
          violations,
          passes: results.passes.length,
          incomplete: results.incomplete.length,
        });
      } catch (error) {
        console.error(`   ❌ Error al probar ${page.name}:`, error.message);
        allResults.push({
          page: page.name,
          url: page.url,
          error: error.message,
          violations: [],
          passes: 0,
          incomplete: 0,
        });
      }

      await browserPage.close();
    }
  } finally {
    await browser.close();
  }

  // Generar reporte
  console.log('\n\n' + '='.repeat(80));
  console.log('📊 RESUMEN DE ACCESIBILIDAD');
  console.log('='.repeat(80));
  console.log(`\n📈 Estadísticas Globales:`);
  console.log(`   • Páginas probadas: ${pagesToTest.length}`);
  console.log(`   • Total de violaciones: ${totalViolations}`);
  console.log(`   • Críticas: 🔴 ${criticalCount}`);
  console.log(`   • Serias: 🟠 ${seriousCount}`);
  console.log(`   • Moderadas: 🟡 ${moderateCount}`);
  console.log(`   • Menores: 🟢 ${minorCount}`);

  // Detalles por página
  console.log('\n📄 Detalles por Página:\n');
  allResults.forEach((result) => {
    console.log(`   ${result.page}:`);
    if (result.error) {
      console.log(`      ❌ Error: ${result.error}`);
    } else {
      console.log(`      ✅ Pruebas pasadas: ${result.passes}`);
      console.log(`      ⚠️  Violaciones: ${result.violations.length}`);
      console.log(`      ⏸️  Incompletas: ${result.incomplete}`);
    }
  });

  // Violaciones más comunes
  console.log('\n🔝 Violaciones Más Comunes:\n');
  const violationFrequency = {};
  allResults.forEach((result) => {
    result.violations.forEach((v) => {
      const key = v.id;
      violationFrequency[key] = violationFrequency[key] || {
        count: 0,
        description: v.description,
        impact: v.impact,
        helpUrl: v.helpUrl,
      };
      violationFrequency[key].count++;
    });
  });

  const sortedViolations = Object.entries(violationFrequency)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 10);

  sortedViolations.forEach(([id, data], index) => {
    console.log(`   ${index + 1}. ${id} (${data.count} ocurrencias)`);
    console.log(`      ${impactLevels[data.impact]?.emoji || '⚪'} Impacto: ${data.impact}`);
    console.log(`      📖 ${data.description}`);
    console.log(`      🔗 ${data.helpUrl}\n`);
  });

  // Guardar reporte JSON
  const reportPath = path.join(__dirname, '..', 'accessibility-report.json');
  fs.writeFileSync(
    reportPath,
    JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        summary: {
          totalPages: pagesToTest.length,
          totalViolations,
          criticalCount,
          seriousCount,
          moderateCount,
          minorCount,
        },
        results: allResults,
        topViolations: sortedViolations.map(([id, data]) => ({
          id,
          ...data,
        })),
      },
      null,
      2
    )
  );

  console.log('\n💾 Reporte guardado en: accessibility-report.json');

  // Score de accesibilidad (simplificado)
  const score =
    100 -
    (criticalCount * 10 +
      seriousCount * 5 +
      moderateCount * 2 +
      minorCount * 1);
  const finalScore = Math.max(0, score);

  console.log('\n🎯 Puntuación de Accesibilidad:');
  console.log(`   ${finalScore}/100`);

  if (finalScore >= 90) {
    console.log('   ✅ Excelente nivel de accesibilidad');
  } else if (finalScore >= 75) {
    console.log('   ⚠️  Nivel de accesibilidad aceptable, se recomienda mejorar');
  } else if (finalScore >= 50) {
    console.log('   ⚠️  Nivel de accesibilidad bajo, requiere atención');
  } else {
    console.log('   ❌ Nivel de accesibilidad crítico, requiere mejoras urgentes');
  }

  console.log('\n' + '='.repeat(80) + '\n');

  return { finalScore, totalViolations };
}

// Ejecutar
if (require.main === module) {
  testAccessibility()
    .then(({ finalScore, totalViolations }) => {
      process.exit(totalViolations > 20 || finalScore < 70 ? 1 : 0);
    })
    .catch((error) => {
      console.error('❌ Error fatal:', error);
      process.exit(1);
    });
}

module.exports = { testAccessibility };
