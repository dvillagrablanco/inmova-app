/**
 * API Routes: Admin - Companies
 * 
 * GET /api/v1/admin/companies - Lista companies
 * Solo accesible por SUPERADMIN.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getAllCompanies } from '@/lib/admin-service';

import logger from '@/lib/logger';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Solo SUPERADMIN
    if (session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || undefined;
    const status = searchParams.get('status') as any;
    const sortBy = searchParams.get('sortBy') as any;
    const sortOrder = searchParams.get('sortOrder') as any;

    const result = await getAllCompanies({
      page,
      limit,
      search,
      status,
      sortBy,
      sortOrder,
    });

    return NextResponse.json(result);

  } catch (error: any) {
    logger.error('Error fetching companies:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
