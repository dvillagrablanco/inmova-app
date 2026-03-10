/**
 * Store en memoria para series de facturación
 */

export interface SerieFacturacion {
  id: string;
  prefijo: string;
  nombre: string;
  ultimoNumero: number;
  impuestoPorDefecto: { iva: number; irpf: number };
  activa: boolean;
  createdAt: string;
  companyId: string;
}

export const seriesFacturacionStore = new Map<string, SerieFacturacion>();

export function seedSeriesFacturacion(companyId: string) {
  const existing = Array.from(seriesFacturacionStore.values()).some((s) => s.companyId === companyId);
  if (existing) return;

  const defaults = [
    { id: 'serie-f', prefijo: 'F-', nombre: 'Facturas', ultimoNumero: 6, iva: 21, irpf: 0 },
    { id: 'serie-p', prefijo: 'P-', nombre: 'Proformas', ultimoNumero: 1, iva: 21, irpf: 0 },
    { id: 'serie-r', prefijo: 'R-', nombre: 'Rectificativas', ultimoNumero: 1, iva: 21, irpf: 0 },
  ];

  defaults.forEach((d) => {
    const id = `${d.id}-${companyId}`;
    seriesFacturacionStore.set(id, {
      id,
      prefijo: d.prefijo,
      nombre: d.nombre,
      ultimoNumero: d.ultimoNumero,
      impuestoPorDefecto: { iva: d.iva, irpf: d.irpf },
      activa: true,
      createdAt: new Date().toISOString(),
      companyId,
    });
  });
}
