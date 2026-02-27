/**
 * Script: Marcar propiedades de uso propio de los socios
 *
 * Estas propiedades NO se alquilan (renta=0, estado=ocupada por los socios).
 * Deben excluirse de:
 * - Cálculos de rentabilidad y €/m²
 * - Alertas de "unidad sin contrato"
 * - Optimización de rentas IA
 * - KPIs de ocupación comercial
 *
 * Propiedades:
 * 1. El Tomillar de Nagüelles, Marbella → ROVIDA S.L.
 * 2. Camilo José Cela, Marbella → VIRODA INVERSIONES S.L.U.
 * 3. Menéndez Pelayo 1D, Palencia → VIRODA INVERSIONES S.L.U.
 */

import 'dotenv/config';

async function main() {
  const { PrismaClient } = await import('@prisma/client');
  const prisma = new PrismaClient();

  console.log('=== MARCAR PROPIEDADES DE USO PROPIO ===\n');

  // Patrones de búsqueda para cada propiedad
  const ownerUseProperties = [
    {
      buildingPattern: 'Tomillar',
      company: 'Rovida',
      description: 'Casa El Tomillar de Nagüelles, Marbella',
    },
    {
      buildingPattern: 'Camilo',
      company: 'Viroda',
      description: 'Camilo José Cela, Marbella',
    },
    {
      buildingPattern: 'Cela',
      company: 'Viroda',
      description: 'Camilo José Cela, Marbella (alt)',
    },
  ];

  let totalUpdated = 0;

  for (const prop of ownerUseProperties) {
    const buildings = await prisma.building.findMany({
      where: {
        nombre: { contains: prop.buildingPattern, mode: 'insensitive' },
      },
      include: {
        units: { select: { id: true, numero: true, estado: true, rentaMensual: true } },
        company: { select: { nombre: true } },
      },
    });

    for (const building of buildings) {
      console.log(`📍 ${building.nombre} (${building.company?.nombre})`);
      console.log(`   Dirección: ${building.direccion}`);
      console.log(`   Unidades: ${building.units.length}`);

      // Marcar el edificio con etiqueta de uso propio
      await prisma.building.update({
        where: { id: building.id },
        data: {
          etiquetas: ['uso_propio_socios'],
        },
      });

      // Marcar todas las unidades como ocupada con renta 0
      for (const unit of building.units) {
        await prisma.unit.update({
          where: { id: unit.id },
          data: {
            estado: 'ocupada',
            rentaMensual: 0,
          },
        });
        console.log(`   ✓ Unidad ${unit.numero}: renta=0, estado=ocupada`);
        totalUpdated++;
      }
      console.log(`   ✓ Edificio marcado con etiqueta uso_propio_socios`);
    }
  }

  // Menéndez Pelayo 1D específicamente (es una vivienda concreta, no todo el edificio)
  console.log('\n📍 Menéndez Pelayo 1D, Palencia (Viroda)');
  const pelayoBuildings = await prisma.building.findMany({
    where: {
      nombre: { contains: 'Pelayo', mode: 'insensitive' },
      company: { nombre: { contains: 'Viroda', mode: 'insensitive' } },
    },
    include: {
      units: { select: { id: true, numero: true } },
    },
  });

  for (const building of pelayoBuildings) {
    // Buscar la unidad 1D específicamente
    const unit1D = building.units.find(
      (u) => u.numero === '1D' || u.numero === '1º D' || u.numero === '1ºD' || u.numero.toLowerCase().includes('1d')
    );

    if (unit1D) {
      await prisma.unit.update({
        where: { id: unit1D.id },
        data: {
          estado: 'ocupada',
          rentaMensual: 0,
        },
      });
      console.log(`   ✓ Unidad ${unit1D.numero} en ${building.nombre}: marcada como uso propio`);
      totalUpdated++;
    } else {
      console.log(`   ⚠ No encontrada unidad 1D en ${building.nombre}. Unidades: ${building.units.map((u) => u.numero).join(', ')}`);
    }
  }

  console.log(`\n✅ ${totalUpdated} unidades marcadas como uso propio de socios`);
  console.log('\nEstas unidades se excluirán de:');
  console.log('  - Cálculos de rentabilidad y €/m²');
  console.log('  - Alertas de "unidad sin contrato"');
  console.log('  - Optimización de rentas IA');
  console.log('  - KPIs de ocupación comercial');

  await prisma.$disconnect();
}

main().catch(console.error);
