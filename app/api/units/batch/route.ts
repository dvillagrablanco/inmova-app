/**
 * API Endpoint: Obtener múltiples unidades por ID
 * 
 * POST /api/units/batch
 * Body: { ids: string[] }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { z } from 'zod';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// ============================================================================
// VALIDACIÓN
// ============================================================================

const batchSchema = z.object({
  ids: z.array(z.string()).min(1).max(50),
});

// ============================================================================
// API ROUTE HANDLER
// ============================================================================

export async function POST(req: NextRequest) {
  try {
    // 1. Autenticación
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const companyId = session.user.companyId;
    const userRole = session.user.role;
    const isSuperAdmin = userRole === 'super_admin' || userRole === 'soporte';

    // 2. Validar body
    const body = await req.json();
    const validationResult = batchSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Datos inválidos',
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const { ids } = validationResult.data;

    // 3. Obtener unidades
    const { prisma } = await import('@/lib/db');

    const where: any = {
      id: { in: ids },
    };

    // Filtrar por empresa si no es super admin
    if (!isSuperAdmin && companyId) {
      where.building = {
        companyId,
      };
    }

    const units = await prisma.unit.findMany({
      where,
      select: {
        id: true,
        numero: true,
        tipo: true,
        estado: true,
        planta: true,
        superficie: true,
        habitaciones: true,
        banos: true,
        rentaMensual: true,
        amueblado: true,
        imagenes: true,
        createdAt: true,
        building: {
          select: {
            id: true,
            nombre: true,
            direccion: true,
            ascensor: true,
            garaje: true,
          },
        },
      },
    });

    // 4. Transformar datos
    const transformedUnits = units.map((unit) => ({
      ...unit,
      superficie: Number(unit.superficie || 0),
      rentaMensual: Number(unit.rentaMensual || 0),
      admiteMascotas: null,
      tieneGaraje: null,
      building: unit.building
        ? {
            id: unit.building.id,
            nombre: unit.building.nombre,
            direccion: unit.building.direccion,
            ciudad: null,
            codigoPostal: null,
            tieneAscensor: unit.building.ascensor ?? false,
            tieneParking: unit.building.garaje ?? false,
            cercaMetro: false,
            cercaAutobus: false,
          }
        : null,
    }));

    logger.info(`Batch fetch: ${transformedUnits.length}/${ids.length} units found`);

    // 5. Respuesta
    return NextResponse.json({
      success: true,
      data: transformedUnits,
      requested: ids.length,
      found: transformedUnits.length,
    });
  } catch (error: any) {
    logger.error('Error in batch units fetch:', error);
    return NextResponse.json(
      { error: 'Error al obtener unidades' },
      { status: 500 }
    );
  }
}
