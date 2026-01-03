/**
 * API Route: Marketplace Services
 * 
 * GET /api/v1/marketplace/services?category=moving&city=Madrid
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getMarketplaceServices } from '@/lib/marketplace-service';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') as any;
    const city = searchParams.get('city') || undefined;
    const maxPrice = searchParams.get('maxPrice')
      ? parseInt(searchParams.get('maxPrice')!)
      : undefined;

    const services = await getMarketplaceServices({
      category,
      city,
      maxPrice,
    });

    return NextResponse.json({ services });
  } catch (error: any) {
    console.error('Error fetching marketplace services:', error);
    return NextResponse.json(
      { error: 'Error interno', message: error.message },
      { status: 500 }
    );
  }
}
