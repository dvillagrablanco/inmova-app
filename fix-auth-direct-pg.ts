/**
 * Solución: Reemplazar auth-options.ts con conexión directa a PostgreSQL
 * Evita el problema de Prisma y se conecta directamente
 */

export const authOptionsContent = `
/// <reference path="../types/next-auth.d.ts" />
import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { Pool } from 'pg';

// Conexión directa a PostgreSQL sin Prisma
const pool = new Pool({
  host: 'inmova-postgres',
  port: 5432,
  database: 'inmova',
  user: 'inmova_user',
  password: 'inmova_secure_pass_2024',
  ssl: false,
});

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        console.log('🔐 [AUTH] Iniciando autorización...');
        
        if (!credentials?.email || !credentials?.password) {
          console.log('❌ [AUTH] Credenciales faltantes');
          throw new Error('Credenciales inválidas');
        }

        try {
          console.log('📧 [AUTH] Email:', credentials.email);
          
          // Consulta directa a PostgreSQL
          const result = await pool.query(
            'SELECT u.id, u.email, u.name, u.role, u.password, u.activo, u."companyId", c.nombre as "companyName" FROM users u LEFT JOIN company c ON u."companyId" = c.id WHERE u.email = $1',
            [credentials.email]
          );

          console.log('📊 [AUTH] Usuarios encontrados:', result.rows.length);

          if (result.rows.length === 0) {
            console.log('❌ [AUTH] Usuario no encontrado');
            throw new Error('Email o contraseña incorrectos');
          }

          const user = result.rows[0];
          console.log('👤 [AUTH] Usuario encontrado:', {
            email: user.email,
            role: user.role,
            activo: user.activo,
            hasPassword: !!user.password,
            companyId: user.companyId,
          });

          if (!user.password) {
            console.log('❌ [AUTH] Usuario sin contraseña');
            throw new Error('Email o contraseña incorrectos');
          }

          // Verificar contraseña
          console.log('🔑 [AUTH] Verificando contraseña...');
          const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
          console.log('🔑 [AUTH] Contraseña válida:', isPasswordValid);

          if (!isPasswordValid) {
            console.log('❌ [AUTH] Contraseña incorrecta');
            throw new Error('Email o contraseña incorrectos');
          }

          if (!user.activo) {
            console.log('❌ [AUTH] Usuario inactivo');
            throw new Error('Cuenta inactiva. Contacte al administrador.');
          }

          console.log('✅ [AUTH] Autenticación exitosa');

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            companyId: user.companyId,
            companyName: user.companyName || 'Sin empresa',
            userType: 'user',
          };
        } catch (error: any) {
          console.error('💥 [AUTH] Error:', error.message);
          throw error;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.role = (user as any).role;
        token.companyId = (user as any).companyId;
        token.companyName = (user as any).companyName;
        token.userType = (user as any).userType;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
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
    error: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET || 'inmova-secret-key-2024',
  debug: true,
};
`;

console.log('✅ Contenido de auth-options.ts generado');
