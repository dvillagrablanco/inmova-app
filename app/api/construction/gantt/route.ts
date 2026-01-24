import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/permissions';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const phaseOrder = [
  'PLANIFICACION',
  'PERMISOS',
  'CIMENTACION',
  'ESTRUCTURA',
  'CERRAMIENTOS',
  'INSTALACIONES',
  'ACABADOS',
  'ENTREGA',
  'GARANTIA',
];

const phaseMeta: Record<string, { name: string; description: string }> = {
  PLANIFICACION: { name: 'Planificacion', description: 'Definicion inicial y coordinacion' },
  PERMISOS: { name: 'Permisos', description: 'Licencias y aprobaciones' },
  CIMENTACION: { name: 'Cimentacion', description: 'Excavacion y cimentacion' },
  ESTRUCTURA: { name: 'Estructura', description: 'Pilares, forjados y cubierta' },
  CERRAMIENTOS: { name: 'Cerramientos', description: 'Fachadas y carpinteria exterior' },
  INSTALACIONES: { name: 'Instalaciones', description: 'Electricidad y fontaneria' },
  ACABADOS: { name: 'Acabados', description: 'Pavimentos y pintura' },
  ENTREGA: { name: 'Entrega', description: 'Entrega y cierre' },
  GARANTIA: { name: 'Garantia', description: 'Post entrega y garantias' },
};

const computePhaseStatus = (progress: number, endDate: Date | null) => {
  if (progress >= 100) return 'completed';
  if (endDate && endDate.getTime() < Date.now()) return 'delayed';
  if (progress > 0) return 'in_progress';
  return 'not_started';
};

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const companyId = user.companyId;

    const { searchParams } = new URL(request.url);
    const projectIdParam = searchParams.get('projectId');

    const project = projectIdParam
      ? await prisma.constructionProject.findFirst({
          where: { id: projectIdParam, companyId },
          include: { building: true },
        })
      : await prisma.constructionProject.findFirst({
          where: { companyId },
          include: { building: true },
          orderBy: { createdAt: 'desc' },
        });

    if (!project) {
      return NextResponse.json({
        summary: null,
        permits: [],
        phases: [],
      });
    }

    const [permitsRaw, tasksRaw] = await Promise.all([
      prisma.constructionPermit.findMany({
        where: { projectId: project.id, companyId },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.constructionWorkOrder.findMany({
        where: { projectId: project.id },
        orderBy: { fechaInicio: 'asc' },
      }),
    ]);

    const permits = permitsRaw.map((permit) => ({
      id: permit.id,
      name: permit.nombre,
      type: permit.tipo,
      status: permit.estado,
      deadline: permit.fechaLimite ? permit.fechaLimite.toISOString() : null,
      issuer: permit.emisor,
      cost: permit.costo ?? null,
      required: permit.requerido,
    }));

    const phaseMap = new Map<string, typeof tasksRaw>();
    for (const task of tasksRaw) {
      const phaseKey = task.fase;
      const current = phaseMap.get(phaseKey) || [];
      current.push(task);
      phaseMap.set(phaseKey, current);
    }

    const phases = Array.from(phaseMap.entries())
      .sort((a, b) => phaseOrder.indexOf(a[0]) - phaseOrder.indexOf(b[0]))
      .map(([phaseKey, tasks]) => {
        const sortedTasks = [...tasks].sort(
          (a, b) => a.fechaInicio.getTime() - b.fechaInicio.getTime()
        );
        const startDate = sortedTasks[0]?.fechaInicio || null;
        const endDate = sortedTasks[sortedTasks.length - 1]?.fechaFin || null;
        const duration =
          startDate && endDate
            ? Math.max(
                1,
                Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
              )
            : 0;
        const progress = Math.round(
          sortedTasks.reduce((sum, task) => sum + task.porcentajeAvance, 0) /
            sortedTasks.length
        );
        const budget = sortedTasks.reduce((sum, task) => sum + task.presupuesto, 0);
        const spent = sortedTasks.reduce((sum, task) => sum + (task.costoReal || 0), 0);
        const milestones = sortedTasks.map((task) => task.titulo).slice(0, 5);

        return {
          id: `${project.id}-${phaseKey}`,
          name: phaseMeta[phaseKey]?.name || phaseKey,
          description: phaseMeta[phaseKey]?.description || '',
          startDate: startDate ? startDate.toISOString() : '',
          endDate: endDate ? endDate.toISOString() : '',
          duration,
          progress,
          status: computePhaseStatus(progress, endDate),
          budget,
          spent,
          milestones,
        };
      });

    const summary = {
      projectId: project.id,
      name: project.nombre,
      address: project.direccion || project.building?.direccion || '',
      units: project.numViviendas || project.building?.numeroUnidades || null,
      buildingName: project.building?.nombre || null,
    };

    return NextResponse.json({
      summary,
      permits,
      phases,
    });
  } catch (error) {
    logger.error('[Construction Gantt] Error loading data', error);
    if (error instanceof Error && error.message.includes('No autenticado')) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Error al cargar gantt' }, { status: 500 });
  }
}
