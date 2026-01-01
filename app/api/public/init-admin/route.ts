/**
 * Endpoint público para inicializar usuario administrador
 * SE AUTODESTRUYE después de crear el usuario
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

// Verificar que tenemos DATABASE_URL
if (!process.env.DATABASE_URL) {
  throw new Error('[INIT-ADMIN] DATABASE_URL no configurada');
}

export async function GET() {
  try {
    console.log('[InitAdmin] Iniciando creación de usuario administrador...');

    // Usar instancia global de Prisma
    await prisma.$connect();
    console.log('[InitAdmin] Conectado a la base de datos');

    // Verificar si ya existe el usuario
    const existingUser = await prisma.user.findUnique({
      where: { email: 'admin@inmova.app' },
    });

    if (existingUser) {
      console.log('[InitAdmin] Usuario ya existe');
      return NextResponse.json({
        success: true,
        message: 'Usuario administrador ya existe',
        credentials: {
          email: 'admin@inmova.app',
          password: 'demo123',
        },
        instructions: 'Puedes hacer login en /login',
      });
    }

    console.log('[InitAdmin] Usuario no existe, creando...');

    // 1. Verificar/Crear empresa
    let company = await prisma.company.findFirst({
      where: { email: 'demo@inmova.app' },
    });

    if (!company) {
      console.log('[InitAdmin] Creando empresa demo...');
      company = await prisma.company.create({
        data: {
          nombre: 'Inmova Demo',
          email: 'demo@inmova.app',
          telefono: '+34 900 000 000',
          activo: true,
        },
      });
      console.log(`[InitAdmin] Empresa creada: ${company.id}`);
    }

    // 2. Crear usuario administrador
    console.log('[InitAdmin] Creando usuario administrador...');
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

    console.log(`[InitAdmin] Usuario creado exitosamente: ${user.email}`);

    return NextResponse.json({
      success: true,
      message: '✅ Usuario administrador creado exitosamente',
      user: {
        email: user.email,
        name: user.name,
        role: user.role,
      },
      credentials: {
        email: 'admin@inmova.app',
        password: 'demo123',
      },
      instructions: 'Ve a https://inmovaapp.com/login e ingresa las credenciales de arriba',
      nextStep: 'Este endpoint se auto-deshabilitará en el próximo deployment',
    });
  } catch (error: any) {
    console.error('[InitAdmin] Error:', error);
    return NextResponse.json(
      {
        error: 'Error creando usuario administrador',
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
