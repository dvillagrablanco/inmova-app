import { NextRequest, NextResponse } from 'next/server';
import logger from '@/lib/logger';
import { prisma } from '@/lib/db';
import jwt from 'jsonwebtoken';

export const dynamic = 'force-dynamic';
const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'your-secret-key-partners';
// Función para verificar el token
function verifyToken(request: NextRequest) {
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
// GET /api/partners/dashboard - Dashboard con métricas del Partner
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    const decoded = verifyToken(request);
    if (!decoded || !decoded.partnerId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    const partnerId = decoded.partnerId;
    // Obtener Partner
    const partner = await prisma.partner.findUnique({
      where: { id: partnerId },
      select: {
        id: true,
        nombre: true,
        razonSocial: true,
        tipo: true,
        comisionPorcentaje: true,
        estado: true,
        createdAt: true,
        logo: true,
      },
    });
    if (!partner) {
      return NextResponse.json({ error: 'Partner no encontrado' }, { status: 404 });
    }
    // Obtener clientes activos
    const clientes = await prisma.partnerClient.findMany({
      where: {
        partnerId,
        estado: 'activo',
      },
      include: {
        company: {
          select: {
            id: true,
            nombre: true,
            email: true,
            createdAt: true,
          },
        },
      },
    });
    // Obtener comisiones
    const comisiones = await prisma.commission.findMany({
      where: { partnerId },
      orderBy: { periodo: 'desc' },
      take: 6, // Últimos 6 meses
    });
    // Calcular totales
    const totalClientes = clientes.length;
    const totalComisionMes = comisiones
      .filter((c) => {
        const now = new Date();
        const [year, month] = c.periodo.split('-');
        return (
          year === now.getFullYear().toString() &&
          month === (now.getMonth() + 1).toString().padStart(2, '0')
        );
      })
      .reduce((sum, c) => sum + c.montoComision, 0);

    const totalComisionHistorica = comisiones
      .filter((c) => c.estado === 'PAID')
      .reduce((sum, c) => sum + c.montoComision, 0);
    const totalPendientePago = comisiones
      .filter((c) => c.estado === 'APPROVED')
      .reduce((sum, c) => sum + c.montoComision, 0);
    // Obtener invitaciones
    const invitaciones = await prisma.partnerInvitation.findMany({
      where: { partnerId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
    const invitacionesPendientes = invitaciones.filter((i) => i.estado === 'PENDING').length;
    const invitacionesAceptadas = invitaciones.filter((i) => i.estado === 'ACCEPTED').length;
    return NextResponse.json({
      partner,
      metrics: {
        totalClientes,
        totalComisionMes: totalComisionMes.toFixed(2),
        totalComisionHistorica: totalComisionHistorica.toFixed(2),
        totalPendientePago: totalPendientePago.toFixed(2),
        invitacionesPendientes,
        invitacionesAceptadas,
        tasaConversion:
          invitaciones.length > 0
            ? ((invitacionesAceptadas / invitaciones.length) * 100).toFixed(1)
            : '0',
      },
      clientes,
      comisiones,
      invitacionesRecientes: invitaciones,
    });
  } catch (error: any) {
    logger.error('Error obteniendo dashboard de Partner:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error?.message },
      { status: 500 }
    );
  }
}
