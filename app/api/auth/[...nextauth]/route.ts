import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs'; // CRÍTICO: NextAuth + Prisma requiere Node.js runtime

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };