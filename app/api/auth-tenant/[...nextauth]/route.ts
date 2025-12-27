import NextAuth from 'next-auth';
import { authTenantOptions } from '@/lib/auth-tenant-options';

export const dynamic = 'force-dynamic';

const handler = NextAuth(authTenantOptions);

export { handler as GET, handler as POST };
