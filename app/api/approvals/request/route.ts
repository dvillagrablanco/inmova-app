import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/permissions';
import {
  type ApprovalType,
  createApprovalRequest,
  requestExpenseApproval,
  requestMaintenanceApproval,
} from '@/lib/enhanced-approval-service';
import logger from '@/lib/logger';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const approvalRequestSchema = z.object({
  type: z.string().min(1),
  entityId: z.string().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  amount: z.union([z.string(), z.number()]).optional().transform((v) => (typeof v === 'string' ? parseFloat(v) : v)),
  entityType: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

/**
 * POST /api/approvals/request
 * Crea una solicitud de aprobación
 */
export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const parsed = approvalRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const { type, entityId, title, description, amount, entityType, metadata } = parsed.data;

    let approval;

    // Crear solicitud según el tipo
    switch (type) {
      case 'gasto':
        if (!entityId) {
          return NextResponse.json(
            { error: 'Se requiere entityId para gastos' },
            { status: 400 }
          );
        }
        approval = await requestExpenseApproval(user.companyId as string, entityId, user.id);
        break;

      case 'mantenimiento':
        if (!entityId) {
          return NextResponse.json(
            { error: 'Se requiere entityId para mantenimiento' },
            { status: 400 }
          );
        }
        approval = await requestMaintenanceApproval(
          user.companyId as string,
          entityId,
          user.id
        );
        break;

      default:
        // Crear solicitud genérica
        if (!title || !description) {
          return NextResponse.json(
            { error: 'Se requieren title y description' },
            { status: 400 }
          );
        }
        approval = await createApprovalRequest({
          companyId: user.companyId as string,
          type: type as ApprovalType,
          title,
          description,
          amount: amount ?? undefined,
          requestedBy: user.id,
          entityId,
          entityType,
          metadata,
        });
        break;
    }

    return NextResponse.json(approval);
  } catch (error: any) {
    if (error?.name === 'AuthError' || error?.statusCode === 401 || error?.statusCode === 403) { return NextResponse.json({ error: error.message }, { status: error.statusCode || 401 }); }
    logger.error('Error creando solicitud de aprobación:', error);
    return NextResponse.json(
      { error: error.message || 'Error creando solicitud de aprobación' },
      { status: 500 }
    );
  }
}
