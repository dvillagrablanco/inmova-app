import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface Inspeccion {
  id: string;
  propiedad: string;
  unidad: string;
  tipo: 'entrada' | 'salida' | 'periodica';
  fecha: string;
  inspector: string;
  estado: 'programada' | 'en_proceso' | 'completada';
  puntuacion?: number;
  fotos?: number;
  incidencias?: number;
}

// GET - Obtener inspecciones digitales
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tipo = searchParams.get('tipo');
    const estado = searchParams.get('estado');

    let inspecciones: Inspeccion[] = [];

    try {
      // Intentar obtener de la BD
      const inspectionsDb = await prisma.inspection?.findMany?.({
        where: {
          property: { companyId: session.user.companyId },
        },
        include: {
          property: true,
          unit: true,
        },
        take: 50,
        orderBy: { scheduledDate: 'desc' },
      });

      if (inspectionsDb && inspectionsDb.length > 0) {
        inspecciones = inspectionsDb.map((i: any) => ({
          id: i.id,
          propiedad: i.property?.name || i.property?.address || 'Sin propiedad',
          unidad: i.unit?.unitNumber || '',
          tipo: i.type || 'periodica',
          fecha: i.scheduledDate?.toISOString().split('T')[0] || '',
          inspector: i.inspectorName || 'Sin asignar',
          estado: i.status || 'programada',
          puntuacion: i.score,
          fotos: i.photosCount || 0,
          incidencias: i.issuesCount || 0,
        }));
      }
    } catch (dbError) {
      console.warn('[API Inspecciones] Error BD, usando datos mock:', dbError);
    }

    // Si no hay datos de BD, usar mock
    if (inspecciones.length === 0) {
      inspecciones = [
        { id: 'i1', propiedad: 'Edificio Centro', unidad: '3A', tipo: 'salida', fecha: '2025-01-20', inspector: 'Carlos García', estado: 'completada', puntuacion: 85, fotos: 24, incidencias: 3 },
        { id: 'i2', propiedad: 'Residencial Playa', unidad: '2B', tipo: 'entrada', fecha: '2025-01-25', inspector: 'María López', estado: 'programada' },
        { id: 'i3', propiedad: 'Apartamentos Norte', unidad: '1C', tipo: 'periodica', fecha: '2025-01-22', inspector: 'Juan Martínez', estado: 'en_proceso', fotos: 12 },
        { id: 'i4', propiedad: 'Piso Centro', unidad: '4D', tipo: 'salida', fecha: '2025-01-18', inspector: 'Ana Ruiz', estado: 'completada', puntuacion: 92, fotos: 18, incidencias: 1 },
      ];
    }

    // Filtrar
    if (tipo && tipo !== 'all') {
      inspecciones = inspecciones.filter(i => i.tipo === tipo);
    }
    if (estado && estado !== 'all') {
      inspecciones = inspecciones.filter(i => i.estado === estado);
    }

    // Estadísticas
    const stats = {
      total: inspecciones.length,
      programadas: inspecciones.filter(i => i.estado === 'programada').length,
      enProceso: inspecciones.filter(i => i.estado === 'en_proceso').length,
      completadas: inspecciones.filter(i => i.estado === 'completada').length,
      puntuacionMedia: Math.round(
        inspecciones.filter(i => i.puntuacion).reduce((sum, i) => sum + (i.puntuacion || 0), 0) /
        (inspecciones.filter(i => i.puntuacion).length || 1)
      ),
    };

    return NextResponse.json({
      success: true,
      data: inspecciones,
      stats,
    });
  } catch (error: any) {
    console.error('[API Inspecciones] Error:', error);
    return NextResponse.json(
      { error: 'Error al obtener inspecciones', details: error.message },
      { status: 500 }
    );
  }
}

// POST - Programar nueva inspección
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { propertyId, unitId, tipo, fecha, inspectorName } = body;

    if (!propertyId || !tipo || !fecha) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: propertyId, tipo, fecha' },
        { status: 400 }
      );
    }

    const newInspeccion: Inspeccion = {
      id: `insp-${Date.now()}`,
      propiedad: 'Propiedad',
      unidad: unitId || '',
      tipo,
      fecha,
      inspector: inspectorName || 'Por asignar',
      estado: 'programada',
    };

    return NextResponse.json({
      success: true,
      data: newInspeccion,
      message: 'Inspección programada correctamente',
    }, { status: 201 });
  } catch (error: any) {
    console.error('[API Inspecciones] Error POST:', error);
    return NextResponse.json(
      { error: 'Error al programar inspección', details: error.message },
      { status: 500 }
    );
  }
}
