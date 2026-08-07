// INMOSEARCH — Verificación de fuentes en producción
// Comprueba, contra los servicios reales, que los conectores/enriquecimientos
// funcionan y que sus formatos no han cambiado. Ejecútalo desde un entorno con
// SALIDA DE RED DIRECTA (no detrás de un proxy que altere las respuestas):
//   npm run verify:sources
// Uso opcional: pasar una localidad -> `tsx scripts/verify-sources.ts Valencia`
import { boeConnector } from "@/lib/connectors/boe";
import { enrichFromCatastro, catastroEnabled } from "@/lib/enrichment/catastro";

const location = process.argv[2] || "Madrid";

async function checkBoe() {
  console.log(`\n▶ BOE Subastas — búsqueda en "${location}"`);
  if (!boeConnector.isConfigured()) {
    console.log("  ⚠ Desactivado (BOE_ENABLED=false).");
    return;
  }
  try {
    const res = await boeConnector.search({ location, maxResults: 5 });
    console.log(`  ✓ Respuesta recibida. Anuncios parseados: ${res.length}`);
    if (res.length > 0) {
      const s = res[0];
      console.log(`    Ejemplo: ${s.sourceRef} · ${s.title} · ${s.price} € · ${s.sourceUrl}`);
    } else {
      console.log("  ⚠ 0 anuncios: revisa el formato del portal (selectores en src/lib/connectors/boe.ts).");
    }
  } catch (e) {
    console.log(`  ✗ Error: ${e instanceof Error ? e.message : e}`);
  }
}

async function checkCatastro() {
  console.log(`\n▶ Catastro — enriquecimiento`);
  if (!catastroEnabled()) {
    console.log("  ⚠ Desactivado (define CATASTRO_ENABLED=true para probarlo).");
    return;
  }
  try {
    const data = await enrichFromCatastro({ province: "Madrid", city: "Madrid", address: "Calle Gran Vía 1" });
    if (data) {
      console.log(`  ✓ Datos: ${data.builtArea ?? "?"} m² · año ${data.yearBuilt ?? "?"} · uso ${data.use ?? "?"}`);
    } else {
      console.log("  ⚠ Sin coincidencia. Revisa el emparejamiento por dirección (src/lib/enrichment/catastro.ts).");
    }
  } catch (e) {
    console.log(`  ✗ Error: ${e instanceof Error ? e.message : e}`);
  }
}

async function main() {
  console.log("INMOSEARCH · Verificación de fuentes");
  await checkBoe();
  await checkCatastro();
  console.log("\nHecho. Si algo falla o devuelve 0, ajusta el parser correspondiente y vuelve a ejecutar.\n");
}

main();
