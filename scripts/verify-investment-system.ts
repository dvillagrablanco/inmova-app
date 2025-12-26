#!/usr/bin/env tsx
/**
 * Script de Verificación del Sistema de Análisis de Inversión
 * Verifica que todos los componentes estén instalados y configurados correctamente
 */

import { existsSync } from 'fs';
import { join } from 'path';

interface CheckResult {
  name: string;
  status: 'OK' | 'WARNING' | 'ERROR';
  message: string;
  details?: string;
}

const results: CheckResult[] = [];

function check(
  name: string,
  condition: boolean,
  successMsg: string,
  errorMsg: string,
  isWarning = false
) {
  if (condition) {
    results.push({ name, status: 'OK', message: successMsg });
  } else {
    results.push({
      name,
      status: isWarning ? 'WARNING' : 'ERROR',
      message: errorMsg,
    });
  }
}

function checkFileExists(path: string, description: string, isWarning = false) {
  const fullPath = join(process.cwd(), path);
  check(
    description,
    existsSync(fullPath),
    `✓ ${description} encontrado`,
    `✗ ${description} no encontrado en ${path}`,
    isWarning
  );
}

console.log('🔍 Verificando Sistema de Análisis de Inversión...\n');

// 1. Verificar archivos de servicios backend
console.log('📦 Verificando Servicios Backend...');
checkFileExists(
  'lib/services/investment-analysis-service.ts',
  'Servicio de análisis de inversión'
);
checkFileExists('lib/services/rent-roll-ocr-service.ts', 'Servicio OCR de rent roll');
checkFileExists(
  'lib/services/real-estate-integrations.ts',
  'Servicio de integraciones inmobiliarias'
);
checkFileExists(
  'lib/services/notary-integration-service.ts',
  'Servicio de integración notarial'
);
checkFileExists('lib/services/pdf-generator-service.ts', 'Servicio de generación de PDFs');

// 2. Verificar APIs REST
console.log('\n🌐 Verificando APIs REST...');
checkFileExists('app/api/investment-analysis/route.ts', 'API de análisis (CRUD)');
checkFileExists('app/api/investment-analysis/compare/route.ts', 'API de comparación');
checkFileExists('app/api/investment-analysis/export-pdf/route.ts', 'API de exportación PDF');
checkFileExists('app/api/rent-roll/upload/route.ts', 'API de upload rent roll');
checkFileExists('app/api/integrations/idealista/import/route.ts', 'API import Idealista');
checkFileExists('app/api/integrations/pisos/import/route.ts', 'API import Pisos.com');
checkFileExists('app/api/notary/verify-property/route.ts', 'API verificación notarial');

// 3. Verificar componentes UI
console.log('\n🎨 Verificando Componentes UI...');
checkFileExists('components/calculators/InvestmentAnalyzer.tsx', 'Analizador de inversión');
checkFileExists('components/investment/RentRollUploader.tsx', 'Uploader de rent roll');
checkFileExists('components/investment/PropertyImporter.tsx', 'Importador de propiedades');
checkFileExists('components/investment/AnalysisComparator.tsx', 'Comparador de análisis');

// 4. Verificar páginas
console.log('\n📄 Verificando Páginas Next.js...');
checkFileExists('app/analisis-inversion/page.tsx', 'Página de análisis de inversión');
checkFileExists('app/herramientas-inversion/page.tsx', 'Página hub de herramientas');

// 5. Verificar schema de Prisma
console.log('\n🗄️  Verificando Base de Datos...');
checkFileExists('prisma/schema.prisma', 'Schema de Prisma');

// Verificar que los modelos estén en el schema
const schemaPath = join(process.cwd(), 'prisma/schema.prisma');
if (existsSync(schemaPath)) {
  const schemaContent = require('fs').readFileSync(schemaPath, 'utf-8');
  
  check(
    'Modelo InvestmentAnalysis',
    schemaContent.includes('model InvestmentAnalysis'),
    '✓ Modelo InvestmentAnalysis presente en schema',
    '✗ Modelo InvestmentAnalysis NO encontrado en schema'
  );
  
  check(
    'Modelo RentRoll',
    schemaContent.includes('model RentRoll'),
    '✓ Modelo RentRoll presente en schema',
    '✗ Modelo RentRoll NO encontrado en schema'
  );
  
  check(
    'Modelo SharedAnalysis',
    schemaContent.includes('model SharedAnalysis'),
    '✓ Modelo SharedAnalysis presente en schema',
    '✗ Modelo SharedAnalysis NO encontrado en schema'
  );
  
  check(
    'Modelo PropertyVerification',
    schemaContent.includes('model PropertyVerification'),
    '✓ Modelo PropertyVerification presente en schema',
    '✗ Modelo PropertyVerification NO encontrado en schema'
  );
  
  check(
    'Modelo AIRecommendation',
    schemaContent.includes('model AIRecommendation'),
    '✓ Modelo AIRecommendation presente en schema',
    '✗ Modelo AIRecommendation NO encontrado en schema'
  );
  
  check(
    'Modelo ImportedProperty',
    schemaContent.includes('model ImportedProperty'),
    '✓ Modelo ImportedProperty presente en schema',
    '✗ Modelo ImportedProperty NO encontrado en schema'
  );
  
  check(
    'Modelo NotaryAppointment',
    schemaContent.includes('model NotaryAppointment'),
    '✓ Modelo NotaryAppointment presente en schema',
    '✗ Modelo NotaryAppointment NO encontrado en schema'
  );
  
  check(
    'Modelo CertificateRequest',
    schemaContent.includes('model CertificateRequest'),
    '✓ Modelo CertificateRequest presente en schema',
    '✗ Modelo CertificateRequest NO encontrado en schema'
  );
  
  check(
    'Modelo AnalysisDocument',
    schemaContent.includes('model AnalysisDocument'),
    '✓ Modelo AnalysisDocument presente en schema',
    '✗ Modelo AnalysisDocument NO encontrado en schema'
  );
}

