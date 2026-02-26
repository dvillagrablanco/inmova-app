import { NextRequest } from 'next/server';
import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { withAuthRateLimit } from '@/lib/rate-limiting';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs'; // CRÍTICO: NextAuth + Prisma requiere Node.js runtime

const handler = NextAuth(authOptions);

export { handler as GET };

export async function POST(req: NextRequest, context: { params: { nextauth: string[] } }) {
  return withAuthRateLimit(req, () => handler(req as any, context as any));
}
