/**
 * SERVICIO DE FACTURACIÓN A INQUILINOS
 * 
 * Sistema completo de facturación que:
 * - Genera facturas con IVA/IRPF según configuración
 * - Numeración automática por serie
 * - Genera PDF profesional
 * - Envía factura por email
 * - Soporte para retenciones IRPF (arrendamientos a empresas)
 * 
 * Normativa aplicable (España):
 * - IVA: 21% estándar (exento en alquiler de vivienda habitual)
 * - IRPF: 19% retención si arrendatario es empresa/profesional
 * 
 * @module TenantInvoiceService
 */

import { prisma } from './db';
import { sendEmail } from './email-config';
import { uploadFile } from './s3';
import logger from './logger';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import PDFDocument from 'pdfkit';

// ============================================================================
// TIPOS
// ============================================================================

export interface TenantInvoice {
  id: string;
  invoiceNumber: string;
  series: string;
  paymentId: string;
  contractId: string;
  tenantId: string;
  companyId: string;
  
  // Datos fiscales
  issuerName: string;
  issuerTaxId: string;
  issuerAddress: string;
  recipientName: string;
  recipientTaxId?: string;
  recipientAddress?: string;
  
  // Conceptos
  concept: string;
  description?: string;
  period: string;
  
  // Importes
  baseAmount: number;
  vatRate: number;
  vatAmount: number;
  irpfRate: number;
  irpfAmount: number;
  totalAmount: number;
  
  // Fechas
  issueDate: Date;
  dueDate?: Date;
  paymentDate?: Date;
  
