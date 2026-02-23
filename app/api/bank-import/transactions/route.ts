import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/bank-import/transactions?companyId=xxx&page=1&limit=50&estado=pendiente_revision
 * 
 * Lista transacciones bancarias importadas (Norma 43 u otras fuentes)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const companyId = searchParams.get('companyId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);
    const estado = searchParams.get('estado'); // pendiente_revision, conciliado, descartado
    const tipo = searchParams.get('tipo'); // ingreso, gasto
    const connectionId = searchParams.get('connectionId');

    if (!companyId) {
      return NextResponse.json({ error: 'companyId requerido' }, { status: 400 });
    }

    const where: any = { companyId };

    if (estado) {
      where.estado = estado;
    }
    if (tipo) {
      if (tipo === 'ingreso') {
        where.monto = { gt: 0 };
      } else if (tipo === 'gasto') {
        where.monto = { lt: 0 };
      }
    }
    if (connectionId) {
      where.connectionId = connectionId;
    }

    const [transactions, total] = await Promise.all([
      prisma.bankTransaction.findMany({
        where,
        include: {
          connection: {
            select: {
              id: true,
              nombreBanco: true,
              ultimosDigitos: true,
              proveedor: true,
            },
          },
          payment: {
            select: {
              id: true,
              monto: true,
              periodo: true,
              estado: true,
              contract: {
                select: {
                  tenant: {
                    select: { nombreCompleto: true },
                  },
                },
              },
            },
          },
        },
        orderBy: { fecha: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.bankTransaction.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: transactions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Error obteniendo transacciones', details: error.message },
      { status: 500 }
    );
  }
}
