// INMOSEARCH — Conector MOCK (datos de ejemplo para demo y tests)
// Simula una fuente de oportunidades con anuncios realistas del mercado español.
import type { ConnectorSearchParams, PortalConnector, RawListing } from "./types";

const SAMPLE: RawListing[] = [
  {
    sourceRef: "MOCK-0001",
    sourceUrl: "https://example.com/mock/0001",
    title: "Piso a reformar junto a metro, 3 hab.",
    price: 118000,
    address: "Calle Bravo Murillo",
    city: "Madrid",
    province: "Madrid",
    ccaa: "MADRID",
    postalCode: "28020",
    propertyType: "PISO",
    builtArea: 78,
    rooms: 3,
    baths: 1,
    yearBuilt: 1968,
    condition: "A_REFORMAR",
    description: "Piso muy luminoso para actualizar por completo. Zona con alta demanda de alquiler. Instalaciones antiguas.",
    images: [],
    arvPricePerSqm: 3200,
    marketRentMonthly: 1250,
  },
  {
    sourceRef: "MOCK-0002",
    sourceUrl: "https://example.com/mock/0002",
    title: "Vivienda de banco, buen estado, con ascensor",
    price: 96000,
    address: "Avenida de la Constitución",
    city: "Valencia",
    province: "Valencia",
    ccaa: "COMUNIDAD_VALENCIANA",
    postalCode: "46019",
    propertyType: "PISO",
    builtArea: 85,
    rooms: 3,
    baths: 2,
    yearBuilt: 1995,
    condition: "REFORMA_PARCIAL",
    description: "Adjudicado bancario. Necesita actualización de cocina y baños. Comunidad al día.",
    images: [],
    arvPricePerSqm: 1850,
    marketRentMonthly: 850,
  },
  {
    sourceRef: "MOCK-0003",
    sourceUrl: "https://example.com/mock/0003",
    title: "Ático reformado con terraza",
    price: 189000,
    address: "Rúa do Príncipe",
    city: "Vigo",
    province: "Pontevedra",
    ccaa: "GALICIA",
    postalCode: "36202",
    propertyType: "ATICO",
    builtArea: 92,
    rooms: 2,
    baths: 2,
    yearBuilt: 2008,
    condition: "REFORMADO",
    description: "Listo para entrar a vivir. Poco recorrido para flip pero buen producto de alquiler.",
    images: [],
    arvPricePerSqm: 2300,
    marketRentMonthly: 900,
  },
  {
    sourceRef: "MOCK-0004",
    sourceUrl: "https://example.com/mock/0004",
    title: "Casa para reforma integral en casco histórico",
    price: 72000,
    address: "Calle Mayor",
    city: "Cuenca",
    province: "Cuenca",
    ccaa: "CASTILLA_LA_MANCHA",
    postalCode: "16001",
    propertyType: "CASA",
    builtArea: 130,
    rooms: 4,
    baths: 1,
    yearBuilt: 1940,
    condition: "A_REFORMAR",
    description: "Gran potencial. Requiere reforma integral incluyendo instalaciones y cubierta.",
    images: [],
    arvPricePerSqm: 1400,
    marketRentMonthly: 620,
  },
  {
    sourceRef: "MOCK-0005",
    sourceUrl: "https://example.com/mock/0005",
    title: "Estudio céntrico ideal alquiler turístico/larga estancia",
    price: 84000,
    address: "Carrer de Sants",
    city: "Barcelona",
    province: "Barcelona",
    ccaa: "CATALUNA",
    postalCode: "08014",
    propertyType: "ESTUDIO",
    builtArea: 40,
    rooms: 1,
    baths: 1,
    yearBuilt: 1975,
    condition: "BUEN_ESTADO",
    description: "Pequeño pero muy bien ubicado. Solo lavado de cara.",
    images: [],
    arvPricePerSqm: 3600,
    marketRentMonthly: 780,
  },
];

export const mockConnector: PortalConnector = {
  id: "mock",
  name: "Fuente de demostración (mock)",
  isConfigured: () => true,
  status: () => "Operativo — datos de ejemplo para demo y tests.",
  async search(params: ConnectorSearchParams): Promise<RawListing[]> {
    let results = [...SAMPLE];
    if (params.minPrice) results = results.filter((r) => r.price >= params.minPrice!);
    if (params.maxPrice) results = results.filter((r) => r.price <= params.maxPrice!);
    if (params.propertyType) results = results.filter((r) => r.propertyType === params.propertyType);
    if (params.location) {
      const q = params.location.toLowerCase();
      results = results.filter(
        (r) => r.city?.toLowerCase().includes(q) || r.province?.toLowerCase().includes(q)
      );
    }
    if (params.maxResults) results = results.slice(0, params.maxResults);
    return results;
  },
};
