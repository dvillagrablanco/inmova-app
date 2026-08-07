// INMOSEARCH — Registro de conectores y búsqueda agregada
import type { ConnectorSearchParams, PortalConnector, RawListing } from "./types";
import { idealistaConnector } from "./idealista";
import { reoBanksConnector } from "./reo-banks";
import { boeConnector } from "./boe";
import { httpSourceConnector } from "./http-source";

export type { PortalConnector, RawListing, ConnectorSearchParams } from "./types";
export { normalizeToInput } from "./types";

// Solo fuentes REALES. No hay conector de demostración: la app se llena
// únicamente con activos reales detectados por estas fuentes.
export const CONNECTORS: PortalConnector[] = [
  idealistaConnector,
  boeConnector,
  reoBanksConnector,
  httpSourceConnector,
];

export function getConnector(id: string): PortalConnector | undefined {
  return CONNECTORS.find((c) => c.id === id);
}

export function connectorStatuses() {
  return CONNECTORS.map((c) => ({
    id: c.id,
    name: c.name,
    configured: c.isConfigured(),
    status: c.status(),
  }));
}

export interface AggregatedResult {
  connectorId: string;
  connectorName: string;
  listings: RawListing[];
  error?: string;
}

/** Busca en varios conectores. Por defecto, solo en los configurados; puedes
 * forzar ids concretos. Los errores por conector se capturan y devuelven. */
export async function searchConnectors(
  params: ConnectorSearchParams,
  connectorIds?: string[]
): Promise<AggregatedResult[]> {
  const targets = connectorIds
    ? CONNECTORS.filter((c) => connectorIds.includes(c.id))
    : CONNECTORS.filter((c) => c.isConfigured());

  return Promise.all(
    targets.map(async (c) => {
      try {
        const listings = await c.search(params);
        return { connectorId: c.id, connectorName: c.name, listings };
      } catch (err) {
        return {
          connectorId: c.id,
          connectorName: c.name,
          listings: [],
          error: err instanceof Error ? err.message : String(err),
        };
      }
    })
  );
}
