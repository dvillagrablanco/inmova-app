import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { generateCashFlowStatement, calculateCashFlow } from '@/lib/accounting-service';
import { startOfMonth, endOfMonth, format } from 'date-fns';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
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

    const { searchParams } = new URL(req.url);
    const periodo = searchParams.get('periodo');

    if (periodo) {
      // Obtener statement de un período específico
      const statement = await prisma.cashFlowStatement.findFirst({
        where: {
          companyId: user.companyId,
          periodo,
        },
      });

      return NextResponse.json(statement);
    } else {
      // Obtener últimos 12 meses
      const statements = await prisma.cashFlowStatement.findMany({
        where: {
          companyId: user.companyId,
        },
        orderBy: { periodo: 'desc' },
        take: 12,
      });

      return NextResponse.json(statements);
    }
  } catch (error) {
    logger.error('Error fetching cash flow:', error);
    return NextResponse.json({ error: 'Error al obtener flujo de caja' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
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
    const { periodo } = body;

    await generateCashFlowStatement(user.companyId, periodo);

    const statement = await prisma.cashFlowStatement.findFirst({
      where: {
        companyId: user.companyId,
        periodo,
      },
    });

    return NextResponse.json({
      message: 'Estado de flujo de caja generado',
      statement,
    });
  } catch (error) {
    logger.error('Error generating cash flow:', error);
    return NextResponse.json({ error: 'Error al generar flujo de caja' }, { status: 500 });
  }
}
