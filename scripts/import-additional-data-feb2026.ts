/**
 * Importación de datos adicionales de facturación Feb 2026
 * - IBIs por unidad (Viroda)
 * - Suministros provisionales (Viroda)
 * - Antenas (Viroda)  
 * - Garajes sueltos (Viroda)
 * - Agua, comunidad, calefacción (Rovida)
 * 
 * Estos se registran como gastos asociados a las unidades/edificios correspondientes.
 * 
 * Uso: npx tsx scripts/import-additional-data-feb2026.ts
 */

import { PrismaClient } from '@prisma/client';
import * as XLSX from 'xlsx';
import * as path from 'path';

const prisma = new PrismaClient();

interface ExtraCharge {
  tipo: 'ibi' | 'suministros' | 'antena' | 'garaje' | 'agua' | 'comunidad' | 'calefaccion';
  concepto: string;
  importe: number;
  nif: string;
  nombre: string;
  empresa: 'rovida' | 'viroda';
}

function parseExtraCharges(filePath: string, empresa: 'rovida' | 'viroda'): ExtraCharge[] {
  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  
  const charges: ExtraCharge[] = [];
  let currentNif = '';
  let currentNombre = '';

  for (const row of rows.slice(2)) {
    if (row[3]) {
      currentNif = String(row[3]).trim();
      currentNombre = String(row[4] || '').trim();
    }
    const concepto = String(row[11] || '').trim();
    const precio = typeof row[13] === 'number' ? Math.abs(row[13]) : 0;
    if (!concepto || precio === 0) continue;

    let tipo: ExtraCharge['tipo'] | null = null;
    if (concepto.includes('IBI')) tipo = 'ibi';
    else if (concepto.toLowerCase().includes('suministros')) tipo = 'suministros';
    else if (concepto.toLowerCase().includes('antena')) tipo = 'antena';
    else if (concepto.toLowerCase().includes('garaje') && concepto.toLowerCase().includes('plaza') && concepto.toLowerCase().includes('segun contrato')) tipo = 'garaje';
    else if (concepto.startsWith('Agua')) tipo = 'agua';
    else if (concepto.includes('Comunidad')) tipo = 'comunidad';
    else if (concepto.includes('Calefacción')) tipo = 'calefaccion';

    if (tipo) {
      charges.push({ tipo, concepto, importe: precio, nif: currentNif, nombre: currentNombre, empresa });
    }
  }
  return charges;
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  IMPORTACIÓN DATOS ADICIONALES - Feb 2026');
  console.log('═══════════════════════════════════════════════════════════');

  const basePath = path.join(process.cwd(), 'data-import/CLIENTES');

  // Parse extra charges from both companies
  const virodaCharges = parseExtraCharges(path.join(basePath, 'FACTURACION VIRODA FEB.xlsx'), 'viroda');
  const rovidaCharges = parseExtraCharges(path.join(basePath, 'FACTURACION ROVIDA FEB.xlsx'), 'rovida');
  const allCharges = [...virodaCharges, ...rovidaCharges];

  console.log(`\n📊 Cargos adicionales encontrados:`);
  const byType: Record<string, number> = {};
  for (const c of allCharges) {
    byType[c.tipo] = (byType[c.tipo] || 0) + 1;
  }
  for (const [tipo, count] of Object.entries(byType)) {
    console.log(`   ${tipo}: ${count}`);
  }

  // Get companies
  const rovida = await prisma.company.findFirst({ where: { nombre: { contains: 'Rovida', mode: 'insensitive' } } });
  const viroda = await prisma.company.findFirst({ where: { nombre: { contains: 'Viroda', mode: 'insensitive' } } });
  if (!rovida || !viroda) {
    console.error('❌ Empresas no encontradas');
    return;
  }

  let created = 0, skipped = 0;

  for (const charge of allCharges) {
    const companyId = charge.empresa === 'rovida' ? rovida.id : viroda.id;

    // Find tenant by NIF
    const tenant = await prisma.tenant.findFirst({
      where: { companyId, dni: charge.nif },
    });

    // Find active contract for this tenant
    let contractId: string | null = null;
    if (tenant) {
      const contract = await prisma.contract.findFirst({
        where: { tenantId: tenant.id, estado: 'activo' },
        select: { id: true },
      });
      contractId = contract?.id || null;
    }

    if (!contractId) {
      skipped++;
      continue;
    }

    // Map tipo to ExpenseCategory enum
    const categoriaMap: Record<string, string> = {
      ibi: 'impuestos',
      suministros: 'servicios',
      antena: 'servicios',
      garaje: 'servicios',
      agua: 'servicios',
      comunidad: 'comunidad',
      calefaccion: 'servicios',
    };

    // Find building/unit for the tenant's contract
    const contract = await prisma.contract.findFirst({
      where: { id: contractId },
      select: { unitId: true, unit: { select: { buildingId: true } } },
    });

    // Check if expense already exists
    const existing = await prisma.expense.findFirst({
      where: {
        concepto: charge.concepto,
        fecha: new Date(2026, 1, 1),
        buildingId: contract?.unit?.buildingId || undefined,
      },
    });

    if (existing) {
      skipped++;
      continue;
    }

    // Create expense
    try {
      await prisma.expense.create({
        data: {
          buildingId: contract?.unit?.buildingId || null,
          unitId: contract?.unitId || null,
          concepto: charge.concepto,
          monto: charge.importe,
          categoria: categoriaMap[charge.tipo] as any || 'otro',
          fecha: new Date(2026, 1, 1),
          notas: `${charge.nombre} (${charge.nif}) - Feb 2026`,
        },
      });
      created++;
    } catch (error: any) {
      console.log(`  ❌ ${charge.concepto}: ${error.message?.slice(0, 80)}`);
      skipped++;
    }
  }

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  RESUMEN');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`  ✅ Gastos creados: ${created}`);
  console.log(`  ⏭️ Omitidos: ${skipped}`);
  console.log(`  📊 Total: ${allCharges.length}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
