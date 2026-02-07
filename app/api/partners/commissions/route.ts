import { NextRequest, NextResponse } from 'next/server';
import logger from '@/lib/logger';
import { prisma } from '@/lib/db';
import jwt from 'jsonwebtoken';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const JWT_SECRET = process.env.NEXTAUTH_SECRET;
// Función para verificar el token
function verifyToken(request: NextRequest) {
  if (!JWT_SECRET) {
    return null;
  }
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.substring(7);
  try {
    return jwt.verify(token, JWT_SECRET) as any;
  } catch {
    return null;
  }
}
// GET /api/partners/commissions - Listar comisiones del Partner
export async function GET(request: NextRequest) {
  try {
    if (!JWT_SECRET) {
      logger.error('NEXTAUTH_SECRET no configurado');
      return NextResponse.json(
        { error: 'Configuración del servidor inválida' },
        { status: 500 }
      );
    }

    // Verificar autenticación
    const decoded = verifyToken(request);
    if (!decoded || !decoded.partnerId) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }
    const partnerId = decoded.partnerId;
    const { searchParams } = new URL(request.url);
    const periodo = searchParams.get('periodo'); // Opcional: filtrar por periodo
    const where: any = { partnerId };
    if (periodo) {
      where.periodo = periodo;
    }
    
    const comisiones = await prisma.commission.findMany({
      where,
      include: {
        company: {
          select: {
            id: true,
            nombre: true,
          },
        },
      },
      orderBy: { periodo: 'desc' },
    });
    // Calcular totales por estado
    const totales = {
      pending: comisiones
        .filter(c => c.estado === 'PENDING')
        .reduce((sum, c) => sum + c.montoComision, 0),
      approved: comisiones
        .filter(c => c.estado === 'APPROVED')
        .reduce((sum, c) => sum + c.montoComision, 0),
      paid: comisiones
        .filter(c => c.estado === 'PAID')
        .reduce((sum, c) => sum + c.montoComision, 0),
      total: comisiones.reduce((sum, c) => sum + c.montoComision, 0),
    };
    return NextResponse.json({
      comisiones,
      totales,
    });
  } catch (error: unknown) {
    logger.error('Error obteniendo comisiones:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
