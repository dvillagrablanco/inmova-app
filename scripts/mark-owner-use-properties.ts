/**
 * Script: Marcar unidades de uso propio de los socios
 *
 * Estas unidades NO se alquilan (renta=0, estado=ocupada por los socios).
 * Se identifican por: estado='ocupada' + rentaMensual=0
 *
 * Deben excluirse de:
 * - Cálculos de rentabilidad y €/m²
 * - Alertas de "unidad infravalorada"
 * - Optimización de rentas IA
 * - KPIs de ocupación comercial (se cuentan como ocupadas pero sin renta)
 *
 * Unidades de uso propio:
 * 1. Todas las unidades de "El Tomillar de Nagüelles", Marbella → ROVIDA S.L.
 * 2. Todas las unidades de "Camilo José Cela", Marbella → VIRODA INVERSIONES S.L.U.
 * 3. Unidad 1D de "Menéndez Pelayo", Palencia → VIRODA INVERSIONES S.L.U.
 */

import 'dotenv/config';

async function main() {
  const { PrismaClient } = await import('@prisma/client');
  const prisma = new PrismaClient();

  console.log('=== MARCAR UNIDADES DE USO PROPIO DE SOCIOS ===\n');

  let totalUpdated = 0;

  // 1. El Tomillar de Nagüelles (Rovida) — todas las unidades
  console.log('1. El Tomillar de Nagüelles, Marbella (Rovida)');
  const tomillarBuildings = await prisma.building.findMany({
    where: { nombre: { contains: 'Tomillar', mode: 'insensitive' } },
    include: {
      units: { select: { id: true, numero: true, estado: true, rentaMensual: true } },
      company: { select: { nombre: true } },
    },
  });

  for (const b of tomillarBuildings) {
    console.log(`   Edificio: ${b.nombre} (${b.company?.nombre}) — ${b.units.length} unidades`);
    for (const u of b.units) {
      await prisma.unit.update({
        where: { id: u.id },
        data: { estado: 'ocupada', rentaMensual: 0 },
      });
      console.log(`   ✓ ${u.numero}: estado=ocupada, renta=0 (uso propio socios)`);
      totalUpdated++;
    }
  }

  // 2. Camilo José Cela (Viroda) — todas las unidades
  console.log('\n2. Camilo José Cela, Marbella (Viroda)');
  const celaBuildings = await prisma.building.findMany({
    where: {
      OR: [
        { nombre: { contains: 'Camilo', mode: 'insensitive' } },
        { nombre: { contains: 'Cela', mode: 'insensitive' } },
      ],
    },
    include: {
      units: { select: { id: true, numero: true, estado: true, rentaMensual: true } },
      company: { select: { nombre: true } },
    },
  });

  for (const b of celaBuildings) {
    console.log(`   Edificio: ${b.nombre} (${b.company?.nombre}) — ${b.units.length} unidades`);
    for (const u of b.units) {
      await prisma.unit.update({
        where: { id: u.id },
        data: { estado: 'ocupada', rentaMensual: 0 },
      });
      console.log(`   ✓ ${u.numero}: estado=ocupada, renta=0 (uso propio socios)`);
      totalUpdated++;
    }
  }

  // 3. Menéndez Pelayo 1D (Viroda) — solo la unidad 1D
  console.log('\n3. Menéndez Pelayo 1D, Palencia (Viroda)');
  const pelayoBuildings = await prisma.building.findMany({
    where: {
      nombre: { contains: 'Pelayo', mode: 'insensitive' },
      company: { nombre: { contains: 'Viroda', mode: 'insensitive' } },
    },
    include: {
      units: { select: { id: true, numero: true, estado: true, rentaMensual: true } },
      company: { select: { nombre: true } },
    },
  });

  for (const b of pelayoBuildings) {
    console.log(`   Edificio: ${b.nombre} (${b.company?.nombre}) — ${b.units.length} unidades`);
    // Buscar la unidad 1D
    const unit1D = b.units.find(
      (u) =>
        u.numero === '1D' ||
        u.numero === '1º D' ||
        u.numero === '1ºD' ||
        u.numero.toLowerCase() === '1d' ||
        u.numero === '1º Dcha'
    );

    if (unit1D) {
      await prisma.unit.update({
        where: { id: unit1D.id },
        data: { estado: 'ocupada', rentaMensual: 0 },
      });
      console.log(`   ✓ ${unit1D.numero}: estado=ocupada, renta=0 (uso propio socios)`);
      totalUpdated++;
    } else {
      console.log(`   ⚠ No se encontró unidad 1D. Unidades existentes: ${b.units.map((u) => u.numero).join(', ')}`);
      console.log('   → Revisa manualmente cuál es la unidad correcta');
    }
  }

  console.log(`\n✅ ${totalUpdated} unidades marcadas como uso propio (renta=0, estado=ocupada)`);
  console.log('\nCriterio de exclusión en APIs: estado=ocupada AND rentaMensual=0');

  await prisma.$disconnect();
}

main().catch(console.error);
