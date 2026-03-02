export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getFiltrosDisponibles } from '@/lib/finanzas/cuadro-mandos-service';

/**
 * GET /api/finanzas/cuadro-de-mandos/filtros
 *
 * Devuelve los filtros disponibles para el Cuadro de Mandos:
 * - Ejercicios disponibles
 * - Edificios con sus unidades
 * - Centros de coste
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const companyId = session.user.companyId;
    if (!companyId) {
      return NextResponse.json({ error: 'Sin empresa asignada' }, { status: 403 });
    }

    const filtros = await getFiltrosDisponibles(companyId);
    return NextResponse.json(filtros);
  } catch (error: unknown) {
    console.error('[API /finanzas/cuadro-de-mandos/filtros] Error:', error);
    return NextResponse.json({ error: 'Error al obtener filtros' }, { status: 500 });
  }
}
