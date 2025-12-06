/**
 * API para validar licencia turística
 * GET /api/str-advanced/legal/validate-license?listingId=xxx
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { validateTouristLicense } from '@/lib/str-advanced-service';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.companyId) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const listingId = searchParams.get('listingId');

    if (!listingId) {
      return NextResponse.json(
        { error: 'listingId es requerido' },
        { status: 400 }
      );
    }

    const validation = await validateTouristLicense(listingId);

    return NextResponse.json(validation);
  } catch (error: any) {
    console.error('Error validando licencia:', error);
    return NextResponse.json(
      { error: error.message || 'Error validando licencia' },
      { status: 500 }
    );
  }
}
