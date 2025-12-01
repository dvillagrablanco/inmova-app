/**
 * API para sistema de notificaciones de facturación B2B
 * Envía recordatorios de pago, facturas vencidas, etc.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { 
  sendPaymentReminders, 
  markOverdueInvoices 
} from '@/lib/b2b-billing-service';
import { sendEmail } from '@/lib/email-config';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * POST: Ejecutar acciones de notificación
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    // Solo super-admins pueden ejecutar notificaciones
    if (user?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Permiso denegado' }, { status: 403 });
    }

    const body = await request.json();
    const { action, invoiceId, customMessage } = body;

    switch (action) {
      case 'mark-overdue':
        // Marcar facturas vencidas
        const overdueCount = await markOverdueInvoices();
        return NextResponse.json({ 
          success: true, 
          count: overdueCount,
          message: `${overdueCount} facturas marcadas como vencidas` 
        });

      case 'send-reminders':
        // Enviar recordatorios automáticos
        const reminders = await sendPaymentReminders();
        const sentCount = reminders.filter(r => r.sent).length;
        return NextResponse.json({ 
          success: true, 
          sent: sentCount,
          failed: reminders.length - sentCount,
          details: reminders,
        });

      case 'send-single-reminder':
        // Enviar recordatorio manual para una factura específica
        if (!invoiceId) {
          return NextResponse.json(
            { error: 'Invoice ID requerido' },
            { status: 400 }
          );
        }
        const result = await sendInvoiceReminder(invoiceId, customMessage);
        return NextResponse.json(result);

      case 'send-monthly-summary':
        // Enviar resumen mensual a todas las empresas
        const summaryResults = await sendMonthlySummaries();
        return NextResponse.json(summaryResults);

      default:
        return NextResponse.json(
          { error: 'Acción no válida' },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error('Error en notificaciones:', error);
    return NextResponse.json(
      { error: 'Error al procesar notificaciones', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * Enviar recordatorio de pago para una factura específica
 */
