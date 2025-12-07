/**
 * ROOM RENTAL SERVICE
 * Servicio completo para gestión de alquiler por habitaciones
 * Incluye: prorrateo de suministros, normas de convivencia, limpieza, analytics
 */

import { prisma } from './db';
import { RoomPayment } from '@prisma/client';
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
  const payments: RoomPayment[] = [];

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
  const availableRooms: typeof rooms = [];
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

// ========================================
// PLANTILLAS DE CONTRATO PARA HABITACIONES
// ========================================

export interface RoomContractTemplateData {
  // Datos del propietario/arrendador
  landlordName: string;
  landlordId: string;
  landlordAddress: string;
  
  // Datos del inquilino
  tenantName: string;
  tenantId: string;
  tenantEmail: string;
  tenantPhone: string;
  
  // Datos de la propiedad
  buildingAddress: string;
  roomNumber: string;
  roomSurface: number;
  commonAreas: string[];
  
  // Datos económicos
  monthlyRent: number;
  deposit: number;
  utilitiesIncluded: boolean;
  utilityProrationMethod?: string;
  
  // Fechas
  startDate: Date;
  endDate: Date;
  
  // Reglas adicionales
  customRules?: string[];
}

/**
 * Genera contrato completo para alquiler de habitación
 */
export function generateRoomRentalContract(data: RoomContractTemplateData): string {
  const contractDate = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: es });
  const startDateFormatted = format(data.startDate, "dd 'de' MMMM 'de' yyyy", { locale: es });
  const endDateFormatted = format(data.endDate, "dd 'de' MMMM 'de' yyyy", { locale: es });
  const duration = Math.ceil((data.endDate.getTime() - data.startDate.getTime()) / (1000 * 60 * 60 * 24 * 30));
  
  return `
# CONTRATO DE ARRENDAMIENTO DE HABITACIÓN

En la ciudad que corresponda, a fecha de ${contractDate}

## PARTES CONTRATANTES

**ARRENDADOR:**
- Nombre: ${data.landlordName}
- DNI/NIE: ${data.landlordId}
- Domicilio: ${data.landlordAddress}

**ARRENDATARIO:**
- Nombre: ${data.tenantName}
- DNI/NIE: ${data.tenantId}
- Email: ${data.tenantEmail}
- Teléfono: ${data.tenantPhone}

## I. OBJETO DEL CONTRATO

El ARRENDADOR cede en arrendamiento al ARRENDATARIO una habitación individual en la propiedad ubicada en:

**${data.buildingAddress}**

**Habitación número:** ${data.roomNumber}
**Superficie:** ${data.roomSurface} m²

### Áreas Comunes Incluidas:
${data.commonAreas.map((area, i) => `${i + 1}. ${area}`).join('\n')}

## II. DURACIÓN DEL CONTRATO

- **Fecha de inicio:** ${startDateFormatted}
- **Fecha de finalización:** ${endDateFormatted}
- **Duración:** ${duration} meses

El contrato se renovará automáticamente por períodos iguales salvo notificación de alguna de las partes con al menos 30 días de antelación.

## III. RENTA Y FORMA DE PAGO

### Renta Mensual
**€${data.monthlyRent.toLocaleString('es-ES')}** (${numberToWords(data.monthlyRent)} euros)

La renta se abonará dentro de los primeros 5 días naturales de cada mes mediante transferencia bancaria a la cuenta designada por el ARRENDADOR.

### Fianza
**€${data.deposit.toLocaleString('es-ES')}** (${numberToWords(data.deposit)} euros)

La fianza será devuelta al finalizar el contrato, previa comprobación del estado de la habitación y liquidación de deudas pendientes.

## IV. GASTOS Y SUMINISTROS

${data.utilitiesIncluded 
  ? `Los suministros (agua, luz, gas, internet) están **INCLUIDOS** en la renta mensual.

