/**
 * API para sincronización iCal
 * POST /api/str-advanced/channel-manager/sync-ical
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { syncICalFeed } from '@/lib/str-advanced-service';

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
    const { channelSyncId, iCalUrl } = body;

    if (!channelSyncId || !iCalUrl) {
      return NextResponse.json(
        { error: 'channelSyncId y iCalUrl son requeridos' },
        { status: 400 }
      );
    }

    const result = await syncICalFeed(channelSyncId, iCalUrl);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error sincronizando iCal:', error);
    return NextResponse.json(
      { error: error.message || 'Error sincronizando calendario' },
      { status: 500 }
    );
  }
}
