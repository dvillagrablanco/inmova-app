import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { sendWelcomeEmail } from '@/lib/email-service';

import logger from '@/lib/logger';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const registroSchema = z.object({
  nombreEmpresa: z.string().min(2),
  cif: z.string().min(8).max(9),
  tipoEmpresa: z.enum(['CONSTRUCTORA', 'SUBCONTRATISTA', 'PROMOTORA', 'AUTONOMO']),
  email: z.string().email(),
  telefono: z.string().min(9),
  nombreContacto: z.string().min(2),
  password: z.string().min(8),
  aceptaTerminos: z.boolean().refine(val => val === true),
  aceptaPrivacidad: z.boolean().refine(val => val === true),
});

const TIPO_EMPRESA_MAP = {
  CONSTRUCTORA: 'CONTRATISTA_PRINCIPAL',
  SUBCONTRATISTA: 'SUBCONTRATISTA_N1',
  PROMOTORA: 'CONTRATISTA_PRINCIPAL',
  AUTONOMO: 'AUTONOMO',
} as const;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = registroSchema.parse(body);

    // Verificar si ya existe un usuario con ese email
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: 'Ya existe una cuenta con este email' },
        { status: 400 }
      );
    }

    // Verificar si ya existe una empresa con ese CIF
    const existingEmpresa = await prisma.ewoorkerPerfilEmpresa.findFirst({
      where: { cif: data.cif },
    });

    if (existingEmpresa) {
      return NextResponse.json(
        { message: 'Ya existe una empresa registrada con este CIF' },
        { status: 400 }
      );
    }

    // Hashear password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Crear la company primero
    const company = await prisma.company.create({
      data: {
        nombre: data.nombreEmpresa,
        email: data.email,
        telefono: data.telefono,
        cif: data.cif,
        businessVertical: 'construccion',
        contactoPrincipal: data.nombreContacto,
        emailContacto: data.email,
        telefonoContacto: data.telefono,
      },
    });

    // Crear usuario
    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        name: data.nombreContacto,
        role: 'administrador',
        activo: true,
        companyId: company.id,
      },
    });

    // Crear perfil de empresa eWoorker
    await prisma.ewoorkerPerfilEmpresa.create({
      data: {
        companyId: company.id,
        cif: data.cif,
        tipoEmpresa: TIPO_EMPRESA_MAP[data.tipoEmpresa],
        telefono: data.telefono,
        // Valores por defecto
        especialidades: [],
        subespecialidades: [],
        zonasOperacion: [],
        radioOperacionKm: 50,
        numeroTrabajadores: 0,
        experienciaAnios: 0,
      },
    });

    const emailSent = await sendWelcomeEmail(data.email, data.nombreContacto);
    if (!emailSent) {
      logger.warn('No se pudo enviar email de confirmación eWoorker', {
        email: data.email,
        companyId: company.id,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Registro exitoso',
      emailSent,
    }, { status: 201 });

  } catch (error: unknown) {
    logger.error('[eWoorker Registro Error]:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Datos inválidos', errors: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: 'Error en el registro' },
      { status: 500 }
    );
  }
}
