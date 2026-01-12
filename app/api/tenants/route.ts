import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, requirePermission, forbiddenResponse, badRequestResponse } from '@/lib/permissions';
import logger, { logError } from '@/lib/logger';
import { tenantCreateSchema } from '@/lib/validations';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();

    // Obtener parámetros de paginación
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Si no hay paginación solicitada, devolver todos (compatibilidad)
    const usePagination = searchParams.has('page') || searchParams.has('limit');

    if (!usePagination) {
      const tenants = await prisma.tenant.findMany({
        where: { companyId: user.companyId },
        include: {
          units: {
            include: {
              building: true,
            },
          },
          contracts: {
            where: { estado: 'activo' },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
      return NextResponse.json(tenants);
    }

    // Paginación activada
    const [tenants, total] = await Promise.all([
      prisma.tenant.findMany({
        where: { companyId: user.companyId },
        include: {
          units: {
            include: {
              building: true,
            },
          },
          contracts: {
            where: { estado: 'activo' },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.tenant.count({
        where: { companyId: user.companyId },
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
    logger.error('Error fetching tenants:', error);
    if (error.message === 'No autenticado') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: 'Error al obtener inquilinos' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requirePermission('create');

    const body = await req.json();
    
    // Preparar datos: convertir nombreCompleto a nombre/apellidos si es necesario
    let dataToValidate = { ...body };
    if (body.nombreCompleto && !body.nombre) {
      const [nombre, ...apellidos] = body.nombreCompleto.trim().split(' ');
      dataToValidate.nombre = nombre;
      dataToValidate.apellidos = apellidos.join(' ') || nombre;
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
    const nombreCompleto = `${validatedData.nombre} ${validatedData.apellidos}`.trim();

    const tenant = await prisma.tenant.create({
      data: {
        companyId: user.companyId,
        nombreCompleto,
        dni: validatedData.dni || '',
        email: validatedData.email,
        telefono: validatedData.telefono,
        fechaNacimiento: validatedData.fechaNacimiento ? new Date(validatedData.fechaNacimiento) : new Date(),
        notas: validatedData.notasInternas || '',
      },
    });

    return NextResponse.json(tenant, { status: 201 });
  } catch (error: any) {
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
