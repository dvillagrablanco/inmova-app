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
    const buildingId = searchParams.get('buildingId');
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

    const [policies, insurances] = await Promise.all([
      prisma.insurancePolicy.findMany({
        where: {
          companyId: resolvedCompanyId,
          ...(buildingId && { buildingId }),
        },
        orderBy: { fechaVencimiento: 'asc' },
      }),
      prisma.insurance.findMany({
        where: {
          companyId: resolvedCompanyId,
          ...(buildingId && {
            OR: [
              { buildingId },
              { unit: { buildingId } },
            ],
          }),
        },
        select: {
          id: true,
          tipo: true,
          numeroPoliza: true,
          aseguradora: true,
          fechaVencimiento: true,
          estado: true,
          primaAnual: true,
          primaMensual: true,
        },
        orderBy: { fechaVencimiento: 'asc' },
      }),
    ]);

    const normalizedPolicies = policies.map((policy) => ({
      id: `policy:${policy.id}`,
      tipoSeguro: policy.tipoSeguro,
      numeroPoliza: policy.numeroPoliza,
      aseguradora: policy.aseguradora,
      fechaVencimiento: policy.fechaVencimiento,
      estado: policy.estado,
      primaAnual: policy.primaAnual,
    }));

    const normalizedInsurances = insurances.map((insurance) => ({
      id: `insurance:${insurance.id}`,
      tipoSeguro: String(insurance.tipo),
      numeroPoliza: insurance.numeroPoliza,
      aseguradora: insurance.aseguradora,
      fechaVencimiento: insurance.fechaVencimiento,
      estado: insurance.estado === 'pendiente_renovacion' ? 'por_renovar' : insurance.estado,
      primaAnual:
        insurance.primaAnual ??
        (insurance.primaMensual ? insurance.primaMensual * 12 : 0),
    }));

    let combined = [...normalizedPolicies, ...normalizedInsurances];
    if (estado) {
      combined = combined.filter((item) => item.estado === estado);
    }

    combined.sort(
      (a, b) => new Date(a.fechaVencimiento).getTime() - new Date(b.fechaVencimiento).getTime()
    );

    return NextResponse.json(combined);
  } catch (error) {
    logger.error('Error fetching insurance policies:', error);
    return NextResponse.json(
      { error: 'Error al obtener pólizas de seguro' },
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

    const policy = await prisma.insurancePolicy.create({
      data: {
        companyId: user.companyId,
        buildingId: body.buildingId,
        tipoSeguro: body.tipoSeguro,
        numeroPoliza: body.numeroPoliza,
        aseguradora: body.aseguradora,
        coberturas: body.coberturas || [],
        montoCobertura: parseFloat(body.montoCobertura),
        primaAnual: parseFloat(body.primaAnual),
        deducible: body.deducible ? parseFloat(body.deducible) : null,
        fechaInicio: new Date(body.fechaInicio),
        fechaVencimiento: new Date(body.fechaVencimiento),
        estado: body.estado || 'activa',
        agente: body.agente,
        telefonoAgente: body.telefonoAgente,
        emailAgente: body.emailAgente,
        notas: body.notas,
      },
    });

    return NextResponse.json(policy, { status: 201 });
  } catch (error) {
    logger.error('Error creating insurance policy:', error);
    return NextResponse.json(
      { error: 'Error al crear póliza de seguro' },
      { status: 500 }
    );
  }
}
