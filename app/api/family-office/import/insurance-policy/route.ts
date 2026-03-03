/**
 * POST /api/family-office/import/insurance-policy
 *
 * Accepts PDF upload, extracts structured insurance policy data via Claude.
 * Auth required (admin only).
 * Optional: save=true to persist to DB.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { isAdmin } from '@/lib/admin-roles';
import { parseInsurancePolicyPDF } from '@/lib/insurance-policy-parser';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 120;

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  if (!isAdmin(session.user.role)) {
    return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
  }

  const url = new URL(request.url);
  const saveToDb = url.searchParams.get('save') === 'true';

  let buffer: Buffer;
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    if (!file || file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'Se requiere un archivo PDF' },
        { status: 400 }
      );
    }
    const arrayBuffer = await file.arrayBuffer();
    buffer = Buffer.from(arrayBuffer);
  } catch (e) {
    logger.error('[InsurancePolicyImport] FormData error', {
      error: (e as Error).message,
    });
    return NextResponse.json(
      { error: 'Error procesando el archivo' },
      { status: 400 }
    );
  }

  try {
    const policyData = await parseInsurancePolicyPDF(buffer);

    if (saveToDb) {
      // TODO: Persist to DB when schema/table exists
      logger.info('[InsurancePolicyImport] save=true requested but not implemented yet', {
        policyNumber: policyData.policyNumber,
      });
    }

    return NextResponse.json({
      success: true,
      data: policyData,
      saved: false,
    });
  } catch (e) {
    logger.error('[InsurancePolicyImport] Parse error', {
      error: (e as Error).message,
    });
    return NextResponse.json(
      {
        error: 'Error extrayendo datos de la póliza',
        details: (e as Error).message,
      },
      { status: 500 }
    );
  }
}
