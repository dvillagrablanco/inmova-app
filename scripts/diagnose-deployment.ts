/**
 * Script de Diagnóstico de Deployment
 * Verifica el estado de la aplicación deployada
 */

import https from 'https';
import http from 'http';

const URLS_TO_CHECK = [
  'https://www.inmova.app',
  'https://www.inmova.app/api/health',
  'https://www.inmova.app/login',
  'https://inmova.app',
];

interface CheckResult {
  url: string;
  status: 'success' | 'error' | 'timeout';
  statusCode?: number;
  responseTime: number;
  error?: string;
  headers?: any;
}

function checkUrl(url: string, timeout = 10000): Promise<CheckResult> {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;

    const req = client.get(url, { timeout }, (res) => {
      const responseTime = Date.now() - startTime;

      // Consumir la respuesta para evitar memory leaks
      res.resume();

      resolve({
        url,
        status: 'success',
        statusCode: res.statusCode,
        responseTime,
        headers: res.headers,
      });
    });

    req.on('error', (error) => {
      resolve({
        url,
        status: 'error',
        responseTime: Date.now() - startTime,
        error: error.message,
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        url,
        status: 'timeout',
        responseTime: timeout,
        error: 'Request timeout',
      });
    });
  });
}

async function diagnose() {
  console.log('🔍 Diagnóstico de Deployment - INMOVA\n');
  console.log('='.repeat(60));

  const results: CheckResult[] = [];

  for (const url of URLS_TO_CHECK) {
    console.log(`\n📡 Verificando: ${url}`);
    const result = await checkUrl(url, 15000);
    results.push(result);

    if (result.status === 'success') {
      console.log(`  ✅ HTTP ${result.statusCode} - ${result.responseTime}ms`);
      if (result.headers) {
        console.log(`  📋 Server: ${result.headers.server || 'N/A'}`);
        console.log(`  📋 Content-Type: ${result.headers['content-type'] || 'N/A'}`);
      }
    } else if (result.status === 'timeout') {
      console.log(`  ⏱️  TIMEOUT - ${result.responseTime}ms`);
    } else {
      console.log(`  ❌ ERROR: ${result.error}`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('\n📊 RESUMEN\n');

  const successful = results.filter((r) => r.status === 'success').length;
  const failed = results.filter((r) => r.status === 'error').length;
  const timedout = results.filter((r) => r.status === 'timeout').length;

  console.log(`✅ Exitosas: ${successful}/${results.length}`);
  console.log(`❌ Fallidas: ${failed}/${results.length}`);
  console.log(`⏱️  Timeouts: ${timedout}/${results.length}`);

  if (successful === 0) {
    console.log('\n🚨 PROBLEMA CRÍTICO: El sitio no responde');
    console.log('\nPosibles causas:');
    console.log('  1. Deployment en Railway falló o está en progreso');
    console.log('  2. Configuración de DNS incorrecta');
    console.log('  3. Servicio detenido o sin recursos');
    console.log('  4. Error en el build que impide el inicio');
    console.log('\nAcciones recomendadas:');
    console.log('  1. Verificar logs en Railway Dashboard');
    console.log('  2. Verificar variables de entorno (DATABASE_URL, etc)');
    console.log('  3. Revisar últimos commits que pudieron causar el problema');
  } else if (successful < results.length) {
    console.log('\n⚠️  PROBLEMA PARCIAL: Algunas rutas no responden');
  } else {
    console.log('\n✅ SITIO OPERATIVO');
  }

  console.log('\n');
}

diagnose().catch(console.error);
