/**
 * Performance Analysis Script
 * Analyzes the application for performance issues and provides recommendations
 */
import * as fs from 'fs';
import * as path from 'path';

interface PerformanceIssue {
  severity: 'high' | 'medium' | 'low';
  category: string;
  file: string;
  issue: string;
  recommendation: string;
}

const issues: PerformanceIssue[] = [];

// Helper to recursively find files
function findFiles(dir: string, pattern: RegExp, files: string[] = []): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      // Skip node_modules and build directories
      if (!['node_modules', '.next', '.git', 'dist'].includes(entry.name)) {
        findFiles(fullPath, pattern, files);
      }
    } else if (pattern.test(entry.name)) {
      files.push(fullPath);
    }
  }
  
  return files;
}

// Check for unoptimized images
function checkUnoptimizedImages(rootDir: string) {
  console.log('\n🖼️  Checking for unoptimized images...');
  
  const componentFiles = findFiles(rootDir, /\.(tsx|jsx)$/);
  let unoptimizedCount = 0;
  
  for (const file of componentFiles) {
    const content = fs.readFileSync(file, 'utf-8');
    
    // Check for <img> tags instead of Next.js Image
    const imgMatches = content.match(/<img[^>]+>/g);
    if (imgMatches && !content.includes('from "next/image"')) {
      unoptimizedCount++;
      issues.push({
        severity: 'medium',
        category: 'Images',
        file: file.replace(rootDir, ''),
        issue: `Using <img> tag instead of Next.js Image component`,
        recommendation: 'Replace with <Image> from "next/image" for automatic optimization',
      });
    }
  }
  
  console.log(`   Found ${unoptimizedCount} files with potentially unoptimized images`);
}

// Check for missing lazy loading
function checkLazyLoading(rootDir: string) {
  console.log('\n👌 Checking for missing lazy loading...');
  
  const componentFiles = findFiles(rootDir, /\.(tsx|jsx)$/);
  let heavyComponents = 0;
  
  for (const file of componentFiles) {
    const content = fs.readFileSync(file, 'utf-8');
    
    // Check for heavy libraries without lazy loading
    const heavyLibs = ['plotly.js', 'react-plotly', 'recharts', 'chart.js'];
    
    for (const lib of heavyLibs) {
      if (content.includes(`from "${lib}"`) || content.includes(`from '${lib}'`)) {
        if (!content.includes('lazy') && !content.includes('Suspense')) {
          heavyComponents++;
          issues.push({
            severity: 'high',
            category: 'Bundle Size',
            file: file.replace(rootDir, ''),
            issue: `Heavy library "${lib}" imported without lazy loading`,
            recommendation: `Use dynamic import: const Chart = dynamic(() => import('${lib}'))`,
          });
        }
      }
    }
  }
  
  console.log(`   Found ${heavyComponents} heavy components without lazy loading`);
}

// Check for N+1 query problems
function checkNPlusOneQueries(rootDir: string) {
  console.log('\n🔍 Checking for potential N+1 query problems...');
  
  const apiFiles = findFiles(path.join(rootDir, 'app/api'), /route\.ts$/);
  let potentialIssues = 0;
  
  for (const file of apiFiles) {
    const content = fs.readFileSync(file, 'utf-8');
    
    // Check for queries in loops
    if (content.match(/for\s*\([^)]+\)\s*{[^}]*await\s+prisma/s)) {
      potentialIssues++;
      issues.push({
        severity: 'high',
        category: 'Database',
        file: file.replace(rootDir, ''),
        issue: 'Potential N+1 query problem (query inside loop)',
        recommendation: 'Use Promise.all() or Prisma include/select to fetch related data',
      });
    }
    
    // Check for include without select
    const includeMatches = content.match(/include:\s*{[^}]+}/g);
    if (includeMatches && includeMatches.length > 3) {
      potentialIssues++;
      issues.push({
        severity: 'medium',
        category: 'Database',
        file: file.replace(rootDir, ''),
        issue: 'Multiple includes without select (loading unnecessary data)',
        recommendation: 'Use select to load only required fields',
      });
    }
  }
  
  console.log(`   Found ${potentialIssues} potential N+1 or over-fetching issues`);
}

