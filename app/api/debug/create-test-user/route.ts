/**
 * API temporal para crear usuario de prueba
 * ELIMINAR EN PRODUCCIÓN
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';

import logger from '@/lib/logger';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Verificar que tenemos DATABASE_URL
if (!process.env.DATABASE_URL) {
  throw new Error('[DEBUG] DATABASE_URL no configurada');
}

export async function POST(request: Request) {
  // 🔒 PROTECCIÓN: Solo disponible en desarrollo
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Not found' },
      { status: 404 }
    );
  }

  try {
    const expectedSecret = process.env.DEBUG_SECRET;
    if (!expectedSecret) {
      return NextResponse.json(
        { error: 'DEBUG_SECRET no configurado' },
        { status: 500 }
      );
    }

    const body: unknown = await request.json();
    const providedSecret =
      (body && typeof body === 'object' && 'secret' in body
        ? String((body as { secret?: string }).secret)
        : undefined) ||
      request.headers.get('x-debug-secret');

    if (!providedSecret || providedSecret !== expectedSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Usar instancia global de Prisma
    await prisma.$connect();

    // Verificar si ya existe el usuario
    const existingUser = await prisma.user.findUnique({
      where: { email: 'admin@inmova.app' },
    });

    if (existingUser) {
      return NextResponse.json({
        message: 'Usuario ya existe',
        user: {
          email: existingUser.email,
          name: existingUser.name,
          role: existingUser.role,
          activo: existingUser.activo,
        },
      });
    }

    // Verificar si existe al menos una empresa
    let company = await prisma.company.findFirst();

    if (!company) {
      // Crear empresa de prueba
      company = await prisma.company.create({
        data: {
          nombre: 'Inmova Demo',
          email: 'demo@inmova.app',
          telefono: '+34 900 000 000',
          activo: true,
        },
      });
    }

    // Crear usuario de prueba
    const hashedPassword = await bcrypt.hash('demo123', 10);

    const user = await prisma.user.create({
      data: {
        email: 'admin@inmova.app',
        name: 'Admin Demo',
        password: hashedPassword,
        role: 'super_admin',
        companyId: company.id,
        activo: true,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        activo: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Usuario de prueba creado exitosamente',
      user,
    });
  } catch (error: unknown) {
    logger.error('[CreateTestUser] Error:', error);
    return NextResponse.json(
      { error: 'Error creando usuario' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  // 🔒 PROTECCIÓN: Solo disponible en desarrollo
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Not found' },
      { status: 404 }
    );
  }

  try {
    const expectedSecret = process.env.DEBUG_SECRET;
    if (!expectedSecret) {
      return NextResponse.json(
        { error: 'DEBUG_SECRET no configurado' },
        { status: 500 }
      );
    }

    const providedSecret =
      request.headers.get('x-debug-secret') ||
      new URL(request.url).searchParams.get('secret');

    if (!providedSecret || providedSecret !== expectedSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Usar instancia global de Prisma
    await prisma.$connect();

    // Contar usuarios
    const userCount = await prisma.user.count();
    const companyCount = await prisma.company.count();

    const users = await prisma.user.findMany({
      take: 5,
      select: {
        email: true,
        name: true,
        role: true,
        activo: true,
      },
    });

    return NextResponse.json({
      userCount,
      companyCount,
      users,
    });
  } catch (error: unknown) {
    logger.error('[CreateTestUser] Error:', error);
    return NextResponse.json(
      { error: 'Error obteniendo información' },
      { status: 500 }
    );
  }
}
