import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // TODO: Implementar ML real para predicción de precios
    // Por ahora devolvemos datos de ejemplo
    const suggestions = [
      {
        listingId: 'lst_1',
        listingName: 'Apartamento Centro - C/ Gran Vía 12',
        currentPrice: 85,
        suggestedPrice: 105,
        change: 20,
        changePercent: 23.5,
        reason: 'Festival de música este fin de semana aumenta la demanda un 45%',
        confidence: 87,
        factors: [
          {
            name: 'Evento Local',
            impact: 'high' as const,
            description: 'Festival Internacional de Jazz (15.000 asistentes)',
          },
          {
            name: 'Competencia',
            impact: 'medium' as const,
            description: 'Propiedades similares a €95-110',
          },
          {
            name: 'Estacionalidad',
            impact: 'low' as const,
            description: 'Temporada alta (diciembre)',
          },
          {
            name: 'Histórico',
            impact: 'medium' as const,
            description: 'Ocupación 92% a precios €100-110',
          },
        ],
      },
      {
        listingId: 'lst_2',
        listingName: 'Loft Moderno - Barrio Salamanca',
        currentPrice: 120,
        suggestedPrice: 110,
        change: -10,
        changePercent: -8.3,
        reason: 'Baja demanda prevista. Ajustar para mejorar ocupación',
        confidence: 78,
        factors: [
          {
            name: 'Demanda',
            impact: 'high' as const,
            description: 'Búsquedas -15% vs semana pasada',
          },
          {
            name: 'Competencia',
            impact: 'high' as const,
            description: 'Nuevos listings a €95-105',
          },
          {
            name: 'Estacionalidad',
            impact: 'medium' as const,
            description: 'Inicio de temporada baja',
          },
        ],
      },
    ];

    return NextResponse.json(suggestions);
  } catch (error) {
    logger.error('Error fetching pricing suggestions:', error);
    return NextResponse.json(
      { error: 'Error al obtener sugerencias' },
      { status: 500 }
    );
  }
}
