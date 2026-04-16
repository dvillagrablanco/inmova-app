/**
 * Endpoint /api/public/init-admin DESACTIVADO PERMANENTEMENTE.
 *
 * Motivo (auditoría seguridad 2026-04-16):
 * - Creaba un superadmin con email y password hardcoded (admin@inmova.app / demo123).
 * - La "protección" era NODE_ENV !== 'production', insuficiente si el entorno
 *   apuntaba a la DB de producción.
 * - El secreto DEBUG_SECRET es propenso a fugarse en logs/CI.
 *
 * Para crear administradores:
 *   - usar `scripts/seed.ts` en local contra DB local, o
 *   - ejecutar un script one-off con `psql` directamente en la máquina de BD.
 */

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  return NextResponse.json({ error: 'Endpoint desactivado' }, { status: 410 });
}

export async function POST() {
  return NextResponse.json({ error: 'Endpoint desactivado' }, { status: 410 });
}
