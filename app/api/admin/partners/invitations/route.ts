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
import crypto from 'crypto';

import { sendEmail } from '@/lib/email-service';
import logger from '@/lib/logger';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const createInvitationSchema = z.object({
  email: z.string().email(),
  nombre: z.string().optional(),
  empresa: z.string().optional(),
  mensaje: z.string().optional(),
  comisionOfrecida: z.number().min(0).max(100).default(15),
  partnerId: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const sessionUser = session?.user as { role?: string | null } | undefined;
    if (!session?.user || sessionUser?.role !== 'super_admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { getPrismaClient } = await import('@/lib/db');
    const prisma = getPrismaClient();

    const [invitations, statusCounts] = await prisma.$transaction([
      prisma.partnerInvitation.findMany({
        include: {
          partner: {
            select: { nombre: true, comisionPorcentaje: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.partnerInvitation.groupBy({
        by: ['estado'],
        orderBy: { estado: 'asc' },
        _count: { _all: true },
      }),
    ]);

    const getCount = (item?: (typeof statusCounts)[number]) => {
      if (!item || typeof item._count !== 'object' || item._count === null) {
        return 0;
      }
      const countValue = (item._count as { _all?: number })._all;
      return typeof countValue === 'number' ? countValue : 0;
    };

    const total = statusCounts.reduce((sum, item) => sum + getCount(item), 0);
    const pendientes = getCount(statusCounts.find((item) => item.estado === 'PENDING'));
    const aceptadas = getCount(statusCounts.find((item) => item.estado === 'ACCEPTED'));
    const expiradas = getCount(statusCounts.find((item) => item.estado === 'EXPIRED'));

    const stats = {
      total,
      pendientes,
      aceptadas,
      expiradas,
      tasaConversion: total > 0 ? Math.round((aceptadas / total) * 100) : 0,
    };

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.NEXTAUTH_URL ||
      'https://inmovaapp.com';

    const formattedInvitations = invitations.map((inv) => {
      const metadata = (inv.metadata ?? {}) as {
        empresa?: string;
        comisionOfrecida?: number;
        enviadoPor?: string;
      };
      return {
        id: inv.id,
        email: inv.email,
        nombre: inv.nombre || undefined,
        empresa: metadata.empresa || undefined,
        estado:
          inv.estado === 'PENDING'
            ? 'pending'
            : inv.estado === 'ACCEPTED'
            ? 'accepted'
            : inv.estado === 'EXPIRED'
            ? 'expired'
            : 'rejected',
        tokenExpira: inv.expiraFecha.toISOString(),
        invitationLink: `${baseUrl}/partners/accept/${inv.token}`,
        enviadoPor: metadata.enviadoPor || inv.partner?.nombre || 'Admin',
        creadoEn: inv.createdAt.toISOString(),
        aceptadoEn: inv.aceptadoFecha?.toISOString(),
        comisionOfrecida:
          typeof metadata.comisionOfrecida === 'number'
            ? metadata.comisionOfrecida
            : inv.partner?.comisionPorcentaje || 0,
      };
    });

    return NextResponse.json({
      success: true,
      data: formattedInvitations,
      stats,
    });
  } catch (error: unknown) {
    logger.error('[Partner Invitations GET Error]:', error);
    return NextResponse.json({ error: 'Error obteniendo invitaciones' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const sessionUser = session?.user as { role?: string | null; id?: string | null } | undefined;
    if (!session?.user || sessionUser?.role !== 'super_admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const validated = createInvitationSchema.parse(body);

    const { getPrismaClient } = await import('@/lib/db');
    const prisma = getPrismaClient();

    const partnerIdFromBody = validated.partnerId?.trim();
    const defaultPartnerId = process.env.DEFAULT_PARTNER_ID;

    const partner =
      (partnerIdFromBody
        ? await prisma.partner.findUnique({
            where: { id: partnerIdFromBody },
            select: { id: true, nombre: true },
          })
        : null) ||
      (defaultPartnerId
        ? await prisma.partner.findUnique({
            where: { id: defaultPartnerId },
            select: { id: true, nombre: true },
          })
        : null) ||
      (await prisma.partner.findFirst({
        orderBy: { createdAt: 'asc' },
        select: { id: true, nombre: true },
      }));

    if (!partner) {
      return NextResponse.json(
        { error: 'Debe existir al menos un partner para crear invitaciones' },
        { status: 400 }
      );
    }

    const existing = await prisma.partnerInvitation.findFirst({
      where: {
        partnerId: partner.id,
        email: validated.email,
        estado: 'PENDING',
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Ya existe una invitación pendiente para ese email' },
        { status: 409 }
      );
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiraFecha = new Date();
    expiraFecha.setDate(expiraFecha.getDate() + 30);

    const invitation = await prisma.partnerInvitation.create({
      data: {
        partnerId: partner.id,
        email: validated.email,
        nombre: validated.nombre,
        token,
        mensaje: validated.mensaje,
        expiraFecha,
        metadata: {
          empresa: validated.empresa,
          comisionOfrecida: validated.comisionOfrecida,
          enviadoPor: sessionUser?.id || 'admin',
        },
      },
    });

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.NEXTAUTH_URL ||
      'https://inmovaapp.com';
    const invitationLink = `${baseUrl}/partners/accept/${token}`;

    const emailSent = await sendEmail({
      to: validated.email,
      subject: `Invitación para unirte al Programa de Partners de Inmova`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
          <h2>Has recibido una invitación para el programa de partners</h2>
          <p>Hola${validated.nombre ? ` ${validated.nombre}` : ''},</p>
          <p>Te invitamos a unirte al programa de partners de Inmova.</p>
          ${validated.empresa ? `<p><strong>Empresa:</strong> ${validated.empresa}</p>` : ''}
          ${validated.mensaje ? `<p><strong>Mensaje:</strong> ${validated.mensaje}</p>` : ''}
          <p>Para aceptar la invitación, accede al siguiente enlace:</p>
          <p>
            <a href="${invitationLink}" style="color: #2563eb;">${invitationLink}</a>
          </p>
          <p>La invitación expira el ${expiraFecha.toLocaleDateString('es-ES')}.</p>
        </div>
      `,
    });

    return NextResponse.json({
      success: true,
      data: {
        id: invitation.id,
        email: invitation.email,
        estado: 'pending',
        invitationLink,
      },
      message: emailSent ? 'Invitación enviada exitosamente' : 'Invitación creada, pero el email no pudo enviarse',
    });
  } catch (error: unknown) {
    logger.error('[Partner Invitations POST Error]:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Datos inválidos', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Error creando invitación' }, { status: 500 });
  }
}