async function sendInvoiceReminder(invoiceId: string, customMessage?: string) {
  const invoice = await prisma.b2BInvoice.findUnique({
    where: { id: invoiceId },
    include: {
      company: true,
      subscriptionPlan: true,
    }
  });

  if (!invoice) {
    throw new Error('Factura no encontrada');
  }

  if (!invoice.company.email) {
    throw new Error('La empresa no tiene email configurado');
  }

  // Preparar email
  const emailSubject = `Recordatorio: Factura ${invoice.numeroFactura} pendiente de pago`;
  
  const emailBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Recordatorio de Factura Pendiente</h2>
      
      <p>Estimado/a equipo de <strong>${invoice.company.nombre}</strong>,</p>
      
      <p>Le recordamos que tiene una factura pendiente de pago:</p>
      
      <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <table style="width: 100%;">
          <tr>
            <td><strong>Número de Factura:</strong></td>
            <td>${invoice.numeroFactura}</td>
          </tr>
          <tr>
            <td><strong>Período:</strong></td>
            <td>${invoice.periodo}</td>
          </tr>
          <tr>
            <td><strong>Fecha de emisión:</strong></td>
            <td>${format(new Date(invoice.fechaEmision), 'dd/MM/yyyy', { locale: es })}</td>
          </tr>
          <tr>
            <td><strong>Fecha de vencimiento:</strong></td>
            <td style="color: #d32f2f; font-weight: bold;">
              ${format(new Date(invoice.fechaVencimiento), 'dd/MM/yyyy', { locale: es })}
            </td>
          </tr>
          <tr>
            <td><strong>Importe total:</strong></td>
            <td style="font-size: 18px; font-weight: bold;">€${invoice.total.toFixed(2)}</td>
          </tr>
        </table>
      </div>
      
      ${customMessage ? `<p><em>${customMessage}</em></p>` : ''}
      
      <p>Para realizar el pago, por favor acceda a su panel de facturación en INMOVA.</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.NEXTAUTH_URL}/facturacion" 
           style="background-color: #1976d2; color: white; padding: 12px 30px; 
                  text-decoration: none; border-radius: 6px; display: inline-block;">
          Ver Factura y Pagar
        </a>
      </div>
      
      <p style="color: #666; font-size: 14px; margin-top: 30px;">
        Si ya ha realizado el pago, puede ignorar este mensaje.
      </p>
      
      <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
      
      <p style="color: #999; font-size: 12px;">
        Este es un correo automático del sistema de facturación de INMOVA.<br>
        Para cualquier consulta, contáctenos a través de nuestros canales de soporte.
      </p>
    </div>
  `;

  // Enviar email
  try {
    await sendEmail({
      to: invoice.company.email,
      subject: emailSubject,
      html: emailBody,
    });

    // Actualizar contador de recordatorios
    await prisma.b2BInvoice.update({
      where: { id: invoice.id },
      data: {
        recordatoriosEnviados: invoice.recordatoriosEnviados + 1,
        ultimoRecordatorio: new Date(),
      }
    });

    return {
      success: true,
      message: `Recordatorio enviado a ${invoice.company.email}`,
    };
  } catch (error: any) {
    console.error('Error al enviar email:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Enviar resúmenes mensuales a todas las empresas
 */
async function sendMonthlySummaries() {
  const companies = await prisma.company.findMany({
    where: {
      activo: true,
      email: { not: null },
    },
    include: {
      subscriptionPlan: true,
    }
  });

  const results = {
    sent: [] as string[],
    failed: [] as string[],
  };

  for (const company of companies) {
    try {
      // Obtener facturas del mes actual
      const currentMonth = format(new Date(), 'yyyy-MM');
      const invoices = await prisma.b2BInvoice.findMany({
        where: {
          companyId: company.id,
          periodo: currentMonth,
        }
      });

      if (invoices.length === 0) {
        continue; // No hay facturas este mes
      }

      const totalFacturado = invoices.reduce((sum, inv) => sum + inv.total, 0);
      const facturasPagadas = invoices.filter(inv => inv.estado === 'PAGADA').length;
      const facturasPendientes = invoices.filter(inv => inv.estado === 'PENDIENTE').length;

      const emailSubject = `Resumen mensual de facturación - ${format(new Date(), 'MMMM yyyy', { locale: es })}`;
      
      const emailBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Resumen Mensual de Facturación</h2>
          
          <p>Estimado/a equipo de <strong>${company.nombre}</strong>,</p>
          
          <p>A continuación, su resumen de facturación para ${format(new Date(), 'MMMM yyyy', { locale: es })}:</p>
          
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Facturas del Mes</h3>
            <ul style="list-style: none; padding: 0;">
              <li style="padding: 8px 0; border-bottom: 1px solid #ddd;">
                <strong>Total facturado:</strong> €${totalFacturado.toFixed(2)}
              </li>
              <li style="padding: 8px 0; border-bottom: 1px solid #ddd;">
                <strong>Facturas pagadas:</strong> ${facturasPagadas}
              </li>
              <li style="padding: 8px 0;">
                <strong>Facturas pendientes:</strong> ${facturasPendientes}
              </li>
            </ul>
          </div>
          
          ${company.subscriptionPlan ? `
            <div style="background-color: #e3f2fd; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h4 style="margin-top: 0;">Plan Actual</h4>
              <p><strong>${company.subscriptionPlan.nombre}</strong> - €${company.subscriptionPlan.precioMensual}/mes</p>
            </div>
          ` : ''}
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXTAUTH_URL}/facturacion" 
               style="background-color: #1976d2; color: white; padding: 12px 30px; 
                      text-decoration: none; border-radius: 6px; display: inline-block;">
              Ver Todas las Facturas
            </a>
          </div>
          
          <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
          
          <p style="color: #999; font-size: 12px;">
            Gracias por confiar en INMOVA para la gestión de sus propiedades.
          </p>
        </div>
      `;

      await sendEmail({
        to: company.email!,
        subject: emailSubject,
        html: emailBody,
      });

      results.sent.push(company.nombre);
    } catch (error: any) {
      console.error(`Error enviando resumen a ${company.nombre}:`, error);
      results.failed.push(company.nombre);
    }
  }

  return results;
}
