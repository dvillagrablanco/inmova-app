const { chromium } = require('playwright');
const https = require('https');
const http = require('http');

/**
 * Descarga todos los JS files de la landing y busca el que tiene error de sintaxis
 */

function downloadFile(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    protocol.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

function checkSyntax(code, filename) {
  try {
    new Function(code);
    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: error.message,
      line: error.lineNumber || 'unknown',
      column: error.columnNumber || 'unknown',
    };
  }
}

(async () => {
  console.log('🔍 ANALIZANDO TODOS LOS ARCHIVOS JAVASCRIPT DE LA LANDING');
  console.log('='.repeat(80));
  
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  const jsFiles = [];
  
  // Interceptar TODAS las requests de JS
  page.on('response', async (response) => {
    const url = response.url();
    if (url.includes('.js') && response.status() === 200) {
      jsFiles.push({
        url,
        status: response.status(),
        size: parseInt(response.headers()['content-length'] || '0'),
      });
    }
  });
  
  console.log('\nCargando /landing...\n');
  
  await page.goto('https://inmovaapp.com/landing', {
    waitUntil: 'networkidle',
    timeout: 30000,
  });
  
  await page.waitForTimeout(2000);
  await browser.close();
  
  console.log(`\n✅ Encontrados ${jsFiles.length} archivos JavaScript\n`);
  
  // Listar archivos
  jsFiles.forEach((file, idx) => {
    const sizeKB = (file.size / 1024).toFixed(2);
    const filename = file.url.split('/').pop().substring(0, 50);
    console.log(`[${idx + 1}] ${filename.padEnd(50)} ${sizeKB.padStart(10)} KB`);
  });
  
  console.log('\n' + '='.repeat(80));
  console.log('ANALIZANDO SINTAXIS DE CADA ARCHIVO');
  console.log('='.repeat(80));
  
  let foundError = false;
  
  for (const [idx, file] of jsFiles.entries()) {
    const filename = file.url.split('/').pop();
    process.stdout.write(`\n[${idx + 1}/${jsFiles.length}] ${filename}... `);
    
    try {
      // Intentar descargar (solo archivos pequeños para no saturar)
      if (file.size > 5 * 1024 * 1024) {
        console.log('⏭️  SKIP (muy grande)');
        continue;
      }
      
      const code = await downloadFile(file.url);
      
      // Verificar sintaxis básica
      const result = checkSyntax(code, filename);
      
      if (!result.valid) {
        console.log('❌ ERROR DE SINTAXIS ENCONTRADO');
        console.log(`\n🎯 ARCHIVO PROBLEMÁTICO: ${file.url}`);
        console.log(`   Error: ${result.error}`);
        console.log(`   Línea: ${result.line}`);
        console.log(`   Columna: ${result.column}`);
        
        // Mostrar primeras líneas del archivo
        const lines = code.split('\n');
        const errorLine = parseInt(result.line);
        if (!isNaN(errorLine)) {
          console.log(`\n   Contexto (líneas ${errorLine - 2} a ${errorLine + 2}):`);
          for (let i = Math.max(0, errorLine - 3); i < Math.min(lines.length, errorLine + 2); i++) {
            const prefix = i === errorLine - 1 ? ' >>>>' : '     ';
            console.log(`${prefix} ${(i + 1).toString().padStart(5)} | ${lines[i].substring(0, 100)}`);
          }
        }
        
        foundError = true;
        break;
      } else {
        console.log('✅');
      }
      
    } catch (error) {
      console.log(`⚠️  Error descargando: ${error.message}`);
    }
  }
  
  if (!foundError) {
    console.log('\n\n⚠️ NO SE ENCONTRÓ ERROR DE SINTAXIS en archivos descargados');
    console.log('   Posibles causas:');
    console.log('   1. Error en archivo muy grande (> 5MB)');
    console.log('   2. Error se genera dinámicamente');
    console.log('   3. Error en inline script del HTML');
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('FIN DEL ANÁLISIS');
  console.log('='.repeat(80));
  
  process.exit(0);
})();
