import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import logger from '@/lib/logger';
import { withAuthRateLimit } from '@/lib/rate-limiting';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Lazy Prisma (auditoria V2)
async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

const loginSchema = z.object({
  email: z.string().email('Email invalido').max(255),
  password: z.string().min(1, 'Password requerido').max(128),
});

const JWT_SECRET = process.env.NEXTAUTH_SECRET;

export async function POST(request: NextRequest) {
  return withAuthRateLimit(request, async () => {
    return handleLogin(request);
  });
}

async function handleLogin(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Datos invalidos', details: parsed.error.errors }, { status: 400 });
    }
    const { email, password } = parsed.data;

    const jwtSecret = JWT_SECRET;
    if (!jwtSecret) {
      logger.error('NEXTAUTH_SECRET no configurado');
      return NextResponse.json(
        { error: 'Configuracion del servidor invalida' },
        { status: 500 }
      );
    }

    const db = await getPrisma();

    // Buscar inquilino por email
    const tenant = await db.tenant.findUnique({
      where: { email },
    });

    if (!tenant || !tenant.password) {
      return NextResponse.json(
        { error: 'Credenciales inválidas' },
        { status: 401 }
      );
    }

    // Verificar contraseña
    const isValid = await bcrypt.compare(password, tenant.password);

    if (!isValid) {
      return NextResponse.json(
        { error: 'Credenciales inválidas' },
        { status: 401 }
      );
    }

    // Generar token JWT
    const token = jwt.sign(
      {
        tenantId: tenant.id,
        email: tenant.email,
        nombre: tenant.nombreCompleto,
      },
      jwtSecret,
      { expiresIn: '7d' }
    );

    return NextResponse.json({
      token,
      tenant: {
        id: tenant.id,
        email: tenant.email,
        nombreCompleto: tenant.nombreCompleto,
      },
    });
  } catch (error) {
    logger.error('Error en login de inquilino:', error);
    return NextResponse.json(
      { error: 'Error al iniciar sesion' },
      { status: 500 }
    );
  }
} // handleLogin
