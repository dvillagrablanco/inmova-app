/**
 * API: Registrar inquilino para domiciliación SEPA
 * 
 * @endpoint POST /api/sepa/enroll
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { enrollTenantForSepa, isSepaEnabled } from '@/lib/sepa-direct-debit-service';
import logger from '@/lib/logger';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const enrollSchema = z.object({
  tenantId: z.string().min(1),
  iban: z.string().min(15).max(34),
  accountHolderName: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    if (!isSepaEnabled()) {
      return NextResponse.json(
        { 
          error: 'Domiciliación SEPA no está habilitada',
          message: 'Configure GOCARDLESS_ACCESS_TOKEN y GOCARDLESS_ENABLED=true',
        },
        { status: 503 }
      );
    }

    const body = await req.json();
    const validated = enrollSchema.parse(body);

    const result = await enrollTenantForSepa(validated);

    if (result.success) {
      return NextResponse.json({
        success: true,
        data: {
          mandateId: result.mandateId,
          status: result.status,
        },
        message: result.message,
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.message },
        { status: 400 }
      );
    }
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }
    logger.error('Error en /api/sepa/enroll:', error);
    return NextResponse.json(
      { error: 'Error interno', message: error.message },
      { status: 500 }
    );
  }
}
