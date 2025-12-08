import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

type RouteParams = {
  params: Promise<{ id: string }>;
};

/**
 * POST /api/workflows/[id]/toggle - Activar/Desactivar un workflow
 */
export async function POST(
  req: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Verificar que el workflow pertenece a la empresa
    const workflow = await prisma.workflow.findFirst({
      where: {
        id,
        companyId: session.user.companyId,
      },
    });

    if (!workflow) {
      return NextResponse.json(
        { error: 'Workflow no encontrado' },
        { status: 404 }
      );
    }

    // Toggle isActive
    const updatedWorkflow = await prisma.workflow.update({
      where: { id },
      data: {
        isActive: !workflow.isActive,
        status: !workflow.isActive ? 'activo' : 'inactivo',
      },
    });

    return NextResponse.json(updatedWorkflow);
  } catch (error: any) {
    console.error('Error cambiando estado del workflow:', error);
    return NextResponse.json(
      { error: 'Error cambiando estado del workflow' },
      { status: 500 }
    );
  }
}
