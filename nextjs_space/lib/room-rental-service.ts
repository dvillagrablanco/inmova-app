/**
 * ROOM RENTAL SERVICE
 * Servicio completo para gestión de alquiler por habitaciones
 * Incluye: prorrateo de suministros, normas de convivencia, limpieza, analytics
 */

import { prisma } from './db';
import { addMonths, differenceInDays, format, startOfMonth, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';

// ========================================
// TIPOS Y INTERFACES
// ========================================

export interface UtilityProrationInput {
  totalAmount: number;
  rooms: Array<{
    roomId: string;
    surface: number;
    occupants: number;
  }>;
  prorationMethod: 'equal' | 'by_surface' | 'by_occupants' | 'combined';
}

export interface UtilityProrationResult {
  roomId: string;
  amount: number;
  percentage: number;
  method: string;
}

export interface CleaningSchedule {
  week: number;
  tenant: {
    id: string;
    name: string;
  };
  rooms: string[];
  date: Date;
}

export interface RoomAvailability {
  roomId: string;
  isAvailable: boolean;
  currentContract?: any;
  nextAvailableDate?: Date;
}

export interface RoomAnalytics {
  occupancyRate: number;
  averageStayDuration: number;
  totalRevenue: number;
  averageRoomPrice: number;
  topPerformingRooms: Array<{
    roomId: string;
    roomNumber: string;
    revenue: number;
    occupancyRate: number;
  }>;
}

// ========================================
// PRORRATEO DE SUMINISTROS
// ========================================

/**
 * Calcula el prorrateo de suministros (luz, agua, gas) entre habitaciones
 * Soporta 4 métodos: igual, por superficie, por ocupantes, combinado
 */
export async function calculateUtilityProration(
  input: UtilityProrationInput
): Promise<UtilityProrationResult[]> {
  const results: UtilityProrationResult[] = [];

  switch (input.prorationMethod) {
    case 'equal':
      // División equitativa
      const equalAmount = input.totalAmount / input.rooms.length;
      input.rooms.forEach((room) => {
        results.push({
          roomId: room.roomId,
          amount: parseFloat(equalAmount.toFixed(2)),
          percentage: parseFloat((100 / input.rooms.length).toFixed(2)),
          method: 'División equitativa',
        });
      });
      break;

    case 'by_surface':
      // Por superficie
      const totalSurface = input.rooms.reduce((sum, room) => sum + room.surface, 0);
      input.rooms.forEach((room) => {
        const percentage = (room.surface / totalSurface) * 100;
        const amount = (input.totalAmount * room.surface) / totalSurface;
        results.push({
          roomId: room.roomId,
          amount: parseFloat(amount.toFixed(2)),
          percentage: parseFloat(percentage.toFixed(2)),
          method: 'Por superficie',
        });
      });
      break;

    case 'by_occupants':
      // Por número de ocupantes
      const totalOccupants = input.rooms.reduce((sum, room) => sum + room.occupants, 0);
      input.rooms.forEach((room) => {
        const percentage = (room.occupants / totalOccupants) * 100;
        const amount = (input.totalAmount * room.occupants) / totalOccupants;
        results.push({
          roomId: room.roomId,
          amount: parseFloat(amount.toFixed(2)),
          percentage: parseFloat(percentage.toFixed(2)),
          method: 'Por ocupantes',
        });
      });
      break;

    case 'combined':
      // Combinado: 50% por superficie + 50% por ocupantes
      const totalSurfaceComb = input.rooms.reduce((sum, room) => sum + room.surface, 0);
      const totalOccupantsComb = input.rooms.reduce((sum, room) => sum + room.occupants, 0);
      
      input.rooms.forEach((room) => {
        const surfacePercentage = room.surface / totalSurfaceComb;
        const occupantsPercentage = room.occupants / totalOccupantsComb;
        const combinedPercentage = (surfacePercentage + occupantsPercentage) / 2;
        const amount = input.totalAmount * combinedPercentage;
        
        results.push({
          roomId: room.roomId,
          amount: parseFloat(amount.toFixed(2)),
          percentage: parseFloat((combinedPercentage * 100).toFixed(2)),
          method: 'Método combinado (superficie + ocupantes)',
        });
      });
      break;
  }

  return results;
}

/**
 * Aplica el prorrateo de suministros a todos los contratos activos de una unidad
 */
export async function applyUtilityProrationToUnit(
  unitId: string,
  companyId: string,
  utilities: {
    electricity?: number;
    water?: number;
    gas?: number;
    internet?: number;
    cleaning?: number;
  },
  prorationMethod: 'equal' | 'by_surface' | 'by_occupants' | 'combined' = 'combined'
) {
  // 1. Obtener todas las habitaciones ocupadas con contratos activos
  const activeRooms = await prisma.room.findMany({
    where: {
      unitId,
      companyId,
      estado: 'ocupada',
    },
    include: {
      contracts: {
        where: { estado: 'activo' },
        include: { tenant: true },
      },
    },
  });

  if (activeRooms.length === 0) {
    throw new Error('No hay habitaciones ocupadas en esta unidad');
  }

  // 2. Preparar datos para prorrateo
  const roomsForProration = activeRooms.map((room) => ({
    roomId: room.id,
    surface: room.superficie,
    occupants: 1, // Por ahora 1 por habitación, se puede mejorar
  }));

  // 3. Calcular prorrateo para cada suministro
  const results: Record<string, UtilityProrationResult[]> = {};

  if (utilities.electricity) {
    results.electricity = await calculateUtilityProration({
      totalAmount: utilities.electricity,
      rooms: roomsForProration,
      prorationMethod,
    });
  }

  if (utilities.water) {
    results.water = await calculateUtilityProration({
      totalAmount: utilities.water,
      rooms: roomsForProration,
      prorationMethod,
    });
  }

  if (utilities.gas) {
    results.gas = await calculateUtilityProration({
      totalAmount: utilities.gas,
      rooms: roomsForProration,
      prorationMethod,
    });
  }

  if (utilities.internet) {
    results.internet = await calculateUtilityProration({
      totalAmount: utilities.internet,
      rooms: roomsForProration,
      prorationMethod,
    });
  }

  if (utilities.cleaning) {
    results.cleaning = await calculateUtilityProration({
      totalAmount: utilities.cleaning,
      rooms: roomsForProration,
      prorationMethod,
    });
  }

  // 4. Crear pagos prorrateados para cada contrato activo
  const currentMonth = startOfMonth(new Date());
  const payments = [];

  for (const room of activeRooms) {
    const activeContract = room.contracts.find((c) => c.estado === 'activo');
    if (!activeContract) continue;

    const paymentData: any = {
      companyId,
      contractId: activeContract.id,
      concepto: `Renta y suministros - ${format(currentMonth, 'MMMM yyyy', { locale: es })}`,
      mes: currentMonth,
      monto: activeContract.rentaMensual,
      montoProrrateoLuz: results.electricity?.find((r) => r.roomId === room.id)?.amount || 0,
      montoProrrateoAgua: results.water?.find((r) => r.roomId === room.id)?.amount || 0,
      montoProrrateoGas: results.gas?.find((r) => r.roomId === room.id)?.amount || 0,
      montoProrrateoInternet: results.internet?.find((r) => r.roomId === room.id)?.amount || 0,
      montoProrrateoLimpieza: results.cleaning?.find((r) => r.roomId === room.id)?.amount || 0,
      fechaVencimiento: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), activeContract.diaPago),
      estado: 'pendiente' as const,
    };

    // Sumar todos los prorrateos al monto total
    paymentData.monto += (
      (paymentData.montoProrrateoLuz || 0) +
      (paymentData.montoProrrateoAgua || 0) +
      (paymentData.montoProrrateoGas || 0) +
      (paymentData.montoProrrateoInternet || 0) +
      (paymentData.montoProrrateoLimpieza || 0)
    );

    const payment = await prisma.roomPayment.create({ data: paymentData });
    payments.push(payment);
  }

  return {
    prorationDetails: results,
    paymentsCreated: payments,
    summary: {
      totalRooms: activeRooms.length,
      method: prorationMethod,
      totalUtilities:
        (utilities.electricity || 0) +
        (utilities.water || 0) +
        (utilities.gas || 0) +
        (utilities.internet || 0) +
        (utilities.cleaning || 0),
    },
  };
}

