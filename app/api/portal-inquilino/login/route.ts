import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const JWT_SECRET = process.env.NEXTAUTH_SECRET;

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    const jwtSecret = JWT_SECRET;
    if (!jwtSecret) {
      logger.error('NEXTAUTH_SECRET no configurado');
      return NextResponse.json(
        { error: 'Configuración del servidor inválida' },
        { status: 500 }
      );
    }

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email y contraseña son requeridos' },
        { status: 400 }
      );
    }

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
      { error: 'Error al iniciar sesión' },
      { status: 500 }
    );
  }
}
