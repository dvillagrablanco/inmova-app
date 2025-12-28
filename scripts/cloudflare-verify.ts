#!/usr/bin/env ts-node
/**
 * Script para verificar la configuración de Cloudflare
 * Comprueba conectividad, DNS, y estado del CDN
 */

import 'dotenv/config';

const ZONE_ID = process.env.CLOUDFLARE_ZONE_ID;
const API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const DOMAIN = 'inmovaapp.com';

interface ZoneDetails {
  id: string;
  name: string;
  status: string;
  name_servers: string[];
  original_name_servers: string[];
}

interface CacheAnalytics {
  requests: {
    all: number;
    cached: number;
    uncached: number;
  };
  bandwidth: {
    all: number;
    cached: number;
    uncached: number;
  };
}

async function verifyCloudflareConfig() {
  console.log('🔍 Verificando configuración de Cloudflare...\n');

  // Verificar variables de entorno
  console.log('1️⃣ Variables de Entorno:');
  if (!API_TOKEN) {
    console.log('   ❌ CLOUDFLARE_API_TOKEN no configurado');
  } else {
    console.log('   ✅ CLOUDFLARE_API_TOKEN configurado');
  }

  if (!ZONE_ID) {
    console.log('   ❌ CLOUDFLARE_ZONE_ID no configurado');
  } else {
    console.log('   ✅ CLOUDFLARE_ZONE_ID configurado');
  }

  if (!API_TOKEN) {
    console.log('\n⚠️  Configura las variables en .env.cloudflare y vuelve a ejecutar');
    process.exit(1);
  }

  // Verificar conectividad con API
  console.log('\n2️⃣ Conectividad con API de Cloudflare:');
  try {
    const response = await fetch(
      'https://api.cloudflare.com/client/v4/user/tokens/verify',
      {
        headers: {
          'Authorization': `Bearer ${API_TOKEN}`,
        },
      }
    );

    const data = await response.json() as {
      success: boolean;
      errors: Array<{ code: number; message: string }>;
      result: { status: string };
    };

    if (data.success) {
      console.log('   ✅ Token API válido');
      console.log(`   📊 Status: ${data.result.status}`);
    } else {
      console.log('   ❌ Token API inválido');
      console.log('   Errores:', data.errors);
      process.exit(1);
    }
  } catch (error) {
    console.log('   ❌ Error de conexión:', error);
    process.exit(1);
  }

  // Obtener información de la zona (si ZONE_ID está configurado)
  if (ZONE_ID) {
    console.log('\n3️⃣ Información de la Zona:');
    try {
      const response = await fetch(
        `https://api.cloudflare.com/client/v4/zones/${ZONE_ID}`,
        {
          headers: {
            'Authorization': `Bearer ${API_TOKEN}`,
          },
        }
      );

      const data = await response.json() as {
        success: boolean;
        result: ZoneDetails;
      };

      if (data.success) {
        const zone = data.result;
        console.log(`   ✅ Zona encontrada: ${zone.name}`);
        console.log(`   📊 Status: ${zone.status}`);
        console.log(`   🌐 Nameservers de Cloudflare:`);
        zone.name_servers.forEach(ns => console.log(`      - ${ns}`));
      } else {
        console.log('   ❌ No se pudo obtener información de la zona');
      }
    } catch (error) {
      console.log('   ❌ Error:', error);
    }

    // Verificar registros DNS
    console.log('\n4️⃣ Registros DNS:');
    try {
      const response = await fetch(
        `https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/dns_records?type=A,CNAME,AAAA`,
        {
          headers: {
            'Authorization': `Bearer ${API_TOKEN}`,
          },
        }
      );

      const data = await response.json() as {
        success: boolean;
        result: Array<{
          type: string;
          name: string;
          content: string;
          proxied: boolean;
        }>;
      };

      if (data.success && data.result.length > 0) {
        console.log(`   ✅ Se encontraron ${data.result.length} registros DNS:`);
        data.result.forEach(record => {
          const proxy = record.proxied ? '🟠 Proxied' : '⚪ DNS Only';
          console.log(`      ${record.type} ${record.name} → ${record.content} ${proxy}`);
        });
      } else {
        console.log('   ⚠️  No se encontraron registros DNS');
      }
    } catch (error) {
      console.log('   ❌ Error:', error);
    }
  }

  // Verificar CDN (hacer request al dominio)
  console.log('\n5️⃣ Verificación de CDN:');
  try {
    const response = await fetch(`https://${DOMAIN}`, {
      method: 'HEAD',
    });

    const cfRay = response.headers.get('cf-ray');
    const cfCacheStatus = response.headers.get('cf-cache-status');
    const server = response.headers.get('server');

    if (cfRay) {
      console.log('   ✅ Cloudflare CDN activo');
      console.log(`   🔍 CF-Ray: ${cfRay}`);
      console.log(`   💾 Cache Status: ${cfCacheStatus || 'N/A'}`);
      console.log(`   🖥️  Server: ${server || 'N/A'}`);
    } else {
      console.log('   ⚠️  No se detectaron headers de Cloudflare');
      console.log('   El dominio podría no estar usando Cloudflare como proxy');
    }
  } catch (error) {
    console.log('   ⚠️  No se pudo conectar al dominio:', error);
  }

  console.log('\n✨ Verificación completada\n');
}

// Ejecutar
verifyCloudflareConfig();
