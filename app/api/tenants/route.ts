import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, requirePermission, forbiddenResponse, badRequestResponse } from '@/lib/permissions';
import logger, { logError } from '@/lib/logger';
import { tenantCreateSchema } from '@/lib/validations';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    // Obtener parámetros de paginación
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;
    const filterCompanyId = searchParams.get('companyId');
    const usePagination = searchParams.has('page') || searchParams.has('limit');

    const user = await requireAuth();
    const isSuperAdmin = user.role === 'super_admin' || user.role === 'soporte';

    // Determinar el filtro de empresa
    const whereCompanyId = isSuperAdmin 
      ? (filterCompanyId || undefined) 
      : user.companyId;

    // Si el usuario no es super_admin y no tiene companyId, retornar vacío
    if (!isSuperAdmin && !user.companyId) {
      return NextResponse.json([]);
    }

    const whereClause = whereCompanyId ? { companyId: whereCompanyId } : {};

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
        take: isSuperAdmin && !whereCompanyId ? 100 : undefined, // Limitar si ve todos
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
    const errorMessage = error?.message || 'Error desconocido';
    const errorStack = error?.stack || '';
    logger.error('Error fetching tenants:', { message: errorMessage, stack: errorStack.slice(0, 500) });

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const usePagination = searchParams.has('page') || searchParams.has('limit');

    if (usePagination) {
      return NextResponse.json({
        data: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0,
          hasMore: false,
        },
        error: errorMessage,
        success: false,
      });
    }

    return NextResponse.json([]);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requirePermission('create');

    const body = await req.json();
    const missingFields: string[] = [];
    const isBlank = (value: unknown) =>
      value === null ||
      value === undefined ||
      (typeof value === 'string' && value.trim() === '');

    const token = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`.toUpperCase();

    // Preparar datos: convertir nombre completo a nombre/apellidos si es necesario
    let dataToValidate = { ...body };

    // Mapear documento de identidad al campo dni si viene con otro nombre
    const rawDni =
      body.dni ||
      body.documentoIdentidad ||
      body.numeroDocumento ||
      body.documentNumber;
    if (!isBlank(rawDni)) {
      dataToValidate.dni = rawDni;
    } else {
      missingFields.push('documentoIdentidad');
      dataToValidate.dni = `PENDING${token}`;
    }
    
    // Si viene nombreCompleto o nombre contiene espacios y no hay apellidos
    const nombreCompleto = body.nombreCompleto || body.nombre;
    if (!isBlank(nombreCompleto)) {
      if (!body.apellidos) {
        const partes = String(nombreCompleto).trim().split(' ');
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
    } else {
      missingFields.push('nombre');
      dataToValidate.nombre = 'Pendiente';
      dataToValidate.apellidos = 'Completar';
    }

    if (isBlank(body.email)) {
      missingFields.push('email');
      dataToValidate.email = `pendiente-${token.toLowerCase()}@inmova.app`;
    }

    if (isBlank(body.telefono)) {
      missingFields.push('telefono');
      dataToValidate.telefono = '000000000';
    }

    if (isBlank(body.fechaNacimiento)) {
      missingFields.push('fechaNacimiento');
      dataToValidate.fechaNacimiento = new Date('1970-01-01').toISOString();
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
    const uniqueMissingFields = Array.from(new Set(missingFields));
    const missingNote = uniqueMissingFields.length
      ? `Campos pendientes por completar: ${uniqueMissingFields.join(', ')}`
      : '';
    const notas = [validatedData.notasInternas, missingNote].filter(Boolean).join('\n');

    const tenant = await prisma.tenant.create({
      data: {
        companyId: user.companyId,
        nombreCompleto: nombreCompletoFinal,
        dni: validatedData.dni,
        email: validatedData.email,
        telefono: validatedData.telefono,
        fechaNacimiento: validatedData.fechaNacimiento ? new Date(validatedData.fechaNacimiento) : new Date(),
        notas,
      },
    });

    return NextResponse.json({ ...tenant, missingFields: uniqueMissingFields }, { status: 201 });
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