// ========================================
// CALENDARIO DE LIMPIEZA
// ========================================

/**
 * Genera un calendario de limpieza rotativo para espacios comunes
 */
export async function generateCleaningSchedule(
  unitId: string,
  companyId: string,
  startDate: Date,
  weeksAhead: number = 12
): Promise<CleaningSchedule[]> {
  // 1. Obtener contratos activos
  const activeContracts = await prisma.roomContract.findMany({
    where: {
      companyId,
      room: { unitId },
      estado: 'activo',
    },
    include: {
      tenant: true,
      room: true,
    },
  });

  if (activeContracts.length === 0) {
    throw new Error('No hay contratos activos para generar calendario');
  }

  // 2. Crear rotación
  const schedule: CleaningSchedule[] = [];
  let currentWeek = 0;
  let currentDate = new Date(startDate);

  for (let week = 0; week < weeksAhead; week++) {
    const contractIndex = week % activeContracts.length;
    const assignedContract = activeContracts[contractIndex];

    schedule.push({
      week: week + 1,
      tenant: {
        id: assignedContract.tenantId,
        name: assignedContract.tenant.nombreCompleto,
      },
      rooms: ['Cocina', 'Sala', 'Baños comunes'], // Espacios comunes típicos
      date: new Date(currentDate),
    });

    // Avanzar una semana
    currentDate = new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000);
  }

  return schedule;
}

