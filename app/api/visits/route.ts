import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Schema de validación para crear visita
const createVisitSchema = z.object({
  candidateId: z.string().min(1, 'ID de candidato requerido'),
  fechaVisita: z.string().or(z.date()).transform(val => new Date(val)),
  confirmada: z.boolean().optional().default(false),
  feedback: z.string().optional(),
});

// GET - Obtener visitas
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const companyId = session.user.companyId;
    if (!companyId) {
      return NextResponse.json([]);
    }

    const { searchParams } = new URL(request.url);
    const candidateId = searchParams.get('candidateId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const confirmed = searchParams.get('confirmed');

    // Construir filtro
    const where: any = {
      candidate: {
        companyId: companyId,
      },
    };

    if (candidateId) {
      where.candidateId = candidateId;
    }

    if (startDate || endDate) {
      where.fechaVisita = {};
      if (startDate) {
        where.fechaVisita.gte = new Date(startDate);
      }
      if (endDate) {
        where.fechaVisita.lte = new Date(endDate);
      }
    }

    if (confirmed !== null && confirmed !== undefined) {
      where.confirmada = confirmed === 'true';
    }

    const visits = await prisma.visit.findMany({
      where,
      include: {
        candidate: {
          select: {
            id: true,
            nombre: true,
            apellidos: true,
            email: true,
            telefono: true,
            unit: {
              select: {
                id: true,
                numero: true,
                building: {
                  select: {
                    id: true,
                    nombre: true,
                    direccion: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { fechaVisita: 'desc' },
    });

    // Transformar datos para el frontend
    const transformedVisits = visits.map(visit => ({
      id: visit.id,
      candidateId: visit.candidateId,
      visitorName: `${visit.candidate.nombre} ${visit.candidate.apellidos || ''}`.trim(),
      visitorEmail: visit.candidate.email,
      visitorPhone: visit.candidate.telefono,
      propertyAddress: visit.candidate.unit?.building?.direccion || '',
      propertyId: visit.candidate.unit?.id || '',
      unitNumber: visit.candidate.unit?.numero || '',
      buildingName: visit.candidate.unit?.building?.nombre || '',
      scheduledDate: visit.fechaVisita.toISOString().split('T')[0],
      scheduledTime: visit.fechaVisita.toISOString().split('T')[1]?.substring(0, 5) || '10:00',
      status: visit.asistio === true ? 'completed' : visit.asistio === false ? 'cancelled' : (visit.confirmada ? 'confirmed' : 'scheduled'),
      confirmed: visit.confirmada,
      attended: visit.asistio,
      feedback: visit.feedback,
      createdAt: visit.createdAt.toISOString(),
      updatedAt: visit.updatedAt.toISOString(),
    }));

    return NextResponse.json(transformedVisits);
  } catch (error) {
    logger.error('Error fetching visits:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// POST - Crear nueva visita
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    
    // Validar datos
    const validationResult = createVisitSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { candidateId, fechaVisita, confirmada, feedback } = validationResult.data;

    // Verificar que el candidato existe y pertenece a la empresa del usuario
    const candidate = await prisma.candidate.findFirst({
      where: {
        id: candidateId,
        companyId: session.user.companyId,
      },
      select: {
        id: true,
        nombre: true,
        apellidos: true,
      },
    });

    if (!candidate) {
      return NextResponse.json({ error: 'Candidato no encontrado' }, { status: 404 });
    }

    // Crear visita
    const visit = await prisma.visit.create({
      data: {
        candidateId,
        fechaVisita,
        confirmada,
        feedback,
      },
      include: {
        candidate: {
          select: {
            id: true,
            nombre: true,
            apellidos: true,
            email: true,
            telefono: true,
          },
        },
      },
    });

    logger.info('Visit created', { visitId: visit.id, candidateId });

    return NextResponse.json({
      id: visit.id,
      candidateId: visit.candidateId,
      visitorName: `${visit.candidate.nombre} ${visit.candidate.apellidos || ''}`.trim(),
      visitorEmail: visit.candidate.email,
      visitorPhone: visit.candidate.telefono,
      scheduledDate: visit.fechaVisita.toISOString().split('T')[0],
      scheduledTime: visit.fechaVisita.toISOString().split('T')[1]?.substring(0, 5) || '10:00',
      status: visit.confirmada ? 'confirmed' : 'scheduled',
      confirmed: visit.confirmada,
      feedback: visit.feedback,
      createdAt: visit.createdAt.toISOString(),
    }, { status: 201 });
  } catch (error) {
    logger.error('Error creating visit:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// PUT - Actualizar visita
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { id, confirmada, asistio, feedback, fechaVisita } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID de visita requerido' }, { status: 400 });
    }

    // Verificar que la visita existe y pertenece a la empresa
    const existingVisit = await prisma.visit.findFirst({
      where: {
        id,
        candidate: {
          companyId: session.user.companyId,
        },
      },
    });

    if (!existingVisit) {
      return NextResponse.json({ error: 'Visita no encontrada' }, { status: 404 });
    }

    // Actualizar visita
    const visit = await prisma.visit.update({
      where: { id },
      data: {
        ...(confirmada !== undefined && { confirmada }),
        ...(asistio !== undefined && { asistio }),
        ...(feedback !== undefined && { feedback }),
        ...(fechaVisita && { fechaVisita: new Date(fechaVisita) }),
      },
      include: {
        candidate: {
          select: {
            id: true,
            nombre: true,
            apellidos: true,
          },
        },
      },
    });

    logger.info('Visit updated', { visitId: visit.id });

    return NextResponse.json({
      id: visit.id,
      candidateId: visit.candidateId,
      visitorName: `${visit.candidate.nombre} ${visit.candidate.apellidos || ''}`.trim(),
      status: visit.asistio === true ? 'completed' : visit.asistio === false ? 'cancelled' : (visit.confirmada ? 'confirmed' : 'scheduled'),
      confirmed: visit.confirmada,
      attended: visit.asistio,
      feedback: visit.feedback,
      updatedAt: visit.updatedAt.toISOString(),
    });
  } catch (error) {
    logger.error('Error updating visit:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
