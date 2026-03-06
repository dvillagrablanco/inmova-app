/**
 * API: Solicitudes de Firma de Operadores
 * GET  /api/operator-signatures — Listar solicitudes
 * POST /api/operator-signatures — Crear nueva solicitud
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { z } from 'zod';
import {
  createOperatorSignatureRequest,
  listOperatorSignatureRequests,
} from '@/lib/operator-signature-service';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const createSchema = z.object({
  operatorName: z.string().min(1),
  operatorEmail: z.string().email().optional(),
  operatorPhone: z.string().optional(),
  operatorRef: z.string().optional(),
  documentUrl: z.string().min(1),
  documentName: z.string().min(1),
  unitId: z.string().optional(),
  contractId: z.string().optional(),
  buildingId: z.string().optional(),
  tenantName: z.string().optional(),
  tenantEmail: z.string().email().optional(),
  tenantPhone: z.string().optional(),
  tenantDni: z.string().optional(),
  signatories: z.array(z.object({
    name: z.string(),
    email: z.string().email(),
    role: z.string(),
    phone: z.string().optional(),
  })).min(1),
  contractType: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  monthlyRent: z.number().optional(),
  receivedVia: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const companyId = (session.user as any).companyId;
    if (!companyId) {
      return NextResponse.json({ error: 'Sin empresa asignada' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const result = await listOperatorSignatureRequests({
      companyId,
      status: searchParams.get('status') || undefined,
      operatorName: searchParams.get('operator') || undefined,
      unitId: searchParams.get('unitId') || undefined,
      batchId: searchParams.get('batchId') || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
    });

    return NextResponse.json(result);
  } catch (error: any) {
    logger.error('[OperatorSignatures GET]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

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

    const body = createSchema.parse(await req.json());

    const result = await createOperatorSignatureRequest({
      companyId,
      ...body,
      startDate: body.startDate ? new Date(body.startDate) : undefined,
      endDate: body.endDate ? new Date(body.endDate) : undefined,
    });

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Datos inválidos', details: error.errors }, { status: 400 });
    }
    logger.error('[OperatorSignatures POST]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
