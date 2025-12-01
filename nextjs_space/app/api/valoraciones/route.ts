import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import {
  calcularValoracionPropiedad,
  guardarValoracion
} from '@/lib/valoracion-service';
import { ValoracionMetodo, ValoracionFinalidad } from '@prisma/client';

export const dynamic = 'force-dynamic';

/**
 * GET /api/valoraciones
 * Obtiene lista de valoraciones
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const unitId = searchParams.get('unitId');
    const buildingId = searchParams.get('buildingId');
    const finalidad = searchParams.get('finalidad');

    const where: any = {
      companyId: session.user.companyId
    };

    if (unitId) where.unitId = unitId;
    if (buildingId) where.buildingId = buildingId;
    if (finalidad) where.finalidad = finalidad;

    const valoraciones = await prisma.valoracionPropiedad.findMany({
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
        fechaValoracion: 'desc'
      }
    });

    return NextResponse.json(valoraciones);
  } catch (error: any) {
    console.error('Error al obtener valoraciones:', error);
    return NextResponse.json(
      { error: 'Error al obtener valoraciones' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/valoraciones
 * Crea una nueva valoración
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const {
      unitId,
      buildingId,
      direccion,
      municipio,
      provincia,
      codigoPostal,
      metrosCuadrados,
      habitaciones,
      banos,
      garajes,
      trasteros,
      ascensor,
      terraza,
      jardin,
      piscina,
      anosConstruccion,
      estadoConservacion,
      orientacion,
      eficienciaEnergetica,
      metodo,
      finalidad
    } = body;

    // Validaciones
    if (!metrosCuadrados || !municipio || !provincia) {
      return NextResponse.json(
        { error: 'Faltan datos requeridos' },
        { status: 400 }
      );
    }

    // Calcular valoración
    const resultado = await calcularValoracionPropiedad(
      session.user.companyId,
      {
        unitId,
        buildingId,
        direccion,
        municipio,
        provincia,
        codigoPostal,
        metrosCuadrados: parseFloat(metrosCuadrados),
        habitaciones: habitaciones ? parseInt(habitaciones) : undefined,
        banos: banos ? parseInt(banos) : undefined,
        garajes: garajes ? parseInt(garajes) : undefined,
        trasteros: trasteros ? parseInt(trasteros) : undefined,
        ascensor,
        terraza,
        jardin,
        piscina,
        anosConstruccion: anosConstruccion ? parseInt(anosConstruccion) : undefined,
        estadoConservacion,
        orientacion,
        eficienciaEnergetica
      },
      metodo as ValoracionMetodo || 'comparables',
      finalidad as ValoracionFinalidad || 'venta',
      session.user.id
    );

    // Guardar en base de datos
    const valoracion = await guardarValoracion(
      session.user.companyId,
      {
        unitId,
        buildingId,
        direccion,
        municipio,
        provincia,
        codigoPostal,
        metrosCuadrados: parseFloat(metrosCuadrados),
        habitaciones: habitaciones ? parseInt(habitaciones) : undefined,
        banos: banos ? parseInt(banos) : undefined,
        garajes: garajes ? parseInt(garajes) : undefined,
        trasteros: trasteros ? parseInt(trasteros) : undefined,
        ascensor,
        terraza,
        jardin,
        piscina,
        anosConstruccion: anosConstruccion ? parseInt(anosConstruccion) : undefined,
        estadoConservacion,
        orientacion,
        eficienciaEnergetica
      },
      metodo as ValoracionMetodo || 'comparables',
      finalidad as ValoracionFinalidad || 'venta',
      resultado,
      session.user.id
    );

    return NextResponse.json({ 
      valoracion,
      resultado 
    }, { status: 201 });
    
  } catch (error: any) {
    console.error('Error al crear valoración:', error);
    return NextResponse.json(
      { error: error.message || 'Error al crear valoración' },
      { status: 500 }
    );
  }
}
