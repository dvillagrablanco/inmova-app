/**
 * SERVICIO DE DOMICILIACIÓN SEPA (DIRECT DEBIT)
 * 
 * Este servicio integra GoCardless con el sistema de pagos de Inmova
 * para permitir cobros automáticos mediante domiciliación bancaria SEPA.
 * 
 * Flujo completo:
 * 1. Registrar mandato SEPA del inquilino
 * 2. Programar cobros recurrentes mensuales
 * 3. Procesar pagos y actualizar estados
 * 4. Manejar devoluciones y rechazos
 * 5. Enviar notificaciones pre-cobro (obligatorio por ley SEPA)
 * 
 * @module SepaDirectDebitService
 */

import { prisma } from './db';
import { 
  GoCardlessClient, 
  getGoCardlessClient, 
  getSupportedScheme,
  type GCCustomer,
  type GCMandate,
  type GCPayment,
  type GCSubscription,
  type GoCardlessConfig,
} from './gocardless-integration';
import { sendEmail } from './email-config';
import { createNotification } from './notification-generator';
import logger from './logger';
import { format, addDays, subDays } from 'date-fns';
import { es } from 'date-fns/locale';

// ============================================================================
// TIPOS
// ============================================================================

export interface SepaEnrollmentResult {
  success: boolean;
  mandateId?: string;
  gcCustomerId?: string;
  gcBankAccountId?: string;
  status: 'pending' | 'active' | 'failed';
  message: string;
  redirectUrl?: string;
}

export interface SepaChargeResult {
  success: boolean;
  gcPaymentId?: string;
  paymentId?: string;
  chargeDate?: Date;
  status: string;
  message: string;
}

export interface SepaSubscriptionResult {
  success: boolean;
  gcSubscriptionId?: string;
  contractId: string;
  status: string;
  message: string;
}

// ============================================================================
// CONFIGURACIÓN
// ============================================================================

function getConfig(): GoCardlessConfig | null {
  const accessToken = process.env.GOCARDLESS_ACCESS_TOKEN;
  const environment = process.env.GOCARDLESS_ENVIRONMENT as 'sandbox' | 'live' || 'sandbox';
  const enabled = process.env.GOCARDLESS_ENABLED === 'true';

  if (!accessToken) {
    return null;
  }

  return {
    accessToken,
    environment,
    enabled,
  };
}

function getClient(): GoCardlessClient | null {
  const config = getConfig();
  return getGoCardlessClient(config || undefined);
}

export function isSepaEnabled(): boolean {
  const config = getConfig();
  return config?.enabled === true && !!config.accessToken;
}

// ============================================================================
// SERVICIO PRINCIPAL
// ============================================================================

/**
 * Registrar un inquilino para domiciliación SEPA
 */
