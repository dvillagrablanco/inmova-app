#!/usr/bin/env ts-node
/**
 * Script para configurar DNS en Cloudflare automáticamente
 * Configura los registros necesarios para inmovaapp.com
 */

import 'dotenv/config';

const API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const ZONE_ID = process.env.CLOUDFLARE_ZONE_ID;
const DOMAIN = 'inmovaapp.com';

// IP/Target para los DNS records
// Obtener desde Vercel o tu servidor actual
const TARGET_CNAME = 'cname.vercel-dns.com'; // Para Vercel
// O usa tu IP si está en otro servidor: const TARGET_IP = '123.456.789.0';

interface DNSRecord {
  type: 'A' | 'CNAME' | 'TXT';
  name: string;
  content: string;
  proxied: boolean;
  comment?: string;
}

const DNS_RECORDS: DNSRecord[] = [
  {
    type: 'CNAME',
    name: '@',
    content: TARGET_CNAME,
    proxied: true,
    comment: 'Root domain pointing to Vercel',
  },
  {
    type: 'CNAME',
    name: 'www',
    content: DOMAIN,
    proxied: true,
    comment: 'WWW subdomain',
  },
  {
    type: 'CNAME',
    name: 'cdn',
    content: DOMAIN,
    proxied: true,
    comment: 'CDN subdomain for static assets',
  },
];

async function configureDNS() {
  console.log('🌐 Configurando DNS en Cloudflare...\n');

  if (!API_TOKEN || !ZONE_ID) {
    console.error('❌ Error: CLOUDFLARE_API_TOKEN y CLOUDFLARE_ZONE_ID son requeridos');
    console.error('   Asegúrate de tener .env.cloudflare configurado');
    process.exit(1);
  }

  // Obtener records existentes
  console.log('1️⃣ Obteniendo registros DNS existentes...');
  try {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/dns_records`,
      {
        headers: {
          'Authorization': `Bearer ${API_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const data = await response.json() as any;

    if (!data.success) {
      console.error('❌ Error al obtener records:', data.errors);
      process.exit(1);
    }

    console.log(`   ✅ Se encontraron ${data.result.length} registros existentes\n`);

    // Crear o actualizar cada record
    for (const record of DNS_RECORDS) {
      console.log(`2️⃣ Configurando ${record.type} record: ${record.name}`);
      
      // Buscar si ya existe
      const existing = data.result.find((r: any) => 
        r.name === (record.name === '@' ? DOMAIN : `${record.name}.${DOMAIN}`) && 
        r.type === record.type
      );

      if (existing) {
        // Actualizar
        console.log(`   📝 Actualizando record existente (ID: ${existing.id})...`);
        
        const updateResponse = await fetch(
          `https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/dns_records/${existing.id}`,
          {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${API_TOKEN}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              type: record.type,
              name: record.name,
              content: record.content,
              proxied: record.proxied,
              comment: record.comment,
            }),
          }
        );

        const updateData = await updateResponse.json() as any;
        
        if (updateData.success) {
          console.log(`   ✅ Record actualizado: ${record.name} → ${record.content}`);
        } else {
          console.log(`   ⚠️  Error actualizando: ${JSON.stringify(updateData.errors)}`);
        }
      } else {
        // Crear nuevo
        console.log(`   ➕ Creando nuevo record...`);
        
        const createResponse = await fetch(
          `https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/dns_records`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${API_TOKEN}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              type: record.type,
              name: record.name,
              content: record.content,
              proxied: record.proxied,
              comment: record.comment,
            }),
          }
        );

        const createData = await createResponse.json() as any;
        
        if (createData.success) {
          console.log(`   ✅ Record creado: ${record.name} → ${record.content}`);
        } else {
          console.log(`   ⚠️  Error creando: ${JSON.stringify(createData.errors)}`);
        }
      }
      
      console.log('');
    }

    console.log('✨ Configuración DNS completada\n');
    console.log('📋 Resumen de registros configurados:');
    console.log('─'.repeat(60));
    
    for (const record of DNS_RECORDS) {
      const proxy = record.proxied ? '🟠 Proxied' : '⚪ DNS Only';
      console.log(`${record.type.padEnd(6)} ${record.name.padEnd(10)} → ${record.content} ${proxy}`);
    }
    
    console.log('\n⏰ Nota: Los cambios DNS pueden tardar unos minutos en propagarse');
    console.log('   Verifica con: dig inmovaapp.com');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Si se ejecuta directamente
if (require.main === module) {
  configureDNS();
}

export { configureDNS, DNS_RECORDS };
