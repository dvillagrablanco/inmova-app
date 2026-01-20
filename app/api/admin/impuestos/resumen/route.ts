import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

import logger from '@/lib/logger';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/admin/impuestos/resumen
 * Obtiene el resumen fiscal y obligaciones tributarias
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    if (!['super_admin', 'administrador'].includes(userRole)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const ejercicio = parseInt(searchParams.get('ejercicio') || String(new Date().getFullYear()));
    const tipoPersona = searchParams.get('tipoPersona') || 'fisica';

    // TODO: Obtener datos reales de la base de datos
    // Por ahora retornamos null/vacío para indicar que no hay datos registrados
    
    // Cuando no hay datos fiscales registrados
    return NextResponse.json({
      success: true,
      ejercicio,
      tipoPersona,
      resumenFiscal: null, // Sin datos de resumen fiscal
      obligaciones: [], // Sin obligaciones registradas
      propiedadesIBI: [], // Sin propiedades con IBI
      message: 'No hay datos fiscales registrados para este ejercicio. Añade tus obligaciones tributarias.',
    });
  } catch (error: any) {
    logger.error('[Impuestos Resumen Error]:', error);
    return NextResponse.json(
      { error: 'Error al obtener resumen fiscal' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/impuestos/resumen
 * Registrar una nueva obligación fiscal
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    if (!['super_admin', 'administrador'].includes(userRole)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const body = await request.json();
    const { modelo, fechaLimite, importe, observaciones, ejercicio, tipoPersona } = body;

    if (!modelo || !fechaLimite) {
      return NextResponse.json(
        { error: 'Modelo y fecha límite son requeridos' },
        { status: 400 }
      );
    }

    // TODO: Guardar en base de datos
    const nuevaObligacion = {
      id: `obl_${Date.now()}`,
      modelo,
      fechaLimite,
      importe: importe || null,
      observaciones: observaciones || '',
      ejercicio: ejercicio || new Date().getFullYear(),
      tipoPersona: tipoPersona || 'fisica',
      estado: 'pendiente',
      createdAt: new Date().toISOString(),
      createdBy: session.user.id,
    };

    return NextResponse.json({
      success: true,
      obligacion: nuevaObligacion,
      message: 'Obligación fiscal registrada correctamente',
    }, { status: 201 });
  } catch (error: any) {
    logger.error('[Impuestos Create Obligacion Error]:', error);
    return NextResponse.json(
      { error: 'Error al registrar obligación fiscal' },
      { status: 500 }
    );
  }
}