/**
 * Guarda el calendario de limpieza en el contrato
 */
export async function saveCleaningScheduleToContracts(
  unitId: string,
  companyId: string,
  startDate: Date
) {
  const schedule = await generateCleaningSchedule(unitId, companyId, startDate, 12);

  // Convertir a formato JSON para guardar
  const rotationData: Record<string, string> = {};
  schedule.forEach((entry) => {
    rotationData[`semana${entry.week}`] = entry.tenant.id;
  });

  // Actualizar todos los contratos activos con el calendario
  await prisma.roomContract.updateMany({
    where: {
      companyId,
      room: { unitId },
      estado: 'activo',
    },
    data: {
      rotacionLimpieza: rotationData,
    },
  });

  return schedule;
}

// ========================================
// DISPONIBILIDAD Y GESTIÓN
// ========================================

/**
 * Verifica la disponibilidad de una habitación
 */
export async function checkRoomAvailability(
  roomId: string,
  startDate: Date,
  endDate: Date
): Promise<RoomAvailability> {
  const room = await prisma.room.findUnique({
    where: { id: roomId },
    include: {
      contracts: {
        where: {
          OR: [
            { estado: 'activo' },
            { estado: 'pendiente' },
          ],
        },
        orderBy: { fechaFin: 'desc' },
      },
    },
  });

  if (!room) {
    throw new Error('Habitación no encontrada');
  }

  // Verificar conflictos con contratos existentes
  const hasConflict = room.contracts.some((contract) => {
    return (
      (startDate >= contract.fechaInicio && startDate <= contract.fechaFin) ||
      (endDate >= contract.fechaInicio && endDate <= contract.fechaFin) ||
      (startDate <= contract.fechaInicio && endDate >= contract.fechaFin)
    );
  });

  const currentContract = room.contracts.find((c) => c.estado === 'activo');
  const nextAvailableDate = currentContract ? new Date(currentContract.fechaFin) : new Date();

  return {
    roomId: room.id,
    isAvailable: !hasConflict && room.estado === 'disponible',
    currentContract,
    nextAvailableDate,
  };
}

/**
 * Obtiene todas las habitaciones disponibles de una unidad
 */
export async function getAvailableRooms(
  unitId: string,
  companyId: string,
  startDate?: Date,
  endDate?: Date
) {
  const rooms = await prisma.room.findMany({
    where: {
      unitId,
      companyId,
    },
    include: {
      contracts: {
        where: {
          OR: [{ estado: 'activo' }, { estado: 'pendiente' }],
        },
      },
      unit: {
        include: {
          building: true,
        },
      },
    },
  });

  if (!startDate || !endDate) {
    // Sin fechas, solo devolver habitaciones disponibles
    return rooms.filter((room) => room.estado === 'disponible' && room.contracts.length === 0);
  }

  // Con fechas, verificar disponibilidad
  const availableRooms = [];
  for (const room of rooms) {
    const availability = await checkRoomAvailability(room.id, startDate, endDate);
    if (availability.isAvailable) {
      availableRooms.push(room);
    }
  }

  return availableRooms;
}

// ========================================
// ANALYTICS Y REPORTES
// ========================================

/**
 * Genera analíticas del modelo de alquiler por habitaciones
 */
