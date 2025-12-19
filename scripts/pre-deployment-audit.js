#!/usr/bin/env node
/**
 * Pre-Deployment Audit Script
 * 
 * Este script realiza una auditoría completa del código antes del deployment
 * para garantizar que no haya errores críticos que puedan causar fallos en producción.
 * 
 * Uso: node scripts/pre-deployment-audit.js
 */

const { execSync } = require('child_process');
const { existsSync, readFileSync, statSync, readdirSync } = require('fs');
const { join, relative } = require('path');

class DeploymentAuditor {
  constructor() {
    this.issues = [];
    this.hasErrors = false;
    this.projectRoot = join(__dirname, '..');
  }

  addIssue(issue) {
    this.issues.push(issue);
    if (issue.severity === 'ERROR') {
      this.hasErrors = true;
    }
  }

  log(message, type = 'info') {
    const colors = {
      info: '\x1b[36m',    // Cyan
      success: '\x1b[32m', // Green
      warning: '\x1b[33m', // Yellow
      error: '\x1b[31m',   // Red
      reset: '\x1b[0m'
    };
    console.log(`${colors[type]}${message}${colors.reset}`);
  }

  execCommand(command, silent = false) {
    try {
      return execSync(command, { 
        cwd: this.projectRoot, 
        encoding: 'utf-8',
        stdio: silent ? 'pipe' : 'inherit'
      });
    } catch (error) {
      return '';
    }
  }

  /**
   * 1. Validación del Prisma Schema
   */
  auditPrismaSchema() {
    this.log('\n🔍 [1/8] Validando Prisma Schema...', 'info');
    
    const schemaPath = join(this.projectRoot, 'prisma', 'schema.prisma');
    
    if (!existsSync(schemaPath)) {
      this.addIssue({
        severity: 'ERROR',
        category: 'Prisma',
        message: 'Archivo schema.prisma no encontrado',
        file: 'prisma/schema.prisma',
        recommendation: 'Verificar que el archivo prisma/schema.prisma existe'
      });
      return;
    }

    // Validar sintaxis del schema
    try {
      this.execCommand('yarn prisma validate', true);
      this.log('  ✅ Schema Prisma válido', 'success');
    } catch (error) {
      this.addIssue({
        severity: 'ERROR',
        category: 'Prisma',
        message: 'Schema Prisma contiene errores de sintaxis',
        file: 'prisma/schema.prisma',
        recommendation: 'Ejecutar `yarn prisma validate` para ver errores detallados'
      });
      return;
    }

    // Verificar índices y campos
    const schemaContent = readFileSync(schemaPath, 'utf-8');
    const indexMatches = [...schemaContent.matchAll(/@@index\(\[([^\]]+)\]\)/g)];
    
    for (const match of indexMatches) {
      const indexFields = match[1].split(',').map(f => f.trim());
      // Buscar el modelo que contiene este índice
      const beforeIndex = schemaContent.substring(0, match.index);
      const modelMatch = beforeIndex.match(/model\s+(\w+)\s*{[^}]*$/);
      
      if (modelMatch) {
        const modelName = modelMatch[1];
        const modelContent = schemaContent.match(
          new RegExp(`model\\s+${modelName}\\s*{([^}]+)}`, 's')
        );
        
        if (modelContent) {
          const fields = modelContent[1].match(/^\s*(\w+)\s+/gm) || [];
          const fieldNames = fields.map(f => f.trim());
          
          for (const indexField of indexFields) {
            if (!fieldNames.includes(indexField)) {
              this.addIssue({
                severity: 'ERROR',
                category: 'Prisma',
                message: `Modelo ${modelName}: índice referencia campo inexistente '${indexField}'`,
                file: 'prisma/schema.prisma',
                recommendation: `Eliminar el índice o crear el campo '${indexField}' en el modelo ${modelName}`
              });
            }
          }
        }
      }
    }

