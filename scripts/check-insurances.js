const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();

async function main() {
  // All companies in the group
  const companies = await p.company.findMany({
    where: { OR: [
      { nombre: { contains: 'Vidaro' } },
      { nombre: { contains: 'Viroda' } },
      { nombre: { contains: 'Rovida' } },
      { nombre: { contains: 'Facundo' } },
    ]},
    select: { id: true, nombre: true }
  });
  console.log("Group companies:", companies.length);
  companies.forEach(c => console.log(`  ${c.id} | ${c.nombre}`));

  const companyIds = companies.map(c => c.id);

  // Buildings
  const buildings = await p.building.findMany({
    where: { companyId: { in: companyIds } },
    select: { id: true, nombre: true, direccion: true, companyId: true },
    orderBy: { nombre: 'asc' }
  });
  console.log("\nBuildings:", buildings.length);
  buildings.forEach(b => {
    const co = companies.find(c => c.id === b.companyId);
    console.log(`  ${b.id.substring(0,12)} | ${b.nombre || b.direccion} | ${co?.nombre || '?'}`);
  });

  // Existing insurances for these buildings
  const buildingIds = buildings.map(b => b.id);
  const existing = await p.insurance.findMany({
    where: { buildingId: { in: buildingIds } },
    select: { id: true, numeroPoliza: true, aseguradora: true, tipo: true, buildingId: true, urlDocumento: true },
  });
  console.log("\nExisting insurances for group:", existing.length);
  existing.forEach(i => {
    const bld = buildings.find(b => b.id === i.buildingId);
    console.log(`  ${i.numeroPoliza} | ${i.aseguradora} | ${i.tipo} | ${bld?.nombre || bld?.direccion || '?'} | doc:${i.urlDocumento ? 'YES' : 'NO'}`);
  });

  await p.$disconnect();
}
main().catch(e => { console.error(e.message); process.exit(1); });
