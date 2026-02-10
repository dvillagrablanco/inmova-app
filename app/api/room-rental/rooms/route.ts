import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { getAvailableRooms } from '@/lib/room-rental-service';
import logger from '@/lib/logger';
import { 
  selectUnitMinimal, 
  selectBuildingMinimal, 
  selectRoomContractMinimal, 
  selectTenantMinimal 
} from '@/lib/query-optimizer';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/room-rental/rooms
 * Obtiene todas las habitaciones (con filtros opcionales)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Resolver companyId con soporte multi-empresa (cookie > JWT)
    const cookieCompanyId = request.cookies.get('activeCompanyId')?.value;
    const __resolvedCompanyId = cookieCompanyId || session.user.companyId;
    if (!__resolvedCompanyId) {
      return NextResponse.json({ error: 'Empresa no definida' }, { status: 400 });
    }
    // Inyectar companyId resuelto en session para compatibilidad
    (session.user as any).companyId = __resolvedCompanyId;, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const unitId = searchParams.get('unitId');
    const estado = searchParams.get('estado');
    const availableOnly = searchParams.get('availableOnly') === 'true';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Si se solicitan habitaciones disponibles con fechas
    if (availableOnly && unitId) {
      const available = await getAvailableRooms(
        unitId,
        session.user.companyId,
        startDate ? new Date(startDate) : undefined,
        endDate ? new Date(endDate) : undefined
      );
      return NextResponse.json(available);
    }

    // Consulta normal
    const whereClause: any = {
      companyId: session.user.companyId,
    };

    if (unitId) whereClause.unitId = unitId;
    if (estado) whereClause.estado = estado;

    // OPTIMIZADO - Semana 2: Query Optimization
    // Usa select minimal en includes para reducir payload 60-70%
    const rooms = await prisma.room.findMany({
      where: whereClause,
      select: {
        id: true,
        numero: true,
        superficie: true,
        rentaMensual: true,
        estado: true,
        tieneBalcon: true,
        banoPrivado: true,
        amueblada: true,
        descripcion: true,
        imagenes: true,
        unitId: true,
        companyId: true,
        createdAt: true,
        unit: {
          select: {
            ...selectUnitMinimal,
            building: {
              select: selectBuildingMinimal,
            },
          },
        },
        contracts: {
          where: { estado: 'activo' },
          select: {
            ...selectRoomContractMinimal,
            tenant: {
              select: selectTenantMinimal,
            },
          },
        },
      },
      orderBy: {
        numero: 'asc',
      },
    });

    return NextResponse.json(rooms);
  } catch (error: any) {
    logger.error('Error fetching rooms:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/room-rental/rooms
 * Crea una nueva habitación
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const data = await request.json();

    // Validaciones
    if (!data.unitId || !data.numero || !data.superficie || !data.rentaMensual) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }

    const room = await prisma.room.create({
      data: {
        companyId: session.user.companyId,
        unitId: data.unitId,
        numero: data.numero,
        nombre: data.nombre,
        superficie: parseFloat(data.superficie),
        tipoHabitacion: data.tipoHabitacion || 'individual',
        banoPrivado: data.banoPrivado || false,
        tieneBalcon: data.tieneBalcon || false,
        escritorio: data.escritorio || false,
        armarioEmpotrado: data.armarioEmpotrado || false,
        aireAcondicionado: data.aireAcondicionado || false,
        calefaccion: data.calefaccion || false,
        amueblada: data.amueblada ?? true,
        cama: data.cama,
        mesaNoche: data.mesaNoche || false,
        cajonera: data.cajonera || false,
        estanteria: data.estanteria || false,
        silla: data.silla || false,
        rentaMensual: parseFloat(data.rentaMensual),
        precioPorSemana: data.precioPorSemana ? parseFloat(data.precioPorSemana) : null,
        estado: data.estado || 'disponible',
        imagenes: data.imagenes || [],
        descripcion: data.descripcion,
      },
      include: {
        unit: {
          include: {
            building: true,
          },
        },
      },
    });

    return NextResponse.json(room, { status: 201 });
  } catch (error: any) {
    logger.error('Error creating room:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
