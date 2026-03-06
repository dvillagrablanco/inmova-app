/**
 * Servicio de Firmas de Operadores de Media Estancia
 * 
 * Gestiona el flujo completo de contratos recibidos de operadores como Álamo:
 * 1. Recepción del contrato PDF (manual, email, API, webhook)
 * 2. Revisión y aprobación por el gestor
 * 3. Envío a DocuSign para firma digital
 * 4. Tracking del estado de firma
 * 5. Descarga del documento firmado
 * 
 * Soporta firma en lote para múltiples contratos del mismo operador.
 * 
 * @module lib/operator-signature-service
 */

import logger from '@/lib/logger';
import crypto from 'crypto';

async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

// ============================================================================
// TIPOS
// ============================================================================

export interface CreateOperatorSignatureInput {
  companyId: string;
  operatorName: string;
  operatorEmail?: string;
  operatorPhone?: string;
  operatorRef?: string;
  documentUrl: string;
  documentName: string;
  unitId?: string;
  contractId?: string;
  buildingId?: string;
  tenantName?: string;
  tenantEmail?: string;
  tenantPhone?: string;
  tenantDni?: string;
  signatories: Array<{ name: string; email: string; role: string; phone?: string }>;
  contractType?: string;
  startDate?: Date;
  endDate?: Date;
  monthlyRent?: number;
  receivedVia?: string;
  expiresAt?: Date;
}

export interface ApproveOperatorSignatureInput {
  reviewedBy: string;
  reviewNotes?: string;
  provider?: 'DOCUSIGN' | 'SIGNATURIT';
  emailSubject?: string;
  emailMessage?: string;
}

export interface OperatorSignatureFilters {
  companyId: string;
  status?: string;
  operatorName?: string;
  unitId?: string;
  batchId?: string;
  page?: number;
  limit?: number;
}

// ============================================================================
// OPERADORES CONOCIDOS
// ============================================================================

export const KNOWN_OPERATORS = [
  { name: 'Álamo', slug: 'alamo', type: 'media_estancia' },
  { name: 'Spotahome', slug: 'spotahome', type: 'media_estancia' },
  { name: 'HousingAnywhere', slug: 'housing_anywhere', type: 'media_estancia' },
  { name: 'Uniplaces', slug: 'uniplaces', type: 'media_estancia' },
  { name: 'Badi', slug: 'badi', type: 'media_estancia' },
  { name: 'Homelike', slug: 'homelike', type: 'corporativo' },
  { name: 'Beroomers', slug: 'beroomers', type: 'media_estancia' },
] as const;

// ============================================================================
// FUNCIONES PRINCIPALES
// ============================================================================

/**
 * Crea una nueva solicitud de firma de operador
 */
export async function createOperatorSignatureRequest(
  input: CreateOperatorSignatureInput
): Promise<any> {
  const prisma = await getPrisma();

  // Calcular hash del documento si hay URL
  let documentHash: string | undefined;
  try {
    const response = await fetch(input.documentUrl, { method: 'HEAD' });
    if (response.ok) {
      documentHash = crypto
        .createHash('sha256')
        .update(input.documentUrl + Date.now())
        .digest('hex');
    }
  } catch {
    // Hash fallback basado en URL
    documentHash = crypto.createHash('sha256').update(input.documentUrl).digest('hex');
  }

  const request = await prisma.operatorSignatureRequest.create({
    data: {
      companyId: input.companyId,
      operatorName: input.operatorName,
      operatorEmail: input.operatorEmail,
      operatorPhone: input.operatorPhone,
      operatorRef: input.operatorRef,
      documentUrl: input.documentUrl,
      documentName: input.documentName,
      documentHash,
      unitId: input.unitId,
      contractId: input.contractId,
      buildingId: input.buildingId,
      tenantName: input.tenantName,
      tenantEmail: input.tenantEmail,
      tenantPhone: input.tenantPhone,
      tenantDni: input.tenantDni,
      signatories: input.signatories,
      contractType: input.contractType || 'media_estancia',
      startDate: input.startDate,
      endDate: input.endDate,
      monthlyRent: input.monthlyRent,
      receivedVia: input.receivedVia || 'manual',
      expiresAt: input.expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      status: 'pending_review',
    },
    include: {
      unit: { select: { numero: true, building: { select: { nombre: true } } } },
      contract: { select: { id: true, estado: true } },
    },
  });

  logger.info('[OperatorSignature] Request created', {
    id: request.id,
    operator: input.operatorName,
    company: input.companyId,
    unit: input.unitId,
  });

  return request;
}

