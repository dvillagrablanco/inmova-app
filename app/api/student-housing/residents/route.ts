/**
 * API: Student Housing Residents
 * GET /api/student-housing/residents - Lista residentes
 * POST /api/student-housing/residents - Crear residente
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { StudentHousingService } from '@/lib/services/student-housing-service';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const createResidentSchema = z.object({
  nombre: z.string().min(1),
  apellidos: z.string().min(1),
  email: z.string().email(),
  telefono: z.string().optional(),
  dni: z.string().optional(),
  universidad: z.string().optional(),
  carrera: z.string().optional(),
  curso: z.number().optional(),
  estado: z.enum(['activo', 'inactivo', 'pendiente', 'reserva']).optional(),
  becado: z.boolean().optional(),
  contactoEmergencia: z.object({
    nombre: z.string(),
    telefono: z.string(),
    relacion: z.string()
  }).optional()
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filters = {
      estado: searchParams.get('estado') || undefined,
      edificio: searchParams.get('edificio') || undefined,
      search: searchParams.get('search') || undefined,
    };

    const residents = await StudentHousingService.getResidents(session.user.companyId, filters);

    return NextResponse.json({
      success: true,
      data: residents
    });
  } catch (error: any) {
    logger.error('[Student Housing Residents GET Error]:', error);
    return NextResponse.json(
      { error: 'Error obteniendo residentes', message: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const validated = createResidentSchema.parse(body);

    const resident = await StudentHousingService.createResident({
      ...validated,
      companyId: session.user.companyId
    });

    return NextResponse.json({
      success: true,
      data: resident,
      message: 'Residente creado correctamente'
    }, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }
    logger.error('[Student Housing Residents POST Error]:', error);
    return NextResponse.json(
      { error: 'Error creando residente', message: error.message },
      { status: 500 }
    );
  }
}
