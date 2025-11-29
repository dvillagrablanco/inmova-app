import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { UserRole } from '@prisma/client';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, name, role } = body;

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'El email ya está registrado' },
        { status: 400 }
      );
    }

    // Validar que el role sea un valor válido del enum UserRole
    const validRoles: UserRole[] = ['administrador', 'gestor', 'operador'];
    const userRole: UserRole = role && validRoles.includes(role as UserRole) 
      ? (role as UserRole) 
      : 'gestor';

    const hashedPassword = await bcrypt.hash(password, 10);

    // Obtener la primera empresa disponible (o crear una por defecto)
    let company = await prisma.company.findFirst();
    if (!company) {
      company = await prisma.company.create({
        data: {
          nombre: 'INMOVA',
          cif: 'B12345678',
          direccion: 'Madrid, España',
          telefono: '+34 912 345 678',
          email: 'info@inmova.com',
        },
      });
    }

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: userRole,
        companyId: company.id,
      },
    });

    return NextResponse.json(
      {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Error al crear usuario' },
      { status: 500 }
    );
  }
}