${data.utilityProrationMethod 
  ? `Los gastos de suministros se prorratean entre todas las habitaciones usando el método: **${data.utilityProrationMethod}**`
  : ''}` 
  : `Los suministros (agua, luz, gas, internet) **NO están incluidos** en la renta y se prorratearán entre todos los arrendatarios según consumo o superficie.`
}

### Concepto de Gastos Comunes
- Luz
- Agua
- Gas
- Internet/WiFi
- Limpieza de zonas comunes (opcional)

## V. NORMAS DE CONVIVENCIA

Ambas partes acuerdan respetar las siguientes normas:

${generateColivingRulesTemplate(data.customRules)}

## VI. OBLIGACIONES DEL ARRENDATARIO

1. **Pago puntual** de la renta y gastos acordados.
2. **Uso adecuado** de la habitación y áreas comunes.
3. **Mantenimiento** del buen estado de la habitación.
4. **Respeto** a los demás inquilinos y vecinos.
5. **Comunicación** de cualquier desperfecto o avería.
6. **No subarrendar** la habitación sin autorización expresa.
7. **Permitir** inspecciones previo aviso de 24 horas.

## VII. OBLIGACIONES DEL ARRENDADOR

1. **Entregar** la habitación en condiciones habitables.
2. **Mantener** en buen estado las instalaciones comunes.
3. **Realizar** reparaciones necesarias en tiempo razonable.
4. **Respetar** la privacidad del arrendatario.
5. **Devolver** la fianza al término del contrato según condiciones.
6. **Emitir** recibos de pago mensuales.

## VIII. CAUSAS DE RESOLUCIÓN

El contrato podrá resolverse por:

1. **Mutuo acuerdo** de ambas partes.
2. **Expiración** del plazo pactado sin renovación.
3. **Impago** de dos mensualidades consecutivas.
4. **Incumplimiento grave** de las normas de convivencia.
5. **Daños intencionados** a la propiedad.
6. **Uso indebido** de la vivienda.

En caso de resolución anticipada por parte del arrendatario, deberá notificarse con **30 días de antelación**.

## IX. INVENTARIO

Al inicio del contrato se ha realizado un inventario detallado del mobiliario y equipamiento de la habitación:

✓ Cama individual/doble
✓ Armario/Closet
✓ Escritorio y silla
✓ Mesita de noche
✓ Lámpara
✓ Cortinas/Persianas
✓ Cerradura con llave individual

Estado general al inicio: **Buen estado**

## X. PROTECCIÓN DE DATOS

En cumplimiento de la normativa de protección de datos (RGPD), el ARRENDADOR informa que los datos personales del ARRENDATARIO serán tratados exclusivamente para la gestión del presente contrato.

## XI. LEGISLACIÓN APLICABLE

El presente contrato se rige por la Ley de Arrendamientos Urbanos (LAU) y demás normativa aplicable vigente en España.

## XII. JURISDICCIÓN

Para cualquier controversia derivada del presente contrato, ambas partes se someten a los Juzgados y Tribunales de la ciudad correspondiente.

---

**Leído y conforme, se firma el presente contrato por duplicado en el lugar y fecha arriba indicados.**

___________________________
**${data.landlordName}**
ARRENDADOR
DNI: ${data.landlordId}

___________________________
**${data.tenantName}**
ARRENDATARIO
DNI: ${data.tenantId}

---

*Documento generado el ${contractDate}*
*Sistema INMOVA - Gestión Inmobiliaria Inteligente*
  `.trim();
}

/**
 * Genera anexo de inventario detallado
 */
export function generateRoomInventoryAnnex(
  roomNumber: string,
  items: Array<{ name: string; quantity: number; condition: string; observations?: string }>
): string {
  const today = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: es });
  
  return `
# ANEXO I: INVENTARIO DETALLADO
## Habitación ${roomNumber}

Fecha: ${today}

| Artículo | Cantidad | Estado | Observaciones |
|----------|----------|--------|---------------|
${items.map(item => 
  `| ${item.name} | ${item.quantity} | ${item.condition} | ${item.observations || '-'} |`
).join('\n')}

**Estado General:** El inquilino reconoce haber recibido la habitación y sus enseres en el estado descrito.

Al término del contrato, se realizará una nueva inspección para verificar el estado de los elementos inventariados.

---

**Firmas:**

___________________________          ___________________________
**ARRENDADOR**                       **ARRENDATARIO**

*Fecha: ${today}*
  `.trim();
}

/**
 * Genera addenda para modificaciones del contrato
 */
export function generateContractAddendum(
  contractId: string,
  modifications: Array<{ section: string; oldValue: string; newValue: string; reason: string }>,
  landlordName: string,
  tenantName: string
): string {
  const today = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: es });
  
  return `
# ADDENDA AL CONTRATO DE ARRENDAMIENTO
## Contrato ID: ${contractId}

Fecha: ${today}

Las partes firmantes del contrato original acuerdan las siguientes modificaciones:

## MODIFICACIONES

${modifications.map((mod, i) => `
### ${i + 1}. Modificación de: ${mod.section}

**Valor Original:** ${mod.oldValue}
**Nuevo Valor:** ${mod.newValue}
**Motivo:** ${mod.reason}
`).join('\n')}

## VIGENCIA

Las presentes modificaciones entran en vigor a partir de la fecha de firma de esta addenda y forman parte integrante del contrato original.

Las demás cláusulas del contrato que no hayan sido modificadas permanecen vigentes.

---

**Leído y conforme:**

___________________________          ___________________________
**${landlordName}**                  **${tenantName}**
ARRENDADOR                           ARRENDATARIO

*Fecha: ${today}*
  `.trim();
}

/**
 * Función auxiliar para convertir números a palabras (simplificada)
 */
function numberToWords(num: number): string {
  // Implementación simplificada para números comunes en rentas
  const hundreds = Math.floor(num / 100);
  const tens = Math.floor((num % 100) / 10);
  const units = num % 10;
  
  const hundredsWords = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos'];
  const tensWords = ['', '', 'veinte', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
  const unitsWords = ['', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve'];
  const teens = ['diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve'];
  
  let result = '';
  
  if (hundreds === 1 && tens === 0 && units === 0) {
    result = 'cien';
  } else {
    if (hundreds > 0) result += hundredsWords[hundreds];
    if (tens === 1) {
      result += (result ? ' ' : '') + teens[units];
      return result;
    } else {
      if (tens > 0) result += (result ? ' ' : '') + tensWords[tens];
      if (units > 0) {
        if (tens === 2) {
          result += (units === 1 ? 'uno' : units === 2 ? 'dos' : units === 3 ? 'tres' : units === 4 ? 'cuatro' : units === 5 ? 'cinco' : units === 6 ? 'seis' : units === 7 ? 'siete' : units === 8 ? 'ocho' : 'nueve');
        } else {
          result += (result ? ' y ' : '') + unitsWords[units];
        }
      }
    }
  }
  
  return result || 'cero';
}