  // Estado
  status: 'draft' | 'issued' | 'paid' | 'cancelled';
  pdfUrl?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface InvoiceConfig {
  applyVat: boolean;
  vatRate: number;
  applyIrpf: boolean;
  irpfRate: number;
  series: string;
  includeIban?: boolean;
}

export interface CreateInvoiceParams {
  paymentId: string;
  config?: Partial<InvoiceConfig>;
  sendEmail?: boolean;
}

// ============================================================================
// CONFIGURACIÓN POR DEFECTO
// ============================================================================

const DEFAULT_CONFIG: InvoiceConfig = {
  applyVat: false, // Alquiler de vivienda habitual está exento
  vatRate: 21,
  applyIrpf: false, // Solo si arrendatario es empresa
  irpfRate: 19,
  series: 'ALQ',
  includeIban: true,
};

// ============================================================================
// SERVICIO PRINCIPAL
// ============================================================================

/**
 * Genera una factura para un pago de alquiler
 */
export async function createTenantInvoice(
  params: CreateInvoiceParams
): Promise<{ success: boolean; invoice?: any; error?: string }> {
  try {
    // 1. Obtener datos del pago
    const payment = await prisma.payment.findUnique({
      where: { id: params.paymentId },
      include: {
        contract: {
          include: {
            tenant: true,
            unit: {
              include: {
                building: {
                  include: { company: true },
                },
              },
            },
          },
        },
        tenantInvoice: true,
      },
    });

    if (!payment) {
      return { success: false, error: 'Pago no encontrado' };
    }

    // Verificar que no tenga ya factura
    if (payment.tenantInvoice) {
      return { success: false, error: 'El pago ya tiene factura asociada' };
    }

    const { contract, contract: { tenant, unit } } = payment;
    const building = unit.building;
    const company = building.company;

    // 2. Determinar configuración de factura
    const config: InvoiceConfig = {
      ...DEFAULT_CONFIG,
      ...params.config,
    };

    // Si el inquilino tiene CIF (empresa), aplicar retención IRPF
    if (tenant.esEmpresa || (tenant.dni && tenant.dni.startsWith('B'))) {
      config.applyIrpf = true;
    }

    // Si es alquiler de local comercial, aplicar IVA
    if (unit.tipoUso === 'comercial' || unit.tipoUso === 'oficina') {
      config.applyVat = true;
    }

    // 3. Generar número de factura
    const invoiceNumber = await generateInvoiceNumber(company.id, config.series);

    // 4. Calcular importes
    const baseAmount = Number(payment.monto);
    const vatAmount = config.applyVat ? baseAmount * (config.vatRate / 100) : 0;
    const irpfAmount = config.applyIrpf ? baseAmount * (config.irpfRate / 100) : 0;
    const totalAmount = baseAmount + vatAmount - irpfAmount;

    // 5. Crear factura en BD
    const invoice = await prisma.tenantInvoice.create({
      data: {
        invoiceNumber,
        series: config.series,
        paymentId: payment.id,
        contractId: contract.id,
        tenantId: tenant.id,
        companyId: company.id,

        // Datos fiscales del emisor
        issuerName: company.nombre,
        issuerTaxId: company.cif || '',
        issuerAddress: company.direccion || '',
        
        // Datos del destinatario
        recipientName: tenant.nombreCompleto,
        recipientTaxId: tenant.dni || undefined,
        recipientAddress: tenant.direccion || undefined,

        // Concepto
        concept: `Alquiler ${building.nombre} - ${unit.numero}`,
        description: payment.periodo,
        period: payment.periodo,

        // Importes
        baseAmount,
        vatRate: config.applyVat ? config.vatRate : 0,
        vatAmount,
        irpfRate: config.applyIrpf ? config.irpfRate : 0,
        irpfAmount,
        totalAmount,

        // Fechas
        issueDate: new Date(),
        dueDate: payment.fechaVencimiento,
        paymentDate: payment.fechaPago,

        // Estado
        status: payment.estado === 'pagado' ? 'paid' : 'issued',
      },
    });

    // 6. Generar PDF
    const pdfBuffer = await generateInvoicePDF(invoice, company, tenant, config);

    // 7. Subir PDF a S3
    const fileName = `facturas/inquilinos/${invoice.invoiceNumber.replace(/\//g, '-')}.pdf`;
    const pdfUrl = await uploadFile(pdfBuffer, fileName, 'application/pdf');

    // 8. Actualizar factura con URL del PDF
    await prisma.tenantInvoice.update({
      where: { id: invoice.id },
      data: { pdfUrl },
    });

    // 9. Actualizar pago con referencia a factura
    await prisma.payment.update({
      where: { id: payment.id },
      data: { tenantInvoiceId: invoice.id },
    });

    // 10. Enviar email si está configurado
    if (params.sendEmail !== false && tenant.email) {
      await sendInvoiceEmail(invoice, tenant, pdfBuffer);
    }

    logger.info(`✅ Factura ${invoiceNumber} generada para pago ${payment.id}`);

    return {
      success: true,
      invoice: { ...invoice, pdfUrl },
    };
  } catch (error: any) {
    logger.error('Error generando factura de inquilino:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Genera número de factura secuencial
 */
async function generateInvoiceNumber(companyId: string, series: string): Promise<string> {
  const year = new Date().getFullYear();
  
  // Buscar última factura de la serie
  const lastInvoice = await prisma.tenantInvoice.findFirst({
    where: {
      companyId,
      series,
      invoiceNumber: { startsWith: `${series}-${year}` },
    },
    orderBy: { invoiceNumber: 'desc' },
  });

  let sequenceNumber = 1;
  
  if (lastInvoice) {
    const parts = lastInvoice.invoiceNumber.split('-');
    const lastNumber = parseInt(parts[parts.length - 1], 10);
    sequenceNumber = lastNumber + 1;
  }

  return `${series}-${year}-${String(sequenceNumber).padStart(5, '0')}`;
}

/**
 * Genera el PDF de la factura
 */
async function generateInvoicePDF(
  invoice: any,
  company: any,
  tenant: any,
  config: InvoiceConfig
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      doc.fontSize(20).text('FACTURA', { align: 'center' });
      doc.fontSize(12).text(invoice.invoiceNumber, { align: 'center' });
      doc.moveDown();

      // Datos del emisor
      doc.fontSize(10).text('DATOS DEL EMISOR', { underline: true });
      doc.text(invoice.issuerName);
      doc.text(`CIF/NIF: ${invoice.issuerTaxId}`);
      doc.text(invoice.issuerAddress);
      doc.text(`Email: ${company.email || '-'}`);
      doc.text(`Teléfono: ${company.telefono || '-'}`);
      doc.moveDown();

      // Datos del destinatario
      doc.text('DATOS DEL DESTINATARIO', { underline: true });
      doc.text(invoice.recipientName);
      if (invoice.recipientTaxId) {
        doc.text(`NIF/CIF: ${invoice.recipientTaxId}`);
      }
      if (invoice.recipientAddress) {
        doc.text(invoice.recipientAddress);
      }
      doc.moveDown();

      // Fechas
      doc.text(`Fecha de emisión: ${format(invoice.issueDate, 'dd/MM/yyyy')}`);
      if (invoice.dueDate) {
        doc.text(`Fecha de vencimiento: ${format(invoice.dueDate, 'dd/MM/yyyy')}`);
      }
      doc.moveDown(2);

      // Tabla de conceptos
      doc.fontSize(10).text('CONCEPTO', { continued: true, width: 300 });
      doc.text('IMPORTE', { align: 'right' });
      doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
      doc.moveDown(0.5);

      doc.text(invoice.concept, { continued: true, width: 300 });
      doc.text(`${invoice.baseAmount.toFixed(2)} €`, { align: 'right' });
      doc.fontSize(9).fillColor('#666').text(invoice.description || invoice.period);
      doc.fillColor('#000');
      doc.moveDown();

      // Línea separadora
      doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
      doc.moveDown();

      // Desglose
      const rightCol = 450;
      
      doc.text('Base imponible:', 300, doc.y);
      doc.text(`${invoice.baseAmount.toFixed(2)} €`, rightCol, doc.y, { align: 'right', width: 95 });
      doc.moveDown(0.5);

      if (invoice.vatRate > 0) {
        doc.text(`IVA (${invoice.vatRate}%):`, 300, doc.y);
        doc.text(`${invoice.vatAmount.toFixed(2)} €`, rightCol, doc.y, { align: 'right', width: 95 });
        doc.moveDown(0.5);
      }

      if (invoice.irpfRate > 0) {
        doc.text(`Retención IRPF (${invoice.irpfRate}%):`, 300, doc.y);
        doc.text(`-${invoice.irpfAmount.toFixed(2)} €`, rightCol, doc.y, { align: 'right', width: 95 });
        doc.moveDown(0.5);
      }

      doc.moveDown(0.5);
      doc.fontSize(12).font('Helvetica-Bold');
      doc.text('TOTAL:', 300, doc.y);
      doc.text(`${invoice.totalAmount.toFixed(2)} €`, rightCol, doc.y, { align: 'right', width: 95 });
      doc.font('Helvetica');
      doc.moveDown(2);

      // Datos bancarios (si aplica)
      if (config.includeIban && company.iban) {
        doc.fontSize(10).text('DATOS PARA EL PAGO', { underline: true });
        doc.text(`IBAN: ${company.iban}`);
        doc.text(`Titular: ${company.nombre}`);
        doc.text(`Concepto: ${invoice.invoiceNumber}`);
        doc.moveDown();
      }

      // Notas legales
      doc.fontSize(8).fillColor('#666');
      
      if (!invoice.vatRate || invoice.vatRate === 0) {
        doc.text('* Operación exenta de IVA según el artículo 20.Uno.23º de la Ley 37/1992 (arrendamiento de vivienda).');
      }
      
      if (invoice.irpfRate > 0) {
        doc.text('* Retención practicada según el artículo 100 del Reglamento del IRPF.');
      }

      doc.moveDown(2);
      doc.text('Esta factura ha sido generada electrónicamente y es válida sin firma.', { align: 'center' });
      doc.text(`Generada por INMOVA - ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, { align: 'center' });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Envía la factura por email
 */
async function sendInvoiceEmail(
  invoice: any,
  tenant: any,
  pdfBuffer: Buffer
): Promise<void> {
  try {
    await sendEmail({
      to: tenant.email,
      subject: `📄 Factura ${invoice.invoiceNumber} - ${invoice.period}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1e40af;">Factura de alquiler</h2>
          
          <p>Hola <strong>${tenant.nombreCompleto}</strong>,</p>
          
          <p>Adjuntamos la factura correspondiente a tu alquiler:</p>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <table style="width: 100%;">
              <tr>
                <td style="color: #6b7280;">Nº Factura:</td>
                <td style="font-weight: bold;">${invoice.invoiceNumber}</td>
              </tr>
              <tr>
                <td style="color: #6b7280;">Concepto:</td>
                <td>${invoice.concept}</td>
              </tr>
              <tr>
                <td style="color: #6b7280;">Período:</td>
                <td>${invoice.period}</td>
              </tr>
              <tr>
                <td style="color: #6b7280;">Base imponible:</td>
                <td>${invoice.baseAmount.toFixed(2)} €</td>
              </tr>
              ${invoice.vatAmount > 0 ? `
              <tr>
                <td style="color: #6b7280;">IVA (${invoice.vatRate}%):</td>
                <td>${invoice.vatAmount.toFixed(2)} €</td>
              </tr>
              ` : ''}
              ${invoice.irpfAmount > 0 ? `
              <tr>
                <td style="color: #6b7280;">Retención IRPF:</td>
                <td>-${invoice.irpfAmount.toFixed(2)} €</td>
              </tr>
              ` : ''}
              <tr>
                <td style="color: #6b7280; font-weight: bold;">Total:</td>
                <td style="font-weight: bold; font-size: 1.2em; color: #1e40af;">
                  ${invoice.totalAmount.toFixed(2)} €
                </td>
              </tr>
            </table>
          </div>
          
          <p>Encontrarás la factura adjunta en formato PDF.</p>
          
          <p style="color: #6b7280; font-size: 0.9em;">
            Si tienes alguna duda sobre esta factura, contacta con nosotros.
          </p>
        </div>
      `,
      attachments: [
        {
          filename: `Factura_${invoice.invoiceNumber.replace(/\//g, '-')}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    });

    logger.info(`📧 Factura ${invoice.invoiceNumber} enviada a ${tenant.email}`);
  } catch (error) {
    logger.error('Error enviando factura por email:', error);
  }
}

/**
 * Genera facturas para todos los pagos de un contrato
 */
export async function generateInvoicesForContract(
  contractId: string,
  config?: Partial<InvoiceConfig>
): Promise<{ generated: number; errors: string[] }> {
  const payments = await prisma.payment.findMany({
    where: {
      contractId,
      estado: 'pagado',
      tenantInvoiceId: null,
    },
  });

  let generated = 0;
  const errors: string[] = [];

  for (const payment of payments) {
    const result = await createTenantInvoice({
      paymentId: payment.id,
      config,
      sendEmail: false, // No enviar email en batch
    });

    if (result.success) {
      generated++;
    } else {
      errors.push(`Pago ${payment.id}: ${result.error}`);
    }
  }

  return { generated, errors };
}

/**
 * Obtiene las facturas de un inquilino
 */
export async function getTenantInvoices(tenantId: string): Promise<any[]> {
  return prisma.tenantInvoice.findMany({
    where: { tenantId },
    orderBy: { issueDate: 'desc' },
    include: {
      payment: {
        select: { periodo: true, fechaPago: true },
      },
    },
  });
}

/**
 * Cancela una factura
 */
export async function cancelInvoice(
  invoiceId: string,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const invoice = await prisma.tenantInvoice.findUnique({
      where: { id: invoiceId },
    });

    if (!invoice) {
      return { success: false, error: 'Factura no encontrada' };
    }

    if (invoice.status === 'cancelled') {
      return { success: false, error: 'La factura ya está cancelada' };
    }

    await prisma.tenantInvoice.update({
      where: { id: invoiceId },
      data: {
        status: 'cancelled',
        cancelledAt: new Date(),
        cancellationReason: reason,
      },
    });

    // Desvinvular del pago
    await prisma.payment.updateMany({
      where: { tenantInvoiceId: invoiceId },
      data: { tenantInvoiceId: null },
    });

    logger.info(`❌ Factura ${invoice.invoiceNumber} cancelada: ${reason}`);

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Obtiene estadísticas de facturación
 */
export async function getInvoiceStats(companyId: string): Promise<{
  totalInvoiced: number;
  totalPaid: number;
  pendingAmount: number;
  invoiceCount: number;
  vatCollected: number;
  irpfRetained: number;
}> {
  const invoices = await prisma.tenantInvoice.findMany({
    where: {
      companyId,
      status: { not: 'cancelled' },
    },
    select: {
      baseAmount: true,
      vatAmount: true,
      irpfAmount: true,
      totalAmount: true,
      status: true,
    },
  });

  return {
    invoiceCount: invoices.length,
    totalInvoiced: invoices.reduce((sum, i) => sum + Number(i.totalAmount), 0),
    totalPaid: invoices
      .filter(i => i.status === 'paid')
      .reduce((sum, i) => sum + Number(i.totalAmount), 0),
    pendingAmount: invoices
      .filter(i => i.status === 'issued')
      .reduce((sum, i) => sum + Number(i.totalAmount), 0),
    vatCollected: invoices.reduce((sum, i) => sum + Number(i.vatAmount), 0),
    irpfRetained: invoices.reduce((sum, i) => sum + Number(i.irpfAmount), 0),
  };
}
