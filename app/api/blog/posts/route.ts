import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  return NextResponse.json({
    data: [],
    message: 'Blog module not yet configured. No posts available.',
  });
}