export async function enrollTenantForSepa(params: {
  tenantId: string;
  iban: string;
  accountHolderName?: string;
}): Promise<SepaEnrollmentResult> {
  const client = getClient();
  
  if (!client) {
    return {
      success: false,
      status: 'failed',
      message: 'Domiciliación SEPA no está configurada. Configure GOCARDLESS_ACCESS_TOKEN.',
    };
  }

  try {
    // 1. Obtener datos del inquilino
    const tenant = await prisma.tenant.findUnique({
      where: { id: params.tenantId },
      include: {
        contracts: {
          where: { estado: 'activo' },
          include: {
            unit: {
              include: {
                building: {
                  include: { company: true },
                },
              },
            },
          },
        },
      },
    });

    if (!tenant) {
      return { success: false, status: 'failed', message: 'Inquilino no encontrado' };
    }

    // Validar IBAN
    const iban = params.iban.replace(/\s+/g, '').toUpperCase();
    if (iban.length < 15 || iban.length > 34) {
      return { success: false, status: 'failed', message: 'IBAN inválido' };
    }

    const countryCode = iban.substring(0, 2);
    const scheme = getSupportedScheme(countryCode);
    
    if (!scheme) {
      return { 
        success: false, 
        status: 'failed', 
        message: `País no soportado para domiciliación: ${countryCode}` 
      };
    }

    // 2. Crear cliente en GoCardless (si no existe)
    let gcCustomerId = tenant.gcCustomerId;
    
    if (!gcCustomerId) {
      const nameParts = tenant.nombreCompleto.split(' ');
      const gcCustomer = await client.createCustomer({
        email: tenant.email,
        givenName: nameParts[0] || tenant.nombreCompleto,
        familyName: nameParts.slice(1).join(' ') || '',
        addressLine1: tenant.direccion || undefined,
        city: tenant.ciudad || undefined,
        postalCode: tenant.codigoPostal || undefined,
        countryCode,
        metadata: {
          inmova_tenant_id: tenant.id,
        },
      });

      gcCustomerId = gcCustomer.id!;
      
      // Guardar ID de GoCardless en el inquilino
      await prisma.tenant.update({
        where: { id: tenant.id },
        data: { gcCustomerId },
      });
    }

    // 3. Crear cuenta bancaria
    const gcBankAccount = await client.createBankAccount({
      customerId: gcCustomerId,
      accountHolderName: params.accountHolderName || tenant.nombreCompleto,
      iban,
      countryCode,
      currency: 'EUR',
      metadata: {
        inmova_tenant_id: tenant.id,
      },
    });

    // 4. Crear mandato SEPA
    const reference = `INMOVA-${tenant.id.substring(0, 8).toUpperCase()}`;
    const gcMandate = await client.createMandate({
      customerBankAccountId: gcBankAccount.id!,
      scheme,
      reference,
      metadata: {
        inmova_tenant_id: tenant.id,
      },
    });

    // 5. Guardar información del mandato
    await prisma.tenant.update({
      where: { id: tenant.id },
      data: {
        iban: iban,
        gcBankAccountId: gcBankAccount.id,
        gcMandateId: gcMandate.id,
        gcMandateStatus: gcMandate.status,
        sepaEnabled: true,
      },
    });

    // 6. Notificar al inquilino
    await sendEmail({
      to: tenant.email,
      subject: '✅ Domiciliación bancaria activada',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1e40af;">Domiciliación bancaria activada</h2>
          
          <p>Hola <strong>${tenant.nombreCompleto}</strong>,</p>
          
          <p>Tu autorización de domiciliación bancaria (SEPA) ha sido registrada correctamente.</p>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Referencia del mandato:</strong> ${reference}</p>
            <p><strong>IBAN:</strong> ****${iban.slice(-4)}</p>
            <p><strong>Titular:</strong> ${params.accountHolderName || tenant.nombreCompleto}</p>
          </div>
          
          <p>A partir de ahora, los recibos de alquiler se cobrarán automáticamente en tu cuenta bancaria.</p>
          
          <p style="color: #6b7280; font-size: 0.9em;">
            Recibirás una notificación 3 días antes de cada cobro conforme a la normativa SEPA.
          </p>
          
          <p style="margin-top: 30px;">
            Puedes cancelar esta autorización en cualquier momento desde tu portal de inquilino.
          </p>
        </div>
      `,
    });

    logger.info(`✅ Inquilino ${tenant.id} registrado para SEPA. Mandato: ${gcMandate.id}`);

    return {
      success: true,
      mandateId: gcMandate.id,
      gcCustomerId,
      gcBankAccountId: gcBankAccount.id,
      status: gcMandate.status === 'active' ? 'active' : 'pending',
      message: 'Domiciliación bancaria registrada correctamente',
    };
  } catch (error: any) {
    logger.error('Error registrando inquilino para SEPA:', error);
    return {
      success: false,
      status: 'failed',
      message: `Error: ${error.message}`,
    };
  }
}

/**
 * Crear un cobro único mediante SEPA
 */
export async function createSepaCharge(params: {
  paymentId: string;
  chargeDate?: Date;
}): Promise<SepaChargeResult> {
  const client = getClient();
  
  if (!client) {
    return {
      success: false,
      status: 'not_configured',
      message: 'Domiciliación SEPA no está configurada',
    };
  }

  try {
    // 1. Obtener el pago y datos del inquilino
    const payment = await prisma.payment.findUnique({
      where: { id: params.paymentId },
      include: {
        contract: {
          include: {
            tenant: true,
            unit: {
              include: {
                building: true,
              },
            },
          },
        },
      },
    });

    if (!payment) {
      return { success: false, status: 'not_found', message: 'Pago no encontrado' };
    }

    const tenant = payment.contract.tenant;

    if (!tenant.gcMandateId || !tenant.sepaEnabled) {
      return {
        success: false,
        status: 'no_mandate',
        message: 'El inquilino no tiene domiciliación SEPA activa',
      };
    }

    // Verificar estado del mandato
    const mandate = await client.getMandate(tenant.gcMandateId);
    if (mandate.status !== 'active') {
      return {
        success: false,
        status: 'mandate_inactive',
        message: `El mandato SEPA no está activo (estado: ${mandate.status})`,
      };
    }

    // 2. Determinar fecha de cobro (mínimo 3 días por SEPA)
    const minChargeDate = addDays(new Date(), 3);
    const chargeDate = params.chargeDate && params.chargeDate > minChargeDate
      ? params.chargeDate
      : minChargeDate;

    // 3. Crear el cobro en GoCardless
    const amountInCents = Math.round(Number(payment.monto) * 100);
    const description = `Alquiler ${payment.periodo} - ${payment.contract.unit.building.nombre}`;

    const gcPayment = await client.createPayment({
      amount: amountInCents,
      currency: 'EUR',
      description,
      chargeDate: format(chargeDate, 'yyyy-MM-dd'),
      reference: `PAY-${payment.id.substring(0, 8).toUpperCase()}`,
      mandateId: tenant.gcMandateId,
      metadata: {
        inmova_payment_id: payment.id,
        inmova_contract_id: payment.contractId,
      },
    });

    // 4. Actualizar el pago en Inmova
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        gcPaymentId: gcPayment.id,
        gcPaymentStatus: gcPayment.status,
        metodoPago: 'domiciliacion_sepa',
        estado: 'procesando',
      },
    });

    // 5. Enviar notificación pre-cobro (obligatorio SEPA)
    await sendPreDebitNotification(payment, tenant, chargeDate);

    logger.info(`✅ Cobro SEPA creado: ${gcPayment.id} para pago ${payment.id}`);

    return {
      success: true,
      gcPaymentId: gcPayment.id,
      paymentId: payment.id,
      chargeDate,
      status: gcPayment.status || 'pending_submission',
      message: 'Cobro SEPA programado correctamente',
    };
  } catch (error: any) {
    logger.error('Error creando cobro SEPA:', error);
    return {
      success: false,
      status: 'error',
      message: `Error: ${error.message}`,
    };
  }
}

/**
 * Crear suscripción recurrente para un contrato
 */
export async function createSepaSubscription(params: {
  contractId: string;
  dayOfMonth?: number;
  startDate?: Date;
}): Promise<SepaSubscriptionResult> {
  const client = getClient();
  
  if (!client) {
    return {
      success: false,
      contractId: params.contractId,
      status: 'not_configured',
      message: 'Domiciliación SEPA no está configurada',
    };
  }

  try {
    // 1. Obtener contrato y datos del inquilino
    const contract = await prisma.contract.findUnique({
      where: { id: params.contractId },
      include: {
        tenant: true,
        unit: {
          include: { building: true },
        },
      },
    });

    if (!contract) {
      return {
        success: false,
        contractId: params.contractId,
        status: 'not_found',
        message: 'Contrato no encontrado',
      };
    }

    const tenant = contract.tenant;

    if (!tenant.gcMandateId || !tenant.sepaEnabled) {
      return {
        success: false,
        contractId: params.contractId,
        status: 'no_mandate',
        message: 'El inquilino no tiene domiciliación SEPA activa',
      };
    }

    // 2. Crear suscripción en GoCardless
    const amountInCents = Math.round(Number(contract.rentaMensual) * 100);
    const dayOfMonth = params.dayOfMonth || contract.diaCobro || 1;
    const startDate = params.startDate || addDays(new Date(), 5);

    const gcSubscription = await client.createSubscription({
      amount: amountInCents,
      currency: 'EUR',
      name: `Alquiler ${contract.unit.building.nombre} - ${contract.unit.numero}`,
      interval: 1,
      intervalUnit: 'monthly',
      dayOfMonth: Math.min(dayOfMonth, 28), // SEPA solo acepta hasta día 28
      startDate: format(startDate, 'yyyy-MM-dd'),
      endDate: contract.fechaFin 
        ? format(new Date(contract.fechaFin), 'yyyy-MM-dd')
        : undefined,
      mandateId: tenant.gcMandateId,
      metadata: {
        inmova_contract_id: contract.id,
        inmova_tenant_id: tenant.id,
      },
    });

    // 3. Actualizar contrato
    await prisma.contract.update({
      where: { id: contract.id },
      data: {
        gcSubscriptionId: gcSubscription.id,
        gcSubscriptionStatus: gcSubscription.status,
        cobroAutomatico: true,
      },
    });

    logger.info(`✅ Suscripción SEPA creada: ${gcSubscription.id} para contrato ${contract.id}`);

    return {
      success: true,
      gcSubscriptionId: gcSubscription.id,
      contractId: contract.id,
      status: gcSubscription.status || 'active',
      message: 'Suscripción de cobro recurrente creada correctamente',
    };
  } catch (error: any) {
    logger.error('Error creando suscripción SEPA:', error);
    return {
      success: false,
      contractId: params.contractId,
      status: 'error',
      message: `Error: ${error.message}`,
    };
  }
}

/**
 * Cancelar domiciliación de un inquilino
 */
export async function cancelSepaEnrollment(tenantId: string): Promise<{
  success: boolean;
  message: string;
}> {
  const client = getClient();
  
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        contracts: {
          where: { gcSubscriptionId: { not: null } },
        },
      },
    });

    if (!tenant) {
      return { success: false, message: 'Inquilino no encontrado' };
    }

    // Cancelar suscripciones activas
    if (client) {
      for (const contract of tenant.contracts) {
        if (contract.gcSubscriptionId) {
          try {
            await client.cancelSubscription(contract.gcSubscriptionId);
          } catch (e) {
            logger.warn(`No se pudo cancelar suscripción ${contract.gcSubscriptionId}`);
          }
        }
      }
    }

    // Actualizar inquilino
    await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        sepaEnabled: false,
        gcMandateStatus: 'cancelled',
      },
    });

    // Actualizar contratos
    await prisma.contract.updateMany({
      where: { tenantId },
      data: {
        cobroAutomatico: false,
        gcSubscriptionStatus: 'cancelled',
      },
    });

    logger.info(`✅ Domiciliación SEPA cancelada para inquilino ${tenantId}`);

    return {
      success: true,
      message: 'Domiciliación bancaria cancelada correctamente',
    };
  } catch (error: any) {
    logger.error('Error cancelando domiciliación SEPA:', error);
    return {
      success: false,
      message: `Error: ${error.message}`,
    };
  }
}

/**
 * Procesar webhook de GoCardless
 */
export async function processGoCardlessWebhook(
  events: any[],
  signature: string,
  rawBody: string
): Promise<{ processed: number; errors: string[] }> {
  const client = getClient();
  const webhookSecret = process.env.GOCARDLESS_WEBHOOK_SECRET;
  
  if (!client || !webhookSecret) {
    return { processed: 0, errors: ['Webhook no configurado'] };
  }

  // Verificar firma
  const isValid = client.verifyWebhookSignature({
    webhookSignature: signature,
    webhookBody: rawBody,
    webhookSecret,
  });

  if (!isValid) {
    return { processed: 0, errors: ['Firma de webhook inválida'] };
  }

  let processed = 0;
  const errors: string[] = [];

  for (const event of events) {
    try {
      await processEvent(event);
      processed++;
    } catch (error: any) {
      errors.push(`${event.id}: ${error.message}`);
    }
  }

  return { processed, errors };
}

async function processEvent(event: any): Promise<void> {
  const { resource_type, action, links } = event;

  logger.info(`📥 Procesando evento GoCardless: ${resource_type}.${action}`);

  switch (resource_type) {
    case 'payments':
      await handlePaymentEvent(action, links.payment, event.details);
      break;
    case 'mandates':
      await handleMandateEvent(action, links.mandate, event.details);
      break;
    case 'subscriptions':
      await handleSubscriptionEvent(action, links.subscription, event.details);
      break;
    default:
      logger.info(`Evento no manejado: ${resource_type}.${action}`);
  }
}

async function handlePaymentEvent(
  action: string,
  gcPaymentId: string,
  details: any
): Promise<void> {
  // Buscar el pago en Inmova
  const payment = await prisma.payment.findFirst({
    where: { gcPaymentId },
  });

  if (!payment) {
    logger.warn(`Pago no encontrado para gcPaymentId: ${gcPaymentId}`);
    return;
  }

  switch (action) {
    case 'confirmed':
    case 'paid_out':
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          estado: 'pagado',
          fechaPago: new Date(),
          gcPaymentStatus: action,
        },
      });
      logger.info(`✅ Pago ${payment.id} marcado como pagado`);
      break;

    case 'failed':
    case 'charged_back':
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          estado: 'rechazado',
          gcPaymentStatus: action,
          notas: `Cobro rechazado: ${details?.cause || 'desconocido'}`,
        },
      });
      // Notificar al propietario
      logger.warn(`❌ Pago ${payment.id} rechazado: ${details?.cause}`);
      break;

    case 'cancelled':
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          estado: 'pendiente',
          gcPaymentStatus: 'cancelled',
          gcPaymentId: null,
        },
      });
      break;
  }
}

async function handleMandateEvent(
  action: string,
  gcMandateId: string,
  details: any
): Promise<void> {
  const tenant = await prisma.tenant.findFirst({
    where: { gcMandateId },
  });

  if (!tenant) {
    logger.warn(`Inquilino no encontrado para mandato: ${gcMandateId}`);
    return;
  }

  switch (action) {
    case 'active':
      await prisma.tenant.update({
        where: { id: tenant.id },
        data: { gcMandateStatus: 'active' },
      });
      logger.info(`✅ Mandato ${gcMandateId} activado`);
      break;

    case 'failed':
    case 'cancelled':
    case 'expired':
      await prisma.tenant.update({
        where: { id: tenant.id },
        data: {
          gcMandateStatus: action,
          sepaEnabled: false,
        },
      });
      logger.warn(`❌ Mandato ${gcMandateId} ${action}: ${details?.cause}`);
      break;
  }
}

async function handleSubscriptionEvent(
  action: string,
  gcSubscriptionId: string,
  details: any
): Promise<void> {
  const contract = await prisma.contract.findFirst({
    where: { gcSubscriptionId },
  });

  if (!contract) {
    logger.warn(`Contrato no encontrado para suscripción: ${gcSubscriptionId}`);
    return;
  }

  switch (action) {
    case 'payment_created':
      // Se creó un nuevo cobro desde la suscripción
      // Crear registro de pago en Inmova
      const gcPaymentId = details?.payment;
      if (gcPaymentId) {
        await prisma.payment.create({
          data: {
            contractId: contract.id,
            periodo: `Alquiler ${format(new Date(), 'MMMM yyyy', { locale: es })}`,
            monto: contract.rentaMensual,
            fechaVencimiento: addDays(new Date(), 5),
            estado: 'procesando',
            metodoPago: 'domiciliacion_sepa',
            gcPaymentId,
            gcPaymentStatus: 'pending_submission',
          },
        });
        logger.info(`✅ Pago creado desde suscripción ${gcSubscriptionId}`);
      }
      break;

    case 'cancelled':
    case 'finished':
      await prisma.contract.update({
        where: { id: contract.id },
        data: {
          gcSubscriptionStatus: action,
          cobroAutomatico: false,
        },
      });
      break;
  }
}

/**
 * Enviar notificación pre-cobro (obligatorio SEPA)
 */
async function sendPreDebitNotification(
  payment: any,
  tenant: any,
  chargeDate: Date
): Promise<void> {
  try {
    const formattedDate = format(chargeDate, "d 'de' MMMM 'de' yyyy", { locale: es });
    const amount = Number(payment.monto).toFixed(2);

    await sendEmail({
      to: tenant.email,
      subject: `📅 Aviso de cobro - ${formattedDate}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1e40af;">Aviso de cobro por domiciliación</h2>
          
          <p>Hola <strong>${tenant.nombreCompleto}</strong>,</p>
          
          <p>Te informamos que se realizará el siguiente cargo en tu cuenta bancaria:</p>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <table style="width: 100%;">
              <tr>
                <td style="color: #6b7280;">Concepto:</td>
                <td style="font-weight: bold;">${payment.periodo}</td>
              </tr>
              <tr>
                <td style="color: #6b7280;">Importe:</td>
                <td style="font-weight: bold; font-size: 1.2em; color: #1e40af;">${amount} €</td>
              </tr>
              <tr>
                <td style="color: #6b7280;">Fecha de cobro:</td>
                <td style="font-weight: bold;">${formattedDate}</td>
              </tr>
              <tr>
                <td style="color: #6b7280;">IBAN:</td>
                <td>****${tenant.iban?.slice(-4) || '****'}</td>
              </tr>
            </table>
          </div>
          
          <p style="color: #6b7280; font-size: 0.9em;">
            Este aviso se envía conforme a la normativa SEPA, que establece un plazo 
            mínimo de 3 días de preaviso antes de realizar el cargo.
          </p>
          
          <p style="color: #6b7280; font-size: 0.9em;">
            Si tienes alguna duda o necesitas modificar la domiciliación, 
            contacta con nosotros antes de la fecha de cobro.
          </p>
        </div>
      `,
    });

    // Crear notificación en el sistema
    await createNotification({
      userId: tenant.id,
      companyId: payment.contract.unit.building.companyId,
      titulo: `Aviso de cobro - ${formattedDate}`,
      mensaje: `Se realizará un cargo de ${amount}€ en tu cuenta el ${formattedDate}`,
      tipo: 'pago',
      prioridad: 'normal',
      enlace: '/portal-inquilino/pagos',
    });

    logger.info(`📧 Notificación pre-cobro enviada a ${tenant.email}`);
  } catch (error) {
    logger.error('Error enviando notificación pre-cobro:', error);
  }
}

/**
 * Obtener estadísticas de SEPA
 */
export async function getSepaStats(companyId?: string): Promise<{
  tenantsEnrolled: number;
  activeSubscriptions: number;
  pendingPayments: number;
  collectedThisMonth: number;
}> {
  const where = companyId
    ? {
        contracts: {
          some: {
            unit: { building: { companyId } },
          },
        },
      }
    : {};

  const [tenantsEnrolled, contracts] = await Promise.all([
    prisma.tenant.count({
      where: {
        ...where,
        sepaEnabled: true,
        gcMandateStatus: 'active',
      },
    }),
    prisma.contract.findMany({
      where: {
        estado: 'activo',
        cobroAutomatico: true,
        ...(companyId && { unit: { building: { companyId } } }),
      },
      select: { id: true },
    }),
  ]);

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [pendingPayments, collectedThisMonth] = await Promise.all([
    prisma.payment.count({
      where: {
        metodoPago: 'domiciliacion_sepa',
        estado: 'procesando',
      },
    }),
    prisma.payment.aggregate({
      where: {
        metodoPago: 'domiciliacion_sepa',
        estado: 'pagado',
        fechaPago: { gte: startOfMonth },
      },
      _sum: { monto: true },
    }),
  ]);

  return {
    tenantsEnrolled,
    activeSubscriptions: contracts.length,
    pendingPayments,
    collectedThisMonth: Number(collectedThisMonth._sum?.monto || 0),
  };
}
