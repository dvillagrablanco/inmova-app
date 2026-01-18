/**
 * GENERADOR AUTOMÁTICO DE PAGOS MENSUALES
 * 
 * Este servicio genera automáticamente los pagos pendientes para cada contrato activo
 * al inicio de cada mes (o cuando se ejecute manualmente).
 * 
 * Flujo:
 * 1. Obtiene todos los contratos activos
 * 2. Para cada contrato, verifica si ya existe el pago del mes actual
 * 3. Si no existe, crea el registro de pago pendiente
 * 4. Opcionalmente envía notificación al inquilino
 * 
 * @module MonthlyPaymentsGenerator
 */

import { prisma } from './db';
import { sendEmail } from './email-config';
import { createNotification } from './notification-generator';
import logger from './logger';
import { format, startOfMonth, endOfMonth, addMonths } from 'date-fns';
import { es } from 'date-fns/locale';

// ============================================================================
// TIPOS
// ============================================================================

export interface GenerationResult {
  success: boolean;
  totalContracts: number;
  paymentsCreated: number;
  paymentsSkipped: number;
  errors: GenerationError[];
  details: PaymentDetail[];
}

export interface GenerationError {
  contractId: string;
  error: string;
}

export interface PaymentDetail {
  contractId: string;
  paymentId: string;
  tenantName: string;
  unitName: string;
  amount: number;
  dueDate: Date;
  status: 'created' | 'skipped' | 'error';
  reason?: string;
}

export interface GenerationOptions {
  companyId?: string;
  targetMonth?: Date;
  dryRun?: boolean;
  sendNotifications?: boolean;
  forceRegenerate?: boolean;
}

// ============================================================================
// SERVICIO PRINCIPAL
// ============================================================================

/**
 * Genera los pagos mensuales para todos los contratos activos
 */
export async function generateMonthlyPayments(
  options: GenerationOptions = {}
): Promise<GenerationResult> {
  const {
    companyId,
    targetMonth = new Date(),
    dryRun = false,
    sendNotifications = true,
    forceRegenerate = false,
  } = options;

  const result: GenerationResult = {
    success: true,
    totalContracts: 0,
    paymentsCreated: 0,
    paymentsSkipped: 0,
    errors: [],
    details: [],
  };

  try {
    const monthStart = startOfMonth(targetMonth);
    const monthEnd = endOfMonth(targetMonth);
    const monthName = format(targetMonth, 'MMMM yyyy', { locale: es });

    logger.info(`📅 Generando pagos para: ${monthName}`, {
      dryRun,
      companyId,
      sendNotifications,
    });

    // Obtener contratos activos
    const contractWhere: any = {
      estado: 'activo',
      fechaInicio: { lte: monthEnd },
      OR: [
        { fechaFin: null },
        { fechaFin: { gte: monthStart } },
      ],
    };

    if (companyId) {
      contractWhere.unit = {
        building: { companyId },
      };
    }

    const contracts = await prisma.contract.findMany({
      where: contractWhere,
      include: {
        tenant: true,
        unit: {
          include: {
            building: {
              include: {
                company: true,
              },
            },
          },
        },
        payments: {
          where: {
            fechaVencimiento: {
              gte: monthStart,
              lte: monthEnd,
            },
          },
        },
      },
    });

    result.totalContracts = contracts.length;

    logger.info(`📋 Contratos activos encontrados: ${contracts.length}`);

    for (const contract of contracts) {
      try {
        const detail: PaymentDetail = {
          contractId: contract.id,
          paymentId: '',
          tenantName: contract.tenant.nombreCompleto,
          unitName: `${contract.unit.building.nombre} - ${contract.unit.numero}`,
          amount: Number(contract.rentaMensual),
          dueDate: new Date(targetMonth.getFullYear(), targetMonth.getMonth(), contract.diaCobro || 1),
          status: 'created',
        };

        // Verificar si ya existe un pago para este mes
        const existingPayment = contract.payments.find(p => {
          const paymentMonth = new Date(p.fechaVencimiento);
          return (
            paymentMonth.getMonth() === targetMonth.getMonth() &&
            paymentMonth.getFullYear() === targetMonth.getFullYear()
          );
        });

        if (existingPayment && !forceRegenerate) {
          detail.status = 'skipped';
          detail.paymentId = existingPayment.id;
          detail.reason = 'Ya existe pago para este mes';
          result.paymentsSkipped++;
          result.details.push(detail);
          continue;
        }

        // Calcular fecha de vencimiento
        const diaCobro = contract.diaCobro || 1;
        const dueDate = new Date(
          targetMonth.getFullYear(),
          targetMonth.getMonth(),
          Math.min(diaCobro, 28) // Evitar problemas con meses de menos días
        );
        detail.dueDate = dueDate;

        // Generar concepto/periodo
        const periodo = `Alquiler ${format(targetMonth, 'MMMM yyyy', { locale: es })}`;

        if (!dryRun) {
          // Crear el pago
          const payment = await prisma.payment.create({
            data: {
              contractId: contract.id,
              periodo,
              monto: contract.rentaMensual,
              fechaVencimiento: dueDate,
              estado: 'pendiente',
            },
          });

          detail.paymentId = payment.id;

          // Enviar notificación al inquilino
          if (sendNotifications && contract.tenant.email) {
            await sendPaymentNotification(contract, payment, monthName);
          }

          // Crear notificación en el sistema
          await createNotification({
            userId: contract.tenant.id,
            companyId: contract.unit.building.companyId,
            titulo: `Nuevo recibo: ${periodo}`,
            mensaje: `Se ha generado un nuevo recibo de ${Number(contract.rentaMensual).toFixed(2)}€ con vencimiento el ${format(dueDate, 'dd/MM/yyyy')}`,
            tipo: 'pago',
            prioridad: 'normal',
            enlace: `/portal-inquilino/pagos`,
          });

          logger.info(`✅ Pago creado: ${payment.id} para contrato ${contract.id}`);
        }

        result.paymentsCreated++;
        result.details.push(detail);
      } catch (error: any) {
        const errorDetail: PaymentDetail = {
          contractId: contract.id,
          paymentId: '',
          tenantName: contract.tenant.nombreCompleto,
          unitName: `${contract.unit.building.nombre} - ${contract.unit.numero}`,
          amount: Number(contract.rentaMensual),
          dueDate: new Date(),
          status: 'error',
          reason: error.message,
        };
        result.details.push(errorDetail);
        result.errors.push({
          contractId: contract.id,
          error: error.message,
        });
        logger.error(`❌ Error procesando contrato ${contract.id}:`, error);
      }
    }

    result.success = result.errors.length === 0;

    logger.info(`📊 Resumen de generación:`, {
      totalContracts: result.totalContracts,
      paymentsCreated: result.paymentsCreated,
      paymentsSkipped: result.paymentsSkipped,
      errors: result.errors.length,
    });

    return result;
  } catch (error: any) {
    logger.error('Error generando pagos mensuales:', error);
    result.success = false;
    result.errors.push({
      contractId: 'global',
      error: error.message,
    });
    return result;
  }
}

