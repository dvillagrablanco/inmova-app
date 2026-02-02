import { NextRequest, NextResponse } from 'next/server';
import logger from '@/lib/logger';
import { prisma } from '@/lib/db';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const JWT_SECRET = process.env.PARTNER_JWT_SECRET || process.env.NEXTAUTH_SECRET;

function getJwtSecret() {
  if (!JWT_SECRET) {
    logger.error('[Partners Auth] JWT secret no configurado');
    return null;
  }
  return JWT_SECRET;
}

// Función para verificar el token
function verifyToken(request: NextRequest, jwtSecret: string) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.substring(7);
  try {
    return jwt.verify(token, jwtSecret) as any;
  } catch {
    return null;
  }
}
// POST /api/partners/invitations - Crear invitación
export async function POST(request: NextRequest) {
  try {
    const jwtSecret = getJwtSecret();
    if (!jwtSecret) {
      return NextResponse.json(
        { error: 'Autenticación no configurada' },
        { status: 500 }
      );
    }

    // Verificar autenticación
    const decoded = verifyToken(request, jwtSecret);
    if (!decoded || !decoded.partnerId) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }
    const partnerId = decoded.partnerId;
    const { email, nombre, telefono, mensaje } = await request.json();
    if (!email) {
      return NextResponse.json(
        { error: 'Email es obligatorio' },
        { status: 400 }
      );
    }
    // Verificar si ya existe una invitación pendiente para este email
    const existingInvitation = await prisma.partnerInvitation.findFirst({
      where: {
        partnerId,
        email,
        estado: 'PENDING',
      },
    });
    if (existingInvitation) {
      return NextResponse.json(
        { error: 'Ya existe una invitación pendiente para este email' },
        { status: 409 }
      );
    }
    // Generar token único
    const token = crypto.randomBytes(32).toString('hex');
    // Fecha de expiración (30 días)
    const expiraFecha = new Date();
    expiraFecha.setDate(expiraFecha.getDate() + 30);
    // Crear invitación
    const invitation = await prisma.partnerInvitation.create({
      data: {
        partnerId,
        email,
        nombre,
        telefono,
        token,
        mensaje,
        expiraFecha,
      },
    });
    // TODO: Enviar email con el link de invitación
    // const invitationLink = `${process.env.NEXT_PUBLIC_APP_URL}/partners/accept/${token}`;
    // await sendInvitationEmail(email, invitationLink, mensaje);
    return NextResponse.json({
      message: 'Invitación creada exitosamente',
      invitation,
    }, { status: 201 });
  } catch (error: any) {
    logger.error('Error creando invitación:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error?.message },
      { status: 500 }
    );
  }
}
// GET /api/partners/invitations - Listar invitaciones del Partner
export async function GET(request: NextRequest) {
  try {
    const jwtSecret = getJwtSecret();
    if (!jwtSecret) {
      return NextResponse.json(
        { error: 'Autenticación no configurada' },
        { status: 500 }
      );
    }

    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, jwtSecret) as { partnerId: string };
    if (!decoded || !decoded.partnerId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    const partnerId = decoded.partnerId;
    const invitaciones = await prisma.partnerInvitation.findMany({
      where: { partnerId },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ invitaciones });
  } catch (error: any) {
    logger.error('Error obteniendo invitaciones:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error?.message },
      { status: 500 }
    );
  }
}
