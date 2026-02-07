import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';

import { authOptions } from '@/lib/auth-options';
import { getPrismaClient } from '@/lib/db';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const querySchema = z.object({
  projectId: z.string().min(1).optional(),
});

const PHASES = [
  'PLANIFICACION',
  'PERMISOS',
  'CIMENTACION',
  'ESTRUCTURA',
  'CERRAMIENTOS',
  'INSTALACIONES',
  'ACABADOS',
  'ENTREGA',
  'GARANTIA',
] as const;

type PhaseKey = (typeof PHASES)[number];
type PhaseStatus = 'not_started' | 'in_progress' | 'completed' | 'delayed';
type PermitStatus = 'pending' | 'submitted' | 'approved' | 'rejected' | 'unknown';

interface PermitResponse {
  id: string;
  name: string;
  type: string | null;
  status: PermitStatus;
  deadline: string | null;
  issuer: string | null;
  cost: number | null;
  required?: boolean;
}

interface PhaseResponse {
  id: string;
  name: string;
  description: string | null;
  startDate: string | null;
  endDate: string | null;
  duration: number;
  progress: number;
  status: PhaseStatus;
  budget: number;
  spent: number;
  milestones: string[];
}

interface ProjectSummary {
  id: string;
  nombre: string;
  direccion: string;
  numViviendas: number | null;
  buildingName: string | null;
}

const PHASE_LABELS: Record<PhaseKey, string> = {
  PLANIFICACION: 'Planificación',
  PERMISOS: 'Permisos',
  CIMENTACION: 'Cimentación',
  ESTRUCTURA: 'Estructura',
  CERRAMIENTOS: 'Cerramientos',
  INSTALACIONES: 'Instalaciones',
  ACABADOS: 'Acabados',
  ENTREGA: 'Entrega',
  GARANTIA: 'Garantía',
};

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return 'Error desconocido';
}

function toDateString(date: Date | null): string | null {
  if (!date) {
    return null;
  }
  return date.toISOString().split('T')[0];
}

function average(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }
  const sum = values.reduce((acc, value) => acc + value, 0);
  return sum / values.length;
}

function getMinDate(dates: Date[]): Date | null {
  if (dates.length === 0) {
    return null;
  }
  const minValue = Math.min(...dates.map((date) => date.getTime()));
  return new Date(minValue);
}

function getMaxDate(dates: Date[]): Date | null {
  if (dates.length === 0) {
    return null;
  }
  const maxValue = Math.max(...dates.map((date) => date.getTime()));
  return new Date(maxValue);
}

function getPhaseStatus(progress: number, endDate: Date | null, hasTasks: boolean): PhaseStatus {
  if (!hasTasks) {
    return 'not_started';
  }
  if (progress >= 100) {
    return 'completed';
  }
  const now = Date.now();
  if (endDate && endDate.getTime() < now && progress < 100) {
    return 'delayed';
  }
  if (progress > 0) {
    return 'in_progress';
  }
  return 'not_started';
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const parsedQuery = querySchema.safeParse({
      projectId: searchParams.get('projectId') ?? undefined,
    });

    if (!parsedQuery.success) {
      return NextResponse.json(
        { error: 'Parámetros inválidos', details: parsedQuery.error.errors },
        { status: 400 }
      );
    }

    const prisma = getPrismaClient();
    const project = await prisma.constructionProject.findFirst({
      where: {
        companyId: session.user.companyId,
        ...(parsedQuery.data.projectId ? { id: parsedQuery.data.projectId } : {}),
      },
      include: {
        workOrders: true,
        building: {
          select: {
            nombre: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!project) {
      return NextResponse.json({
        success: true,
        project: null,
        permits: [],
        phases: [],
      });
    }

    const permits: PermitResponse[] = [];
    const pushPermit = (permit: PermitResponse) => {
      permits.push(permit);
    };

    pushPermit({
      id: 'licencia-obra',
      name: 'Licencia de obra',
      type: 'Licencia',
      status: project.licenciaObra ? 'approved' : 'pending',
      deadline: null,
      issuer: null,
      cost: null,
      required: true,
    });

    pushPermit({
      id: 'certificado-final',
      name: 'Certificado final de obra',
      type: 'Certificación',
      status: project.certificadoFinal ? 'approved' : 'pending',
      deadline: null,
      issuer: null,
      cost: null,
      required: true,
    });

    pushPermit({
      id: 'habitabilidad',
      name: 'Cédula de habitabilidad',
      type: 'Licencia',
      status: project.habitabilidad ? 'approved' : 'pending',
      deadline: null,
      issuer: null,
      cost: null,
      required: true,
    });

    project.permisos.forEach((permiso, index) => {
      const nombre = permiso.trim();
      if (!nombre) {
        return;
      }
      pushPermit({
        id: `permiso-${index}`,
        name: nombre,
        type: null,
        status: 'unknown',
        deadline: null,
        issuer: null,
        cost: null,
      });
    });

    project.certificaciones.forEach((certificacion, index) => {
      const nombre = certificacion.trim();
      if (!nombre) {
        return;
      }
      pushPermit({
        id: `certificacion-${index}`,
        name: nombre,
        type: 'Certificación',
        status: 'unknown',
        deadline: null,
        issuer: null,
        cost: null,
      });
    });

    const phaseSet = new Set<PhaseKey>();
    project.workOrders.forEach((order) => {
      phaseSet.add(order.fase as PhaseKey);
    });
    phaseSet.add(project.faseActual as PhaseKey);

    const phases: PhaseResponse[] = PHASES.filter((phase) => phaseSet.has(phase)).map((phase) => {
      const workOrders = project.workOrders.filter((order) => order.fase === phase);
      const startDates = workOrders.map((order) => order.fechaInicio);
      const endDates = workOrders.map((order) => order.fechaFin);
      const startDate = getMinDate(startDates);
      const endDate = getMaxDate(endDates);
      const progress = Math.round(average(workOrders.map((order) => order.porcentajeAvance)));
      const budget = workOrders.reduce((sum, order) => sum + order.presupuesto, 0);
      const spent = workOrders.reduce((sum, order) => sum + (order.costoReal ?? 0), 0);
      const duration =
        startDate && endDate
          ? Math.max(
              0,
              Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
            )
          : 0;
      const milestones = workOrders
        .map((order) => order.titulo)
        .filter((title) => title.trim().length > 0)
        .slice(0, 6);

      return {
        id: phase,
        name: PHASE_LABELS[phase],
        description: workOrders.length > 0 ? workOrders[0].descripcion : null,
        startDate: toDateString(startDate),
        endDate: toDateString(endDate),
        duration,
        progress,
        status: getPhaseStatus(progress, endDate, workOrders.length > 0),
        budget,
        spent,
        milestones,
      };
    });

    const projectSummary: ProjectSummary = {
      id: project.id,
      nombre: project.nombre,
      direccion: project.direccion,
      numViviendas: project.numViviendas ?? null,
      buildingName: project.building?.nombre ?? null,
    };

    return NextResponse.json({
      success: true,
      project: projectSummary,
      permits,
      phases,
    });
  } catch (error: unknown) {
    logger.error('[API Construction Gantt] Error:', error);
    return NextResponse.json(
      { error: 'Error al cargar datos de construcción', details: getErrorMessage(error) },
      { status: 500 }
    );
  }
}
