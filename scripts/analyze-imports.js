/**
 * Import Analyzer
 * 
 * Este script analiza los imports en el proyecto para identificar
 * oportunidades de optimización.
 * 
 * Uso:
 *   node scripts/analyze-imports.js
 */

const fs = require('fs');
const path = require('path');

// Colores para terminal
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Patrones problemáticos a buscar
const PATTERNS = [
  {
    name: 'Wildcard imports de lucide-react',
    pattern: /import\s+\*\s+as\s+\w+\s+from\s+['"]lucide-react['"]/g,
    severity: 'high',
    suggestion: "Usar imports específicos: import { Home, User } from 'lucide-react'",
  },
  {
    name: 'Import completo de recharts (sin lazy)',
    pattern: /import\s+{[^}]+}\s+from\s+['"]recharts['"]/g,
    severity: 'high',
    suggestion: "Usar lazy loading: import { LineChart } from '@/components/ui/lazy-charts-extended'",
  },
  {
    name: 'Import de lodash completo',
    pattern: /import\s+_\s+from\s+['"]lodash['"]/g,
    severity: 'medium',
    suggestion: "Usar imports específicos: import { map, filter } from 'lodash'",
  },
  {
    name: 'Import de date-fns sin especificar función',
    pattern: /import\s+{[^}]+}\s+from\s+['"]date-fns['"]/g,
    severity: 'low',
    suggestion: "Considerar: import { format } from 'date-fns/format' para mejor tree-shaking",
  },
  {
    name: 'Import de moment.js',
    pattern: /import\s+moment\s+from\s+['"]moment['"]/g,
    severity: 'high',
    suggestion: 'Considerar migrar a date-fns o dayjs (más ligeros)',
  },
];

function analyzeFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const issues = [];

  PATTERNS.forEach(pattern => {
    const matches = content.match(pattern.pattern);
    if (matches) {
      matches.forEach(match => {
        issues.push({
          pattern: pattern.name,
          severity: pattern.severity,
          suggestion: pattern.suggestion,
          match: match.trim(),
        });
      });
    }
  });

  return issues;
}

function walkDirectory(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // Skip node_modules, .next, etc.
      if (!['node_modules', '.next', '.git', 'dist', 'build'].includes(file)) {
        walkDirectory(filePath, fileList);
      }
    } else if (file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.jsx') || file.endsWith('.js')) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

function analyzeProject() {
  log('\n🔍 Analyzing imports in project...\n', 'blue');

  const projectRoot = process.cwd();
  const appDir = path.join(projectRoot, 'app');
  const componentsDir = path.join(projectRoot, 'components');
  const libDir = path.join(projectRoot, 'lib');

  const files = [
    ...walkDirectory(appDir),
    ...(fs.existsSync(componentsDir) ? walkDirectory(componentsDir) : []),
    ...(fs.existsSync(libDir) ? walkDirectory(libDir) : []),
  ];

  log(`📂 Found ${files.length} files to analyze\n`, 'cyan');

  const allIssues = {};
  let totalIssues = 0;

  files.forEach(file => {
    const issues = analyzeFile(file);
    if (issues.length > 0) {
      allIssues[file.replace(projectRoot, '.')] = issues;
      totalIssues += issues.length;
    }
  });

  // Summary by severity
  const summary = {
    high: 0,
    medium: 0,
    low: 0,
  };

  Object.values(allIssues).forEach(issues => {
    issues.forEach(issue => {
      summary[issue.severity]++;
    });
  });

  // Display results
  log('📊 Summary:', 'blue');
  log(`   Total Issues: ${totalIssues}`);
  log(`   🔴 High: ${summary.high}`, summary.high > 0 ? 'red' : 'green');
  log(`   🟡 Medium: ${summary.medium}`, summary.medium > 0 ? 'yellow' : 'green');
  log(`   🟢 Low: ${summary.low}\n`, summary.low > 0 ? 'cyan' : 'green');

  if (totalIssues === 0) {
    log('✅ No import issues found! Great job!\n', 'green');
    return;
  }

  // Display detailed issues
  log('📋 Detailed Issues:\n', 'blue');

  Object.entries(allIssues).forEach(([file, issues]) => {
    log(`📄 ${file}`, 'cyan');
    issues.forEach((issue, index) => {
      const severityColor = issue.severity === 'high' ? 'red' : issue.severity === 'medium' ? 'yellow' : 'cyan';
      const severityIcon = issue.severity === 'high' ? '🔴' : issue.severity === 'medium' ? '🟡' : '🟢';
      
      log(`   ${severityIcon} [${issue.severity.toUpperCase()}] ${issue.pattern}`, severityColor);
      log(`      Found: ${issue.match}`);
      log(`      💡 ${issue.suggestion}\n`, 'yellow');
    });
  });

  // Recommendations
  log('\n' + '='.repeat(80), 'blue');
  log('\n📌 Recommendations:\n', 'cyan');
  
  if (summary.high > 0) {
    log('🔴 HIGH PRIORITY:', 'red');
    log('   - Fix wildcard imports and direct recharts usage', 'red');
    log('   - These have the biggest impact on bundle size\n', 'red');
  }
  
  if (summary.medium > 0) {
    log('🟡 MEDIUM PRIORITY:', 'yellow');
    log('   - Optimize lodash and other utility library imports', 'yellow');
    log('   - Consider using tree-shakeable alternatives\n', 'yellow');
  }
  
  if (summary.low > 0) {
    log('🟢 LOW PRIORITY:', 'cyan');
    log('   - Fine-tune date-fns imports for better tree-shaking', 'cyan');
    log('   - These are minor but good to address over time\n', 'cyan');
  }

  log('For more information, see: OPTIMIZACION_BUNDLE.md\n', 'blue');
}

// Run the analysis
try {
  analyzeProject();
} catch (error) {
  log(`\n❌ Error during analysis: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
}
