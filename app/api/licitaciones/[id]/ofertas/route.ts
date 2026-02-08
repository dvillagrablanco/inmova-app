/**
 * API Endpoint: Ofertas de Licitación
 * 
 * GET /api/licitaciones/[id]/ofertas - Listar ofertas de una licitación
 * POST /api/licitaciones/[id]/ofertas - Crear oferta
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { z } from 'zod';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const createQuoteSchema = z.object({
  providerId: z.string(),
  descripcion: z.string().min(10),
  conceptos: z.array(z.object({
    descripcion: z.string(),
    cantidad: z.number().positive(),
    precioUnitario: z.number().positive(),
    total: z.number().positive(),
  })),
  subtotal: z.number().positive(),
  iva: z.number().default(21),
  total: z.number().positive(),
  tiempoEntrega: z.string().optional(),
  validezOferta: z.number().int().positive().default(30), // días
  notas: z.string().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const companyId = session.user.companyId;
    if (!companyId) {
      return NextResponse.json({ error: 'Company ID no encontrado' }, { status: 400 });
    }

    const { prisma } = await import('@/lib/db');

    // Verificar que la licitación existe y pertenece a la compañía
    const tender = await prisma.providerWorkOrder.findFirst({
      where: { id: params.id, companyId },
    });

    if (!tender) {
      return NextResponse.json({ error: 'Licitación no encontrada' }, { status: 404 });
    }

    // Obtener ofertas
    const quotes = await prisma.providerQuote.findMany({
      where: { workOrderId: params.id },
      include: {
        provider: {
          select: {
            id: true,
            nombre: true,
            email: true,
            telefono: true,
            rating: true,
          },
        },
      },
      orderBy: { total: 'asc' },
    });

    // Añadir puntuación a cada oferta
    const quotesWithScore = quotes.map((quote, index) => {
      // Puntuación básica basada en precio y rating del proveedor
      const precioScore = 100 - (index * 10); // Mejor precio = más puntos
      const ratingScore = (quote.provider.rating || 3) * 10;
      const totalScore = (precioScore * 0.7) + (ratingScore * 0.3);

      return {
        ...quote,
        puntuacion: Math.round(totalScore),
        ranking: index + 1,
      };
    });

    return NextResponse.json({
      success: true,
      data: quotesWithScore,
      tenderId: params.id,
      tenderTitulo: tender.titulo,
    });
  } catch (error: unknown) {
    logger.error('Error fetching tender quotes:', error);
    return NextResponse.json({ error: 'Error al obtener ofertas' }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const companyId = session.user.companyId;
    if (!companyId) {
      return NextResponse.json({ error: 'Company ID no encontrado' }, { status: 400 });
    }

    const body: unknown = await req.json();
    const validationResult = createQuoteSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json({
        error: 'Datos inválidos',
        details: validationResult.error.errors,
      }, { status: 400 });
    }

    const data = validationResult.data;
    const { prisma } = await import('@/lib/db');

    // Verificar que la licitación existe
    const tender = await prisma.providerWorkOrder.findFirst({
      where: { id: params.id, companyId },
    });

    if (!tender) {
      return NextResponse.json({ error: 'Licitación no encontrada' }, { status: 404 });
    }

    // Verificar que la licitación está abierta
    if (tender.estado !== 'pendiente') {
      return NextResponse.json({ 
        error: 'La licitación ya no acepta ofertas' 
      }, { status: 400 });
    }

    // Verificar que no hay oferta duplicada del mismo proveedor
    const existingQuote = await prisma.providerQuote.findFirst({
      where: {
        workOrderId: params.id,
        providerId: data.providerId,
      },
    });

    if (existingQuote) {
      return NextResponse.json({
        error: 'Este proveedor ya ha enviado una oferta',
      }, { status: 409 });
    }

    // Calcular monto IVA
    const montoIva = (data.subtotal * data.iva) / 100;

    // Crear la oferta
    const quote = await prisma.providerQuote.create({
      data: {
        companyId,
        providerId: data.providerId,
        workOrderId: params.id,
        titulo: `Oferta para: ${tender.titulo}`,
        descripcion: data.descripcion,
        conceptos: data.conceptos,
        subtotal: data.subtotal,
        iva: data.iva,
        montoIva,
        total: data.total,
        validezDias: data.validezOferta,
        notas: data.notas,
        estado: 'pendiente',
      },
      include: {
        provider: {
          select: { id: true, nombre: true },
        },
      },
    });

    logger.info('Quote submitted', { quoteId: quote.id, tenderId: params.id });

    return NextResponse.json({
      success: true,
      data: quote,
      message: 'Oferta enviada correctamente',
    }, { status: 201 });
  } catch (error: unknown) {
    logger.error('Error submitting quote:', error);
    return NextResponse.json({ error: 'Error al enviar oferta' }, { status: 500 });
  }
}
