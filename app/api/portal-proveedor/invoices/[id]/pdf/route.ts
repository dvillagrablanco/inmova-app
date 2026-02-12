import { NextRequest, NextResponse } from 'next/server';
import { requireProviderAuth } from '@/lib/provider-auth';
import { generateInvoicePDF } from '@/lib/invoice-pdf';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Lazy Prisma (auditoria V2)
async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

// GET /api/portal-proveedor/invoices/[id]/pdf - Generar PDF de factura
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const prisma = await getPrisma();
  try {
    const auth = await requireProviderAuth(req);
    if (!auth.authenticated || !auth.provider) {
      return NextResponse.json(
        { error: auth.error || 'No autenticado' },
        { status: auth.status || 401 }
      );
    }

    const invoice = await prisma.providerInvoice.findUnique({
      where: { id: params.id },
      include: {
        provider: {
          select: {
            nombre: true,
            email: true,
            telefono: true,
            direccion: true,
          },
        },
        company: {
          select: {
            nombre: true,
            direccion: true,
            email: true,
            telefono: true,
          },
        },
      },
    });

    if (!invoice) {
      return NextResponse.json(
        { error: 'Factura no encontrada' },
        { status: 404 }
      );
    }

    if (invoice.providerId !== auth.provider.id) {
      return NextResponse.json(
        { error: 'No tienes permiso para ver esta factura' },
        { status: 403 }
      );
    }

    // Generar PDF
    const pdf = generateInvoicePDF({
      numeroFactura: invoice.numeroFactura,
      fechaEmision: invoice.fechaEmision,
      fechaVencimiento: invoice.fechaVencimiento,
      proveedor: invoice.provider,
      company: invoice.company,
      conceptos: invoice.conceptos as any,
      subtotal: invoice.subtotal,
      iva: invoice.iva,
      montoIva: invoice.montoIva,
      total: invoice.total,
      notas: invoice.notas || undefined,
    });

    const pdfBuffer = Buffer.from(pdf.output('arraybuffer'));

    logger.info(
      `PDF generado para factura ${invoice.numeroFactura}`
    );

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Factura_${invoice.numeroFactura}.pdf"`,
      },
    });
  } catch (error) {
    logger.error('Error al generar PDF de factura:', error);
    return NextResponse.json(
      { error: 'Error al generar PDF' },
      { status: 500 }
    );
  }
}
