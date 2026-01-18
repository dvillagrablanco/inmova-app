import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export const dynamic = 'force-dynamic';

// GET - Listar locales comerciales
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const estado = searchParams.get('estado');
    const tipo = searchParams.get('tipo');

    const locales: any[] = [];

    return NextResponse.json({
      success: true,
      data: locales,
    });
  } catch (error: any) {
    console.error('[API Retail Error]:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

// POST - Crear local comercial
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const { nombre, direccion, superficie, tipo, rentaMensual, arrendatario } = body;

    if (!nombre || !direccion) {
      return NextResponse.json({ error: 'Nombre y dirección son obligatorios' }, { status: 400 });
    }

    const nuevoLocal = {
      id: `loc_${Date.now()}`,
      nombre,
      direccion,
      superficie: superficie || 0,
      tipo: tipo || 'comercial',
      rentaMensual: rentaMensual || 0,
      arrendatario,
      estado: arrendatario ? 'alquilado' : 'disponible',
      ocupacion: arrendatario ? 100 : 0,
      ventasMes: 0,
      companyId: session.user.companyId,
    };

    return NextResponse.json({
      success: true,
      data: nuevoLocal,
      message: 'Local creado exitosamente',
    }, { status: 201 });
  } catch (error: any) {
    console.error('[API Retail Error]:', error);
    return NextResponse.json({ error: 'Error al crear local' }, { status: 500 });
  }
}
