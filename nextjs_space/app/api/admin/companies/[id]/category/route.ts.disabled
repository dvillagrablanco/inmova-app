import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/permissions';
import { z } from 'zod';

const updateCategorySchema = z.object({
  category: z.enum(['enterprise', 'pyme', 'startup', 'trial', 'premium', 'standard']),
});

// PATCH - Actualizar categoría de un cliente
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const { id } = params;
    const body = await request.json();

    // Solo super_admin puede cambiar categorías
    if (user.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'No tienes permisos para cambiar categorías de clientes' },
        { status: 403 }
      );
    }

    const validatedData = updateCategorySchema.parse(body);

    const company = await prisma.company.update({
      where: { id },
      data: {
        category: validatedData.category,
      },
    });

    return NextResponse.json(company);
  } catch (error: any) {
    console.error('Error al actualizar categoría:', error);
    
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