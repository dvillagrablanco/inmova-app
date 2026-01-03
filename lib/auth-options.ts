/// <reference path="../types/next-auth.d.ts" />
import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import bcrypt from 'bcryptjs';

// Lazy load de Prisma para evitar problemas en build
function getPrismaClient() {
  if (process.env.SKIP_PRISMA === 'true' || process.env.SKIP_API_ANALYSIS === '1') {
    return null;
  }
  try {
    const { prisma } = require('./db');
    return prisma;
  } catch (error) {
    console.error('[NextAuth] Failed to load Prisma:', error);
    return null;
  }
}

// Crear adapter solo si Prisma está disponible
function getAdapter() {
  const prisma = getPrismaClient();
  if (!prisma) {
    return undefined;
  }
  try {
    return PrismaAdapter(prisma);
  } catch (error) {
    console.error('[NextAuth] Failed to create Prisma adapter:', error);
    return undefined;
  }
}

export const authOptions: NextAuthOptions = {
  adapter: getAdapter() as any,
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        console.log('[NextAuth] authorize() llamado', { 
          email: credentials?.email,
          hasPassword: !!credentials?.password 
        });
        
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
            console.log('[NextAuth] Credenciales vacías');
            await addConstantDelay();
            throw new Error('Credenciales inválidas');
          }

          // Intentar autenticar como usuario normal
          const prisma = getPrismaClient();
          if (!prisma) {
            throw new Error('Database not available');
          }

          // Intentar con include primero, si falla obtener sin company
          let user;
          try {
            user = await prisma.user.findUnique({
              where: { email: credentials.email },
              include: { company: true },
            });
          } catch (error) {
            console.log('[NextAuth] Error con include company, reintentando sin include');
            // Fallback: obtener usuario sin company
            user = await prisma.user.findUnique({
              where: { email: credentials.email },
            });
          }

          console.log('[NextAuth] Usuario encontrado:', { 
            found: !!user,
            email: user?.email,
            activo: user?.activo,
            hasPassword: !!user?.password,
            hasCompany: !!user?.company
          });

          // Hash ficticio para mantener timing constante cuando usuario no existe
          const dummyHash = '$2a$10$abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ012';
          const passwordHash = user?.password || dummyHash;

          // Siempre ejecutar bcrypt.compare para mantener timing constante
          const isPasswordValid = await bcrypt.compare(credentials.password, passwordHash);

          console.log('[NextAuth] Password válido:', isPasswordValid);

          if (user) {
            // Usuario encontrado - validar credenciales y estado
            if (!user.password || !isPasswordValid) {
              console.log('[NextAuth] Password incorrecto');
              await addConstantDelay();
              throw new Error('Email o contraseña incorrectos');
            }

            if (!user.activo) {
              console.log('[NextAuth] Usuario inactivo');
              await addConstantDelay();
              throw new Error('Cuenta inactiva. Contacte al administrador.');
            }

            console.log('[NextAuth] Login exitoso para:', user.email);
            await addConstantDelay();
            return {
              id: user.id,
              email: user.email,
              name: user.name,
              role: user.role,
              companyId: user.companyId,
              companyName: user.company?.nombre || 'Sin Empresa',
              userType: 'user',
            };
          }

          // Si no es usuario, intentar autenticar como comercial
          const salesRep = await prisma!.salesRepresentative.findUnique({
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
          console.error('[NextAuth] Error en authorize():', error instanceof Error ? error.message : error);
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
    maxAge: 30 * 24 * 60 * 60, // 30 días
    updateAge: 24 * 60 * 60, // Actualizar solo cada 24 horas (reduce peticiones a /api/auth/session)
  },
  secret: process.env.NEXTAUTH_SECRET,
};
