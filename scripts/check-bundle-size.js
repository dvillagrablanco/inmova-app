/**
 * Bundle Size Checker
 * 
 * Este script verifica que el tamaño del bundle no exceda los límites establecidos.
 * Se ejecuta después del build para validar.
 * 
 * Uso:
 *   node scripts/check-bundle-size.js
 */

const fs = require('fs');
const path = require('path');

// Configuración de límites (en bytes)
const LIMITS = {
  maxTotalSize: 6 * 1024 * 1024, // 6MB total
  maxChunkSize: 1.5 * 1024 * 1024, // 1.5MB por chunk
  maxFirstLoadJS: 800 * 1024, // 800KB first load JS
  warningThreshold: 0.85, // 85% del límite genera warning
};

// Colores para terminal
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

function analyzeDirectory(dir) {
  if (!fs.existsSync(dir)) {
    log(`❌ Directory not found: ${dir}`, 'red');
    return null;
  }

  let totalSize = 0;
  const files = [];

  function walkDir(currentPath) {
    const items = fs.readdirSync(currentPath);

    items.forEach(item => {
      const fullPath = path.join(currentPath, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        walkDir(fullPath);
      } else if (stat.isFile() && (item.endsWith('.js') || item.endsWith('.css'))) {
        const size = stat.size;
        totalSize += size;
        files.push({
          path: fullPath.replace(dir, ''),
          size: size,
        });
      }
    });
  }

  walkDir(dir);

  return {
    totalSize,
    files: files.sort((a, b) => b.size - a.size),
  };
}

function checkBundleSize() {
  log('\n📦 Analyzing bundle size...\n', 'blue');

  const buildDir = path.join(process.cwd(), '.next');
  const staticDir = path.join(buildDir, 'static');

  if (!fs.existsSync(staticDir)) {
    log('❌ Build directory not found. Run `yarn build` first.', 'red');
    process.exit(1);
  }

  const analysis = analyzeDirectory(staticDir);

  if (!analysis) {
    log('❌ Failed to analyze bundle', 'red');
    process.exit(1);
  }

  const { totalSize, files } = analysis;

  // Report total size
  log('📊 Total Bundle Size:', 'blue');
  log(`   ${formatBytes(totalSize)}\n`);

  // Check against limits
  let hasErrors = false;
  let hasWarnings = false;

  // Check total size
  const totalPercentage = (totalSize / LIMITS.maxTotalSize) * 100;
  if (totalSize > LIMITS.maxTotalSize) {
    log(`❌ Total size exceeds limit: ${formatBytes(totalSize)} > ${formatBytes(LIMITS.maxTotalSize)}`, 'red');
    hasErrors = true;
  } else if (totalSize > LIMITS.maxTotalSize * LIMITS.warningThreshold) {
    log(`⚠️  Total size approaching limit: ${formatBytes(totalSize)} (${totalPercentage.toFixed(1)}% of ${formatBytes(LIMITS.maxTotalSize)})`, 'yellow');
    hasWarnings = true;
  } else {
    log(`✅ Total size within limits: ${formatBytes(totalSize)} (${totalPercentage.toFixed(1)}% of ${formatBytes(LIMITS.maxTotalSize)})`, 'green');
  }

  // Check largest chunks
  log('\n📁 Top 10 Largest Files:', 'blue');
  const top10 = files.slice(0, 10);
  
  top10.forEach((file, index) => {
    const percentage = (file.size / LIMITS.maxChunkSize) * 100;
    let color = 'reset';
    let status = '  ';

    if (file.size > LIMITS.maxChunkSize) {
      color = 'red';
      status = '❌';
      hasErrors = true;
    } else if (file.size > LIMITS.maxChunkSize * LIMITS.warningThreshold) {
      color = 'yellow';
      status = '⚠️ ';
      hasWarnings = true;
    } else {
      color = 'green';
      status = '✅';
    }

    log(`${status} ${index + 1}. ${file.path}`, color);
    log(`     Size: ${formatBytes(file.size)} (${percentage.toFixed(1)}% of limit)\n`);
  });

  // Summary
  log('\n' + '='.repeat(60), 'blue');
  if (hasErrors) {
    log('\n❌ BUNDLE SIZE CHECK FAILED', 'red');
    log('   Some files exceed the size limits.', 'red');
    log('   Consider:', 'yellow');
    log('   - Implementing code splitting', 'yellow');
    log('   - Lazy loading heavy components', 'yellow');
    log('   - Optimizing dependencies', 'yellow');
    log('   - Using dynamic imports\n', 'yellow');
    process.exit(1);
  } else if (hasWarnings) {
    log('\n⚠️  BUNDLE SIZE CHECK PASSED WITH WARNINGS', 'yellow');
    log('   Some files are approaching size limits.', 'yellow');
    log('   Consider optimization before adding more features.\n', 'yellow');
    process.exit(0);
  } else {
    log('\n✅ BUNDLE SIZE CHECK PASSED', 'green');
    log('   All files are within acceptable size limits.\n', 'green');
    process.exit(0);
  }
}

// Run the check
try {
  checkBundleSize();
} catch (error) {
  log(`\n❌ Error during bundle size check: ${error.message}`, 'red');
  process.exit(1);
}
