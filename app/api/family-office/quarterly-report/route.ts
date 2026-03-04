import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

function getQuarter(date: Date) {
  const q = Math.floor(date.getMonth() / 3) + 1;
  const year = date.getFullYear();
  return { q, year, label: `T${q} ${year}` };
}

/**
 * GET /api/family-office/quarterly-report?view=holding|consolidated
 * Generates a 5-section HTML quarterly report suitable for PDF download.
 * Returns JSON with { html, quarter, generatedAt }.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const view = searchParams.get('view') || 'consolidated';

    const baseUrl = request.nextUrl.origin;
    const dashRes = await fetch(`${baseUrl}/api/family-office/dashboard?view=${view}`, {
      headers: { cookie: request.headers.get('cookie') || '' },
    });

    if (!dashRes.ok) {
      return NextResponse.json({ error: 'Error obteniendo datos' }, { status: 500 });
    }

    const rawData = await dashRes.json();
    const d = rawData.data || rawData;

    const prisma = await getPrisma();
    const company = await prisma.company.findUnique({
      where: { id: session.user.companyId },
      select: { childCompanies: { select: { id: true } } },
    });
    const scopeIds = company
      ? [session.user.companyId, ...company.childCompanies.map((c: { id: string }) => c.id)]
      : [session.user.companyId];

    const participations = await prisma.participation.findMany({
      where: { companyId: { in: scopeIds }, activa: true },
      select: {
        targetCompanyName: true,
        compromisoTotal: true,
        capitalLlamado: true,
        capitalDistribuido: true,
        valorEstimado: true,
        valorContable: true,
      },
    });

    const peFunds = participations.map((p: any) => ({
      name: p.targetCompanyName,
      committed: p.compromisoTotal ?? 0,
      called: p.capitalLlamado ?? 0,
      distributed: p.capitalDistribuido ?? 0,
      nav: p.valorEstimado ?? p.valorContable ?? 0,
    }));

    const cuentas = d?.financiero?.cuentas || [];
    const topBankAccounts = [...cuentas]
      .sort((a: any, b: any) => (b.saldo ?? 0) - (a.saldo ?? 0))
      .slice(0, 5);

    const fmt = (n: number) =>
      new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);

    const now = new Date();
    const quarter = getQuarter(now);
    const today = now.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
    const companyName = (session.user as any).companyName || 'Grupo';

    const edificios = d?.inmobiliario?.edificios || [];
    const allocation = d?.assetAllocation || {};
    const patrimonio = d?.patrimonio?.total ?? 0;

    const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>Informe Trimestral - ${companyName} - ${quarter.label}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1a1a1a; padding: 40px; font-size: 14px; }
    .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #0f172a; padding-bottom: 20px; }
    .header h1 { font-size: 26px; font-weight: 700; color: #0f172a; }
    .header .subtitle { color: #64748b; margin-top: 6px; font-size: 13px; }
    .section { margin-bottom: 36px; page-break-inside: avoid; }
    .section h2 { font-size: 16px; font-weight: 600; color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 16px; text-transform: uppercase; letter-spacing: 0.5px; }
    .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 20px; }
    .kpi { border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; text-align: center; background: #f8fafc; }
    .kpi .label { font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
    .kpi .value { font-size: 20px; font-weight: 700; margin-top: 4px; color: #0f172a; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th, td { border: 1px solid #e2e8f0; padding: 10px 12px; text-align: left; }
    th { background: #f1f5f9; font-weight: 600; color: #334155; }
    .text-right { text-align: right; }
    .footer { margin-top: 48px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 16px; }
    @media print {
      body { padding: 24px; }
      .section { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Informe Trimestral Patrimonial</h1>
    <p class="subtitle">${companyName} · ${quarter.label} · ${today} · Vista ${view === 'holding' ? 'Holding' : 'Consolidada'}</p>
  </div>

  <!-- 1. Executive Summary -->
  <div class="section">
    <h2>1. Resumen Ejecutivo</h2>
    <div class="kpi-grid">
      <div class="kpi">
        <div class="label">Patrimonio Total</div>
        <div class="value">${fmt(patrimonio)}</div>
      </div>
      <div class="kpi">
        <div class="label">Inmobiliario</div>
        <div class="value">${fmt(d?.inmobiliario?.valor || 0)}</div>
      </div>
      <div class="kpi">
        <div class="label">Private Equity</div>
        <div class="value">${fmt(d?.privateEquity?.valor || 0)}</div>
      </div>
      <div class="kpi">
        <div class="label">Tesorería</div>
        <div class="value">${fmt(d?.tesoreria?.saldo || 0)}</div>
      </div>
    </div>
  </div>

  <!-- 2. Asset Allocation -->
  <div class="section">
    <h2>2. Asignación de Activos</h2>
    <div class="kpi-grid">
      <div class="kpi">
        <div class="label">Inmobiliario</div>
        <div class="value">${allocation.inmobiliario ?? 0}%</div>
      </div>
      <div class="kpi">
        <div class="label">Financiero</div>
        <div class="value">${allocation.financiero ?? 0}%</div>
      </div>
      <div class="kpi">
        <div class="label">Private Equity</div>
        <div class="value">${allocation.privateEquity ?? 0}%</div>
      </div>
      <div class="kpi">
        <div class="label">Liquidez</div>
        <div class="value">${allocation.liquidez ?? 0}%</div>
      </div>
    </div>
  </div>

  <!-- 3. Real Estate Performance -->
  <div class="section">
    <h2>3. Rendimiento Inmobiliario</h2>
    <table>
      <thead>
        <tr><th>Edificio</th><th class="text-right">Ocupación</th><th class="text-right">Renta/mes</th><th class="text-right">Valor</th></tr>
      </thead>
      <tbody>
        ${edificios.map((e: any) => {
          const occ = e.unidades ? Math.round(((e.ocupadas || 0) / e.unidades) * 100) : 0;
          return `<tr>
          <td>${e.nombre || ''}</td>
          <td class="text-right">${occ}%</td>
          <td class="text-right">${fmt(e.renta || 0)}</td>
          <td class="text-right">${fmt(e.valor || 0)}</td>
        </tr>`;
        }).join('')}
      </tbody>
    </table>
  </div>

  <!-- 4. PE Portfolio -->
  <div class="section">
    <h2>4. Cartera Private Equity</h2>
    <table>
      <thead>
        <tr><th>Fondo</th><th class="text-right">Comprometido</th><th class="text-right">Llamado</th><th class="text-right">Distribuido</th><th class="text-right">NAV</th></tr>
      </thead>
      <tbody>
        ${peFunds.map((f: any) => `
        <tr>
          <td>${f.name}</td>
          <td class="text-right">${fmt(f.committed)}</td>
          <td class="text-right">${fmt(f.called)}</td>
          <td class="text-right">${fmt(f.distributed)}</td>
          <td class="text-right">${fmt(f.nav)}</td>
        </tr>`).join('')}
      </tbody>
    </table>
  </div>

  <!-- 5. Cash-flow / Bank Accounts -->
  <div class="section">
    <h2>5. Tesorería y Cuentas Bancarias (Top 5)</h2>
    <table>
      <thead>
        <tr><th>Entidad</th><th>Alias</th><th class="text-right">Saldo</th></tr>
      </thead>
      <tbody>
        ${topBankAccounts.map((a: any) => `
        <tr>
          <td>${a.entidad || ''}</td>
          <td>${a.alias || '-'}</td>
          <td class="text-right">${fmt(a.saldo ?? 0)}</td>
        </tr>`).join('')}
      </tbody>
    </table>
    <p style="margin-top: 12px; font-size: 12px; color: #64748b;">Saldo total tesorería: ${fmt(d?.tesoreria?.saldo || 0)}</p>
  </div>

  <div class="footer">
    <p>Generado automáticamente por INMOVA · ${today} · Documento confidencial</p>
  </div>
</body>
</html>`;

    return NextResponse.json({
      html,
      quarter: quarter.label,
      generatedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    logger.error('[Family Office Quarterly Report Error]:', error);
    return NextResponse.json({ error: 'Error generando informe trimestral' }, { status: 500 });
  }
}
