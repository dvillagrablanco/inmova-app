import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

/**
 * POST /api/auth-propietario/register
 * Auto-registro de propietarios con código de empresa
 */
export async function POST(req: NextRequest) {
  const prisma = await getPrisma();
  try {
    const { nombreCompleto, email, telefono, password, companyCode } = await req.json();

    if (!nombreCompleto || !email || !password) {
      return NextResponse.json(
        { error: 'Nombre, email y contraseña son requeridos' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 8 caracteres' },
        { status: 400 }
      );
    }

    if (!companyCode || !String(companyCode).trim()) {
      return NextResponse.json(
        { error: 'Debes indicar el código de empresa (CIF o nombre).' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const normalizedEmail = String(email).trim().toLowerCase();
    const existing = await prisma.owner.findFirst({ where: { email: normalizedEmail } });
    if (existing) {
      return NextResponse.json({ error: 'Ya existe una cuenta con este email' }, { status: 409 });
    }

    // Find company by code (CIF or name fragment)
    const normalizedCompanyCode = String(companyCode).trim();
    const company = await prisma.company.findFirst({
      where: {
        activo: true,
        esEmpresaPrueba: false,
        OR: [
          { cif: normalizedCompanyCode },
          { nombre: { contains: normalizedCompanyCode, mode: 'insensitive' } },
        ],
      },
      select: { id: true, nombre: true },
    });
    if (!company) {
      return NextResponse.json(
        { error: 'Empresa no encontrada para el código indicado' },
        { status: 404 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate verification token
    const verifyToken = crypto.randomBytes(32).toString('hex');

    // Create owner
    const owner = await prisma.owner.create({
      data: {
        companyId: company.id,
        nombreCompleto,
        email: normalizedEmail,
        telefono: telefono || null,
        password: hashedPassword,
        activo: true,
        emailVerificado: false,
        resetToken: verifyToken,
        resetTokenExpiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    // Send verification email
    try {
      const { sendEmail } = await import('@/lib/email-service');
      const verifyUrl = `${process.env.NEXTAUTH_URL || 'https://inmovaapp.com'}/api/auth/verify-email?token=${verifyToken}&type=owner`;
      await sendEmail({
        to: email,
        subject: 'Verifica tu cuenta — Inmova',
        html: `
          <h2>¡Bienvenido a Inmova, ${nombreCompleto}!</h2>
          <p>Tu cuenta de propietario ha sido creada para <strong>${company.nombre}</strong>.</p>
          <p>Por favor, verifica tu email haciendo clic en el siguiente enlace:</p>
          <p><a href="${verifyUrl}" style="background:#2563eb;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;">Verificar Email</a></p>
          <p>Este enlace expira en 7 días.</p>
          <p><small>Si no solicitaste esta cuenta, ignora este email.</small></p>
        `,
      });
    } catch (emailErr) {
      logger.warn('[Owner Register] Email send failed:', emailErr);
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Cuenta creada. Revisa tu email para verificar.',
        ownerId: owner.id,
      },
      { status: 201 }
    );
  } catch (error: any) {
    logger.error('[Owner Register]:', error);
    return NextResponse.json({ error: 'Error en el registro' }, { status: 500 });
  }
}
