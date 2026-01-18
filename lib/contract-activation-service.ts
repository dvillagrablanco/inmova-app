/**
 * SERVICIO DE ACTIVACIÓN DE CONTRATOS
 * 
 * Este servicio maneja el flujo completo cuando un contrato es firmado:
 * 1. Cambiar estado del contrato a "activo"
 * 2. Actualizar estado del inquilino
 * 3. Generar el primer pago pendiente
 * 4. Configurar cobro automático (si SEPA está habilitado)
 * 5. Guardar documento firmado
 * 6. Notificar a todas las partes
 * 
 * @module ContractActivationService
 */

import { prisma } from './db';
import { sendEmail } from './email-config';
import { createNotification } from './notification-generator';
import { uploadFile } from './s3';
import { enrollTenantForSepa, createSepaSubscription, isSepaEnabled } from './sepa-direct-debit-service';
import logger from './logger';
import { format, addMonths, startOfMonth, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';

// ============================================================================
// TIPOS
// ============================================================================

export interface ActivationResult {
  success: boolean;
  contractId: string;
  status: string;
  paymentId?: string;
  sepaConfigured?: boolean;
  message: string;
  actions: string[];
}

export interface ActivationOptions {
  signedDocumentUrl?: string;
  signedDocumentBuffer?: Buffer;
  signatureId?: string;
  signedAt?: Date;
  signedBy?: string[];
  enableSepa?: boolean;
  tenantIban?: string;
}

// ============================================================================
// SERVICIO PRINCIPAL
// ============================================================================

/**
 * Activar un contrato después de la firma
 */
export async function activateContract(
  contractId: string,
  options: ActivationOptions = {}
): Promise<ActivationResult> {
  const actions: string[] = [];
  
  try {
    // 1. Obtener contrato con todas las relaciones
    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
      include: {
        tenant: true,
        unit: {
          include: {
            building: {
              include: { company: true },
            },
          },
        },
        signatures: true,
      },
    });

    if (!contract) {
      return {
        success: false,
        contractId,
        status: 'not_found',
        message: 'Contrato no encontrado',
        actions,
      };
    }

    // Verificar que no esté ya activo
    if (contract.estado === 'activo') {
      return {
        success: false,
        contractId,
        status: 'already_active',
        message: 'El contrato ya está activo',
        actions,
      };
    }

    const tenant = contract.tenant;
    const unit = contract.unit;
    const building = unit.building;
    const company = building.company;

    logger.info(`🔄 Iniciando activación de contrato ${contractId}`);

    // 2. Guardar documento firmado (si se proporciona)
    if (options.signedDocumentBuffer) {
      const fileName = `contratos/firmados/${contractId}_firmado_${Date.now()}.pdf`;
      const documentUrl = await uploadFile(options.signedDocumentBuffer, fileName, 'application/pdf');
      
      await prisma.contract.update({
        where: { id: contractId },
        data: { documentoFirmadoUrl: documentUrl },
      });
      
      actions.push('Documento firmado guardado');
    } else if (options.signedDocumentUrl) {
      await prisma.contract.update({
        where: { id: contractId },
        data: { documentoFirmadoUrl: options.signedDocumentUrl },
      });
      actions.push('URL de documento firmado guardada');
    }

    // 3. Actualizar estado del contrato
    await prisma.contract.update({
      where: { id: contractId },
      data: {
        estado: 'activo',
        fechaFirma: options.signedAt || new Date(),
        firmadoPor: options.signedBy || [],
      },
    });
    actions.push('Contrato marcado como activo');

    // 4. Actualizar estado del inquilino
    await prisma.tenant.update({
      where: { id: tenant.id },
      data: {
        estado: 'activo',
        contratoActivo: true,
      },
    });
    actions.push('Inquilino marcado como activo');

    // 5. Actualizar estado de la unidad
    await prisma.unit.update({
      where: { id: unit.id },
      data: {
        estado: 'ocupada',
        inquilinoActualId: tenant.id,
      },
    });
    actions.push('Unidad marcada como ocupada');

    // 6. Generar primer pago pendiente
    const firstPayment = await generateFirstPayment(contract);
    actions.push(`Primer pago generado: ${firstPayment.periodo}`);

    // 7. Configurar SEPA si está habilitado y el inquilino tiene IBAN
    let sepaConfigured = false;
    if (options.enableSepa && isSepaEnabled()) {
      const iban = options.tenantIban || tenant.iban;
      
      if (iban) {
        try {
          // Registrar para domiciliación
          const enrollResult = await enrollTenantForSepa({
            tenantId: tenant.id,
            iban,
          });

          if (enrollResult.success) {
            // Crear suscripción recurrente
            const subscriptionResult = await createSepaSubscription({
              contractId,
              dayOfMonth: contract.diaCobro || 1,
            });

            if (subscriptionResult.success) {
              sepaConfigured = true;
              actions.push('Domiciliación SEPA configurada');
            }
          }
        } catch (error) {
          logger.warn('No se pudo configurar SEPA:', error);
          actions.push('SEPA no configurado (error)');
        }
      }
    }

    // 8. Crear notificaciones
    await createActivationNotifications(contract, tenant, company);
    actions.push('Notificaciones enviadas');

    // 9. Enviar emails
    await sendActivationEmails(contract, tenant, building, company, firstPayment);
    actions.push('Emails de confirmación enviados');

    // 10. Registrar en log de auditoría
    await prisma.auditLog.create({
      data: {
        action: 'CONTRACT_ACTIVATED',
        entityType: 'Contract',
        entityId: contractId,
        userId: tenant.id,
        companyId: company.id,
        details: {
          signatureId: options.signatureId,
          sepaConfigured,
          firstPaymentId: firstPayment.id,
        },
      },
    });

    logger.info(`✅ Contrato ${contractId} activado correctamente`);

    return {
      success: true,
      contractId,
      status: 'activated',
      paymentId: firstPayment.id,
      sepaConfigured,
      message: 'Contrato activado correctamente',
      actions,
    };
  } catch (error: any) {
    logger.error(`Error activando contrato ${contractId}:`, error);
    return {
      success: false,
      contractId,
      status: 'error',
      message: `Error: ${error.message}`,
      actions,
    };
  }
}

