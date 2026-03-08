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

const PIPELINE_STAGES = ['nuevo', 'contactado', 'visita', 'negociacion', 'propuesta', 'convertido', 'perdido'];

/**
 * GET /api/portal-comercial/pipeline — Leads grouped by stage (Kanban)
 * PATCH /api/portal-comercial/pipeline — Move lead to different stage
 */
export async function GET(request: NextRequest) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) return NextResponse.json({ error: 'No auth' }, { status: 401 });

    const { resolveCompanyScope } = await import('@/lib/company-scope');
    const scope = await resolveCompanyScope({ userId: session.user.id as string, role: (session.user as any).role, primaryCompanyId: session.user.companyId, request });

    const leads = await prisma.lead.findMany({
      where: { companyId: { in: scope.scopeCompanyIds } },
      select: { id: true, nombre: true, email: true, telefono: true, empresa: true, estado: true, prioridad: true, source: true, createdAt: true, updatedAt: true },
      orderBy: { updatedAt: 'desc' },
      take: 200,
    });

    // Group by stage
    const pipeline: Record<string, any[]> = {};
    for (const stage of PIPELINE_STAGES) pipeline[stage] = [];
    for (const lead of leads) {
      const stage = PIPELINE_STAGES.includes(lead.estado) ? lead.estado : 'nuevo';
      pipeline[stage].push(lead);
    }

    const stats = {
      total: leads.length,
      byStage: Object.entries(pipeline).map(([stage, items]) => ({ stage, count: items.length })),
      conversionRate: leads.length > 0 ? Math.round(pipeline.convertido.length / leads.length * 100) : 0,
    };

    return NextResponse.json({ success: true, pipeline, stages: PIPELINE_STAGES, stats });
  } catch (error: any) {
    logger.error('[Commercial Pipeline]:', error);
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const prisma = await getPrisma();
  try {
    const { leadId, newStage } = await request.json();
    if (!leadId || !newStage) return NextResponse.json({ error: 'leadId and newStage required' }, { status: 400 });

    if (!PIPELINE_STAGES.includes(newStage)) return NextResponse.json({ error: 'Invalid stage' }, { status: 400 });

    await prisma.lead.update({ where: { id: leadId }, data: { estado: newStage } });

    return NextResponse.json({ success: true, message: `Lead moved to ${newStage}` });
  } catch (error: any) {
    logger.error('[Pipeline Move]:', error);
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}
