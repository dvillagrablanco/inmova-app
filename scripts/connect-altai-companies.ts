/**
 * Script: Conectar Rovida y Viroda con Altai (Zucchetti)
 * 
 * Activa la integración Zucchetti/Altai para ambas sociedades.
 * Las credenciales de Altai se configuran vía variables de entorno:
 * 
 * Variables requeridas:
 *   ZUCCHETTI_AUTH_MODE=altai
 *   ZUCCHETTI_ALTAI_API_URL=https://wsaltaifacturas.altai.es/api
 *   ZUCCHETTI_ALTAI_LOGIN=<usuario_altai>
 *   ZUCCHETTI_ALTAI_PASSWORD=<password_altai>
 *   ZUCCHETTI_ALTAI_COMPANY_CODE=<codigo_empresa>  (para multi-empresa, se asigna por company)
 * 
 * Códigos de empresa Altai (a configurar por el cliente):
 *   Rovida → código empresa en Altai (ej: "ROVIDA" o CIF)
 *   Viroda → código empresa en Altai (ej: "VIRODA" o CIF)
 * 
 * Uso: npx tsx scripts/connect-altai-companies.ts
 * 
 * Para configurar credenciales, añadir al .env.production del servidor:
 *   ZUCCHETTI_AUTH_MODE=altai
 *   ZUCCHETTI_ALTAI_API_URL=https://wsaltaifacturas.altai.es/api
 *   ZUCCHETTI_ALTAI_LOGIN=tu_usuario
 *   ZUCCHETTI_ALTAI_PASSWORD=tu_password
 *   ZUCCHETTI_ALTAI_COMPANY_CODE=codigo_por_defecto
 *   
 * Luego reiniciar PM2: pm2 restart inmova-app --update-env
 */

import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

// Códigos de empresa en Altai. 
// Si el cliente usa el CIF como código, se usa el CIF.
// Si no se conoce, se deja vacío y se asigna después.
const COMPANY_ALTAI_CODES: Record<string, string> = {
  'Rovida': process.env.ALTAI_ROVIDA_COMPANY_CODE || 'ROVIDA',
  'Viroda': process.env.ALTAI_VIRODA_COMPANY_CODE || 'VIRODA',
};

async function main() {
  console.log('====================================================================');
  console.log('  CONECTAR ROVIDA Y VIRODA CON ALTAI (ZUCCHETTI)');
  console.log('====================================================================\n');

  // Verificar configuración de Altai
  const altaiLogin = process.env.ZUCCHETTI_ALTAI_LOGIN;
  const altaiPassword = process.env.ZUCCHETTI_ALTAI_PASSWORD;
  const altaiUrl = process.env.ZUCCHETTI_ALTAI_API_URL || 'https://wsaltaifacturas.altai.es/api';
  const authMode = process.env.ZUCCHETTI_AUTH_MODE || 'altai';

  console.log('Configuración Altai:');
  console.log(`  API URL: ${altaiUrl}`);
  console.log(`  Auth Mode: ${authMode}`);
  console.log(`  Login: ${altaiLogin ? altaiLogin.substring(0, 3) + '***' : 'NO CONFIGURADO'}`);
  console.log(`  Password: ${altaiPassword ? '***configurado***' : 'NO CONFIGURADO'}`);
  console.log('');

  if (!altaiLogin || !altaiPassword) {
    console.log('⚠️  Credenciales Altai no configuradas en variables de entorno.');
    console.log('   Se activará la integración pero sin autenticación automática.');
    console.log('   El administrador deberá configurar las credenciales desde:');
    console.log('   /admin/integraciones-contables → Zucchetti/Altai\n');
  }

  // Buscar empresas
  const rovida = await prisma.company.findFirst({
    where: { nombre: { contains: 'Rovida', mode: 'insensitive' } },
  });
  const viroda = await prisma.company.findFirst({
    where: { nombre: { contains: 'Viroda', mode: 'insensitive' } },
  });

  if (!rovida) { console.error('Rovida no encontrada'); process.exit(1); }
  if (!viroda) { console.error('Viroda no encontrada'); process.exit(1); }

  console.log(`Rovida: ${rovida.nombre} (${rovida.id})`);
  console.log(`Viroda: ${viroda.nombre} (${viroda.id})\n`);

  // Activar Zucchetti/Altai para ambas empresas
  for (const [company, label] of [[rovida, 'Rovida'], [viroda, 'Viroda']] as const) {
    const altaiCode = COMPANY_ALTAI_CODES[label] || label.toUpperCase();

    await prisma.company.update({
      where: { id: company.id },
      data: {
        zucchettiEnabled: true,
        zucchettiCompanyId: altaiCode,
        zucchettiSyncErrors: 0,
      },
    });

    console.log(`✅ ${company.nombre}:`);
    console.log(`   zucchettiEnabled = true`);
    console.log(`   zucchettiCompanyId = ${altaiCode}`);
  }

  // Verificar resultado
  console.log('\n=== Estado final ===');
  const companies = await prisma.company.findMany({
    where: {
      OR: [
        { nombre: { contains: 'Rovida', mode: 'insensitive' } },
        { nombre: { contains: 'Viroda', mode: 'insensitive' } },
      ],
    },
    select: {
      nombre: true,
      zucchettiEnabled: true,
      zucchettiCompanyId: true,
      zucchettiLastSync: true,
    },
  });

  for (const c of companies) {
    console.log(`  ${c.nombre}: enabled=${c.zucchettiEnabled}, companyId=${c.zucchettiCompanyId}, lastSync=${c.zucchettiLastSync || 'nunca'}`);
  }

  console.log('\n====================================================================');
  console.log('  INTEGRACIÓN ALTAI ACTIVADA');
  console.log('====================================================================');
  console.log('');
  console.log('  Próximos pasos:');
  console.log('  1. Obtener credenciales de Altai del gestor contable');
  console.log('  2. Añadir al .env.production del servidor:');
  console.log('     ZUCCHETTI_AUTH_MODE=altai');
  console.log('     ZUCCHETTI_ALTAI_API_URL=https://wsaltaifacturas.altai.es/api');
  console.log('     ZUCCHETTI_ALTAI_LOGIN=<usuario>');
  console.log('     ZUCCHETTI_ALTAI_PASSWORD=<password>');
  console.log('     ZUCCHETTI_ALTAI_COMPANY_CODE=<codigo_empresa>');
  console.log('  3. Reiniciar PM2: pm2 restart inmova-app --update-env');
  console.log('  4. Probar conexión desde /admin/integraciones-contables');
  console.log('  5. Sincronizar asientos desde /contabilidad');
  console.log('');
  console.log('  El botón "Sincronizar con Zucchetti" aparecerá en /contabilidad');
  console.log('  cuando las credenciales estén configuradas.');
  console.log('====================================================================');

  await prisma.$disconnect();
}

main().catch(async (e) => { console.error('Error:', e); await prisma.$disconnect(); process.exit(1); });
