/**
 * API: CONTRATO DE MEDIA ESTANCIA (Individual)
 * 
 * Operaciones CRUD para un contrato específico de media estancia
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { actualizarContratoMediaEstanciaSchema } from '@/lib/validations/medium-term-rental';
import {
  calcularProrrateo,
  generarResumenProrrateo,
  registrarInventarioEntrada,
  registrarInventarioSalida,
} from '@/lib/medium-term-rental-service';
import { z } from 'zod';

import logger from '@/lib/logger';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET: Obtener contrato específico
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const contrato = await prisma.contract.findFirst({
      where: {
        id: params.id,
        unit: { building: { companyId: session.user.companyId } },
      },
      include: {
        unit: {
          include: { building: true },
        },
        tenant: true,
        payments: {
          orderBy: { fechaVencimiento: 'asc' },
          take: 12,
        },
        documents: true,
      },
    });

    if (!contrato) {
      return NextResponse.json(
        { error: 'Contrato no encontrado' },
        { status: 404 }
      );
    }

    // Calcular prorrateo actualizado
    const prorrateo = calcularProrrateo(
      contrato.fechaInicio,
      contrato.fechaFin,
      contrato.rentaMensual
    );

    return NextResponse.json({
      success: true,
      data: contrato,
      prorrateo: {
        ...prorrateo,
        resumen: generarResumenProrrateo(prorrateo),
      },
    });
  } catch (error: any) {
    logger.error('[API Error] GET /api/contracts/medium-term/[id]:', error);
    return NextResponse.json(
      { error: 'Error obteniendo contrato' },
      { status: 500 }
    );
  }
}

/**
 * PUT: Actualizar contrato
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Verificar que el contrato existe y pertenece a la empresa
    const contratoExistente = await prisma.contract.findFirst({
      where: {
        id: params.id,
        unit: { building: { companyId: session.user.companyId } },
      },
    });

    if (!contratoExistente) {
      return NextResponse.json(
        { error: 'Contrato no encontrado' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validatedData = actualizarContratoMediaEstanciaSchema.parse(body);

    // Actualizar contrato
    const contratoActualizado = await prisma.contract.update({
      where: { id: params.id },
      data: {
        ...validatedData,
        serviciosIncluidos: validatedData.serviciosIncluidos as any,
        updatedAt: new Date(),
      },
      include: {
        unit: { include: { building: true } },
        tenant: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: contratoActualizado,
      message: 'Contrato actualizado correctamente',
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Datos inválidos',
          detalles: error.errors,
        },
        { status: 400 }
      );
    }

    logger.error('[API Error] PUT /api/contracts/medium-term/[id]:', error);
    return NextResponse.json(
      { error: 'Error actualizando contrato' },
      { status: 500 }
    );
  }
}

/**
 * DELETE: Cancelar/eliminar contrato
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Verificar que el contrato existe y pertenece a la empresa
    const contrato = await prisma.contract.findFirst({
      where: {
        id: params.id,
        unit: { building: { companyId: session.user.companyId } },
      },
    });

    if (!contrato) {
      return NextResponse.json(
        { error: 'Contrato no encontrado' },
        { status: 404 }
      );
    }

    // Soft delete - cambiar estado a cancelado
    await prisma.contract.update({
      where: { id: params.id },
      data: {
        estado: 'cancelado',
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Contrato cancelado correctamente',
    });
  } catch (error: any) {
    logger.error('[API Error] DELETE /api/contracts/medium-term/[id]:', error);
    return NextResponse.json(
      { error: 'Error cancelando contrato' },
      { status: 500 }
    );
  }
}
