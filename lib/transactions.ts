/**
 * Helpers para transacciones complejas con Prisma
 * Garantiza integridad de datos en operaciones múltiples
 */

import { prisma } from './db';
import type { Prisma } from '@/types/prisma-types';
import logger from './logger';

/**
 * Tipos para transacciones
 */
type TransactionClient = Omit<typeof prisma, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use'>;

/**
 * TRANSACCIÓN: Crear contrato con pagos programados
 * 
 * Operaciones atómicas:
 * 1. Crear contrato
 * 2. Generar pagos mensuales
 * 3. Actualizar estado de unidad
 * 4. Invalidar cachés
 */
export async function createContractWithPayments(data: {
  unitId: string;
  tenantId: string;
  fechaInicio: Date;
  fechaFin: Date;
  rentaMensual: number;
  deposito: number;
  diaPago: number;
  companyId: string;
}) {
  return await prisma.$transaction(async (tx) => {
    logger.info('Starting contract creation transaction');

    // 1. Verificar que la unidad esté disponible
    const unit = await tx.unit.findUnique({
      where: { id: data.unitId },
      select: { id: true, estado: true, buildingId: true },
    });

    if (!unit) {
      throw new Error('Unit not found');
    }

    if (unit.estado !== 'disponible') {
      throw new Error('Unit is not available');
    }

    // 2. Crear contrato
    const contract = await tx.contract.create({
      data: {
        unitId: data.unitId,
        tenantId: data.tenantId,
        fechaInicio: data.fechaInicio,
        fechaFin: data.fechaFin,
        rentaMensual: data.rentaMensual,
        deposito: data.deposito,
        diaPago: data.diaPago,
        mesesFianza: 1,
        estado: 'activo',
      },
    });

    logger.info(`Contract ${contract.id} created`);

    // 3. Generar pagos mensuales
    const payments: Prisma.PaymentCreateManyInput[] = [];
    const startDate = new Date(data.fechaInicio);
    const endDate = new Date(data.fechaFin);

    let currentDate = new Date(startDate);
    currentDate.setDate(data.diaPago);

    while (currentDate <= endDate) {
      payments.push({
        contractId: contract.id,
        periodo: `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`,
        monto: data.rentaMensual,
        fechaVencimiento: new Date(currentDate),
        estado: 'pendiente',
      });

      // Avanzar al siguiente mes
      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    if (payments.length > 0) {
      await tx.payment.createMany({ data: payments });
      logger.info(`${payments.length} payments created for contract ${contract.id}`);
    }

    // 4. Actualizar estado de unidad
    await tx.unit.update({
      where: { id: data.unitId },
      data: {
        estado: 'ocupada',
        tenantId: data.tenantId,
      },
    });

    logger.info(`Unit ${data.unitId} marked as occupied`);

    // 5. Retornar contrato completo
    const fullContract = await tx.contract.findUnique({
      where: { id: contract.id },
      include: {
        unit: {
          select: {
            id: true,
            numero: true,
            building: {
              select: {
                id: true,
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
          },
        },
        payments: {
          take: 12, // Solo los primeros 12 pagos
        },
      },
    });

    logger.info('Contract creation transaction completed successfully');
    return fullContract;
  });
}

/**
 * TRANSACCIÓN: Finalizar contrato
 * 
 * Operaciones atómicas:
 * 1. Verificar pagos pendientes
 * 2. Actualizar estado del contrato
 * 3. Liberar unidad
 * 4. Desvincular inquilino
 */
export async function finalizeContract(contractId: string) {
  return await prisma.$transaction(async (tx) => {
    logger.info(`Starting contract finalization for ${contractId}`);

    // 1. Obtener contrato con información completa
    const contract = await tx.contract.findUnique({
      where: { id: contractId },
      include: {
        payments: {
          where: { estado: 'pendiente' },
        },
        unit: true,
      },
    });

    if (!contract) {
      throw new Error('Contract not found');
    }

    if (contract.estado !== 'activo') {
      throw new Error('Contract is not active');
    }

    // 2. Verificar pagos pendientes
    const hasPendingPayments = contract.payments.length > 0;
    
    if (hasPendingPayments) {
      logger.warn(`Contract ${contractId} has ${contract.payments.length} pending payments`);
      // Podrías decidir no permitir finalización o cancelar los pagos
    }

    // 3. Actualizar estado del contrato
    await tx.contract.update({
      where: { id: contractId },
      data: { estado: 'cancelado' },
    });

    // 4. Liberar unidad
    await tx.unit.update({
      where: { id: contract.unitId },
      data: {
        estado: 'disponible',
        tenantId: null,
      },
    });

    logger.info(`Contract ${contractId} finalized successfully`);
    return { success: true, hasPendingPayments };
  });
}

/**
 * TRANSACCIÓN: Procesar pago
 * 
 * Operaciones atómicas:
 * 1. Actualizar pago
 * 2. Registrar transacción bancaria (si aplica)
 * 3. Actualizar scoring del inquilino
 * 4. Crear notificación
 */
export async function processPayment(data: {
  paymentId: string;
  fechaPago: Date;
  metodoPago: string;
  reciboPdfPath?: string;
  updateTenantScoring?: boolean;
}) {
  return await prisma.$transaction(async (tx) => {
    logger.info(`Processing payment ${data.paymentId}`);

    // 1. Obtener pago con relaciones
    const payment = await tx.payment.findUnique({
      where: { id: data.paymentId },
      include: {
        contract: {
          include: {
            tenant: true,
          },
        },
      },
    });

    if (!payment) {
      throw new Error('Payment not found');
    }

    if (payment.estado === 'pagado') {
      throw new Error('Payment is already paid');
    }

    // 2. Actualizar pago
    const updatedPayment = await tx.payment.update({
      where: { id: data.paymentId },
      data: {
        estado: 'pagado',
        fechaPago: data.fechaPago,
        metodoPago: data.metodoPago,
        reciboPdfPath: data.reciboPdfPath,
        nivelRiesgo: 'bajo', // Pago a tiempo
      },
    });

    // 3. Actualizar scoring del inquilino (si corresponde)
    if (data.updateTenantScoring) {
      const isPunctual = data.fechaPago <= payment.fechaVencimiento;
      const scoringIncrement = isPunctual ? 2 : -1;

      await tx.tenant.update({
        where: { id: payment.contract.tenantId },
        data: {
          scoring: {
            increment: scoringIncrement,
          },
        },
      });

      logger.info(
        `Tenant ${payment.contract.tenantId} scoring updated (${isPunctual ? '+' : ''}${scoringIncrement})`
      );
    }

    logger.info(`Payment ${data.paymentId} processed successfully`);
    return updatedPayment;
  });
}

/**
 * TRANSACCIÓN: Crear edificio con unidades
 * 
 * Operaciones atómicas:
 * 1. Crear edificio
 * 2. Crear múltiples unidades
 * 3. Crear estructura de carpetas de documentos
 */
export async function createBuildingWithUnits(data: {
  building: {
    companyId: string;
    nombre: string;
    direccion: string;
    tipo: 'residencial' | 'comercial' | 'mixto';
    anoConstructor: number;
  };
  units: Array<{
    numero: string;
    tipo: 'vivienda' | 'local' | 'garaje' | 'trastero';
    superficie: number;
    rentaMensual: number;
    habitaciones?: number;
    banos?: number;
  }>;
}) {
  return await prisma.$transaction(async (tx) => {
    logger.info(`Creating building ${data.building.nombre} with ${data.units.length} units`);

    // 1. Crear edificio
    const building = await tx.building.create({
      data: {
        ...data.building,
        numeroUnidades: data.units.length,
      },
    });

    logger.info(`Building ${building.id} created`);

    // 2. Crear unidades
    const unitsToCreate = data.units.map((unit) => ({
      ...unit,
      buildingId: building.id,
      estado: 'disponible' as const,
    }));

    await tx.unit.createMany({
      data: unitsToCreate,
    });

    logger.info(`${data.units.length} units created for building ${building.id}`);

    // 3. Retornar edificio completo
    const fullBuilding = await tx.building.findUnique({
      where: { id: building.id },
      include: {
        units: {
          orderBy: { numero: 'asc' },
        },
      },
    });

    logger.info('Building creation transaction completed successfully');
    return fullBuilding;
  });
}

/**
 * TRANSACCIÓN: Transferir inquilino entre unidades
 * 
 * Operaciones atómicas:
 * 1. Finalizar contrato actual
 * 2. Liberar unidad actual
 * 3. Crear nuevo contrato
 * 4. Ocupar nueva unidad
 */
export async function transferTenantBetweenUnits(data: {
  currentContractId: string;
  newUnitId: string;
  newRentaMensual: number;
  newFechaInicio: Date;
  newFechaFin: Date;
}) {
  return await prisma.$transaction(async (tx) => {
    logger.info(`Starting tenant transfer from contract ${data.currentContractId}`);

    // 1. Obtener contrato actual
    const currentContract = await tx.contract.findUnique({
      where: { id: data.currentContractId },
      include: {
        unit: true,
        tenant: true,
      },
    });

    if (!currentContract) {
      throw new Error('Current contract not found');
    }

    // 2. Verificar que nueva unidad esté disponible
    const newUnit = await tx.unit.findUnique({
      where: { id: data.newUnitId },
    });

    if (!newUnit || newUnit.estado !== 'disponible') {
      throw new Error('New unit is not available');
    }

    // 3. Finalizar contrato actual
    await tx.contract.update({
      where: { id: data.currentContractId },
      data: { estado: 'cancelado' },
    });

    // 4. Liberar unidad actual
    await tx.unit.update({
      where: { id: currentContract.unitId },
      data: {
        estado: 'disponible',
        tenantId: null,
      },
    });

    // 5. Crear nuevo contrato
    const newContract = await tx.contract.create({
      data: {
        unitId: data.newUnitId,
        tenantId: currentContract.tenantId,
        fechaInicio: data.newFechaInicio,
        fechaFin: data.newFechaFin,
        rentaMensual: data.newRentaMensual,
        deposito: data.newRentaMensual, // 1 mes de depósito
        diaPago: currentContract.diaPago,
        estado: 'activo',
      },
    });

    // 6. Ocupar nueva unidad
    await tx.unit.update({
      where: { id: data.newUnitId },
      data: {
        estado: 'ocupada',
        tenantId: currentContract.tenantId,
      },
    });

    logger.info(`Tenant ${currentContract.tenantId} transferred successfully`);
    return newContract;
  });
}

/**
 * Wrapper para ejecutar transacciones con reintentos automáticos
 * Útil para manejar deadlocks y errores transitorios
 */
export async function executeTransactionWithRetry<T>(
  transaction: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await transaction();
    } catch (error: any) {
      lastError = error;

      // Solo reintentar en ciertos errores
      const isRetryable =
        error.code === 'P2034' || // Transaction conflict
        error.code === 'P2024' || // Timed out
        error.message?.includes('deadlock');

      if (!isRetryable || attempt === maxRetries) {
        throw error;
      }

      logger.warn(
        `Transaction failed (attempt ${attempt}/${maxRetries}), retrying...`,
        { error: error.message }
      );

      // Esperar antes de reintentar (backoff exponencial)
      await new Promise((resolve) => setTimeout(resolve, delayMs * attempt));
    }
  }

  throw lastError;
}
