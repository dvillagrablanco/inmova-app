import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

import logger from '@/lib/logger';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// In production, this would come from the database
// For now, returning empty array (no fictitious data per cursorrules)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Return empty array - no fictitious data
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
    });
  } catch (error) {
    logger.error('[API Error] GET /api/budgets:', error);
    return NextResponse.json(
      { error: 'Error al obtener presupuestos' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
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

    // Calculate totals
    const subtotal = body.items.reduce((sum: number, item: any) => sum + (item.total || 0), 0);
    const ivaRate = body.ivaRate || 21;
    const ivaAmount = subtotal * (ivaRate / 100);
    const total = subtotal + ivaAmount;

    // Generate budget number
    const year = new Date().getFullYear();
    const budgetNumber = `PRES-${year}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;

    // Create budget object (in production, save to database)
    const newBudget = {
      id: `budget_${Date.now()}`,
      numero: budgetNumber,
      titulo: body.titulo,
      descripcion: body.descripcion || '',
      tipo: body.tipo || 'mantenimiento',
      estado: 'borrador',
      propiedadId: body.propiedadId,
      clienteNombre: body.clienteNombre,
      proveedorNombre: body.proveedorNombre,
      fechaCreacion: new Date().toISOString(),
      fechaValidez: new Date(Date.now() + (body.validezDias || 30) * 24 * 60 * 60 * 1000).toISOString(),
      items: body.items,
      subtotal,
      iva: ivaAmount,
      ivaRate,
      total,
      notas: body.notas || '',
      createdBy: session.user?.id,
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json(newBudget, { status: 201 });
  } catch (error) {
    logger.error('[API Error] POST /api/budgets:', error);
    return NextResponse.json(
      { error: 'Error al crear presupuesto' },
      { status: 500 }
    );
  }
}
