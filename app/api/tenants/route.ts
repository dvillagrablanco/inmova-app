import { NextRequest, NextResponse } from 'next/server';

import { requireAuth, requirePermission, forbiddenResponse, badRequestResponse } from '@/lib/permissions';
import logger, { logError } from '@/lib/logger';
import { tenantCreateSchema } from '@/lib/validations';
import { resolveCompanyScope } from '@/lib/company-scope';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Lazy Prisma loading (auditoria 2026-02-11)
async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}


export async function GET(req: NextRequest) {
  const prisma = await getPrisma();
  try {
    const user = await requireAuth();
    const scope = await resolveCompanyScope({
      userId: user.id,
      role: user.role as any,
      primaryCompanyId: user.companyId,
      request: req,
    });

    // Obtener parámetros de paginación
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;
    if (!scope.activeCompanyId) {
      return NextResponse.json([]);
    }

    const whereClause =
      scope.scopeCompanyIds.length > 1
        ? { companyId: { in: scope.scopeCompanyIds } }
        : { companyId: scope.activeCompanyId };

    // Si no hay paginación solicitada, devolver todos (compatibilidad)
    const usePagination = searchParams.has('page') || searchParams.has('limit');

    if (!usePagination) {
      const tenants = await prisma.tenant.findMany({
        where: whereClause,
        include: {
          units: {
            include: {
              building: true,
            },
          },
          contracts: {
            where: { estado: 'activo' },
          },
          company: {
            select: { id: true, nombre: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: scope.scopeCompanyIds.length > 1 ? 100 : undefined,
      });
      return NextResponse.json(tenants);
    }

    // Paginación activada
    const [tenants, total] = await Promise.all([
      prisma.tenant.findMany({
        where: whereClause,
        include: {
          units: {
            include: {
              building: true,
            },
          },
          contracts: {
            where: { estado: 'activo' },
          },
          company: {
            select: { id: true, nombre: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.tenant.count({
        where: whereClause,
      }),
    ]);

    return NextResponse.json({
      data: tenants,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + limit < total,
      },
    });
  } catch (error: any) {
    if (error?.name === 'AuthError' || error?.statusCode === 401 || error?.statusCode === 403) { return NextResponse.json({ error: error.message }, { status: error.statusCode || 401 }); }
    const errorMessage = error?.message || 'Error desconocido';
    const errorStack = error?.stack || '';
    logger.error('Error fetching tenants:', { message: errorMessage, stack: errorStack.slice(0, 500) });
    
    if (errorMessage === 'No autenticado') {
      return NextResponse.json({ error: errorMessage }, { status: 401 });
    }
    if (errorMessage === 'Usuario inactivo') {
      return NextResponse.json({ error: errorMessage }, { status: 403 });
    }
    return NextResponse.json({ error: 'Error al obtener inquilinos', details: errorMessage }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const prisma = await getPrisma();
  try {
    const user = await requirePermission('create');
    const scope = await resolveCompanyScope({
      userId: user.id,
      role: user.role as any,
      primaryCompanyId: user.companyId,
      request: req,
    });

    if (!scope.activeCompanyId) {
      return NextResponse.json({ error: 'Empresa no definida' }, { status: 400 });
    }

    const body = await req.json();
    
    // Preparar datos: convertir nombre completo a nombre/apellidos si es necesario
    let dataToValidate = { ...body };
    
    // Si viene nombreCompleto o nombre contiene espacios y no hay apellidos
    const nombreCompleto = body.nombreCompleto || body.nombre;
    if (nombreCompleto && !body.apellidos) {
      const partes = nombreCompleto.trim().split(' ');
      if (partes.length >= 2) {
        // Si hay 2 o más palabras, la primera es nombre y el resto apellidos
        dataToValidate.nombre = partes[0];
        dataToValidate.apellidos = partes.slice(1).join(' ');
      } else {
        // Si solo hay una palabra, usarla para ambos
        dataToValidate.nombre = nombreCompleto;
        dataToValidate.apellidos = nombreCompleto;
      }
    }
    
    // Validación con Zod
    const validationResult = tenantCreateSchema.safeParse(dataToValidate);
    
    if (!validationResult.success) {
      const errors = validationResult.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }));
      logger.warn('Validation error creating tenant:', { errors });
      return NextResponse.json(
        { error: 'Datos inv\u00e1lidos', details: errors },
        { status: 400 }
      );
    }

    const validatedData = validationResult.data;
    
    // Combinar nombre y apellidos de vuelta a nombreCompleto para la BD
    const nombreCompletoFinal = `${validatedData.nombre} ${validatedData.apellidos}`.trim();

    const tenant = await prisma.tenant.create({
      data: {
        companyId: scope.activeCompanyId,
        nombreCompleto: nombreCompletoFinal,
        dni: validatedData.dni || '',
        email: validatedData.email,
        telefono: validatedData.telefono,
        fechaNacimiento: validatedData.fechaNacimiento ? new Date(validatedData.fechaNacimiento) : new Date(),
        notas: validatedData.notasInternas || '',
      },
    });

    return NextResponse.json(tenant, { status: 201 });
  } catch (error: any) {
    if (error?.name === 'AuthError' || error?.statusCode === 401 || error?.statusCode === 403) { return NextResponse.json({ error: error.message }, { status: error.statusCode || 401 }); }
    logger.error('Error creating tenant:', error);
    if (error.message?.includes('permiso')) {
      return forbiddenResponse(error.message);
    }
    if (error.message === 'No autenticado') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: 'Error al crear inquilino' }, { status: 500 });
  }
}
