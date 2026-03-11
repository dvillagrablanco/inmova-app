import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger from '@/lib/logger';
import * as Sentry from '@sentry/nextjs';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  getAccountLiquidBalance,
  resolveFamilyOfficeScope,
} from '@/lib/family-office-scope';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

/**
 * GET /api/family-office/wealth-report
 * Genera informe de patrimonio completo con resumen ejecutivo IA.
 * Incluye: inmobiliario, financiero, PE, tesorería, asset allocation, alertas.
 * Opción: ?modelo720=true para declaración activos extranjero.
 */
export async function GET(request: NextRequest) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const includeModelo720 = searchParams.get('modelo720') === 'true';
    const today = new Date();
    const scope = await resolveFamilyOfficeScope(request, {
      id: session.user.id,
      role: session.user.role,
      companyId: session.user.companyId,
    });
    const companyId = scope.rootCompanyId;
    const groupIds = scope.groupCompanyIds;

    // ── DATOS INMOBILIARIOS ──
    const children = await prisma.company.findMany({
      where: { parentCompanyId: scope.rootCompanyId },
      select: { id: true, nombre: true },
    });

    const buildings = await prisma.building.count({ where: { companyId: { in: groupIds }, isDemo: false } });
    const units = await prisma.unit.findMany({
      where: { building: { companyId: { in: groupIds }, isDemo: false } },
      select: { estado: true, rentaMensual: true, precioCompra: true, valorMercado: true },
    });
    const ocupadas = units.filter((u) => u.estado === 'ocupada').length;
    const rentaTotal = units.filter((u) => u.estado === 'ocupada').reduce((s, u) => s + u.rentaMensual, 0);
    const valorInmobiliario = units.reduce((s, u) => s + (u.valorMercado || u.precioCompra || 0), 0);

    // ── DATOS FINANCIEROS ──
    const accounts = await prisma.financialAccount.findMany({
      where: { companyId: { in: groupIds }, activa: true },
      include: { positions: true },
    });
    const valorFinanciero = accounts.reduce((s, a) => s + a.positions.reduce((ps, p) => ps + p.valorActual, 0), 0);
    const pnlFinanciero = accounts.reduce((s, a) => s + a.positions.reduce((ps, p) => ps + p.pnlNoRealizado + p.pnlRealizado, 0), 0);
    const saldoTesoreria = accounts.reduce((s, a) => s + getAccountLiquidBalance(a), 0);

    // ── PRIVATE EQUITY ──
    const participations = await prisma.participation.findMany({
      where: { companyId: { in: groupIds }, activa: true },
    });
    const valorPE = participations.reduce(
      (s, p) => s + (p.valoracionActual || p.valorEstimado || p.valorContable || 0),
      0
    );

    // ── PATRIMONIO TOTAL ──
    const patrimonioTotal = valorInmobiliario + valorFinanciero + valorPE + saldoTesoreria;

    // ── ASSET ALLOCATION ──
    const allocation = {
      inmobiliario: patrimonioTotal > 0 ? Math.round((valorInmobiliario / patrimonioTotal) * 1000) / 10 : 0,
      financiero: patrimonioTotal > 0 ? Math.round((valorFinanciero / patrimonioTotal) * 1000) / 10 : 0,
      privateEquity: patrimonioTotal > 0 ? Math.round((valorPE / patrimonioTotal) * 1000) / 10 : 0,
      liquidez: patrimonioTotal > 0 ? Math.round((saldoTesoreria / patrimonioTotal) * 1000) / 10 : 0,
    };

    // ── ALERTAS ──
    const alertas: string[] = [];
    if (allocation.inmobiliario > 60) alertas.push(`⚠️ Concentración inmobiliaria alta (${allocation.inmobiliario}%). Diversificar.`);
    if (allocation.liquidez < 5) alertas.push(`⚠️ Liquidez baja (${allocation.liquidez}%). Mantener mínimo 5% en efectivo.`);
    if (allocation.financiero < 15) alertas.push(`💡 Cartera financiera infrautilizada (${allocation.financiero}%). Considerar más inversión en fondos.`);

    // ── MODELO 720 ──
    let modelo720 = null;
    if (includeModelo720) {
      const activosExtranjero = accounts
        .filter((a) => {
          const config = a.apiConfig as any;
          return config?.country && config.country !== 'ES';
        })
        .map((a) => ({
          entidad: a.entidad,
          pais: (a.apiConfig as any)?.country || 'XX',
          tipo: a.tipoEntidad,
          valorTotal: a.positions.reduce((s, p) => s + p.valorActual, 0) + a.saldoActual,
          posiciones: a.positions.length,
          divisa: a.divisa,
        }));

      const totalExtranjero = activosExtranjero.reduce((s, a) => s + a.valorTotal, 0);

      modelo720 = {
        obligado: totalExtranjero > 50000,
        totalActivosExtranjero: Math.round(totalExtranjero),
        umbral: 50000,
        cuentas: activosExtranjero,
        nota: totalExtranjero > 50000
          ? `OBLIGATORIO declarar Modelo 720 antes del 31 de marzo. Total activos extranjero: ${Math.round(totalExtranjero).toLocaleString('es-ES')}€`
          : 'No supera el umbral de 50.000€. No obligatorio.',
      };
    }

    // ── RESUMEN EJECUTIVO IA ──
    let resumenIA = '';
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (apiKey) {
      try {
        const Anthropic = (await import('@anthropic-ai/sdk')).default;
        const { CLAUDE_MODEL_PRIMARY } = await import('@/lib/ai-model-config');
        const anthropic = new Anthropic({ apiKey });

        const response = await anthropic.messages.create({
          model: CLAUDE_MODEL_PRIMARY,
          max_tokens: 600,
          messages: [{
            role: 'user',
            content: `Genera un resumen ejecutivo de 4-5 líneas del patrimonio de un family office.

Datos a ${format(today, 'MMMM yyyy', { locale: es })}:
- Patrimonio total: ${Math.round(patrimonioTotal).toLocaleString('es-ES')}€
- Inmobiliario: ${Math.round(valorInmobiliario).toLocaleString('es-ES')}€ (${allocation.inmobiliario}%) — ${buildings} edificios, ${units.length} uds, ${(ocupadas/units.length*100).toFixed(0)}% ocupación, ${Math.round(rentaTotal).toLocaleString('es-ES')}€/mes renta
- Financiero: ${Math.round(valorFinanciero).toLocaleString('es-ES')}€ (${allocation.financiero}%) — P&L: ${Math.round(pnlFinanciero).toLocaleString('es-ES')}€
- Private Equity: ${Math.round(valorPE).toLocaleString('es-ES')}€ (${allocation.privateEquity}%) — ${participations.length} participaciones
- Liquidez: ${Math.round(saldoTesoreria).toLocaleString('es-ES')}€ (${allocation.liquidez}%)

Sé directo, ejecutivo, con 1-2 recomendaciones.`,
          }],
        });
        resumenIA = response.content[0].type === 'text' ? response.content[0].text : '';
      } catch { /* continue without AI */ }
    }

    const report = {
      titulo: `Informe Patrimonial — ${format(today, 'MMMM yyyy', { locale: es })}`,
      fecha: today.toISOString(),
      resumenEjecutivo: resumenIA || `Patrimonio total: ${Math.round(patrimonioTotal).toLocaleString('es-ES')}€`,
      patrimonio: {
        total: Math.round(patrimonioTotal),
        inmobiliario: Math.round(valorInmobiliario),
        financiero: Math.round(valorFinanciero),
        privateEquity: Math.round(valorPE),
        tesoreria: Math.round(saldoTesoreria),
      },
      assetAllocation: allocation,
      inmobiliario: { edificios: buildings, unidades: units.length, ocupadas, rentaMensual: Math.round(rentaTotal) },
      financiero: { cuentas: accounts.length, posiciones: accounts.reduce((s, a) => s + a.positions.length, 0), pnl: Math.round(pnlFinanciero) },
      privateEquity: { participaciones: participations.length, valorTotal: Math.round(valorPE) },
      tesoreria: {
        total: Math.round(saldoTesoreria),
        porEntidad: Object.fromEntries(accounts.map((a) => [a.entidad, Math.round(a.saldoActual)])),
      },
      alertas,
      ...(modelo720 && { modelo720 }),
    };

    return NextResponse.json({ success: true, report });
  } catch (error: any) {
    logger.error('[Wealth Report]:', error);
    Sentry.captureException(error);
    return NextResponse.json({ error: 'Error generando informe patrimonial' }, { status: 500 });
  }
}
