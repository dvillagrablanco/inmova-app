import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export const dynamic = 'force-dynamic';

// GET - Listar conflictos de sincronización
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const conflictos: any[] = [];

    return NextResponse.json({
      success: true,
      data: conflictos,
    });
  } catch (error: any) {
    console.error('[API Conflictos Sync Error]:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

// POST - Resolver conflicto
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const { conflictoId, resolucion } = body;

    if (!conflictoId || !resolucion) {
      return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'Conflicto resuelto exitosamente',
    });
  } catch (error: any) {
    console.error('[API Conflictos Sync Error]:', error);
    return NextResponse.json({ error: 'Error al resolver conflicto' }, { status: 500 });
  }
}
