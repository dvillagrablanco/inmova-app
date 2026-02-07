import { NextRequest, NextResponse } from 'next/server';
import logger from '@/lib/logger';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const JWT_SECRET = process.env.NEXTAUTH_SECRET;
// POST /api/partners/login - Login de Partner
export async function POST(request: NextRequest) {
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
        { error: 'Email y contraseña requeridos' },
        { status: 400 }
      );
    }
    // Buscar Partner
    const partner = await prisma.partner.findUnique({
      where: { email },
    });
    if (!partner) {
      return NextResponse.json(
        { error: 'Credenciales inválidas' },
        { status: 401 }
      );
    }
    // Verificar contraseña
    const isValidPassword = await bcrypt.compare(password, partner.password);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Credenciales inválidas' },
        { status: 401 }
      );
    }
    // Verificar si está activo
    if (!partner.activo || partner.estado !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Partner no activo o pendiente de aprobación' },
        { status: 403 }
      );
    }
    // Generar JWT
    const token = jwt.sign(
      {
        partnerId: partner.id,
        email: partner.email,
        nombre: partner.nombre,
        tipo: partner.tipo,
      },
      jwtSecret,
      { expiresIn: '7d' }
    );
    // No devolver el password
    const { password: _, ...partnerWithoutPassword } = partner;
    return NextResponse.json({
      message: 'Login exitoso',
      token,
      partner: partnerWithoutPassword,
    });
  } catch (error: unknown) {
    logger.error('Error en login de Partner:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
