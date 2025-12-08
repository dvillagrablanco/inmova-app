import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { WorkflowEngine } from '@/lib/workflow-engine';

type RouteParams = {
  params: Promise<{ id: string }>;
};

/**
 * POST /api/workflows/[id]/execute - Ejecutar un workflow manualmente
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
    const body = await req.json();

    // Ejecutar el workflow
    const result = await WorkflowEngine.executeWorkflow(id, {
      companyId: session.user.companyId,
      userId: session.user.id,
      eventType: 'manual',
      data: body.data || {},
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error ejecutando workflow:', error);
    return NextResponse.json(
      { error: error.message || 'Error ejecutando workflow' },
      { status: 500 }
    );
  }
}
