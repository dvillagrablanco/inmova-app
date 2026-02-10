import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import {
  requireAuth,
  forbiddenResponse,
  badRequestResponse,
  notFoundResponse,
} from '@/lib/permissions';
import bcrypt from 'bcryptjs';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth();

    // Permitir acceso a administradores y super_admin
    if (user.role !== 'administrador' && user.role !== 'super_admin') {
      return forbiddenResponse('No tienes permiso');
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: params.id },
      include: { company: true },
    });

    if (!targetUser) {
      return notFoundResponse('Usuario no encontrado');
    }

    // Super_admin puede ver cualquier usuario, administrador solo de su empresa
    if (user.role !== 'super_admin' && targetUser.companyId !== user.companyId) {
      return forbiddenResponse('No tienes acceso a este usuario');
    }

    const { password, ...userWithoutPassword } = targetUser;
    return NextResponse.json(userWithoutPassword);
  } catch (error: any) {
    if (error?.name === 'AuthError' || error?.statusCode === 401 || error?.statusCode === 403) { return NextResponse.json({ error: error.message }, { status: error.statusCode || 401 }); }
    logger.error('Error fetching user:', error);
    if (error.message === 'No autenticado') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: 'Error al obtener usuario' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth();

    // Permitir acceso a administradores y super_admin
    if (user.role !== 'administrador' && user.role !== 'super_admin') {
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

    // Super_admin puede editar cualquier usuario, administrador solo de su empresa
    if (user.role !== 'super_admin' && targetUser.companyId !== user.companyId) {
      return forbiddenResponse('No tienes acceso a este usuario');
    }

    const updateData: any = {};
    if (name) updateData.name = name;
    if (role) {
      // Super_admin puede asignar cualquier rol, administrador solo roles básicos
      const allowedRoles =
        user.role === 'super_admin'
          ? ['super_admin', 'administrador', 'gestor', 'operador']
          : ['administrador', 'gestor', 'operador'];

      if (!allowedRoles.includes(role)) {
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
    if (error?.name === 'AuthError' || error?.statusCode === 401 || error?.statusCode === 403) { return NextResponse.json({ error: error.message }, { status: error.statusCode || 401 }); }
    logger.error('Error updating user:', error);
    if (error.message === 'No autenticado') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: 'Error al actualizar usuario' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth();

    // Permitir acceso a administradores y super_admin
    if (user.role !== 'administrador' && user.role !== 'super_admin') {
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

    // Super_admin puede eliminar cualquier usuario, administrador solo de su empresa
    if (user.role !== 'super_admin' && targetUser.companyId !== user.companyId) {
      return forbiddenResponse('No tienes acceso a este usuario');
    }

    // No permitir que un administrador elimine a un super_admin
    if (user.role !== 'super_admin' && targetUser.role === 'super_admin') {
      return forbiddenResponse('No tienes permiso para eliminar un super administrador');
    }

    await prisma.user.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Usuario eliminado correctamente' });
  } catch (error: any) {
    if (error?.name === 'AuthError' || error?.statusCode === 401 || error?.statusCode === 403) { return NextResponse.json({ error: error.message }, { status: error.statusCode || 401 }); }
    logger.error('Error deleting user:', error);
    if (error.message === 'No autenticado') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: 'Error al eliminar usuario' }, { status: 500 });
  }
}
