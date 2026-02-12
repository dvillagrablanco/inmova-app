/**
 * API de Reseñas para Portal de Proveedores
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface Review {
  id: string;
  clienteNombre: string;
  servicio: string;
  puntuacion: number;
  comentario: string;
  fecha: string;
  respondida: boolean;
  respuesta?: string;
  fechaRespuesta?: string;
  util: number;
  noUtil: number;
}

function generateReviews(): Review[] {
  // TODO: Obtener reseñas desde la base de datos
  return [];
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const reviews = generateReviews();
    const ratingDistribution = [
      { stars: 5, count: 45 },
      { stars: 4, count: 28 },
      { stars: 3, count: 12 },
      { stars: 2, count: 3 },
      { stars: 1, count: 2 },
    ];

    return NextResponse.json({
      success: true,
      data: {
        reviews,
        ratingDistribution,
      },
    });
  } catch (error) {
    console.error('[API Error] Reviews:', error);
    return NextResponse.json({ error: 'Error obteniendo reseñas' }, { status: 500 });
  }
}
