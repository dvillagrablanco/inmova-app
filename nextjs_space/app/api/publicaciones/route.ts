import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import {
  generarAnunciosMultiplataforma,
  guardarPublicacion,
  simularEstadisticas
} from '@/lib/publicacion-service';
import { PublicacionEstado } from '@prisma/client';

/**
 * GET /api/publicaciones
 * Obtiene lista de publicaciones
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const estado = searchParams.get('estado');
    const unitId = searchParams.get('unitId');

    const where: any = {
      companyId: session.user.companyId
    };

    if (estado) where.estado = estado as PublicacionEstado;
    if (unitId) where.unitId = unitId;

    const publicaciones = await prisma.publicacionPortal.findMany({
      where,
      include: {
        unit: {
          include: {
            building: true
          }
        },
        building: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(publicaciones);
  } catch (error: any) {
    console.error('Error al obtener publicaciones:', error);
    return NextResponse.json(
      { error: 'Error al obtener publicaciones' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/publicaciones
 * Crea una nueva publicación generando anuncios para múltiples portales
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const { unitId, precioVenta, precioAlquiler, destacada, urgente } = body;

    if (!unitId) {
      return NextResponse.json(
        { error: 'unitId es requerido' },
        { status: 400 }
      );
    }

    // Generar anuncios optimizados para cada portal
    const anuncios = await generarAnunciosMultiplataforma(unitId);

    // Guardar publicación
    const publicacion = await guardarPublicacion(
      session.user.companyId,
      unitId,
      anuncios,
      session.user.id,
      {
        precioVenta: precioVenta ? parseFloat(precioVenta) : undefined,
        precioAlquiler: precioAlquiler ? parseFloat(precioAlquiler) : undefined,
        destacada,
        urgente
      }
    );

    return NextResponse.json(
      {
        publicacion,
        anuncios
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error al crear publicación:', error);
    return NextResponse.json(
      { error: error.message || 'Error al crear publicación' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/publicaciones
 * Actualiza el estado de una publicación
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const { id, estado, simularStats } = body;

    if (!id) {
      return NextResponse.json({ error: 'id es requerido' }, { status: 400 });
    }

    // Actualizar estado
    const updateData: any = {};
    
    if (estado) {
      updateData.estado = estado as PublicacionEstado;
      
      if (estado === 'activa' && !updateData.fechaPublicacion) {
        updateData.fechaPublicacion = new Date();
        
        // Calcular fecha de expiración (3 meses)
        const fechaExp = new Date();
        fechaExp.setMonth(fechaExp.getMonth() + 3);
        updateData.fechaExpiracion = fechaExp;
      }
    }

    const publicacion = await prisma.publicacionPortal.update({
      where: { id },
      data: updateData
    });

    // Simular estadísticas si se solicita
    if (simularStats) {
      await simularEstadisticas(id);
    }

    return NextResponse.json(publicacion);
  } catch (error: any) {
    console.error('Error al actualizar publicación:', error);
    return NextResponse.json(
      { error: 'Error al actualizar publicación' },
      { status: 500 }
    );
  }
}