export async function getRoomRentalAnalytics(
  companyId: string,
  unitId?: string,
  startDate?: Date,
  endDate?: Date
): Promise<RoomAnalytics> {
  const whereClause: any = { companyId };
  if (unitId) whereClause.unitId = unitId;

  // 1. Obtener todas las habitaciones
  const rooms = await prisma.room.findMany({
    where: whereClause,
    include: {
      contracts: {
        where: startDate && endDate
          ? {
              OR: [
                {
                  fechaInicio: { gte: startDate, lte: endDate },
                },
                {
                  fechaFin: { gte: startDate, lte: endDate },
                },
              ],
            }
          : {},
        include: {
          payments: true,
        },
      },
    },
  });

  // 2. Calcular métricas
  const totalRooms = rooms.length;
  const occupiedRooms = rooms.filter((r) => r.estado === 'ocupada').length;
  const occupancyRate = totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0;

  // 3. Calcular duración promedio de estancia
  let totalDays = 0;
  let totalContracts = 0;
  rooms.forEach((room) => {
    room.contracts.forEach((contract) => {
      const days = differenceInDays(contract.fechaFin, contract.fechaInicio);
      totalDays += days;
      totalContracts++;
    });
  });
  const averageStayDuration = totalContracts > 0 ? totalDays / totalContracts : 0;

  // 4. Calcular ingresos totales
  let totalRevenue = 0;
  rooms.forEach((room) => {
    room.contracts.forEach((contract) => {
      contract.payments.forEach((payment) => {
        if (payment.estado === 'pagado') {
          totalRevenue += payment.monto;
        }
      });
    });
  });

  // 5. Precio promedio por habitación
  const averageRoomPrice =
    rooms.length > 0
      ? rooms.reduce((sum, room) => sum + room.precioPorMes, 0) / rooms.length
      : 0;

  // 6. Habitaciones con mejor rendimiento
  const roomPerformance = rooms.map((room) => {
    const roomRevenue = room.contracts.reduce((sum, contract) => {
      return (
        sum +
        contract.payments.reduce((pSum, payment) => {
          return payment.estado === 'pagado' ? pSum + payment.monto : pSum;
        }, 0)
      );
    }, 0);

    const occupiedDays = room.contracts.reduce((sum, contract) => {
      return sum + differenceInDays(contract.fechaFin, contract.fechaInicio);
    }, 0);

    const totalDaysPeriod = startDate && endDate ? differenceInDays(endDate, startDate) : 365;
    const roomOccupancyRate = (occupiedDays / totalDaysPeriod) * 100;

    return {
      roomId: room.id,
      roomNumber: room.numero,
      revenue: roomRevenue,
      occupancyRate: roomOccupancyRate,
    };
  });

  const topPerformingRooms = roomPerformance
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  return {
    occupancyRate: parseFloat(occupancyRate.toFixed(2)),
    averageStayDuration: parseFloat(averageStayDuration.toFixed(1)),
    totalRevenue: parseFloat(totalRevenue.toFixed(2)),
    averageRoomPrice: parseFloat(averageRoomPrice.toFixed(2)),
    topPerformingRooms,
  };
}

/**
 * Genera plantilla de normas de convivencia
 */
export function generateColivingRulesTemplate(
  customRules?: string[]
): string {
  const defaultRules = [
    '🔇 Horario de silencio: 22:00 - 8:00',
    '🧼 Mantener limpios los espacios comunes después de usarlos',
    '🚪 Las visitas deben salir antes de las 23:00',
    '🧹 Respetar el calendario de limpieza asignado',
    '🍽️ Lavar y guardar los platos inmediatamente después de usarlos',
    '🚫 Prohibido fumar en espacios comunes',
    '🐕 Las mascotas deben estar siempre supervisadas',
    '📦 No dejar pertenencias personales en áreas comunes',
    '♻️ Separar correctamente los residuos según el sistema de reciclaje',
    '💡 Apagar luces y electrodomésticos al salir',
  ];

  const allRules = [...defaultRules, ...(customRules || [])];
  
  return `
# NORMAS DE CONVIVENCIA

## Reglas Generales

${allRules.map((rule, index) => `${index + 1}. ${rule}`).join('\n')}

## Consecuencias por Incumplimiento

- Primera infracción: Advertencia verbal
- Segunda infracción: Advertencia escrita
- Tercera infracción: Reunión con el administrador
- Infracciones graves o repetidas: Posible terminación del contrato

## Resolución de Conflictos

Ante cualquier problema o conflicto, se recomienda:
1. Hablar directamente con la(s) persona(s) involucrada(s)
2. Si no se resuelve, contactar al administrador
3. Como último recurso, se realizará una reunión de convivencia

---

*Última actualización: ${format(new Date(), 'dd/MM/yyyy', { locale: es })}*
  `.trim();
}
