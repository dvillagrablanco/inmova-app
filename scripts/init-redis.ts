/**
 * Redis Initialization Script
 * Tests Redis connection and sets up initial cache structure
 */
import { initRedis, getRedisClient, closeRedis, getCached } from '../lib/redis';
import logger from '../lib/logger';

async function main() {
  console.log('🚀 Iniciando prueba de conexión Redis...');
  
  try {
    // Initialize Redis connection
    const client = await initRedis();
    
    if (!client) {
      console.log('⚠️  Redis no está configurado (REDIS_URL no establecido)');
      console.log('   La aplicación funcionará sin caché.');
      console.log('   Para habilitar Redis, configura REDIS_URL en .env');
      return;
    }

    console.log('✅ Redis conectado exitosamente');
    
    // Test basic operations
    console.log('\n🧪 Probando operaciones básicas...');
    
    // Test SET
    await client.set('test:key', 'test_value');
    console.log('✅ SET: Clave de prueba creada');
    
    // Test GET
    const value = await client.get('test:key');
    console.log(`✅ GET: Valor recuperado = "${value}"`);
    
    // Test SETEX (con expiración)
    await client.setEx('test:expiring', 60, 'expires_in_60s');
    console.log('✅ SETEX: Clave con expiración creada (60s)');
    
    // Test DEL
    await client.del('test:key');
    console.log('✅ DEL: Clave de prueba eliminada');
    
    // Test cached function
    console.log('\n🧪 Probando función de caché...');
    
    let callCount = 0;
    const testFunction = async () => {
      callCount++;
      return { data: 'test data', timestamp: new Date().toISOString() };
    };
    
    // First call - should execute function
    const result1 = await getCached('test:cached:function', testFunction, 60);
    console.log(`✅ Primera llamada (MISS): callCount = ${callCount}`);
    console.log(`   Datos: ${JSON.stringify(result1)}`);
    
    // Second call - should use cache
    const result2 = await getCached('test:cached:function', testFunction, 60);
    console.log(`✅ Segunda llamada (HIT): callCount = ${callCount}`);
    console.log(`   Datos: ${JSON.stringify(result2)}`);
    
    if (callCount === 1) {
      console.log('✅ Caché funcionando correctamente (función solo se ejecutó una vez)');
    } else {
      console.log('⚠️  Advertencia: Caché puede no estar funcionando correctamente');
    }
    
    // Clean up test keys
    await client.del('test:cached:function');
    await client.del('test:expiring');
    console.log('\n🧹 Claves de prueba limpiadas');
    
    // Display Redis info
    console.log('\n📊 Información de Redis:');
    const info = await client.info('server');
    const version = info.match(/redis_version:(\S+)/)?.[1];
    console.log(`   Versión: ${version}`);
    
    const memory = await client.info('memory');
    const usedMemory = memory.match(/used_memory_human:(\S+)/)?.[1];
    console.log(`   Memoria usada: ${usedMemory}`);
    
    // Display cache keys count
    const keys = await client.keys('*');
    console.log(`   Claves totales: ${keys.length}`);
    
    console.log('\n✅ Todas las pruebas pasaron exitosamente');
    console.log('🎉 Redis está listo para usar');
    console.log('\n💡 Próximos pasos:');
    console.log('   1. Las API routes pueden usar cachedDashboardStats, cachedBuildings, etc.');
    console.log('   2. El caché se invalidará automáticamente al crear/editar recursos');
    console.log('   3. Monitorea los logs para ver HIT/MISS rates');
    
  } catch (error) {
    console.error('❌ Error al probar Redis:', error);
    logger.error('Redis test failed:', error);
    process.exit(1);
  } finally {
    // Close connection
    await closeRedis();
    console.log('\n👋 Conexión Redis cerrada');
  }
}

main().catch((error) => {
  console.error('❌ Error fatal:', error);
  process.exit(1);
});
