/**
 * POST /api/accounting/refresh-from-source
 * 
 * Re-importa la contabilidad desde las fuentes originales (Google Sheets).
 * Descarga el spreadsheet actualizado y reimporta los asientos.
 * 
 * Fuentes configuradas:
 * - Rovida: https://docs.google.com/spreadsheets/d/1uRerjVupuKFKpkATavimTElFbI9DG_b8
 * - Viroda: https://docs.google.com/spreadsheets/d/1WRWB6PvIXnyF3f8lSi5AWCqQXXYlHy1L
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { resolveAccountingScope } from '@/lib/accounting-scope';
import * as XLSX from 'xlsx';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Fuentes de contabilidad por empresa (Google Sheets export URLs)
const ACCOUNTING_SOURCES: Record<string, string> = {
  'Rovida': 'https://docs.google.com/spreadsheets/d/1uRerjVupuKFKpkATavimTElFbI9DG_b8/export?format=xlsx',
  'Viroda': 'https://docs.google.com/spreadsheets/d/1WRWB6PvIXnyF3f8lSi5AWCqQXXYlHy1L/export?format=xlsx',
};

function classifyEntry(sub: string, titulo: string, debe: number, haber: number) {
  let tipo: 'ingreso' | 'gasto' = 'gasto';
  let cat = 'gasto_otro';
  if (sub.startsWith('7')) {
    tipo = 'ingreso';
    cat = titulo.toLowerCase().includes('alquiler') || titulo.toLowerCase().includes('arrendamiento')
      ? 'ingreso_renta' : 'ingreso_otro';
  } else if (sub.startsWith('6')) {
    const t = titulo.toLowerCase();
    if (t.includes('seguro')) cat = 'gasto_seguro';
    else if (t.includes('impuesto') || t.includes('ibi') || t.includes('tributo')) cat = 'gasto_impuesto';
    else if (t.includes('mantenimiento') || t.includes('reparac')) cat = 'gasto_mantenimiento';
    else if (t.includes('comunidad')) cat = 'gasto_comunidad';
    else if (t.includes('servicio') || t.includes('suministro') || t.includes('agua') || t.includes('gas')) cat = 'gasto_servicio';
    else if (t.includes('administrac') || t.includes('gestoría') || t.includes('asesoría')) cat = 'gasto_administracion';
  } else if (haber > 0 && debe === 0) {
    tipo = 'ingreso';
    cat = 'ingreso_otro';
  }
  return { tipo, categoria: cat };
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Solo admin puede refrescar
    const role = (session.user as any).role;
    if (role !== 'administrador' && role !== 'super_admin') {
      return NextResponse.json({ error: 'Solo administradores' }, { status: 403 });
    }

    const scope = await resolveAccountingScope(request, session.user as any);
    if (!scope) {
      return NextResponse.json({ error: 'Sin empresa' }, { status: 403 });
    }

    // Determinar qué empresa refrescar
    const company = await prisma.company.findUnique({
      where: { id: scope.activeCompanyId },
      select: { id: true, nombre: true },
    });

    if (!company) {
      return NextResponse.json({ error: 'Empresa no encontrada' }, { status: 404 });
    }

    // Buscar fuente para esta empresa
    const sourceKey = Object.keys(ACCOUNTING_SOURCES).find(k =>
      company.nombre.toLowerCase().includes(k.toLowerCase())
    );

    if (!sourceKey) {
      return NextResponse.json({
        error: 'No hay fuente de contabilidad configurada para esta empresa',
        hint: 'Sube un archivo XLSX desde la sección de importar movimientos contables',
      }, { status: 404 });
    }

    const sourceUrl = ACCOUNTING_SOURCES[sourceKey];

    // Descargar spreadsheet
    logger.info(`[Refresh Accounting] Descargando ${sourceKey} desde Google Sheets...`);
    const response = await fetch(sourceUrl, { signal: AbortSignal.timeout(30000) });
    if (!response.ok) {
      return NextResponse.json({
        error: `Error descargando contabilidad: HTTP ${response.status}`,
      }, { status: 502 });
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    const wb = XLSX.read(buffer, { type: 'buffer' });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];

    // Parsear asientos
    const asientos: Array<{
      num: number; fecha: Date; sub: string; titulo: string;
      concepto: string; debe: number; haber: number; referencia: string;
    }> = [];

    for (let i = 4; i < data.length; i++) {
      const row = data[i];
      if (!row || !row[0] || String(row[0]).trim() === '') continue;
      const num = Number(row[0]);
      if (isNaN(num)) continue;

      let fecha: Date;
      if (row[2] instanceof Date) fecha = row[2];
      else if (typeof row[2] === 'number') fecha = new Date((row[2] - 25569) * 86400 * 1000);
      else fecha = new Date(String(row[2] || '2025-01-01'));
      if (isNaN(fecha.getTime())) fecha = new Date('2025-01-01');

      asientos.push({
        num, fecha,
        sub: String(row[5] || ''),
        titulo: String(row[6] || ''),
        concepto: String(row[8] || ''),
        debe: Number(row[10]) || 0,
        haber: Number(row[11]) || 0,
        referencia: String(row[3] || ''),
      });
    }

    // Agrupar por número de asiento
    const groups = new Map<number, typeof asientos>();
    for (const a of asientos) {
      if (!groups.has(a.num)) groups.set(a.num, []);
      groups.get(a.num)!.push(a);
    }

    // Eliminar transacciones anteriores y recrear
    const deleted = await prisma.accountingTransaction.deleteMany({
      where: { companyId: company.id },
    });

    const txns: any[] = [];
    for (const [num, entries] of groups) {
      const first = entries[0];
      const totalDebe = entries.reduce((s, e) => s + e.debe, 0);
      const totalHaber = entries.reduce((s, e) => s + e.haber, 0);
      const monto = Math.max(totalDebe, totalHaber);
      if (monto === 0) continue;

      const { tipo, categoria } = classifyEntry(first.sub, first.titulo, totalDebe, totalHaber);

      txns.push({
        companyId: company.id,
        tipo,
        categoria,
        concepto: (first.concepto || first.titulo || `Asiento ${num}`).substring(0, 500),
        monto: Math.round(monto * 100) / 100,
        fecha: first.fecha,
        referencia: `AS-${num}${first.referencia ? ' / ' + first.referencia : ''}`,
        notas: `Subcuenta: ${first.sub} - ${first.titulo}`,
      });
    }

    // Insertar en batches
    let created = 0;
    for (let i = 0; i < txns.length; i += 100) {
      const batch = txns.slice(i, i + 100);
      await prisma.accountingTransaction.createMany({ data: batch });
      created += batch.length;
    }

    // Obtener rango de fechas
    const fechas = asientos.map(a => a.fecha).filter(f => !isNaN(f.getTime()));
    const minFecha = fechas.length > 0 ? new Date(Math.min(...fechas.map(f => f.getTime()))) : null;
    const maxFecha = fechas.length > 0 ? new Date(Math.max(...fechas.map(f => f.getTime()))) : null;

    logger.info(`[Refresh Accounting] ${company.nombre}: ${created} transacciones importadas`);

    return NextResponse.json({
      success: true,
      company: company.nombre,
      summary: {
        asientosLeidos: asientos.length,
        asientosUnicos: groups.size,
        transaccionesCreadas: created,
        transaccionesEliminadas: deleted.count,
        periodoDesde: minFecha?.toISOString().split('T')[0],
        periodoHasta: maxFecha?.toISOString().split('T')[0],
      },
    });
  } catch (error: any) {
    logger.error('[Refresh Accounting] Error:', error);
    return NextResponse.json({ error: error.message || 'Error refrescando contabilidad' }, { status: 500 });
  }
}
