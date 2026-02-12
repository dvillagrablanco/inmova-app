/**
 * API temporal para crear usuario de prueba
 * DESACTIVADO EN PRODUCCION (auditoria V2 2026-02-11)
 * Usar scripts/seed.ts o scripts/fix-auth-complete.ts en su lugar.
 */

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST() {
  return NextResponse.json({ error: 'Endpoint desactivado' }, { status: 410 });
}

export async function GET() {
  return NextResponse.json({ error: 'Endpoint desactivado' }, { status: 410 });
}
