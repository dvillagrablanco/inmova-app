/// <reference path="../types/next-auth.d.ts" />
import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import bcrypt from 'bcryptjs';

import logger from '@/lib/logger';
// Lazy load de Prisma para evitar problemas en build
function getPrismaClient() {
  if (process.env.SKIP_PRISMA === 'true' || process.env.SKIP_API_ANALYSIS === '1') {
    return null;
  }
  try {
    const { prisma } = require('./db');
    return prisma;
  } catch (error) {
    logger.error('[NextAuth] Failed to load Prisma:', error);
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
    logger.error('[NextAuth] Failed to create Prisma adapter:', error);
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
          const prisma = getPrismaClient();
          if (!prisma) {
            throw new Error('Database not available');
          }

          // Obtener usuario sin include para evitar errores con relaciones
          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
            select: {
              id: true,
              email: true,
              name: true,
              password: true,
              role: true,
              activo: true,
              companyId: true,
            },
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
            
            // Obtener nombre de la empresa si existe
            let companyName = 'Sin Empresa';
            if (user.companyId) {
              try {
                const company = await prisma.company.findUnique({
                  where: { id: user.companyId },
                  select: { nombre: true },
                });
                if (company) {
                  companyName = company.nombre;
                }
              } catch (error) {
                logger.warn('[NextAuth] No se pudo obtener nombre de empresa');
              }
            }
            
            await addConstantDelay();
            return {
              id: user.id,
              email: user.email,
              name: user.name,
              role: user.role,
              companyId: user.companyId,
              companyName,
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
          logger.error('[NextAuth] Error en authorize():', error instanceof Error ? error.message : error);
          await addConstantDelay();
          throw error;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.companyId = (user as any).companyId;
        token.companyName = (user as any).companyName;
        token.userType = (user as any).userType;
        token.companyRefreshedAt = Date.now();
      }

      // Refrescar companyId desde la BD periódicamente (cada 60 segundos)
      // para que switch-company surta efecto sin re-login
      const REFRESH_INTERVAL_MS = 60 * 1000; // 60 segundos
      const lastRefresh = (token.companyRefreshedAt as number) || 0;
      const needsRefresh = Date.now() - lastRefresh > REFRESH_INTERVAL_MS;

      if (needsRefresh && token.id && (token.userType === 'user' || !token.userType)) {
        try {
          const prisma = getPrismaClient();
          if (prisma) {
            const freshUser = await prisma.user.findUnique({
              where: { id: token.id as string },
              select: { companyId: true, role: true },
            });
            if (freshUser) {
              // Solo actualizar si cambió (evitar queries innecesarias de company)
              if (freshUser.companyId !== token.companyId) {
                token.companyId = freshUser.companyId;
                // Obtener nombre de la nueva empresa
                try {
                  const company = await prisma.company.findUnique({
                    where: { id: freshUser.companyId },
                    select: { nombre: true },
                  });
                  token.companyName = company?.nombre || 'Sin Empresa';
                } catch {
                  // No bloquear el flujo si falla obtener el nombre
                }
              }
              // Sincronizar también el role por si cambió
              token.role = freshUser.role;
            }
            token.companyRefreshedAt = Date.now();
          }
        } catch (error) {
          // No bloquear el flujo de autenticación por errores de refresh
          logger.warn('[NextAuth] Error refreshing user data in JWT:', error instanceof Error ? error.message : error);
        }
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
