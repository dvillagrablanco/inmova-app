import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import {
  createContractRenewal,
  CreateRenewalParams,
} from '@/lib/services/renewal-service-simple';

export const dynamic = 'force-dynamic';

/**
 * @swagger
 * /api/renewals/create:
 *   post:
 *     summary: Crear propuesta de renovación
 *     tags: [Renovaciones]
 */

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await req.json();
    const params: CreateRenewalParams = {
      contractId: body.contractId,
      aplicarIPC: body.aplicarIPC !== false,
      incrementoManual: body.incrementoManual,
      duracionMeses: body.duracionMeses || 12,
    };

    const renewal = await createContractRenewal(params);

    return NextResponse.json(renewal, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Error al crear renovación' },
      { status: 500 }
    );
  }
}
