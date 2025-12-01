import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/impersonate
 * Permite al super_admin "loguearse como" cualquier empresa
 * 
 * Body: { companyId: string }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Solo super_admin puede impersonar
    if (session.user.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requiere rol super_admin' },
        { status: 403 }
      );
    }

    const { companyId } = await request.json();

    if (!companyId) {
      return NextResponse.json(
        { error: 'companyId es requerido' },
        { status: 400 }
      );
    }

    // Verificar que la empresa existe
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: {
        id: true,
        nombre: true,
        activo: true,
      },
    });

    if (!company) {
      return NextResponse.json(
        { error: 'Empresa no encontrada' },
        { status: 404 }
      );
    }

    // Registrar la impersonación para auditoría
    await prisma.auditLog.create({
      data: {
        userId: session.user.id || '',
        action: 'UPDATE',
        entityType: 'Company',
        entityId: companyId,
        entityName: company.nombre,
        changes: JSON.stringify({
          action: 'IMPERSONATE_COMPANY',
          superAdminEmail: session.user.email,
          companyName: company.nombre,
          timestamp: new Date().toISOString(),
        }),
        companyId: companyId,
      },
    });

    return NextResponse.json({
      success: true,
      companyId: company.id,
      companyName: company.nombre,
      originalUserId: session.user.id,
      originalEmail: session.user.email,
      message: `Ahora estás navegando como: ${company.nombre}`,
    });
  } catch (error) {
    console.error('Error en impersonation:', error);
    return NextResponse.json(
      { error: 'Error al iniciar impersonation' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/impersonate
 * Sale del modo impersonation
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    if (session.user.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Acceso denegado' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Impersonation finalizado',
    });
  } catch (error) {
    console.error('Error al finalizar impersonation:', error);
    return NextResponse.json(
      { error: 'Error al finalizar impersonation' },
      { status: 500 }
    );
  }
}
