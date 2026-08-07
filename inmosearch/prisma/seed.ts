// INMOSEARCH — Preparación de la base de datos (SIN datos inventados)
//
// La app funciona SOLO con activos reales detectados por el software
// (Idealista API, subastas BOE, banca/REO, alertas por email, bookmarklet).
// Este script NO crea oportunidades ficticias. Se limita a dejar creado un
// perfil de búsqueda (buy-box) real y editable para que puedas empezar a
// barrer en cuanto configures una fuente. Ejecuta `npm run db:seed`.
import { createProfile, listProfiles } from "@/lib/profiles";
import { prisma } from "@/lib/db";

async function main() {
  // Limpia cualquier resto de datos de demostración de versiones anteriores.
  const demo = await prisma.opportunity.deleteMany({ where: { source: "MOCK" } });
  await prisma.searchProfile.deleteMany({ where: { name: { startsWith: "[Ejemplo]" } } });
  if (demo.count > 0) console.log(`Eliminadas ${demo.count} oportunidades de demostración antiguas.`);

  const existing = await listProfiles();
  if (existing.length === 0) {
    const profile = await createProfile({
      name: "Inversión sólida (flip o alquiler)",
      zones: [],
      sources: ["idealista", "boe"],
      propertyTypes: ["PISO", "CASA", "ATICO"],
      maxPrice: 200000,
      minNetYield: 6,
      minFlipMargin: 12,
      minDiscountToMarket: 8,
      schedule: "weekly",
    });
    console.log(`Perfil de búsqueda creado: "${profile.name}" (barrido ${profile.schedule}).`);
  } else {
    console.log(`Ya existen ${existing.length} perfiles; no se crea ninguno nuevo.`);
  }

  console.log("\nBase de datos lista. No hay oportunidades inventadas: se llenará con activos reales.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
