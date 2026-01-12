import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { startOfMonth, endOfMonth, eachDayOfInterval, isWithinInterval, differenceInDays, parseISO } from 'date-fns';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

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
    const { searchParams } = new URL(request.url);
    const monthParam = searchParams.get('month') || new Date().toISOString().slice(0, 7);

    // Parse month (format: YYYY-MM)
    const [year, month] = monthParam.split('-').map(Number);
    const periodStart = startOfMonth(new Date(year, month - 1));
    const periodEnd = endOfMonth(new Date(year, month - 1));

    // Obtener información de la unidad
    const unit = await prisma.unit.findUnique({
      where: { id: unitId },
      select: {
        id: true,
        numero: true,
        building: {
          select: {
            nombre: true
          }
        }
      }
    });

    if (!unit) {
      return NextResponse.json({ error: 'Unidad no encontrada' }, { status: 404 });
    }

    // Obtener habitaciones
    const rooms = await prisma.room.findMany({
      where: { unitId },
      include: {
        contracts: {
          include: {
            tenant: {
              select: {
                nombreCompleto: true
              }
            }
          }
        }
      },
      orderBy: { numero: 'asc' }
    });

    // Calcular días del período
    const daysInPeriod = eachDayOfInterval({ start: periodStart, end: periodEnd });
    const totalDays = daysInPeriod.length;

    // Calcular datos por habitación
    const roomsData = rooms.map((room: any) => {
      let daysOccupied = 0;
      let revenue = 0;
      let activeContract = null;

      // Find the most recent active contract in the period
      if (room.contracts && room.contracts.length > 0) {
        for (const contract of room.contracts) {
          if (contract.fechaInicio && contract.fechaFin) {
            const contractStart = new Date(contract.fechaInicio);
            const contractEnd = new Date(contract.fechaFin);
            
            // Check if contract overlaps with period
            if (contractStart <= periodEnd && contractEnd >= periodStart) {
              activeContract = contract;
              
              // Calcular cuántos días del período estuvo ocupada
              const occupiedDays = daysInPeriod.filter(day => 
                isWithinInterval(day, { start: contractStart, end: contractEnd })
              ).length;
              
              daysOccupied += occupiedDays;
            }
          }
        }

        // Calcular ingresos proporcionales
        if (room.rentaMensual && daysOccupied > 0) {
          revenue = (room.rentaMensual / 30) * daysOccupied; // Aproximación simple
        }
      }

      const occupancyRate = totalDays > 0 ? (daysOccupied / totalDays) * 100 : 0;

      return {
        roomId: room.id,
        numero: room.numero,
        superficie: room.superficie || 0,
        precio: room.rentaMensual || 0,
        occupancyRate,
        daysOccupied,
        revenue,
        tenantName: activeContract?.tenant?.nombreCompleto || null,
        checkInDate: activeContract?.fechaInicio?.toISOString() || null,
        checkOutDate: activeContract?.fechaFin?.toISOString() || null
      };
    });

    // Calcular resumen
    const totalOccupiedDays = roomsData.reduce((sum: number, r: any) => sum + r.daysOccupied, 0);
    const totalAvailableDays = totalDays * rooms.length;
    const averageOccupancyRate = totalAvailableDays > 0 
      ? (totalOccupiedDays / totalAvailableDays) * 100 
      : 0;
    const totalRevenue = roomsData.reduce((sum: number, r: any) => sum + r.revenue, 0);
    const avgRevPerRoom = rooms.length > 0 ? totalRevenue / rooms.length : 0;

    // Crear línea de tiempo
    const timeline = daysInPeriod.map(day => {
      let occupiedRooms = 0;
      let dailyRevenue = 0;

      rooms.forEach((room: any) => {
        if (room.contracts && room.contracts.length > 0) {
          for (const contract of room.contracts) {
            if (contract.fechaInicio && contract.fechaFin) {
              const contractStart = new Date(contract.fechaInicio);
              const contractEnd = new Date(contract.fechaFin);

              if (isWithinInterval(day, { start: contractStart, end: contractEnd })) {
                occupiedRooms++;
                if (room.rentaMensual) {
                  dailyRevenue += room.rentaMensual / 30;
                }
                break; // Only count once per room
              }
            }
          }
        }
      });

      return {
        date: day.toISOString(),
        occupiedRooms,
        revenue: dailyRevenue
      };
    });

    return NextResponse.json({
      unit: {
        id: unit.id,
        nombre: `${unit.building?.nombre || 'Unidad'} - ${unit.numero}`
      },
      period: {
        start: periodStart.toISOString(),
        end: periodEnd.toISOString()
      },
      summary: {
        averageOccupancyRate,
        totalRevenue,
        totalOccupiedDays,
        totalAvailableDays,
        avgRevPerRoom
      },
      roomsData,
      timeline
    });
  } catch (error) {
    logger.error('Error generating occupancy report:', error);
    return NextResponse.json(
      { error: 'Error al generar reporte' },
      { status: 500 }
    );
  }
}
