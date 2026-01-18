import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export const dynamic = 'force-dynamic';

// GET - Listar personal de limpieza
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Mock - en producción consultar Prisma
    const personal: any[] = [];

    return NextResponse.json({
      success: true,
      data: personal,
    });
  } catch (error: any) {
    console.error('[API Limpieza Personal Error]:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

// POST - Añadir personal
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const { nombre, email, telefono, rol } = body;

    if (!nombre || !email) {
      return NextResponse.json({ error: 'Nombre y email son obligatorios' }, { status: 400 });
    }

    const nuevoPersonal = {
      id: `pers_${Date.now()}`,
      nombre,
      email,
      telefono,
      rol: rol || 'limpiador',
      estado: 'disponible',
      tareasCompletadas: 0,
      calificacionPromedio: 0,
      propiedadesAsignadas: 0,
      companyId: session.user.companyId,
    };

    return NextResponse.json({
      success: true,
      data: nuevoPersonal,
      message: 'Personal añadido exitosamente',
    }, { status: 201 });
  } catch (error: any) {
    console.error('[API Limpieza Personal Error]:', error);
    return NextResponse.json({ error: 'Error al añadir personal' }, { status: 500 });
  }
}
