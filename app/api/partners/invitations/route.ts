import { NextRequest, NextResponse } from 'next/server';
import logger from '@/lib/logger';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { sendEmail } from '@/lib/email-service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Lazy Prisma (auditoria V2)
async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

const JWT_SECRET = process.env.NEXTAUTH_SECRET;
// Función para verificar el token
type PartnerTokenPayload = {
  partnerId: string;
  email?: string;
};

function verifyToken(request: NextRequest) {
  const prisma = await getPrisma();
  if (!JWT_SECRET) {
    return null;
  }
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as PartnerTokenPayload;
    return decoded?.partnerId ? decoded : null;
  } catch {
    return null;
  }
}
// POST /api/partners/invitations - Crear invitación
export async function POST(request: NextRequest) {
  const prisma = await getPrisma();
  try {
    if (!JWT_SECRET) {
      logger.error('NEXTAUTH_SECRET no configurado');
      return NextResponse.json(
        { error: 'Configuración del servidor inválida' },
        { status: 500 }
      );
    }

    // Verificar autenticación
    const decoded = verifyToken(request);
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
    const partner = await prisma.partner.findUnique({
      where: { id: partnerId },
      select: { nombre: true },
    });
    if (!partner) {
      return NextResponse.json({ error: 'Partner no encontrado' }, { status: 404 });
    }

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

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.NEXTAUTH_URL ||
      'https://inmovaapp.com';
    const invitationLink = `${baseUrl}/partners/accept/${token}`;
    const emailSent = await sendEmail({
      to: email,
      subject: `Invitación de ${partner.nombre} para unirte a INMOVA`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
          <h2>Has recibido una invitación de ${partner.nombre}</h2>
          <p>Hola${nombre ? ` ${nombre}` : ''},</p>
          <p>${partner.nombre} te ha invitado a unirte al programa de partners de INMOVA.</p>
          ${mensaje ? `<p><strong>Mensaje:</strong> ${mensaje}</p>` : ''}
          <p>Para aceptar la invitación, haz clic en el siguiente enlace:</p>
          <p>
            <a href="${invitationLink}" style="color: #2563eb;">${invitationLink}</a>
          </p>
          <p>Esta invitación expira en 30 días.</p>
        </div>
      `,
    });

    if (!emailSent) {
      logger.warn('No se pudo enviar el email de invitación', { email, partnerId });
    }
    return NextResponse.json({
      message: 'Invitación creada exitosamente',
      invitation,
      emailSent,
    }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    logger.error('Error creando invitación:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', details: message },
      { status: 500 }
    );
  }
}
// GET /api/partners/invitations - Listar invitaciones del Partner
export async function GET(request: NextRequest) {
  const prisma = await getPrisma();
  try {
    const jwtSecret = JWT_SECRET;
    if (!jwtSecret) {
      logger.error('NEXTAUTH_SECRET no configurado');
      return NextResponse.json(
        { error: 'Configuración del servidor inválida' },
        { status: 500 }
      );
    }

    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, jwtSecret) as PartnerTokenPayload;
    if (!decoded?.partnerId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    const partnerId = decoded.partnerId;
    const invitaciones = await prisma.partnerInvitation.findMany({
      where: { partnerId },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ invitaciones });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    logger.error('Error obteniendo invitaciones:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', details: message },
      { status: 500 }
    );
  }
}
