/**
 * Seed de Centros de Coste para el Cuadro de Mandos Financiero
 *
 * Crea los 4 centros de coste por defecto para cada empresa del grupo Vidaro:
 * - DIR: Costes Directos (del inmueble)
 * - CDI: Costes Directos Imputados (Administración)
 * - DF-GEN: Dirección Financiera
 * - DI-COGE: Dirección (Costes generales)
 *
 * Uso: npx tsx scripts/seed-cost-centers.ts
 */

import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

const COMPANY_IDS = [
  'vidaro-inversiones',
  'rovida-gestion',
  'viroda-inversiones',
];

const COST_CENTERS = [
  {
    codigo: 'DIR',
    nombre: 'Costes Directos',
    tipo: 'directo' as const,
    responsable: null,
  },
  {
    codigo: 'CDI',
    nombre: 'Costes Directos Imputados (Administración)',
    tipo: 'imputado' as const,
    responsable: null,
  },
  {
    codigo: 'DF-GEN',
    nombre: 'Dirección Financiera',
    tipo: 'direccion' as const,
    responsable: 'Alfonso Calleja',
  },
  {
    codigo: 'DI-COGE',
    nombre: 'Dirección (Costes generales)',
    tipo: 'direccion' as const,
    responsable: null,
  },
];

async function main() {
  console.log('🏗️  Seed de Centros de Coste para Cuadro de Mandos Financiero\n');

  for (const companyId of COMPANY_IDS) {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { id: true, nombre: true },
    });

    if (!company) {
      console.log(`  ⚠️  Empresa ${companyId} no encontrada, saltando...`);
      continue;
    }

    console.log(`📋 ${company.nombre} (${companyId})`);

    for (const cc of COST_CENTERS) {
      const existing = await prisma.costCenter.findUnique({
        where: { companyId_codigo: { companyId, codigo: cc.codigo } },
      });

      if (existing) {
        console.log(`  ✓ ${cc.codigo} ya existe`);
        continue;
      }

      await prisma.costCenter.create({
        data: {
          companyId,
          codigo: cc.codigo,
          nombre: cc.nombre,
          tipo: cc.tipo,
          responsable: cc.responsable,
          activo: true,
        },
      });
      console.log(`  ✅ ${cc.codigo} - ${cc.nombre} creado`);
    }
    console.log('');
  }

  // También crear para cualquier otra empresa activa que no sea del grupo
  const otherCompanies = await prisma.company.findMany({
    where: {
      id: { notIn: COMPANY_IDS },
      activo: true,
      esEmpresaPrueba: false,
    },
    select: { id: true, nombre: true },
  });

  if (otherCompanies.length > 0) {
    console.log('📋 Otras empresas activas:');
    for (const company of otherCompanies) {
      let created = 0;
      for (const cc of COST_CENTERS) {
        const existing = await prisma.costCenter.findUnique({
          where: { companyId_codigo: { companyId: company.id, codigo: cc.codigo } },
        });
        if (!existing) {
          await prisma.costCenter.create({
            data: {
              companyId: company.id,
              codigo: cc.codigo,
              nombre: cc.nombre,
              tipo: cc.tipo,
              responsable: cc.responsable,
              activo: true,
            },
          });
          created++;
        }
      }
      console.log(`  ✅ ${company.nombre}: ${created} centros creados`);
    }
  }

  console.log('\n✅ Seed completado.');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