/**
 * Genera el primer pago para un contrato recién activado
 */
async function generateFirstPayment(contract: any): Promise<any> {
  const now = new Date();
  const fechaInicio = new Date(contract.fechaInicio);
  
  // Determinar el mes del primer pago
  let paymentMonth: Date;
  
  if (fechaInicio > now) {
    // Si el contrato empieza en el futuro, el primer pago es para ese mes
    paymentMonth = fechaInicio;
  } else {
    // Si ya empezó, verificar si hay pago del mes actual
    paymentMonth = now;
  }

  // Calcular fecha de vencimiento
  const diaCobro = contract.diaCobro || 1;
  const dueDate = new Date(
    paymentMonth.getFullYear(),
    paymentMonth.getMonth(),
    Math.min(diaCobro, 28)
  );

  // Verificar que no exista ya un pago para este mes
  const existingPayment = await prisma.payment.findFirst({
    where: {
      contractId: contract.id,
      fechaVencimiento: {
        gte: startOfMonth(paymentMonth),
        lte: endOfMonth(paymentMonth),
      },
    },
  });

  if (existingPayment) {
    return existingPayment;
  }

  // Calcular importe (puede incluir depósito si es el primer mes)
  let amount = Number(contract.rentaMensual);
  let concepto = `Alquiler ${format(paymentMonth, 'MMMM yyyy', { locale: es })}`;

  // Si es el primer pago del contrato, incluir fianza si aplica
  const totalPagos = await prisma.payment.count({
    where: { contractId: contract.id },
  });

  if (totalPagos === 0 && contract.deposito && Number(contract.deposito) > 0) {
    // Crear pago de fianza separado
    await prisma.payment.create({
      data: {
        contractId: contract.id,
        periodo: 'Fianza/Depósito',
        monto: contract.deposito,
        fechaVencimiento: dueDate,
        estado: 'pendiente',
      },
    });
  }

  // Crear el pago de la primera mensualidad
  const payment = await prisma.payment.create({
    data: {
      contractId: contract.id,
      periodo: concepto,
      monto: contract.rentaMensual,
      fechaVencimiento: dueDate,
      estado: 'pendiente',
    },
  });

  return payment;
}

