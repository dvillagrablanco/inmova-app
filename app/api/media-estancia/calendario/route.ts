import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { startOfMonth, endOfMonth, eachDayOfInterval, format, isWithinInterval, isSameDay } from 'date-fns';

import logger from '@/lib/logger';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Lazy Prisma (auditoria V2)
async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

type DayStatus = 'available' | 'occupied' | 'reserved' | 'blocked' | 'checkout' | 'checkin';

interface CalendarDay {
  date: string;
  status: DayStatus;
  occupancy?: {
    tenantName: string;
    contractId: string;
  };
}

interface PropertyCalendar {
  propertyId: string;
  propertyName: string;
  address: string;
  days: CalendarDay[];
}

export async function GET(request: NextRequest) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const companyId = (session.user as any).companyId;
    if (!companyId) {
      return NextResponse.json({ error: 'Sin empresa asociada' }, { status: 403 });
    }

    // Obtener parámetros
    const { searchParams } = new URL(request.url);
    const monthParam = searchParams.get('month');
    const yearParam = searchParams.get('year');
    const propertyId = searchParams.get('propertyId');

    // Determinar el mes a mostrar
    const currentDate = monthParam && yearParam 
      ? new Date(parseInt(yearParam), parseInt(monthParam) - 1, 1)
      : new Date();
    
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

    // Obtener unidades/propiedades con contratos de media estancia
    const units = await prisma.unit.findMany({
      where: {
        building: {
          companyId,
          isDemo: false,
        },
        isDemo: false,
        ...(propertyId && { id: propertyId }),
      },
      include: {
        building: {
          select: {
            id: true,
            nombre: true,
            direccion: true,
          },
        },
        contracts: {
          where: {
            isDemo: false,
            // Contratos que están activos o se solapan con el mes seleccionado
            OR: [
              {
                estado: 'activo',
              },
              {
                fechaFin: {
                  gte: monthStart,
                },
                fechaInicio: {
                  lte: monthEnd,
                },
              },
            ],
          },
          include: {
            tenant: {
              select: {
                id: true,
                nombreCompleto: true,
              },
            },
          },
        },
        tenant: {
          select: {
            id: true,
            nombreCompleto: true,
          },
        },
      },
      orderBy: { numero: 'asc' },
    });

    // Transformar a formato de calendario
    const calendars: PropertyCalendar[] = units.map((unit) => {
      const propertyName = `${unit.building.nombre} - ${unit.numero}`;
      const address = unit.building.direccion || '';

      // Calcular estado de cada día
      const days: CalendarDay[] = daysInMonth.map((day) => {
        let status: DayStatus = 'available';
        let occupancy: CalendarDay['occupancy'] = undefined;

        // Verificar contratos para este día
        for (const contract of unit.contracts) {
          const contractStart = new Date(contract.fechaInicio);
          const contractEnd = new Date(contract.fechaFin);

          // Verificar si el día está dentro del periodo del contrato
          if (
            isWithinInterval(day, { start: contractStart, end: contractEnd }) ||
            isSameDay(day, contractStart) ||
            isSameDay(day, contractEnd)
          ) {
            // Determinar el tipo de estado
            if (isSameDay(day, contractStart)) {
              status = 'checkin';
            } else if (isSameDay(day, contractEnd)) {
              status = 'checkout';
            } else {
              status = 'occupied';
            }

            occupancy = {
              tenantName: contract.tenant?.nombreCompleto || 'Sin inquilino',
              contractId: contract.id,
            };
            break;
          }
        }

        return {
          date: format(day, 'yyyy-MM-dd'),
          status,
          occupancy,
        };
      });

      return {
        propertyId: unit.id,
        propertyName,
        address,
        days,
      };
    });

    // Calcular estadísticas del mes
    const totalDays = daysInMonth.length * units.length;
    const occupiedDays = calendars.reduce((sum, cal) => 
      sum + cal.days.filter(d => ['occupied', 'checkin', 'checkout'].includes(d.status)).length
    , 0);
    const availableDays = totalDays - occupiedDays;
    const occupancyRate = totalDays > 0 ? Math.round((occupiedDays / totalDays) * 100) : 0;

    // Detectar huecos (días disponibles entre ocupaciones)
    let gaps = 0;
    calendars.forEach(cal => {
      let inOccupation = false;
      let gapStart = false;
      
      cal.days.forEach((day, i) => {
        if (day.status === 'occupied' || day.status === 'checkin') {
          if (gapStart) {
            gaps++;
          }
          inOccupation = true;
          gapStart = false;
        } else if (day.status === 'available' && inOccupation) {
          gapStart = true;
        } else if (day.status === 'checkout') {
          inOccupation = false;
        }
      });
    });

    return NextResponse.json({
      properties: calendars,
      stats: {
        totalDays,
        occupiedDays,
        availableDays,
        occupancyRate,
        gapsDetected: gaps,
        propertiesCount: units.length,
      },
      period: {
        month: currentDate.getMonth() + 1,
        year: currentDate.getFullYear(),
        monthName: format(currentDate, 'MMMM yyyy'),
      },
    });
  } catch (error) {
    logger.error('Error fetching calendar data:', error);
    return NextResponse.json({ error: 'Error al obtener datos del calendario' }, { status: 500 });
  }
}
