// INMOSEARCH — Carga de datos de ejemplo
import { mockConnector } from "@/lib/connectors/mock";
import { normalizeToInput } from "@/lib/connectors/types";
import { createOpportunity } from "@/lib/opportunity";
import { prisma } from "@/lib/db";

async function main() {
  const listings = await mockConnector.search({ maxResults: 50 });
  // Evita duplicados al re-ejecutar el seed.
  await prisma.opportunity.deleteMany({ where: { source: "MOCK" } });
  for (const l of listings) {
    const dto = await createOpportunity(normalizeToInput(l, "mock"));
    console.log(`  · ${dto.title} → score ${dto.score} (${dto.rating})`);
  }
  console.log(`\nSeed completado: ${listings.length} oportunidades creadas y analizadas.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
