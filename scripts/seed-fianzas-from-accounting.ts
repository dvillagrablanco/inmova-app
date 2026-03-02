/**
 * Seed de Fianzas desde Contabilidad (Diarios Generales 2025)
 *
 * Extrae saldos de subcuentas 180x de Rovida y Viroda y los carga en FianzaDeposit
 * vinculándolos al contrato activo de cada unidad/inmueble.
 *
 * Fuente: Diarios generales 2025 de Rovida S.L. y Viroda Inversiones S.L.U.
 * Datos pre-extraídos en /tmp/contabilidad/fianzas_extraidas.json
 *
 * Idempotente: no duplica (busca por companyId + contractId + importeFianza)
 *
 * Uso: npx tsx scripts/seed-fianzas-from-accounting.ts
 */

import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

// ============================================================================
// MAPEO: Subcuenta contable → Edificio + hint de unidad
// ============================================================================

interface FianzaEntry {
  cuenta: string;
  nombre: string;
  saldo: number; // Negativo = fianza vigente (pasivo)
  companyId: string;
  buildingHint: string;
  unitHint: string;
}

/**
 * Clasifica cada subcuenta de fianza por edificio y unidad.
 * Devuelve el importe como positivo (la fianza es un pasivo pero el depósito es positivo).
 */
