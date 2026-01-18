import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export const dynamic = 'force-dynamic';

// GET - Listar informes personalizados
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const informes: any[] = [];

    return NextResponse.json({
      success: true,
      data: informes,
    });
  } catch (error: any) {
    console.error('[API Informes Error]:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

// POST - Crear informe personalizado
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const { nombre, descripcion, tipo, formato, campos, programado, frecuencia, destinatarios } = body;

    if (!nombre || !campos || campos.length === 0) {
      return NextResponse.json({ error: 'Nombre y campos son obligatorios' }, { status: 400 });
    }

    const nuevoInforme = {
      id: `inf_${Date.now()}`,
      nombre,
      descripcion: descripcion || '',
      tipo: tipo || 'personalizado',
      formato: formato || 'pdf',
      campos,
      programado: programado || false,
      frecuencia: frecuencia || 'mensual',
      destinatarios: destinatarios ? destinatarios.split(',').map((d: string) => d.trim()) : [],
      estado: 'activo',
      createdAt: new Date().toISOString(),
      companyId: session.user.companyId,
    };

    return NextResponse.json({
      success: true,
      data: nuevoInforme,
      message: 'Informe creado exitosamente',
    }, { status: 201 });
  } catch (error: any) {
    console.error('[API Informes Error]:', error);
    return NextResponse.json({ error: 'Error al crear informe' }, { status: 500 });
  }
}