/**
 * Envía notificación de nuevo pago al inquilino
 */
async function sendPaymentNotification(
  contract: any,
  payment: any,
  monthName: string
): Promise<void> {
  try {
    const tenant = contract.tenant;
    const unit = contract.unit;
    const building = unit.building;

    await sendEmail({
      to: tenant.email,
      subject: `📄 Nuevo recibo de alquiler - ${monthName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1e40af;">Nuevo recibo de alquiler</h2>
          
          <p>Hola <strong>${tenant.nombreCompleto}</strong>,</p>
          
          <p>Se ha generado un nuevo recibo de alquiler para el mes de <strong>${monthName}</strong>:</p>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <table style="width: 100%;">
              <tr>
                <td style="color: #6b7280;">Propiedad:</td>
                <td style="font-weight: bold;">${building.nombre} - ${unit.numero}</td>
              </tr>
              <tr>
                <td style="color: #6b7280;">Concepto:</td>
                <td style="font-weight: bold;">${payment.periodo}</td>
              </tr>
              <tr>
                <td style="color: #6b7280;">Importe:</td>
                <td style="font-weight: bold; font-size: 1.2em; color: #1e40af;">
                  ${Number(payment.monto).toFixed(2)} €
                </td>
              </tr>
              <tr>
                <td style="color: #6b7280;">Vencimiento:</td>
                <td style="font-weight: bold;">
                  ${format(new Date(payment.fechaVencimiento), 'dd/MM/yyyy')}
                </td>
              </tr>
            </table>
          </div>
          
          <p>Puedes pagar este recibo desde tu portal de inquilino:</p>
          
          <a href="${process.env.NEXTAUTH_URL}/portal-inquilino/pagos" 
             style="display: inline-block; background-color: #1e40af; color: white; 
                    padding: 12px 24px; border-radius: 6px; text-decoration: none; 
                    font-weight: bold; margin: 10px 0;">
            Ir a mis pagos
          </a>
          
          <p style="color: #6b7280; font-size: 0.9em; margin-top: 30px;">
            Si tienes alguna duda, contacta con nosotros.
          </p>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          
          <p style="color: #9ca3af; font-size: 0.8em;">
            Este email ha sido enviado automáticamente por ${building.company?.nombre || 'INMOVA'}.
          </p>
        </div>
      `,
    });

    logger.info(`📧 Notificación enviada a ${tenant.email}`);
  } catch (error) {
    logger.error('Error enviando notificación de pago:', error);
    // No lanzar error para no interrumpir el proceso
  }
}

