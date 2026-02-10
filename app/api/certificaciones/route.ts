import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Resolver companyId con soporte multi-empresa (cookie > JWT)
    const cookieCompanyId = request.cookies.get('activeCompanyId')?.value;
    const __resolvedCompanyId = cookieCompanyId || session.user.companyId;
    if (!__resolvedCompanyId) {
      return NextResponse.json({ error: 'Empresa no definida' }, { status: 400 });
    }
    // Inyectar companyId resuelto en session para compatibilidad
    (session.user as any).companyId = __resolvedCompanyId;, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const unitId = searchParams.get('unitId');
    const vigente = searchParams.get('vigente');

    const certificados = await prisma.energyCertificate.findMany({
      where: {
        companyId: session.user.companyId,
        ...(unitId && { unitId }),
        ...(vigente !== null && { vigente: vigente === 'true' }),
      },
      include: {
        unit: {
          select: {
            numero: true,
            building: { select: { nombre: true, direccion: true } },
          },
        },
      },
      orderBy: { fechaVencimiento: 'asc' },
    });

    return NextResponse.json(certificados);
  } catch (error) {
    logger.error('Error:', error);
    return NextResponse.json({ error: 'Error al obtener certificados' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId || session.user.role === 'operador') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const body = await request.json();

    const certificado = await prisma.energyCertificate.create({
      data: { ...body, companyId: session.user.companyId },
      include: {
        unit: {
          select: {
            numero: true,
            building: { select: { nombre: true } },
          },
        },
      },
    });

    return NextResponse.json(certificado, { status: 201 });
  } catch (error) {
    logger.error('Error:', error);
    return NextResponse.json({ error: 'Error al crear certificado' }, { status: 500 });
  }
}
