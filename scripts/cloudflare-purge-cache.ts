#!/usr/bin/env ts-node
/**
 * Script para purgar la caché de Cloudflare
 * Útil después de despliegues o actualizaciones de assets
 */

import 'dotenv/config';

const ZONE_ID = process.env.CLOUDFLARE_ZONE_ID;
const API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;

interface PurgeOptions {
  purgeEverything?: boolean;
  files?: string[];
  tags?: string[];
  hosts?: string[];
}

async function purgeCloudflareCache(options: PurgeOptions = { purgeEverything: true }) {
  if (!ZONE_ID || !API_TOKEN) {
    console.error('❌ Error: CLOUDFLARE_ZONE_ID y CLOUDFLARE_API_TOKEN son requeridos');
    console.error('   Configura estas variables en .env.cloudflare');
    process.exit(1);
  }

  console.log('🔄 Purgando caché de Cloudflare...');
  
  try {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/purge_cache`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(options),
      }
    );

    const data = await response.json() as {
      success: boolean;
      errors: Array<{ code: number; message: string }>;
      messages: string[];
      result: { id: string };
    };

    if (!response.ok || !data.success) {
      console.error('❌ Error al purgar caché:', data.errors);
      process.exit(1);
    }

    console.log('✅ Caché purgada exitosamente');
    console.log('   ID de purga:', data.result.id);
    
    if (options.purgeEverything) {
      console.log('   🧹 Se purgó TODA la caché del dominio');
    } else if (options.files) {
      console.log(`   📁 Se purgaron ${options.files.length} archivos específicos`);
    } else if (options.tags) {
      console.log(`   🏷️  Se purgaron ${options.tags.length} tags de cache`);
    }
    
  } catch (error) {
    console.error('❌ Error de red:', error);
    process.exit(1);
  }
}

// Argumentos de línea de comandos
const args = process.argv.slice(2);
const command = args[0];

async function main() {
  switch (command) {
    case 'all':
    case undefined:
      // Purgar todo
      await purgeCloudflareCache({ purgeEverything: true });
      break;

    case 'files':
      // Purgar archivos específicos
      // Uso: npm run cloudflare:purge files https://cdn.inmovaapp.com/image.jpg
      const files = args.slice(1);
      if (files.length === 0) {
        console.error('❌ Debes especificar al menos un archivo');
        console.log('Uso: npm run cloudflare:purge files <url1> <url2> ...');
        process.exit(1);
      }
      await purgeCloudflareCache({ files });
      break;

    case 'tags':
      // Purgar por tags de cache
      // Uso: npm run cloudflare:purge tags images documents
      const tags = args.slice(1);
      if (tags.length === 0) {
        console.error('❌ Debes especificar al menos un tag');
        console.log('Uso: npm run cloudflare:purge tags <tag1> <tag2> ...');
        process.exit(1);
      }
      await purgeCloudflareCache({ tags });
      break;

    case 'help':
      console.log(`
Uso: npm run cloudflare:purge [comando] [opciones]

Comandos:
  all               Purga toda la caché (por defecto)
  files <urls...>   Purga archivos específicos por URL
  tags <tags...>    Purga por tags de cache
  help              Muestra esta ayuda

Ejemplos:
  npm run cloudflare:purge
  npm run cloudflare:purge all
  npm run cloudflare:purge files https://cdn.inmovaapp.com/logo.png
  npm run cloudflare:purge tags images documents

Nota: Requiere CLOUDFLARE_ZONE_ID y CLOUDFLARE_API_TOKEN en variables de entorno
      `);
      break;

    default:
      console.error(`❌ Comando desconocido: ${command}`);
      console.log('Usa "npm run cloudflare:purge help" para ver comandos disponibles');
      process.exit(1);
  }
}

main();
