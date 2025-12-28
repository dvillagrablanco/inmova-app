/**
 * API temporal para crear usuario de prueba
 * ELIMINAR EN PRODUCCIÓN
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { secret } = await request.json();

    // Protección básica
    if (secret !== 'create-test-user-2025') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
        role: 'SUPERADMIN',
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
      credentials: {
        email: 'admin@inmova.app',
        password: 'demo123',
      },
    });
  } catch (error: any) {
    console.error('[CreateTestUser] Error:', error);
    return NextResponse.json(
      {
        error: 'Error creando usuario',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
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
  } catch (error: any) {
    return NextResponse.json(
      {
        error: 'Error obteniendo información',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
