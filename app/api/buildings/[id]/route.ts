import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger, { logError } from '@/lib/logger';
import { invalidateBuildingsCache, invalidateDashboardCache } from '@/lib/api-cache-helpers';
import { resolveCompanyScope } from '@/lib/company-scope';
import { z } from 'zod';
import * as Sentry from '@sentry/nextjs';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Lazy Prisma (auditoria V2)
async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

// Schema de validación para actualizar edificio
const buildingUpdateSchema = z.object({
  nombre: z.string().min(2, { message: 'El nombre debe tener al menos 2 caracteres' }).optional(),
  direccion: z.string().optional(),
  tipo: z.enum(['residencial', 'comercial', 'mixto']).optional(),
  anoConstructor: z
    .union([z.string(), z.number()])
    .optional()
    .transform((val) => (typeof val === 'string' ? parseInt(val) : val))
    .refine((val) => val === undefined || (val >= 1800 && val <= new Date().getFullYear() + 5), {
      message: 'Año de construcción inválido',
    }),
  numeroUnidades: z
    .union([z.string(), z.number()])
    .optional()
    .transform((val) => (typeof val === 'string' ? parseInt(val) : val))
    .refine((val) => val === undefined || val >= 0, {
      message: 'El número de unidades debe ser positivo',
    }),
  imagenes: z.array(z.string()).optional(),
  estadoConservacion: z.string().optional(),
  certificadoEnergetico: z.string().optional(),
  ascensor: z.boolean().optional(),
  garaje: z.boolean().optional(),
  trastero: z.boolean().optional(),
  piscina: z.boolean().optional(),
  jardin: z.boolean().optional(),
  gastosComunidad: z
    .union([z.string(), z.number()])
    .optional()
    .transform((val) => (typeof val === 'string' ? parseFloat(val) : val))
    .refine((val) => val === undefined || val >= 0, {
      message: 'Gastos de comunidad no pueden ser negativos',
    }),
  ibiAnual: z
    .union([z.string(), z.number()])
    .optional()
    .transform((val) => (typeof val === 'string' ? parseFloat(val) : val))
    .refine((val) => val === undefined || val >= 0, { message: 'IBI anual no puede ser negativo' }),
  latitud: z
    .union([z.string(), z.number()])
    .optional()
    .transform((val) => (typeof val === 'string' ? parseFloat(val) : val))
    .refine((val) => val === undefined || (val >= -90 && val <= 90), {
      message: 'Latitud inválida',
    }),
  longitud: z
    .union([z.string(), z.number()])
    .optional()
    .transform((val) => (typeof val === 'string' ? parseFloat(val) : val))
    .refine((val) => val === undefined || (val >= -180 && val <= 180), {
      message: 'Longitud inválida',
    }),
  etiquetas: z.array(z.string()).optional(),
});

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const scope = await resolveCompanyScope({
      userId: session.user.id as string,
      role: session.user.role as string,
      primaryCompanyId: session.user?.companyId,
      request: req,
    });

    const building = await prisma.building.findUnique({
      where: { id: params.id },
      include: {
        units: {
          include: {
            tenant: true,
            contracts: true,
          },
        },
      },
    });

    if (!building) {
      return NextResponse.json({ error: 'Edificio no encontrado' }, { status: 404 });
    }

    // Verify building belongs to user's company scope
    if (!scope.scopeCompanyIds.includes(building.companyId)) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    return NextResponse.json(building);
  } catch (error) {
    logger.error('Error fetching building:', error);
    Sentry.captureException(error);
    return NextResponse.json({ error: 'Error al obtener edificio' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const companyId = session.user?.companyId;
    const body = await req.json();

    // Validación con Zod
    const validationResult = buildingUpdateSchema.safeParse(body);

    if (!validationResult.success) {
      const errors = validationResult.error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      logger.warn('Validation error updating building:', { errors, buildingId: params.id });
      return NextResponse.json({ error: 'Datos inválidos', details: errors }, { status: 400 });
    }

    const {
      nombre,
      direccion,
      tipo,
      anoConstructor,
      numeroUnidades,
      imagenes,
      estadoConservacion,
      certificadoEnergetico,
      ascensor,
      garaje,
      trastero,
      piscina,
      jardin,
      gastosComunidad,
      ibiAnual,
      latitud,
      longitud,
      etiquetas,
    } = validationResult.data;

    const building = await prisma.building.update({
      where: { id: params.id },
      data: {
        ...(nombre !== undefined && { nombre }),
        ...(direccion !== undefined && { direccion }),
        ...(tipo !== undefined && { tipo }),
        ...(anoConstructor !== undefined && { anoConstructor }),
        ...(numeroUnidades !== undefined && { numeroUnidades }),
        ...(imagenes !== undefined && { imagenes }),
        ...(estadoConservacion !== undefined && { estadoConservacion }),
        ...(certificadoEnergetico !== undefined && { certificadoEnergetico }),
        ...(ascensor !== undefined && { ascensor }),
        ...(garaje !== undefined && { garaje }),
        ...(trastero !== undefined && { trastero }),
        ...(piscina !== undefined && { piscina }),
        ...(jardin !== undefined && { jardin }),
        ...(gastosComunidad !== undefined && { gastosComunidad }),
        ...(ibiAnual !== undefined && { ibiAnual }),
        ...(latitud !== undefined && { latitud }),
        ...(longitud !== undefined && { longitud }),
        ...(etiquetas !== undefined && { etiquetas }),
      },
    });

    // Invalidar cachés relacionados
    if (companyId) {
      await invalidateBuildingsCache(companyId);
      await invalidateDashboardCache(companyId);
    }

    return NextResponse.json(building);
  } catch (error) {
    logger.error('Error updating building:', error);
    Sentry.captureException(error);
    return NextResponse.json({ error: 'Error al actualizar edificio' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const companyId = session.user?.companyId;

    await prisma.building.delete({
      where: { id: params.id },
    });

    // Invalidar cachés relacionados
    if (companyId) {
      await invalidateBuildingsCache(companyId);
      await invalidateDashboardCache(companyId);
    }

    return NextResponse.json({ message: 'Edificio eliminado' });
  } catch (error) {
    logger.error('Error deleting building:', error);
    Sentry.captureException(error);
    return NextResponse.json({ error: 'Error al eliminar edificio' }, { status: 500 });
  }
}
