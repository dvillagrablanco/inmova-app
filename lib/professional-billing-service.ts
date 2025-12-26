/**
 * PROFESSIONAL BILLING SERVICE
 * Sistema de facturación automática para proyectos profesionales
 */

import { prisma } from './db';
import { format, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import type { TimeEntry, TimesheetSummary } from './professional-timesheet-service';

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
export type PaymentTerms = 'immediate' | 'net_15' | 'net_30' | 'net_60';

export interface Invoice {
  id: string;
  invoiceNumber: string;
  companyId: string;
  projectId: string;
  clientId: string;
  clientName: string;
  clientAddress?: string;
  clientTaxId?: string;

  issueDate: Date;
  dueDate: Date;
  paymentTerms: PaymentTerms;

  lineItems: InvoiceLineItem[];

  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;

  status: InvoiceStatus;
  paidDate?: Date;
  paidAmount?: number;

  notes?: string;
  paymentInstructions?: string;

  createdAt: Date;
  updatedAt: Date;
}

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unit: string; // 'hour', 'day', 'unit', etc.
  unitPrice: number;
  amount: number;
  taxable: boolean;
}

/**
 * Genera factura automáticamente desde timesheet
 */
export async function generateInvoiceFromTimesheet(
  companyId: string,
  projectId: string,
  clientId: string,
  timesheet: TimesheetSummary,
  options: {
    paymentTerms?: PaymentTerms;
    taxRate?: number;
    groupByTask?: boolean;
    notes?: string;
  } = {}
): Promise<Invoice> {
  const project = await prisma.professionalProject.findUnique({
    where: { id: projectId },
  });

  if (!project) {
    throw new Error('Proyecto no encontrado');
  }

  // Generar número de factura
  const invoiceNumber = await generateInvoiceNumber(companyId);

  // Crear line items desde timesheet
  const lineItems: InvoiceLineItem[] = [];

  if (options.groupByTask) {
    // Agrupar por tarea
    const taskGroups = new Map<string, { hours: number; rate: number }>();

    timesheet.entries
      .filter((e) => e.billable)
      .forEach((entry) => {
        const task = entry.task || 'Servicios profesionales';
        const existing = taskGroups.get(task) || { hours: 0, rate: entry.hourlyRate || 0 };
        existing.hours += entry.duration / 60;
        taskGroups.set(task, existing);
      });

    taskGroups.forEach((data, task) => {
      lineItems.push({
        description: task,
        quantity: parseFloat(data.hours.toFixed(2)),
        unit: 'hora',
        unitPrice: data.rate,
        amount: data.hours * data.rate,
        taxable: true,
      });
    });
  } else {
    // Una sola línea con todas las horas
    const totalHours = timesheet.billableHours;
    const avgRate = timesheet.totalAmount / totalHours || 0;

    lineItems.push({
      description: `Servicios profesionales - ${timesheet.period}`,
      quantity: parseFloat(totalHours.toFixed(2)),
      unit: 'hora',
      unitPrice: avgRate,
      amount: timesheet.totalAmount,
      taxable: true,
    });
  }

  // Calcular totales
  const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
  const taxRate = options.taxRate || 21; // IVA 21% por defecto en España
  const taxAmount = subtotal * (taxRate / 100);
  const total = subtotal + taxAmount;

  // Calcular fecha de vencimiento
  const paymentTerms = options.paymentTerms || 'net_30';
  const daysToAdd = {
    immediate: 0,
    net_15: 15,
    net_30: 30,
    net_60: 60,
  }[paymentTerms];

  const issueDate = new Date();
  const dueDate = addDays(issueDate, daysToAdd);

  const invoice: Invoice = {
    id: `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    invoiceNumber,
    companyId,
    projectId,
    clientId,
    clientName: 'Cliente', // TODO: Agregar campo clientName al modelo ProfessionalProject
    clientAddress: undefined,
    clientTaxId: undefined,
    issueDate,
    dueDate,
    paymentTerms,
    lineItems,
    subtotal: parseFloat(subtotal.toFixed(2)),
    taxRate,
    taxAmount: parseFloat(taxAmount.toFixed(2)),
    total: parseFloat(total.toFixed(2)),
    status: 'draft',
    notes: options.notes,
    paymentInstructions: 'Por favor, realice el pago mediante transferencia bancaria.',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // Guardar en base de datos
  // await prisma.invoice.create({ data: invoice });

  return invoice;
}

/**
 * Genera número de factura secuencial
 */
async function generateInvoiceNumber(companyId: string): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `F${year}`;

  // En producción, consultarías la última factura
  const lastNumber = 1; // Placeholder
  const nextNumber = (lastNumber + 1).toString().padStart(4, '0');

  return `${prefix}-${nextNumber}`;
}

/**
 * Marca factura como enviada
 */
export async function sendInvoice(invoiceId: string): Promise<Invoice> {
  // Actualizar estado
  // await prisma.invoice.update({ where: { id: invoiceId }, data: { status: 'sent' } });

  // Enviar por email (integrar con servicio de email)

  return {} as Invoice; // Placeholder
}

/**
 * Registra pago de factura
 */
export async function recordPayment(
  invoiceId: string,
  amount: number,
  paymentDate?: Date
): Promise<Invoice> {
  // Actualizar factura
  const updateData = {
    status: 'paid' as InvoiceStatus,
    paidAmount: amount,
    paidDate: paymentDate || new Date(),
  };

  // await prisma.invoice.update({ where: { id: invoiceId }, data: updateData });

  return {} as Invoice; // Placeholder
}

/**
 * Genera PDF de factura
 */
export function generateInvoicePDF(invoice: Invoice): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Factura ${invoice.invoiceNumber}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; }
    .header { display: flex; justify-content: space-between; margin-bottom: 40px; }
    .invoice-title { font-size: 32px; font-weight: bold; }
    .invoice-number { font-size: 18px; color: #666; }
    .section { margin-bottom: 30px; }
    .section-title { font-size: 14px; font-weight: bold; margin-bottom: 10px; color: #333; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th { background: #f5f5f5; padding: 12px; text-align: left; border-bottom: 2px solid #ddd; }
    td { padding: 10px; border-bottom: 1px solid #eee; }
    .totals { text-align: right; margin-top: 20px; }
    .totals-row { display: flex; justify-content: flex-end; margin: 10px 0; }
    .totals-label { width: 150px; font-weight: bold; }
    .totals-value { width: 150px; text-align: right; }
    .total-row { font-size: 20px; font-weight: bold; color: #4F46E5; margin-top: 15px; padding-top: 15px; border-top: 2px solid #ddd; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="invoice-title">FACTURA</div>
      <div class="invoice-number">${invoice.invoiceNumber}</div>
    </div>
    <div style="text-align: right;">
      <div><strong>Fecha Emisión:</strong> ${format(invoice.issueDate, 'dd/MM/yyyy', { locale: es })}</div>
      <div><strong>Fecha Vencimiento:</strong> ${format(invoice.dueDate, 'dd/MM/yyyy', { locale: es })}</div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">CLIENTE</div>
    <div><strong>${invoice.clientName}</strong></div>
    ${invoice.clientAddress ? `<div>${invoice.clientAddress}</div>` : ''}
    ${invoice.clientTaxId ? `<div>NIF/CIF: ${invoice.clientTaxId}</div>` : ''}
  </div>

  <table>
    <thead>
      <tr>
        <th>Descripción</th>
        <th style="text-align: center;">Cantidad</th>
        <th style="text-align: right;">Precio Unit.</th>
        <th style="text-align: right;">Importe</th>
      </tr>
    </thead>
    <tbody>
      ${invoice.lineItems
        .map(
          (item) => `
        <tr>
          <td>${item.description}</td>
          <td style="text-align: center;">${item.quantity} ${item.unit}</td>
          <td style="text-align: right;">€${item.unitPrice.toFixed(2)}</td>
          <td style="text-align: right;">€${item.amount.toFixed(2)}</td>
        </tr>
      `
        )
        .join('')}
    </tbody>
  </table>

  <div class="totals">
    <div class="totals-row">
      <div class="totals-label">Subtotal:</div>
      <div class="totals-value">€${invoice.subtotal.toFixed(2)}</div>
    </div>
    <div class="totals-row">
      <div class="totals-label">IVA (${invoice.taxRate}%):</div>
      <div class="totals-value">€${invoice.taxAmount.toFixed(2)}</div>
    </div>
    <div class="totals-row total-row">
      <div class="totals-label">TOTAL:</div>
      <div class="totals-value">€${invoice.total.toFixed(2)}</div>
    </div>
  </div>

  ${
    invoice.notes
      ? `
    <div class="section" style="margin-top: 40px;">
      <div class="section-title">NOTAS</div>
      <div>${invoice.notes}</div>
    </div>
  `
      : ''
  }

  ${
    invoice.paymentInstructions
      ? `
    <div class="section" style="margin-top: 20px;">
      <div class="section-title">INSTRUCCIONES DE PAGO</div>
      <div>${invoice.paymentInstructions}</div>
    </div>
  `
      : ''
  }

  <div style="margin-top: 60px; text-align: center; color: #999; font-size: 12px;">
    Generado por INMOVA - Sistema de Gestión Inmobiliaria
  </div>
</body>
</html>
  `.trim();
}
