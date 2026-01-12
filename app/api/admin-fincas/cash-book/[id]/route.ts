import { NextRequest, NextResponse } from 'next/server';
import logger from '@/lib/logger';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
interface Params {
  params: Promise<{ id: string }>;
}
/**
 * GET /api/admin-fincas/cash-book/[id]
 * Obtiene un movimiento específico
 */
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }
    const { id } = await params;
    const entry = await prisma.cashBookEntry.findFirst({
      where: {
        id,
        companyId: session.user.companyId,
      },
    });
    if (!entry) {
      return NextResponse.json(
        { error: 'Movimiento no encontrado' },
        { status: 404 }
      );
    }
    return NextResponse.json(entry);
  } catch (error) {
    logger.error('Error fetching cash book entry:', error);
    return NextResponse.json(
      { error: 'Error al obtener movimiento' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin-fincas/cash-book/[id]
 * Actualiza un movimiento (solo descripción y documentos)
 */
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }
    const { id } = await params;
    const body = await request.json();
    
    // Verificar que el movimiento existe y pertenece a la compañía
    const existing = await prisma.cashBookEntry.findFirst({
      where: {
        id,
        companyId: session.user.companyId,
      },
    });
    
    if (!existing) {
      return NextResponse.json(
        { error: 'Movimiento no encontrado' },
        { status: 404 }
      );
    }
    
    // Solo permitir actualizar ciertos campos para mantener integridad contable
    const allowedFields = ['descripcion', 'documentoUrl', 'categoria', 'subcategoria'];
    const updateData: any = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }
    
    const entry = await prisma.cashBookEntry.update({
      where: { id },
      data: updateData,
    });
    
    return NextResponse.json(entry);
  } catch (error) {
    logger.error('Error updating cash book entry:', error);
    return NextResponse.json(
      { error: 'Error al actualizar movimiento' },
      { status: 500 }
    );
  }
}
