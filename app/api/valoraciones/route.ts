import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

/**
 * POST /api/valoraciones
 * Guardar una valoración de IA en la base de datos
 */
export async function POST(req: NextRequest) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const companyId = session.user.companyId;
    if (!companyId) {
      return NextResponse.json({ error: 'Empresa no definida' }, { status: 400 });
    }

    const body = await req.json();

    const valoracion = await prisma.valoracionPropiedad.create({
      data: {
        companyId,
        unitId: body.unitId || null,
        buildingId: body.buildingId || null,
        direccion: body.direccion || 'Sin dirección',
        municipio: body.ciudad || body.municipio || 'Madrid',
        provincia: body.provincia || 'Madrid',
        codigoPostal: body.codigoPostal || null,
        metrosCuadrados: body.superficie || 0,
        habitaciones: body.habitaciones || null,
        banos: body.banos || null,
        ascensor: body.caracteristicas?.includes('ascensor') || false,
        terraza: body.caracteristicas?.includes('terraza') || false,
        jardin: body.caracteristicas?.includes('jardin') || false,
        piscina: body.caracteristicas?.includes('piscina') || false,
        anosConstruccion: body.antiguedad || null,
        estadoConservacion: body.estadoConservacion || null,
        orientacion: body.orientacion || null,
        metodo: 'comparables',
        finalidad: body.finalidad === 'ambos' ? 'venta' : (body.finalidad || 'venta'),
        valorEstimado: body.resultado.valorEstimado,
        valorMinimo: body.resultado.valorMinimo,
        valorMaximo: body.resultado.valorMaximo,
        precioM2: body.resultado.precioM2,
        confianzaValoracion: body.resultado.confianza,
        numComparables: body.resultado.comparables?.length || 0,
        comparablesData: body.resultado.comparables || [],
        factoresPositivos: body.resultado.factoresPositivos || [],
        factoresNegativos: body.resultado.factoresNegativos || [],
        recomendacionPrecio: body.resultado.recomendaciones?.join('\n') || null,
        precioMedioZona: body.resultado.precioM2 || null,
        generadoPor: session.user.id as string,
        notas: body.resultado.analisisMercado || null,
      },
    });

    logger.info(`Valoración guardada: ${valoracion.id}`, { userId: session.user.id });
    return NextResponse.json({ success: true, id: valoracion.id }, { status: 201 });
  } catch (error: any) {
    logger.error('Error guardando valoración:', error);
    return NextResponse.json(
      { error: 'Error al guardar la valoración', message: error.message },
      { status: 500 }
    );
  }
}
