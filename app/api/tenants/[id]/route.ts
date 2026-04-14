import { NextRequest, NextResponse } from 'next/server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger, { logError } from '@/lib/logger';
import * as Sentry from '@sentry/nextjs';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Lazy Prisma loading (auditoria 2026-02-11)
async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

// Schema de validación para actualizar inquilino
const tenantUpdateSchema = z.object({
  nombreCompleto: z
    .string()
    .min(2, { message: 'El nombre debe tener al menos 2 caracteres' })
    .optional(),
  dni: z.string().optional(),
  email: z.string().email({ message: 'Email inválido' }).or(z.literal('')).optional(),
  telefono: z.string().optional(),
  fechaNacimiento: z
    .string()
    .datetime()
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}/))
    .optional(),
  nacionalidad: z.string().optional(),
  estadoCivil: z.enum(['soltero', 'casado', 'divorciado', 'viudo']).optional(),
  situacionLaboral: z
    .enum(['empleado', 'autonomo', 'estudiante', 'jubilado', 'desempleado'])
    .optional(),
  empresa: z.string().optional(),
  puesto: z.string().optional(),
  ingresosMensuales: z.number().nonnegative().optional(),
  scoring: z
    .union([z.string(), z.number()])
    .optional()
    .transform((val) => (typeof val === 'string' ? parseInt(val) : val))
    .refine((val) => val === undefined || (val >= 0 && val <= 100), {
      message: 'El scoring debe estar entre 0 y 100',
    }),
  nivelRiesgo: z.enum(['bajo', 'medio', 'alto', 'critico']).optional(),
  notas: z.string().optional(),
  iban: z.string().max(34).optional(),
  bic: z.string().max(11).optional(),
  metodoPago: z.string().max(50).optional(),
  personaContacto: z.string().max(200).optional(),
  ciudad: z.string().max(100).optional(),
  codigoPostal: z.string().max(20).optional(),
  provincia: z.string().max(100).optional(),
  pais: z.string().max(100).optional(),
});

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: params.id },
      include: {
        units: {
          include: {
            building: true,
          },
        },
        contracts: {
          include: {
            unit: {
              include: {
                building: true,
              },
            },
            payments: true,
          },
          orderBy: { fechaInicio: 'desc' },
        },
      },
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Inquilino no encontrado' }, { status: 404 });
    }

    return NextResponse.json(tenant);
  } catch (error) {
    logger.error('Error fetching tenant:', error);
    Sentry.captureException(error);
    return NextResponse.json({ error: 'Error al obtener inquilino' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await req.json();

    // Validación con Zod
    const validationResult = tenantUpdateSchema.safeParse(body);

    if (!validationResult.success) {
      const errors = validationResult.error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      logger.warn('Validation error updating tenant:', { errors, tenantId: params.id });
      return NextResponse.json({ error: 'Datos inválidos', details: errors }, { status: 400 });
    }

    const {
      nombreCompleto,
      dni,
      email,
      telefono,
      fechaNacimiento,
      nacionalidad,
      estadoCivil,
      situacionLaboral,
      empresa,
      puesto,
      ingresosMensuales,
      scoring,
      nivelRiesgo,
      notas,
      iban,
      bic,
      metodoPago,
      personaContacto,
      ciudad,
      codigoPostal,
      provincia,
      pais,
    } = validationResult.data;

    const tenant = await prisma.tenant.update({
      where: { id: params.id },
      data: {
        nombreCompleto,
        dni,
        email,
        telefono,
        fechaNacimiento: fechaNacimiento ? new Date(fechaNacimiento) : undefined,
        nacionalidad,
        estadoCivil,
        situacionLaboral,
        empresa,
        puesto,
        ingresosMensuales,
        scoring,
        nivelRiesgo,
        notas,
        iban,
        bic,
        metodoPago,
        personaContacto,
        ciudad,
        codigoPostal,
        provincia,
        pais,
      },
    });

    return NextResponse.json(tenant);
  } catch (error) {
    logger.error('Error updating tenant:', error);
    Sentry.captureException(error);
    return NextResponse.json({ error: 'Error al actualizar inquilino' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    await prisma.tenant.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Inquilino eliminado' });
  } catch (error) {
    logger.error('Error deleting tenant:', error);
    Sentry.captureException(error);
    return NextResponse.json({ error: 'Error al eliminar inquilino' }, { status: 500 });
  }
}
