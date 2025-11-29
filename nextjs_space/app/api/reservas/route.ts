import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import {
  validarDisponibilidad,
  calcularCostoReserva,
  validarReglasEspacio,
} from '@/lib/reservas-service';
import { ReservationStatus } from '@prisma/client';

// GET /api/reservas - Listar reservas
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const spaceId = searchParams.get('spaceId');
    const tenantId = searchParams.get('tenantId');
    const estado = searchParams.get('estado') as ReservationStatus | null;
    const fechaDesde = searchParams.get('fechaDesde');
    const fechaHasta = searchParams.get('fechaHasta');

    const reservas = await prisma.spaceReservation.findMany({
      where: {
        companyId: session.user.companyId,
        ...(spaceId && { spaceId }),
        ...(tenantId && { tenantId }),
        ...(estado && { estado }),
        ...(fechaDesde && {
          fechaReserva: {
            gte: new Date(fechaDesde),
          },
        }),
        ...(fechaHasta && {
          fechaReserva: {
            lte: new Date(fechaHasta),
          },
        }),
      },
      include: {
        space: {
          select: {
            id: true,
            nombre: true,
            tipo: true,
            building: {
              select: {
                nombre: true,
              },
            },
          },
        },
        tenant: {
          select: {
            id: true,
            nombreCompleto: true,
            email: true,
            telefono: true,
          },
        },
      },
      orderBy: {
        fechaReserva: 'desc',
      },
    });

    return NextResponse.json(reservas);
  } catch (error) {
    console.error('Error fetching reservas:', error);
    return NextResponse.json(
      { error: 'Error al obtener reservas' },
      { status: 500 }
    );
  }
}

// POST /api/reservas - Crear reserva
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const {
      spaceId,
      tenantId,
      fechaReserva,
      horaInicio,
      horaFin,
      numeroPersonas,
      proposito,
      observaciones,
    } = body;

    // Validaciones básicas
    if (!spaceId || !tenantId || !fechaReserva || !horaInicio || !horaFin) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }

    const fecha = new Date(fechaReserva);

    // Validar reglas del espacio
    const validacionReglas = await validarReglasEspacio(
      spaceId,
      fecha,
      horaInicio,
      horaFin
    );

    if (!validacionReglas.valido) {
      return NextResponse.json(
        { error: validacionReglas.error },
        { status: 400 }
      );
    }

    // Validar disponibilidad
    const disponibilidad = await validarDisponibilidad(
      spaceId,
      fecha,
      horaInicio,
      horaFin
    );

    if (!disponibilidad.disponible) {
      return NextResponse.json(
        {
          error: 'El horario no está disponible',
          conflicto: disponibilidad.conflicto,
        },
        { status: 409 }
      );
    }

    // Calcular costo
    const monto = await calcularCostoReserva(spaceId, horaInicio, horaFin);

    const reserva = await prisma.spaceReservation.create({
      data: {
        companyId: session.user.companyId,
        spaceId,
        tenantId,
        fechaReserva: fecha,
        horaInicio,
        horaFin,
        numeroPersonas: numeroPersonas || null,
        proposito,
        observaciones,
        monto: monto > 0 ? monto : null,
        estado: 'confirmada', // Auto-confirmar por ahora
        pagado: monto === 0, // Si no requiere pago, marcar como pagado
      },
      include: {
        space: {
          select: {
            nombre: true,
            tipo: true,
            building: {
              select: {
                nombre: true,
              },
            },
          },
        },
        tenant: {
          select: {
            nombreCompleto: true,
            email: true,
            telefono: true,
          },
        },
      },
    });

    return NextResponse.json(reserva, { status: 201 });
  } catch (error) {
    console.error('Error creating reserva:', error);
    return NextResponse.json(
      { error: 'Error al crear reserva' },
      { status: 500 }
    );
  }
}
