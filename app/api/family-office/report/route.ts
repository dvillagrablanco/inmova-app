import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/family-office/report?view=holding|consolidated
 * Generates an HTML report suitable for PDF download (client-side print).
 * Returns JSON with HTML content that the client renders in a hidden iframe and prints.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const view = searchParams.get('view') || 'consolidated';

    // Fetch dashboard data internally
    const baseUrl = request.nextUrl.origin;
    const dashRes = await fetch(`${baseUrl}/api/family-office/dashboard?view=${view}`, {
      headers: { cookie: request.headers.get('cookie') || '' },
    });

    if (!dashRes.ok) {
      return NextResponse.json({ error: 'Error obteniendo datos' }, { status: 500 });
    }

    const rawData = await dashRes.json();
    const d = rawData.data || rawData;

    const fmt = (n: number) =>
      new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);

    const today = new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
    const companyName = (session.user as any).companyName || 'Grupo';

    const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>Informe Patrimonial - ${companyName}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1a1a1a; padding: 40px; font-size: 14px; }
    .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #000; padding-bottom: 20px; }
    .header h1 { font-size: 24px; font-weight: 700; }
    .header p { color: #666; margin-top: 4px; }
    .section { margin-bottom: 30px; }
    .section h2 { font-size: 18px; font-weight: 600; border-bottom: 1px solid #ddd; padding-bottom: 8px; margin-bottom: 16px; }
    .kpi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px; }
    .kpi { border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; text-align: center; }
    .kpi .label { font-size: 12px; color: #666; text-transform: uppercase; }
    .kpi .value { font-size: 22px; font-weight: 700; margin-top: 4px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { border: 1px solid #e5e7eb; padding: 8px 12px; text-align: left; font-size: 13px; }
    th { background: #f9fafb; font-weight: 600; }
    .text-right { text-align: right; }
    .footer { margin-top: 40px; text-align: center; font-size: 11px; color: #999; border-top: 1px solid #ddd; padding-top: 16px; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <h1>Informe Patrimonial</h1>
    <p>${companyName} · ${today} · Vista ${view === 'holding' ? 'Holding' : 'Consolidada'}</p>
  </div>

  <div class="section">
    <h2>Resumen Patrimonial</h2>
    <div class="kpi-grid">
      <div class="kpi">
        <div class="label">Patrimonio Total</div>
        <div class="value">${fmt(d?.patrimonio?.total || 0)}</div>
      </div>
      <div class="kpi">
        <div class="label">Inmobiliario</div>
        <div class="value">${fmt(d?.inmobiliario?.valor || 0)}</div>
      </div>
      <div class="kpi">
        <div class="label">Financiero</div>
        <div class="value">${fmt(d?.financiero?.valor || 0)}</div>
      </div>
    </div>
  </div>

  <div class="section">
    <h2>Cartera Inmobiliaria</h2>
    <table>
      <thead>
        <tr><th>Edificio</th><th>Dirección</th><th class="text-right">Unidades</th><th class="text-right">Ocupadas</th><th class="text-right">Valor</th><th class="text-right">Renta/mes</th></tr>
      </thead>
      <tbody>
        ${(d?.inmobiliario?.edificios || []).map((e: any) => `
        <tr>
          <td>${e.nombre || ''}</td>
          <td>${e.direccion || ''}</td>
          <td class="text-right">${e.unidades || 0}</td>
          <td class="text-right">${e.ocupadas || 0}</td>
          <td class="text-right">${fmt(e.valor || 0)}</td>
          <td class="text-right">${fmt(e.renta || 0)}</td>
        </tr>`).join('')}
      </tbody>
    </table>
  </div>

  <div class="section">
    <h2>Tesorería</h2>
    <div class="kpi-grid">
      <div class="kpi">
        <div class="label">Saldo Total</div>
        <div class="value">${fmt(d?.tesoreria?.saldo || 0)}</div>
      </div>
    </div>
  </div>

  <div class="footer">
    <p>Generado automáticamente por INMOVA · ${today} · Documento confidencial</p>
  </div>
</body>
</html>`;

    return NextResponse.json({ html, generatedAt: new Date().toISOString() });
  } catch (error: any) {
    logger.error('[Family Office Report Error]:', error);
    return NextResponse.json({ error: 'Error generando informe' }, { status: 500 });
  }
}
