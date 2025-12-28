#!/usr/bin/env ts-node
/**
 * Script para obtener información completa de la zona de Cloudflare
 * Obtiene Zone ID, Account ID, y toda la información necesaria
 */

const API_TOKEN = 'PGh6Ywsssqa0SW5RJ1cY_QfoxnZByinhcsd3ICvN';
const DOMAIN = 'inmovaapp.com';

interface CloudflareZone {
  id: string;
  name: string;
  status: string;
  account: {
    id: string;
    name: string;
  };
  name_servers: string[];
  original_name_servers: string[];
}

interface CloudflareResponse {
  success: boolean;
  errors: Array<{ code: number; message: string }>;
  result: CloudflareZone[];
}

async function getZoneInfo() {
  console.log('🔍 Obteniendo información de Cloudflare...\n');

  // Verificar token
  console.log('1️⃣ Verificando token API...');
  try {
    const verifyResponse = await fetch(
      'https://api.cloudflare.com/client/v4/user/tokens/verify',
      {
        headers: {
          'Authorization': `Bearer ${API_TOKEN}`,
        },
      }
    );

    const verifyData = await verifyResponse.json() as any;

    if (!verifyData.success) {
      console.log('   ❌ Token inválido');
      console.log('   Errores:', JSON.stringify(verifyData.errors, null, 2));
      process.exit(1);
    }

    console.log('   ✅ Token válido');
  } catch (error) {
    console.log('   ❌ Error:', error);
    process.exit(1);
  }

  // Obtener información de la zona
  console.log('\n2️⃣ Buscando zona para dominio:', DOMAIN);
  try {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/zones?name=${DOMAIN}`,
      {
        headers: {
          'Authorization': `Bearer ${API_TOKEN}`,
        },
      }
    );

    const data = await response.json() as CloudflareResponse;

    if (!data.success || data.result.length === 0) {
      console.log('   ❌ No se encontró el dominio en Cloudflare');
      console.log('   El dominio debe estar agregado a Cloudflare primero');
      console.log('\n   Pasos para agregar el dominio:');
      console.log('   1. Ir a https://dash.cloudflare.com');
      console.log('   2. Click en "Add a Site"');
      console.log(`   3. Ingresar: ${DOMAIN}`);
      console.log('   4. Seguir las instrucciones para cambiar nameservers');
      process.exit(1);
    }

    const zone = data.result[0];
    
    console.log('   ✅ Zona encontrada!\n');
    console.log('📊 INFORMACIÓN DE LA ZONA:');
    console.log('─'.repeat(60));
    console.log(`Dominio:      ${zone.name}`);
    console.log(`Zone ID:      ${zone.id}`);
    console.log(`Account ID:   ${zone.account.id}`);
    console.log(`Account Name: ${zone.account.name}`);
    console.log(`Status:       ${zone.status}`);
    console.log('\n🌐 Nameservers de Cloudflare:');
    zone.name_servers.forEach(ns => console.log(`   - ${ns}`));
    
    if (zone.original_name_servers && zone.original_name_servers.length > 0) {
      console.log('\n📝 Nameservers originales:');
      zone.original_name_servers.forEach(ns => console.log(`   - ${ns}`));
    }

    // Guardar en archivo
    const envContent = `# Cloudflare Configuration for ${DOMAIN}
# Generado automáticamente: ${new Date().toISOString()}

# API Token
CLOUDFLARE_API_TOKEN=${API_TOKEN}

# Zone Information
CLOUDFLARE_ZONE_ID=${zone.id}
CLOUDFLARE_ACCOUNT_ID=${zone.account.id}

# CDN URL
NEXT_PUBLIC_CDN_URL=https://cdn.${DOMAIN}

# Domain
NEXT_PUBLIC_BASE_URL=https://${DOMAIN}
NEXTAUTH_URL=https://${DOMAIN}
`;

    const fs = require('fs');
    fs.writeFileSync('.env.cloudflare', envContent);
    
    console.log('\n✅ Archivo .env.cloudflare actualizado');
    console.log('\n📋 Variables de entorno configuradas:');
    console.log(`   CLOUDFLARE_API_TOKEN=***`);
    console.log(`   CLOUDFLARE_ZONE_ID=${zone.id}`);
    console.log(`   CLOUDFLARE_ACCOUNT_ID=${zone.account.id}`);
    console.log(`   NEXT_PUBLIC_CDN_URL=https://cdn.${DOMAIN}`);
    console.log(`   NEXT_PUBLIC_BASE_URL=https://${DOMAIN}`);

  } catch (error) {
    console.log('   ❌ Error:', error);
    process.exit(1);
  }
}

getZoneInfo();
