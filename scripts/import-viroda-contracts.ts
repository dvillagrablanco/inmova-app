/**
 * Importación de contratos Viroda desde datos de facturación Feb 2026
 * 
 * Crea/actualiza contratos activos vinculando inquilino ↔ unidad
 * Fuente: FACTURACION VIRODA FEB.xlsx + estructura de carpetas Google Drive
 * 
 * Uso: npx tsx scripts/import-viroda-contracts.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface ContractData {
  edificioHint: string;    // Buscar edificio que contenga este texto
  unidadHint: string;      // Buscar unidad que contenga este texto
  nif: string;             // NIF del inquilino
  nombreInquilino: string; // Nombre para verificación
  rentaMensual: number;    // Renta del contrato
  fechaInicio?: string;    // YYYY-MM-DD (si se conoce)
  fechaFin?: string;       // YYYY-MM-DD (si se conoce)
  notas?: string;
}

// Contratos extraídos de facturación Viroda Feb 2026 + estructura Google Drive
const CONTRATOS: ContractData[] = [
  // ========== CANDELARIA MORA 12-14 ==========
  { edificioHint: 'Candelaria', unidadHint: '1', nif: '47724549D', nombreInquilino: 'MELENDEZ PEREZ, IRIA', rentaMensual: 857.31, fechaInicio: '2022-10-05', notas: '1ºA + Garaje 11' },
  { edificioHint: 'Candelaria', unidadHint: '1B', nif: 'BT6071868', nombreInquilino: 'SENDULA GERGELY', rentaMensual: 1428, notas: '1ºB' },
  { edificioHint: 'Candelaria', unidadHint: '1C', nif: '50945397Y', nombreInquilino: 'ESPIN HIDALGO, CARLOS', rentaMensual: 927, notas: '1ºC + Garaje 14' },
  { edificioHint: 'Candelaria', unidadHint: '1D', nif: 'P29566630', nombreInquilino: 'ORTIZ ORTIZ, CLAUDIO ENRIQUE', rentaMensual: 1600, fechaInicio: '2025-01-27', notas: '1ºD' },
  { edificioHint: 'Candelaria', unidadHint: '1E', nif: '05278604N', nombreInquilino: 'ELISA VALLEJO POZA', rentaMensual: 1960, notas: '1ºE + Garaje 8' },
  { edificioHint: 'Candelaria', unidadHint: '2A', nif: '45132020V', nombreInquilino: 'ESTEFANIA PABLOS MARIN', rentaMensual: 1300, notas: '2ºA' },
  { edificioHint: 'Candelaria', unidadHint: '2B', nif: '33472073N', nombreInquilino: 'CUESTA VILLEGAS, DANIEL', rentaMensual: 900, fechaInicio: '2023-04-25', notas: '2ºB + Garaje 5' },
  { edificioHint: 'Candelaria', unidadHint: '2C', nif: '51997282D', nombreInquilino: 'NAVA SACRISTAN, MARIA JOSE', rentaMensual: 857.29, notas: '2ºC + Garaje 2' },
  { edificioHint: 'Candelaria', unidadHint: '3A', nif: 'YC1033608', nombreInquilino: 'ALEXANDER DE FILIPPO', rentaMensual: 1280, fechaInicio: '2024-11-30', fechaFin: '2025-02-28', notas: '3ºA temporal' },
  { edificioHint: 'Candelaria', unidadHint: '3B', nif: '11812008J', nombreInquilino: 'JOSE ALFONSO GEMA BAREA', rentaMensual: 1280, fechaInicio: '2025-01-07', fechaFin: '2025-04-07', notas: '3ºB' },
  { edificioHint: 'Candelaria', unidadHint: '3C', nif: 'Y1769634M', nombreInquilino: 'JIAXIANG ZHANG', rentaMensual: 919.80, fechaInicio: '2022-06-07', notas: '3ºC + Garaje 9' },
  { edificioHint: 'Candelaria', unidadHint: '4A', nif: '0822380', nombreInquilino: 'OLEGOVNA GOLDAKOVA, SOFÍA', rentaMensual: 1280, fechaInicio: '2025-07-04', fechaFin: '2026-06-03', notas: '4ºA' },
  { edificioHint: 'Candelaria', unidadHint: '4B', nif: 'C4G37Z81C', nombreInquilino: 'MARCO BECKER, DYLAN', rentaMensual: 1280, fechaInicio: '2025-07-04', fechaFin: '2026-07-01', notas: '4ºB' },
  { edificioHint: 'Candelaria', unidadHint: '4C', nif: '44364372V', nombreInquilino: 'MINGUEZ BAENA, SALVADOR DAVID', rentaMensual: 850, fechaInicio: '2022-06-06', notas: '4ºC + Garaje 7' },

  // ========== HERNÁNDEZ DE TEJADA 6 ==========
  { edificioHint: 'Tejada', unidadHint: '1A', nif: 'Y2465614M', nombreInquilino: 'TIAGO MIGUEL MARQUE ANDRADE', rentaMensual: 985.13, notas: '1ºA' },
  { edificioHint: 'Tejada', unidadHint: '1B', nif: '00836572Q', nombreInquilino: 'MARTA PERALES DE VIVAR', rentaMensual: 946.67, notas: '1ºB' },
  { edificioHint: 'Tejada', unidadHint: '1C', nif: '51027591K', nombreInquilino: 'PABLO-COROMOTO FIGUEROA HERRERA', rentaMensual: 1121.89, notas: '1ºC' },
  { edificioHint: 'Tejada', unidadHint: '2A', nif: '52905271G', nombreInquilino: 'LYDIA SANCHEZ MARTIN', rentaMensual: 1133, notas: '2ºA' },
  { edificioHint: 'Tejada', unidadHint: '2B', nif: '47490387X', nombreInquilino: 'ROCIO CRUZ CHAVES', rentaMensual: 1023.29, notas: '2ºB' },
  { edificioHint: 'Tejada', unidadHint: '2C', nif: '51102881D', nombreInquilino: 'MARIA PIA PATATIAN HARMOUCH', rentaMensual: 1800, notas: '2ºC' },
  { edificioHint: 'Tejada', unidadHint: '3A', nif: '02730558K', nombreInquilino: 'JAVIER CRISTOBAL VEGA', rentaMensual: 1053.33, notas: '3ºA' },
  { edificioHint: 'Tejada', unidadHint: '3B', nif: '51093305R', nombreInquilino: 'MARIA DE LAS NIEVES CASAIS DE LA ROSA', rentaMensual: 1125.52, notas: '3ºB' },
  { edificioHint: 'Tejada', unidadHint: '3C', nif: '08568700960', nombreInquilino: 'LOCKER INPOST ITALIA S.R.L', rentaMensual: 1650, notas: '3ºC Local/Oficina' },
  { edificioHint: 'Tejada', unidadHint: '4A', nif: '60055439R', nombreInquilino: 'ALEJANDRA KOROVAICHUK QUESADA', rentaMensual: 2030, notas: '4ºA + Garaje' },
  { edificioHint: 'Tejada', unidadHint: '4B', nif: '27313510K', nombreInquilino: 'FRANCISCA LORENA RODRÍGUEZ CASA', rentaMensual: 1325, notas: '4ºB' },
  { edificioHint: 'Tejada', unidadHint: '4C', nif: '42866451V', nombreInquilino: 'ARANZAZU GÓMEZ GUTIÉREEZ', rentaMensual: 1076.89, notas: '4ºC' },

  // ========== MANUEL SILVELA 5 ==========
  { edificioHint: 'Silvela', unidadHint: 'Bajo', nif: '674303147', nombreInquilino: 'ANDREW YOTNEGPARIAN', rentaMensual: 1350, notas: 'Bajo' },
  { edificioHint: 'Silvela', unidadHint: '1A', nif: '20DK48533', nombreInquilino: 'ZÉLIE LOURME, JOSEPHINE MARIE', rentaMensual: 3750, notas: '1ºA' },
  { edificioHint: 'Silvela', unidadHint: '1B', nif: '55309982L', nombreInquilino: 'MAZOY SÁNCHEZ, SANDRA', rentaMensual: 1391.33, notas: '1ºB' },
  { edificioHint: 'Silvela', unidadHint: '2A', nif: '01471706M', nombreInquilino: 'MAESTRO DE LAS CASAS, MARIA LUISA', rentaMensual: 2147.43, notas: '2ºA' },
  { edificioHint: 'Silvela', unidadHint: '2B', nif: '50746853K', nombreInquilino: 'SANZ RUIZ, MARÍA', rentaMensual: 1746.33, notas: '2ºB' },
  { edificioHint: 'Silvela', unidadHint: '3A', nif: '43918127H', nombreInquilino: 'ARANGO LAGO, EMMA', rentaMensual: 2900, notas: '3ºA' },
  { edificioHint: 'Silvela', unidadHint: '3B', nif: '17738199E', nombreInquilino: 'PENSADO, FEDERICO', rentaMensual: 2350, notas: '3ºB' },
  { edificioHint: 'Silvela', unidadHint: '4A', nif: 'G41642888', nombreInquilino: 'CHAVEZ CASTAÑEDA, ANA CAMILA', rentaMensual: 3365.67, notas: '4ºA' },
  { edificioHint: 'Silvela', unidadHint: '4B', nif: 'Y7403559B', nombreInquilino: 'CLAUDE KHOURY, JEAN', rentaMensual: 2200, notas: '4ºB' },
  { edificioHint: 'Silvela', unidadHint: '5A', nif: 'Z1741902W', nombreInquilino: 'SETTON KATZ, DAVID', rentaMensual: 3100, notas: '5ºA' },
  { edificioHint: 'Silvela', unidadHint: '5B', nif: 'G35686719', nombreInquilino: 'GARZA COINDREAU, ISAAC', rentaMensual: 2350, notas: '5ºB' },
  { edificioHint: 'Silvela', unidadHint: '6A', nif: '74859051P', nombreInquilino: 'ANDÚJAR HERNÁNDEZ, JORGE', rentaMensual: 1803.52, notas: '6ºA' },
  { edificioHint: 'Silvela', unidadHint: '6B', nif: '71128564Y', nombreInquilino: 'LAZARO MOZO, SOFIA', rentaMensual: 1449.51, notas: '6ºB' },
  { edificioHint: 'Silvela', unidadHint: '6C', nif: '18CC50939', nombreInquilino: 'JULIAN ABOU-JAOUDE', rentaMensual: 2900, notas: '6ºC' },
  { edificioHint: 'Silvela', unidadHint: 'Local', nif: 'B86939725', nombreInquilino: 'PILATES LAB S.L.', rentaMensual: 5437.04, notas: 'Local comercial' },

  // ========== REINA 15 ==========
  { edificioHint: 'Reina', unidadHint: '1A', nif: 'N18920722', nombreInquilino: 'PABLO ROMO DE ALBACON', rentaMensual: 2600, notas: '1ºA' },
  { edificioHint: 'Reina', unidadHint: '1B', nif: 'YB8528526', nombreInquilino: 'GIULIO BONIFACIO', rentaMensual: 2750, notas: '1ºB' },
  { edificioHint: 'Reina', unidadHint: '1C', nif: '128809376', nombreInquilino: 'TALLULAH STORM GURNEY', rentaMensual: 1950, notas: '1ºC' },
  { edificioHint: 'Reina', unidadHint: '1D', nif: 'Z3257135H', nombreInquilino: 'YI DING', rentaMensual: 1850, notas: '1ºD' },
  { edificioHint: 'Reina', unidadHint: '2A', nif: 'L21TP51N8', nombreInquilino: 'LEO GOTTHELF, VINCENT', rentaMensual: 2500, notas: '2ºA' },
  { edificioHint: 'Reina', unidadHint: '2B', nif: 'YE375351', nombreInquilino: 'ASSOULINE, GABRIEL', rentaMensual: 2500, notas: '2ºB' },
  { edificioHint: 'Reina', unidadHint: '2C', nif: '23C18320', nombreInquilino: 'BERNARD MASSY, CHARLES ETIENNE', rentaMensual: 1800, notas: '2ºC' },
  { edificioHint: 'Reina', unidadHint: '2D', nif: '387465867', nombreInquilino: 'ATANASOVA RADEVA, RAYA', rentaMensual: 1750, notas: '2ºD' },
  { edificioHint: 'Reina', unidadHint: '3A', nif: '672619190', nombreInquilino: 'JACQUELINE JING-WEN SU', rentaMensual: 2700, notas: '3ºA' },
  { edificioHint: 'Reina', unidadHint: '3B', nif: 'Z1050580Z', nombreInquilino: 'SANCHEZ GIRALDO, MARIA ANTONIA', rentaMensual: 2600, notas: '3ºB' },
  { edificioHint: 'Reina', unidadHint: '3C', nif: 'A22723348', nombreInquilino: 'INNAMORATO, GIOVANNI', rentaMensual: 1900, notas: '3ºC' },
  { edificioHint: 'Reina', unidadHint: '3D', nif: '595184794819', nombreInquilino: 'CLERMONT EDOUARD HENRI C', rentaMensual: 1900, notas: '3ºD' },
  { edificioHint: 'Reina', unidadHint: '4A', nif: 'XDC322595', nombreInquilino: 'BATISTA HERNÁNDEZ, FRANCISCO JOSÉ', rentaMensual: 4000, notas: '4ºA' },
  { edificioHint: 'Reina', unidadHint: '4B', nif: 'G40795191', nombreInquilino: 'GOMEZ LEATAUD, VALENTINA', rentaMensual: 2500, notas: '4ºB' },
  { edificioHint: 'Reina', unidadHint: '4C', nif: 'B98691926', nombreInquilino: 'HULUMA CONSULTING SOCIEDAD LIMITADA', rentaMensual: 1850, notas: '4ºC' },

  // ========== MENÉNDEZ PELAYO 15 (Palencia) ==========
  { edificioHint: 'Pelayo', unidadHint: '4D', nif: '71298689T', nombreInquilino: 'BALLESTEROS GADEA, BEATRIZ', rentaMensual: 713.86, notas: '4ºD Palencia' },
  { edificioHint: 'Pelayo', unidadHint: 'Atico', nif: 'B34263582', nombreInquilino: 'ROAMS TIC, SL', rentaMensual: 675, notas: 'Ático Palencia' },
];

async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  IMPORTACIÓN CONTRATOS VIRODA');
  console.log('═══════════════════════════════════════════════════════════');

  // Buscar empresa Viroda
  const viroda = await prisma.company.findFirst({
    where: { nombre: { contains: 'Viroda', mode: 'insensitive' } },
  });
  if (!viroda) {
    console.error('❌ Empresa Viroda no encontrada');
    return;
  }
  console.log(`\n🏢 Viroda: ${viroda.id}`);

  // Cargar edificios y unidades de Viroda
  const buildings = await prisma.building.findMany({
    where: { companyId: viroda.id },
    include: { units: true },
  });
  console.log(`📋 Edificios: ${buildings.length}`);
  for (const b of buildings) {
    console.log(`   ${b.nombre} (${b.units.length} unidades)`);
  }

  let created = 0, updated = 0, skipped = 0, noUnit = 0, noTenant = 0;

  for (const c of CONTRATOS) {
    // 1. Buscar edificio
    const building = buildings.find(b => 
      b.nombre.toLowerCase().includes(c.edificioHint.toLowerCase()) ||
      b.direccion?.toLowerCase().includes(c.edificioHint.toLowerCase())
    );
    if (!building) {
      console.log(`  ⚠️ Edificio no encontrado: "${c.edificioHint}" para ${c.nombreInquilino}`);
      noUnit++;
      continue;
    }

    // 2. Buscar unidad
    const normalizeUnit = (s: string) => s.toLowerCase().replace(/[ºª\s]/g, '').replace('bajo', 'bj');
    const unitHintNorm = normalizeUnit(c.unidadHint);
    
    const unit = building.units.find(u => {
      const uNumNorm = normalizeUnit(u.numero);
      return uNumNorm === unitHintNorm || 
             uNumNorm.includes(unitHintNorm) || 
             unitHintNorm.includes(uNumNorm);
    });
    if (!unit) {
      console.log(`  ⚠️ Unidad "${c.unidadHint}" no encontrada en ${building.nombre} para ${c.nombreInquilino}`);
      noUnit++;
      continue;
    }

    // 3. Buscar o crear inquilino por NIF
    let tenant = await prisma.tenant.findFirst({
      where: { companyId: viroda.id, dni: c.nif },
    });

    if (!tenant) {
      // Buscar por nombre similar
      tenant = await prisma.tenant.findFirst({
        where: {
          companyId: viroda.id,
          nombreCompleto: { contains: c.nombreInquilino.split(',')[0].split(' ').slice(0, 2).join(' '), mode: 'insensitive' },
        },
      });
    }

    if (!tenant) {
      // Crear inquilino
      try {
        const emailPlaceholder = `${c.nif.toLowerCase().replace(/[^a-z0-9]/g, '')}@pendiente.inmova.app`;
        tenant = await prisma.tenant.create({
          data: {
            companyId: viroda.id,
            nombreCompleto: c.nombreInquilino,
            dni: c.nif,
            email: emailPlaceholder,
            telefono: 'Pendiente',
            fechaNacimiento: new Date(1990, 0, 1),
            notas: `Importado desde facturación Feb 2026`,
          },
        });
        console.log(`  ➕ Inquilino creado: ${c.nombreInquilino} (${c.nif})`);
      } catch (error: any) {
        if (error.code === 'P2002') {
          // DNI o email duplicado — buscar por nombre
          tenant = await prisma.tenant.findFirst({
            where: { companyId: viroda.id },
            orderBy: { createdAt: 'desc' },
          });
        }
        if (!tenant) {
          console.log(`  ❌ No se pudo crear inquilino: ${c.nombreInquilino} - ${error.message}`);
          noTenant++;
          continue;
        }
      }
    }

    // 4. Verificar si ya existe contrato activo para esta unidad
    const existingContract = await prisma.contract.findFirst({
      where: {
        unitId: unit.id,
        estado: 'activo',
      },
    });

    if (existingContract) {
      // Actualizar renta si ha cambiado
      if (Math.abs(Number(existingContract.rentaMensual) - c.rentaMensual) > 1) {
        await prisma.contract.update({
          where: { id: existingContract.id },
          data: { rentaMensual: c.rentaMensual },
        });
        console.log(`  🔄 Renta actualizada: ${building.nombre} ${unit.numero} → ${c.rentaMensual}€`);
        updated++;
      } else {
        skipped++;
      }
      continue;
    }

    // 5. Crear contrato
    const fechaInicio = c.fechaInicio ? new Date(c.fechaInicio) : new Date(2024, 0, 1);
    const fechaFin = c.fechaFin ? new Date(c.fechaFin) : new Date(fechaInicio.getFullYear() + 1, fechaInicio.getMonth(), fechaInicio.getDate());

    try {
      await prisma.contract.create({
        data: {
          tenantId: tenant.id,
          unitId: unit.id,
          fechaInicio,
          fechaFin,
          rentaMensual: c.rentaMensual,
          depositoGarantia: c.rentaMensual * 2,
          estado: 'activo',
          tipo: 'alquiler',
          notas: c.notas || null,
        },
      });
      
      // Marcar unidad como ocupada
      await prisma.unit.update({
        where: { id: unit.id },
        data: { estado: 'ocupada' },
      });

      console.log(`  ✅ Contrato: ${building.nombre} ${unit.numero} → ${c.nombreInquilino} (${c.rentaMensual}€/mes)`);
      created++;
    } catch (error: any) {
      console.log(`  ❌ Error creando contrato: ${error.message}`);
      skipped++;
    }
  }

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  RESUMEN');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`  ✅ Contratos creados: ${created}`);
  console.log(`  🔄 Rentas actualizadas: ${updated}`);
  console.log(`  ⏭️ Ya existían: ${skipped}`);
  console.log(`  ⚠️ Unidad no encontrada: ${noUnit}`);
  console.log(`  ⚠️ Inquilino no creado: ${noTenant}`);
  console.log(`  📊 Total procesados: ${CONTRATOS.length}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