/**
 * Crear notificaciones de activación
 */
async function createActivationNotifications(
  contract: any,
  tenant: any,
  company: any
): Promise<void> {
  // Notificación al inquilino
  await createNotification({
    userId: tenant.id,
    companyId: company.id,
    titulo: '🎉 ¡Contrato activado!',
    mensaje: `Tu contrato de alquiler ha sido activado. Ya puedes acceder a tu portal de inquilino.`,
    tipo: 'contrato',
    prioridad: 'alta',
    enlace: '/portal-inquilino/contrato',
  });

  // Notificación al administrador
  const admins = await prisma.user.findMany({
    where: {
      companyId: company.id,
      role: { in: ['administrador', 'super_admin'] },
    },
    select: { id: true },
  });

  for (const admin of admins) {
    await createNotification({
      userId: admin.id,
      companyId: company.id,
      titulo: 'Contrato activado',
      mensaje: `El contrato de ${tenant.nombreCompleto} ha sido firmado y activado.`,
      tipo: 'contrato',
      prioridad: 'normal',
      enlace: `/contratos/${contract.id}`,
    });
  }
}

/**
 * Enviar emails de confirmación
 */
async function sendActivationEmails(
  contract: any,
  tenant: any,
  building: any,
  company: any,
  firstPayment: any
): Promise<void> {
  const fechaInicio = format(new Date(contract.fechaInicio), "d 'de' MMMM 'de' yyyy", { locale: es });
  const rentaMensual = Number(contract.rentaMensual).toFixed(2);
  const firstPaymentDue = format(new Date(firstPayment.fechaVencimiento), "d 'de' MMMM", { locale: es });

  // Email al inquilino
  await sendEmail({
    to: tenant.email,
    subject: '🎉 ¡Tu contrato ha sido activado!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #1e40af, #3b82f6); padding: 30px; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">¡Bienvenido a tu nuevo hogar!</h1>
        </div>
        
        <div style="padding: 30px; background: white; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
          <p>Hola <strong>${tenant.nombreCompleto}</strong>,</p>
          
          <p>Tu contrato de alquiler ha sido firmado y activado correctamente. 🎉</p>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #1e40af;">Detalles del contrato</h3>
            <table style="width: 100%;">
              <tr>
                <td style="color: #6b7280; padding: 5px 0;">Propiedad:</td>
                <td style="font-weight: bold;">${building.nombre} - ${contract.unit.numero}</td>
              </tr>
              <tr>
                <td style="color: #6b7280; padding: 5px 0;">Dirección:</td>
                <td>${building.direccion}</td>
              </tr>
              <tr>
                <td style="color: #6b7280; padding: 5px 0;">Fecha de inicio:</td>
                <td style="font-weight: bold;">${fechaInicio}</td>
              </tr>
              <tr>
                <td style="color: #6b7280; padding: 5px 0;">Renta mensual:</td>
                <td style="font-weight: bold; color: #1e40af;">${rentaMensual} €/mes</td>
              </tr>
            </table>
          </div>
          
          <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0;"><strong>⚠️ Primer pago pendiente</strong></p>
            <p style="margin: 10px 0 0 0;">
              Tienes un pago de <strong>${Number(firstPayment.monto).toFixed(2)} €</strong> 
              con vencimiento el <strong>${firstPaymentDue}</strong>.
            </p>
          </div>
          
          <h3 style="color: #1e40af;">¿Qué puedes hacer ahora?</h3>
          <ul style="color: #4b5563;">
            <li>Acceder a tu <a href="${process.env.NEXTAUTH_URL}/portal-inquilino">Portal de Inquilino</a></li>
            <li>Ver y descargar tu contrato firmado</li>
            <li>Realizar pagos online</li>
            <li>Comunicarte con el propietario</li>
            <li>Reportar incidencias de mantenimiento</li>
          </ul>
          
          <a href="${process.env.NEXTAUTH_URL}/portal-inquilino" 
             style="display: inline-block; background-color: #1e40af; color: white; 
                    padding: 12px 30px; border-radius: 6px; text-decoration: none; 
                    font-weight: bold; margin: 20px 0;">
            Acceder a mi portal
          </a>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          
          <p style="color: #9ca3af; font-size: 0.85em;">
            Este email ha sido enviado por ${company.nombre}.<br>
            Si tienes alguna duda, contacta con nosotros.
          </p>
        </div>
      </div>
    `,
  });

  // Email al administrador/propietario
  const adminEmails = await prisma.user.findMany({
    where: {
      companyId: company.id,
      role: { in: ['administrador', 'propietario'] },
    },
    select: { email: true },
  });

  for (const admin of adminEmails) {
    await sendEmail({
      to: admin.email,
      subject: `✅ Contrato firmado - ${tenant.nombreCompleto}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1e40af;">Contrato firmado y activado</h2>
          
          <p>El contrato de <strong>${tenant.nombreCompleto}</strong> ha sido firmado y activado.</p>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <table style="width: 100%;">
              <tr>
                <td style="color: #6b7280;">Propiedad:</td>
                <td style="font-weight: bold;">${building.nombre} - ${contract.unit.numero}</td>
              </tr>
              <tr>
                <td style="color: #6b7280;">Inquilino:</td>
                <td>${tenant.nombreCompleto} (${tenant.email})</td>
              </tr>
              <tr>
                <td style="color: #6b7280;">Renta:</td>
                <td style="font-weight: bold;">${rentaMensual} €/mes</td>
              </tr>
              <tr>
                <td style="color: #6b7280;">Inicio:</td>
                <td>${fechaInicio}</td>
              </tr>
            </table>
          </div>
          
          <p>Primer pago generado: <strong>${Number(firstPayment.monto).toFixed(2)} €</strong> con vencimiento el ${firstPaymentDue}.</p>
          
          <a href="${process.env.NEXTAUTH_URL}/contratos/${contract.id}" 
             style="display: inline-block; background-color: #1e40af; color: white; 
                    padding: 10px 20px; border-radius: 6px; text-decoration: none;">
            Ver contrato
          </a>
        </div>
      `,
    });
  }
}

/**
 * Procesar firma completada desde webhook
 */
export async function handleSignatureCompleted(params: {
  signatureId: string;
  contractId?: string;
  signedDocumentUrl?: string;
  signedAt?: Date;
  signatories?: string[];
}): Promise<ActivationResult> {
  // Buscar contrato por signatureId
  let contractId = params.contractId;
  
  if (!contractId) {
    const signature = await prisma.contractSignature.findFirst({
      where: { externalId: params.signatureId },
      select: { contractId: true },
    });
    
    if (!signature) {
      return {
        success: false,
        contractId: '',
        status: 'signature_not_found',
        message: 'No se encontró el contrato asociado a esta firma',
        actions: [],
      };
    }
    
    contractId = signature.contractId;
  }

  // Actualizar registro de firma
  await prisma.contractSignature.updateMany({
    where: { externalId: params.signatureId },
    data: {
      status: 'SIGNED',
      signedAt: params.signedAt || new Date(),
      signedDocumentUrl: params.signedDocumentUrl,
    },
  });

  // Activar el contrato
  return activateContract(contractId, {
    signatureId: params.signatureId,
    signedDocumentUrl: params.signedDocumentUrl,
    signedAt: params.signedAt,
    signedBy: params.signatories,
    enableSepa: true,
  });
}

/**
 * Obtener contratos pendientes de activación (firmados pero no activados)
 */
export async function getPendingActivations(companyId?: string): Promise<any[]> {
  const where: any = {
    estado: { in: ['pendiente_firma', 'firmado'] },
    signatures: {
      some: {
        status: 'SIGNED',
      },
    },
  };

  if (companyId) {
    where.unit = {
      building: { companyId },
    };
  }

  return prisma.contract.findMany({
    where,
    include: {
      tenant: {
        select: { nombreCompleto: true, email: true },
      },
      unit: {
        include: {
          building: {
            select: { nombre: true },
          },
        },
      },
      signatures: {
        where: { status: 'SIGNED' },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}
