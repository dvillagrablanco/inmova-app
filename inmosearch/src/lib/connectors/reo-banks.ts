// INMOSEARCH — Conector de portales de banca / REO (activos adjudicados)
//
// Los grandes tenedores publican su cartera de inmuebles en portales propios:
//   - Haya Real Estate / anticipa
//   - Aliseda (Santander)
//   - Servihabitat (CaixaBank)
//   - Solvia / Intrum
//   - Diglo (antes Hipoges)
//   - Subastas judiciales / notariales (Portal de Subastas del BOE)
//
// Ninguno ofrece hoy una API pública abierta homogénea. La vía legal y estable
// es: acuerdos de partner/feed, exportaciones CSV que ellos facilitan, o alta
// manual. Este conector queda como STUB documentado: define el punto de
// extensión y, cuando dispongas de un feed autorizado, se implementa aquí el
// parser correspondiente (ver `importFromFeed`).
import type { ConnectorSearchParams, PortalConnector, RawListing } from "./types";

export const reoBanksConnector: PortalConnector = {
  id: "reo-banks",
  name: "Banca / REO (adjudicados)",
  isConfigured: () => false,
  status: () =>
    "Stub documentado — requiere un feed/partner autorizado (Haya, Aliseda, Servihabitat, Solvia, BOE...). " +
    "Usa importación CSV/manual mientras tanto. No se hace scraping.",
  async search(_params: ConnectorSearchParams): Promise<RawListing[]> {
    throw new Error(
      "Conector REO/banca no configurado. Integra aquí un feed autorizado o usa importación CSV."
    );
  },
};

/** Punto de extensión: parsea un feed autorizado (CSV/JSON) de un tenedor de
 * activos a RawListing. Implementar según el formato del proveedor concreto. */
export function importFromFeed(_rows: unknown[]): RawListing[] {
  throw new Error("importFromFeed: implementa el parser del feed de tu proveedor REO.");
}
