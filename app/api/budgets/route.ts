import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

import logger from '@/lib/logger';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({
        budgets: [],
        total: 0,
        stats: {
          borradores: 0,
          enviados: 0,
          aprobados: 0,
          rechazados: 0,
          facturados: 0,
          valorTotal: 0,
          valorAprobado: 0,
        },
        success: false,
        error: 'No autenticado',
      });
    }

    const { searchParams } = new URL(request.url);
    const estado = searchParams.get('estado');
    const providerId = searchParams.get('providerId');

    // Obtener presupuestos de proveedores
    const quotes = await prisma.providerQuote.findMany({
      where: {
        companyId: session.user.companyId,
        ...(estado && { estado }),
        ...(providerId && { providerId }),
      },
      include: {
        provider: {
          select: { nombre: true, email: true },
        },
        workOrder: {
          select: { titulo: true, estado: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Calcular estadísticas
    const stats = {
      borradores: quotes.filter(q => q.estado === 'borrador').length,
      enviados: quotes.filter(q => q.estado === 'pendiente').length,
      aprobados: quotes.filter(q => q.estado === 'aprobado').length,
      rechazados: quotes.filter(q => q.estado === 'rechazado').length,
      facturados: quotes.filter(q => q.estado === 'facturado').length,
      valorTotal: quotes.reduce((sum, q) => sum + (q.total || 0), 0),
      valorAprobado: quotes
        .filter(q => q.estado === 'aprobado')
        .reduce((sum, q) => sum + (q.total || 0), 0),
    };

    return NextResponse.json({
      budgets: quotes,
      total: quotes.length,
      stats,
    });
  } catch (error) {
    logger.error('[API Error] GET /api/budgets:', error);
    return NextResponse.json({
      budgets: [],
      total: 0,
      stats: {
        borradores: 0,
        enviados: 0,
        aprobados: 0,
        rechazados: 0,
        facturados: 0,
        valorTotal: 0,
        valorAprobado: 0,
      },
      success: false,
      error: 'Error al obtener presupuestos',
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json();
    
    // Validate required fields
    if (!body.titulo || !body.items || body.items.length === 0) {
      return NextResponse.json(
        { error: 'El título y al menos un ítem son requeridos' },
        { status: 400 }
      );
    }

    if (!body.providerId) {
      return NextResponse.json(
        { error: 'Se requiere un proveedor' },
        { status: 400 }
      );
    }

    // Calculate totals
    const subtotal = body.items.reduce((sum: number, item: any) => sum + (item.total || 0), 0);
    const ivaRate = body.ivaRate || 21;
    const montoIva = subtotal * (ivaRate / 100);
    const total = subtotal + montoIva;

    // Create provider quote in database
    const newQuote = await prisma.providerQuote.create({
      data: {
        companyId: session.user.companyId,
        providerId: body.providerId,
        workOrderId: body.workOrderId || null,
        titulo: body.titulo,
        descripcion: body.descripcion || '',
        conceptos: body.items, // JSON array
        subtotal,
        iva: ivaRate,
        montoIva,
        total,
        estado: 'pendiente',
        fechaVencimiento: body.validezDias 
          ? new Date(Date.now() + body.validezDias * 24 * 60 * 60 * 1000)
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        notas: body.notas || null,
      },
      include: {
        provider: {
          select: { nombre: true, email: true },
        },
      },
    });

    return NextResponse.json(newQuote, { status: 201 });
  } catch (error) {
    logger.error('[API Error] POST /api/budgets:', error);
    return NextResponse.json(
      { error: 'Error al crear presupuesto' },
      { status: 500 }
    );
  }
}
