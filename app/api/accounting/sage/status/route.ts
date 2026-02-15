import { requireSession } from '@/lib/api-auth-guard';
import { NextResponse } from 'next/server';
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
