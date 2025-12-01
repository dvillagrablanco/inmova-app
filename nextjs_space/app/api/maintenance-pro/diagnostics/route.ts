import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { generateDiagnostic } from '@/lib/maintenance-prediction-service';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const maintenanceRequestId = searchParams.get('maintenanceRequestId');

    if (!maintenanceRequestId) {
      return NextResponse.json(
        { error: 'maintenanceRequestId requerido' },
        { status: 400 }
      );
    }

    const diagnostics = await prisma.maintenanceDiagnostic.findMany({
      where: {
        maintenanceRequestId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ diagnostics });
  } catch (error: any) {
    console.error('Error fetching diagnostics:', error);
    return NextResponse.json(
      { error: error.message || 'Error al cargar diagnósticos' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { maintenanceRequestId, equipoSistema, sintomas } = await request.json();

    if (!maintenanceRequestId || !equipoSistema || !sintomas) {
      return NextResponse.json(
        { error: 'Datos incompletos' },
        { status: 400 }
      );
    }

    const diagnostic = await generateDiagnostic(
      maintenanceRequestId,
      equipoSistema,
      sintomas,
      session.user.id
    );

    return NextResponse.json({ diagnostic }, { status: 201 });
  } catch (error: any) {
    console.error('Error generating diagnostic:', error);
    return NextResponse.json(
      { error: error.message || 'Error al generar diagnóstico' },
      { status: 500 }
    );
  }
}
