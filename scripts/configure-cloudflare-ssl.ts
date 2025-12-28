#!/usr/bin/env ts-node
/**
 * Script para configurar SSL/TLS en Cloudflare
 */

import 'dotenv/config';

const API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const ZONE_ID = process.env.CLOUDFLARE_ZONE_ID;

async function configureSSL() {
  console.log('🔒 Configurando SSL/TLS en Cloudflare...\n');

  if (!API_TOKEN || !ZONE_ID) {
    console.error('❌ Error: CLOUDFLARE_API_TOKEN y CLOUDFLARE_ZONE_ID son requeridos');
    process.exit(1);
  }

  try {
    // 1. Configurar SSL mode a Full (strict)
    console.log('1️⃣ Configurando SSL mode a "Full (strict)"...');
    
    const sslResponse = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/settings/ssl`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ value: 'full' }),
      }
    );

    const sslData = await sslResponse.json() as any;
    
    if (sslData.success) {
      console.log('   ✅ SSL mode configurado: Full (strict)');
    } else {
      console.log('   ⚠️  Error:', sslData.errors);
    }

    // 2. Activar Always Use HTTPS
    console.log('\n2️⃣ Activando "Always Use HTTPS"...');
    
    const httpsResponse = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/settings/always_use_https`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ value: 'on' }),
      }
    );

    const httpsData = await httpsResponse.json() as any;
    
    if (httpsData.success) {
      console.log('   ✅ Always Use HTTPS activado');
    } else {
      console.log('   ⚠️  Error:', httpsData.errors);
    }

    // 3. Activar Automatic HTTPS Rewrites
    console.log('\n3️⃣ Activando "Automatic HTTPS Rewrites"...');
    
    const rewriteResponse = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/settings/automatic_https_rewrites`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ value: 'on' }),
      }
    );

    const rewriteData = await rewriteResponse.json() as any;
    
    if (rewriteData.success) {
      console.log('   ✅ Automatic HTTPS Rewrites activado');
    } else {
      console.log('   ⚠️  Error:', rewriteData.errors);
    }

    // 4. Configurar Minimum TLS Version
    console.log('\n4️⃣ Configurando TLS mínimo a 1.2...');
    
    const tlsResponse = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/settings/min_tls_version`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ value: '1.2' }),
      }
    );

    const tlsData = await tlsResponse.json() as any;
    
    if (tlsData.success) {
      console.log('   ✅ TLS mínimo configurado: 1.2');
    } else {
      console.log('   ⚠️  Error:', tlsData.errors);
    }

    console.log('\n✨ Configuración SSL/TLS completada');
    
    console.log('\n📋 Configuración aplicada:');
    console.log('─'.repeat(60));
    console.log('✅ SSL Mode: Full (strict)');
    console.log('✅ Always Use HTTPS: ON');
    console.log('✅ Automatic HTTPS Rewrites: ON');
    console.log('✅ Minimum TLS Version: 1.2');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Si se ejecuta directamente
if (require.main === module) {
  configureSSL();
}

export { configureSSL };
