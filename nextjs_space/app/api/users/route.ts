import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, requirePermission, forbiddenResponse, badRequestResponse } from '@/lib/permissions';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await requireAuth();

    // Solo administradores pueden ver usuarios
    if (user.role !== 'administrador') {
      return forbiddenResponse('No tienes permiso para ver usuarios');
    }

    const users = await prisma.user.findMany({
      where: { companyId: user.companyId },
      include: {
        company: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Omitir contraseñas
    const usersWithoutPasswords = users.map(({ password, ...user }) => user);

    return NextResponse.json(usersWithoutPasswords);
  } catch (error: any) {
    console.error('Error fetching users:', error);
    if (error.message === 'No autenticado') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: 'Error al obtener usuarios' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();

    // Solo administradores pueden crear usuarios
    if (user.role !== 'administrador') {
      return forbiddenResponse('No tienes permiso para crear usuarios');
    }

    const body = await req.json();
    const { email, name, password, role } = body;

    if (!email || !name || !password || !role) {
      return badRequestResponse('Faltan campos requeridos');
    }

    // Validar rol
    if (!['administrador', 'gestor', 'operador'].includes(role)) {
      return badRequestResponse('Rol inválido');
    }

    // Verificar si el email ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return badRequestResponse('El email ya está en uso');
    }

    // Hash de contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        role,
        companyId: user.companyId,
        activo: true,
      },
      include: {
        company: true,
      },
    });

    // Omitir contraseña
    const { password: _, ...userWithoutPassword } = newUser;

    return NextResponse.json(userWithoutPassword, { status: 201 });
  } catch (error: any) {
    console.error('Error creating user:', error);
    if (error.message?.includes('permiso')) {
      return forbiddenResponse(error.message);
    }
    if (error.message === 'No autenticado') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: 'Error al crear usuario' }, { status: 500 });
  }
}
