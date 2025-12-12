#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Patrones a buscar para validar navegación por teclado
const keyboardPatterns = {
  focusVisible: {
    pattern: /(focus-visible|focus:)/g,
    description: 'Estilos focus-visible para navegación por teclado',
    required: true,
  },
  tabindex: {
    pattern: /tabindex|tabIndex/g,
    description: 'Uso de tabindex para controlar orden de foco',
    required: false,
  },
  ariaLabel: {
    pattern: /(aria-label|ariaLabel)/g,
    description: 'Etiquetas aria-label para elementos interactivos',
    required: true,
  },
  role: {
    pattern: /role=["|'](button|link|navigation|dialog|alert)/g,
    description: 'Roles ARIA para semantica correcta',
    required: true,
  },
  skipLink: {
    pattern: /(skip-link|skip-to-content)/g,
    description: 'Links de salto para navegación rápida',
    required: true,
  },
  keyboardHandlers: {
    pattern: /(onKeyDown|onKeyUp|onKeyPress)/g,
    description: 'Manejadores de eventos de teclado',
    required: true,
  },
};

// Componentes críticos que deben tener accesibilidad de teclado
const criticalComponents = [
  'button',
  'input',
  'select',
  'dialog',
  'modal',
  'dropdown',
  'menu',
  'tabs',
  'accordion',
];

async function testKeyboardNavigation() {
  console.log('⌨️  Iniciando pruebas de navegación por teclado...\n');

  const componentsDir = path.join(__dirname, '..', 'components');
  const appDir = path.join(__dirname, '..', 'app');

  // Buscar archivos TypeScript/React
  const componentFiles = [
    ...glob.sync(`${componentsDir}/**/*.{tsx,ts}`, { nodir: true }),
    ...glob.sync(`${appDir}/**/*.{tsx,ts}`, { nodir: true }),
  ];

  console.log(`📁 Archivos a analizar: ${componentFiles.length}\n`);

  const results = {
    totalFiles: componentFiles.length,
    filesWithIssues: 0,
    patterns: {},
    criticalIssues: [],
    recommendations: [],
  };

  // Inicializar contadores de patrones
  Object.keys(keyboardPatterns).forEach((key) => {
    results.patterns[key] = {
      count: 0,
      files: [],
      description: keyboardPatterns[key].description,
    };
  });

  // Analizar cada archivo
  componentFiles.forEach((file) => {
    const content = fs.readFileSync(file, 'utf-8');
    const relativePath = path.relative(process.cwd(), file);

    let fileHasIssues = false;

    // Buscar patrones
    Object.entries(keyboardPatterns).forEach(([key, config]) => {
      const matches = content.match(config.pattern);
      if (matches) {
        results.patterns[key].count += matches.length;
        results.patterns[key].files.push(relativePath);
      } else if (config.required) {
        // Verificar si es un componente crítico sin el patrón requerido
        const isCritical = criticalComponents.some((comp) =>
          relativePath.toLowerCase().includes(comp)
        );

        if (isCritical) {
          fileHasIssues = true;
          results.criticalIssues.push({
            file: relativePath,
            missing: key,
            description: config.description,
          });
        }
      }
    });

    // Detectar botones sin aria-label
    const buttonMatches = content.match(/<button[^>]*>/g) || [];
    buttonMatches.forEach((button) => {
      if (
        !button.includes('aria-label') &&
        !button.includes('ariaLabel') &&
        !content.includes('>') // Tiene contenido de texto
      ) {
        fileHasIssues = true;
        results.recommendations.push({
          file: relativePath,
          type: 'button-without-label',
          message:
            'Botón sin aria-label o texto visible. Considere agregar etiqueta descriptiva.',
        });
      }
    });

    // Detectar inputs sin label asociado
    const inputMatches = content.match(/<input[^>]*>/g) || [];
    inputMatches.forEach((input) => {
      if (!input.includes('aria-label') && !input.includes('aria-labelledby')) {
        results.recommendations.push({
          file: relativePath,
          type: 'input-without-label',
          message:
            'Input sin label asociado. Use <label>, aria-label o aria-labelledby.',
        });
      }
    });

    if (fileHasIssues) {
      results.filesWithIssues++;
    }
  });

  // Generar reporte
  console.log('='.repeat(80));
  console.log('⌨️  REPORTE DE NAVEGACIÓN POR TECLADO');
  console.log('='.repeat(80));

  console.log('\n📊 Resumen de Patrones Encontrados:\n');
  Object.entries(results.patterns).forEach(([key, data]) => {
    const status = data.count > 0 ? '✅' : '⚠️ ';
    console.log(`   ${status} ${data.description}:`);
    console.log(`      Ocurrencias: ${data.count}`);
    console.log(`      Archivos: ${data.files.length}\n`);
  });

  if (results.criticalIssues.length > 0) {
    console.log('\n🔴 Problemas Críticos:\n');
    results.criticalIssues.forEach((issue, index) => {
      console.log(`   ${index + 1}. ${issue.file}`);
      console.log(`      Falta: ${issue.description}\n`);
    });
  }

  if (results.recommendations.length > 0) {
    console.log('\n💡 Recomendaciones (primeras 10):\n');
    results.recommendations.slice(0, 10).forEach((rec, index) => {
      console.log(`   ${index + 1}. ${rec.file}`);
      console.log(`      Tipo: ${rec.type}`);
      console.log(`      ${rec.message}\n`);
    });

    if (results.recommendations.length > 10) {
      console.log(
        `   ... y ${results.recommendations.length - 10} recomendaciones más\n`
      );
    }
  }

  // Puntuación
  const criticalScore = Math.max(
    0,
    100 - results.criticalIssues.length * 10
  );
  const recommendationScore = Math.max(
    0,
    100 - results.recommendations.length * 2
  );
  const finalScore = Math.round((criticalScore + recommendationScore) / 2);

  console.log('\n🎯 Puntuación de Navegación por Teclado:');
  console.log(`   ${finalScore}/100`);

  if (finalScore >= 90) {
    console.log('   ✅ Excelente navegación por teclado');
  } else if (finalScore >= 75) {
    console.log('   ⚠️  Navegación aceptable, se recomienda mejorar');
  } else if (finalScore >= 50) {
    console.log('   ⚠️  Navegación insuficiente, requiere atención');
  } else {
    console.log('   ❌ Navegación crítica, requiere mejoras urgentes');
  }

  console.log('\n' + '='.repeat(80) + '\n');

  // Guardar reporte
  const reportPath = path.join(
    __dirname,
    '..',
    'keyboard-navigation-report.json'
  );
  fs.writeFileSync(
    reportPath,
    JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        summary: {
          totalFiles: results.totalFiles,
          filesWithIssues: results.filesWithIssues,
          criticalIssues: results.criticalIssues.length,
          recommendations: results.recommendations.length,
          score: finalScore,
        },
        patterns: results.patterns,
        criticalIssues: results.criticalIssues,
        recommendations: results.recommendations,
      },
      null,
      2
    )
  );

  console.log('💾 Reporte guardado en: keyboard-navigation-report.json\n');

  return { finalScore, criticalIssues: results.criticalIssues.length };
}

// Ejecutar
if (require.main === module) {
  testKeyboardNavigation()
    .then(({ finalScore, criticalIssues }) => {
      process.exit(criticalIssues > 5 || finalScore < 70 ? 1 : 0);
    })
    .catch((error) => {
      console.error('❌ Error fatal:', error);
      process.exit(1);
    });
}

module.exports = { testKeyboardNavigation };
