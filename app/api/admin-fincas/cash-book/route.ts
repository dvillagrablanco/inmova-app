import { NextRequest, NextResponse } from 'next/server';
import logger from '@/lib/logger';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Lazy Prisma (auditoria V2)
async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}
/**
 * GET /api/admin-fincas/cash-book
 * Obtiene movimientos del libro de caja
 */
export async function GET(request: NextRequest) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const communityId = searchParams.get('communityId');
    const tipo = searchParams.get('tipo');
    const categoria = searchParams.get('categoria');
    const fechaDesde = searchParams.get('fechaDesde');
    const fechaHasta = searchParams.get('fechaHasta');
    
    if (!communityId) {
      return NextResponse.json(
        { error: 'communityId es requerido' },
        { status: 400 }
      );
    }
    
    const where: any = {
      companyId: session.user.companyId,
      communityId,
    };
    
    if (tipo) {
      where.tipo = tipo;
    }
    
    if (categoria) {
      where.categoria = categoria;
    }
    
    if (fechaDesde || fechaHasta) {
      where.fecha = {};
      if (fechaDesde) where.fecha.gte = new Date(fechaDesde);
      if (fechaHasta) where.fecha.lte = new Date(fechaHasta);
    }
    
    const entries = await prisma.cashBookEntry.findMany({
      where,
      orderBy: {
        fecha: 'desc',
      },
    });
    // Obtener saldo actual
    const lastEntry = await prisma.cashBookEntry.findFirst({
      where: {
        companyId: session.user.companyId,
        communityId,
      },
      orderBy: {
        fecha: 'desc',
      },
    });
    
    const saldoActual = lastEntry?.saldoActual || 0;
    return NextResponse.json({
      entries,
      saldoActual,
    });
  } catch (error) {
    logger.error('Error fetching cash book entries:', error);
    return NextResponse.json(
      { error: 'Error al obtener movimientos' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin-fincas/cash-book
 * Crea un nuevo movimiento en el libro de caja
 */
export async function POST(request: NextRequest) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.companyId || !session?.user?.email) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }
    
    const body = await request.json();
    const {
      communityId,
      fecha,
      tipo,
      concepto,
      descripcion,
      importe,
      categoria,
      subcategoria,
      facturaId,
      pagoId,
      documentoUrl,
    } = body;
    
    // Validar campos requeridos
    if (!communityId || !tipo || !concepto || importe === undefined) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }
    
    // Verificar que la comunidad existe y pertenece a la compañía
    const community = await prisma.communityManagement.findFirst({
      where: {
        id: communityId,
        companyId: session.user.companyId,
      },
    });
    
    if (!community) {
      return NextResponse.json(
        { error: 'Comunidad no encontrada' },
        { status: 404 }
      );
    }
    
    // Obtener último saldo
    const lastEntry = await prisma.cashBookEntry.findFirst({
      where: {
        companyId: session.user.companyId,
        communityId,
      },
      orderBy: {
        fecha: 'desc',
      },
    });
    
    const saldoAnterior = lastEntry?.saldoActual || 0;
    
    // Calcular nuevo saldo
    let saldoActual = saldoAnterior;
    if (tipo === 'ingreso') {
      saldoActual = saldoAnterior + importe;
    } else if (tipo === 'gasto') {
      saldoActual = saldoAnterior - importe;
    } else {
      // traspaso (no afecta el saldo)
      saldoActual = saldoAnterior;
    }
    
    const entry = await prisma.cashBookEntry.create({
      data: {
        companyId: session.user.companyId,
        communityId,
        fecha: fecha ? new Date(fecha) : new Date(),
        tipo,
        concepto,
        descripcion,
        importe,
        saldoAnterior,
        saldoActual,
        categoria: categoria || 'otros',
        subcategoria,
        facturaId,
        pagoId,
        documentoUrl,
        registradoPor: session.user.email,
      },
    });
    
    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    logger.error('Error creating cash book entry:', error);
    return NextResponse.json(
      { error: 'Error al crear movimiento' },
      { status: 500 }
    );
  }
}
