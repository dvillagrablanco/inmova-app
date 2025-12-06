/**
 * API para sincronizar hacia todos los canales
 * POST /api/str-advanced/channel-manager/sync-all
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { syncToChannels } from '@/lib/str-advanced-service';
import { addDays } from 'date-fns';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.companyId) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { listingId, daysAhead = 90 } = body;

    if (!listingId) {
      return NextResponse.json(
        { error: 'listingId es requerido' },
        { status: 400 }
      );
    }

    const startDate = new Date();
    const endDate = addDays(startDate, daysAhead);

    const result = await syncToChannels(listingId, startDate, endDate);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error sincronizando canales:', error);
    return NextResponse.json(
      { error: error.message || 'Error sincronizando canales' },
      { status: 500 }
    );
  }
}
