/// <reference path="../types/next-auth.d.ts" />
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
        // Delay constante para prevenir timing attacks (100-200ms)
        const CONSTANT_DELAY_MS = 150;
        const startTime = Date.now();

        // Helper para añadir delay constante al final
        const addConstantDelay = async () => {
          const elapsed = Date.now() - startTime;
          const remaining = Math.max(0, CONSTANT_DELAY_MS - elapsed);
          if (remaining > 0) {
            await new Promise((resolve) => setTimeout(resolve, remaining));
          }
        };

        try {
          if (!credentials?.email || !credentials?.password) {
            await addConstantDelay();
            throw new Error('Credenciales inválidas');
          }

          // Intentar autenticar como usuario normal
          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
            include: { company: true },
          });

          // Hash ficticio para mantener timing constante cuando usuario no existe
          const dummyHash = '$2a$10$abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ012';
          const passwordHash = user?.password || dummyHash;

          // Siempre ejecutar bcrypt.compare para mantener timing constante
          const isPasswordValid = await bcrypt.compare(credentials.password, passwordHash);

          if (user) {
            // Usuario encontrado - validar credenciales y estado
            if (!user.password || !isPasswordValid) {
              await addConstantDelay();
              throw new Error('Email o contraseña incorrectos');
            }

            if (!user.activo) {
              await addConstantDelay();
              throw new Error('Cuenta inactiva. Contacte al administrador.');
            }

            await addConstantDelay();
            return {
              id: user.id,
              email: user.email,
              name: user.name,
              role: user.role,
              companyId: user.companyId,
              companyName: user.company?.nombre ?? '',
              userType: 'user',
            };
          }

          // Si no es usuario, intentar autenticar como comercial
          const salesRep = await prisma.salesRepresentative.findUnique({
            where: { email: credentials.email },
          });

          const salesPasswordHash = salesRep?.password || dummyHash;
          const isSalesPasswordValid = await bcrypt.compare(
            credentials.password,
            salesPasswordHash
          );

          if (!salesRep || !isSalesPasswordValid) {
            await addConstantDelay();
            throw new Error('Email o contraseña incorrectos');
          }

          if (!salesRep.activo) {
            await addConstantDelay();
            throw new Error('Cuenta inactiva. Contacte al administrador.');
          }

          // Actualizar último acceso
          await prisma.salesRepresentative.update({
            where: { id: salesRep.id },
            data: { ultimoAcceso: new Date() },
          });

          await addConstantDelay();
          return {
            id: salesRep.id,
            email: salesRep.email,
            name: salesRep.nombreCompleto,
            role: 'sales_representative' as any,
            companyId: salesRep.companyId,
            companyName: 'INMOVA Partners',
            userType: 'sales_representative',
          };
        } catch (error) {
          // Asegurar delay constante incluso en errores
          await addConstantDelay();
          throw error;
        }
      },
    }),
    CredentialsProvider({
      id: 'tenant-credentials',
      name: 'Portal Inquilino',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        // Delay constante para prevenir timing attacks (100-200ms)
        const CONSTANT_DELAY_MS = 150;
        const startTime = Date.now();

        const addConstantDelay = async () => {
          const elapsed = Date.now() - startTime;
          const remaining = Math.max(0, CONSTANT_DELAY_MS - elapsed);
          if (remaining > 0) {
            await new Promise((resolve) => setTimeout(resolve, remaining));
          }
        };

        try {
          if (!credentials?.email || !credentials?.password) {
            await addConstantDelay();
            throw new Error('Credenciales inválidas');
          }

          const tenant = await prisma.tenant.findUnique({
            where: { email: credentials.email },
            include: { company: true },
          });

          // Hash ficticio para mantener timing constante cuando inquilino no existe
          const dummyHash = '$2a$10$abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ012';
          const passwordHash = tenant?.password || dummyHash;

          const isPasswordValid = await bcrypt.compare(credentials.password, passwordHash);

          if (!tenant || !tenant.password || !isPasswordValid) {
            await addConstantDelay();
            throw new Error('Email o contraseña incorrectos');
          }

          await addConstantDelay();
          return {
            id: tenant.id,
            email: tenant.email,
            name: tenant.nombreCompleto,
            role: 'tenant',
            companyId: tenant.companyId,
            companyName: tenant.company?.nombre ?? '',
            userType: 'tenant',
            dni: tenant.dni,
          };
        } catch (error) {
          await addConstantDelay();
          throw error;
        }
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
        token.dni = (user as any).dni;
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
        (session.user as any).dni = (token as any).dni;
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
