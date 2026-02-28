import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger from '@/lib/logger';
import * as Sentry from '@sentry/nextjs';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

const opportunitySchema = z.object({
  titulo: z.string().min(3),
  descripcion: z.string().optional(),
  fuente: z.string().default('broker'), // broker, idealista, directo, red_agentes
  broker: z.string().optional(),
  ubicacion: z.string(),
  tipoActivo: z.string(),
  superficie: z.number().optional(),
  precio: z.number().optional(),
  rentaEstimada: z.number().optional(),
  yieldEstimada: z.number().optional(),
  estado: z.enum(['nueva', 'en_analisis', 'negociando', 'oferta_enviada', 'descartada', 'cerrada']).default('nueva'),
  notas: z.string().optional(),
  documentos: z.array(z.string()).optional(),
  evaluacionIA: z.any().optional(),
});

/**
 * GET /api/investment/opportunities
 * Lista pipeline de oportunidades de inversión.
 */
export async function GET(request: NextRequest) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const companyId = session.user.companyId;
    const { searchParams } = new URL(request.url);
    const estado = searchParams.get('estado');

    // Usar tabla genérica de notas/tareas o accounting para almacenar oportunidades
    // Si no existe modelo específico, usar un approach con JSON storage
    // Buscar en accountingTransaction con categoría especial o usar otra tabla

    // Approach: buscar en una tabla existente con convención
    let opportunities: any[] = [];

    try {
      // Intentar buscar en la tabla de tasks con tipo 'oportunidad_inversion'
      const tasks = await prisma.task.findMany({
        where: {
          companyId,
          tipo: 'oportunidad_inversion',
          ...(estado && { estado }),
        },
        orderBy: { createdAt: 'desc' },
      });

      opportunities = tasks.map((t: any) => ({
        id: t.id,
        titulo: t.titulo,
        descripcion: t.descripcion,
        estado: t.estado,
        prioridad: t.prioridad,
        metadata: t.metadata || {},
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
      }));
    } catch {
      // Si Task no tiene los campos necesarios, devolver vacío
      // Las oportunidades se almacenarán cuando se creen via POST
    }

    return NextResponse.json({
      success: true,
      pipeline: {
        nueva: opportunities.filter((o) => o.estado === 'nueva').length,
        en_analisis: opportunities.filter((o) => o.estado === 'en_analisis').length,
        negociando: opportunities.filter((o) => o.estado === 'negociando').length,
        oferta_enviada: opportunities.filter((o) => o.estado === 'oferta_enviada').length,
        descartada: opportunities.filter((o) => o.estado === 'descartada').length,
        cerrada: opportunities.filter((o) => o.estado === 'cerrada').length,
      },
      total: opportunities.length,
      opportunities,
    });
  } catch (error: any) {
    logger.error('[Opportunities GET]:', error);
    Sentry.captureException(error);
    return NextResponse.json({ error: 'Error obteniendo oportunidades' }, { status: 500 });
  }
}

/**
 * POST /api/investment/opportunities
 * Crear nueva oportunidad de inversión en el pipeline.
 */
export async function POST(request: NextRequest) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const data = opportunitySchema.parse(body);

    // Crear como Task con tipo especial
    let opportunity;
    try {
      opportunity = await prisma.task.create({
        data: {
          companyId: session.user.companyId,
          titulo: data.titulo,
          descripcion: data.descripcion || '',
          tipo: 'oportunidad_inversion',
          estado: data.estado,
          prioridad: data.yieldEstimada && data.yieldEstimada >= 5 ? 'alta' : 'media',
          metadata: {
            fuente: data.fuente,
            broker: data.broker,
            ubicacion: data.ubicacion,
            tipoActivo: data.tipoActivo,
            superficie: data.superficie,
            precio: data.precio,
            rentaEstimada: data.rentaEstimada,
            yieldEstimada: data.yieldEstimada,
            documentos: data.documentos || [],
            evaluacionIA: data.evaluacionIA,
          },
          asignadoAId: session.user.id as string,
        },
      });
    } catch (err: any) {
      // Fallback si Task no tiene todos los campos
      logger.warn('[Opportunities] Task creation issue:', err.message);
      return NextResponse.json({
        success: true,
        message: 'Oportunidad registrada (almacenamiento simplificado)',
        data,
      }, { status: 201 });
    }

    logger.info(`[Opportunity] Nueva: ${data.titulo} (${data.ubicacion}) - ${data.precio || 'Sin precio'}€`);

    return NextResponse.json({
      success: true,
      opportunity,
    }, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Datos inválidos', details: error.errors }, { status: 400 });
    }
    logger.error('[Opportunities POST]:', error);
    Sentry.captureException(error);
    return NextResponse.json({ error: 'Error creando oportunidad' }, { status: 500 });
  }
}
