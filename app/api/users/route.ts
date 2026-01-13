import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import {
  requireAuth,
  requirePermission,
  forbiddenResponse,
  badRequestResponse,
} from '@/lib/permissions';
import bcrypt from 'bcryptjs';
import logger, { logError } from '@/lib/logger';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Schema de validación para crear usuario
const createUserSchema = z.object({
  email: z.string().email({ message: 'Email inválido' }),
  name: z.string().min(2, { message: 'El nombre debe tener al menos 2 caracteres' }),
  password: z.string().min(8, { message: 'La contraseña debe tener al menos 8 caracteres' }),
  role: z.enum(['administrador', 'gestor', 'operador', 'super_admin'], {
    message: 'Rol inválido',
  }),
  // companyId puede ser un UUID válido, null (sin empresa) o undefined
  companyId: z.string().uuid().nullish(),
});

export async function GET() {
  try {
    const user = await requireAuth();

    // Solo administradores y super_admin pueden ver usuarios
    if (user.role !== 'administrador' && user.role !== 'super_admin') {
      return forbiddenResponse('No tienes permiso para ver usuarios');
    }

    // Si es super_admin, puede ver usuarios de todas las empresas
    // Si es administrador, solo de su empresa
    const whereClause = user.role === 'super_admin' ? {} : { companyId: user.companyId };

    const users = await prisma.user.findMany({
      where: whereClause,
      include: {
        company: {
          select: {
            id: true,
            nombre: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Omitir contraseñas
    const usersWithoutPasswords = users.map(({ password, ...user }) => user);

    return NextResponse.json(usersWithoutPasswords);
  } catch (error: any) {
    logger.error('Error fetching users:', error);
    if (error.message === 'No autenticado') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: 'Error al obtener usuarios' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();

    // Solo administradores y super_admin pueden crear usuarios
    if (user.role !== 'administrador' && user.role !== 'super_admin') {
      return forbiddenResponse('No tienes permiso para crear usuarios');
    }

    const body = await req.json();

    // Validación con Zod
    const validationResult = createUserSchema.safeParse(body);

    if (!validationResult.success) {
      const errors = validationResult.error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      logger.warn('Validation error creating user:', { errors });
      return NextResponse.json({ error: 'Datos inválidos', details: errors }, { status: 400 });
    }

    const { email, name, password, role, companyId } = validationResult.data;

    // Super_admin solo puede ser creado por otro super_admin
    if (role === 'super_admin' && user.role !== 'super_admin') {
      return forbiddenResponse('No tienes permiso para crear usuarios super_admin');
    }

    // Verificar si el email ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return badRequestResponse('El email ya está en uso');
    }

    // Determinar la empresa:
    // - Si es super_admin y proporciona companyId, usar ese
    // - Si es administrador, usar su propia companyId
    let targetCompanyId = user.companyId;
    if (user.role === 'super_admin' && companyId) {
      targetCompanyId = companyId;
    }

    // Hash de contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        role,
        companyId: targetCompanyId,
        activo: true,
      },
      include: {
        company: {
          select: {
            id: true,
            nombre: true,
          },
        },
      },
    });

    // Omitir contraseña
    const { password: _, ...userWithoutPassword } = newUser;

    return NextResponse.json(userWithoutPassword, { status: 201 });
  } catch (error: any) {
    logger.error('Error creating user:', error);
    if (error.message?.includes('permiso')) {
      return forbiddenResponse(error.message);
    }
    if (error.message === 'No autenticado') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: 'Error al crear usuario' }, { status: 500 });
  }
}
