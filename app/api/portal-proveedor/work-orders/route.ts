import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * API: Work Orders para Portal Proveedor
 * GET - Obtener órdenes de trabajo asignadas al proveedor
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Verificar que sea proveedor
    if (session.user.role !== 'PROVIDER' && session.user.role !== 'PROVEEDOR') {
      return NextResponse.json(
        { error: 'Acceso denegado - Solo para proveedores' },
        { status: 403 }
      );
    }

    // TODO: Implementar lógica real cuando exista modelo de Work Orders
    // Por ahora retornar array vacío para evitar 404
    return NextResponse.json({
      success: true,
      workOrders: [],
      message: 'Funcionalidad en desarrollo',
    });
  } catch (error: any) {
    console.error('[API Error]:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
