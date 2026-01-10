/**
 * API para gestionar llamadas de Retell AI
 * 
 * GET /api/admin/calls - Listar llamadas con filtros y paginación
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !['SUPERADMIN', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');
    const resultado = searchParams.get('resultado');
    const fechaDesde = searchParams.get('fechaDesde');
    const fechaHasta = searchParams.get('fechaHasta');
    const search = searchParams.get('search');

    const { getPrismaClient } = await import('@/lib/db');
    const prisma = getPrismaClient();

    // Construir filtros
    const where: Record<string, unknown> = {};

    if (status && status !== 'all') {
      where.status = status;
    }

    if (resultado && resultado !== 'all') {
      where.resultado = resultado;
    }

    if (fechaDesde) {
      where.startedAt = {
        ...(where.startedAt as object || {}),
        gte: new Date(fechaDesde),
      };
    }

    if (fechaHasta) {
      where.startedAt = {
        ...(where.startedAt as object || {}),
        lte: new Date(fechaHasta),
      };
    }

    if (search) {
      where.OR = [
        { fromNumber: { contains: search } },
        { transcriptText: { contains: search, mode: 'insensitive' } },
        { resumen: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Obtener total
    const total = await prisma.retellCall.count({ where });

    // Obtener llamadas
    const calls = await prisma.retellCall.findMany({
      where,
      include: {
        lead: {
          select: {
            id: true,
            nombre: true,
            apellidos: true,
            email: true,
            telefono: true,
            estado: true,
            temperatura: true,
          },
        },
        appointment: {
          select: {
            id: true,
            titulo: true,
            fechaInicio: true,
            estado: true,
          },
        },
      },
      orderBy: { startedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Calcular estadísticas
    const stats = await prisma.retellCall.groupBy({
      by: ['status'],
      _count: { id: true },
    });

    const resultadoStats = await prisma.retellCall.groupBy({
      by: ['resultado'],
      _count: { id: true },
      where: { resultado: { not: null } },
    });

    // Duración total de llamadas
    const duracionTotal = await prisma.retellCall.aggregate({
      _sum: { duracionSegundos: true },
      _avg: { duracionSegundos: true },
    });

    return NextResponse.json({
      success: true,
      data: calls,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      stats: {
        byStatus: stats.reduce((acc, s) => ({ ...acc, [s.status]: s._count.id }), {}),
        byResultado: resultadoStats.reduce((acc, r) => ({ 
          ...acc, 
          [r.resultado || 'sin_resultado']: r._count.id 
        }), {}),
        duracionTotal: duracionTotal._sum.duracionSegundos || 0,
        duracionPromedio: Math.round(duracionTotal._avg.duracionSegundos || 0),
      },
    });
  } catch (error: any) {
    console.error('[Admin Calls GET Error]:', error);
    return NextResponse.json({ error: 'Error obteniendo llamadas' }, { status: 500 });
  }
}
