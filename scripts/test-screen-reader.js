#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Validaciones para lectores de pantalla
const screenReaderChecks = {
  altText: {
    pattern: /<img(?![^>]*alt=)/g,
    description: 'Imágenes sin atributo alt',
    severity: 'critical',
  },
  semanticHTML: {
    patterns: [
      { tag: '<header', name: 'header' },
      { tag: '<nav', name: 'nav' },
      { tag: '<main', name: 'main' },
      { tag: '<footer', name: 'footer' },
      { tag: '<article', name: 'article' },
      { tag: '<section', name: 'section' },
    ],
    description: 'Uso de HTML semántico',
    severity: 'moderate',
  },
  ariaLabels: {
    patterns: [
      'aria-label',
      'aria-labelledby',
      'aria-describedby',
      'aria-live',
    ],
    description: 'Atributos ARIA para lectores de pantalla',
    severity: 'serious',
  },
  headingHierarchy: {
    pattern: /<h[1-6]/g,
    description: 'Jerarquía de encabezados',
    severity: 'moderate',
  },
  formLabels: {
    pattern: /<input(?![^>]*(aria-label|aria-labelledby))/g,
    description: 'Inputs de formulario sin etiqueta',
    severity: 'serious',
  },
  skipLinks: {
    pattern: /(skip-link|skip-to-content|skip-to-main)/gi,
    description: 'Enlaces de salto para navegación',
    severity: 'moderate',
  },
  liveRegions: {
    pattern: /aria-live/g,
    description: 'Regiones live para actualizaciones dinámicas',
    severity: 'moderate',
  },
};

