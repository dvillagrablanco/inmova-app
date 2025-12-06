/**
 * API para exportar calendario iCal
 * GET /api/str-advanced/channel-manager/export-ical?listingId=xxx
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { generateICalFeed } from '@/lib/str-advanced-service';

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

    const icalContent = await generateICalFeed(listingId);

    return new NextResponse(icalContent, {
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="inmova-${listingId}.ics"`
      }
    });
  } catch (error: any) {
    console.error('Error exportando iCal:', error);
    return NextResponse.json(
      { error: error.message || 'Error exportando calendario' },
      { status: 500 }
    );
  }
}
