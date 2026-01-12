/**
 * API para descargar factura B2B en PDF
 * Compatible con ContaSimple
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { generateB2BInvoicePDFBuffer } from '@/lib/b2b-invoice-pdf';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    // Obtener la factura con todos los datos necesarios
    const invoice = await prisma.b2BInvoice.findUnique({
      where: { id: params.id },
      include: {
        company: true,
        subscriptionPlan: true,
      }
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Factura no encontrada' }, { status: 404 });
    }

    // Verificar permisos: solo super_admin o empresa propietaria
    if (user?.role !== 'super_admin' && invoice.companyId !== user?.companyId) {
      return NextResponse.json({ error: 'Permiso denegado' }, { status: 403 });
    }

    // Obtener datos del emisor (INMOVA o empresa configurada)
    const emisor = {
      nombre: process.env.COMPANY_NAME || 'INMOVA',
      cif: process.env.COMPANY_CIF || null,
      direccion: process.env.COMPANY_ADDRESS || null,
      email: process.env.COMPANY_EMAIL || null,
      telefono: process.env.COMPANY_PHONE || null,
    };

    // Preparar datos para el PDF
    const invoiceData = {
      numeroFactura: invoice.numeroFactura,
      fechaEmision: invoice.fechaEmision,
      fechaVencimiento: invoice.fechaVencimiento,
      periodo: invoice.periodo,
      emisor,
      cliente: {
        nombre: invoice.company.nombre,
        cif: invoice.company.cif || null,
        direccion: invoice.company.direccion || null,
        email: invoice.company.email || null,
        telefono: invoice.company.telefono || null,
      },
      conceptos: (invoice.conceptos as any[]).map((concepto: any) => ({
        descripcion: concepto.descripcion || 'Servicio',
        cantidad: concepto.cantidad || 1,
        precioUnitario: concepto.precioUnitario || 0,
        iva: concepto.iva || 21,
        total: concepto.total || 0,
      })),
      subtotal: invoice.subtotal,
      totalIva: invoice.impuestos,
      total: invoice.total,
      notas: invoice.notas || undefined,
      terminosPago: invoice.terminosPago || 'Pago a 30 días desde la fecha de emisión',
    };

    // Generar PDF
    const pdfBuffer = generateB2BInvoicePDFBuffer(invoiceData);

    // Nombre del archivo
    const fileName = `Factura_${invoice.numeroFactura.replace(/\//g, '-')}_${invoice.company.nombre.replace(/\s+/g, '_')}.pdf`;

    // Retornar el PDF
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (error: any) {
    logger.error('Error generando PDF de factura B2B:', error);
    return NextResponse.json(
      { error: 'Error al generar PDF', details: error.message },
      { status: 500 }
    );
  }
}
