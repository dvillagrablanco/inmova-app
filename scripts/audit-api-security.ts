#!/usr/bin/env tsx
/**
 * Script de Auditoría de Seguridad de APIs
 * Verifica que todas las rutas API tengan protección de autenticación y autorización
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';

interface AuditResult {
  path: string;
  hasAuth: boolean;
  hasRoleCheck: boolean;
  roles: string[];
  hasSessionCheck: boolean;
  hasErrorHandling: boolean;
  methods: string[];
  severity: 'critical' | 'high' | 'medium' | 'low' | 'safe';
  issues: string[];
}

const API_DIR = join(__dirname, '..', 'app', 'api');
const OUTPUT_FILE = join(__dirname, '..', 'SECURITY_AUDIT_REPORT.md');

const CRITICAL_PATHS = [
  '/api/auth/',
  '/api/admin/',
  '/api/payments/',
  '/api/stripe/',
  '/api/users/',
  '/api/companies/',
];

const PUBLIC_PATHS = [
  '/api/auth/signin',
  '/api/auth/callback',
  '/api/auth/validate-password',
  '/api/auth-tenant',
  '/api/auth-propietario',
  '/api/auth-proveedor',
  '/api/webhooks/',
  '/api/stripe/webhook',
  '/api/b2b-billing/webhook',
  '/api/health',
  '/api/push/public-key',
  '/api/cron/',
];

function getAllRouteFiles(dir: string): string[] {
  const files: string[] = [];
  
  function traverse(currentDir: string) {
    const items = readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = join(currentDir, item);
      const stat = statSync(fullPath);
      
      if (stat.isDirectory()) {
        traverse(fullPath);
      } else if (item === 'route.ts' || item === 'route.tsx') {
        files.push(fullPath);
      }
    }
  }
  
  traverse(dir);
  return files;
}

function analyzeRouteFile(filePath: string): AuditResult {
  const content = readFileSync(filePath, 'utf-8');
  const relativePath = '/' + relative(join(__dirname, '..', 'app'), filePath).replace(/\\/g, '/').replace('/route.ts', '').replace('/route.tsx', '');
  
  const result: AuditResult = {
    path: relativePath,
    hasAuth: false,
    hasRoleCheck: false,
    roles: [],
    hasSessionCheck: false,
    hasErrorHandling: false,
    methods: [],
    severity: 'medium',
    issues: [],
  };

  // Detectar métodos HTTP
  if (content.includes('export async function GET')) result.methods.push('GET');
  if (content.includes('export async function POST')) result.methods.push('POST');
  if (content.includes('export async function PUT')) result.methods.push('PUT');
  if (content.includes('export async function PATCH')) result.methods.push('PATCH');
  if (content.includes('export async function DELETE')) result.methods.push('DELETE');

  // Verificar autenticación (getServerSession o requireAuth)
  result.hasAuth = content.includes('getServerSession') || 
                   content.includes('authOptions') ||
                   content.includes('requireAuth()') ||
                   content.includes('requireAuth(');
  result.hasSessionCheck = content.includes('if (!session)') || 
                          content.includes('if(!session)') ||
                          content.includes('requireAuth()') ||
                          content.includes('requireAuth(');
  
  // Verificar manejo de errores
  result.hasErrorHandling = content.includes('try {') && content.includes('catch');
  
  // Detectar verificación de roles
  const rolePatterns = [
    /session\.user\.role/g,
    /user\.role\s*===/g,
    /role\s*===\s*['"]super_admin['"]/g,
    /role\s*===\s*['"]administrador['"]/g,
    /allowedRoles/g,
    /hasRole/g,
    /checkRole/g,
  ];
  
  result.hasRoleCheck = rolePatterns.some(pattern => pattern.test(content));
  
  // Extraer roles mencionados
  const roleMatches = content.match(/['"](super_admin|administrador|gestor|operador|community_manager|tenant|owner|provider)['"]/g);
  if (roleMatches) {
    result.roles = [...new Set(roleMatches.map(m => m.replace(/['"]|/g, '')))];
  }

  // Determinar si es ruta pública
  const isPublicPath = PUBLIC_PATHS.some(publicPath => relativePath.includes(publicPath));
  const isCriticalPath = CRITICAL_PATHS.some(criticalPath => relativePath.includes(criticalPath));

  // Determinar severidad y problemas
  if (isPublicPath) {
    result.severity = 'safe';
  } else if (!result.hasAuth) {
    result.severity = isCriticalPath ? 'critical' : 'high';
    result.issues.push('❌ No tiene verificación de autenticación (getServerSession)');
  } else if (!result.hasSessionCheck) {
    result.severity = 'medium';
    result.issues.push('⚠️ Tiene getServerSession pero no verifica if (!session)');
  } else if (isCriticalPath && !result.hasRoleCheck) {
    result.severity = 'high';
    result.issues.push('⚠️ Ruta crítica sin verificación de roles específicos');
  } else if (!result.hasErrorHandling) {
    result.severity = 'low';
    result.issues.push('ℹ️ No tiene try-catch para manejo de errores');
  } else {
    result.severity = 'safe';
  }

  return result;
}

function generateMarkdownReport(results: AuditResult[]): string {
  const critical = results.filter(r => r.severity === 'critical');
  const high = results.filter(r => r.severity === 'high');
  const medium = results.filter(r => r.severity === 'medium');
  const low = results.filter(r => r.severity === 'low');
  const safe = results.filter(r => r.severity === 'safe');

  let report = `# 🔒 Reporte de Auditoría de Seguridad - INMOVA API

`;
  report += `**Fecha:** ${new Date().toLocaleString('es-ES')}

`;
  report += `**Total de Rutas Auditadas:** ${results.length}

`;
  
  report += `## 📊 Resumen Ejecutivo

`;
  report += `| Severidad | Cantidad | Porcentaje |
`;
  report += `|-----------|----------|------------|
`;
  report += `| 🔴 **CRÍTICO** | ${critical.length} | ${((critical.length / results.length) * 100).toFixed(1)}% |
`;
  report += `| 🟠 **ALTO** | ${high.length} | ${((high.length / results.length) * 100).toFixed(1)}% |
`;
  report += `| 🟡 **MEDIO** | ${medium.length} | ${((medium.length / results.length) * 100).toFixed(1)}% |
`;
  report += `| 🔵 **BAJO** | ${low.length} | ${((low.length / results.length) * 100).toFixed(1)}% |
`;
  report += `| ✅ **SEGURO** | ${safe.length} | ${((safe.length / results.length) * 100).toFixed(1)}% |

`;

  report += `## 🎯 Métricas de Seguridad

`;
  const withAuth = results.filter(r => r.hasAuth).length;
  const withSessionCheck = results.filter(r => r.hasSessionCheck).length;
  const withRoleCheck = results.filter(r => r.hasRoleCheck).length;
  const withErrorHandling = results.filter(r => r.hasErrorHandling).length;

  report += `- **Con Autenticación (getServerSession):** ${withAuth}/${results.length} (${((withAuth / results.length) * 100).toFixed(1)}%)
`;
  report += `- **Con Verificación de Sesión:** ${withSessionCheck}/${results.length} (${((withSessionCheck / results.length) * 100).toFixed(1)}%)
`;
  report += `- **Con Verificación de Roles:** ${withRoleCheck}/${results.length} (${((withRoleCheck / results.length) * 100).toFixed(1)}%)
`;
  report += `- **Con Manejo de Errores:** ${withErrorHandling}/${results.length} (${((withErrorHandling / results.length) * 100).toFixed(1)}%)

`;

  // Problemas críticos
  if (critical.length > 0) {
    report += `## 🔴 PROBLEMAS CRÍTICOS (Acción Inmediata Requerida)

`;
    critical.forEach(r => {
      report += `### \`${r.path}\`
`;
      report += `- **Métodos:** ${r.methods.join(', ') || 'N/A'}
`;
      report += `- **Problemas:**
`;
      r.issues.forEach(issue => report += `  - ${issue}
`);
      report += `
`;
    });
  }

  // Problemas altos
  if (high.length > 0) {
    report += `## 🟠 PROBLEMAS DE ALTA PRIORIDAD

`;
    high.forEach(r => {
      report += `### \`${r.path}\`
`;
      report += `- **Métodos:** ${r.methods.join(', ') || 'N/A'}
`;
      report += `- **Problemas:**
`;
      r.issues.forEach(issue => report += `  - ${issue}
`);
      report += `
`;
    });
  }

  // Problemas medios (solo primeros 20)
  if (medium.length > 0) {
    report += `## 🟡 PROBLEMAS DE PRIORIDAD MEDIA (Mostrando ${Math.min(20, medium.length)} de ${medium.length})

`;
    medium.slice(0, 20).forEach(r => {
      report += `- \`${r.path}\` - ${r.issues.join(', ')}
`;
    });
    report += `
`;
  }

  // Recomendaciones
  report += `## 💡 Recomendaciones de Acción

`;
  report += `### Inmediatas (Hoy)
`;
  report += `1. **Proteger rutas críticas:** Agregar \`getServerSession()\` en todas las rutas marcadas como CRÍTICO
`;
  report += `2. **Verificar sesiones:** Añadir \`if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })\`
`;
  report += `3. **Rutas /api/admin/\*:** Verificar que solo \`super_admin\` pueda acceder

`;
  
  report += `### Esta Semana
`;
  report += `1. Implementar middleware de autenticación centralizado
`;
  report += `2. Añadir verificación de roles en rutas sensibles
`;
  report += `3. Implementar rate limiting en rutas de autenticación y pago

`;
  
  report += `### Este Mes
`;
  report += `1. Añadir manejo de errores consistente en todas las rutas
`;
  report += `2. Implementar logging de accesos a rutas críticas
`;
  report += `3. Crear tests automatizados de seguridad

`;

  // Ejemplo de código seguro
  report += `## 📝 Ejemplo de Ruta Segura

`;
  report += `\`\`\`typescript
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // 1. Verificar autenticación
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Verificar roles (para rutas críticas)
    const allowedRoles = ['super_admin', 'administrador'];
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Forbidden - Insufficient permissions' },
        { status: 403 }
      );
    }

    // 3. Validar input
    const body = await request.json();
    // ... validación con zod o similar

    // 4. Lógica de negocio
    // ...

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error en ruta:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
\`\`\`

`;

  report += `---
*Generado automáticamente por el script de auditoría de seguridad*
`;

  return report;
}

function main() {
  console.log('🔍 Iniciando auditoría de seguridad de APIs...');
  console.log(`📁 Directorio: ${API_DIR}\n`);

  const routeFiles = getAllRouteFiles(API_DIR);
  console.log(`✅ Encontradas ${routeFiles.length} rutas API\n`);

  const results: AuditResult[] = [];
  let processed = 0;

  for (const file of routeFiles) {
    const result = analyzeRouteFile(file);
    results.push(result);
    processed++;

    if (processed % 50 === 0) {
      console.log(`⏳ Procesadas ${processed}/${routeFiles.length} rutas...`);
    }
  }

  console.log(`\n✅ Análisis completado: ${results.length} rutas auditadas\n`);

  // Generar reporte
  const report = generateMarkdownReport(results);
  writeFileSync(OUTPUT_FILE, report, 'utf-8');

  console.log(`📄 Reporte generado: ${OUTPUT_FILE}\n`);

  // Resumen en consola
  const critical = results.filter(r => r.severity === 'critical').length;
  const high = results.filter(r => r.severity === 'high').length;
  const medium = results.filter(r => r.severity === 'medium').length;

  console.log('📊 RESUMEN:');
  console.log(`   🔴 Crítico: ${critical}`);
  console.log(`   🟠 Alto: ${high}`);
  console.log(`   🟡 Medio: ${medium}`);
  console.log(`   ✅ Total Seguro: ${results.filter(r => r.severity === 'safe').length}\n`);

  if (critical > 0 || high > 0) {
    console.log('⚠️  ATENCIÓN: Se encontraron problemas de seguridad que requieren atención inmediata.');
    process.exit(1);
  } else {
    console.log('✅ No se encontraron problemas críticos de seguridad.');
    process.exit(0);
  }
}

main();
