import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getContaSimpleService } from '@/lib/contasimple-integration-service';
import { prisma } from '@/lib/db';

/**
 * POST /api/accounting/contasimple/customers
 * Sincroniza un inquilino de INMOVA como cliente en ContaSimple
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { tenantId } = body;

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Se requiere tenantId' },
        { status: 400 }
      );
    }

    // Obtener datos del inquilino
    const tenant = await prisma.tenant.findFirst({
      where: {
        id: tenantId,
        companyId: session.user.companyId,
      },
    });

    if (!tenant) {
      return NextResponse.json(
        { error: 'Inquilino no encontrado' },
        { status: 404 }
      );
    }

    // Sincronizar con ContaSimple (modo demo)
    const contaSimpleService = getContaSimpleService();
    const result = await contaSimpleService.syncTenantToCustomerDemo(tenant);

    return NextResponse.json({
      success: true,
      message: `Cliente sincronizado: ${tenant.nombreCompleto}`,
      data: result,
    });
  } catch (error) {
    console.error('Error al sincronizar cliente con ContaSimple:', error);
    return NextResponse.json(
      { error: 'Error al sincronizar cliente' },
      { status: 500 }
    );
  }
}
