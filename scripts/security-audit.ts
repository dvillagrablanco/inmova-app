/**
 * Auditoría de seguridad automatizada
 * Busca vulnerabilidades OWASP Top 10
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

interface SecurityIssue {
  file: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  type: string;
  line?: number;
  code?: string;
  recommendation: string;
}

const issues: SecurityIssue[] = [];

async function scanAPIRoutes() {
  const apiFiles = await glob('app/api/**/route.ts', { cwd: '/workspace' });
  
  for (const file of apiFiles) {
    const fullPath = path.join('/workspace', file);
    const content = fs.readFileSync(fullPath, 'utf-8');
    const lines = content.split('\n');
    
    let hasAuth = false;
    let hasValidation = false;
    let hasRateLimit = false;
    
    // Detectar autenticación
    if (content.includes('getServerSession') || content.includes('session')) {
      hasAuth = true;
    }
    
    // Detectar validación
    if (content.includes('.safeParse') || content.includes('.parse') || content.includes('z.object')) {
      hasValidation = true;
    }
    
    // Detectar rate limiting
    if (content.includes('rateLimit') || content.includes('withRateLimit')) {
      hasRateLimit = true;
    }
    
    // Endpoints públicos peligrosos
    if (file.includes('/public/') || file.includes('/debug/')) {
      if (!content.includes('process.env.NODE_ENV')) {
        issues.push({
          file,
          severity: 'CRITICAL',
          type: 'EXPOSED_DEBUG_ENDPOINT',
          recommendation: 'Eliminar o proteger con NODE_ENV check',
        });
      }
    }
    
    // APIs sin autenticación (excepto health, webhooks conocidos)
    const isPublicOK = file.includes('/health') || file.includes('/version') || file.includes('/webhook');
    if (!hasAuth && !isPublicOK) {
      issues.push({
        file,
        severity: 'HIGH',
        type: 'MISSING_AUTH',
        recommendation: 'Añadir getServerSession verification',
      });
    }
    
    // APIs sin validación
    if (content.includes('await req.json()') && !hasValidation) {
      issues.push({
        file,
        severity: 'MEDIUM',
        type: 'MISSING_VALIDATION',
        recommendation: 'Añadir Zod schema validation',
      });
    }
    
    // Raw SQL queries
    lines.forEach((line, idx) => {
      if (line.includes('$queryRaw') || line.includes('$executeRaw')) {
        if (!line.includes('Prisma.sql') && !line.includes('Prisma.join')) {
          issues.push({
            file,
            severity: 'HIGH',
            type: 'SQL_INJECTION_RISK',
            line: idx + 1,
            code: line.trim(),
            recommendation: 'Usar Prisma.sql`` o validar inputs',
          });
        }
      }
    });
    
    // Secrets hardcodeados
    lines.forEach((line, idx) => {
      if (line.includes('password') && line.includes('=') && line.includes("'")) {
        const match = line.match(/password.*=.*['"](.+)['"]/i);
        if (match && !line.includes('process.env') && !line.includes('credentials.password')) {
          issues.push({
            file,
            severity: 'CRITICAL',
            type: 'HARDCODED_SECRET',
            line: idx + 1,
            code: line.trim().substring(0, 80),
            recommendation: 'Mover a variable de entorno',
          });
        }
      }
    });
    
    // process.env sin NEXT_PUBLIC_ en cliente
    lines.forEach((line, idx) => {
      if (line.includes('process.env.') && !line.includes('NEXT_PUBLIC_') && content.includes("'use client'")) {
        issues.push({
          file,
          severity: 'MEDIUM',
          type: 'ENV_VAR_IN_CLIENT',
          line: idx + 1,
          code: line.trim(),
          recommendation: 'Variables de cliente deben usar NEXT_PUBLIC_ prefix',
        });
      }
    });
  }
}

async function scanComponents() {
  const componentFiles = await glob('components/**/*.tsx', { cwd: '/workspace' });
  
  for (const file of componentFiles) {
    const fullPath = path.join('/workspace', file);
    const content = fs.readFileSync(fullPath, 'utf-8');
    const lines = content.split('\n');
    
    // XSS via dangerouslySetInnerHTML
    lines.forEach((line, idx) => {
      if (line.includes('dangerouslySetInnerHTML')) {
        // Permitido para JSON-LD y CSS variables
        if (!line.includes('JSON.stringify') && !line.includes('generateCSSVariables')) {
          issues.push({
            file,
            severity: 'HIGH',
            type: 'XSS_RISK',
            line: idx + 1,
            code: line.trim(),
            recommendation: 'Sanitizar HTML o usar método seguro',
          });
        }
      }
    });
  }
}

async function main() {
  console.log('🔐 AUDITORÍA DE SEGURIDAD AUTOMÁTICA');
  console.log('='.repeat(80));
  
  console.log('\n📡 Escaneando API routes...');
  await scanAPIRoutes();
  
  console.log('🎨 Escaneando componentes...');
  await scanComponents();
  
  console.log('\n' + '='.repeat(80));
  console.log('📊 RESULTADOS');
  console.log('='.repeat(80));
  
  const bySeverity = {
    CRITICAL: issues.filter(i => i.severity === 'CRITICAL'),
    HIGH: issues.filter(i => i.severity === 'HIGH'),
    MEDIUM: issues.filter(i => i.severity === 'MEDIUM'),
    LOW: issues.filter(i => i.severity === 'LOW'),
  };
  
  console.log(`\n🔴 CRÍTICOS: ${bySeverity.CRITICAL.length}`);
  bySeverity.CRITICAL.forEach(issue => {
    console.log(`\n${issue.file}`);
    console.log(`  Tipo: ${issue.type}`);
    if (issue.line) console.log(`  Línea: ${issue.line}`);
    if (issue.code) console.log(`  Código: ${issue.code}`);
    console.log(`  Fix: ${issue.recommendation}`);
  });
  
  console.log(`\n🟠 ALTOS: ${bySeverity.HIGH.length}`);
  bySeverity.HIGH.slice(0, 10).forEach(issue => {
    console.log(`  - ${issue.file} (${issue.type})`);
  });
  if (bySeverity.HIGH.length > 10) {
    console.log(`  ... y ${bySeverity.HIGH.length - 10} más`);
  }
  
  console.log(`\n🟡 MEDIOS: ${bySeverity.MEDIUM.length}`);
  console.log(`🟢 BAJOS: ${bySeverity.LOW.length}`);
  
  console.log(`\n📊 Total issues: ${issues.length}`);
  
  // Guardar reporte
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      critical: bySeverity.CRITICAL.length,
      high: bySeverity.HIGH.length,
      medium: bySeverity.MEDIUM.length,
      low: bySeverity.LOW.length,
      total: issues.length,
    },
    issues: issues.sort((a, b) => {
      const severityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    }),
  };
  
  fs.writeFileSync(
    '/workspace/security-audit-report.json',
    JSON.stringify(report, null, 2)
  );
  
  console.log('\n📄 Reporte guardado: security-audit-report.json');
}

main();