/**
 * Lista solicitudes de firma de operadores con filtros
 */
export async function listOperatorSignatureRequests(
  filters: OperatorSignatureFilters
): Promise<{ data: any[]; total: number; page: number; pages: number }> {
  const prisma = await getPrisma();
  const page = filters.page || 1;
  const limit = Math.min(filters.limit || 20, 100);

  const where: any = {
    companyId: filters.companyId,
    ...(filters.status && { status: filters.status }),
    ...(filters.operatorName && { operatorName: filters.operatorName }),
    ...(filters.unitId && { unitId: filters.unitId }),
    ...(filters.batchId && { batchId: filters.batchId }),
  };

  const [data, total] = await Promise.all([
    prisma.operatorSignatureRequest.findMany({
      where,
      include: {
        unit: { select: { numero: true, building: { select: { nombre: true, direccion: true } } } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.operatorSignatureRequest.count({ where }),
  ]);

  return {
    data,
    total,
    page,
    pages: Math.ceil(total / limit),
  };
}

/**
 * Obtiene detalle de una solicitud
 */
export async function getOperatorSignatureRequest(
  id: string,
  companyId: string
): Promise<any | null> {
  const prisma = await getPrisma();
  return prisma.operatorSignatureRequest.findFirst({
    where: { id, companyId },
    include: {
      unit: { select: { numero: true, building: { select: { nombre: true, direccion: true } } } },
      contract: { select: { id: true, estado: true, fechaInicio: true, fechaFin: true } },
    },
  });
}

/**
 * Aprueba una solicitud y envía a DocuSign para firma
 */
export async function approveOperatorSignatureRequest(
  id: string,
  companyId: string,
  input: ApproveOperatorSignatureInput
): Promise<any> {
  const prisma = await getPrisma();

  const request = await prisma.operatorSignatureRequest.findFirst({
    where: { id, companyId, status: 'pending_review' },
    include: {
      unit: { select: { numero: true, building: { select: { nombre: true } } } },
    },
  });

  if (!request) {
    throw new Error('Solicitud no encontrada o no está pendiente de revisión');
  }

  // Actualizar a approved
  await prisma.operatorSignatureRequest.update({
    where: { id },
    data: {
      status: 'approved',
      reviewedBy: input.reviewedBy,
      reviewedAt: new Date(),
      reviewNotes: input.reviewNotes,
    },
  });

  // Enviar a firma digital
  try {
    const provider = input.provider || 'DOCUSIGN';
    const signatories = request.signatories as any[];
    const unitNumero = request.unit?.numero;
    const buildingNombre = request.unit?.building?.nombre;

    const emailSubject = input.emailSubject ||
      `Firma contrato ${request.operatorName} - ${buildingNombre || ''} ${unitNumero || ''}`.trim();
    const emailMessage = input.emailMessage ||
      `Contrato de media estancia con ${request.operatorName}. Por favor, revisa y firma el documento adjunto.`;

    // Descargar PDF
    let pdfBuffer: Buffer;
    try {
      if (request.documentUrl.startsWith('http://') || request.documentUrl.startsWith('https://')) {
        const response = await fetch(request.documentUrl);
        pdfBuffer = Buffer.from(await response.arrayBuffer());
      } else {
        const { downloadFile } = await import('@/lib/s3');
        pdfBuffer = await downloadFile(request.documentUrl);
      }
    } catch (dlError: any) {
      throw new Error(`No se pudo descargar el documento: ${dlError.message}`);
    }

    const documentHash = crypto.createHash('sha256').update(pdfBuffer).digest('hex');

    if (provider === 'DOCUSIGN') {
      // Enviar via DocuSign
      const docusignModule = 'docusign-esign';
      const docusign = await import(/* webpackIgnore: true */ docusignModule);
      const integrationKey = process.env.DOCUSIGN_INTEGRATION_KEY!;
      const userId = process.env.DOCUSIGN_USER_ID!;
      const accountId = process.env.DOCUSIGN_ACCOUNT_ID!;
      const basePath = process.env.DOCUSIGN_BASE_PATH || 'https://www.docusign.net/restapi';
      const privateKey = (process.env.DOCUSIGN_PRIVATE_KEY || '').replace(/\\n/g, '\n');
      const isProduction = !basePath.includes('demo');
      const oAuthHost = isProduction ? 'account.docusign.com' : 'account-d.docusign.com';

      // Get token
      const apiClient = new docusign.ApiClient();
      apiClient.setOAuthBasePath(oAuthHost);
      const authResult = await apiClient.requestJWTUserToken(
        integrationKey, userId, ['signature', 'impersonation'],
        Buffer.from(privateKey, 'utf8'), 3600
      );

      apiClient.setBasePath(basePath);
      apiClient.addDefaultHeader('Authorization', `Bearer ${authResult.body.access_token}`);

      const envelopesApi = new docusign.EnvelopesApi(apiClient);

      // Build envelope
      const document = new docusign.Document();
      document.documentBase64 = pdfBuffer.toString('base64');
      document.name = request.documentName;
      document.fileExtension = 'pdf';
      document.documentId = '1';

      const signers = signatories.map((s: any, idx: number) => {
        const signer = new docusign.Signer();
        signer.email = s.email;
        signer.name = s.name;
        signer.recipientId = String(idx + 1);
        signer.routingOrder = String(idx + 1);
        const signHere = new docusign.SignHere();
        signHere.anchorString = '/firma/';
        signHere.anchorUnits = 'pixels';
        signHere.anchorXOffset = '0';
        signHere.anchorYOffset = '0';
        signer.tabs = new docusign.Tabs();
        signer.tabs.signHereTabs = [signHere];
        return signer;
      });

      const recipients = new docusign.Recipients();
      recipients.signers = signers;

      const envelopeDefinition = new docusign.EnvelopeDefinition();
      envelopeDefinition.emailSubject = emailSubject;
      envelopeDefinition.emailBlurb = emailMessage;
      envelopeDefinition.recipients = recipients;
      envelopeDefinition.documents = [document];
      envelopeDefinition.status = 'sent';

      // Notification settings
      const notification = new docusign.Notification();
      notification.useAccountDefaults = false;
      const reminders = new docusign.Reminders();
      reminders.reminderEnabled = 'true';
      reminders.reminderDelay = '3';
      reminders.reminderFrequency = '5';
      notification.reminders = reminders;
      const expirations = new docusign.Expirations();
      expirations.expireEnabled = 'true';
      expirations.expireAfter = '30';
      expirations.expireWarn = '5';
      notification.expirations = expirations;
      envelopeDefinition.notification = notification;

      const result = await envelopesApi.createEnvelope(accountId, { envelopeDefinition });
      const envelopeId = result.envelopeId;

      // Create ContractSignature record
      const signatureRecord = await prisma.contractSignature.create({
        data: {
          companyId: request.companyId,
          contractId: request.contractId || 'operator-' + request.id,
          provider: 'DOCUSIGN',
          externalId: envelopeId,
          documentUrl: request.documentUrl,
          documentName: request.documentName,
          documentHash,
          signatories: signatories.map((s: any) => ({ ...s, status: 'PENDING' })),
          status: 'PENDING',
          emailSubject,
          emailMessage,
          sentAt: new Date(),
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          requestedBy: input.reviewedBy,
        },
      });

      // Update operator request
      await prisma.operatorSignatureRequest.update({
        where: { id },
        data: {
          status: 'sent_to_sign',
          signatureId: signatureRecord.id,
          signatureProvider: 'DOCUSIGN',
          signatureExternalId: envelopeId,
          sentToSignAt: new Date(),
        },
      });

      logger.info('[OperatorSignature] Sent to DocuSign', {
        requestId: id,
        envelopeId,
        operator: request.operatorName,
      });

      return {
        ...request,
        status: 'sent_to_sign',
        signatureId: signatureRecord.id,
        signatureExternalId: envelopeId,
        signatureProvider: 'DOCUSIGN',
      };
    }

    // Fallback to status update only
    await prisma.operatorSignatureRequest.update({
      where: { id },
      data: { status: 'approved' },
    });

    return { ...request, status: 'approved' };
  } catch (signError: any) {
    logger.error('[OperatorSignature] Error sending to signature:', signError.message);
    // Revert to pending_review if signature fails
    await prisma.operatorSignatureRequest.update({
      where: { id },
      data: { status: 'pending_review', reviewNotes: `Error: ${signError.message}` },
    });
    throw new Error(`Error enviando a firma: ${signError.message}`);
  }
}

/**
 * Rechaza una solicitud de firma de operador
 */
export async function rejectOperatorSignatureRequest(
  id: string,
  companyId: string,
  rejectedBy: string,
  reason: string
): Promise<any> {
  const prisma = await getPrisma();

  const request = await prisma.operatorSignatureRequest.findFirst({
    where: { id, companyId, status: 'pending_review' },
  });

  if (!request) {
    throw new Error('Solicitud no encontrada o no está pendiente de revisión');
  }

  return prisma.operatorSignatureRequest.update({
    where: { id },
    data: {
      status: 'rejected',
      reviewedBy: rejectedBy,
      reviewedAt: new Date(),
      rejectedReason: reason,
    },
  });
}

/**
 * Crea solicitudes en lote para múltiples contratos del mismo operador
 */
export async function createBatchOperatorSignatures(
  companyId: string,
  operatorName: string,
  requests: Array<Omit<CreateOperatorSignatureInput, 'companyId' | 'operatorName'>>
): Promise<{ batchId: string; created: number; requests: any[] }> {
  const batchId = `batch_${crypto.randomBytes(8).toString('hex')}`;
  const results: any[] = [];

  for (const req of requests) {
    const created = await createOperatorSignatureRequest({
      ...req,
      companyId,
      operatorName,
    });
    // Tag with batch ID
    const prisma = await getPrisma();
    await prisma.operatorSignatureRequest.update({
      where: { id: created.id },
      data: { batchId },
    });
    results.push({ ...created, batchId });
  }

  logger.info('[OperatorSignature] Batch created', {
    batchId,
    operator: operatorName,
    count: results.length,
  });

  return { batchId, created: results.length, requests: results };
}

/**
 * Aprueba y envía a firma todas las solicitudes de un lote
 */
export async function approveBatch(
  batchId: string,
  companyId: string,
  approvedBy: string
): Promise<{ approved: number; errors: string[] }> {
  const prisma = await getPrisma();
  const requests = await prisma.operatorSignatureRequest.findMany({
    where: { batchId, companyId, status: 'pending_review' },
  });

  let approved = 0;
  const errors: string[] = [];

  for (const req of requests) {
    try {
      await approveOperatorSignatureRequest(req.id, companyId, {
        reviewedBy: approvedBy,
        reviewNotes: `Aprobado en lote ${batchId}`,
      });
      approved++;
    } catch (err: any) {
      errors.push(`${req.id}: ${err.message}`);
    }
  }

  return { approved, errors };
}

/**
 * Estadísticas de firmas de operadores
 */
export async function getOperatorSignatureStats(companyId: string): Promise<{
  total: number;
  pendingReview: number;
  sentToSign: number;
  signed: number;
  rejected: number;
  expired: number;
  byOperator: Array<{ operator: string; count: number; signed: number; pending: number }>;
}> {
  const prisma = await getPrisma();

  const [total, pendingReview, sentToSign, signed, rejected, expired] = await Promise.all([
    prisma.operatorSignatureRequest.count({ where: { companyId } }),
    prisma.operatorSignatureRequest.count({ where: { companyId, status: 'pending_review' } }),
    prisma.operatorSignatureRequest.count({ where: { companyId, status: 'sent_to_sign' } }),
    prisma.operatorSignatureRequest.count({ where: { companyId, status: 'signed' } }),
    prisma.operatorSignatureRequest.count({ where: { companyId, status: 'rejected' } }),
    prisma.operatorSignatureRequest.count({ where: { companyId, status: 'expired' } }),
  ]);

  // Group by operator
  const byOperatorRaw = await prisma.operatorSignatureRequest.groupBy({
    by: ['operatorName', 'status'],
    where: { companyId },
    _count: true,
  });

  const operatorMap = new Map<string, { count: number; signed: number; pending: number }>();
  for (const row of byOperatorRaw) {
    const existing = operatorMap.get(row.operatorName) || { count: 0, signed: 0, pending: 0 };
    existing.count += row._count;
    if (row.status === 'signed') existing.signed += row._count;
    if (['pending_review', 'approved', 'sent_to_sign'].includes(row.status)) existing.pending += row._count;
    operatorMap.set(row.operatorName, existing);
  }

  const byOperator = Array.from(operatorMap.entries()).map(([operator, stats]) => ({
    operator,
    ...stats,
  }));

  return { total, pendingReview, sentToSign, signed, rejected, expired, byOperator };
}
