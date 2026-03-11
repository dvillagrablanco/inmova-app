// @ts-nocheck
import logger from '@/lib/logger';

interface SendResult {
  sent: number;
  failed: number;
  errors: string[];
}

async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

/**
 * Generates a unique sequential code for insurance quote requests.
 * Format: SOL-YYYY-NNNN (e.g. SOL-2026-0001)
 */
export async function generateQuoteRequestCode(): Promise<string> {
  const prisma = await getPrisma();
  const year = new Date().getFullYear();
  const prefix = `SOL-${year}-`;

  const lastRequest = await prisma.insuranceQuoteRequest.findFirst({
    where: { codigo: { startsWith: prefix } },
    orderBy: { codigo: 'desc' },
    select: { codigo: true },
  });

  const nextNumber = lastRequest ? parseInt(lastRequest.codigo.split('-').pop() || '0') + 1 : 1;

  return `${prefix}${String(nextNumber).padStart(4, '0')}`;
}

/**
 * Sends branded quote-request emails to every provider linked to the request.
 * Updates tracking fields on each provider row and sets the request status to 'enviada'.
 */
export async function sendQuoteRequestEmails(requestId: string): Promise<SendResult> {
  const prisma = await getPrisma();
  const result: SendResult = { sent: 0, failed: 0, errors: [] };

  const request = await prisma.insuranceQuoteRequest.findUnique({
    where: { id: requestId },
    include: {
      company: {
        select: {
          nombre: true,
          cif: true,
          direccion: true,
          codigoPostal: true,
          ciudad: true,
          telefono: true,
          email: true,
          logoUrl: true,
          colorPrimario: true,
          colorSecundario: true,
          pieDocumento: true,
        },
      },
      building: true,
    },
  });

  if (!request) {
    logger.error(`[QuoteRequestService] Request not found: ${requestId}`);
    result.failed = 1;
    result.errors.push(`Request ${requestId} not found`);
    return result;
  }

  const requestProviders = await prisma.insuranceQuoteRequestProvider.findMany({
    where: { requestId },
    include: { provider: true },
  });

  if (requestProviders.length === 0) {
    logger.warn(`[QuoteRequestService] No providers for request ${requestId}`);
    return result;
  }

  const { generateQuoteRequestEmail } = await import('@/lib/insurance/quote-email-template');
  const { sendEmail } = await import('@/lib/email-config');

  for (const rp of requestProviders) {
    const destinatario = rp.provider.contactoEmail || rp.provider.email;

    if (!destinatario) {
      result.failed++;
      result.errors.push(`Provider ${rp.provider.nombre} (${rp.providerId}) has no email`);
      continue;
    }

    try {
      const html = generateQuoteRequestEmail({
        request,
        company: request.company,
        provider: rp.provider,
        building: request.building,
      });

      const emailResult = await sendEmail({
        to: destinatario,
        subject: `Solicitud de cotización ${request.codigo} - ${request.company.nombre}`,
        html,
      });

      if (emailResult.success) {
        await prisma.insuranceQuoteRequestProvider.update({
          where: { id: rp.id },
          data: {
            emailEnviado: true,
            fechaEnvioEmail: new Date(),
            emailDestinatario: destinatario,
          },
        });
        result.sent++;
      } else {
        result.failed++;
        result.errors.push(`Failed to send to ${destinatario}: ${emailResult.error}`);
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`[QuoteRequestService] Error sending email to ${destinatario}:`, error);
      result.failed++;
      result.errors.push(`Error sending to ${destinatario}: ${msg}`);
    }
  }

  if (result.sent > 0) {
    await prisma.insuranceQuoteRequest.update({
      where: { id: requestId },
      data: {
        estado: 'enviada',
        fechaEnvio: new Date(),
      },
    });
  }

  return result;
}

/**
 * Retrieves a full quote request including company, building, providers and quotations.
 */
export async function getQuoteRequestWithDetails(requestId: string) {
  const prisma = await getPrisma();

  return prisma.insuranceQuoteRequest.findUnique({
    where: { id: requestId },
    include: {
      company: true,
      building: true,
      proveedores: {
        include: { provider: true },
      },
      quotations: {
        include: { provider: true },
      },
    },
  });
}

/**
 * Helper to update the status of a quote request.
 */
export async function updateQuoteRequestStatus(requestId: string, status: string) {
  const prisma = await getPrisma();

  return prisma.insuranceQuoteRequest.update({
    where: { id: requestId },
    data: { estado: status as any },
  });
}
