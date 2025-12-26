import { prisma } from './db';
import { addMonths, startOfMonth, endOfMonth, addDays } from 'date-fns';

export class ColivingSpacesService {
  // ==========================================
  // SISTEMA DE COLA DE ESPERA
  // ==========================================

  /**
   * Agregar tenant a cola de espera para un espacio
   */
  static async addToWaitlist(data: {
    companyId: string;
    spaceId: string;
    tenantId: string;
    fechaDeseada: Date;
    horaInicio: string;
    horaFin: string;
    duracionHoras: number;
    prioridad?: number;
  }) {
    const waitlist = await prisma.spaceWaitlist.create({
      data: {
        companyId: data.companyId,
        spaceId: data.spaceId,
        tenantId: data.tenantId,
        fechaDeseada: data.fechaDeseada,
        horaInicio: data.horaInicio,
        horaFin: data.horaFin,
        duracionHoras: data.duracionHoras,
        prioridad: data.prioridad || 1,
        status: 'activa',
      },
    });

    return waitlist;
  }

  /**
   * Obtener lista de espera para un espacio específico
   */
  static async getWaitlist(spaceId: string) {
    const waitlist = await prisma.spaceWaitlist.findMany({
      where: {
        spaceId,
        status: 'activa',
      },
      include: {
        tenant: {
          select: {
            id: true,
            nombreCompleto: true,
            email: true,
          },
        },
      },
      orderBy: [{ prioridad: 'desc' }, { fechaSolicitud: 'asc' }],
    });

    return waitlist;
  }

  /**
   * Notificar a los tenants en cola de espera cuando se libera un espacio
   */
  static async notifyWaitlist(spaceId: string, fechaDisponible: Date) {
    const waitlistEntries = await prisma.spaceWaitlist.findMany({
      where: {
        spaceId,
        status: 'activa',
        fechaDeseada: fechaDisponible,
      },
      orderBy: [{ prioridad: 'desc' }, { fechaSolicitud: 'asc' }],
      take: 5, // Notificar a los primeros 5
    });

    // Actualizar estado a notificado
    for (const entry of waitlistEntries) {
      await prisma.spaceWaitlist.update({
        where: { id: entry.id },
        data: {
          status: 'notificado',
          fechaNotificado: new Date(),
        },
      });
    }

    return waitlistEntries;
  }

  /**
   * Convertir entrada de waitlist en reserva
   */
  static async convertWaitlistToReservation(waitlistId: string) {
    const waitlistEntry = await prisma.spaceWaitlist.findUnique({
      where: { id: waitlistId },
      include: { space: true },
    });

    if (!waitlistEntry) {
      throw new Error('Entrada de waitlist no encontrada');
    }

    // Verificar créditos
    const hasCredits = await this.checkReservationCredits(waitlistEntry.tenantId);
    if (!hasCredits) {
      throw new Error('Créditos insuficientes');
    }

    // Crear reserva
    const reservation = await prisma.spaceReservation.create({
      data: {
        companyId: waitlistEntry.companyId,
        spaceId: waitlistEntry.spaceId,
        tenantId: waitlistEntry.tenantId,
        fechaReserva: waitlistEntry.fechaDeseada,
        horaInicio: waitlistEntry.horaInicio,
        horaFin: waitlistEntry.horaFin,
        estado: 'confirmada',
        monto: waitlistEntry.space.requierePago
          ? waitlistEntry.space.costoPorHora! * waitlistEntry.duracionHoras
          : 0,
        pagado: !waitlistEntry.space.requierePago,
      },
    });

    // Descontar créditos
    await this.useReservationCredits(waitlistEntry.tenantId, 1);

    // Actualizar waitlist
    await prisma.spaceWaitlist.update({
      where: { id: waitlistId },
      data: { status: 'convertida' },
    });

    return reservation;
  }

  // ==========================================
  // SISTEMA DE CRÉDITOS DE RESERVA
  // ==========================================

  /**
   * Inicializar créditos para un tenant
   */
  static async initializeCredits(tenantId: string) {
    const credits = await prisma.reservationCredits.create({
      data: {
        tenantId,
        creditosActuales: 10,
        creditosMaximos: 10,
        creditosUsados: 0,
        proximaRecarga: addMonths(new Date(), 1),
      },
    });

    return credits;
  }

  /**
   * Obtener créditos de un tenant
   */
  static async getCredits(tenantId: string): Promise<any> {
    let credits = await prisma.reservationCredits.findUnique({
      where: { tenantId },
    });

    if (!credits) {
      credits = await this.initializeCredits(tenantId);
    }

    // Verificar si es momento de recargar
    if (new Date() >= credits.proximaRecarga) {
      credits = await this.rechargeCredits(tenantId);
    }

    return credits;
  }

