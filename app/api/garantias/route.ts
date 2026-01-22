import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface GarantiaFromContract {
  id: string;
  tipo: 'fianza' | 'deposito';
  inquilinoId: string;
  inquilinoNombre: string;
  propiedadId: string;
  propiedadNombre: string;
  contratoId: string;
  monto: number;
  montoMensualidades: number;
  fechaConstitucion: string;
  fechaVencimiento: string | null;
  estado: 'activa' | 'liberada' | 'pendiente';
  observaciones?: string;
  renovacionAutomatica: boolean;
  alertasActivas: boolean;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const companyId = (session.user as any).companyId;
    if (!companyId) {
      return NextResponse.json({ error: 'Sin empresa asociada' }, { status: 403 });
    }

    // Obtener contratos con depósitos (que actúan como garantías)
    const contracts = await prisma.contract.findMany({
      where: {
        unit: {
          building: {
            companyId,
          },
        },
        isDemo: false,
        deposito: { gt: 0 }, // Solo contratos con depósito
      },
      include: {
        tenant: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
          },
        },
        unit: {
          select: {
            id: true,
            nombre: true,
            rentaMensual: true,
            building: {
              select: {
                nombre: true,
              },
            },
          },
        },
      },
      orderBy: {
        fechaInicio: 'desc',
      },
    });

    // Transformar contratos a formato de garantías
    const garantias: GarantiaFromContract[] = contracts.map((contract) => {
      const nombreCompleto = `${contract.tenant.nombre} ${contract.tenant.apellido || ''}`.trim();
      const propiedadNombre = contract.unit.building?.nombre 
        ? `${contract.unit.nombre}, ${contract.unit.building.nombre}`
        : contract.unit.nombre;

      // Determinar estado basado en el estado del contrato
      let estado: 'activa' | 'liberada' | 'pendiente' = 'activa';
      if (contract.estado === 'finalizado' || contract.estado === 'cancelado') {
        estado = 'liberada';
      } else if (contract.estado === 'pendiente') {
        estado = 'pendiente';
      }

      return {
        id: `garantia-${contract.id}`,
        tipo: 'fianza',
        inquilinoId: contract.tenantId,
        inquilinoNombre: nombreCompleto,
        propiedadId: contract.unitId,
        propiedadNombre,
        contratoId: contract.id,
        monto: contract.deposito,
        montoMensualidades: contract.mesesFianza,
        fechaConstitucion: contract.fechaInicio.toISOString().split('T')[0],
        fechaVencimiento: contract.fechaFin?.toISOString().split('T')[0] || null,
        estado,
        observaciones: `Depósito del contrato - ${contract.mesesFianza} ${contract.mesesFianza === 1 ? 'mes' : 'meses'} de fianza`,
        renovacionAutomatica: contract.renovacionAutomatica,
        alertasActivas: contract.estado === 'activo',
      };
    });

    // Calcular estadísticas
    const garantiasActivas = garantias.filter(g => g.estado === 'activa');
    const garantiasPendientes = garantias.filter(g => g.estado === 'pendiente');
    const garantiasLiberadas = garantias.filter(g => g.estado === 'liberada');

    const now = new Date();
    const in60Days = new Date();
    in60Days.setDate(in60Days.getDate() + 60);

    const proximasAVencer = garantias.filter(g => {
      if (!g.fechaVencimiento) return false;
      const vencimiento = new Date(g.fechaVencimiento);
      return vencimiento >= now && vencimiento <= in60Days;
    });

    const montoTotalGarantizado = garantiasActivas.reduce((sum, g) => sum + g.monto, 0);

    // Agrupar por tipo (en este caso solo tenemos fianzas de contratos)
    const porTipo = [
      { 
        tipo: 'Fianza', 
        cantidad: garantias.filter(g => g.tipo === 'fianza').length,
        monto: garantias.filter(g => g.tipo === 'fianza').reduce((sum, g) => sum + g.monto, 0)
      },
    ];

    return NextResponse.json({
      garantias,
      stats: {
        totalGarantias: garantias.length,
        garantiasActivas: garantiasActivas.length,
        garantiasVencidas: 0, // Las fianzas de contrato no "vencen" como tal
        garantiasPendientes: garantiasPendientes.length,
        montoTotalGarantizado,
        proximasAVencer: proximasAVencer.length,
        porTipo,
      },
    });
  } catch (error) {
    logger.error('Error fetching garantias:', error);
    return NextResponse.json({ error: 'Error al obtener garantías' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json();
    
    // Por ahora, las garantías se crean actualizando el depósito del contrato
    // En una implementación más completa, tendríamos un modelo Warranty separado
    
    return NextResponse.json({ 
      message: 'Las garantías se gestionan a través de los contratos. Actualice el depósito del contrato correspondiente.',
      success: false
    }, { status: 400 });
  } catch (error) {
    logger.error('Error creating garantia:', error);
    return NextResponse.json({ error: 'Error al crear garantía' }, { status: 500 });
  }
}
