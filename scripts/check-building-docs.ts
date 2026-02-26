import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();

async function main() {
  const targetId = 'cmknwrf4q0007nozl8a628zt1';
  
  const b = await p.building.findUnique({ 
    where: { id: targetId }, 
    select: { id: true, nombre: true, companyId: true } 
  });
  console.log('Target building:', JSON.stringify(b));
  
  const docs = await p.document.findMany({ 
    where: { buildingId: targetId }, 
    select: { id: true, nombre: true, tipo: true } 
  });
  console.log('Docs for target:', docs.length);
  docs.forEach(d => console.log('  -', d.tipo, '|', d.nombre));
  
  const companies = ['cef19f55f7b6ce0637d5ffb53', 'cmkctneuh0001nokn7nvhuweq'];
  const blds = await p.building.findMany({
    where: { companyId: { in: companies }, isDemo: false },
    select: { id: true, nombre: true, companyId: true },
    orderBy: { nombre: 'asc' }
  });
  
  console.log('\nAll Rovida/Viroda buildings:');
  for (const bl of blds) {
    const cnt = await p.document.count({ where: { buildingId: bl.id } });
    const co = bl.companyId === 'cef19f55f7b6ce0637d5ffb53' ? 'ROV' : 'VIR';
    console.log(`  ${co} | ${bl.nombre.padEnd(30)} | docs=${cnt} | ${bl.id}`);
  }
  
  const segs = await p.document.findMany({ 
    where: { tipo: 'seguro' }, 
    select: { id: true, nombre: true, buildingId: true } 
  });
  console.log('\nAll seguro docs:', segs.length);
  segs.forEach(d => console.log('  ', (d.buildingId || 'NULL').substring(0, 15), '|', d.nombre));
  
  const escs = await p.document.findMany({ 
    where: { nombre: { contains: 'Escritura' } }, 
    select: { id: true, nombre: true, buildingId: true } 
  });
  console.log('\nAll escritura docs:', escs.length);
  escs.forEach(d => console.log('  ', (d.buildingId || 'NULL').substring(0, 15), '|', d.nombre));
  
  await p.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
