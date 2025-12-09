#!/usr/bin/env node
/**
 * Script simple de load testing
 * Simula 100+ usuarios concurrentes accediendo al sistema
 */

const http = require('http');
const https = require('https');
const { performance } = require('perf_hooks');

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';
const CONCURRENT_USERS = parseInt(process.env.CONCURRENT_USERS) || 100;
const REQUESTS_PER_USER = parseInt(process.env.REQUESTS_PER_USER) || 5;
const TIMEOUT = 30000; // 30 segundos

const ENDPOINTS = [
  '/api/buildings',
  '/api/units',
  '/api/tenants',
  '/api/contracts',
  '/api/payments',
  '/api/dashboard',
];

class LoadTester {
  constructor(baseUrl, concurrentUsers, requestsPerUser) {
    this.baseUrl = baseUrl;
    this.concurrentUsers = concurrentUsers;
    this.requestsPerUser = requestsPerUser;
    this.results = {
      total: 0,
      success: 0,
      failed: 0,
      timeouts: 0,
      responseTimes: [],
      errors: [],
    };
  }

  async makeRequest(endpoint) {
    const url = `${this.baseUrl}${endpoint}`;
    const protocol = url.startsWith('https') ? https : http;
    
    return new Promise((resolve) => {
      const startTime = performance.now();
      
      const timeout = setTimeout(() => {
        this.results.timeouts++;
        resolve({ success: false, responseTime: TIMEOUT, endpoint, error: 'Timeout' });
      }, TIMEOUT);
      
      protocol.get(url, (res) => {
        clearTimeout(timeout);
        
        let data = '';
        res.on('data', chunk => { data += chunk; });
        res.on('end', () => {
          const responseTime = performance.now() - startTime;
          this.results.responseTimes.push(responseTime);
          
          if (res.statusCode >= 200 && res.statusCode < 400) {
            this.results.success++;
            resolve({ success: true, responseTime, endpoint, statusCode: res.statusCode });
          } else {
            this.results.failed++;
            this.results.errors.push({ endpoint, statusCode: res.statusCode, responseTime });
            resolve({ success: false, responseTime, endpoint, statusCode: res.statusCode });
          }
        });
      }).on('error', (err) => {
        clearTimeout(timeout);
        const responseTime = performance.now() - startTime;
        this.results.failed++;
        this.results.errors.push({ endpoint, error: err.message, responseTime });
        resolve({ success: false, responseTime, endpoint, error: err.message });
      });
    });
  }

  async simulateUser(userId) {
    console.log(`👤 Usuario ${userId} iniciando...`);
    const requests = [];
    
    for (let i = 0; i < this.requestsPerUser; i++) {
      const endpoint = ENDPOINTS[Math.floor(Math.random() * ENDPOINTS.length)];
      requests.push(this.makeRequest(endpoint));
    }
    
    await Promise.all(requests);
    console.log(`✅ Usuario ${userId} completado`);
  }

  async run() {
    console.log('🚀 Iniciando Load Test');
    console.log(`Base URL: ${this.baseUrl}`);
    console.log(`Usuarios concurrentes: ${this.concurrentUsers}`);
    console.log(`Requests por usuario: ${this.requestsPerUser}`);
    console.log(`Total requests: ${this.concurrentUsers * this.requestsPerUser}\n`);
    
    const startTime = performance.now();
    
    // Simular usuarios concurrentes
    const users = [];
    for (let i = 1; i <= this.concurrentUsers; i++) {
      users.push(this.simulateUser(i));
    }
    
    await Promise.all(users);
    
    const totalTime = performance.now() - startTime;
    this.results.total = this.concurrentUsers * this.requestsPerUser;
    
    // Calcular estadísticas
    const stats = this.calculateStats();
    
    // Imprimir resultados
    this.printResults(totalTime, stats);
    
    // Determinar si la prueba pasó
    const passed = this.results.failed === 0 && this.results.timeouts === 0;
    return { passed, results: this.results, stats };
  }

  calculateStats() {
    const times = this.results.responseTimes;
    if (times.length === 0) return null;
    
    times.sort((a, b) => a - b);
    
    return {
      min: times[0],
      max: times[times.length - 1],
      avg: times.reduce((a, b) => a + b, 0) / times.length,
      p50: times[Math.floor(times.length * 0.5)],
      p95: times[Math.floor(times.length * 0.95)],
      p99: times[Math.floor(times.length * 0.99)],
    };
  }

  printResults(totalTime, stats) {
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESULTADOS DEL LOAD TEST');
    console.log('='.repeat(60));
    
    console.log(`\nTiempo total: ${(totalTime / 1000).toFixed(2)}s`);
    console.log(`Requests totales: ${this.results.total}`);
    console.log(`✅ Exitosos: ${this.results.success} (${((this.results.success / this.results.total) * 100).toFixed(1)}%)`);
    console.log(`❌ Fallidos: ${this.results.failed}`);
    console.log(`⏱️ Timeouts: ${this.results.timeouts}`);
    
    if (stats) {
      console.log('\nTiempos de respuesta (ms):');
      console.log(`  Mínimo: ${stats.min.toFixed(2)}`);
      console.log(`  Máximo: ${stats.max.toFixed(2)}`);
      console.log(`  Promedio: ${stats.avg.toFixed(2)}`);
      console.log(`  P50 (mediana): ${stats.p50.toFixed(2)}`);
      console.log(`  P95: ${stats.p95.toFixed(2)}`);
      console.log(`  P99: ${stats.p99.toFixed(2)}`);
    }
    
    if (this.results.errors.length > 0) {
      console.log('\n🔥 Errores detectados:');
      this.results.errors.slice(0, 10).forEach((err, i) => {
        console.log(`  ${i + 1}. ${err.endpoint}: ${err.error || `Status ${err.statusCode}`} (${err.responseTime.toFixed(2)}ms)`);
      });
      if (this.results.errors.length > 10) {
        console.log(`  ... y ${this.results.errors.length - 10} errores más`);
      }
    }
    
    console.log('\n' + '='.repeat(60));
    
    if (this.results.failed === 0 && this.results.timeouts === 0) {
      console.log('✅ Load test PASADO: Sin fallos ni timeouts');
    } else {
      console.log('❌ Load test FALLADO: Revisar errores');
    }
    console.log('='.repeat(60) + '\n');
  }
}

async function main() {
  const tester = new LoadTester(BASE_URL, CONCURRENT_USERS, REQUESTS_PER_USER);
  const { passed } = await tester.run();
  
  process.exit(passed ? 0 : 1);
}

if (require.main === module) {
  main().catch(err => {
    console.error('🔥 Error fatal:', err);
    process.exit(1);
  });
}

module.exports = { LoadTester };