function classifyFianza(cuenta: string, nombre: string, saldo: number, companyId: string): FianzaEntry | null {
  const importe = Math.abs(saldo);
  if (importe === 0) return null;

  const n = (nombre || '').toLowerCase();
  let buildingHint = '';
  let unitHint = '';

  if (companyId === 'rovida-gestion') {
    // Espronceda garajes: 1800000101-214
    if (cuenta.startsWith('1800000') && parseInt(cuenta.slice(7)) >= 101 && parseInt(cuenta.slice(7)) <= 214) {
      buildingHint = 'Espronceda';
      const plazaMatch = nombre.match(/PLAZA\s+(\d+)/i);
      unitHint = plazaMatch ? `Plaza ${plazaMatch[1].padStart(2, '0')}` : '';
    }
    // M.Pelayo 17 Palencia garajes: 1800000216-236
    else if (cuenta.startsWith('1800000') && parseInt(cuenta.slice(7)) >= 216 && parseInt(cuenta.slice(7)) <= 236) {
      buildingHint = 'Pelayo 17';
      const plazaMatch = nombre.match(/PLAZA\s+([\w.]+)/i);
      unitHint = plazaMatch ? `Plaza ${plazaMatch[1]}` : '';
    }
    // H.Tejada garajes: 18000161xx-18000162xx
    else if (cuenta.startsWith('180001')) {
      buildingHint = 'Tejada';
      const plazaMatch = nombre.match(/PLAZA\s+([\w.]+)/i);
      unitHint = plazaMatch ? `Plaza ${plazaMatch[1]}` : '';
    }
    // Constitución 8: 1800000014-020
    else if (n.includes('constitución')) {
      buildingHint = 'Constitución 8';
      const modMatch = nombre.match(/Mod\.?\s*(\S+)/i);
      unitHint = modMatch ? `Mod.${modMatch[1]}` : '';
    }
    // Europa oficinas: 1800000003-007, 012
    else if (n.includes('europa')) {
      buildingHint = 'Europa';
      unitHint = nombre.replace(/Fianza recibida\s*/i, '').trim();
    }
    // Barquillo: 1800000022
    else if (n.includes('barquillo')) {
      buildingHint = 'Barquillo';
      unitHint = 'Local';
    }
    // Reina 15 locales: 1800000023-024
    else if (n.includes('reina 15') || n.includes('finca 13')) {
      buildingHint = 'Reina 15';
      if (n.includes('local 1') || n.includes('13182')) unitHint = 'Local Grande';
      else if (n.includes('local 2') || n.includes('13184')) unitHint = 'Local Pequeño';
    }
    // Piamonte: 1800000025
    else if (n.includes('piamonte')) {
      buildingHint = 'Piamonte';
      unitHint = 'Edificio';
    }
    // Naves Cuba: 1800000026
    else if (n.includes('cuba')) {
      buildingHint = 'Cuba';
      unitHint = 'Nave';
    }
    // M.Pelayo 15 local: 1800000021
    else if (n.includes('m.pelayo 15') || n.includes('pelayo 15')) {
      buildingHint = 'Pelayo 15';
      unitHint = 'Local';
    }
    // Metal 4: 1800000013
    else if (n.includes('metal')) {
      buildingHint = 'Metal';
      unitHint = 'Nave';
    }
    // Magaz
    else if (n.includes('magaz')) {
      buildingHint = 'Magaz';
      const match = nombre.match(/garaj?\s*(\d+)/i) || nombre.match(/Bl\w*\s*(\d+)/i);
      unitHint = match?.[1] ?? '';
    }
    // Santos Transportes (genérico)
    else if (n.includes('santos')) {
      buildingHint = 'Santos';
      unitHint = '';
    }
    else {
      return null; // Unknown
    }
  } else if (companyId === 'viroda-inversiones') {
    // Silvela 5: 1800001001-017
    if (cuenta.startsWith('1800001')) {
      buildingHint = 'Silvela';
      const match = nombre.match(/(\d+º?\s*[A-C])/i) || nombre.match(/Bajo/i);
      unitHint = match?.[1]?.trim() ?? '';
      // Extract "5,Bajo" or "5,1º A" pattern
      const fullMatch = nombre.match(/SILVELA\s*5[,\s]*([\w\s°º]+)/i);
      if (fullMatch && fullMatch[1]) unitHint = fullMatch[1].trim();
    }
    // Candelaria Mora: 1800002001-014
    else if (cuenta.startsWith('1800002')) {
      buildingHint = 'Candelaria';
      const match = nombre.match(/(\d+º[A-E])/i) || nombre.match(/(duplex)/i);
      unitHint = match?.[1]?.trim() ?? '';
    }
    // Reina 15 viviendas: 1800004001-015
    else if (cuenta.startsWith('1800004')) {
      buildingHint = 'Reina 15';
      const match = nombre.match(/(\d+º[A-D])/i);
      unitHint = match?.[1]?.trim() ?? '';
    }
    // H.Tejada 6 viviendas: 1800005001-012
    else if (cuenta.startsWith('1800005')) {
      buildingHint = 'Tejada';
      const match = nombre.match(/(\d+º[A-C])/i);
      unitHint = match?.[1]?.trim() ?? '';
    }
    // M.Pelayo viviendas: 1800000001-002
    else if (n.includes('pelayo')) {
      buildingHint = 'Pelayo';
      const match = nombre.match(/(4º\s*dcha|Ático)/i);
      unitHint = match?.[1]?.trim() ?? '';
    }
    else {
      return null;
    }
  }

  return { cuenta, nombre, saldo: importe, companyId, buildingHint, unitHint };
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log('🔑 Seed de Fianzas desde Contabilidad\n');
  console.log('   Fuente: Diarios Generales 2025 (Rovida + Viroda)');
  console.log('   Modelo destino: FianzaDeposit\n');

  // Fianzas data inline (extracted from accounting)
  // Using the pre-extracted data from the accounting analysis
  const FIANZAS_RAW: Array<{ cuenta: string; nombre: string; saldo: number; sociedad: string }> = [];

  // Load from JSON if available, otherwise use embedded data
  try {
    const fs = await import('fs');
    const path = await import('path');
    const jsonPath = path.join(process.cwd(), 'data', 'fianzas_extraidas.json');
    if (fs.existsSync(jsonPath)) {
      const data = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
      for (const [sociedad, fianzas] of Object.entries(data)) {
        for (const f of fianzas as Array<{ cuenta: string; nombre: string; saldo: number }>) {
          FIANZAS_RAW.push({ ...f, sociedad });
        }
      }
      console.log(`   Cargadas ${FIANZAS_RAW.length} fianzas desde ${jsonPath}\n`);
    }
  } catch {
    // File not found - will use inline data
  }

  // If no JSON file, try /tmp path
  if (FIANZAS_RAW.length === 0) {
    try {
      const fs = await import('fs');
      const tmpPath = '/tmp/contabilidad/fianzas_extraidas.json';
      if (fs.existsSync(tmpPath)) {
        const data = JSON.parse(fs.readFileSync(tmpPath, 'utf-8'));
        for (const [sociedad, fianzas] of Object.entries(data)) {
          for (const f of fianzas as Array<{ cuenta: string; nombre: string; saldo: number }>) {
            FIANZAS_RAW.push({ ...f, sociedad });
          }
        }
        console.log(`   Cargadas ${FIANZAS_RAW.length} fianzas desde ${tmpPath}\n`);
      }
    } catch {
      console.log('   ⚠️ Archivo de fianzas no encontrado. Copialo a data/fianzas_extraidas.json');
      process.exit(1);
    }
  }

  if (FIANZAS_RAW.length === 0) {
    console.log('   ⚠️ Sin datos de fianzas. Ejecuta primero el análisis contable.');
    process.exit(1);
  }

  // Find actual company IDs by name (they may not be the hardcoded ones)
  const rovidaCompany = await prisma.company.findFirst({
    where: { nombre: { contains: 'Rovida', mode: 'insensitive' } },
    select: { id: true, nombre: true },
  });
  const virodaCompany = await prisma.company.findFirst({
    where: { nombre: { contains: 'Viroda', mode: 'insensitive' } },
    select: { id: true, nombre: true },
  });

  console.log(`   Rovida: ${rovidaCompany ? `${rovidaCompany.nombre} (${rovidaCompany.id})` : 'NO ENCONTRADA'}`);
  console.log(`   Viroda: ${virodaCompany ? `${virodaCompany.nombre} (${virodaCompany.id})` : 'NO ENCONTRADA'}\n`);

  const COMPANY_MAP: Record<string, string> = {};
  if (rovidaCompany) COMPANY_MAP['ROVIDA'] = rovidaCompany.id;
  if (virodaCompany) COMPANY_MAP['VIRODA'] = virodaCompany.id;

  // Classify all fianzas
  const classified: FianzaEntry[] = [];
  let unclassified = 0;

  for (const raw of FIANZAS_RAW) {
    const companyId = COMPANY_MAP[raw.sociedad];
    if (!companyId) continue;

    const entry = classifyFianza(raw.cuenta, raw.nombre, raw.saldo, companyId);
    if (entry) {
      classified.push(entry);
    } else {
      unclassified++;
    }
  }

  console.log(`   Clasificadas: ${classified.length}`);
  console.log(`   Sin clasificar: ${unclassified}\n`);

  // Load buildings from DB
  const buildings = await prisma.building.findMany({
    where: { companyId: { in: Object.values(COMPANY_MAP) } },
    include: {
      units: {
        include: {
          contracts: {
            where: { estado: { in: ['activo', 'vencido'] } },
            orderBy: [{ estado: 'asc' }, { fechaInicio: 'desc' }],
            take: 1,
          },
        },
      },
    },
  });

  console.log(`   Edificios en BD: ${buildings.length}`);
  console.log(`   Unidades: ${buildings.reduce((s, b) => s + b.units.length, 0)}\n`);

  let created = 0;
  let skipped = 0;
  let noMatch = 0;
  let noContract = 0;

  for (const fianza of classified) {
    // Find matching building
    const building = buildings.find(
      (b) =>
        b.companyId === fianza.companyId &&
        b.nombre.toLowerCase().includes(fianza.buildingHint.toLowerCase())
    );

    if (!building) {
      noMatch++;
      continue;
    }

    // Find matching unit (if unitHint provided)
    let targetUnit = building.units[0]; // Default to first unit
    if (fianza.unitHint) {
      const hintLower = fianza.unitHint.toLowerCase().replace(/\s+/g, '');
      const matched = building.units.find((u) => {
        const uNum = u.numero.toLowerCase().replace(/\s+/g, '');
        return (
          uNum.includes(hintLower) ||
          hintLower.includes(uNum) ||
          uNum === hintLower
        );
      });
      if (matched) targetUnit = matched;
    }

    if (!targetUnit) {
      noMatch++;
      continue;
    }

    // Get active contract
    const contract = targetUnit.contracts[0];
    if (!contract) {
      noContract++;
      // Create fianza without contract link is not possible (contractId required)
      // Skip for now — these units might not have active contracts
      continue;
    }

    // Check if fianza already exists (avoid duplicates)
    const existing = await prisma.fianzaDeposit.findFirst({
      where: {
        companyId: fianza.companyId,
        contractId: contract.id,
        importeFianza: fianza.saldo,
      },
    });

    if (existing) {
      skipped++;
      continue;
    }

    // Create FianzaDeposit
    await prisma.fianzaDeposit.create({
      data: {
        contractId: contract.id,
        companyId: fianza.companyId,
        importeFianza: fianza.saldo,
        mesesFianza: Math.round(fianza.saldo / (contract.rentaMensual || fianza.saldo)),
        organismoDeposito: fianza.companyId === 'viroda-inversiones' ? 'IVIMA' : null,
        numeroDeposito: fianza.cuenta, // Subcuenta contable como referencia
        fechaDeposito: new Date(2025, 0, 1), // Saldo apertura 2025
        estado: 'depositada',
      },
    });
    created++;

    if (created % 20 === 0) {
      console.log(`   ... ${created} fianzas creadas`);
    }
  }

  // Summary
  console.log(`\n${'─'.repeat(60)}`);
  console.log(`  ✅ Creadas:        ${created}`);
  console.log(`  ⏭️  Duplicadas:     ${skipped}`);
  console.log(`  ⚠️  Sin edificio:   ${noMatch}`);
  console.log(`  ⚠️  Sin contrato:   ${noContract}`);
  console.log(`  ❓ Sin clasificar: ${unclassified}`);
  console.log(`${'─'.repeat(60)}`);

  // Per-company summary
  const createdByCompany: Record<string, number> = {};
  for (const f of classified) {
    if (!createdByCompany[f.companyId]) createdByCompany[f.companyId] = 0;
  }

  const fianzasByCompany = await prisma.fianzaDeposit.groupBy({
    by: ['companyId'],
    _count: { id: true },
    _sum: { importeFianza: true },
  });

  console.log('\n  Fianzas en BD por empresa:');
  for (const g of fianzasByCompany) {
    console.log(`    ${g.companyId}: ${g._count.id} fianzas, total €${g._sum.importeFianza?.toLocaleString('es-ES')}`);
  }

  console.log('\n✅ Seed completado.');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
