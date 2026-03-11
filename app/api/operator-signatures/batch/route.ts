// @ts-nocheck
/**
 * POST /api/operator-signatures/batch — Crear solicitudes en lote
 * PUT  /api/operator-signatures/batch — Aprobar lote completo
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { createBatchOperatorSignatures, approveBatch } from '@/lib/operator-signature-service';
import { z } from 'zod';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const batchCreateSchema = z.object({
  operatorName: z.string().min(1),
  requests: z
    .array(
      z.object({
        documentUrl: z.string(),
        documentName: z.string(),
        signatories: z
          .array(
            z.object({
              name: z.string(),
              email: z.string().email(),
              role: z.string(),
            })
          )
          .min(1),
        unitId: z.string().optional(),
        tenantName: z.string().optional(),
        tenantEmail: z.string().email().optional(),
        monthlyRent: z.number().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        receivedVia: z.string().optional(),
      })
    )
    .min(1),
});

const batchApproveSchema = z.object({
  batchId: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const companyId = (session.user as any).companyId;
    if (!companyId) {
      return NextResponse.json({ error: 'Sin empresa asignada' }, { status: 403 });
    }

    const body = batchCreateSchema.parse(await req.json());

    const result = await createBatchOperatorSignatures(
      companyId,
      body.operatorName,
      body.requests.map((r) => ({
        ...r,
        startDate: r.startDate ? new Date(r.startDate) : undefined,
        endDate: r.endDate ? new Date(r.endDate) : undefined,
      }))
    );

    return NextResponse.json({ success: true, ...result }, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }
    logger.error('[OperatorSignatures Batch Create]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const companyId = (session.user as any).companyId;
    const userId = (session.user as any).id;
    if (!companyId) {
      return NextResponse.json({ error: 'Sin empresa asignada' }, { status: 403 });
    }

    const body = batchApproveSchema.parse(await req.json());

    const result = await approveBatch(body.batchId, companyId, userId);

    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }
    logger.error('[OperatorSignatures Batch Approve]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