// Check for missing cache
function checkMissingCache(rootDir: string) {
  console.log('\n👌 Checking for APIs without caching...');
  
  const criticalApis = [
    'app/api/dashboard/route.ts',
    'app/api/buildings/route.ts',
    'app/api/units/route.ts',
    'app/api/payments/route.ts',
    'app/api/contracts/route.ts',
  ];
  
  let uncached = 0;
  
  for (const apiPath of criticalApis) {
    const fullPath = path.join(rootDir, apiPath);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf-8');
      
      if (!content.includes('cached') && !content.includes('getCached')) {
        uncached++;
        issues.push({
          severity: 'high',
          category: 'Performance',
          file: apiPath,
          issue: 'Critical API without caching',
          recommendation: 'Implement Redis caching using cachedDashboardStats, cachedBuildings, etc.',
        });
      }
    }
  }
  
  console.log(`   Found ${uncached} critical APIs without caching`);
}

// Generate report
function generateReport(issues: PerformanceIssue[]) {
  console.log('\n\n📊 PERFORMANCE ANALYSIS REPORT');
  console.log('='.repeat(80));
  
  const highIssues = issues.filter(i => i.severity === 'high');
  const mediumIssues = issues.filter(i => i.severity === 'medium');
  const lowIssues = issues.filter(i => i.severity === 'low');
  
  console.log(`\n🔴 High Priority Issues: ${highIssues.length}`);
  console.log(`🟡 Medium Priority Issues: ${mediumIssues.length}`);
  console.log(`🟢 Low Priority Issues: ${lowIssues.length}`);
  console.log(`\nTotal Issues Found: ${issues.length}`);
  
  if (highIssues.length > 0) {
    console.log('\n🔴 HIGH PRIORITY ISSUES:');
    console.log('-'.repeat(80));
    highIssues.slice(0, 10).forEach((issue, index) => {
      console.log(`\n${index + 1}. [${issue.category}] ${issue.file}`);
      console.log(`   Issue: ${issue.issue}`);
      console.log(`   Fix: ${issue.recommendation}`);
    });
    
    if (highIssues.length > 10) {
      console.log(`\n   ... and ${highIssues.length - 10} more high priority issues`);
    }
  }
  
  // Save detailed report to file
  const reportPath = path.join(process.cwd(), 'performance-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(issues, null, 2));
  console.log(`\n✅ Detailed report saved to: ${reportPath}`);
  
  // Summary recommendations
  console.log('\n\n💡 TOP RECOMMENDATIONS:');
  console.log('='.repeat(80));
  console.log('1. Configure Redis for caching (see OPTIMIZACION_RENDIMIENTO.md)');
  console.log('2. Add caching to critical APIs: /api/dashboard, /api/buildings, etc.');
  console.log('3. Lazy load heavy components (Plotly, Charts)');
  console.log('4. Optimize Prisma queries with select/include');
  console.log('5. Replace <img> with Next.js <Image> component');
  console.log('\nFor detailed optimization guide, see: GUIA_OPTIMIZACION_APIS.md');
}

// Main function
function main() {
  const rootDir = path.join(__dirname, '..');
  
  console.log('🚀 Starting Performance Analysis...');
  console.log(`Root directory: ${rootDir}`);
  
  try {
    checkUnoptimizedImages(rootDir);
    checkLazyLoading(rootDir);
    checkNPlusOneQueries(rootDir);
    checkMissingCache(rootDir);
    
    generateReport(issues);
    
    console.log('\n✅ Analysis complete!');
    
    // Exit code based on severity
    if (issues.filter(i => i.severity === 'high').length > 0) {
      console.log('\n⚠️  High priority issues found. Please address them for optimal performance.');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error during analysis:', error);
    process.exit(1);
  }
}

main();
