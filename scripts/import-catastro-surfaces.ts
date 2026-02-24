/**
 * Importar superficies del Catastro a unidades de Rovida y Viroda
 * 
 * Usa la API pública del Catastro (OVCCallejero/Consulta_DNPRC)
 * que devuelve superficies por planta/puerta en la sección <lcons>
 * 
 * Uso: npx tsx scripts/import-catastro-surfaces.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface CatastroUnit {
  uso: string;       // VIVIENDA, COMERCIO, ALMACEN, GARAJE
  planta: string;    // 00, 01, 02, -1, -2
  puerta: string;    // A, B, 01, 02
  escalera: string;  // A, B, C, T
  superficie: number; // m²
}

async function fetchCatastroData(refCatastral: string): Promise<CatastroUnit[]> {
  const rc1 = refCatastral.substring(0, 7);
  const rc2 = refCatastral.substring(7, 14);
  
  const url = `http://ovc.catastro.meh.es/ovcservweb/OVCSWLocalizacionRC/OVCCallejero.asmx/Consulta_DNPRC?Provincia=&Municipio=&RC=${rc1}${rc2}`;
  
  const resp = await fetch(url);
  const text = await resp.text();
  
  // Parse XML with regex (simpler than full XML parser in Node)
  const units: CatastroUnit[] = [];
  const consBlocks = text.match(/<cons>[\s\S]*?<\/cons>/g) || [];
  
  for (const block of consBlocks) {
    const uso = block.match(/<lcd>([^<]+)<\/lcd>/)?.[1] || '';
    const planta = block.match(/<pt>([^<]+)<\/pt>/)?.[1] || '';
    const puerta = block.match(/<pu>([^<]+)<\/pu>/)?.[1] || '';
    const escalera = block.match(/<es>([^<]+)<\/es>/)?.[1] || '';
    const superficie = parseInt(block.match(/<stl>(\d+)<\/stl>/)?.[1] || '0');
    
    if (superficie > 0) {
      units.push({ uso, planta, puerta, escalera, superficie });
    }
  }
  
  return units;
}

function matchCatastroToUnit(catUnit: CatastroUnit, unitNumero: string): boolean {
  const num = unitNumero.toLowerCase().replace(/\s+/g, '');
  const pl = catUnit.planta.replace(/^0+/, '');
  const pu = catUnit.puerta.toLowerCase();
  
  // Match patterns:
  // "1A" or "1ºA" → planta 01, puerta A
  // "Plaza 43" → planta -2 or -3, puerta 43
  // "Local" or "Bajo" → planta 00
  // "Módulo 5" → puerta 5
  
  // Viviendas: "1A" matches planta=01 puerta=A
  if (num.match(/^(\d+)[ºª]?([a-z])$/)) {
    const m = num.match(/^(\d+)[ºª]?([a-z])$/);
    if (m) {
      return m[1] === pl && m[2] === pu;
    }
  }
  
  // "Bajo" → planta 00
  if (num.includes('bajo') && (catUnit.planta === '00' || catUnit.planta === 'BJ')) {
    return true;
  }
  
  // "Local" → COMERCIO on planta 00
  if (num.includes('local') && catUnit.uso === 'COMERCIO' && (catUnit.planta === '00' || catUnit.planta === 'SS')) {
    return true;
  }
  
  // Garaje: "Plaza XX" → match puerta XX
  if (num.includes('plaza')) {
    const plazaNum = num.replace(/plaza/g, '').trim();
    return pu === plazaNum || pu === plazaNum.padStart(2, '0');
  }
  
  // Module: "Módulo X" → puerta X
  if (num.includes('módulo') || num.includes('modulo') || num.includes('mod')) {
    const modNum = num.replace(/módulo|modulo|mod\.?\s*/g, '').trim();
    return pu === modNum || pu.includes(modNum);
  }
  
  // Direct match
  return `${pl}${pu}` === num || `${pl}${pu}`.toLowerCase() === num;
}

// Building references
const BUILDING_REFS: Record<string, { empresa: string; ref: string }> = {
  'Candelaria Mora': { empresa: 'Viroda', ref: '1210406VK4711A' },
  'Hernandez de Tejada': { empresa: 'Viroda', ref: '4977209VK4747F' },
  'Manuel Silvela': { empresa: 'Viroda', ref: '0858104VK4705H' },
  'Reina': { empresa: 'Viroda', ref: '0749012VK4704H' },
  'Menendez Pelayo': { empresa: 'Viroda', ref: '3023207UM7532S' },
  'Espronceda': { empresa: 'Rovida', ref: '1170903VK4717A' },
  'Barquillo': { empresa: 'Rovida', ref: '1151815VK4715A' },
  'Piamonte': { empresa: 'Rovida', ref: '1151510VK4715A' },
  'Prado': { empresa: 'Rovida', ref: '0742703VK4704B' },
};

async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  IMPORTAR SUPERFICIES DEL CATASTRO');
  console.log('═══════════════════════════════════════════════════════════');

  let totalUpdated = 0;

  for (const [buildingHint, config] of Object.entries(BUILDING_REFS)) {
    console.log(`\n📐 ${buildingHint} (${config.ref})...`);
    
    try {
      const catastroUnits = await fetchCatastroData(config.ref);
      console.log(`   Catastro: ${catastroUnits.length} unidades con superficie`);
      
      // Find matching building in DB
      const building = await prisma.building.findFirst({
        where: { nombre: { contains: buildingHint, mode: 'insensitive' } },
        include: { units: true },
      });
      
      if (!building) {
        console.log(`   ⚠️ Edificio no encontrado en BD`);
        continue;
      }
      
      console.log(`   BD: ${building.units.length} unidades`);
      
      let matched = 0;
      for (const unit of building.units) {
        // Skip if already has surface
        if (unit.superficie && Number(unit.superficie) > 0) continue;
        
        // Find matching catastro unit
        const catMatch = catastroUnits.find(cu => matchCatastroToUnit(cu, unit.numero));
        
        if (catMatch) {
          await prisma.unit.update({
            where: { id: unit.id },
            data: { superficie: catMatch.superficie },
          });
          matched++;
          if (matched <= 5) {
            console.log(`   ✅ ${unit.numero} → ${catMatch.superficie} m² (${catMatch.uso})`);
          }
        }
      }
      
      if (matched > 5) {
        console.log(`   ... y ${matched - 5} más`);
      }
      console.log(`   Total actualizadas: ${matched}`);
      totalUpdated += matched;
      
      // Also update building reference catastral
      await prisma.building.update({
        where: { id: building.id },
        data: { referenciaCatastral: config.ref },
      });
      
      // Delay to avoid rate limiting
      await new Promise(r => setTimeout(r, 1000));
      
    } catch (error: any) {
      console.log(`   ❌ Error: ${error.message?.slice(0, 80)}`);
    }
  }

  console.log(`\n═══════════════════════════════════════════════════════════`);
  console.log(`  Total unidades con superficie actualizada: ${totalUpdated}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