/**
 * Genera pagos para el mes siguiente (útil para pre-generación)
 */
export async function generateNextMonthPayments(
  options: Omit<GenerationOptions, 'targetMonth'> = {}
): Promise<GenerationResult> {
  const nextMonth = addMonths(new Date(), 1);
  return generateMonthlyPayments({
    ...options,
    targetMonth: nextMonth,
  });
}

/**
 * Verifica qué contratos no tienen pago generado para un mes específico
 */
export async function checkMissingPayments(
  targetMonth: Date = new Date(),
  companyId?: string
): Promise<{
  total: number;
  missing: Array<{
    contractId: string;
    tenantName: string;
    unitName: string;
    rentAmount: number;
  }>;
}> {
  const monthStart = startOfMonth(targetMonth);
  const monthEnd = endOfMonth(targetMonth);

  const contractWhere: any = {
    estado: 'activo',
    fechaInicio: { lte: monthEnd },
    OR: [
      { fechaFin: null },
      { fechaFin: { gte: monthStart } },
    ],
  };

  if (companyId) {
    contractWhere.unit = {
      building: { companyId },
    };
  }

  const contracts = await prisma.contract.findMany({
    where: contractWhere,
    include: {
      tenant: {
        select: { nombreCompleto: true },
      },
      unit: {
        include: {
          building: {
            select: { nombre: true },
          },
        },
      },
      payments: {
        where: {
          fechaVencimiento: {
            gte: monthStart,
            lte: monthEnd,
          },
        },
        select: { id: true },
      },
    },
  });

  const missing = contracts
    .filter(c => c.payments.length === 0)
    .map(c => ({
      contractId: c.id,
      tenantName: c.tenant.nombreCompleto,
      unitName: `${c.unit.building.nombre} - ${c.unit.numero}`,
      rentAmount: Number(c.rentaMensual),
    }));

  return {
    total: contracts.length,
    missing,
  };
}

/**
 * Obtiene estadísticas de generación de pagos
 */
export async function getPaymentGenerationStats(
  companyId?: string
): Promise<{
  currentMonth: { generated: number; pending: number; total: number };
  lastMonth: { generated: number; paid: number; overdue: number };
}> {
  const now = new Date();
  const currentMonthStart = startOfMonth(now);
  const currentMonthEnd = endOfMonth(now);
  const lastMonthStart = startOfMonth(addMonths(now, -1));
  const lastMonthEnd = endOfMonth(addMonths(now, -1));

  const buildingFilter = companyId
    ? { contract: { unit: { building: { companyId } } } }
    : {};

  // Pagos del mes actual
  const currentMonthPayments = await prisma.payment.findMany({
    where: {
      fechaVencimiento: {
        gte: currentMonthStart,
        lte: currentMonthEnd,
      },
      ...buildingFilter,
    },
    select: { estado: true },
  });

  // Pagos del mes anterior
  const lastMonthPayments = await prisma.payment.findMany({
    where: {
      fechaVencimiento: {
        gte: lastMonthStart,
        lte: lastMonthEnd,
      },
      ...buildingFilter,
    },
    select: { estado: true },
  });

  // Contar contratos activos para el mes actual
  const activeContracts = await prisma.contract.count({
    where: {
      estado: 'activo',
      fechaInicio: { lte: currentMonthEnd },
      OR: [
        { fechaFin: null },
        { fechaFin: { gte: currentMonthStart } },
      ],
      ...(companyId && {
        unit: { building: { companyId } },
      }),
    },
  });

  return {
    currentMonth: {
      generated: currentMonthPayments.length,
      pending: currentMonthPayments.filter(p => p.estado === 'pendiente').length,
      total: activeContracts,
    },
    lastMonth: {
      generated: lastMonthPayments.length,
      paid: lastMonthPayments.filter(p => p.estado === 'pagado').length,
      overdue: lastMonthPayments.filter(p => p.estado === 'atrasado').length,
    },
  };
}
