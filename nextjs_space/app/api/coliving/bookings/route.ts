import { NextRequest, NextResponse } from 'next/server';
import logger from '@/lib/logger';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import * as conciergeService from '@/lib/services/coliving-concierge-service';

export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');
    if (!tenantId) {
      return NextResponse.json(
        { error: 'tenantId requerido' },
        { status: 400 }
      );
    const result = await conciergeService.getTenantBookings(tenantId);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    return NextResponse.json(result.bookings);
  } catch (error) {
    logger.error('Error en GET /api/coliving/bookings:', error);
    return NextResponse.json(
      { error: 'Error al obtener reservas' },
      { status: 500 }
    );
  }
}
export async function POST(request: NextRequest) {
    const body = await request.json();
    const result = await conciergeService.bookService({
      ...body,
      fechaServicio: new Date(body.fechaServicio),
    });
    return NextResponse.json(result.booking, { status: 201 });
    logger.error('Error en POST /api/coliving/bookings:', error);
      { error: 'Error al crear reserva' },
export async function PATCH(request: NextRequest) {
    const { bookingId, estado, valoracion, comentario } = await request.json();
    if (!bookingId || !estado) {
        { error: 'Datos incompletos' },
    const result = await conciergeService.updateBookingStatus(
      bookingId,
      estado,
      valoracion,
      comentario
    return NextResponse.json(result.booking);
    logger.error('Error en PATCH /api/coliving/bookings:', error);
      { error: 'Error al actualizar reserva' },
