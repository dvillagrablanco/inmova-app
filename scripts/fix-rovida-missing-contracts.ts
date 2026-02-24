/**
 * Fix: Crear contratos faltantes de Rovida
 * Muchas plazas de garaje facturadas no tienen contrato porque el matching falló.
 * Este script matchea por número de plaza directamente.
 */

import { PrismaClient } from '@prisma/client';
import * as XLSX from 'xlsx';
import * as path from 'path';

const prisma = new PrismaClient();

interface BillingContract {
  edificioHint: string;
  plaza: string;
  nif: string;
  nombre: string;
  renta: number;
}

function extractBillingContracts(): BillingContract[] {
  const filePath = path.join(process.cwd(), 'data-import/CLIENTES/FACTURACION ROVIDA FEB.xlsx');
  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  const contracts: BillingContract[] = [];
  let current: any = null;

  for (const row of rows.slice(2)) {
    if (row[0]) {
      current = { nif: String(row[3] || '').trim(), nombre: String(row[4] || '').trim() };
    }
    const concepto = String(row[11] || '').trim();
    const precio = typeof row[13] === 'number' ? Math.abs(row[13]) : 0;
    if (!current || !concepto.startsWith('Renta') || precio === 0) continue;

    let edificioHint = '';
    let plaza = '';

    if (concepto.includes('Espronceda')) {
      edificioHint = 'Espronceda';
      const m = concepto.match(/Pt:(\w+)/);
      if (m) plaza = m[1];
    } else if (concepto.includes('Tejada') && concepto.includes('Garaje')) {
      edificioHint = 'Tejada';
      const m = concepto.match(/[-,]\d\s+(\d+)\s*$/);
      if (m) plaza = m[1];
    } else if ((concepto.includes('Pelayo 17') || concepto.includes('Mdez Pelayo 17')) && concepto.toLowerCase().includes('garaje')) {
      edificioHint = 'Pelayo 17';
      const m = concepto.match(/(\d+)\s+Palencia/) || concepto.match(/[-,]\s*\d,\s*(\d+)/);
      if (m) plaza = m[1];
    } else if (concepto.includes('Constitución 5')) {
      edificioHint = 'Constitución 5';
      const m = concepto.match(/(\d+)\s*$/);
      if (m) plaza = m[1];
    } else if (concepto.includes('Barquillo') && concepto.includes('Local')) {
      edificioHint = 'Barquillo';
      plaza = 'Local';
    } else if (concepto.includes('Pelayo, 15') || concepto.includes('Pelayo 15')) {
      edificioHint = 'Pelayo 15';
      plaza = 'Local';
    } else if (concepto.includes('Cuba')) {
      edificioHint = 'Cuba';
      plaza = '50';
    } else if (concepto.includes('Piamonte')) {
      edificioHint = 'Piamonte';
      plaza = 'Edificio';
    } else if (concepto.includes('Europa') || concepto.includes('Av Europa')) {
      edificioHint = 'Europa';
      plaza = 'Bl.B';
    } else if (concepto.includes('Constitución 8')) {
      edificioHint = 'Constitución 8';
      const m = concepto.match(/Mod\.\s*(\S+)/);
      if (m) plaza = m[1];
    } else if (concepto.includes('Gemelos')) {
      edificioHint = 'Gemelos';
      const m = concepto.match(/(\d+)º\s*(\w)/);
      if (m) plaza = `${m[1]}${m[2]}`;
    } else if (concepto.includes('Reina') && concepto.includes('Local')) {
      edificioHint = 'Reina';
      plaza = concepto.includes('grande') || concepto.includes('19254') ? 'Grande' : 'Pequeño';
    } else if (concepto.includes('Prado')) {
      edificioHint = 'Prado';
      plaza = 'Local';
    }

    if (!edificioHint || !plaza) continue;
    const key = `${edificioHint}-${plaza}`;
    if (contracts.some(c => `${c.edificioHint}-${c.plaza}` === key)) continue;
    
    contracts.push({ edificioHint, plaza, nif: current.nif, nombre: current.nombre, renta: precio });
  }
  return contracts;
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  FIX: CREAR CONTRATOS FALTANTES ROVIDA');
  console.log('═══════════════════════════════════════════════════════════');

  const rovida = await prisma.company.findFirst({
    where: { nombre: { contains: 'Rovida', mode: 'insensitive' } },
  });
  if (!rovida) { console.error('❌ Rovida no encontrada'); return; }

  const buildings = await prisma.building.findMany({
    where: { companyId: rovida.id },
    include: { units: { include: { contracts: { where: { estado: 'activo' }, take: 1 } } } },
  });

  const billingContracts = extractBillingContracts();
  console.log(`\n📄 Contratos en facturación: ${billingContracts.length}`);

  let created = 0, skipped = 0, noUnit = 0, noTenant = 0;

  for (const bc of billingContracts) {
    // Find building
    const building = buildings.find(b =>
      b.nombre.toLowerCase().includes(bc.edificioHint.toLowerCase()) ||
      (b.direccion || '').toLowerCase().includes(bc.edificioHint.toLowerCase())
    );
    if (!building) { noUnit++; continue; }

    // Find unit by plaza number - try multiple formats
    const plazaNum = bc.plaza;
    const plazaPadded = plazaNum.padStart(2, '0');
    
    const unit = building.units.find(u => {
      const num = u.numero.toLowerCase().replace(/\s+/g, '');
      const target = plazaNum.toLowerCase();
      const targetPad = plazaPadded.toLowerCase();
      
      return num === `plaza${target}` || num === `plaza${targetPad}` ||
             num === target || num === targetPad ||
             num.includes(target) || u.numero === `Plaza ${plazaNum}` ||
             u.numero === `Plaza ${plazaPadded}` ||
             u.numero.replace('Plaza ', '') === plazaNum ||
             u.numero.replace('Plaza ', '') === plazaPadded ||
             // For non-garage types
             u.numero.toLowerCase().includes(bc.plaza.toLowerCase());
    });

    if (!unit) {
      if (!['Prado', 'Gemelos'].includes(bc.edificioHint)) {
        console.log(`  ⚠️ No unit: ${building.nombre} / ${bc.plaza} → ${bc.nombre}`);
      }
      noUnit++;
      continue;
    }

    // Skip if already has active contract
    if (unit.contracts && unit.contracts.length > 0) {
      skipped++;
      continue;
    }

    // Find or create tenant
    let tenant = await prisma.tenant.findFirst({
      where: { companyId: rovida.id, dni: bc.nif },
    });

    if (!tenant) {
      try {
        tenant = await prisma.tenant.create({
          data: {
            companyId: rovida.id,
            nombreCompleto: bc.nombre,
            dni: bc.nif,
            email: `${bc.nif.toLowerCase().replace(/[^a-z0-9]/g, '')}@pendiente.inmova.app`,
            telefono: 'Pendiente',
            fechaNacimiento: new Date(1990, 0, 1),
          },
        });
      } catch {
        noTenant++;
        continue;
      }
    }

    // Create contract
    try {
      await prisma.contract.create({
        data: {
          tenantId: tenant.id,
          unitId: unit.id,
          fechaInicio: new Date(2024, 0, 1),
          fechaFin: new Date(2025, 11, 31),
          rentaMensual: bc.renta,
          deposito: bc.renta * 2,
          estado: 'activo',
          tipo: 'residencial',
        },
      });
      await prisma.unit.update({ where: { id: unit.id }, data: { estado: 'ocupada' } });
      console.log(`  ✅ ${building.nombre} ${unit.numero} → ${bc.nombre} (${bc.renta}€)`);
      created++;
    } catch (error: any) {
      console.log(`  ❌ ${building.nombre} ${unit.numero}: ${error.message?.slice(0, 60)}`);
      skipped++;
    }
  }

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log(`  ✅ Contratos creados: ${created}`);
  console.log(`  ⏭️ Ya existían: ${skipped}`);
  console.log(`  ⚠️ Unidad no encontrada: ${noUnit}`);
  console.log(`  ⚠️ Inquilino no creado: ${noTenant}`);

  // Final stats
  const finalActive = await prisma.contract.count({
    where: { estado: 'activo', unit: { building: { companyId: rovida.id } } },
  });
  const finalOcupadas = await prisma.unit.count({
    where: { building: { companyId: rovida.id }, estado: 'ocupada' },
  });
  console.log(`\n  📊 Rovida: ${finalActive} contratos activos, ${finalOcupadas} unidades ocupadas`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
