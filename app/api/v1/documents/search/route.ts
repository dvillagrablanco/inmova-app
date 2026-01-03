/**
 * API Route: Search Documents
 * 
 * GET /api/v1/documents/search
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { searchDocuments } from '@/lib/document-service';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query') || undefined;
    const entityType = searchParams.get('entityType') || undefined;
    const category = searchParams.get('category') || undefined;
    const tags = searchParams.get('tags')?.split(',') || undefined;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const results = await searchDocuments({
      companyId: session.user.companyId,
      query,
      entityType,
      category,
      tags,
      page,
      limit,
    });

    return NextResponse.json(results);
  } catch (error: any) {
    console.error('Error searching documents:', error);
    return NextResponse.json(
      { error: 'Error interno', message: error.message },
      { status: 500 }
    );
  }
}
