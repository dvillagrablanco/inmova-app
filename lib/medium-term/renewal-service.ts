/**
 * SERVICIO DE RENOVACIÓN AUTOMATIZADA
 * 
 * Gestión de prórrogas y renovaciones de contratos de media estancia
 */

import { prisma } from '../db';
import { addMonths, differenceInDays, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { sendNotification } from './notification-service';
import { initializeSignature } from './signature-service';
import { calcularProrrateo } from '../medium-term-rental-service';

import logger from '@/lib/logger';
// ==========================================
// TIPOS
// ==========================================

export type RenewalStatus = 
  | 'available'
  | 'proposed'
  | 'pending_tenant'
  | 'pending_owner'
  | 'accepted'
  | 'rejected'
  | 'expired'
  | 'completed';

export interface RenewalConfig {
  contractId: string;
  renewalMonths: number;
  newRent?: number;
  rentIncreasePercent?: number;
  maintainServices: boolean;
  additionalConditions?: string[];
  proposedBy: 'owner' | 'tenant';
  expirationDays: number;
}

export interface RenewalProposal {
  id: string;
  contractId: string;
  status: RenewalStatus;
  originalEndDate: Date;
  proposedEndDate: Date;
  renewalMonths: number;
  currentRent: number;
  proposedRent: number;
  rentChange: number;
  rentChangePercent: number;
  proposedBy: string;
  proposedAt: Date;
  respondedAt?: Date;
  respondedBy?: string;
  additionalConditions?: string[];
  expiresAt: Date;
}

export interface RenewalEligibility {
  eligible: boolean;
  reasons: string[];
  maxRenewalMonths: number;
  suggestedRent: number;
  suggestedRentChange: number;
  recommendations: string[];
}

// ==========================================
// FUNCIONES PRINCIPALES
// ==========================================

/**
 * Verifica elegibilidad para renovación
 */
export async function checkRenewalEligibility(
  contractId: string
): Promise<RenewalEligibility> {
  const contract = await prisma.contract.findUnique({
    where: { id: contractId },
    include: {
      unit: true,
      tenant: true,
    },
  });

  if (!contract) {
    return {
      eligible: false,
      reasons: ['Contrato no encontrado'],
      maxRenewalMonths: 0,
      suggestedRent: 0,
      suggestedRentChange: 0,
      recommendations: [],
    };
  }

  const reasons: string[] = [];
  const recommendations: string[] = [];
  let eligible = true;
  let maxRenewalMonths = 11;

  // Verificar estado del contrato
  if (contract.status !== 'activo') {
    eligible = false;
    reasons.push(`Contrato no está activo (estado: ${contract.status})`);
  }

  // Verificar tipo de arrendamiento
  if (contract.tipoArrendamiento !== 'temporada') {
    eligible = false;
    reasons.push('Solo se pueden renovar contratos de media estancia');
  }

  // Verificar límite de prórrogas
  const prorrogasRealizadas = contract.prorrogasRealizadas || 0;
  const maximasProrrogas = contract.maximasProrrogas || 2;

  if (prorrogasRealizadas >= maximasProrrogas) {
    eligible = false;
    reasons.push(`Se ha alcanzado el máximo de prórrogas (${maximasProrrogas})`);
    recommendations.push('Considerar crear un nuevo contrato en lugar de renovar');
  }

  // Verificar duración total (no debe superar 11 meses + renovaciones)
  const duracionActual = contract.duracionMesesPrevista || 0;
  const duracionTotal = duracionActual + (prorrogasRealizadas * 3); // Estimado

  if (duracionTotal >= 11) {
    maxRenewalMonths = Math.max(0, 11 - duracionTotal);
    if (maxRenewalMonths === 0) {
      eligible = false;
      reasons.push('La duración total no puede superar los 11 meses (LAU Art. 3.2)');
    }
  }

  // Verificar días hasta fin de contrato
  const diasHastaFin = differenceInDays(contract.fechaFin, new Date());
  if (diasHastaFin < 0) {
    eligible = false;
    reasons.push('El contrato ya ha finalizado');
  } else if (diasHastaFin < 7) {
    recommendations.push('Quedan menos de 7 días. Considerar renovación urgente.');
  }

  // Verificar impagos
  const impagos = await prisma.payment.count({
    where: {
      contractId,
      status: 'overdue',
    },
  });

  if (impagos > 0) {
    recommendations.push(`Hay ${impagos} pagos pendientes. Resolver antes de renovar.`);
  }

  // Calcular renta sugerida
  const ipcAnual = 0.03; // 3% estimado
  const suggestedRent = Math.round(contract.rentaMensual * (1 + ipcAnual));
  const suggestedRentChange = suggestedRent - contract.rentaMensual;

  if (eligible) {
    reasons.push('Contrato elegible para renovación');
    recommendations.push(`Prórroga máxima sugerida: ${maxRenewalMonths} meses`);
    recommendations.push(`Incremento sugerido según IPC: ${suggestedRentChange}€ (+${(ipcAnual * 100).toFixed(1)}%)`);
  }

  return {
    eligible,
    reasons,
    maxRenewalMonths,
    suggestedRent,
    suggestedRentChange,
    recommendations,
  };
}

/**
 * Crea una propuesta de renovación
 */
export async function createRenewalProposal(
  config: RenewalConfig
): Promise<RenewalProposal> {
  const contract = await prisma.contract.findUnique({
    where: { id: config.contractId },
    include: {
      tenant: true,
      unit: { include: { building: true } },
    },
  });

  if (!contract) {
    throw new Error('Contrato no encontrado');
  }

  // Verificar elegibilidad
  const eligibility = await checkRenewalEligibility(config.contractId);
  if (!eligibility.eligible) {
    throw new Error(`No elegible para renovación: ${eligibility.reasons.join(', ')}`);
  }

  if (config.renewalMonths > eligibility.maxRenewalMonths) {
    throw new Error(`Máximo permitido: ${eligibility.maxRenewalMonths} meses`);
  }

  // Calcular nueva renta
  let proposedRent = contract.rentaMensual;
  
  if (config.newRent) {
    proposedRent = config.newRent;
  } else if (config.rentIncreasePercent) {
    proposedRent = Math.round(contract.rentaMensual * (1 + config.rentIncreasePercent / 100));
  }

  const rentChange = proposedRent - contract.rentaMensual;
  const rentChangePercent = (rentChange / contract.rentaMensual) * 100;

  // Calcular nueva fecha de fin
  const proposedEndDate = addMonths(contract.fechaFin, config.renewalMonths);

  // Crear propuesta
  const proposal = await prisma.renewalProposal.create({
    data: {
      contractId: config.contractId,
      status: 'proposed',
      originalEndDate: contract.fechaFin,
      proposedEndDate,
      renewalMonths: config.renewalMonths,
      currentRent: contract.rentaMensual,
      proposedRent,
      rentChange,
      rentChangePercent,
      proposedBy: config.proposedBy,
      additionalConditions: config.additionalConditions,
      expiresAt: new Date(Date.now() + config.expirationDays * 24 * 60 * 60 * 1000),
    },
  });

  // Notificar a la otra parte
  const recipientId = config.proposedBy === 'owner' ? contract.tenantId : contract.companyId;
  const recipientRole = config.proposedBy === 'owner' ? 'tenant' : 'owner';

  await sendNotification({
    recipientId: recipientId || '',
    recipientEmail: config.proposedBy === 'owner' ? contract.tenant.email : '',
    recipientName: config.proposedBy === 'owner' ? contract.tenant.nombre : '',
    contractId: config.contractId,
    type: 'renewal_available',
    data: {
      propertyAddress: `${contract.unit.direccion}, ${contract.unit.building?.city}`,
      endDate: format(contract.fechaFin, "d 'de' MMMM 'de' yyyy", { locale: es }),
      renewalMonths: config.renewalMonths,
      proposedRent,
      rentChange,
      actionUrl: `${process.env.NEXTAUTH_URL}/portal/renewals/${proposal.id}`,
    },
  });

  return proposal as RenewalProposal;
}

/**
 * Responde a una propuesta de renovación
 */
export async function respondToRenewal(
  proposalId: string,
  response: 'accept' | 'reject' | 'counter',
  respondedBy: string,
  counterOffer?: {
    renewalMonths?: number;
    proposedRent?: number;
    additionalConditions?: string[];
  }
): Promise<RenewalProposal> {
  const proposal = await prisma.renewalProposal.findUnique({
    where: { id: proposalId },
    include: {
      contract: {
        include: {
          tenant: true,
          unit: { include: { building: true } },
        },
      },
    },
  });

  if (!proposal) {
    throw new Error('Propuesta no encontrada');
  }

  if (proposal.status !== 'proposed' && proposal.status !== 'pending_tenant' && proposal.status !== 'pending_owner') {
    throw new Error(`No se puede responder: estado ${proposal.status}`);
  }

  if (new Date() > proposal.expiresAt) {
    await prisma.renewalProposal.update({
      where: { id: proposalId },
      data: { status: 'expired' },
    });
    throw new Error('La propuesta ha expirado');
  }

  if (response === 'accept') {
    // Aceptar renovación
    await prisma.renewalProposal.update({
      where: { id: proposalId },
      data: {
        status: 'accepted',
        respondedAt: new Date(),
        respondedBy,
      },
    });

    // Crear addendum al contrato o nuevo contrato
    await executeRenewal(proposalId);

    return { ...proposal, status: 'accepted' } as RenewalProposal;
  } else if (response === 'reject') {
    await prisma.renewalProposal.update({
      where: { id: proposalId },
      data: {
        status: 'rejected',
        respondedAt: new Date(),
        respondedBy,
      },
    });

    return { ...proposal, status: 'rejected' } as RenewalProposal;
  } else if (response === 'counter' && counterOffer) {
    // Crear contra-propuesta
    const newProposal = await createRenewalProposal({
      contractId: proposal.contractId,
      renewalMonths: counterOffer.renewalMonths || proposal.renewalMonths,
      newRent: counterOffer.proposedRent,
      maintainServices: true,
      additionalConditions: counterOffer.additionalConditions,
      proposedBy: respondedBy === proposal.contract.tenantId ? 'tenant' : 'owner',
      expirationDays: 7,
    });

    // Marcar propuesta original como respondida
    await prisma.renewalProposal.update({
      where: { id: proposalId },
      data: {
        status: 'rejected',
        respondedAt: new Date(),
        respondedBy,
      },
    });

    return newProposal;
  }

  throw new Error('Respuesta no válida');
}

/**
 * Ejecuta la renovación aprobada
 */
async function executeRenewal(proposalId: string): Promise<void> {
  const proposal = await prisma.renewalProposal.findUnique({
    where: { id: proposalId },
    include: {
      contract: {
        include: {
          tenant: true,
          unit: true,
        },
      },
    },
  });

  if (!proposal || proposal.status !== 'accepted') {
    throw new Error('Propuesta no aceptada');
  }

  const contract = proposal.contract;

  // Opción 1: Actualizar contrato existente (addendum)
  await prisma.contract.update({
    where: { id: contract.id },
    data: {
      fechaFin: proposal.proposedEndDate,
      rentaMensual: proposal.proposedRent,
      duracionMesesPrevista: (contract.duracionMesesPrevista || 0) + proposal.renewalMonths,
      prorrogasRealizadas: (contract.prorrogasRealizadas || 0) + 1,
      // Guardar historial
      renewalHistory: {
        push: {
          proposalId: proposal.id,
          renewedAt: new Date(),
          previousEndDate: proposal.originalEndDate,
          newEndDate: proposal.proposedEndDate,
          previousRent: proposal.currentRent,
          newRent: proposal.proposedRent,
        },
      },
    },
  });

  // Generar addendum de renovación
  const addendum = await generateRenewalAddendum(proposal as RenewalProposal, contract);

  // Iniciar proceso de firma
  await initializeSignature({
    contractId: contract.id,
    signatories: [
      {
        email: contract.tenant.email,
        name: contract.tenant.nombre,
        role: 'arrendatario',
      },
      // TODO: Añadir arrendador
    ],
    subject: 'Firma de Addendum de Renovación',
    body: 'Por favor, firme el addendum de renovación del contrato de arrendamiento.',
    expirationDays: 7,
  });

  // Marcar propuesta como completada
  await prisma.renewalProposal.update({
    where: { id: proposalId },
    data: { status: 'completed' },
  });

  // Notificar a ambas partes
  await sendNotification({
    recipientId: contract.tenantId,
    recipientEmail: contract.tenant.email,
    recipientName: contract.tenant.nombre,
    contractId: contract.id,
    type: 'signature_pending',
    data: {
      propertyAddress: contract.unit.direccion,
      startDate: format(contract.fechaInicio, "d 'de' MMMM", { locale: es }),
      endDate: format(proposal.proposedEndDate, "d 'de' MMMM 'de' yyyy", { locale: es }),
      rentAmount: proposal.proposedRent,
    },
  });
}

/**
 * Genera el addendum de renovación
 */
async function generateRenewalAddendum(
  proposal: RenewalProposal,
  contract: any
): Promise<string> {
  const addendumHTML = `
<!DOCTYPE html>
<html>
<head>
  <title>Addendum de Renovación</title>
  <style>
    body { font-family: 'Times New Roman', serif; padding: 40px; }
    h1 { text-align: center; }
    .section { margin: 20px 0; }
    .signature { margin-top: 50px; display: flex; justify-content: space-between; }
    .signature-box { width: 45%; text-align: center; }
    .signature-line { border-bottom: 1px solid #000; height: 40px; }
  </style>
</head>
<body>
  <h1>ADDENDUM DE RENOVACIÓN</h1>
  <h2>Contrato de Arrendamiento por Temporada</h2>
  
  <div class="section">
    <p>En ${contract.unit.building?.city || 'ciudad'}, a ${format(new Date(), "d 'de' MMMM 'de' yyyy", { locale: es })}</p>
  </div>
  
  <div class="section">
    <h3>REUNIDOS</h3>
    <p>De una parte, el ARRENDADOR, y de otra parte, ${contract.tenant.nombre} como ARRENDATARIO.</p>
  </div>
  
  <div class="section">
    <h3>EXPONEN</h3>
    <p>Que ambas partes suscribieron un contrato de arrendamiento por temporada para la vivienda sita en ${contract.unit.direccion}, con fecha de finalización prevista el ${format(proposal.originalEndDate, "d 'de' MMMM 'de' yyyy", { locale: es })}.</p>
    <p>Que ambas partes desean prorrogar la duración del contrato en las condiciones que se establecen.</p>
  </div>
  
  <div class="section">
    <h3>ACUERDAN</h3>
    <p><strong>PRIMERO.-</strong> Prorrogar la duración del contrato por un período adicional de ${proposal.renewalMonths} meses.</p>
    <p><strong>SEGUNDO.-</strong> La nueva fecha de finalización del contrato será el ${format(proposal.proposedEndDate, "d 'de' MMMM 'de' yyyy", { locale: es })}.</p>
    <p><strong>TERCERO.-</strong> La renta mensual será de ${proposal.proposedRent}€ (${proposal.rentChange >= 0 ? '+' : ''}${proposal.rentChangePercent.toFixed(1)}% respecto al período anterior).</p>
    <p><strong>CUARTO.-</strong> Las demás condiciones del contrato original permanecen vigentes.</p>
    <p><strong>QUINTO.-</strong> Este addendum mantiene la naturaleza de arrendamiento por temporada (Art. 3.2 LAU).</p>
  </div>
  
  <div class="signature">
    <div class="signature-box">
      <div class="signature-line"></div>
      <p>EL ARRENDADOR</p>
    </div>
    <div class="signature-box">
      <div class="signature-line"></div>
      <p>EL ARRENDATARIO<br>${contract.tenant.nombre}</p>
    </div>
  </div>
</body>
</html>
`;

  return addendumHTML;
}

/**
 * Procesa renovaciones automáticas (cron job)
 */
export async function processAutoRenewals(): Promise<{
  processed: number;
  renewed: number;
  expired: number;
}> {
  let processed = 0;
  let renewed = 0;
  let expired = 0;

  // Buscar contratos con renovación automática próximos a vencer
  const contracts = await prisma.contract.findMany({
    where: {
      tipoArrendamiento: 'temporada',
      status: 'activo',
      renovacionPorPeriodoIgual: true,
      fechaFin: {
        gte: new Date(),
        lte: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // Próximos 45 días
      },
    },
    include: {
      tenant: true,
      unit: true,
    },
  });

  for (const contract of contracts) {
    processed++;

    // Verificar elegibilidad
    const eligibility = await checkRenewalEligibility(contract.id);

    if (eligibility.eligible) {
      // Crear propuesta automática
      try {
        await createRenewalProposal({
          contractId: contract.id,
          renewalMonths: Math.min(contract.duracionMesesPrevista || 3, eligibility.maxRenewalMonths),
          rentIncreasePercent: 3, // IPC estimado
          maintainServices: true,
          proposedBy: 'owner',
          expirationDays: 14,
        });
        renewed++;
      } catch (error) {
        logger.error(`[Renewal] Error procesando ${contract.id}:`, error);
      }
    } else {
      // Notificar que no se puede renovar
      expired++;
    }
  }

  return { processed, renewed, expired };
}

export default {
  checkRenewalEligibility,
  createRenewalProposal,
  respondToRenewal,
  processAutoRenewals,
};
