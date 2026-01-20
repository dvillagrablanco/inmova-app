/**
 * API para gestionar invitaciones de partners
 * 
 * GET /api/admin/partners/invitations - Listar invitaciones
 * POST /api/admin/partners/invitations - Crear nueva invitación
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { z } from 'zod';

import logger from '@/lib/logger';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const createInvitationSchema = z.object({
  email: z.string().email(),
  nombre: z.string().optional(),
  empresa: z.string().optional(),
  mensaje: z.string().optional(),
  comisionOfrecida: z.number().min(0).max(100).default(15),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { getPrismaClient } = await import('@/lib/db');
    const prisma = getPrismaClient();

    // Buscar invitaciones en PartnerInvitation si existe, o en Partner con estado PENDING
    const invitations = await prisma.partner.findMany({
      where: {
        status: 'PENDING',
      },
      orderBy: { createdAt: 'desc' },
    });

    // Calcular estadísticas
    const allPartners = await prisma.partner.findMany();
    const stats = {
      total: allPartners.length,
      pendientes: allPartners.filter(p => p.status === 'PENDING').length,
      aceptadas: allPartners.filter(p => p.status === 'ACTIVE').length,
      expiradas: 0,
      tasaConversion: allPartners.length > 0 
        ? Math.round((allPartners.filter(p => p.status === 'ACTIVE').length / allPartners.length) * 100)
        : 0,
    };

    // Formatear invitaciones
    const formattedInvitations = invitations.map(inv => ({
      id: inv.id,
      email: inv.email,
      nombre: inv.contactName || inv.companyName,
      empresa: inv.companyName,
      estado: inv.status === 'PENDING' ? 'pending' : inv.status === 'ACTIVE' ? 'accepted' : 'expired',
      tokenExpira: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 días
      invitationLink: `https://inmovaapp.com/partners/join?token=${inv.id}`,
      enviadoPor: 'Admin',
      creadoEn: inv.createdAt.toISOString(),
      comisionOfrecida: inv.commissionRate || 15,
    }));

    return NextResponse.json({
      success: true,
      data: formattedInvitations,
      stats,
    });
  } catch (error: any) {
    logger.error('[Partner Invitations GET Error]:', error);
    return NextResponse.json({ error: 'Error obteniendo invitaciones' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const validated = createInvitationSchema.parse(body);

    const { getPrismaClient } = await import('@/lib/db');
    const prisma = getPrismaClient();

    // Verificar si ya existe un partner con ese email
    const existing = await prisma.partner.findFirst({
      where: { email: validated.email },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Ya existe una invitación o partner con ese email' },
        { status: 400 }
      );
    }

    // Crear partner en estado PENDING (invitación)
    const partner = await prisma.partner.create({
      data: {
        email: validated.email,
        companyName: validated.empresa || validated.email.split('@')[0],
        contactName: validated.nombre,
        phone: '',
        type: 'RESELLER',
        status: 'PENDING',
        commissionRate: validated.comisionOfrecida,
      },
    });

    // TODO: Enviar email de invitación

    return NextResponse.json({
      success: true,
      data: {
        id: partner.id,
        email: partner.email,
        estado: 'pending',
        invitationLink: `https://inmovaapp.com/partners/join?token=${partner.id}`,
      },
      message: 'Invitación creada exitosamente',
    });
  } catch (error: any) {
    logger.error('[Partner Invitations POST Error]:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Datos inválidos', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Error creando invitación' }, { status: 500 });
  }
}
