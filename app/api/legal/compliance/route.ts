import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Lazy Prisma (auditoria V2)
async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

export async function GET(req: NextRequest) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const estado = searchParams.get('estado');
    const tipo = searchParams.get('tipo');
    const queryCompanyId = searchParams.get('companyId');
    const userRole = (session.user as any).role;

    const sessionCompanyId = (session.user as any).companyId;
    const resolvedCompanyId =
      queryCompanyId && userRole === 'super_admin'
        ? queryCompanyId
        : sessionCompanyId ||
          (await prisma.user
            .findUnique({ where: { email: session.user.email } })
            .then((user) => user?.companyId));

    if (!resolvedCompanyId) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    const alerts = await prisma.complianceAlert.findMany({
      where: {
        companyId: resolvedCompanyId,
        ...(estado && { estado }),
        ...(tipo && { tipo }),
      },
      orderBy: [
        { completada: 'asc' },
        { fechaLimite: 'asc' },
      ],
    });

    const now = new Date();
    const warningMs = 30 * 24 * 60 * 60 * 1000;
    const insurances = await prisma.insurance.findMany({
      where: { companyId: resolvedCompanyId },
      select: {
        id: true,
        numeroPoliza: true,
        aseguradora: true,
        fechaVencimiento: true,
        estado: true,
        building: { select: { nombre: true } },
        unit: { select: { numero: true, building: { select: { nombre: true } } } },
      },
    });

    const insuranceAlerts = insurances.flatMap((insurance) => {
      const expiry = new Date(insurance.fechaVencimiento);
      const msToExpire = expiry.getTime() - now.getTime();
      const isExpired = msToExpire < 0 || insurance.estado === 'vencida';
      const isCancelled = insurance.estado === 'cancelada';
      const isPendingRenewal = insurance.estado === 'pendiente_renovacion';
      const isExpiringSoon = msToExpire >= 0 && msToExpire <= warningMs;

      if (!isExpired && !isCancelled && !isPendingRenewal && !isExpiringSoon) return [];

      const location =
        insurance.unit?.numero
          ? `Unidad ${insurance.unit.numero}`
          : insurance.building?.nombre || insurance.unit?.building?.nombre;
      const titulo = `${isExpired || isCancelled ? 'Seguro vencido' : 'Seguro por vencer'}: ${insurance.numeroPoliza}`;
      const descripcion = `${insurance.aseguradora}${location ? ` | ${location}` : ''}`;

      return [
        {
          id: `insurance:${insurance.id}`,
          tipo: 'seguro',
          titulo,
          descripcion,
          fechaLimite: expiry,
          estado: 'pendiente',
          prioridad: isExpired || isCancelled ? 'alta' : 'media',
          completada: false,
        },
      ];
    });

    let combined = [...alerts, ...insuranceAlerts];
    if (estado) {
      combined = combined.filter((alert) => alert.estado === estado);
    }
    if (tipo) {
      combined = combined.filter((alert) => alert.tipo === tipo);
    }

    combined.sort((a, b) => {
      if (a.completada !== b.completada) {
        return a.completada ? 1 : -1;
      }
      return new Date(a.fechaLimite).getTime() - new Date(b.fechaLimite).getTime();
    });

    return NextResponse.json(combined);
  } catch (error) {
    logger.error('Error fetching compliance alerts:', error);
    return NextResponse.json(
      { error: 'Error al obtener alertas de cumplimiento' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    const body = await req.json();

    const alert = await prisma.complianceAlert.create({
      data: {
        companyId: user.companyId,
        tipo: body.tipo,
        titulo: body.titulo,
        descripcion: body.descripcion,
        fechaLimite: new Date(body.fechaLimite),
        estado: body.estado || 'pendiente',
        prioridad: body.prioridad || 'media',
        entityId: body.entityId,
        entityType: body.entityType,
        accionRequerida: body.accionRequerida,
      },
    });

    return NextResponse.json(alert, { status: 201 });
  } catch (error) {
    logger.error('Error creating compliance alert:', error);
    return NextResponse.json(
      { error: 'Error al crear alerta de cumplimiento' },
      { status: 500 }
    );
  }
}