    if (!this.hasErrors) {
      this.log('  ✅ Índices y campos validados', 'success');
    }
  }

  /**
   * 2. Validación de Archivos Críticos
   */
  auditCriticalFiles() {
    this.log('\n🔍 [2/8] Validando archivos críticos...', 'info');
    
    const criticalFiles = [
      { path: 'middleware.ts', required: true },
      { path: 'next.config.js', required: true },
      { path: 'package.json', required: true },
      { path: 'tsconfig.json', required: true },
      { path: '.env', required: false },
      { path: 'lib/db.ts', required: true },
      { path: 'lib/auth-options.ts', required: true },
    ];

    for (const { path, required } of criticalFiles) {
      const fullPath = join(this.projectRoot, path);
      if (!existsSync(fullPath)) {
        this.addIssue({
          severity: required ? 'ERROR' : 'WARNING',
          category: 'Archivos Críticos',
          message: `Archivo ${path} no encontrado`,
          file: path,
          recommendation: required ? `Crear el archivo ${path}` : `Considerar crear ${path}`
        });
      } else {
        this.log(`  ✅ ${path}`, 'success');
      }
    }
  }

  /**
   * 3. Validación de Variables de Entorno
   */
  auditEnvironmentVariables() {
    this.log('\n🔍 [3/8] Validando variables de entorno...', 'info');
    
    const envPath = join(this.projectRoot, '.env');
    if (!existsSync(envPath)) {
      this.addIssue({
        severity: 'WARNING',
        category: 'Environment',
        message: 'Archivo .env no encontrado',
        recommendation: 'Crear archivo .env con las variables necesarias'
      });
      return;
    }

    const envContent = readFileSync(envPath, 'utf-8');
    const requiredVars = [
      'DATABASE_URL',
      'NEXTAUTH_SECRET',
      'NEXTAUTH_URL',
    ];

    const optionalVars = [
      'AWS_BUCKET_NAME',
      'AWS_FOLDER_PREFIX',
      'STRIPE_SECRET_KEY',
      'STRIPE_PUBLISHABLE_KEY',
    ];

    for (const varName of requiredVars) {
      if (!envContent.includes(`${varName}=`)) {
        this.addIssue({
          severity: 'WARNING',
          category: 'Environment',
          message: `Variable de entorno ${varName} no encontrada en .env local`,
          recommendation: `Agregar ${varName} al archivo .env (nota: en GitHub Actions estas variables se configuran por separado)`
        });
      } else {
        this.log(`  ✅ ${varName}`, 'success');
      }
    }

    for (const varName of optionalVars) {
      if (!envContent.includes(`${varName}=`)) {
        this.log(`  ℹ️  ${varName} (opcional, no configurado)`, 'info');
      }
    }
  }

  /**
   * 4. Validación de Imports y Módulos
   */
  auditImports() {
    this.log('\n🔍 [4/8] Validando imports y módulos...', 'info');
    
    const commonMissingModules = [
      { path: 'lib/prisma.ts', imports: ['@/lib/prisma'] },
      { path: 'lib/db.ts', imports: ['@/lib/db'] },
      { path: 'lib/auth-options.ts', imports: ['@/lib/auth-options'] },
    ];

    for (const { path, imports } of commonMissingModules) {
      const fullPath = join(this.projectRoot, path);
      if (!existsSync(fullPath)) {
        this.addIssue({
          severity: 'ERROR',
          category: 'Imports',
          message: `Módulo ${path} no existe pero puede ser importado como ${imports[0]}`,
          file: path,
          recommendation: `Crear el archivo ${path} o actualizar los imports`
        });
      } else {
        this.log(`  ✅ ${path}`, 'success');
      }
    }
  }

  /**
   * 5. Validación de TypeScript
   */
  auditTypeScript() {
    this.log('\n🔍 [5/8] Validando TypeScript...', 'info');
    
    try {
      // Ejecutar tsc para verificar tipos
      this.execCommand('yarn tsc --noEmit', true);
      this.log('  ✅ No hay errores de TypeScript', 'success');
    } catch (error) {
      this.addIssue({
        severity: 'WARNING',
        category: 'TypeScript',
        message: 'Hay errores de TypeScript en el código',
        recommendation: 'Ejecutar `yarn tsc --noEmit` para ver errores detallados'
      });
    }
  }

  /**
   * 6. Validación de Archivos Grandes
   */
  auditLargeFiles() {
    this.log('\n🔍 [6/8] Validando tamaño de archivos...', 'info');
    
    const maxFileSize = 100 * 1024 * 1024; // 100MB
    
    const checkDirectory = (dir) => {
      // Ignorar directorios que no deberían ser escaneados
      if (dir.includes('node_modules') || 
          dir.includes('.next') || 
          dir.includes('.git') || 
          dir.includes('.build') || 
          dir.includes('.deploy')) return;
      
      try {
        const files = readdirSync(dir, { withFileTypes: true });
        
        for (const file of files) {
          const fullPath = join(dir, file.name);
          
          if (file.isDirectory()) {
            checkDirectory(fullPath);
          } else {
            try {
              const stats = statSync(fullPath);
              if (stats.size > maxFileSize) {
                const relativePath = relative(this.projectRoot, fullPath);
                this.addIssue({
                  severity: 'ERROR',
                  category: 'Git',
                  message: `Archivo ${relativePath} excede 100MB (${(stats.size / 1024 / 1024).toFixed(2)}MB)`,
                  file: relativePath,
                  recommendation: `Agregar ${relativePath} al .gitignore y eliminarlo del repositorio`
                });
              }
            } catch (error) {
              // Ignorar errores de acceso a archivos
            }
          }
        }
      } catch (error) {
        // Ignorar errores de acceso a directorios
      }
    };

    checkDirectory(this.projectRoot);
    
    if (!this.hasErrors) {
      this.log('  ✅ No hay archivos problemáticos', 'success');
    }
  }

  /**
   * 7. Validación de Dependencias
   */
  auditDependencies() {
    this.log('\n🔍 [7/8] Validando dependencias...', 'info');
    
    const packageJsonPath = join(this.projectRoot, 'package.json');
    if (!existsSync(packageJsonPath)) {
      this.addIssue({
        severity: 'ERROR',
        category: 'Dependencies',
        message: 'package.json no encontrado',
        recommendation: 'Crear package.json con las dependencias del proyecto'
      });
      return;
    }

    try {
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
      
      // Verificar que existan los scripts necesarios
      const requiredScripts = ['dev', 'build', 'start'];
      for (const script of requiredScripts) {
        if (!packageJson.scripts?.[script]) {
          this.addIssue({
            severity: 'WARNING',
            category: 'Dependencies',
            message: `Script '${script}' no encontrado en package.json`,
            recommendation: `Agregar script '${script}' a package.json`
          });
        }
      }

      this.log('  ✅ package.json válido', 'success');
    } catch (error) {
      this.addIssue({
        severity: 'ERROR',
        category: 'Dependencies',
        message: 'package.json contiene JSON inválido',
        recommendation: 'Verificar sintaxis de package.json'
      });
    }
  }

  /**
   * 8. Validación de API Routes
   */
  auditAPIRoutes() {
    this.log('\n🔍 [8/8] Validando API routes...', 'info');
    
    const apiDir = join(this.projectRoot, 'app', 'api');
    if (!existsSync(apiDir)) {
      this.log('  ℹ️  No hay directorio app/api', 'info');
      return;
    }

    let routeCount = 0;
    const countRoutes = (dir) => {
      try {
        const files = readdirSync(dir, { withFileTypes: true });
        for (const file of files) {
          const fullPath = join(dir, file.name);
          if (file.isDirectory()) {
            countRoutes(fullPath);
          } else if (file.name === 'route.ts' || file.name === 'route.js') {
            routeCount++;
          }
        }
      } catch (error) {
        // Ignorar errores
      }
    };

    countRoutes(apiDir);
    this.log(`  ✅ ${routeCount} API routes encontradas`, 'success');
  }

  /**
   * Generar Reporte
   */
  generateReport() {
    this.log('\n' + '═'.repeat(80), 'info');
    this.log('📋 REPORTE DE AUDITORÍA PRE-DEPLOYMENT', 'info');
    this.log('═'.repeat(80) + '\n', 'info');

    if (this.issues.length === 0) {
      this.log('✅ ¡EXCELENTE! No se encontraron problemas.', 'success');
      this.log('   El proyecto está listo para deployment.\n', 'success');
      return;
    }

    // Agrupar por severidad
    const errors = this.issues.filter(i => i.severity === 'ERROR');
    const warnings = this.issues.filter(i => i.severity === 'WARNING');
    const infos = this.issues.filter(i => i.severity === 'INFO');

    // Mostrar errores
    if (errors.length > 0) {
      this.log(`\n🚨 ERRORES CRÍTICOS (${errors.length}):`, 'error');
      this.log('─'.repeat(80), 'error');
      errors.forEach((issue, index) => {
        this.log(`\n${index + 1}. [${issue.category}] ${issue.message}`, 'error');
        if (issue.file) this.log(`   📄 Archivo: ${issue.file}`, 'error');
        if (issue.recommendation) this.log(`   💡 Recomendación: ${issue.recommendation}`, 'error');
      });
    }

    // Mostrar warnings
    if (warnings.length > 0) {
      this.log(`\n⚠️  ADVERTENCIAS (${warnings.length}):`, 'warning');
      this.log('─'.repeat(80), 'warning');
      warnings.forEach((issue, index) => {
        this.log(`\n${index + 1}. [${issue.category}] ${issue.message}`, 'warning');
        if (issue.file) this.log(`   📄 Archivo: ${issue.file}`, 'warning');
        if (issue.recommendation) this.log(`   💡 Recomendación: ${issue.recommendation}`, 'warning');
      });
    }

    // Mostrar info
    if (infos.length > 0) {
      this.log(`\nℹ️  INFORMACIÓN (${infos.length}):`, 'info');
      this.log('─'.repeat(80), 'info');
      infos.forEach((issue, index) => {
        this.log(`\n${index + 1}. [${issue.category}] ${issue.message}`, 'info');
        if (issue.recommendation) this.log(`   💡 Recomendación: ${issue.recommendation}`, 'info');
      });
    }

    // Resumen final
    this.log('\n' + '═'.repeat(80), 'info');
    this.log('📊 RESUMEN:', 'info');
    this.log(`   • Errores: ${errors.length}`, errors.length > 0 ? 'error' : 'success');
    this.log(`   • Advertencias: ${warnings.length}`, warnings.length > 0 ? 'warning' : 'success');
    this.log(`   • Información: ${infos.length}`, 'info');
    this.log('═'.repeat(80) + '\n', 'info');

    if (this.hasErrors) {
      this.log('❌ AUDITORÍA FALLIDA', 'error');
      this.log('   Por favor, corrija los errores críticos antes de hacer deployment.\n', 'error');
    } else if (warnings.length > 0) {
      this.log('⚠️  AUDITORÍA COMPLETADA CON ADVERTENCIAS', 'warning');
      this.log('   Se recomienda revisar las advertencias antes de hacer deployment.\n', 'warning');
    } else {
      this.log('✅ AUDITORÍA EXITOSA', 'success');
      this.log('   El proyecto está listo para deployment.\n', 'success');
    }
  }

  /**
   * Ejecutar auditoría completa
   */
  async run() {
    this.log('\n' + '═'.repeat(80), 'info');
    this.log('🔍 AUDITORÍA PRE-DEPLOYMENT - INMOVA', 'info');
    this.log('═'.repeat(80), 'info');
    this.log(`📁 Proyecto: ${this.projectRoot}`, 'info');
    this.log(`📅 Fecha: ${new Date().toLocaleString('es-ES')}\n`, 'info');

    // Ejecutar todas las auditorías
    this.auditPrismaSchema();
    this.auditCriticalFiles();
    this.auditEnvironmentVariables();
    this.auditImports();
    this.auditTypeScript();
    this.auditLargeFiles();
    this.auditDependencies();
    this.auditAPIRoutes();

    // Generar reporte
    this.generateReport();

    // Salir con código de error si hay problemas críticos
    if (this.hasErrors) {
      process.exit(1);
    }
  }
}

// Ejecutar auditoría
const auditor = new DeploymentAuditor();
auditor.run();
