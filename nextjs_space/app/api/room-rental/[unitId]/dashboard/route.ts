import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { unitId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { unitId } = params;

    // Obtener información de la unidad
    const unit = await prisma.unit.findUnique({
      where: { id: unitId },
      select: {
        id: true,
        numero: true,
        building: {
          select: {
            nombre: true,
            direccion: true
          }
        }
      }
    });

    if (!unit) {
      return NextResponse.json({ error: 'Unidad no encontrada' }, { status: 404 });
    }

    // Obtener habitaciones con su información
    const rooms = await prisma.room.findMany({
      where: { unitId },
      include: {
        contracts: {
          include: {
            tenant: {
              select: {
                nombreCompleto: true,
                email: true
              }
            }
          },
          where: {
            fechaFin: {
              gte: new Date()
            }
          },
          orderBy: {
            fechaInicio: 'desc'
          },
          take: 1
        }
      },
      orderBy: { numero: 'asc' }
    });

    // Calcular estadísticas
    const totalRooms = rooms.length;
    const occupiedRooms = rooms.filter((r: any) => r.estado === 'ocupada').length;
    const availableRooms = totalRooms - occupiedRooms;
    const totalTenants = rooms.filter((r: any) => r.contracts && r.contracts.length > 0).length;
    const occupancyRate = totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0;
    const monthlyRevenue = rooms.reduce((sum: number, r: any) => sum + (r.precioPorMes || 0), 0);
    const averageRoomPrice = totalRooms > 0 ? monthlyRevenue / totalRooms : 0;

    // Calcular próximas salidas (contratos que terminan en los próximos 30 días)
    const today = new Date();
    const next30Days = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    const upcomingCheckouts = rooms.filter((r: any) => {
      if (!r.contracts || r.contracts.length === 0) return false;
      const contract = r.contracts[0];
      if (!contract.fechaFin) return false;
      const endDate = new Date(contract.fechaFin);
      return endDate >= today && endDate <= next30Days;
    }).length;

    // Preparar vista general de habitaciones
    const roomsOverview = rooms.map((room: any) => {
      const contract = room.contracts && room.contracts.length > 0 ? room.contracts[0] : null;
      let diasRestantes = null;
      if (contract?.fechaFin) {
        const endDate = new Date(contract.fechaFin);
        const diff = endDate.getTime() - today.getTime();
        diasRestantes = Math.ceil(diff / (1000 * 60 * 60 * 24));
      }

      return {
        roomId: room.id,
        numero: room.numero,
        superficie: room.superficie || 0,
        precio: room.precioPorMes || 0,
        estado: room.estado,
        tenantName: contract?.tenant?.nombreCompleto || null,
        tenantEmail: contract?.tenant?.email || null,
        contratoFin: contract?.fechaFin || null,
        numOcupantes: contract ? 1 : 0, // Assuming 1 tenant per room contract
        diasRestantes
      };
    });

    // Obtener pagos recientes (últimos 5 de habitaciones)
    // Note: Payment model needs adjustment or we'll skip this for now
    const recentPayments: any[] = [];
    
    const recentPaymentsFormatted = recentPayments.map((p: any) => ({
      id: p.id,
      monto: p.monto,
      fecha: p.fechaPago?.toISOString() || new Date().toISOString(),
      tenantName: p.tenant?.nombre || 'Desconocido',
      roomNumero: p.room?.numero || '-'
    }));

    // Obtener resumen de gastos compartidos del mes actual
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const expenses = await prisma.expense.findMany({
      where: {
        building: {
          units: {
            some: { id: unitId }
          }
        },
        fecha: {
          gte: firstDayOfMonth,
          lte: lastDayOfMonth
        },
        categoria: 'servicios'
      }
    });

    // Calcular totales por tipo de gasto
    const expensesSummary = {
      electricidad: expenses
        .filter((e: any) => e.descripcion?.toLowerCase().includes('electricidad') || e.descripcion?.toLowerCase().includes('luz'))
        .reduce((sum: number, e: any) => sum + e.monto, 0),
      agua: expenses
        .filter((e: any) => e.descripcion?.toLowerCase().includes('agua'))
        .reduce((sum: number, e: any) => sum + e.monto, 0),
      gas: expenses
        .filter((e: any) => e.descripcion?.toLowerCase().includes('gas'))
        .reduce((sum: number, e: any) => sum + e.monto, 0),
      internet: expenses
        .filter((e: any) => e.descripcion?.toLowerCase().includes('internet') || e.descripcion?.toLowerCase().includes('wifi'))
        .reduce((sum: number, e: any) => sum + e.monto, 0),
      limpieza: expenses
        .filter((e: any) => e.categoria === 'limpieza')
        .reduce((sum: number, e: any) => sum + e.monto, 0),
      total: 0
    };

    expensesSummary.total = 
      expensesSummary.electricidad +
      expensesSummary.agua +
      expensesSummary.gas +
      expensesSummary.internet +
      expensesSummary.limpieza;

    return NextResponse.json({
      unit: {
        id: unit.id,
        nombre: `${unit.building?.nombre || 'Unidad'} - ${unit.numero}`,
        direccion: unit.building?.direccion || ''
      },
      stats: {
        totalRooms,
        occupiedRooms,
        availableRooms,
        totalTenants,
        occupancyRate,
        monthlyRevenue,
        averageRoomPrice,
        upcomingCheckouts
      },
      roomsOverview,
      recentPayments: recentPaymentsFormatted,
      expensesSummary
    });
  } catch (error) {
    console.error('Error fetching co-living dashboard:', error);
    return NextResponse.json(
      { error: 'Error al obtener dashboard' },
      { status: 500 }
    );
  }
}
