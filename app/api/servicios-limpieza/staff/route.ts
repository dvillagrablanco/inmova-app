/**
 * API Endpoint: Personal de Limpieza
 * 
 * GET /api/servicios-limpieza/staff - Listar personal
 * POST /api/servicios-limpieza/staff - Crear personal
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { z } from 'zod';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const createStaffSchema = z.object({
  nombre: z.string().min(2),
  email: z.string().email().optional(),
  telefono: z.string().min(6),
  foto: z.string().url().optional(),
  tipo: z.enum(['interno', 'externo', 'empresa']).default('interno'),
  empresaNombre: z.string().optional(),
  diasDisponibles: z.array(z.number().int().min(0).max(6)).default([1, 2, 3, 4, 5]),
  horaInicio: z.string().default('08:00'),
  horaFin: z.string().default('18:00'),
  tarifaPorHora: z.number().positive().optional(),
  tarifaPorTurnover: z.number().positive().optional(),
  capacidadDiaria: z.number().int().positive().default(4),
});

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const cookieCompanyId = req.cookies.get('activeCompanyId')?.value;
    const companyId = cookieCompanyId || session.user.companyId;
    if (!companyId) {
      return NextResponse.json({ error: 'Company ID no encontrado' }, { status: 400 });
    }

    const { prisma } = await import('@/lib/db');

    const staff = await prisma.sTRHousekeepingStaff.findMany({
      where: { companyId },
      include: {
        _count: {
          select: { tasks: true },
        },
      },
      orderBy: { nombre: 'asc' },
    });

    return NextResponse.json({
      success: true,
      data: staff,
    });
  } catch (error: any) {
    logger.error('Error fetching cleaning staff:', error);
    return NextResponse.json({ error: 'Error al obtener personal' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const companyId = session.user.companyId;
    if (!companyId) {
      return NextResponse.json({ error: 'Company ID no encontrado' }, { status: 400 });
    }

    const body = await req.json();
    const validationResult = createStaffSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json({
        error: 'Datos inválidos',
        details: validationResult.error.errors,
      }, { status: 400 });
    }

    const data = validationResult.data;
    const { prisma } = await import('@/lib/db');

    const staffMember = await prisma.sTRHousekeepingStaff.create({
      data: {
        companyId,
        nombre: data.nombre,
        email: data.email,
        telefono: data.telefono,
        foto: data.foto,
        tipo: data.tipo,
        empresaNombre: data.empresaNombre,
        diasDisponibles: data.diasDisponibles,
        horaInicio: data.horaInicio,
        horaFin: data.horaFin,
        tarifaPorHora: data.tarifaPorHora,
        tarifaPorTurnover: data.tarifaPorTurnover,
        capacidadDiaria: data.capacidadDiaria,
        activo: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: staffMember,
      message: 'Personal de limpieza creado',
    }, { status: 201 });
  } catch (error: any) {
    logger.error('Error creating cleaning staff:', error);
    return NextResponse.json({ error: 'Error al crear personal' }, { status: 500 });
  }
}
