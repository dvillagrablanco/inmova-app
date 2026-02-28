import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

/**
 * POST /api/family-office/ai-copilot
 * Copiloto patrimonial IA con acceso a TODOS los datos del family office:
 * inmobiliario + carteras financieras + PE + tesorería.
 */
export async function POST(request: NextRequest) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { message, history = [] } = await request.json();
    if (!message) return NextResponse.json({ error: 'Mensaje requerido' }, { status: 400 });

    const companyId = session.user.companyId;

    // Recopilar TODOS los datos patrimoniales
    const groupIds = [companyId];
    const children = await prisma.company.findMany({ where: { parentCompanyId: companyId }, select: { id: true, nombre: true } });
    children.forEach((c) => groupIds.push(c.id));

    const [contracts, units, accounts, participations, pendingPayments, overdueCount] = await Promise.all([
      prisma.contract.findMany({ where: { unit: { building: { companyId: { in: groupIds } } }, estado: 'activo' }, select: { rentaMensual: true } }),
      prisma.unit.findMany({ where: { building: { companyId: { in: groupIds }, isDemo: false } }, select: { estado: true, rentaMensual: true, valorMercado: true, precioCompra: true } }),
      prisma.financialAccount.findMany({ where: { companyId, activa: true }, include: { positions: { select: { nombre: true, valorActual: true, pnlNoRealizado: true, pnlRealizado: true, tipo: true, entidad: true } } } }),
      prisma.participation.findMany({ where: { companyId, activa: true }, select: { targetCompanyName: true, porcentaje: true, valorContable: true, valorEstimado: true, tipo: true } }),
      prisma.payment.count({ where: { contract: { unit: { building: { companyId: { in: groupIds } } } }, estado: 'pendiente' } }),
      prisma.payment.count({ where: { contract: { unit: { building: { companyId: { in: groupIds } } } }, estado: 'atrasado' } }),
    ]);

    const rentaTotal = contracts.reduce((s, c) => s + c.rentaMensual, 0);
    const valorInmob = units.reduce((s, u) => s + (u.valorMercado || u.precioCompra || 0), 0);
    const ocupadas = units.filter((u) => u.estado === 'ocupada').length;
    const valorFin = accounts.reduce((s, a) => s + a.positions.reduce((ps, p) => ps + p.valorActual, 0), 0);
    const pnlFin = accounts.reduce((s, a) => s + a.positions.reduce((ps, p) => ps + p.pnlNoRealizado + p.pnlRealizado, 0), 0);
    const saldos = accounts.reduce((s, a) => s + a.saldoActual, 0);
    const valorPE = participations.reduce((s, p) => s + (p.valorEstimado || p.valorContable), 0);
    const patrimonioTotal = valorInmob + valorFin + valorPE + saldos;

    // Top posiciones financieras
    const topPositions = accounts.flatMap((a) => a.positions).sort((a, b) => b.valorActual - a.valorActual).slice(0, 10);

    const context = `DATOS PATRIMONIALES EN TIEMPO REAL (Family Office):

PATRIMONIO TOTAL: ${Math.round(patrimonioTotal).toLocaleString('es-ES')}€

INMOBILIARIO: ${Math.round(valorInmob).toLocaleString('es-ES')}€
- ${units.length} unidades (${ocupadas} ocupadas, ${(ocupadas/units.length*100).toFixed(0)}% ocupación)
- Renta mensual: ${Math.round(rentaTotal).toLocaleString('es-ES')}€/mes (${Math.round(rentaTotal*12).toLocaleString('es-ES')}€/año)
- Sociedades: ${children.map((c) => c.nombre).join(', ')}
- Pagos pendientes: ${pendingPayments}, atrasados: ${overdueCount}

CARTERAS FINANCIERAS: ${Math.round(valorFin).toLocaleString('es-ES')}€
- ${accounts.length} cuentas: ${accounts.map((a) => `${a.entidad} (${Math.round(a.positions.reduce((s, p) => s + p.valorActual, 0)).toLocaleString('es-ES')}€)`).join(', ')}
- P&L total: ${Math.round(pnlFin).toLocaleString('es-ES')}€
- Top posiciones: ${topPositions.map((p) => `${p.nombre}: ${Math.round(p.valorActual).toLocaleString('es-ES')}€ (P&L: ${Math.round(p.pnlNoRealizado).toLocaleString('es-ES')}€)`).join('; ')}

PRIVATE EQUITY: ${Math.round(valorPE).toLocaleString('es-ES')}€
- ${participations.length} participaciones: ${participations.map((p) => `${p.targetCompanyName} (${p.porcentaje}%, ${Math.round(p.valorEstimado || p.valorContable).toLocaleString('es-ES')}€)`).join(', ')}

TESORERÍA: ${Math.round(saldos).toLocaleString('es-ES')}€
- Por entidad: ${accounts.map((a) => `${a.entidad}: ${Math.round(a.saldoActual).toLocaleString('es-ES')}€`).join(', ')}

ASSET ALLOCATION:
- Inmobiliario: ${patrimonioTotal > 0 ? (valorInmob/patrimonioTotal*100).toFixed(1) : 0}%
- Financiero: ${patrimonioTotal > 0 ? (valorFin/patrimonioTotal*100).toFixed(1) : 0}%
- Private Equity: ${patrimonioTotal > 0 ? (valorPE/patrimonioTotal*100).toFixed(1) : 0}%
- Liquidez: ${patrimonioTotal > 0 ? (saldos/patrimonioTotal*100).toFixed(1) : 0}%`;

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return NextResponse.json({ response: 'Copiloto no disponible.' });

    const Anthropic = (await import('@anthropic-ai/sdk')).default;
    const { CLAUDE_MODEL_PRIMARY } = await import('@/lib/ai-model-config');
    const anthropic = new Anthropic({ apiKey });

    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL_PRIMARY,
      max_tokens: 1500,
      system: `Eres el copiloto patrimonial IA del Family Office. Tienes acceso a TODOS los datos financieros e inmobiliarios en tiempo real. Responde con datos concretos, números exactos, y recomendaciones accionables. Habla como un asesor financiero senior. Si te piden simular escenarios, hazlo con cálculos detallados.\n\n${context}`,
      messages: [
        ...history.map((h: any) => ({ role: h.role as 'user' | 'assistant', content: h.content })),
        { role: 'user', content: message },
      ],
    });

    const aiResponse = response.content[0].type === 'text' ? response.content[0].text : '';
    return NextResponse.json({ response: aiResponse });
  } catch (error: any) {
    logger.error('[FO AI Copilot]:', error);
    return NextResponse.json({ response: 'Error en copiloto patrimonial.' }, { status: 500 });
  }
}
