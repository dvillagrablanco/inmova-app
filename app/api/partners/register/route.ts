import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

import logger from '@/lib/logger';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const registerSchema = z.object({
  nombre: z.string().min(2, 'Nombre mínimo 2 caracteres'),
  razonSocial: z.string().min(2, 'Razón social requerida'),
  cif: z.string().min(9, 'CIF inválido'),
  tipo: z.enum([
    'BANCO',
    'MULTIFAMILY_OFFICE',
    'PLATAFORMA_MEMBRESIA',
    'ASOCIACION',
    'CONSULTORA',
    'INMOBILIARIA',
    'OTRO',
  ]),
  contactoNombre: z.string().min(2, 'Nombre de contacto requerido'),
  contactoEmail: z.string().email('Email de contacto inválido'),
  contactoTelefono: z.string().optional(),
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Password mínimo 8 caracteres'),
  comisionPorcentaje: z.number().min(0).max(100).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validar datos
    const validated = registerSchema.parse(body);

    // Verificar si el email ya existe
    const existingPartner = await prisma.partner.findUnique({
      where: { email: validated.email },
    });

    if (existingPartner) {
      return NextResponse.json(
        { error: 'Este email ya está registrado como partner' },
        { status: 400 }
      );
    }

    // Verificar si el CIF ya existe
    const existingCif = await prisma.partner.findUnique({
      where: { cif: validated.cif },
    });

    if (existingCif) {
      return NextResponse.json(
        { error: 'Este CIF ya está registrado' },
        { status: 400 }
      );
    }

    // Verificar si el contactoEmail ya existe
    const existingContactEmail = await prisma.partner.findUnique({
      where: { contactoEmail: validated.contactoEmail },
    });

    if (existingContactEmail) {
      return NextResponse.json(
        { error: 'Este email de contacto ya está registrado' },
        { status: 400 }
      );
    }

    // Hashear password
    const hashedPassword = await bcrypt.hash(validated.password, 10);

    // Crear partner (estado PENDING por defecto)
    const partner = await prisma.partner.create({
      data: {
        nombre: validated.nombre,
        razonSocial: validated.razonSocial,
        cif: validated.cif,
        tipo: validated.tipo,
        contactoNombre: validated.contactoNombre,
        contactoEmail: validated.contactoEmail,
        contactoTelefono: validated.contactoTelefono,
        email: validated.email,
        password: hashedPassword,
        comisionPorcentaje: validated.comisionPorcentaje || 20.0,
        estado: 'PENDING', // Alineado con PartnerStatus enum
        activo: false, // Inactivo hasta aprobación
      },
      select: {
        id: true,
        nombre: true,
        razonSocial: true,
        email: true,
        contactoEmail: true,
        tipo: true,
        estado: true,
        comisionPorcentaje: true,
      },
    });

    // Send welcome email and admin notification (opcional)
    try {
      const { sendPartnerWelcomeEmail, sendAdminNewPartnerNotification } =
        await import('@/lib/emails/partner-emails');

      await sendPartnerWelcomeEmail({
        nombre: partner.nombre,
        email: partner.email,
        tipo: partner.tipo,
      });

      await sendAdminNewPartnerNotification({
        nombre: partner.nombre,
        email: partner.email,
        tipo: partner.tipo,
        razonSocial: partner.razonSocial,
      });
    } catch (emailError) {
      logger.error('[Partner Registration Email Error]:', emailError);
      // Continue even if email fails
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          id: partner.id,
          nombre: partner.nombre,
          razonSocial: partner.razonSocial,
          email: partner.email,
          tipo: partner.tipo,
          estado: partner.estado,
          comisionPorcentaje: partner.comisionPorcentaje,
        },
        message: 'Solicitud de partner recibida. Te contactaremos en 24-48h.',
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Datos inválidos',
          details: error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        },
        { status: 400 }
      );
    }

    logger.error('[Partner Register Error]:', error);
    return NextResponse.json({ error: 'Error registrando partner' }, { status: 500 });
  }
}
