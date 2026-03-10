/**
 * Store en memoria para facturación estilo Homming
 * Compartido entre /api/facturacion y /api/facturacion/[id]
 */

export interface FacturaDestinatario {
  nombre: string;
  nif?: string;
}

export interface FacturaItem {
  id: string;
  numeroFactura: string;
  serie: string;
  fecha: string;
  fechaContable: string;
  concepto: string;
  baseImponible: number;
  iva: number;
  irpf: number;
  totalImpuestos: number;
  total: number;
  estado: 'borrador' | 'emitida' | 'pagada' | 'anulada' | 'rectificada';
  tipo: 'factura' | 'proforma' | 'rectificativa';
  destinatario: FacturaDestinatario;
  inmueble?: string;
  notas?: string;
  companyId: string;
  createdAt: string;
}

export const facturasHommingStore = new Map<string, FacturaItem>();

/** Seed con 8 facturas de ejemplo para una empresa */
export function seedFacturasHomming(companyId: string) {
  const existingForCompany = Array.from(facturasHommingStore.values()).some((f) => f.companyId === companyId);
  if (existingForCompany) return;

  const samples: Omit<FacturaItem, 'companyId' | 'createdAt'>[] = [
    {
      id: 'fact-1',
      numeroFactura: 'F-00001',
      serie: 'F-00001',
      fecha: '2025-03-01',
      fechaContable: '2025-03-01',
      concepto: 'Alquiler mensual marzo 2025',
      baseImponible: 826.45,
      iva: 21,
      irpf: 0,
      totalImpuestos: 173.55,
      total: 1000,
      estado: 'pagada',
      tipo: 'factura',
      destinatario: { nombre: 'Juan García López', nif: '12345678A' },
      inmueble: 'Calle Mayor 15, 3ºB',
    },
    {
      id: 'fact-2',
      numeroFactura: 'F-00002',
      serie: 'F-00002',
      fecha: '2025-03-05',
      fechaContable: '2025-03-05',
      concepto: 'Alquiler mensual marzo 2025',
      baseImponible: 661.16,
      iva: 21,
      irpf: 0,
      totalImpuestos: 138.84,
      total: 800,
      estado: 'emitida',
      tipo: 'factura',
      destinatario: { nombre: 'María Fernández Ruiz', nif: '87654321B' },
      inmueble: 'Avenida Sol 42, 1ºA',
    },
    {
      id: 'fact-3',
      numeroFactura: 'P-00001',
      serie: 'P-00001',
      fecha: '2025-03-02',
      fechaContable: '2025-03-02',
      concepto: 'Proforma reforma baño',
      baseImponible: 2066.12,
      iva: 21,
      irpf: 0,
      totalImpuestos: 433.88,
      total: 2500,
      estado: 'borrador',
      tipo: 'proforma',
      destinatario: { nombre: 'Inversiones Costa S.L.', nif: 'B12345678' },
      inmueble: 'Plaza Central 8',
    },
    {
      id: 'fact-4',
      numeroFactura: 'F-00003',
      serie: 'F-00003',
      fecha: '2025-02-28',
      fechaContable: '2025-02-28',
      concepto: 'Alquiler febrero 2025',
      baseImponible: 826.45,
      iva: 21,
      irpf: 0,
      totalImpuestos: 173.55,
      total: 1000,
      estado: 'pagada',
      tipo: 'factura',
      destinatario: { nombre: 'Juan García López', nif: '12345678A' },
      inmueble: 'Calle Mayor 15, 3ºB',
    },
    {
      id: 'fact-5',
      numeroFactura: 'R-00001',
      serie: 'R-00001',
      fecha: '2025-03-08',
      fechaContable: '2025-03-08',
      concepto: 'Rectificativa F-00002 - Error en base',
      baseImponible: -661.16,
      iva: 21,
      irpf: 0,
      totalImpuestos: -138.84,
      total: -800,
      estado: 'emitida',
      tipo: 'rectificativa',
      destinatario: { nombre: 'María Fernández Ruiz', nif: '87654321B' },
      notas: 'Rectificación por error en importe',
    },
    {
      id: 'fact-6',
      numeroFactura: 'F-00004',
      serie: 'F-00004',
      fecha: '2025-03-10',
      fechaContable: '2025-03-10',
      concepto: 'Comisión gestión alquiler',
      baseImponible: 413.22,
      iva: 21,
      irpf: 15,
      totalImpuestos: 24.79,
      total: 438.01,
      estado: 'borrador',
      tipo: 'factura',
      destinatario: { nombre: 'Propiedades Norte S.L.', nif: 'B87654321' },
    },
    {
      id: 'fact-7',
      numeroFactura: 'F-00005',
      serie: 'F-00005',
      fecha: '2025-02-15',
      fechaContable: '2025-02-15',
      concepto: 'Alquiler febrero 2025',
      baseImponible: 495.87,
      iva: 21,
      irpf: 0,
      totalImpuestos: 104.13,
      total: 600,
      estado: 'anulada',
      tipo: 'factura',
      destinatario: { nombre: 'Carlos Martínez', nif: '11223344C' },
      inmueble: 'Calle Nueva 7',
    },
    {
      id: 'fact-8',
      numeroFactura: 'F-00006',
      serie: 'F-00006',
      fecha: '2025-03-09',
      fechaContable: '2025-03-09',
      concepto: 'Servicio de limpieza comunidad',
      baseImponible: 165.29,
      iva: 10,
      irpf: 0,
      totalImpuestos: 16.53,
      total: 181.82,
      estado: 'emitida',
      tipo: 'factura',
      destinatario: { nombre: 'Comunidad Propietarios Edificio Norte', nif: '' },
      inmueble: 'Edificio Norte - Comunidad',
    },
  ];

  samples.forEach((s, i) => {
    const id = `fact-${companyId}-${i + 1}`;
    facturasHommingStore.set(id, {
      ...s,
      id,
      companyId,
      createdAt: new Date().toISOString(),
    });
  });
}