async function testScreenReaderCompatibility() {
  console.log('🔊 Iniciando pruebas de compatibilidad con lectores de pantalla...\n');

  const componentsDir = path.join(__dirname, '..', 'components');
  const appDir = path.join(__dirname, '..', 'app');

  // Buscar archivos TypeScript/React y CSS
  const files = [
    ...glob.sync(`${componentsDir}/**/*.{tsx,ts}`, { nodir: true }),
    ...glob.sync(`${appDir}/**/*.{tsx,ts}`, { nodir: true }),
    path.join(__dirname, '..', 'app', 'globals.css'),
  ];

  console.log(`📁 Archivos a analizar: ${files.length}\n`);

  const results = {
    totalFiles: files.length,
    issues: {
      critical: [],
      serious: [],
      moderate: [],
    },
    statistics: {
      imagesWithoutAlt: 0,
      semanticElements: 0,
      ariaAttributes: 0,
      headings: 0,
      skipLinks: 0,
      liveRegions: 0,
    },
    recommendations: [],
  };

  // Analizar cada archivo
  files.forEach((file) => {
    const content = fs.readFileSync(file, 'utf-8');
    const relativePath = path.relative(process.cwd(), file);

    // 1. Verificar imágenes sin alt
    const imgsWithoutAlt = content.match(screenReaderChecks.altText.pattern);
    if (imgsWithoutAlt && imgsWithoutAlt.length > 0) {
      results.issues.critical.push({
        file: relativePath,
        type: 'missing-alt-text',
        count: imgsWithoutAlt.length,
        message: `${imgsWithoutAlt.length} imagen(es) sin atributo alt`,
      });
      results.statistics.imagesWithoutAlt += imgsWithoutAlt.length;
    }

    // 2. Verificar HTML semántico
    screenReaderChecks.semanticHTML.patterns.forEach(({ tag, name }) => {
      if (content.includes(tag)) {
        results.statistics.semanticElements++;
      }
    });

    // 3. Contar atributos ARIA
    screenReaderChecks.ariaLabels.patterns.forEach((pattern) => {
      const matches = content.match(new RegExp(pattern, 'g'));
      if (matches) {
        results.statistics.ariaAttributes += matches.length;
      }
    });

    // 4. Verificar jerarquía de encabezados
    const headings = content.match(screenReaderChecks.headingHierarchy.pattern);
    if (headings) {
      results.statistics.headings += headings.length;

      // Verificar orden de encabezados
      const headingLevels = headings.map((h) =>
        parseInt(h.match(/h([1-6])/)[1])
      );
      for (let i = 1; i < headingLevels.length; i++) {
        if (headingLevels[i] > headingLevels[i - 1] + 1) {
          results.issues.moderate.push({
            file: relativePath,
            type: 'heading-hierarchy',
            message: `Salto en jerarquía de encabezados: h${headingLevels[i - 1]} a h${headingLevels[i]}`,
          });
        }
      }
    }

    // 5. Verificar inputs sin label
    const inputsWithoutLabel = content.match(
      screenReaderChecks.formLabels.pattern
    );
    if (inputsWithoutLabel && inputsWithoutLabel.length > 0) {
      results.issues.serious.push({
        file: relativePath,
        type: 'input-without-label',
        count: inputsWithoutLabel.length,
        message: `${inputsWithoutLabel.length} input(s) sin etiqueta accesible`,
      });
    }

    // 6. Verificar skip links
    const skipLinks = content.match(screenReaderChecks.skipLinks.pattern);
    if (skipLinks) {
      results.statistics.skipLinks += skipLinks.length;
    }

    // 7. Verificar regiones live
    const liveRegions = content.match(screenReaderChecks.liveRegions.pattern);
    if (liveRegions) {
      results.statistics.liveRegions += liveRegions.length;
    }

    // Recomendaciones específicas
    if (
      relativePath.includes('layout') ||
      relativePath.includes('page.tsx')
    ) {
      if (!content.includes('<main')) {
        results.recommendations.push({
          file: relativePath,
          type: 'missing-main-landmark',
          message:
            'Página sin elemento <main>. Se recomienda envolver el contenido principal.',
        });
      }

      if (!content.includes('skip-link') && !content.includes('skip-to')) {
        results.recommendations.push({
          file: relativePath,
          type: 'missing-skip-link',
          message:
            'Página sin link de salto. Mejora la experiencia con lectores de pantalla.',
        });
      }
    }
  });

  // Generar reporte
  console.log('='.repeat(80));
  console.log('🔊 REPORTE DE COMPATIBILIDAD CON LECTORES DE PANTALLA');
  console.log('='.repeat(80));

  console.log('\n📊 Estadísticas:\n');
  console.log(`   ✅ Elementos semánticos: ${results.statistics.semanticElements}`);
  console.log(`   🏷️  Atributos ARIA: ${results.statistics.ariaAttributes}`);
  console.log(`   📑 Encabezados: ${results.statistics.headings}`);
  console.log(`   🔗 Skip links: ${results.statistics.skipLinks}`);
  console.log(`   🔴 Regiones live: ${results.statistics.liveRegions}`);

  // Problemas encontrados
  if (results.issues.critical.length > 0) {
    console.log('\n🔴 Problemas Críticos:\n');
    results.issues.critical.slice(0, 10).forEach((issue, index) => {
      console.log(`   ${index + 1}. ${issue.file}`);
      console.log(`      ${issue.message}\n`);
    });
  }

  if (results.issues.serious.length > 0) {
    console.log('\n🟠 Problemas Serios:\n');
    results.issues.serious.slice(0, 10).forEach((issue, index) => {
      console.log(`   ${index + 1}. ${issue.file}`);
      console.log(`      ${issue.message}\n`);
    });
  }

  if (results.issues.moderate.length > 0) {
    console.log('\n🟡 Problemas Moderados:\n');
    results.issues.moderate.slice(0, 5).forEach((issue, index) => {
      console.log(`   ${index + 1}. ${issue.file}`);
      console.log(`      ${issue.message}\n`);
    });
  }

  if (results.recommendations.length > 0) {
    console.log('\n💡 Recomendaciones (primeras 10):\n');
    results.recommendations.slice(0, 10).forEach((rec, index) => {
      console.log(`   ${index + 1}. ${rec.file}`);
      console.log(`      Tipo: ${rec.type}`);
      console.log(`      ${rec.message}\n`);
    });
  }

  // Puntuación
  const criticalPenalty = results.issues.critical.length * 10;
  const seriousPenalty = results.issues.serious.length * 5;
  const moderatePenalty = results.issues.moderate.length * 2;

  const finalScore = Math.max(
    0,
    100 - criticalPenalty - seriousPenalty - moderatePenalty
  );

  console.log('\n🎯 Puntuación de Compatibilidad con Lectores de Pantalla:');
  console.log(`   ${finalScore}/100`);

  if (finalScore >= 90) {
    console.log('   ✅ Excelente compatibilidad con lectores de pantalla');
  } else if (finalScore >= 75) {
    console.log('   ⚠️  Compatibilidad aceptable, se recomienda mejorar');
  } else if (finalScore >= 50) {
    console.log('   ⚠️  Compatibilidad insuficiente, requiere atención');
  } else {
    console.log(
      '   ❌ Compatibilidad crítica, requiere mejoras urgentes'
    );
  }

  console.log('\n' + '='.repeat(80) + '\n');

  // Guardar reporte
  const reportPath = path.join(
    __dirname,
    '..',
    'screen-reader-report.json'
  );
  fs.writeFileSync(
    reportPath,
    JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        summary: {
          totalFiles: results.totalFiles,
          criticalIssues: results.issues.critical.length,
          seriousIssues: results.issues.serious.length,
          moderateIssues: results.issues.moderate.length,
          recommendations: results.recommendations.length,
          score: finalScore,
        },
        statistics: results.statistics,
        issues: results.issues,
        recommendations: results.recommendations,
      },
      null,
      2
    )
  );

  console.log('💾 Reporte guardado en: screen-reader-report.json\n');

  return {
    finalScore,
    criticalIssues: results.issues.critical.length,
  };
}

// Ejecutar
if (require.main === module) {
  testScreenReaderCompatibility()
    .then(({ finalScore, criticalIssues }) => {
      process.exit(criticalIssues > 5 || finalScore < 70 ? 1 : 0);
    })
    .catch((error) => {
      console.error('❌ Error fatal:', error);
      process.exit(1);
    });
}

module.exports = { testScreenReaderCompatibility };
