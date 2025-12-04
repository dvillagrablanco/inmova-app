import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prisma } from './db';
import bcrypt from 'bcryptjs';

/**
 * Opciones de autenticación para el Portal del Inquilino
 */
export const authTenantOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      id: 'tenant-credentials',
      name: 'Portal Inquilino',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Credenciales inválidas');
        }

        // Buscar el inquilino por email
        const tenant = await prisma.tenant.findUnique({
          where: { email: credentials.email },
          include: { company: true },
        });

        if (!tenant) {
          throw new Error('Inquilino no encontrado');
        }

        // Verificar que tenga contraseña configurada
        if (!tenant.password) {
          throw new Error('Debe completar el registro primero usando el código de invitación');
        }

        // Validar la contraseña
        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          tenant.password
        );

        if (!isPasswordValid) {
          throw new Error('Contraseña incorrecta');
        }

        return {
          id: tenant.id,
          email: tenant.email,
          name: tenant.nombreCompleto,
          type: 'tenant',
          companyId: tenant.companyId,
          companyName: tenant.company.nombre,
          dni: tenant.dni,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.type = (user as any).type;
        token.companyId = (user as any).companyId;
        token.companyName = (user as any).companyName;
        token.dni = (user as any).dni;
      }
      return token;
    },
    async session({ session, token }) {
      if (session?.user) {
        (session.user as any).id = token.id;
        (session.user as any).type = token.type;
        (session.user as any).companyId = token.companyId;
        (session.user as any).companyName = token.companyName;
        (session.user as any).dni = token.dni;
      }
      return session;
    },
  },
  pages: {
    signIn: '/portal-inquilino/login',
    error: '/portal-inquilino/login',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
};
