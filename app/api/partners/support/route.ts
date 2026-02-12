/**
 * API de Soporte para Partners
 * 
 * Gestión de tickets de soporte conectada a BD (SupportTicket)
 */

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

export async function GET() {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const companyId = (session.user as any).companyId;

    const tickets = await prisma.supportTicket.findMany({
      where: {
        OR: [
          ...(userId ? [{ userId }] : []),
          ...(companyId ? [{ companyId }] : []),
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const mapped = tickets.map((t: any) => ({
      id: t.id,
      asunto: t.subject,
      categoria: t.category,
      estado: t.status === 'open' ? 'abierto' : t.status === 'in_progress' ? 'en_progreso' : t.status === 'resolved' ? 'resuelto' : 'cerrado',
      prioridad: t.priority === 'low' ? 'baja' : t.priority === 'high' ? 'alta' : 'media',
      fechaCreacion: t.createdAt,
      ultimaActualizacion: t.updatedAt,
    }));

    return NextResponse.json({
      success: true,
      data: mapped,
    });
  } catch (error) {
    logger.error('[API Error] Partners Support:', error);
    return NextResponse.json({ error: 'Error obteniendo tickets' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const { asunto, categoria, prioridad, descripcion } = body;

    if (!asunto || !descripcion) {
      return NextResponse.json({ error: 'Asunto y descripción son requeridos' }, { status: 400 });
    }

    const userId = (session.user as any).id;
    const companyId = (session.user as any).companyId;

    const ticket = await prisma.supportTicket.create({
      data: {
        userId,
        companyId,
        subject: asunto,
        description: descripcion,
        category: categoria || 'question',
        priority: prioridad === 'alta' ? 'high' : prioridad === 'baja' ? 'low' : 'medium',
        status: 'open',
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: ticket.id,
        asunto: ticket.subject,
        categoria: ticket.category,
        estado: 'abierto',
        prioridad: prioridad || 'media',
        fechaCreacion: ticket.createdAt,
        ultimaActualizacion: ticket.updatedAt,
      },
    }, { status: 201 });
  } catch (error) {
    logger.error('[API Error] Create Ticket:', error);
    return NextResponse.json({ error: 'Error creando ticket' }, { status: 500 });
  }
}
