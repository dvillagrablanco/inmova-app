import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { z } from 'zod';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

const createSchema = z.object({
  requestId: z.string().optional().nullable(),
  providerId: z.string().min(1, 'Proveedor requerido'),
  codigo: z.string().optional().nullable(),
  tipoSeguro: z.string().min(1),
  primaAnual: z.number().positive(),
  primaMensual: z.number().positive().optional().nullable(),
  sumaAsegurada: z.number().positive(),
  franquicia: z.number().optional().nullable(),
  coberturas: z.array(z.string()).default([]),
  exclusiones: z.array(z.string()).default([]),
  condicionesEspeciales: z.string().optional().nullable(),
  validaHasta: z.string().optional().nullable(),
  documentoUrl: z.string().optional().nullable(),
  notas: z.string().optional().nullable(),
});

// GET - List all quotations for the company
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const prisma = await getPrisma();
    const { searchParams } = new URL(request.url);
    const requestId = searchParams.get('requestId');
    const providerId = searchParams.get('providerId');
    const estado = searchParams.get('estado');

    const quotations = await prisma.insuranceQuotation.findMany({
      where: {
        companyId: session.user.companyId,
        ...(requestId ? { requestId } : {}),
        ...(providerId ? { providerId } : {}),
        ...(estado ? { estado: estado as any } : {}),
      },
      include: {
        provider: {
          select: {
            id: true,
            nombre: true,
            logoUrl: true,
            email: true,
            telefono: true,
          },
        },
        request: {
          select: {
            id: true,
            codigo: true,
            tipoSeguro: true,
            descripcion: true,
            estado: true,
            buildingId: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(quotations);
  } catch (error) {
    logger.error('[Cotizaciones Recibidas GET]:', error);
    return NextResponse.json({ error: 'Error al obtener cotizaciones' }, { status: 500 });
  }
}

// POST - Create/register a new received quotation
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const prisma = await getPrisma();
    const body = await request.json();
    const validated = createSchema.parse(body);

    const quotation = await prisma.insuranceQuotation.create({
      data: {
        companyId: session.user.companyId,
        requestId: validated.requestId ?? undefined,
        providerId: validated.providerId,
        codigo: validated.codigo,
        tipoSeguro: validated.tipoSeguro as any,
        primaAnual: validated.primaAnual,
        primaMensual: validated.primaMensual,
        sumaAsegurada: validated.sumaAsegurada,
        franquicia: validated.franquicia,
        coberturas: validated.coberturas,
        exclusiones: validated.exclusiones,
        condicionesEspeciales: validated.condicionesEspeciales,
        validaHasta: validated.validaHasta ? new Date(validated.validaHasta) : undefined,
        documentoUrl: validated.documentoUrl,
        notas: validated.notas,
      },
      include: {
        provider: true,
        request: true,
      },
    });

    // If linked to a request, update the provider response tracking
    if (validated.requestId) {
      await prisma.insuranceQuoteRequestProvider.updateMany({
        where: {
          requestId: validated.requestId,
          providerId: validated.providerId,
        },
        data: {
          respondido: true,
          fechaRespuesta: new Date(),
        },
      });

      // Check if all providers for this request have responded
      const allProviders = await prisma.insuranceQuoteRequestProvider.findMany({
        where: { requestId: validated.requestId },
      });

      const allResponded = allProviders.length > 0 && allProviders.every((p) => p.respondido);

      await prisma.insuranceQuoteRequest.update({
        where: { id: validated.requestId },
        data: {
          estado: allResponded ? 'completada' : 'parcialmente_respondida',
        },
      });
    }

    return NextResponse.json(quotation, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }
    logger.error('[Cotizaciones Recibidas POST]:', error);
    return NextResponse.json({ error: 'Error al crear cotización' }, { status: 500 });
  }
}
