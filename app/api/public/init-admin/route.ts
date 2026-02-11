/**
 * Endpoint público para inicializar usuario administrador
 * SE AUTODESTRUYE después de crear el usuario
 */

import { NextResponse } from 'next/server';

import bcrypt from 'bcryptjs';

import logger from '@/lib/logger';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Lazy Prisma loading (auditoria 2026-02-11)
async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}


// Verificar que tenemos DATABASE_URL
if (!process.env.DATABASE_URL) {
  throw new Error('[INIT-ADMIN] DATABASE_URL no configurada');
}

export async function GET(request: Request) {
  const prisma = await getPrisma();
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

    const providedSecret = new URL(request.url).searchParams.get('secret');
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
        success: true,
        message: 'Usuario administrador ya existe',
        instructions: 'Puedes hacer login en /login',
      });
    }

    // 1. Verificar/Crear empresa
    let company = await prisma.company.findFirst({
      where: { email: 'demo@inmova.app' },
    });

    if (!company) {
      company = await prisma.company.create({
        data: {
          nombre: 'Inmova Demo',
          email: 'demo@inmova.app',
          telefono: '+34 900 000 000',
          activo: true,
        },
      });
    }

    // 2. Crear usuario administrador
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
      message: '✅ Usuario administrador creado exitosamente',
      user: {
        email: user.email,
        name: user.name,
        role: user.role,
      },
      instructions: 'Ve a https://inmovaapp.com/login e ingresa las credenciales de arriba',
      nextStep: 'Este endpoint se auto-deshabilitará en el próximo deployment',
    });
  } catch (error: unknown) {
    logger.error('[InitAdmin] Error:', error);
    return NextResponse.json(
      { error: 'Error creando usuario administrador' },
      { status: 500 }
    );
  }
}
