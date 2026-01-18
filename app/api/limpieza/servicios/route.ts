import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET - Listar servicios de limpieza
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const estado = searchParams.get('estado');
    const tipo = searchParams.get('tipo');
    const fecha = searchParams.get('fecha');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Usar tabla genérica para servicios si no existe tabla específica
    // En producción, crear modelo CleaningService en Prisma
    const servicios: any[] = [];
    
    // Calcular KPIs
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    const kpis = {
      serviciosHoy: servicios.filter(s => new Date(s.fechaProgramada) >= hoy).length,
      serviciosCompletados: servicios.filter(s => s.estado === 'completado').length,
      serviciosPendientes: servicios.filter(s => s.estado === 'programado' || s.estado === 'pendiente_revision').length,
      tiempoPromedioHoy: 0,
      calificacionPromedio: 0,
      personalActivo: 0,
    };

    return NextResponse.json({
      success: true,
      data: servicios,
      kpis,
      pagination: {
        page,
        limit,
        total: servicios.length,
        pages: Math.ceil(servicios.length / limit),
      },
    });
  } catch (error: any) {
    console.error('[API Limpieza Error]:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

// POST - Crear servicio de limpieza
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const { propiedadId, tipo, fechaProgramada, horaInicio, duracionEstimada, personalAsignado, notas, checklist } = body;

    if (!propiedadId || !fechaProgramada) {
      return NextResponse.json({ error: 'Campos obligatorios faltantes' }, { status: 400 });
    }

    // Crear servicio (mock - en producción usar modelo Prisma)
    const nuevoServicio = {
      id: `srv_${Date.now()}`,
      propiedadId,
      tipo: tipo || 'rutinaria',
      fechaProgramada,
      horaInicio: horaInicio || '09:00',
      duracionEstimada: duracionEstimada || 120,
      personalAsignado: personalAsignado || [],
      notas,
      checklist,
      estado: 'programado',
      createdAt: new Date().toISOString(),
      companyId: session.user.companyId,
    };

    return NextResponse.json({
      success: true,
      data: nuevoServicio,
      message: 'Servicio de limpieza programado exitosamente',
    }, { status: 201 });
  } catch (error: any) {
    console.error('[API Limpieza Error]:', error);
    return NextResponse.json({ error: 'Error al crear servicio' }, { status: 500 });
  }
}
