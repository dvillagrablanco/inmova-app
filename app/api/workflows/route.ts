import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const workflowSchema = z.object({
  nombre: z.string().min(1),
  descripcion: z.string().optional(),
  trigger: z.enum(['manual', 'nuevo_contrato', 'pago_vencido', 'nuevo_inquilino', 'mantenimiento', 'contrato_vencimiento', 'custom']),
  pasos: z.array(z.object({
    orden: z.number(),
    tipo: z.enum(['email', 'sms', 'tarea', 'notificacion', 'webhook', 'espera']),
    config: z.record(z.any()),
  })),
  activo: z.boolean().default(true),
});

// Templates de workflows predefinidos
const WORKFLOW_TEMPLATES = [
  {
    id: 'wf-template-1',
    nombre: 'Onboarding Nuevo Inquilino',
    descripcion: 'Secuencia automática de bienvenida para nuevos inquilinos',
    trigger: 'nuevo_inquilino',
    pasos: [
      { orden: 1, tipo: 'email', config: { template: 'bienvenida', delay: 0 } },
      { orden: 2, tipo: 'espera', config: { dias: 1 } },
      { orden: 3, tipo: 'sms', config: { mensaje: 'Recordatorio de documentación' } },
      { orden: 4, tipo: 'tarea', config: { asignar: 'gestor', titulo: 'Verificar documentos' } },
    ],
    categoria: 'inquilinos',
  },
  {
    id: 'wf-template-2',
    nombre: 'Recordatorio Pago Vencido',
    descripcion: 'Escalada automática de cobro de pagos vencidos',
    trigger: 'pago_vencido',
    pasos: [
      { orden: 1, tipo: 'email', config: { template: 'recordatorio_pago', delay: 0 } },
      { orden: 2, tipo: 'espera', config: { dias: 3 } },
      { orden: 3, tipo: 'sms', config: { mensaje: 'Recordatorio de pago pendiente' } },
      { orden: 4, tipo: 'espera', config: { dias: 7 } },
      { orden: 5, tipo: 'tarea', config: { asignar: 'gestor', titulo: 'Llamar al inquilino', prioridad: 'alta' } },
    ],
    categoria: 'pagos',
  },
  {
    id: 'wf-template-3',
    nombre: 'Renovación de Contrato',
    descripcion: 'Recordatorios automáticos antes del vencimiento',
    trigger: 'contrato_vencimiento',
    pasos: [
      { orden: 1, tipo: 'notificacion', config: { titulo: 'Contrato próximo a vencer', diasAntes: 90 } },
      { orden: 2, tipo: 'email', config: { template: 'renovacion', diasAntes: 60 } },
      { orden: 3, tipo: 'tarea', config: { asignar: 'gestor', titulo: 'Preparar renovación', diasAntes: 45 } },
      { orden: 4, tipo: 'email', config: { template: 'propuesta_renovacion', diasAntes: 30 } },
    ],
    categoria: 'contratos',
  },
];

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tipo = searchParams.get('tipo');
    const includeTemplates = searchParams.get('templates') === 'true';

    try {
      const workflows = await prisma.workflow.findMany({
        where: {
          companyId: session.user.companyId,
          ...(tipo && { trigger: tipo }),
        },
        include: {
          pasos: { orderBy: { orden: 'asc' } },
          ejecuciones: {
            orderBy: { createdAt: 'desc' },
            take: 10,
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      const response: any = {
        workflows,
        metricas: {
          total: workflows.length,
          activos: workflows.filter((w: any) => w.activo).length,
          ejecucionesHoy: 0, // TODO: calcular
        },
      };

      if (includeTemplates) {
        response.templates = WORKFLOW_TEMPLATES;
      }

      return NextResponse.json(response);
    } catch {
      return NextResponse.json({
        workflows: [],
        templates: includeTemplates ? WORKFLOW_TEMPLATES : undefined,
        metricas: { total: 0, activos: 0, ejecucionesHoy: 0 },
      });
    }
  } catch (error: any) {
    console.error('[API Workflows] Error:', error);
    return NextResponse.json({ error: 'Error al obtener workflows' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const validated = workflowSchema.parse(body);

    try {
      const workflow = await prisma.workflow.create({
        data: {
          nombre: validated.nombre,
          descripcion: validated.descripcion,
          trigger: validated.trigger,
          activo: validated.activo,
          companyId: session.user.companyId,
          createdBy: session.user.id,
          pasos: {
            create: validated.pasos.map(p => ({
              orden: p.orden,
              tipo: p.tipo,
              config: p.config,
            })),
          },
        },
        include: { pasos: true },
      });

      return NextResponse.json(workflow, { status: 201 });
    } catch (dbError) {
      console.warn('[API Workflows] Error de BD:', dbError);
      return NextResponse.json({ error: 'Funcionalidad no disponible' }, { status: 503 });
    }
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Datos inválidos', details: error.errors }, { status: 400 });
    }
    console.error('[API Workflows] Error:', error);
    return NextResponse.json({ error: 'Error al crear workflow' }, { status: 500 });
  }
}
