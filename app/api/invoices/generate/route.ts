import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { resolveCompanyScope } from '@/lib/company-scope';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const scope = await resolveCompanyScope({
      userId: session.user.id as string,
      role: session.user.role as any,
      primaryCompanyId: session.user?.companyId,
      request: req,
    });

    if (!scope.activeCompanyId) {
      return NextResponse.json({ error: 'Empresa no definida' }, { status: 400 });
    }

    const body = await req.json();
    const { paymentId } = body;

    if (!paymentId || typeof paymentId !== 'string') {
      return NextResponse.json(
        { error: 'paymentId es requerido' },
        { status: 400 }
      );
    }

    const prisma = await getPrisma();

    const payment = await prisma.payment.findFirst({
      where: {
        id: paymentId,
        contract: {
          unit: {
            building: {
              companyId: scope.activeCompanyId,
            },
          },
        },
      },
      include: {
        contract: {
          include: {
            tenant: true,
            unit: {
              include: {
                building: true,
              },
            },
          },
        },
      },
    });

    if (!payment) {
      return NextResponse.json({ error: 'Pago no encontrado' }, { status: 404 });
    }

    if (payment.estado !== 'pagado') {
      return NextResponse.json(
        { error: 'Solo se pueden generar facturas de pagos cobrados' },
        { status: 400 }
      );
    }

    const existingTx = await prisma.accountingTransaction.findFirst({
      where: { paymentId: payment.id },
    });

    if (existingTx) {
      const company = await prisma.company.findUnique({
        where: { id: scope.activeCompanyId },
        select: { nombre: true, cif: true, direccion: true },
      });
      const tenant = payment.contract.tenant;
      const unit = payment.contract.unit;
      const building = unit.building;
      const baseImponible = payment.baseImponible ?? Number(payment.monto);
      const cuotaIva = payment.iva ?? 0;
      const cuotaIrpf = payment.irpf ?? Math.round(baseImponible * 0.15 * 100) / 100;
      const total = Number(payment.monto);
      const tenantDireccion = [
        tenant.direccionActual || tenant.ciudad || '',
        tenant.codigoPostal ? `${tenant.codigoPostal}` : '',
        tenant.provincia || '',
        tenant.pais || 'España',
      ]
        .filter(Boolean)
        .join(', ');
      const existingInvoice = {
        id: payment.id,
        numero: existingTx.referencia || '',
        fecha: existingTx.fecha.toISOString().split('T')[0],
        emisor: {
          nombre: company?.nombre || 'Empresa',
          cif: company?.cif || '',
          direccion: company?.direccion || '',
        },
        receptor: {
          nombre: tenant.nombreCompleto,
          nif: tenant.dni,
          direccion: tenantDireccion || tenant.email,
        },
        conceptos: [{
          descripcion: existingTx.concepto,
          baseImponible,
          tipoIva: 0,
          cuotaIva,
          tipoIrpf: 15,
          cuotaIrpf,
          total,
        }],
        subtotal: baseImponible,
        totalIva: cuotaIva,
        totalIrpf: cuotaIrpf,
        total,
      };
      return NextResponse.json(
        { error: 'Este pago ya tiene factura generada', invoice: existingInvoice },
        { status: 409 }
      );
    }

    const company = await prisma.company.findUnique({
      where: { id: scope.activeCompanyId },
      select: { nombre: true, cif: true, direccion: true },
    });

    const tenant = payment.contract.tenant;
    const unit = payment.contract.unit;
    const building = unit.building;

    const baseImponible = payment.baseImponible ?? Number(payment.monto);
    const tipoIva = 0;
    const cuotaIva = payment.iva ?? 0;
    const tipoIrpf = 15;
    const cuotaIrpf = payment.irpf ?? Math.round(baseImponible * 0.15 * 100) / 100;
    const total = Number(payment.monto);

    const concepto = {
      descripcion: payment.concepto || `Alquiler ${payment.periodo} - ${building.nombre} ${unit.numero}`,
      baseImponible,
      tipoIva,
      cuotaIva,
      tipoIrpf,
      cuotaIrpf,
      total,
    };

    const totalIva = cuotaIva;
    const totalIrpf = cuotaIrpf;

    const year = new Date().getFullYear();
    const count = await prisma.accountingTransaction.count({
      where: {
        companyId: scope.activeCompanyId,
        referencia: { startsWith: `INV-${year}-` },
      },
    });
    const numero = `INV-${year}-${String(count + 1).padStart(4, '0')}`;
    const fecha = new Date().toISOString().split('T')[0];

    const tenantDireccion = [
      tenant.direccionActual || tenant.ciudad || '',
      tenant.codigoPostal ? `${tenant.codigoPostal}` : '',
      tenant.provincia || '',
      tenant.pais || 'España',
    ]
      .filter(Boolean)
      .join(', ');

    const invoice = {
      id: payment.id,
      numero,
      fecha,
      emisor: {
        nombre: company?.nombre || 'Empresa',
        cif: company?.cif || '',
        direccion: company?.direccion || '',
      },
      receptor: {
        nombre: tenant.nombreCompleto,
        nif: tenant.dni,
        direccion: tenantDireccion || tenant.email,
      },
      conceptos: [concepto],
      subtotal: baseImponible,
      totalIva,
      totalIrpf,
      total,
    };

    await prisma.accountingTransaction.create({
      data: {
        companyId: scope.activeCompanyId,
        buildingId: building.id,
        unitId: unit.id,
        tipo: 'ingreso',
        categoria: 'ingreso_renta',
        concepto: concepto.descripcion,
        monto: total,
        fecha: payment.fechaPago || new Date(),
        referencia: numero,
        paymentId: payment.id,
        notas: `Factura generada por pago ${payment.periodo}`,
      },
    });

    logger.info('Invoice generated', {
      paymentId: payment.id,
      numero,
      companyId: scope.activeCompanyId,
    });

    return NextResponse.json(invoice);
  } catch (error: any) {
    logger.error('Error generating invoice:', error);
    return NextResponse.json(
      { error: error.message || 'Error al generar factura' },
      { status: 500 }
    );
  }
}
