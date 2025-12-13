import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import logger from '@/lib/logger';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const updateCategorySchema = z.object({
  category: z.enum(['enterprise', 'pyme', 'startup', 'trial', 'premium', 'standard']),
});

// PATCH - Actualizar categoría de un cliente
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Solo super_admin puede cambiar categorías
    if (session.user.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'No tienes permisos para cambiar categorías de clientes' },
        { status: 403 }
      );
    }

    const { id } = params;
    const body = await request.json();
    const validatedData = updateCategorySchema.parse(body);

    const company = await prisma.company.update({
      where: { id },
      data: {
        category: validatedData.category,
      },
    });

    return NextResponse.json(company);
  } catch (error: any) {
    logger.error('Error al actualizar categoría:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Error al actualizar categoría' },
      { status: 500 }
    );
  }
}