  /**
   * Verificar si el tenant tiene créditos suficientes
   */
  static async checkReservationCredits(tenantId: string, creditsNeeded: number = 1) {
    const credits = await this.getCredits(tenantId);
    return credits.creditosActuales >= creditsNeeded;
  }

  /**
   * Usar créditos para hacer una reserva
   */
  static async useReservationCredits(tenantId: string, creditsToUse: number = 1) {
    const credits = await this.getCredits(tenantId);

    if (credits.creditosActuales < creditsToUse) {
      throw new Error('Créditos insuficientes');
    }

    const updated = await prisma.reservationCredits.update({
      where: { tenantId },
      data: {
        creditosActuales: credits.creditosActuales - creditsToUse,
        creditosUsados: credits.creditosUsados + creditsToUse,
      },
    });

    return updated;
  }

  /**
   * Recargar créditos mensualmente
   */
  static async rechargeCredits(tenantId: string): Promise<any> {
    const credits = await this.getCredits(tenantId);

    const updated = await prisma.reservationCredits.update({
      where: { tenantId },
      data: {
        creditosActuales: credits.creditosMaximos,
        ultimaRecarga: new Date(),
        proximaRecarga: addMonths(new Date(), 1),
      },
    });

    return updated;
  }

  // ==========================================
  // SISTEMA DE PENALIZACIONES POR NO-SHOWS
  // ==========================================

  /**
   * Marcar reserva como no-show y aplicar penalización
   */
  static async markNoShow(reservationId: string) {
    const reservation = await prisma.spaceReservation.findUnique({
      where: { id: reservationId },
    });

    if (!reservation) {
      throw new Error('Reserva no encontrada');
    }

    // Aplicar penalización: descontar 2 créditos adicionales
    const penaltyCredits = 2;

    const credits = await prisma.reservationCredits.findUnique({
      where: { tenantId: reservation.tenantId },
    });

    if (credits) {
      await prisma.reservationCredits.update({
        where: { tenantId: reservation.tenantId },
        data: {
          creditosActuales: Math.max(0, credits.creditosActuales - penaltyCredits),
          penalizacionesTotal: credits.penalizacionesTotal + penaltyCredits,
        },
      });
    }

    // Actualizar reserva
    const updated = await prisma.spaceReservation.update({
      where: { id: reservationId },
      data: {
        noShow: true,
        penaltyApplied: true,
        penaltyCredits,
        estado: 'cancelada',
      },
    });

    return updated;
  }

  /**
   * Confirmar check-in de una reserva
   */
  static async confirmCheckIn(reservationId: string) {
    const updated = await prisma.spaceReservation.update({
      where: { id: reservationId },
      data: {
        checkInConfirmado: true,
        horaCheckIn: new Date(),
      },
    });

    return updated;
  }

  /**
   * Verificar no-shows automáticamente
   */
  static async checkForNoShows() {
    const now = new Date();
    const grace_period = 15; // 15 minutos de gracia

    // Buscar reservas que deberían haber iniciado hace más de 15 minutos sin check-in
    const reservations = await prisma.spaceReservation.findMany({
      where: {
        fechaReserva: {
          lt: new Date(now.getTime() - grace_period * 60000),
        },
        estado: 'confirmada',
        checkInConfirmado: false,
        noShow: false,
      },
    });

    for (const reservation of reservations) {
      await this.markNoShow(reservation.id);
    }

    return reservations;
  }

  // ==========================================
  // SISTEMA DE RATING DE ESPACIOS
  // ==========================================

  /**
   * Crear rating para un espacio después de una reserva
   */
  static async createSpaceRating(data: {
    companyId: string;
    spaceId: string;
    tenantId: string;
    reservationId: string;
    puntuacion: number;
    comentario?: string;
    aspectosPositivos?: string[];
    aspectosNegativos?: string[];
  }) {
    // Determinar categoría según puntuación
    let categoria: 'excelente' | 'muy_bueno' | 'bueno' | 'regular' | 'malo';
    if (data.puntuacion === 5) categoria = 'excelente';
    else if (data.puntuacion === 4) categoria = 'muy_bueno';
    else if (data.puntuacion === 3) categoria = 'bueno';
    else if (data.puntuacion === 2) categoria = 'regular';
    else categoria = 'malo';

    const rating = await prisma.spaceRating.create({
      data: {
        companyId: data.companyId,
        spaceId: data.spaceId,
        tenantId: data.tenantId,
        reservationId: data.reservationId,
        puntuacion: data.puntuacion,
        categoria,
        comentario: data.comentario,
        aspectosPositivos: data.aspectosPositivos || [],
        aspectosNegativos: data.aspectosNegativos || [],
      },
    });

    return rating;
  }

