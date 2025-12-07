import { NextRequest, NextResponse } from 'next/server';
import logger from '@/lib/logger';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const dynamic = 'force-dynamic';
const prisma = new PrismaClient();
const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'your-secret-key-partners';
// POST /api/partners/login - Login de Partner
export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
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
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    // No devolver el password
    const { password: _, ...partnerWithoutPassword } = partner;
    return NextResponse.json({
      message: 'Login exitoso',
      token,
      partner: partnerWithoutPassword,
    });
  } catch (error: any) {
    logger.error('Error en login de Partner:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error?.message },
      { status: 500 }
    );
  }
}
