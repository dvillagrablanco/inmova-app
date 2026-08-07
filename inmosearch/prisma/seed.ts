// INMOSEARCH — Carga de datos de ejemplo
import { mockConnector } from "@/lib/connectors/mock";
import { normalizeToInput } from "@/lib/connectors/types";
import { createOpportunity } from "@/lib/opportunity";
import { createProfile } from "@/lib/profiles";
import { prisma } from "@/lib/db";

async function main() {
  const listings = await mockConnector.search({ maxResults: 50 });
  // Evita duplicados al re-ejecutar el seed.
  await prisma.opportunity.deleteMany({ where: { source: "MOCK" } });
  for (const l of listings) {
    const dto = await createOpportunity(normalizeToInput(l, "mock"));
    console.log(`  · ${dto.title} → score ${dto.score} (${dto.rating})`);
  }
  console.log(`\nSeed: ${listings.length} oportunidades creadas y analizadas.`);

  // Perfil de búsqueda de ejemplo (buy-box) para la página de Perfiles.
  await prisma.searchProfile.deleteMany({ where: { name: { startsWith: "[Ejemplo]" } } });
  const profile = await createProfile({
    name: "[Ejemplo] Inversión sólida (flip o alquiler)",
    zones: [],
    sources: ["boe", "mock"],
    propertyTypes: ["PISO", "CASA", "ATICO"],
    maxPrice: 200000,
    minNetYield: 6,
    minFlipMargin: 12,
    minDiscountToMarket: 8,
    schedule: "weekly",
  });
  console.log(`\nPerfil de ejemplo creado: "${profile.name}" (barrido ${profile.schedule}).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
