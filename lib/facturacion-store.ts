/**
 * Store en memoria para facturas (compartido entre API routes)
 */

export interface LineaFactura {
  concepto: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface Factura {
  id: string;
  companyId: string;
  serieId: string;
  serie: string;
  numeroFactura: string;
  fechaEmision: string;
  fechaVencimiento: string;
  cliente: { nombre: string; nif?: string; direccion?: string };
  concepto: string;
  lineas: LineaFactura[];
  baseImponible: number;
  ivaPorcentaje: number;
  ivaImporte: number;
  retencionPorcentaje: number;
  retencionImporte: number;
  total: number;
  estado: 'emitida' | 'pagada' | 'vencida' | 'anulada';
  notas?: string;
  esProforma: boolean;
  facturaOriginalId?: string;
  createdAt: string;
}

export const facturasStore = new Map<string, Factura>();
