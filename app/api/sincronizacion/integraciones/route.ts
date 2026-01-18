import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export const dynamic = 'force-dynamic';

// GET - Listar integraciones
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Mock - en producción consultar Prisma
    const integraciones: any[] = [];

    return NextResponse.json({
      success: true,
      data: integraciones,
    });
  } catch (error: any) {
    console.error('[API Sincronización Error]:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

// POST - Crear integración
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const { nombre, tipo, configuracion } = body;

    if (!nombre || !tipo) {
      return NextResponse.json({ error: 'Nombre y tipo son obligatorios' }, { status: 400 });
    }

    const nuevaIntegracion = {
      id: `int_${Date.now()}`,
      nombre,
      tipo,
      configuracion: configuracion || {},
      estado: 'activa',
      ultimaSincronizacion: null,
      registrosSincronizados: 0,
      errores: 0,
      companyId: session.user.companyId,
    };

    return NextResponse.json({
      success: true,
      data: nuevaIntegracion,
      message: 'Integración creada exitosamente',
    }, { status: 201 });
  } catch (error: any) {
    console.error('[API Sincronización Error]:', error);
    return NextResponse.json({ error: 'Error al crear integración' }, { status: 500 });
  }
}
