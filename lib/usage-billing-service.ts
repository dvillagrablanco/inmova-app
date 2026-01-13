/**
 * Usage Billing Service
 * 
 * Facturación automática de excesos mensuales
 * 
 * Features:
 * - Cálculo automático de excesos al fin de mes
 * - Creación de invoices en Stripe
 * - Cobro automático
 * - Notificación por email
 */

import { prisma } from './db';
import { getMonthlyUsage } from './usage-tracking-service';
import Stripe from 'stripe';
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';
import nodemailer from 'nodemailer';

// Lazy initialization to avoid build-time errors
let stripeInstance: Stripe | null = null;
function getStripe(): Stripe {
  if (!stripeInstance) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY not configured');
    }
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-11-20.acacia',
    });
  }
  return stripeInstance;
}

let transporterInstance: nodemailer.Transporter | null = null;
function getTransporter(): nodemailer.Transporter {
  if (!transporterInstance) {
    transporterInstance = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });
  }
  return transporterInstance;
}

// ═══════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════

interface OverageInvoice {
  companyId: string;
  period: Date;
  items: Array<{
    service: string;
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  totalAmount: number;
  stripeInvoiceId?: string;
}

// ═══════════════════════════════════════════════════════════════
// FACTURACIÓN MENSUAL (Ejecutar el día 1 de cada mes)
// ═══════════════════════════════════════════════════════════════

/**
 * Procesa la facturación de excesos para todas las empresas
 * Ejecutar el día 1 de cada mes
 */
export async function processMonthlyOverages(): Promise<{
  success: boolean;
  invoicesCreated: number;
  totalAmount: number;
  errors: Array<{ companyId: string; error: string }>;
}> {
  console.log('[Overage Billing] Starting monthly overage processing...');
  
  const lastMonth = subMonths(new Date(), 1);
  const period = startOfMonth(lastMonth);
  
  const companies = await prisma.company.findMany({
    where: {
      activo: true,
      subscriptionPlanId: { not: null },
      stripeCustomerId: { not: null }, // Solo empresas con Stripe
    },
    include: {
      subscriptionPlan: true,
    },
  });
  
  let invoicesCreated = 0;
  let totalAmount = 0;
  const errors: Array<{ companyId: string; error: string }> = [];
  
  for (const company of companies) {
    try {
      const invoice = await processCompanyOverage(company, period);
      
      if (invoice && invoice.totalAmount > 0) {
        await createStripeInvoice(company, invoice);
        await sendOverageInvoiceEmail(company, invoice);
        
        invoicesCreated++;
        totalAmount += invoice.totalAmount;
        
        console.log(`[Overage Billing] Invoice created for ${company.nombre}: €${invoice.totalAmount.toFixed(2)}`);
      }
    } catch (error: any) {
      console.error(`[Overage Billing] Error processing company ${company.id}:`, error);
      errors.push({
        companyId: company.id,
        error: error.message,
      });
    }
  }
  
  console.log(`[Overage Billing] Completed. ${invoicesCreated} invoices created, total: €${totalAmount.toFixed(2)}`);
  
  return {
    success: true,
    invoicesCreated,
    totalAmount,
    errors,
  };
}

/**
 * Procesa excesos de una empresa específica
 */
async function processCompanyOverage(
  company: any,
  period: Date
): Promise<OverageInvoice | null> {
  const usage = await getMonthlyUsage(company.id, period);
  
  if (!company.subscriptionPlan) {
    console.warn(`[Overage Billing] Company ${company.id} has no subscription plan`);
    return null;
  }
  
  const plan = company.subscriptionPlan;
  const items: OverageInvoice['items'] = [];
  
  // Calcular exceso de firmas
  if (usage.signaturesOverage > 0) {
    items.push({
      service: 'signatures',
      description: `Firmas digitales adicionales (${usage.signaturesOverage} × €${plan.extraSignaturePrice})`,
      quantity: usage.signaturesOverage,
      unitPrice: plan.extraSignaturePrice,
      total: usage.signaturesOverage * plan.extraSignaturePrice,
    });
  }
  
  // Calcular exceso de storage
  if (usage.storageOverageGB > 0) {
    items.push({
      service: 'storage',
      description: `Almacenamiento adicional (${usage.storageOverageGB.toFixed(2)} GB × €${plan.extraStorageGBPrice})`,
      quantity: usage.storageOverageGB,
      unitPrice: plan.extraStorageGBPrice,
      total: usage.storageOverageGB * plan.extraStorageGBPrice,
    });
  }
  
  // Calcular exceso de IA
  if (usage.aiTokensOverage > 0) {
    const tokensInThousands = usage.aiTokensOverage / 1000;
    items.push({
      service: 'aiTokens',
      description: `Tokens IA adicionales (${tokensInThousands.toFixed(1)}K × €${plan.extraAITokensPrice})`,
      quantity: tokensInThousands,
      unitPrice: plan.extraAITokensPrice,
      total: tokensInThousands * plan.extraAITokensPrice,
    });
  }
  
  // Calcular exceso de SMS
  if (usage.smsOverage > 0) {
    items.push({
      service: 'sms',
      description: `SMS adicionales (${usage.smsOverage} × €${plan.extraSMSPrice})`,
      quantity: usage.smsOverage,
      unitPrice: plan.extraSMSPrice,
      total: usage.smsOverage * plan.extraSMSPrice,
    });
  }
  
  const totalAmount = items.reduce((sum, item) => sum + item.total, 0);
  
  if (totalAmount === 0) {
    return null; // No hay excesos
  }
  
  return {
    companyId: company.id,
    period,
    items,
    totalAmount,
  };
}

/**
 * Crea invoice en Stripe y lo cobra automáticamente
 */
async function createStripeInvoice(
  company: any,
  invoice: OverageInvoice
): Promise<void> {
  if (!company.stripeCustomerId) {
    throw new Error('Company has no Stripe customer ID');
  }
  
  const stripe = getStripe();
  
  // Crear invoice items en Stripe
  for (const item of invoice.items) {
    await stripe.invoiceItems.create({
      customer: company.stripeCustomerId,
      amount: Math.round(item.total * 100), // Convertir a centavos
      currency: 'eur',
      description: item.description,
      metadata: {
        companyId: company.id,
        period: invoice.period.toISOString(),
        service: item.service,
      },
    });
  }
  
  // Crear invoice
  const stripeInvoice = await stripe.invoices.create({
    customer: company.stripeCustomerId,
    auto_advance: true, // Auto-finalizar y cobrar
    collection_method: 'charge_automatically',
    description: `Excesos de uso - ${format(invoice.period, 'MMMM yyyy')}`,
    metadata: {
      companyId: company.id,
      period: invoice.period.toISOString(),
      type: 'overage',
    },
  });
  
  // Finalizar invoice (esto lo cobra automáticamente)
  await stripe.invoices.finalizeInvoice(stripeInvoice.id);
  
  // Guardar referencia en BD
  await prisma.b2BInvoice.create({
    data: {
      companyId: company.id,
      stripeInvoiceId: stripeInvoice.id,
      subscriptionPlanId: company.subscriptionPlanId,
      monto: invoice.totalAmount,
      concepto: `Excesos de uso - ${format(invoice.period, 'MMMM yyyy')}`,
      estado: 'pendiente',
      fechaEmision: new Date(),
      fechaVencimiento: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 días
    },
  });
  
  invoice.stripeInvoiceId = stripeInvoice.id;
}

/**
 * Envía email con detalle del invoice de excesos
 */
async function sendOverageInvoiceEmail(
  company: any,
  invoice: OverageInvoice
): Promise<void> {
  const contactEmail = company.emailContacto || company.email;
  
  if (!contactEmail) {
    console.warn(`[Overage Billing] No contact email for company ${company.id}`);
    return;
  }
  
  const monthName = format(invoice.period, 'MMMM yyyy', { locale: require('date-fns/locale/es') });
  
  const itemsHTML = invoice.items
    .map(
      (item) => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${item.description}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity.toFixed(2)}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: right;">€${item.unitPrice.toFixed(2)}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: right;"><strong>€${item.total.toFixed(2)}</strong></td>
      </tr>
    `
    )
    .join('');
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
        .invoice-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .invoice-table th { background: #f3f4f6; padding: 10px; text-align: left; border-bottom: 2px solid #e5e7eb; }
        .total-row { background: #f9fafb; font-size: 18px; font-weight: bold; }
        .info-box { background: #eff6ff; border-left: 4px solid #2563eb; padding: 15px; margin: 20px 0; }
        .button { display: inline-block; background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📄 Factura de Excesos</h1>
        </div>
        <div class="content">
          <p>Hola ${company.nombre},</p>
          
          <p>Te enviamos el detalle de los excesos de uso del mes de <strong>${monthName}</strong>.</p>
          
          <div class="info-box">
            ℹ️ Has superado los límites de tu plan en algunas funcionalidades. A continuación el detalle de los cargos adicionales.
          </div>
          
          <table class="invoice-table">
            <thead>
              <tr>
                <th>Concepto</th>
                <th style="text-align: center;">Cantidad</th>
                <th style="text-align: right;">Precio Unit.</th>
                <th style="text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHTML}
              <tr class="total-row">
                <td colspan="3" style="padding: 15px; text-align: right;">TOTAL:</td>
                <td style="padding: 15px; text-align: right; color: #2563eb;">€${invoice.totalAmount.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
          
          <p><strong>Método de pago:</strong> El cargo se realizará automáticamente en el método de pago registrado.</p>
          
          <p><strong>¿Quieres evitar cargos adicionales?</strong></p>
          <p>Actualiza a un plan superior para obtener más límites incluidos y evitar excesos futuros.</p>
          
          <a href="${process.env.NEXTAUTH_URL}/dashboard/billing" class="button">
            Ver Planes Disponibles
          </a>
        </div>
        <div class="footer">
          <p>Si tienes dudas sobre esta factura, contacta con soporte@inmova.app</p>
          <p>© ${new Date().getFullYear()} Inmova - Plataforma PropTech</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  try {
    const transporter = getTransporter();
    await transporter.sendMail({
      from: process.env.SMTP_FROM || 'noreply@inmova.app',
      to: contactEmail,
      subject: `📄 Factura de Excesos - ${monthName}`,
      html,
    });
    
    console.log(`[Overage Billing] Invoice email sent to ${contactEmail}`);
  } catch (error) {
    console.error('[Overage Billing] Error sending email:', error);
  }
}

/**
 * API endpoint para ejecutar facturación manual (para testing)
 */
export async function runMonthlyBilling(): Promise<{
  success: boolean;
  invoicesCreated: number;
  totalAmount: number;
}> {
  try {
    const result = await processMonthlyOverages();
    return {
      success: result.success,
      invoicesCreated: result.invoicesCreated,
      totalAmount: result.totalAmount,
    };
  } catch (error) {
    console.error('[Overage Billing] Error running monthly billing:', error);
    return {
      success: false,
      invoicesCreated: 0,
      totalAmount: 0,
    };
  }
}
