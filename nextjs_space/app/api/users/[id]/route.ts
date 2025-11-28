import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, forbiddenResponse, badRequestResponse, notFoundResponse } from '@/lib/permissions';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();

    if (user.role !== 'administrador') {
      return forbiddenResponse('No tienes permiso');
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: params.id },
      include: { company: true },
    });

    if (!targetUser) {
      return notFoundResponse('Usuario no encontrado');
    }

    // Verificar que el usuario pertenece a la misma empresa
    if (targetUser.companyId !== user.companyId) {
      return forbiddenResponse('No tienes acceso a este usuario');
    }

    const { password, ...userWithoutPassword } = targetUser;
    return NextResponse.json(userWithoutPassword);
  } catch (error: any) {
    console.error('Error fetching user:', error);
    if (error.message === 'No autenticado') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: 'Error al obtener usuario' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();

    if (user.role !== 'administrador') {
      return forbiddenResponse('No tienes permiso');
    }

    const body = await req.json();
    const { name, role, activo, password } = body;

    const targetUser = await prisma.user.findUnique({
      where: { id: params.id },
    });

    if (!targetUser) {
      return notFoundResponse('Usuario no encontrado');
    }

    if (targetUser.companyId !== user.companyId) {
      return forbiddenResponse('No tienes acceso a este usuario');
    }

    const updateData: any = {};
    if (name) updateData.name = name;
    if (role) {
      if (!['administrador', 'gestor', 'operador'].includes(role)) {
        return badRequestResponse('Rol inválido');
      }
      updateData.role = role;
    }
    if (typeof activo === 'boolean') updateData.activo = activo;
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
      include: { company: true },
    });

    const { password: _, ...userWithoutPassword } = updatedUser;
    return NextResponse.json(userWithoutPassword);
  } catch (error: any) {
    console.error('Error updating user:', error);
    if (error.message === 'No autenticado') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: 'Error al actualizar usuario' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();

    if (user.role !== 'administrador') {
      return forbiddenResponse('No tienes permiso');
    }

    // No permitir eliminar el propio usuario
    if (user.id === params.id) {
      return badRequestResponse('No puedes eliminar tu propio usuario');
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: params.id },
    });

    if (!targetUser) {
      return notFoundResponse('Usuario no encontrado');
    }

    if (targetUser.companyId !== user.companyId) {
      return forbiddenResponse('No tienes acceso a este usuario');
    }

    await prisma.user.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Usuario eliminado correctamente' });
  } catch (error: any) {
    console.error('Error deleting user:', error);
    if (error.message === 'No autenticado') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: 'Error al eliminar usuario' }, { status: 500 });
  }
}