// 6. Verificar dependencias NPM
console.log('\n📚 Verificando Dependencias NPM...');
const packageJsonPath = join(process.cwd(), 'package.json');
if (existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(require('fs').readFileSync(packageJsonPath, 'utf-8'));
  const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
  
  check(
    'Dependencia pdf-parse',
    'pdf-parse' in deps,
    '✓ pdf-parse instalado',
    '✗ pdf-parse NO instalado'
  );
  
  check(
    'Dependencia xlsx',
    'xlsx' in deps,
    '✓ xlsx instalado',
    '✗ xlsx NO instalado'
  );
  
  check(
    'Dependencia csv-parse',
    'csv-parse' in deps,
    '✓ csv-parse instalado',
    '✗ csv-parse NO instalado'
  );
  
  check(
    'Dependencia tesseract.js',
    'tesseract.js' in deps,
    '✓ tesseract.js instalado',
    '✗ tesseract.js NO instalado'
  );
  
  check(
    'Dependencia cheerio',
    'cheerio' in deps,
    '✓ cheerio instalado',
    '✗ cheerio NO instalado'
  );
  
  check(
    'Dependencia html-pdf',
    'html-pdf' in deps,
    '✓ html-pdf instalado',
    '✗ html-pdf NO instalado'
  );
}

// 7. Verificar documentación
console.log('\n📖 Verificando Documentación...');
checkFileExists(
  'SISTEMA_COMPLETO_ANALISIS_INVERSION.md',
  'Documentación completa del sistema'
);
checkFileExists('GUIA_RAPIDA_SISTEMA_INVERSION.md', 'Guía rápida de uso');
checkFileExists('INVESTMENT_ANALYSIS_README.md', 'README del sistema');
checkFileExists('INSTALACION_COMPLETADA.md', 'Guía de instalación', true);

// 8. Verificar tests
console.log('\n🧪 Verificando Tests...');
checkFileExists(
  '__tests__/investment-analysis/calculations.test.ts',
  'Tests de cálculos financieros',
  true
);
checkFileExists(
  '__tests__/investment-analysis/rent-roll-parsing.test.ts',
  'Tests de parseo de rent roll',
  true
);

// Resumen
console.log('\n' + '='.repeat(60));
console.log('📊 RESUMEN DE VERIFICACIÓN');
console.log('='.repeat(60) + '\n');

const okCount = results.filter((r) => r.status === 'OK').length;
const warningCount = results.filter((r) => r.status === 'WARNING').length;
const errorCount = results.filter((r) => r.status === 'ERROR').length;

console.log(`✅ Exitosos: ${okCount}`);
console.log(`⚠️  Advertencias: ${warningCount}`);
console.log(`❌ Errores: ${errorCount}\n`);

// Mostrar detalles
if (warningCount > 0) {
  console.log('⚠️  ADVERTENCIAS:\n');
  results
    .filter((r) => r.status === 'WARNING')
    .forEach((r) => {
      console.log(`   ${r.message}`);
    });
  console.log('');
}

if (errorCount > 0) {
  console.log('❌ ERRORES:\n');
  results
    .filter((r) => r.status === 'ERROR')
    .forEach((r) => {
      console.log(`   ${r.message}`);
    });
  console.log('');
}

// Resultado final
console.log('='.repeat(60));
if (errorCount === 0) {
  console.log('✅ SISTEMA VERIFICADO CORRECTAMENTE');
  console.log('='.repeat(60) + '\n');
  
  console.log('📋 PRÓXIMOS PASOS:\n');
  console.log('1. Ejecutar migración de Prisma:');
  console.log('   npx prisma migrate dev --name add_investment_analysis\n');
  console.log('2. Reiniciar servidor de desarrollo:');
  console.log('   yarn dev o npm run dev\n');
  console.log('3. Acceder al sistema:');
  console.log('   http://localhost:3000/herramientas-inversion\n');
  console.log('4. Ejecutar tests:');
  console.log('   npm test __tests__/investment-analysis\n');
  
  process.exit(0);
} else {
  console.log('❌ VERIFICACIÓN FALLIDA');
  console.log('='.repeat(60) + '\n');
  console.log('Por favor, corrige los errores antes de continuar.\n');
  process.exit(1);
}
