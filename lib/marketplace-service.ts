/**
 * Servicio de Marketplace de Servicios
 * Gestión de servicios para inquilinos, reservas y programa de fidelización
 */

import { prisma } from './db';

/**
 * Calcula el precio total de una reserva con comisión
 */
export function calcularPrecioReserva(
  precioBase: number,
  comisionPorcentaje: number,
  duracion?: number
): { precioBase: number; comision: number; precioTotal: number } {
  const comision = precioBase * (comisionPorcentaje / 100);
  const precioTotal = precioBase + comision;

  return {
    precioBase,
    comision,
    precioTotal,
  };
}

/**
 * Calcula puntos de fidelización por una reserva
 */
export function calcularPuntosFidelizacion(precioTotal: number, nivelActual: string): number {
  const multiplicadores: Record<string, number> = {
    bronce: 1,
    plata: 1.5,
    oro: 2,
    platino: 3,
  };

  const puntosBase = Math.floor(precioTotal / 10); // 1 punto por cada 10€
  const multiplicador = multiplicadores[nivelActual] || 1;

  return Math.floor(puntosBase * multiplicador);
}

/**
 * Determina el nivel de fidelización basado en puntos
 */
export function determinarNivelFidelizacion(puntos: number): string {
  if (puntos >= 5000) return 'platino';
  if (puntos >= 2000) return 'oro';
  if (puntos >= 500) return 'plata';
  return 'bronce';
}

/**
 * Calcula el descuento actual basado en nivel
 */
export function calcularDescuentoPorNivel(nivel: string): number {
  const descuentos: Record<string, number> = {
    bronce: 0,
    plata: 5,
    oro: 10,
    platino: 15,
  };

  return descuentos[nivel] || 0;
}

/**
 * Actualiza el programa de fidelización tras una reserva
 */
export async function actualizarFidelizacion(
  tenantId: string,
  companyId: string,
  precioTotal: number
) {
  // Buscar o crear registro de fidelización
  let loyalty = await prisma.marketplaceLoyalty.findUnique({
    where: { tenantId },
  });

  if (!loyalty) {
    loyalty = await prisma.marketplaceLoyalty.create({
      data: {
        tenantId,
        companyId,
        puntos: 0,
        nivel: 'bronce',
      },
    });
  }

  // Calcular puntos ganados
  const puntosGanados = calcularPuntosFidelizacion(precioTotal, loyalty.nivel);
  const nuevosPuntos = loyalty.puntos + puntosGanados;
  const nuevoNivel = determinarNivelFidelizacion(nuevosPuntos);
  const nuevoDescuento = calcularDescuentoPorNivel(nuevoNivel);

  // Cashback (2% del total)
  const cashback = precioTotal * 0.02;

  // Actualizar
  const updated = await prisma.marketplaceLoyalty.update({
    where: { tenantId },
    data: {
      puntos: nuevosPuntos,
      nivel: nuevoNivel,
      descuentoActual: nuevoDescuento,
      cashbackAcumulado: { increment: cashback },
      puntosGanados: { increment: puntosGanados },
      serviciosUsados: { increment: 1 },
      ultimaActividad: new Date(),
    },
  });

  return {
    puntosGanados,
    puntosTotal: updated.puntos,
    nivel: updated.nivel,
    descuento: updated.descuentoActual,
    cashback,
    cambioNivel: nuevoNivel !== loyalty.nivel,
  };
}

/**
 * Obtiene servicios recomendados para un inquilino
 */
export async function obtenerServiciosRecomendados(
  companyId: string,
  tenantId: string,
  categoria?: string
) {
  // Obtener historial de reservas del inquilino
  const reservasPrevias = await prisma.marketplaceBooking.findMany({
    where: {
      tenantId,
      estado: 'completada',
    },
    include: {
      service: true,
    },
    take: 10,
  });

  const categoriasUsadas = [...new Set(reservasPrevias.map((r) => r.service.categoria))];

  // Buscar servicios populares en esas categorías
  const servicios = await prisma.marketplaceService.findMany({
    where: {
      companyId,
      activo: true,
      disponible: true,
      categoria: categoria || { in: categoriasUsadas.length > 0 ? categoriasUsadas : undefined },
    },
    orderBy: [{ destacado: 'desc' }, { rating: 'desc' }, { totalReviews: 'desc' }],
    take: 6,
  });

  return servicios;
}

/**
 * Procesa el pago de una reserva de marketplace
 */
export async function procesarPagoReserva(
  bookingId: string,
  stripePaymentId: string,
  metodoPago: string
) {
  const booking = await prisma.marketplaceBooking.update({
    where: { id: bookingId },
    data: {
      pagado: true,
      stripePaymentId,
      metodoPago,
      estado: 'confirmada',
    },
    include: {
      service: true,
      tenant: true,
    },
  });

  // Actualizar fidelización
  await actualizarFidelizacion(booking.tenantId, booking.companyId, booking.precioTotal);

  return booking;
}
