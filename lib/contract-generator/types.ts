/**
 * Tipos para generación de contratos
 */

export interface PersonData {
  /** Nombre completo */
  name: string;
  /** DNI/NIE/CIF */
  documentId: string;
  /** Tipo de documento */
  documentType: 'DNI' | 'NIE' | 'CIF' | 'PASSPORT';
  /** Dirección */
  address: string;
  /** Ciudad */
  city: string;
  /** Código postal */
  postalCode: string;
  /** Email */
  email: string;
  /** Teléfono */
  phone: string;
}

export interface PropertyData {
  /** Dirección completa */
  address: string;
  /** Ciudad */
  city: string;
  /** Código postal */
  postalCode: string;
  /** Provincia */
  province: string;
  /** Referencia catastral */
  cadastralReference?: string;
  /** Superficie en m² */
  area: number;
  /** Número de habitaciones */
  bedrooms: number;
  /** Número de baños */
  bathrooms: number;
  /** Planta */
  floor?: string;
  /** Puerta */
  door?: string;
  /** Tiene garaje */
  hasGarage?: boolean;
  /** Tiene trastero */
  hasStorage?: boolean;
  /** Amueblado */
  furnished: boolean;
  /** Certificado energético */
  energyCertificate?: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G';
  /** Cédula de habitabilidad */
  habitabilityCertificate?: boolean;
}

export interface ContractTerms {
  /** Tipo de contrato */
  type: 'HABITUAL' | 'TEMPORADA' | 'HABITACION' | 'LOCAL';
  /** Fecha de inicio */
  startDate: Date;
  /** Duración en meses */
  durationMonths: number;
  /** Renta mensual */
  monthlyRent: number;
  /** Fianza (número de meses) */
  depositMonths: number;
  /** Garantía adicional (€) */
  additionalGuarantee?: number;
  /** Día de pago */
  paymentDay: number;
  /** Método de pago */
  paymentMethod: 'TRANSFER' | 'DOMICILIATION' | 'CASH';
  /** IBAN (si transferencia) */
  iban?: string;
  /** Gastos incluidos */
  includedExpenses: {
    water: boolean;
    electricity: boolean;
    gas: boolean;
    internet: boolean;
    community: boolean;
  };
  /** Índice de actualización */
  updateIndex: 'IPC' | 'IGC' | 'IRAV';
  /** Permite mascotas */
  petsAllowed: boolean;
  /** Permite subarrendamiento */
  sublettingAllowed: boolean;
  /** Cláusulas adicionales */
  additionalClauses?: string[];
}

export interface ContractData {
  landlord: PersonData;
  tenant: PersonData;
  property: PropertyData;
  terms: ContractTerms;
  /** Inventario (lista de muebles/enseres) */
  inventory?: InventoryItem[];
  /** Firma digital */
  digitalSignature?: boolean;
}

export interface InventoryItem {
  item: string;
  quantity: number;
  condition: 'NUEVO' | 'BUENO' | 'REGULAR' | 'MALO';
  notes?: string;
}

export interface GeneratedContract {
  /** ID único del contrato */
  id: string;
  /** Contenido HTML */
  html: string;
  /** Contenido para PDF */
  pdfContent: string;
  /** Datos del contrato */
  data: ContractData;
  /** Fecha de generación */
  generatedAt: Date;
  /** Hash para verificación */
  hash: string;
}
