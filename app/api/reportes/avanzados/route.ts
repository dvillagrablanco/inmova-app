import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getPrismaClient } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const prisma = getPrismaClient();
    const companyId = session.user.companyId;
    if (!companyId) return NextResponse.json({});

    const { searchParams } = new URL(req.url);
    const tipo = searchParams.get('tipo') || 'inquilinos';

    if (tipo === 'inquilinos') {
      const [total, activos] = await Promise.all([
        prisma.tenant.count({ where: { companyId } }),
        prisma.tenant.count({ where: { companyId, activo: true } }),
      ]);
      const tenants = await prisma.tenant.findMany({
        where: { companyId },
        take: 50,
        orderBy: { createdAt: 'desc' },
        select: { nombre: true, apellidos: true, email: true, telefono: true, activo: true },
      });

      return NextResponse.json({
        kpis: { total, activos, nuevos: 0 },
        rows: tenants.map((t: any) => ({
          nombre: `${t.nombre} ${t.apellidos || ''}`.trim(),
          email: t.email || '',
          telefono: t.telefono || '',
          estado: t.activo ? 'activo' : 'inactivo',
        })),
      });
    }

    if (tipo === 'contratos') {
      const [total, activos] = await Promise.all([
        prisma.contract.count({ where: { unit: { building: { companyId } } } }),
        prisma.contract.count({ where: { unit: { building: { companyId } }, estado: 'activo' } }),
      ]);
      const contracts = await prisma.contract.findMany({
        where: { unit: { building: { companyId } } },
        take: 50,
        orderBy: { createdAt: 'desc' },
        include: {
          tenant: { select: { nombre: true, apellidos: true } },
          unit: { select: { numero: true, building: { select: { nombre: true } } } },
        },
      });

      return NextResponse.json({
        kpis: { total, activos },
        rows: contracts.map((c: any) => ({
          inmueble: `${c.unit?.building?.nombre || ''} - ${c.unit?.numero || ''}`,
          inquilino: `${c.tenant?.nombre || ''} ${c.tenant?.apellidos || ''}`.trim(),
          inicio: c.fechaInicio.toISOString().split('T')[0],
          fin: c.fechaFin.toISOString().split('T')[0],
          renta: c.rentaMensual,
          estado: c.estado,
        })),
      });
    }

    if (tipo === 'pagos') {
      const payments = await prisma.payment.findMany({
        where: { contract: { unit: { building: { companyId } } } },
        take: 50,
        orderBy: { createdAt: 'desc' },
        include: {
          contract: {
            include: {
              tenant: { select: { nombre: true, apellidos: true } },
              unit: { select: { numero: true } },
            },
          },
        },
      });

      const totalCobrado = payments
        .filter((p: any) => p.estado === 'pagado')
        .reduce((s: number, p: any) => s + (p.cantidad || 0), 0);
      const totalPendiente = payments
        .filter((p: any) => p.estado === 'pendiente')
        .reduce((s: number, p: any) => s + (p.cantidad || 0), 0);

      return NextResponse.json({
        kpis: { totalCobrado, totalPendiente, total: payments.length },
        rows: payments.map((p: any) => ({
          inquilino:
            `${p.contract?.tenant?.nombre || ''} ${p.contract?.tenant?.apellidos || ''}`.trim(),
          inmueble: p.contract?.unit?.numero || '',
          cantidad: p.cantidad || 0,
          estado: p.estado,
          fecha: p.createdAt.toISOString().split('T')[0],
        })),
      });
    }

    return NextResponse.json({
      kpis: {},
      rows: [],
      message: `Tipo de reporte '${tipo}' no soportado`,
    });
  } catch (error) {
    console.error('[reportes/avanzados GET]:', error);
    return NextResponse.json({ error: 'Error al generar reporte' }, { status: 500 });
  }
}
