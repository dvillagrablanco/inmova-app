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

const analysisSchema = z.object({
  quotationId: z.string().optional(),
  quotationIds: z.array(z.string()).optional(),
  currentInsuranceId: z.string().optional(),
  action: z.enum(['analyze', 'compare', 'renewal']),
});

// POST - Analyze quotation(s) with AI
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const body = await request.json();
    const validated = analysisSchema.parse(body);

    const { analyzeQuotation, compareQuotationsWithAI, analyzeRenewalProposal } =
      await import('@/lib/insurance/quote-ai-analysis-service');

    const prisma = await getPrisma();

    switch (validated.action) {
      case 'analyze': {
        if (!validated.quotationId) {
          return NextResponse.json(
            { error: 'quotationId requerido para acción analyze' },
            { status: 400 }
          );
        }

        const quotation = await prisma.insuranceQuotation.findUnique({
          where: { id: validated.quotationId },
          select: { companyId: true },
        });

        if (!quotation || quotation.companyId !== session.user.companyId) {
          return NextResponse.json({ error: 'Cotización no encontrada' }, { status: 404 });
        }

        const result = await analyzeQuotation(validated.quotationId);
        return NextResponse.json({ success: true, action: 'analyze', result });
      }

      case 'compare': {
        if (!validated.quotationIds || validated.quotationIds.length < 2) {
          return NextResponse.json(
            { error: 'Se requieren al menos 2 quotationIds para comparar' },
            { status: 400 }
          );
        }

        const quotations = await prisma.insuranceQuotation.findMany({
          where: {
            id: { in: validated.quotationIds },
            companyId: session.user.companyId,
          },
          select: { id: true },
        });

        if (quotations.length < 2) {
          return NextResponse.json(
            { error: 'No se encontraron suficientes cotizaciones válidas' },
            { status: 404 }
          );
        }

        const result = await compareQuotationsWithAI(quotations.map((q) => q.id));
        return NextResponse.json({ success: true, action: 'compare', result });
      }

      case 'renewal': {
        if (!validated.currentInsuranceId || !validated.quotationId) {
          return NextResponse.json(
            { error: 'currentInsuranceId y quotationId requeridos para acción renewal' },
            { status: 400 }
          );
        }

        const [insurance, quotation] = await Promise.all([
          prisma.insurance.findUnique({
            where: { id: validated.currentInsuranceId },
            select: { companyId: true },
          }),
          prisma.insuranceQuotation.findUnique({
            where: { id: validated.quotationId },
            select: { companyId: true },
          }),
        ]);

        if (!insurance || insurance.companyId !== session.user.companyId) {
          return NextResponse.json({ error: 'Seguro actual no encontrado' }, { status: 404 });
        }
        if (!quotation || quotation.companyId !== session.user.companyId) {
          return NextResponse.json({ error: 'Cotización no encontrada' }, { status: 404 });
        }

        const result = await analyzeRenewalProposal(
          validated.currentInsuranceId,
          validated.quotationId
        );
        return NextResponse.json({ success: true, action: 'renewal', result });
      }

      default:
        return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
    }
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }
    logger.error('[Análisis IA POST]:', error);
    return NextResponse.json(
      { error: 'Error en análisis IA', details: process.env.NODE_ENV === "production" ? undefined : error?.message },
      { status: 500 }
    );
  }
}
