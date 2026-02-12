import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { conectarCuentaBancaria, sincronizarTransacciones } from '@/lib/open-banking-service';
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
    (session.user as any).companyId = __resolvedCompanyId;

    const connections = await prisma.bankConnection.findMany({
      where: { companyId: session.user.companyId },
      include: {
        transactions: {
          orderBy: { fecha: 'desc' },
          take: 5
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(connections);
  } catch (error) {
    logger.error('Error:', error);
    return NextResponse.json({ error: 'Error obteniendo conexiones' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const result = await conectarCuentaBancaria({
      ...body,
      companyId: session.user.companyId
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    logger.error('Error:', error);
    return NextResponse.json({ error: 'Error conectando cuenta' }, { status: 500 });
  }
}