  /**
   * Obtener ratings de un espacio
   */
  static async getSpaceRatings(spaceId: string) {
    const ratings = await prisma.spaceRating.findMany({
      where: { spaceId },
      include: {
        tenant: {
          select: {
            nombreCompleto: true,
          },
        },
      },
      orderBy: { fechaRating: 'desc' },
    });

    // Calcular promedio
    const promedio =
      ratings.length > 0 ? ratings.reduce((sum, r) => sum + r.puntuacion, 0) / ratings.length : 0;

    return {
      ratings,
      promedio: parseFloat(promedio.toFixed(2)),
      total: ratings.length,
    };
  }

  // ==========================================
  // MANTENIMIENTO PREDICTIVO
  // ==========================================

  /**
   * Analizar uso de un espacio y predecir necesidad de mantenimiento
   */
  static async analyzeMaintenance(spaceId: string, periodo: Date) {
    const inicioMes = startOfMonth(periodo);
    const finMes = endOfMonth(periodo);

    // Obtener reservas completadas en el periodo
    const reservations = await prisma.spaceReservation.findMany({
      where: {
        spaceId,
        fechaReserva: {
          gte: inicioMes,
          lte: finMes,
        },
        estado: 'completada',
      },
    });

    if (reservations.length === 0) {
      return null;
    }

    // Calcular métricas de uso
    const horasUso = reservations.reduce((sum: number, r: any) => {
      const [hInicio, mInicio] = r.horaInicio.split(':').map(Number);
      const [hFin, mFin] = r.horaFin.split(':').map(Number);
      const horas = (hFin * 60 + mFin - (hInicio * 60 + mInicio)) / 60;
      return sum + horas;
    }, 0);

    const promedioPersonas =
      reservations
        .filter((r: any) => r.numeroPersonas)
        .reduce((sum: number, r: any) => sum + (r.numeroPersonas || 0), 0) / reservations.length;

    // Calcular índice de desgaste (0-100)
    const indiceDesgaste = Math.min(
      100,
      (horasUso / 200) * 50 + // Horas de uso (50% del peso)
        (promedioPersonas / 10) * 30 + // Personas por uso (30% del peso)
        (reservations.length / 50) * 20 // Número de reservas (20% del peso)
    );

    // Determinar si necesita mantenimiento
    const mantenimientoSugerido = indiceDesgaste > 60;
    let tipoMantenimiento: string | null = null;
    let nivelUrgencia: 'alta' | 'media' | 'baja' = 'baja';
    let fechaSugerida: Date | null = null;
    let costoEstimado: number | null = null;
    let descripcion: string | null = null;

    if (mantenimientoSugerido) {
      if (indiceDesgaste > 80) {
        tipoMantenimiento = 'correctivo';
        nivelUrgencia = 'alta';
        fechaSugerida = addDays(new Date(), 7);
        costoEstimado = 300;
        descripcion =
          'Desgaste crítico detectado. Se recomienda mantenimiento correctivo inmediato.';
      } else if (indiceDesgaste > 60) {
        tipoMantenimiento = 'preventivo';
        nivelUrgencia = 'media';
        fechaSugerida = addDays(new Date(), 15);
        costoEstimado = 150;
        descripcion =
          'Desgaste moderado. Se recomienda mantenimiento preventivo en las próximas semanas.';
      }
    }

    // Guardar predicción
    const space = await prisma.commonSpace.findUnique({
      where: { id: spaceId },
    });

    if (!space) return null;

    const prediction = await prisma.spaceMaintenancePrediction.create({
      data: {
        companyId: space.companyId,
        spaceId,
        periodo,
        horasUsoEstimadas: horasUso,
        numeroReservasCompletadas: reservations.length,
        promedioPersonasPorReserva: promedioPersonas,
        indiceDesgaste: parseFloat(indiceDesgaste.toFixed(2)),
        mantenimientoSugerido,
        tipoMantenimientoSugerido: tipoMantenimiento,
        fechaSugeridaMantenimiento: fechaSugerida,
        descripcionRecomendacion: descripcion,
        costoEstimado,
        nivelUrgencia,
      },
    });

    return prediction;
  }

  /**
   * Obtener predicciones de mantenimiento pendientes
   */
  static async getPendingMaintenance(companyId: string) {
    const predictions = await prisma.spaceMaintenancePrediction.findMany({
      where: {
        companyId,
        mantenimientoSugerido: true,
        alertaEnviada: false,
      },
      include: {
        space: {
          select: {
            nombre: true,
            tipo: true,
          },
        },
      },
      orderBy: {
        nivelUrgencia: 'desc',
      },
    });

    return predictions;
  }

  /**
   * Marcar alerta de mantenimiento como enviada
   */
  static async markMaintenanceAlertSent(predictionId: string) {
    const updated = await prisma.spaceMaintenancePrediction.update({
      where: { id: predictionId },
      data: {
        alertaEnviada: true,
        fechaAlerta: new Date(),
      },
    });

    return updated;
  }
}
