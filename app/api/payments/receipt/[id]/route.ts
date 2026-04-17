import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

// GET /api/payments/receipt/[id] - Obtener datos para generar recibo
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const db = await getPrisma();
    const paymentId = params.id;
    const sessionCompanyId = session.user?.companyId;

    // Obtener el pago con todas las relaciones necesarias
    const payment = await db.payment.findUnique({
      where: { id: paymentId },
      include: {
        contract: {
          include: {
            unit: {
              include: {
                building: true,
              },
            },
            tenant: true,
          },
        },
      },
    });

    if (!payment) {
      return NextResponse.json({ error: 'Pago no encontrado' }, { status: 404 });
    }

    // Verificar acceso multi-tenant respetando user_company_access y grupo
    const ownerCompanyId =
      payment.contract?.unit?.building?.companyId ||
      (payment.contract?.tenant as any)?.companyId;
    if (ownerCompanyId) {
      try {
        const { resolveCompanyScope } = await import('@/lib/company-scope');
        const scope = await resolveCompanyScope({
          userId: session.user.id as string,
          role: session.user.role as any,
          primaryCompanyId: sessionCompanyId,
          request: request as any,
        });
        if (!scope.accessibleCompanyIds.includes(ownerCompanyId)) {
          return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
        }
      } catch (e) {
        if (ownerCompanyId !== sessionCompanyId) {
          return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
        }
      }
    }

    // Obtener configuración de la empresa del pago (no "cualquiera")
    const targetCompanyId = ownerCompanyId || sessionCompanyId;
    let company = targetCompanyId
      ? await db.company.findUnique({ where: { id: targetCompanyId } })
      : null;
    if (!company) {
      company = {
        nombre: 'INMOVA',
        cif: null,
        direccion: null,
        telefono: null,
        email: null,
        logoUrl: null,
        colorPrimario: '#000000',
        colorSecundario: '#FFFFFF',
        pieDocumento: null,
      } as any;
    }

    // Preparar datos para el recibo
    const receiptData = {
      payment: {
        id: payment.id,
        periodo: payment.periodo,
        monto: payment.monto,
        fechaVencimiento: payment.fechaVencimiento,
        fechaPago: payment.fechaPago,
        estado: payment.estado,
        metodoPago: payment.metodoPago,
      },
      tenant: {
        nombreCompleto: payment.contract.tenant.nombreCompleto,
        dni: payment.contract.tenant.dni,
        email: payment.contract.tenant.email,
        telefono: payment.contract.tenant.telefono,
      },
      unit: {
        numero: payment.contract.unit.numero,
        tipo: payment.contract.unit.tipo,
        direccion: payment.contract.unit.building.direccion,
        edificio: payment.contract.unit.building.nombre,
      },
      contract: {
        id: payment.contract.id,
        fechaInicio: payment.contract.fechaInicio,
        fechaFin: payment.contract.fechaFin,
        rentaMensual: payment.contract.rentaMensual,
      },
      company: {
        nombre: (company as any).nombre,
        cif: (company as any).cif,
        direccion: (company as any).direccion,
        telefono: (company as any).telefono,
        email: (company as any).email,
        logoUrl: (company as any).logoUrl,
        colorPrimario: (company as any).colorPrimario,
        colorSecundario: (company as any).colorSecundario,
        pieDocumento: (company as any).pieDocumento,
      },
    };

    return NextResponse.json(receiptData);
  } catch (error) {
    logger.error('Error al obtener datos del recibo:', error);
    return NextResponse.json(
      { error: 'Error al obtener datos del recibo' },
      { status: 500 }
    );
  }
}
