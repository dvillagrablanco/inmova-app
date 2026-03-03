/**
 * GET /api/family-office/import
 *
 * Returns available import types and their status.
 * Auth required (admin only).
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { isAdmin } from '@/lib/admin-roles';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const IMPORT_TYPES = [
  {
    id: 'journal',
    name: 'Diario Contable',
    description: 'Excel de Vidaro/Rovida/Viroda',
    endpoint: '/api/family-office/import/journal',
    method: 'POST',
    accepts: '.xlsx',
  },
  {
    id: 'analytics-mapping',
    name: 'Mapeo Analítica',
    description: 'Subcuentas → Centros de Coste',
    endpoint: '/api/family-office/import/analytics-mapping',
    method: 'POST',
    accepts: '.xlsx',
  },
  {
    id: 'swift-mt940',
    name: 'SWIFT MT940',
    description: 'Extracto bancario (Inversis, Banca March)',
    endpoint: '/api/family-office/import/swift',
    method: 'POST',
    accepts: '.txt,.sta,.mt940',
  },
  {
    id: 'swift-mt535',
    name: 'SWIFT MT535',
    description: 'Posiciones custodia (CACEIS, Banca March)',
    endpoint: '/api/family-office/import/swift',
    method: 'POST',
    accepts: '.txt,.mt535',
  },
  {
    id: 'pictet-pdf',
    name: 'Pictet PDF',
    description: 'Extracto inversiones Pictet (EUR/USD)',
    endpoint: '/api/family-office/import/pictet-pdf',
    method: 'POST',
    accepts: '.pdf',
  },
];

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  if (!isAdmin(session.user.role)) {
    return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
  }

  return NextResponse.json({
    importTypes: IMPORT_TYPES,
  });
}
