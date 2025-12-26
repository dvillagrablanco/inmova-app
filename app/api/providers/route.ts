/**
 * Endpoints API para Proveedores
 *
 * Implementa operaciones CRUD con validación Zod, manejo de errores
 * y códigos de estado HTTP correctos.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requirePermission, forbiddenResponse } from '@/lib/permissions';
import { prisma } from '@/lib/db';
import logger from '@/lib/logger';
import { providerCreateSchema } from '@/lib/validations';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

/**
 * GET /api/providers
 * Obtiene todos los proveedores con filtros opcionales
 */
export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(req.url);

    const tipo = searchParams.get('tipo');
    const search = searchParams.get('search');

    const where: any = { companyId: user.companyId };

    if (tipo) {
      where.tipo = tipo;
    }

    if (search) {
      where.OR = [
        { nombre: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { telefono: { contains: search } },
      ];
    }

    const providers = await prisma.provider.findMany({
      where,
      include: {
        _count: {
          select: {
            maintenanceRequests: true,
            expenses: true,
          },
        },
      },
      orderBy: { nombre: 'asc' },
    });

    logger.info(`Proveedores obtenidos: ${providers.length}`, { userId: user.id });
    return NextResponse.json(providers, { status: 200 });
  } catch (error: any) {
    logger.error('Error fetching providers:', error);

    if (error.message === 'No autenticado') {
      return NextResponse.json(
        { error: 'No autenticado', message: 'Debe iniciar sesión' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Error interno del servidor', message: 'Error al obtener proveedores' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/providers
 * Crea un nuevo proveedor con validación Zod
 */
export async function POST(req: NextRequest) {
  try {
    const user = await requirePermission('create');
    const body = await req.json();

    // Validación con Zod
    const validatedData = providerCreateSchema.parse(body);

    // Verificar si ya existe un proveedor con el mismo email
    if (validatedData.email) {
      const existingEmail = await prisma.provider.findFirst({
        where: {
          companyId: user.companyId,
          email: validatedData.email,
        },
      });

      if (existingEmail) {
        return NextResponse.json(
          { error: 'Proveedor duplicado', message: 'Ya existe un proveedor con este email' },
          { status: 409 }
        );
      }
    }

    const provider = await prisma.provider.create({
      data: {
        companyId: user.companyId,
        nombre: validatedData.nombre,
        email: validatedData.email,
        telefono: validatedData.telefono,
        direccion: validatedData.direccion,
        tipo: validatedData.tipo,
        notas: validatedData.notas,
        rating: validatedData.rating,
      } as any,
    });

    logger.info(`Proveedor creado: ${provider.id}`, { userId: user.id, providerId: provider.id });
    return NextResponse.json(provider, { status: 201 });
  } catch (error: any) {
    logger.error('Error creating provider:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Validación fallida',
          message: 'Los datos proporcionados no son válidos',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    if (error.message?.includes('permiso')) {
      return NextResponse.json({ error: 'Prohibido', message: error.message }, { status: 403 });
    }

    if (error.message === 'No autenticado') {
      return NextResponse.json(
        { error: 'No autenticado', message: 'Debe iniciar sesión' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Error interno del servidor', message: 'Error al crear proveedor' },
      { status: 500 }
    );
  }
}
