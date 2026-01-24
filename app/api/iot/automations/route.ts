import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const extractAction = (actions: unknown) => {
  if (!actions) return 'Accion configurada';
  if (typeof actions === 'string') return actions;
  if (Array.isArray(actions)) {
    return actions.map((item) => (typeof item === 'string' ? item : JSON.stringify(item))).join(' • ');
  }
  if (typeof actions === 'object') {
    const actionObj = actions as Record<string, unknown>;
    return (
      (actionObj.accion as string) ||
      (actionObj.action as string) ||
      (actionObj.tipo as string) ||
      JSON.stringify(actionObj)
    );
  }
  return String(actions);
};

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const automations = await prisma.ioTAutomation.findMany({
      where: { companyId: session.user.companyId },
      include: { device: { select: { nombre: true } } },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = automations.map((automation) => ({
      id: automation.id,
      name: automation.nombre,
      trigger: automation.descripcion || automation.tipo,
      action: extractAction(automation.acciones),
      enabled: automation.activa,
      lastTriggered: automation.ultimaEjecucion?.toISOString() || undefined,
    }));

    return NextResponse.json({ automations: formatted });
  } catch (error) {
    logger.error('[IoT] Error loading automations:', error);
    return NextResponse.json({ error: 'Error al cargar automatizaciones' }, { status: 500 });
  }
}
