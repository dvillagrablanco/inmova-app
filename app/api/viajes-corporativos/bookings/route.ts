import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { ViajesCorporativosService } from '@/lib/services/viajes-corporativos-service';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const createBookingSchema = z.object({
  tenantId: z.string().optional(),
  tipoViaje: z.enum(['hotel', 'vuelo', 'tren', 'coche', 'paquete']),
  destino: z.string(),
  fechaInicio: z.string(),
  fechaFin: z.string().optional(),
  proveedor: z.string().optional(),
  coste: z.number().optional(),
  motivoViaje: z.string().optional(),
  centroCoste: z.string().optional(),
  notas: z.string().optional()
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Resolver companyId con soporte multi-empresa (cookie > JWT)
    const cookieCompanyId = request.cookies.get('activeCompanyId')?.value;
    const __resolvedCompanyId = cookieCompanyId || session.user.companyId;
    if (!__resolvedCompanyId) {
      return NextResponse.json({ error: 'Empresa no definida' }, { status: 400 });
    }
    // Inyectar companyId resuelto en session para compatibilidad
    (session.user as any).companyId = __resolvedCompanyId;, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const filters = {
      estado: searchParams.get('estado') || undefined,
      departamento: searchParams.get('departamento') || undefined,
      empleadoId: searchParams.get('empleadoId') || undefined
    };
    const bookings = await ViajesCorporativosService.getBookings(session.user.companyId, filters);
    return NextResponse.json({ success: true, data: bookings });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    const body = await request.json();
    const validated = createBookingSchema.parse(body);
    const booking = await ViajesCorporativosService.createBooking({
      ...validated,
      companyId: session.user.companyId
    });
    return NextResponse.json({ success: true, data: booking, message: 'Reserva creada' }, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Datos inválidos', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    const { id, estado, aprobadoPor } = await request.json();
    await ViajesCorporativosService.updateBookingStatus(id, estado, aprobadoPor);
    return NextResponse.json({ success: true, message: 'Estado actualizado' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
