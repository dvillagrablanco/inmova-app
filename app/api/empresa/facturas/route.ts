/**
 * API: Facturas de la Empresa
 * 
 * Obtiene el historial de facturas de Stripe para la empresa del usuario.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getCustomerInvoices } from '@/lib/stripe-module-addons';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Verificar permisos
    const userRole = (session.user as any)?.role;
    if (!['administrador', 'super_admin', 'propietario'].includes(userRole)) {
      return NextResponse.json(
        { error: 'No tienes permisos para ver facturas' },
        { status: 403 }
      );
    }

    // Obtener stripeCustomerId de la empresa
    // TODO: En producción, obtener de la base de datos
    // const { prisma } = await import('@/lib/db');
    // const company = await prisma.company.findUnique({
    //   where: { id: (session.user as any).companyId },
    //   select: { stripeCustomerId: true },
    // });
    
    const stripeCustomerId = (session.user as any).stripeCustomerId;
    
    if (!stripeCustomerId) {
      // No hay cliente de Stripe configurado aún
      return NextResponse.json({
        invoices: [],
        message: 'No hay facturas disponibles todavía',
      });
    }

    // Obtener facturas de Stripe
    const invoices = await getCustomerInvoices(stripeCustomerId);

    // Formatear facturas para el frontend
    const formattedInvoices = invoices.map((invoice) => ({
      id: invoice.id,
      number: invoice.number,
      date: invoice.created ? new Date(invoice.created * 1000).toISOString() : null,
      dueDate: invoice.due_date ? new Date(invoice.due_date * 1000).toISOString() : null,
      amount: invoice.total / 100, // Convertir de centavos
      amountPaid: invoice.amount_paid / 100,
      currency: invoice.currency.toUpperCase(),
      status: invoice.status,
      paid: invoice.paid,
      description: invoice.description,
      invoiceUrl: invoice.hosted_invoice_url,
      pdfUrl: invoice.invoice_pdf,
      lines: invoice.lines?.data?.map((line) => ({
        description: line.description,
        amount: line.amount / 100,
        quantity: line.quantity,
      })) || [],
    }));

    return NextResponse.json({
      invoices: formattedInvoices,
      total: formattedInvoices.length,
    });
  } catch (error: any) {
    console.error('[API Error] /api/empresa/facturas:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
