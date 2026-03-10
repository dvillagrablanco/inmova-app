import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export const dynamic = 'force-dynamic';

const MOCK_DATA: Record<string, unknown> = {
  inquilinos: {
    kpis: { total: 45, activos: 42, nuevos: 3 },
    rows: [
      { nombre: 'Juan García', email: 'juan@email.com', inmueble: 'Piso 1A', renta: 950, estado: 'activo' },
      { nombre: 'María López', email: 'maria@email.com', inmueble: 'Piso 3C', renta: 1200, estado: 'activo' },
      { nombre: 'Carlos Ruiz', email: 'carlos@email.com', inmueble: 'Piso 2B', renta: 1100, estado: 'pendiente' },
    ],
  },
  contratos: {
    kpis: { total: 38, activos: 35, expirados: 3 },
    rows: [
      { inmueble: 'Piso 1A', inquilino: 'Juan García', inicio: '2024-01-15', fin: '2025-01-14', renta: 950, estado: 'activo' },
      { inmueble: 'Piso 3C', inquilino: 'María López', inicio: '2023-06-01', fin: '2024-05-31', renta: 1200, estado: 'expirado' },
      { inmueble: 'Piso 2B', inquilino: 'Pendiente', inicio: '2025-02-01', fin: '2026-01-31', renta: 1100, estado: 'pendiente' },
    ],
  },
  incidencias: {
    kpis: { total: 12, abiertas: 3, resueltas: 9 },
    rows: [
      { fecha: '2025-03-08', inmueble: 'Piso 1A', titulo: 'Fuga grifo', prioridad: 'alta', estado: 'en_proceso' },
      { fecha: '2025-03-05', inmueble: 'Piso 3C', titulo: 'Revisión caldera', prioridad: 'media', estado: 'resuelta' },
      { fecha: '2025-03-10', inmueble: 'Piso 2B', titulo: 'Pintura', prioridad: 'baja', estado: 'abierta' },
    ],
  },
  ingresos: {
    kpis: { total: 42500, mensual: 14200, variacion: 5.2 },
    rows: [
      { concepto: 'Renta Piso 1A', importe: 950, fecha: '2025-03-01', estado: 'cobrado' },
      { concepto: 'Renta Piso 3C', importe: 1200, fecha: '2025-03-05', estado: 'cobrado' },
      { concepto: 'Renta Piso 2B', importe: 1100, fecha: '2025-03-10', estado: 'pendiente' },
    ],
  },
  gastos: {
    kpis: { total: 8500, mensual: 2800, variacion: -2.1 },
    rows: [
      { concepto: 'Mantenimiento', importe: 350, fecha: '2025-03-02', categoria: 'reparacion' },
      { concepto: 'Comunidad', importe: 120, fecha: '2025-03-05', categoria: 'comunidad' },
      { concepto: 'Seguro', importe: 85, fecha: '2025-03-01', categoria: 'seguro' },
    ],
  },
  liquidaciones: {
    kpis: { total: 12, pendientes: 2, enviadas: 10 },
    rows: [
      { periodo: 'Marzo 2025', inmueble: 'Piso 1A', neto: 805, estado: 'enviada' },
      { periodo: 'Marzo 2025', inmueble: 'Piso 3C', neto: 1080, estado: 'enviada' },
      { periodo: 'Febrero 2025', inmueble: 'Piso 1A', neto: 735, estado: 'enviada' },
    ],
  },
  facturas: {
    kpis: { total: 28, emitidas: 25, pendientes: 3 },
    rows: [
      { numero: 'F-2025-001', cliente: 'Juan García', importe: 950, fecha: '2025-03-01', estado: 'pagada' },
      { numero: 'F-2025-002', cliente: 'María López', importe: 1200, fecha: '2025-03-05', estado: 'pagada' },
      { numero: 'F-2025-003', cliente: 'Pendiente', importe: 1100, fecha: '2025-03-10', estado: 'pendiente' },
    ],
  },
  pagos: {
    kpis: { total: 42500, cobrados: 40000, pendientes: 2500 },
    rows: [
      { fecha: '2025-03-01', concepto: 'Renta marzo', importe: 950, estado: 'cobrado' },
      { fecha: '2025-03-05', concepto: 'Renta marzo', importe: 1200, estado: 'cobrado' },
      { fecha: '2025-03-10', concepto: 'Renta marzo', importe: 1100, estado: 'pendiente' },
    ],
  },
  rentabilidad: {
    kpis: { ingresos: 42500, gastos: 8500, beneficio: 34000, rentabilidad: 80 },
    cashflow: [
      { mes: 'Ene', ingresos: 14000, gastos: 2700 },
      { mes: 'Feb', ingresos: 14200, gastos: 2800 },
      { mes: 'Mar', ingresos: 14300, gastos: 2900 },
    ],
    rows: [
      { inmueble: 'Piso 1A', ingresos: 11400, gastos: 1200, beneficio: 10200, rentabilidad: 89.5 },
      { inmueble: 'Piso 3C', ingresos: 14400, gastos: 800, beneficio: 13600, rentabilidad: 94.4 },
      { inmueble: 'Piso 2B', ingresos: 0, gastos: 500, beneficio: -500, rentabilidad: 0 },
    ],
  },
  inmuebles: {
    kpis: { total: 15, ocupados: 12, vacios: 2, mantenimiento: 1 },
    rows: [
      { inmueble: 'Piso 1A', direccion: 'Calle Mayor 123', estado: 'ocupado', renta: 950 },
      { inmueble: 'Piso 2B', direccion: 'Calle Mayor 123', estado: 'vacio', renta: 1100 },
      { inmueble: 'Piso 3C', direccion: 'Calle Mayor 123', estado: 'ocupado', renta: 1200 },
    ],
  },
  propietarios: {
    kpis: { total: 8, activos: 7 },
    rows: [
      { nombre: 'Propietario A', inmuebles: 5, rentaTotal: 4500, estado: 'activo' },
      { nombre: 'Propietario B', inmuebles: 3, rentaTotal: 3200, estado: 'activo' },
      { nombre: 'Propietario C', inmuebles: 2, rentaTotal: 2100, estado: 'activo' },
    ],
  },
  impagos: {
    kpis: { totalImpagos: 2450, inquilinosImpago: 2, inmueblesImpago: 2 },
    rows: [
      { inquilino: 'Juan García', inmueble: 'Piso 1A', importe: 950, dias: 15 },
      { inquilino: 'Otro Inquilino', inmueble: 'Piso 4D', importe: 1500, dias: 30 },
    ],
  },
  renta: {
    kpis: { media: 1083, min: 950, max: 1500 },
    rows: [
      { inmueble: 'Piso 1A', renta: 950, m2: 65, precioM2: 14.6 },
      { inmueble: 'Piso 2B', renta: 1100, m2: 75, precioM2: 14.7 },
      { inmueble: 'Piso 3C', renta: 1200, m2: 80, precioM2: 15 },
    ],
  },
  fiscal: {
    kpis: { propietarios: 8, totalDeclarar: 42500 },
    rows: [
      { propietario: 'Propietario A', ingresos: 54000, gastos: 8500, baseImponible: 45500 },
      { propietario: 'Propietario B', ingresos: 38400, gastos: 4200, baseImponible: 34200 },
      { propietario: 'Propietario C', ingresos: 25200, gastos: 2100, baseImponible: 23100 },
    ],
  },
  documentos: {
    kpis: { total: 156, contratos: 38, facturas: 45 },
    rows: [
      { tipo: 'Contrato', nombre: 'Contrato Piso 1A', fecha: '2024-01-15', estado: 'firmado' },
      { tipo: 'Factura', nombre: 'F-2025-001', fecha: '2025-03-01', estado: 'pagada' },
      { tipo: 'Liquidación', nombre: 'Liq-Mar-2025', fecha: '2025-03-15', estado: 'enviada' },
    ],
  },
  ocupacion: {
    kpis: { tasa: 80, ocupados: 12, total: 15 },
    rows: [
      { zona: 'Centro', ocupados: 5, total: 6, tasa: 83 },
      { zona: 'Norte', ocupados: 4, total: 5, tasa: 80 },
      { zona: 'Sur', ocupados: 3, total: 4, tasa: 75 },
    ],
  },
  morosidad: {
    kpis: { tasa: 4.4, importe: 2450, inquilinos: 2 },
    rows: [
      { inquilino: 'Juan García', importe: 950, dias: 15, estado: 'impago' },
      { inquilino: 'Otro', importe: 1500, dias: 30, estado: 'impago' },
    ],
  },
  comparativa: {
    kpis: { periodo: 'YoY', variacion: 5.2 },
    rows: [
      { concepto: 'Ingresos', actual: 42500, anterior: 40400, variacion: 5.2 },
      { concepto: 'Gastos', actual: 8500, anterior: 8700, variacion: -2.3 },
      { concepto: 'Ocupación', actual: 80, anterior: 75, variacion: 6.7 },
    ],
  },
  historico: {
    kpis: { años: 3 },
    rows: [
      { año: 2023, ingresos: 380000, gastos: 95000, beneficio: 285000 },
      { año: 2024, ingresos: 410000, gastos: 98000, beneficio: 312000 },
      { año: 2025, ingresos: 42500, gastos: 8500, beneficio: 34000 },
    ],
  },
  porZona: {
    kpis: { zonas: 5 },
    rows: [
      { zona: 'Centro', inmuebles: 6, rentaMedia: 1150, ocupacion: 83 },
      { zona: 'Norte', inmuebles: 5, rentaMedia: 980, ocupacion: 80 },
      { zona: 'Sur', inmuebles: 4, rentaMedia: 1050, ocupacion: 75 },
    ],
  },
  porTipo: {
    kpis: { tipos: 4 },
    rows: [
      { tipo: 'Piso', cantidad: 10, rentaMedia: 1050 },
      { tipo: 'Local', cantidad: 3, rentaMedia: 1500 },
      { tipo: 'Trastero', cantidad: 2, rentaMedia: 50 },
    ],
  },
  resumen: {
    kpis: { ingresos: 42500, gastos: 8500, beneficio: 34000, ocupacion: 80 },
    rows: [
      { metrica: 'Ingresos mensuales', valor: 14200, tendencia: 'up' },
      { metrica: 'Gastos mensuales', valor: 2833, tendencia: 'down' },
      { metrica: 'Tasa ocupación', valor: 80, tendencia: 'up' },
    ],
  },
};

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const tipo = searchParams.get('tipo') || 'inquilinos';

  const data = MOCK_DATA[tipo] ?? MOCK_DATA.inquilinos;
  return NextResponse.json({ success: true, data });
}
