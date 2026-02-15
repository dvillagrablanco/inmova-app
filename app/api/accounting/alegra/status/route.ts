import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/api-auth-guard';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export async function GET() {
  // Auth guard
  const auth = await requireSession();
  if (!auth.authenticated) return auth.response;
  return NextResponse.json({ configured: false, enabled: false });
  // Auth guard
  const auth = await requireSession();
  if (!auth.authenticated) return auth.response;
}
