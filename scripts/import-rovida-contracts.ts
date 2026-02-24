/**
 * Importación/actualización de contratos Rovida desde facturación Feb 2026
 * 
 * Actualiza rentas de contratos existentes y crea los faltantes.
 * Fuente: FACTURACION ROVIDA FEB.xlsx
 * 
 * Uso: npx tsx scripts/import-rovida-contracts.ts
 */

import { PrismaClient } from '@prisma/client';
import * as XLSX from 'xlsx';
import * as path from 'path';

const prisma = new PrismaClient();

interface ContractData {
  edificioHint: string;
  unidadHint: string;
  nif: string;
  nombreInquilino: string;
  rentaMensual: number;
  notas?: string;
}

function parseRovidaBilling(): ContractData[] {
  const filePath = path.join(process.cwd(), 'data-import/CLIENTES/FACTURACION ROVIDA FEB.xlsx');
  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  
  const contracts: ContractData[] = [];
  let currentFactura: any = null;

  for (const row of rows.slice(2)) {
    if (row[0]) {
      currentFactura = {
        nif: String(row[3] || '').trim(),
        nombre: String(row[4] || '').trim(),
        operacion: String(row[6] || '').trim(),
      };
    }
    
    const concepto = String(row[11] || '').trim();
    const precio = typeof row[13] === 'number' ? Math.abs(row[13]) : 0;
    
    if (!currentFactura || !concepto || precio === 0) continue;
    if (!concepto.startsWith('Renta ')) continue;
    // Skip water/heating/community charges
    if (concepto.includes('Agua ') || concepto.includes('Calefacción') || concepto.includes('Comunidad')) continue;

    // Parse concepto to extract building and unit hints
    let edificioHint = '';
    let unidadHint = '';

    if (concepto.includes('Espronceda')) {
      edificioHint = 'Espronceda';
      // "Renta Garaje C/Espronceda 32, Es:G Pl:-2 Pt:01 Madrid" → extract Pt number
      const ptMatch = concepto.match(/Pt:(\w+)/);
      if (ptMatch) unidadHint = ptMatch[1];
    } else if (concepto.includes('Hernández de Tejada') || concepto.includes('Tejada')) {
      edificioHint = 'Tejada';
      // "Renta Garaje C/Hernández de Tejada 6,-2 11" → extract plaza number
      const plazaMatch = concepto.match(/[-,]\d\s*(\d+)\s*$/);
      if (plazaMatch) unidadHint = plazaMatch[1];
    } else if (concepto.includes('Constitución 8')) {
      edificioHint = 'Constitución 8';
      // "Renta Inmueble C/Constitución 8, 2ºA, Mod. 5 Valladolid"
      const modMatch = concepto.match(/Mod\.\s*(\S+)/);
      if (modMatch) unidadHint = modMatch[1];
    } else if (concepto.includes('Constitución 5')) {
      edificioHint = 'Constitución 5';
      const plazaMatch = concepto.match(/[-,]\d+,\s*(\d+)/);
      if (plazaMatch) unidadHint = plazaMatch[1];
    } else if (concepto.includes('Barquillo')) {
      edificioHint = 'Barquillo';
      unidadHint = 'Local';
    } else if (concepto.includes('Reina 15') && concepto.includes('Local')) {
      edificioHint = 'Reina';
      if (concepto.includes('grande') || concepto.includes('19254')) unidadHint = 'Grande';
      else if (concepto.includes('pequeño') || concepto.includes('19256')) unidadHint = 'Pequeño';
    } else if (concepto.includes('Piamonte')) {
      edificioHint = 'Piamonte';
      unidadHint = 'Edificio';
    } else if (concepto.includes('Av Europa') || concepto.includes('Europa 34')) {
      edificioHint = 'Europa';
      unidadHint = 'Bl.B';
    } else if (concepto.includes('Pelayo 17') || concepto.includes('Mdez Pelayo 17')) {
      edificioHint = 'Pelayo 17';
      const plazaMatch = concepto.match(/[-,]\s*(\d+)\s*Palencia/);
      if (plazaMatch) unidadHint = plazaMatch[1];
      else {
        const altMatch = concepto.match(/[-,]\d,\s*(\d+)/);
        if (altMatch) unidadHint = altMatch[1];
      }
    } else if (concepto.includes('Pelayo, 15') || concepto.includes('Pelayo 15')) {
      edificioHint = 'Pelayo 15';
      unidadHint = 'Local';
    } else if (concepto.includes('Cuba')) {
      edificioHint = 'Cuba';
      unidadHint = '50';
    } else if (concepto.includes('Prado')) {
      edificioHint = 'Prado';
      unidadHint = 'Local';
    } else if (concepto.includes('Gemelos')) {
      edificioHint = 'Gemelos';
      const pisoMatch = concepto.match(/(\d+)º\s*(\w)/);
      if (pisoMatch) unidadHint = `${pisoMatch[1]}${pisoMatch[2]}`;
    }

    if (!edificioHint || !unidadHint) continue;

    // Avoid duplicates (same building+unit)
    const key = `${edificioHint}-${unidadHint}`;
    if (contracts.some(c => `${c.edificioHint}-${c.unidadHint}` === key)) continue;

    contracts.push({
      edificioHint,
      unidadHint,
      nif: currentFactura.nif,
      nombreInquilino: currentFactura.nombre,
      rentaMensual: precio,
      notas: concepto,
    });
  }

  return contracts;
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  IMPORTACIÓN/ACTUALIZACIÓN CONTRATOS ROVIDA');
  console.log('═══════════════════════════════════════════════════════════');

  const rovida = await prisma.company.findFirst({
    where: { nombre: { contains: 'Rovida', mode: 'insensitive' } },
  });
  if (!rovida) { console.error('❌ Rovida no encontrada'); return; }
  console.log(`\n🏢 Rovida: ${rovida.id}`);

  const buildings = await prisma.building.findMany({
    where: { companyId: rovida.id },
    include: { units: true },
  });
  console.log(`📋 Edificios: ${buildings.length}`);

  const contracts = parseRovidaBilling();
  console.log(`📄 Contratos extraídos de facturación: ${contracts.length}`);

  let created = 0, updated = 0, skipped = 0, noUnit = 0, noTenant = 0;

  for (const c of contracts) {
    // Find building
    const building = buildings.find(b =>
      b.nombre.toLowerCase().includes(c.edificioHint.toLowerCase()) ||
      b.direccion?.toLowerCase().includes(c.edificioHint.toLowerCase())
    );
    if (!building) {
      noUnit++;
      continue;
    }

    // Find unit - match by number/name
    const normalizeUnit = (s: string) => s.toLowerCase().replace(/[ºª\s\-_.plaza]/g, '');
    const hint = normalizeUnit(c.unidadHint);
    
    const unit = building.units.find(u => {
      const uNum = normalizeUnit(u.numero);
      return uNum === hint || uNum.includes(hint) || hint.includes(uNum) ||
             u.numero.includes(c.unidadHint) || c.unidadHint.includes(u.numero.replace('Plaza ', ''));
    });
    
    if (!unit) {
      if (c.edificioHint !== 'Espronceda' && c.edificioHint !== 'Pelayo 17') {
        // Only log non-garage misses
        console.log(`  ⚠️ Unidad "${c.unidadHint}" no encontrada en ${building.nombre}`);
      }
      noUnit++;
      continue;
    }

    // Find or create tenant
    let tenant = await prisma.tenant.findFirst({
      where: { companyId: rovida.id, dni: c.nif },
    });

    if (!tenant) {
      try {
        const emailPlaceholder = `${c.nif.toLowerCase().replace(/[^a-z0-9]/g, '')}@pendiente.inmova.app`;
        tenant = await prisma.tenant.create({
          data: {
            companyId: rovida.id,
            nombreCompleto: c.nombreInquilino,
            dni: c.nif,
            email: emailPlaceholder,
            telefono: 'Pendiente',
            fechaNacimiento: new Date(1990, 0, 1),
            notas: 'Importado desde facturación Feb 2026',
          },
        });
      } catch {
        noTenant++;
        continue;
      }
    }

    // Check existing contract on this unit
    const existingContract = await prisma.contract.findFirst({
      where: { unitId: unit.id, estado: 'activo' },
    });

    if (existingContract) {
      if (Math.abs(Number(existingContract.rentaMensual) - c.rentaMensual) > 0.5) {
        await prisma.contract.update({
          where: { id: existingContract.id },
          data: { rentaMensual: c.rentaMensual },
        });
        console.log(`  🔄 ${building.nombre} ${unit.numero}: ${c.rentaMensual}€`);
        updated++;
      } else {
        skipped++;
      }
      continue;
    }

    // Create contract
    const fechaInicio = new Date(2024, 0, 1);
    const fechaFin = new Date(2025, 11, 31);

    try {
      await prisma.contract.create({
        data: {
          tenantId: tenant.id,
          unitId: unit.id,
          fechaInicio,
          fechaFin,
          rentaMensual: c.rentaMensual,
          deposito: c.rentaMensual * 2,
          depositoGarantia: c.rentaMensual * 2,
          estado: 'activo',
          tipo: 'alquiler',
          notas: c.notas || null,
        },
      });
      await prisma.unit.update({ where: { id: unit.id }, data: { estado: 'ocupada' } });
      console.log(`  ✅ ${building.nombre} ${unit.numero} → ${c.nombreInquilino} (${c.rentaMensual}€)`);
      created++;
    } catch (error: any) {
      console.log(`  ❌ ${building.nombre} ${unit.numero}: ${error.message?.slice(0, 80)}`);
      skipped++;
    }
  }

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  RESUMEN ROVIDA');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`  ✅ Contratos creados: ${created}`);
  console.log(`  🔄 Rentas actualizadas: ${updated}`);
  console.log(`  ⏭️ Ya existían: ${skipped}`);
  console.log(`  ⚠️ Unidad no encontrada: ${noUnit}`);
  console.log(`  ⚠️ Inquilino no creado: ${noTenant}`);
  console.log(`  📊 Total procesados: ${contracts.length}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
