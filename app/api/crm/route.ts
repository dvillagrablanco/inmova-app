import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const leadSchema = z.object({
  nombre: z.string().min(1),
  email: z.string().email(),
  telefono: z.string().optional(),
  empresa: z.string().optional(),
  origen: z.enum(['web', 'referido', 'llamada', 'evento', 'otro']),
  estado: z.enum(['nuevo', 'contactado', 'calificado', 'propuesta', 'negociacion', 'ganado', 'perdido']).default('nuevo'),
  valorEstimado: z.number().optional(),
  notas: z.string().optional(),
  asignadoA: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const estado = searchParams.get('estado');
    const origen = searchParams.get('origen');
    const asignadoA = searchParams.get('asignadoA');

    try {
      const leads = await prisma.cRMLead.findMany({
        where: {
          companyId: session.user.companyId,
          ...(estado && { estado }),
          ...(origen && { origen }),
          ...(asignadoA && { asignadoA }),
        },
        include: {
          actividades: {
            orderBy: { createdAt: 'desc' },
            take: 5,
          },
          asignado: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      // Calcular métricas del pipeline
      const pipeline = {
        nuevo: leads.filter((l: any) => l.estado === 'nuevo').length,
        contactado: leads.filter((l: any) => l.estado === 'contactado').length,
        calificado: leads.filter((l: any) => l.estado === 'calificado').length,
        propuesta: leads.filter((l: any) => l.estado === 'propuesta').length,
        negociacion: leads.filter((l: any) => l.estado === 'negociacion').length,
        ganado: leads.filter((l: any) => l.estado === 'ganado').length,
        perdido: leads.filter((l: any) => l.estado === 'perdido').length,
      };

      const valorTotal = leads
        .filter((l: any) => l.estado !== 'perdido')
        .reduce((sum: number, l: any) => sum + (l.valorEstimado || 0), 0);

      return NextResponse.json({
        leads,
        pipeline,
        metricas: {
          total: leads.length,
          valorTotal,
          tasaConversion: leads.length > 0 
            ? (pipeline.ganado / leads.length * 100).toFixed(1) 
            : 0,
        },
      });
    } catch {
      return NextResponse.json({
        leads: [],
        pipeline: { nuevo: 0, contactado: 0, calificado: 0, propuesta: 0, negociacion: 0, ganado: 0, perdido: 0 },
        metricas: { total: 0, valorTotal: 0, tasaConversion: 0 },
      });
    }
  } catch (error: any) {
    console.error('[API CRM] Error:', error);
    return NextResponse.json({ error: 'Error al obtener leads' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const validated = leadSchema.parse(body);

    try {
      const lead = await prisma.cRMLead.create({
        data: {
          ...validated,
          companyId: session.user.companyId,
          createdBy: session.user.id,
        },
      });

      // Crear actividad de creación
      await prisma.cRMActividad.create({
        data: {
          leadId: lead.id,
          tipo: 'nota',
          descripcion: 'Lead creado',
          createdBy: session.user.id,
        },
      });

      return NextResponse.json(lead, { status: 201 });
    } catch (dbError) {
      console.warn('[API CRM] Error de BD:', dbError);
      return NextResponse.json({ error: 'Funcionalidad no disponible' }, { status: 503 });
    }
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Datos inválidos', details: error.errors }, { status: 400 });
    }
    console.error('[API CRM] Error:', error);
    return NextResponse.json({ error: 'Error al crear lead' }, { status: 500 });
  }
}
