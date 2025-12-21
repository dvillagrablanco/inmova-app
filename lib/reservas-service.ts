/**
 * Servicio de Gestión de Reservas de Espacios Comunes
 * Proporciona funciones para gestionar espacios comunes y sus reservas
 */

import { prisma } from './db';
import { addHours, format, isAfter, isBefore, parseISO } from 'date-fns';
import logger, { logError } from '@/lib/logger';

// Definiciones de tipos inline (reemplaza imports de @prisma/client)
type CommonSpaceType = 'salon_fiestas' | 'gimnasio' | 'piscina' | 'sala_reuniones' | 'zona_bbq' | 'lavanderia' | 'terraza' | 'coworking' | 'otros';
type ReservationStatus = 'pendiente' | 'confirmada' | 'cancelada' | 'completada';

/**
 * Valida si un horario está disponible para reserva
 */
export async function validarDisponibilidad(
  spaceId: string,
  fechaReserva: Date,
  horaInicio: string,
  horaFin: string,
  excludeReservationId?: string
): Promise<{ disponible: boolean; conflicto?: any }> {
  // Buscar reservas existentes para ese espacio y fecha
  const reservasExistentes = await prisma.spaceReservation.findMany({
    where: {
      spaceId,
      fechaReserva: {
        gte: new Date(fechaReserva.setHours(0, 0, 0, 0)),
        lt: new Date(fechaReserva.setHours(23, 59, 59, 999)),
      },
      estado: {
        in: ['pendiente', 'confirmada'],
      },
      ...(excludeReservationId && { id: { not: excludeReservationId } }),
    },
    include: {
      tenant: { select: { nombreCompleto: true } },
    },
  });

  // Validar solapamiento de horarios
  for (const reserva of reservasExistentes) {
    const inicio1 = reserva.horaInicio;
    const fin1 = reserva.horaFin;
    const inicio2 = horaInicio;
    const fin2 = horaFin;

    // Verificar solapamiento
    if (
      (inicio2 >= inicio1 && inicio2 < fin1) ||
      (fin2 > inicio1 && fin2 <= fin1) ||
      (inicio2 <= inicio1 && fin2 >= fin1)
    ) {
      return {
        disponible: false,
        conflicto: reserva,
      };
    }
  }

  return { disponible: true };
}

/**
 * Calcula el costo de una reserva
 */
export async function calcularCostoReserva(
  spaceId: string,
  horaInicio: string,
  horaFin: string
): Promise<number> {
  const space = await prisma.commonSpace.findUnique({
    where: { id: spaceId },
  });

  if (!space || !space.requierePago || !space.costoPorHora) {
    return 0;
  }

  // Calcular horas de duración
  const [horaInicioH, horaInicioM] = horaInicio.split(':').map(Number);
  const [horaFinH, horaFinM] = horaFin.split(':').map(Number);
  
  const minutos = (horaFinH * 60 + horaFinM) - (horaInicioH * 60 + horaInicioM);
  const horas = minutos / 60;

  return space.costoPorHora * horas;
}

/**
 * Valida las reglas del espacio común
 */
export async function validarReglasEspacio(
  spaceId: string,
  fechaReserva: Date,
  horaInicio: string,
  horaFin: string
): Promise<{ valido: boolean; error?: string }> {
  const space = await prisma.commonSpace.findUnique({
    where: { id: spaceId },
  });

  if (!space) {
    return { valido: false, error: 'Espacio no encontrado' };
  }

  if (!space.activo) {
    return { valido: false, error: 'Espacio no disponible' };
  }

  // Validar horario de apertura
  if (space.horaApertura && horaInicio < space.horaApertura) {
    return { valido: false, error: `El espacio abre a las ${space.horaApertura}` };
  }

  if (space.horaCierre && horaFin > space.horaCierre) {
    return { valido: false, error: `El espacio cierra a las ${space.horaCierre}` };
  }

  // Validar duración máxima
  const [horaInicioH, horaInicioM] = horaInicio.split(':').map(Number);
  const [horaFinH, horaFinM] = horaFin.split(':').map(Number);
  const minutos = (horaFinH * 60 + horaFinM) - (horaInicioH * 60 + horaInicioM);
  const horas = minutos / 60;

  if (horas > space.duracionMaximaHoras) {
    return { valido: false, error: `La duración máxima es de ${space.duracionMaximaHoras} horas` };
  }

  // Validar anticipación mínima
  const hoy = new Date();
  const diasAnticipacion = Math.ceil((fechaReserva.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diasAnticipacion > space.anticipacionDias) {
    return { valido: false, error: `No se puede reservar con más de ${space.anticipacionDias} días de anticipación` };
  }

  return { valido: true };
}

/**
 * Envía recordatorio 24h antes de la reserva
 */
export async function enviarRecordatoriosReservas(): Promise<void> {
  const manana = new Date();
  manana.setDate(manana.getDate() + 1);
  manana.setHours(0, 0, 0, 0);

  const reservas = await prisma.spaceReservation.findMany({
    where: {
      fechaReserva: {
        gte: manana,
        lt: new Date(manana.getTime() + 24 * 60 * 60 * 1000),
      },
      estado: 'confirmada',
    },
    include: {
      tenant: true,
      space: true,
    },
  });

  for (const reserva of reservas) {
    // Aquí se integraría con el servicio de notificaciones o email
    logger.info(`Recordatorio: ${reserva.tenant.nombreCompleto} - ${reserva.space.nombre} - ${format(reserva.fechaReserva, 'dd/MM/yyyy')} ${reserva.horaInicio}`);
  }
}

/**
 * Obtiene estadísticas de uso de espacios comunes
 */
export async function obtenerEstadisticasEspacios(
  companyId: string,
  mes?: number,
  anio?: number
) {
  const now = new Date();
  const mesActual = mes || now.getMonth() + 1;
  const anioActual = anio || now.getFullYear();

  const fechaInicio = new Date(anioActual, mesActual - 1, 1);
  const fechaFin = new Date(anioActual, mesActual, 0, 23, 59, 59);

  const reservas = await prisma.spaceReservation.findMany({
    where: {
      companyId,
      fechaReserva: {
        gte: fechaInicio,
        lte: fechaFin,
      },
    },
    include: {
      space: true,
    },
  });

  // Agrupar por espacio
  const estadisticas = reservas.reduce((acc: any, reserva) => {
    const spaceId = reserva.spaceId;
    if (!acc[spaceId]) {
      acc[spaceId] = {
        nombre: reserva.space.nombre,
        tipo: reserva.space.tipo,
        totalReservas: 0,
        confirmadas: 0,
        canceladas: 0,
        completadas: 0,
        ingresoTotal: 0,
      };
    }
    acc[spaceId].totalReservas++;
    acc[spaceId][reserva.estado]++;
    if (reserva.monto) {
      acc[spaceId].ingresoTotal += reserva.monto;
    }
    return acc;
  }, {});

  return Object.values(estadisticas);
}
