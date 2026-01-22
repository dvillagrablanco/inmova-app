import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const espacioId = searchParams.get('espacioId');
    const estado = searchParams.get('estado');
    const fechaDesde = searchParams.get('fechaDesde');
    const fechaHasta = searchParams.get('fechaHasta');

    // Intentar obtener reservas de la tabla si existe
    try {
      const reservas = await prisma.reservaEspacio.findMany({
        where: {
          companyId: session.user.companyId,
          ...(espacioId && { espacioId }),
          ...(estado && { estado }),
          ...(fechaDesde && { fechaInicio: { gte: new Date(fechaDesde) } }),
          ...(fechaHasta && { fechaFin: { lte: new Date(fechaHasta) } }),
        },
        include: {
          espacio: true,
          usuario: {
            select: { id: true, name: true, email: true }
          }
        },
        orderBy: { fechaInicio: 'desc' },
      });

      return NextResponse.json(reservas);
    } catch (dbError) {
      // Si la tabla no existe, retornar array vacío
      console.warn('[API Reservas] Tabla no disponible, retornando vacío');
      return NextResponse.json([]);
    }
  } catch (error: any) {
    console.error('[API Reservas] Error:', error);
    return NextResponse.json({ error: 'Error al obtener reservas' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const { espacioId, fechaInicio, fechaFin, horaInicio, horaFin, motivo, numAsistentes, notas } = body;

    if (!espacioId || !fechaInicio || !fechaFin) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
    }

    try {
      // Verificar disponibilidad
      const conflictos = await prisma.reservaEspacio.findFirst({
        where: {
          espacioId,
          estado: { in: ['pendiente', 'confirmada'] },
          OR: [
            {
              AND: [
                { fechaInicio: { lte: new Date(fechaInicio) } },
                { fechaFin: { gte: new Date(fechaInicio) } },
              ]
            },
            {
              AND: [
                { fechaInicio: { lte: new Date(fechaFin) } },
                { fechaFin: { gte: new Date(fechaFin) } },
              ]
            }
          ]
        }
      });

      if (conflictos) {
        return NextResponse.json({ error: 'El espacio no está disponible en esas fechas' }, { status: 409 });
      }

      const reserva = await prisma.reservaEspacio.create({
        data: {
          espacioId,
          usuarioId: session.user.id,
          companyId: session.user.companyId,
          fechaInicio: new Date(fechaInicio),
          fechaFin: new Date(fechaFin),
          horaInicio,
          horaFin,
          motivo,
          numAsistentes,
          notas,
          estado: 'pendiente',
        },
        include: {
          espacio: true,
        }
      });

      return NextResponse.json(reserva, { status: 201 });
    } catch (dbError) {
      console.warn('[API Reservas] Error de BD:', dbError);
      return NextResponse.json({ error: 'Funcionalidad de reservas no disponible' }, { status: 503 });
    }
  } catch (error: any) {
    console.error('[API Reservas] Error:', error);
    return NextResponse.json({ error: 'Error al crear reserva' }, { status: 500 });
  }
}
