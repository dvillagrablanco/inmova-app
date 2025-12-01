import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    if (session.user.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 }
      );
    }

    const { tags } = await request.json();

    if (!Array.isArray(tags)) {
      return NextResponse.json(
        { error: 'Tags debe ser un array' },
        { status: 400 }
      );
    }

    const company = await prisma.company.update({
      where: { id: params.id },
      data: { tags },
    });

    return NextResponse.json({
      success: true,
      tags: company.tags,
    });
  } catch (error) {
    console.error('Error updating company tags:', error);
    return NextResponse.json(
      { error: 'Error al actualizar tags' },
      { status: 500 }
    );
  }
}
