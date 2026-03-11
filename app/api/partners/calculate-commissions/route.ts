import { NextRequest, NextResponse } from 'next/server';
import logger from '@/lib/logger';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Lazy Prisma (auditoria V2)
async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

// Función para obtener la comisión según el número de clientes
function getCommissionRate(clientCount: number): number {
  if (clientCount >= 251) return 70.0;
  if (clientCount >= 101) return 60.0;
  if (clientCount >= 51) return 50.0;
  if (clientCount >= 26) return 40.0;
  if (clientCount >= 11) return 30.0;
  return 20.0;
}

type CommissionResult = {
  partnerId: string;
  partnerName: string;
  companyId: string;
  companyName: string;
  periodo: string;
  montoBruto: number;
  porcentaje: number;
  montoComision: number;
  commissionId: string;
};

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return 'Error desconocido';
}

// POST /api/partners/calculate-commissions - Calcular comisiones mensuales (CRON)
export async function POST(request: NextRequest) {
  const prisma = await getPrisma();
  try {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret) {
      if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
      }
    } else {
      logger.warn('CRON_SECRET no configurado. Ejecutando sin validación.');
    }

    const now = new Date();
    const periodo = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    logger.info(`Calculando comisiones para el periodo: ${periodo}`);
    // Obtener todos los Partners activos
    const partners = await prisma.partner.findMany({
      where: {
        activo: true,
        estado: 'ACTIVE',
      },
      include: {
        clientes: {
          where: {
            estado: 'activo',
          },
          include: {
            company: true,
          },
        },
      },
    });
    const results: CommissionResult[] = [];
    for (const partner of partners) {
      const clientesActivos = partner.clientes.length;
      if (clientesActivos === 0) {
        logger.info(`Partner ${partner.nombre} no tiene clientes activos.`);
        continue;
      }
      // Calcular porcentaje según escala
      const porcentajeComision = getCommissionRate(clientesActivos);
      // Precio base por cliente (Plan Profesional: 149€/mes)
      const precioPorCliente = 149.0;
      // Procesar cada cliente
      for (const cliente of partner.clientes) {
        // Verificar si ya existe comisión para este periodo
        const existingCommission = await prisma.commission.findUnique({
          where: {
            partnerId_companyId_periodo: {
              partnerId: partner.id,
              companyId: cliente.companyId,
              periodo,
            },
          },
        });
        if (existingCommission) {
          logger.info(`Comisión ya existe para ${cliente.company.nombre} en ${periodo}`);
          continue;
        }
        // Calcular comisión
        const montoBruto = precioPorCliente;
        const montoComision = (montoBruto * porcentajeComision) / 100;
        // Crear comisión
        const commission = await prisma.commission.create({
          data: {
            partnerId: partner.id,
            companyId: cliente.companyId,
            periodo,
            montoBruto,
            porcentaje: porcentajeComision,
            montoComision,
            planId: 'plan_profesional',
            planNombre: 'Plan Profesional',
            estado: 'PENDING',
            clientesActivos,
          },
        });
        // Actualizar PartnerClient
        await prisma.partnerClient.update({
          where: { id: cliente.id },
          data: {
            totalComisionGenerada: {
              increment: montoComision,
            },
            ultimaComisionFecha: now,
          },
        });
        results.push({
          partnerId: partner.id,
          partnerName: partner.nombre,
          companyId: cliente.companyId,
          companyName: cliente.company.nombre,
          periodo,
          montoBruto,
          porcentaje: porcentajeComision,
          montoComision,
          commissionId: commission.id,
        });
      }
    }
    return NextResponse.json({
      message: `Comisiones calculadas para ${results.length} clientes`,
      periodo,
      results,
    });
  } catch (error: unknown) {
    const message = getErrorMessage(error);
    logger.error('Error calculando comisiones:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', details: message },
      { status: 500 }
    );
  }
}
// GET /api/partners/calculate-commissions - Obtener información del último cálculo
export async function GET(request: NextRequest) {
  const prisma = await getPrisma();
  try {
    const now = new Date();
    const periodoActual = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const comisionesDelMes = await prisma.commission.findMany({
      where: { periodo: periodoActual },
      include: {
        partner: {
          select: {
            nombre: true,
          },
        },
        company: {
          select: {
            nombre: true,
          },
        },
      },
    });
    const totalComisiones = comisionesDelMes.reduce((sum, c) => sum + c.montoComision, 0);
    return NextResponse.json({
      periodo: periodoActual,
      totalComisiones: comisionesDelMes.length,
      montoTotal: totalComisiones.toFixed(2),
      comisiones: comisionesDelMes,
    });
  } catch (error: unknown) {
    const message = getErrorMessage(error);
    logger.error('Error obteniendo información de comisiones:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', details: message },
      { status: 500 }
    );
  }
}
