import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger, { logError } from '@/lib/logger';
import {
  invalidateContractsCache,
  invalidateUnitsCache,
  invalidateDashboardCache,
} from '@/lib/api-cache-helpers';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Schema de validación para actualizar contrato
const contractUpdateSchema = z.object({
  fechaInicio: z
    .string()
    .datetime()
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}/))
    .optional(),
  fechaFin: z
    .string()
    .datetime()
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}/))
    .optional(),
  rentaMensual: z
    .union([z.string(), z.number()])
    .optional()
    .transform((val) => (typeof val === 'string' ? parseFloat(val) : val))
    .refine((val) => val === undefined || val > 0, {
      message: 'La renta mensual debe ser positiva',
    }),
  deposito: z
    .union([z.string(), z.number()])
    .optional()
    .transform((val) => (typeof val === 'string' ? parseFloat(val) : val))
    .refine((val) => val === undefined || val >= 0, {
      message: 'El depósito no puede ser negativo',
    }),
  estado: z.enum(['activo', 'vencido', 'cancelado']).optional(),
  tipo: z.enum(['residencial', 'comercial', 'temporal']).optional(),
});

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const contract = await prisma.contract.findUnique({
      where: { id: params.id },
      include: {
        unit: {
          include: {
            building: {
              select: {
                id: true,
                nombre: true,
                direccion: true,
                tipo: true,
                companyId: true,
              },
            },
          },
        },
        tenant: {
          select: {
            id: true,
            nombreCompleto: true,
            email: true,
            telefono: true,
            dni: true,
          },
        },
        payments: {
          orderBy: { fechaVencimiento: 'desc' },
          take: 50,
        },
      },
    });

    if (!contract) {
      return NextResponse.json({ error: 'Contrato no encontrado' }, { status: 404 });
    }

    // Verificar que el contrato pertenece a la empresa del usuario (seguridad)
    const cookieCompanyId = req.cookies.get('activeCompanyId')?.value;
    const userCompanyId = cookieCompanyId || session.user.companyId;
    const contractCompanyId = contract.unit?.building?.companyId;
    const userRole = (session.user as any).role;
    
    if (contractCompanyId && userCompanyId && contractCompanyId !== userCompanyId && userRole !== 'super_admin' && userRole !== 'soporte') {
      return NextResponse.json({ error: 'No tienes acceso a este contrato' }, { status: 403 });
    }

    return NextResponse.json(contract);
  } catch (error) {
    logger.error('Error fetching contract:', error);
    return NextResponse.json({ error: 'Error al obtener contrato' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Resolver companyId con soporte multi-empresa
    const cookieCompanyId = req.cookies.get('activeCompanyId')?.value;
    const companyId = cookieCompanyId || session.user?.companyId;
    const body = await req.json();

    // Validación con Zod
    const validationResult = contractUpdateSchema.safeParse(body);

    if (!validationResult.success) {
      const errors = validationResult.error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      logger.warn('Validation error updating contract:', { errors, contractId: params.id });
      return NextResponse.json({ error: 'Datos inválidos', details: errors }, { status: 400 });
    }

    const { fechaInicio, fechaFin, rentaMensual, deposito, estado, tipo } = validationResult.data;

    const contract = await prisma.contract.update({
      where: { id: params.id },
      data: {
        fechaInicio: fechaInicio ? new Date(fechaInicio) : undefined,
        fechaFin: fechaFin ? new Date(fechaFin) : undefined,
        rentaMensual,
        deposito,
        estado,
        tipo,
      },
    });

    // Invalidar cachés relacionados
    if (companyId) {
      await invalidateContractsCache(companyId);
      await invalidateUnitsCache(companyId);
      await invalidateDashboardCache(companyId);
    }

    return NextResponse.json(contract);
  } catch (error) {
    logger.error('Error updating contract:', error);
    return NextResponse.json({ error: 'Error al actualizar contrato' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Resolver companyId con soporte multi-empresa
    const cookieCompanyId = req.cookies.get('activeCompanyId')?.value;
    const companyId = cookieCompanyId || session.user?.companyId;

    // Verificar ownership antes de eliminar
    const existing = await prisma.contract.findUnique({
      where: { id: params.id },
      select: { unit: { select: { building: { select: { companyId: true } } } } },
    });
    
    if (!existing) {
      return NextResponse.json({ error: 'Contrato no encontrado' }, { status: 404 });
    }
    
    const contractCompanyId = existing.unit?.building?.companyId;
    const userRole = (session.user as any).role;
    if (contractCompanyId && companyId && contractCompanyId !== companyId && userRole !== 'super_admin') {
      return NextResponse.json({ error: 'No tienes acceso a este contrato' }, { status: 403 });
    }

    await prisma.contract.delete({
      where: { id: params.id },
    });

    // Invalidar cachés relacionados
    if (companyId) {
      await invalidateContractsCache(companyId);
      await invalidateUnitsCache(companyId);
      await invalidateDashboardCache(companyId);
    }

    return NextResponse.json({ message: 'Contrato eliminado' });
  } catch (error) {
    logger.error('Error deleting contract:', error);
    return NextResponse.json({ error: 'Error al eliminar contrato' }, { status: 500 });
  }
}
