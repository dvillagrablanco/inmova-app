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
  return [
    {
      id: '1',
      clienteNombre: 'María G.',
      servicio: 'Reparación de fontanería',
      puntuacion: 5,
      comentario: 'Excelente trabajo. El técnico llegó puntual y resolvió el problema rápidamente.',
      fecha: '2026-01-15',
      respondida: true,
      respuesta: '¡Muchas gracias por tu valoración!',
      fechaRespuesta: '2026-01-16',
      util: 5,
      noUtil: 0,
    },
    {
      id: '2',
      clienteNombre: 'Carlos R.',
      servicio: 'Instalación eléctrica',
      puntuacion: 4,
      comentario: 'Buen servicio en general. El trabajo quedó bien pero tardó un poco más de lo esperado.',
      fecha: '2026-01-12',
      respondida: false,
      util: 3,
      noUtil: 1,
    },
    {
      id: '3',
      clienteNombre: 'Ana M.',
      servicio: 'Mantenimiento general',
      puntuacion: 5,
      comentario: 'Muy contentos con el servicio. Lo recomiendo totalmente.',
      fecha: '2026-01-08',
      respondida: true,
      respuesta: 'Gracias Ana, es un placer trabajar con clientes como tú.',
      fechaRespuesta: '2026-01-09',
      util: 8,
      noUtil: 0,
    },
    {
      id: '4',
      clienteNombre: 'Pedro L.',
      servicio: 'Pintura',
      puntuacion: 3,
      comentario: 'El resultado final está bien pero hubo algunos retrasos.',
      fecha: '2026-01-05',
      respondida: false,
      util: 2,
      noUtil: 2,
    },
  ];
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
