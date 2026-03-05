const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();

async function main() {
  // Counts
  const counts = {
    tenants: await p.tenant.count(),
    contracts: await p.contract.count(),
    buildings: await p.building.count(),
    units: await p.unit.count(),
    fianzas: await p.fianzaDeposit.count(),
    insurances: await p.insurance.count(),
    payments: await p.payment.count(),
  };
  console.log("COUNTS:", JSON.stringify(counts));

  // Placeholder tenants
  const placeholders = await p.tenant.findMany({
    where: { OR: [{ email: { contains: 'local' } }, { telefono: '000000000' }] },
    select: { id: true, nombre: true, email: true, telefono: true },
    take: 10,
  });
  console.log("\nPLACEHOLDER TENANTS:", placeholders.length);
  placeholders.forEach(t => console.log(`  ${t.nombre} | ${t.email} | ${t.telefono}`));

  // Buildings without valorMercado
  const noValor = await p.building.findMany({
    where: { OR: [{ valorMercado: null }, { valorMercado: 0 }] },
    select: { id: true, nombre: true, direccion: true },
    take: 10,
  });
  console.log("\nBUILDINGS SIN VALOR:", noValor.length);
  noValor.forEach(b => console.log(`  ${b.nombre || b.direccion}`));

  // Active contracts count
  const activeContracts = await p.contract.count({ where: { estado: 'activo' } });
  console.log("\nACTIVE CONTRACTS:", activeContracts);

  // Stripe webhook check
  console.log("\nSTRIPE_WEBHOOK_SECRET:", process.env.STRIPE_WEBHOOK_SECRET ? "SET" : "NOT SET");
  console.log("SMTP_HOST:", process.env.SMTP_HOST || "NOT SET");

  await p.$disconnect();
}
main().catch(e => { console.error("ERR:", e.message); process.exit(1); });
