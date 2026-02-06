import { prisma } from '@/lib/db';

async function main() {
  const companyId = process.env.COMPANY_ID || process.argv[2];
  const shouldFix = process.argv.includes('--fix');

  if (!companyId) {
    console.error('Uso: COMPANY_ID=... npx tsx scripts/verify-insurance-links.ts [--fix]');
    process.exit(1);
  }

  const [buildings, units, insurances] = await Promise.all([
    prisma.building.findMany({
      where: { companyId },
      select: { id: true, nombre: true },
    }),
    prisma.unit.findMany({
      where: { building: { companyId } },
      select: { id: true, numero: true, buildingId: true },
    }),
    prisma.insurance.findMany({
      where: { companyId },
      select: { id: true, numeroPoliza: true, buildingId: true, unitId: true },
    }),
  ]);

  const buildingSet = new Set(buildings.map((b) => b.id));
  const unitMap = new Map(units.map((u) => [u.id, u]));

  let missingLinks = 0;
  let invalidBuilding = 0;
  let invalidUnit = 0;
  let fixedBuilding = 0;
  let mismatchedBuilding = 0;

  for (const insurance of insurances) {
    const hasBuilding = !!insurance.buildingId;
    const hasUnit = !!insurance.unitId;

    if (!hasBuilding && !hasUnit) {
      missingLinks++;
    }

    if (insurance.buildingId && !buildingSet.has(insurance.buildingId)) {
      invalidBuilding++;
    }

    if (insurance.unitId && !unitMap.has(insurance.unitId)) {
      invalidUnit++;
    }

    if (insurance.unitId && unitMap.has(insurance.unitId)) {
      const unit = unitMap.get(insurance.unitId)!;
      if (!insurance.buildingId && shouldFix) {
        await prisma.insurance.update({
          where: { id: insurance.id },
          data: { buildingId: unit.buildingId },
        });
        fixedBuilding++;
      } else if (insurance.buildingId && insurance.buildingId !== unit.buildingId) {
        mismatchedBuilding++;
      }
    }
  }

  console.log('Verificación de vinculaciones de seguros');
  console.log('Company ID:', companyId);
  console.log('Total pólizas:', insurances.length);
  console.log('Sin edificio ni unidad:', missingLinks);
  console.log('Edificio inválido:', invalidBuilding);
  console.log('Unidad inválida:', invalidUnit);
  console.log('Edificio/Unidad desalineados:', mismatchedBuilding);
  if (shouldFix) {
    console.log('Edificios reparados desde unidad:', fixedBuilding);
  }
}

main()
  .catch((error) => {
    console.error('Error verificando seguros:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
