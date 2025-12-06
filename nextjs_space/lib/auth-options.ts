import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prisma } from './db';
import bcrypt from 'bcryptjs';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Credenciales inválidas');
        }

        // Intentar autenticar como usuario normal
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: { company: true },
        });

        if (user) {
          if (!user?.password) {
            throw new Error('Usuario no encontrado');
          }

          if (!user.activo) {
            throw new Error('Usuario inactivo. Contacte al administrador.');
          }

          const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

          if (!isPasswordValid) {
            throw new Error('Contraseña incorrecta');
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            companyId: user.companyId,
            companyName: user.company.nombre,
            userType: 'user',
          };
        }

        // Si no es usuario, intentar autenticar como comercial
        const salesRep = await prisma.salesRepresentative.findUnique({
          where: { email: credentials.email },
        });

        if (!salesRep) {
          throw new Error('Usuario no encontrado');
        }

        if (!salesRep.activo) {
          throw new Error('Comercial inactivo. Contacte al administrador.');
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, salesRep.password);

        if (!isPasswordValid) {
          throw new Error('Contraseña incorrecta');
        }

        // Actualizar último acceso
        await prisma.salesRepresentative.update({
          where: { id: salesRep.id },
          data: { ultimoAcceso: new Date() },
        });

        return {
          id: salesRep.id,
          email: salesRep.email,
          name: salesRep.nombreCompleto,
          role: 'sales_representative' as any,
          companyId: salesRep.companyId,
          companyName: 'INMOVA Partners',
          userType: 'sales_representative',
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.companyId = (user as any).companyId;
        token.companyName = (user as any).companyName;
        token.userType = (user as any).userType;
      }
      return token;
    },
    async session({ session, token }) {
      if (session?.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).companyId = token.companyId;
        (session.user as any).companyName = token.companyName;
        (session.user as any).userType = token.userType;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
};