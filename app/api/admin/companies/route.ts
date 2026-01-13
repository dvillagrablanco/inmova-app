import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Roles permitidos para acceso admin
const SUPER_ADMIN_ROLES = ['super_admin'];

// Schema de validación para query params
const querySchema = z.object({
  page: z.preprocess((val) => val === null || val === '' ? 1 : Number(val), z.number().min(1).default(1)),
  limit: z.preprocess((val) => val === null || val === '' ? 20 : Number(val), z.number().min(1).max(100).default(20)),
  search: z.string().optional().nullable().transform(val => val ?? undefined),
  status: z.enum(['activo', 'inactivo', 'prueba', 'suspendido', 'all']).optional().nullable().transform(val => val ?? undefined),
  sortBy: z.preprocess((val) => val === null || val === '' ? 'createdAt' : val, z.enum(['nombre', 'createdAt', 'estadoCliente', 'users']).default('createdAt')),
  sortOrder: z.preprocess((val) => val === null || val === '' ? 'desc' : val, z.enum(['asc', 'desc']).default('desc')),
  includeTest: z.preprocess((val) => val === null || val === '' ? true : val === 'true', z.boolean().default(true)),
});

// GET /api/admin/companies - Lista empresas con paginación y filtros (solo super_admin)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Solo super_admin puede acceder
    if (!SUPER_ADMIN_ROLES.includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requiere rol super_admin' },
        { status: 403 }
      );
    }

    // Parsear y validar query params
    const { searchParams } = new URL(request.url);
    const queryResult = querySchema.safeParse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      search: searchParams.get('search'),
      status: searchParams.get('status'),
      sortBy: searchParams.get('sortBy'),
      sortOrder: searchParams.get('sortOrder'),
    });

    if (!queryResult.success) {
      return NextResponse.json(
        { error: 'Parámetros inválidos', details: queryResult.error.errors },
        { status: 400 }
      );
    }

    const { page, limit, search, status, sortBy, sortOrder, includeTest } = queryResult.data;
    const skip = (page - 1) * limit;

    // Construir filtros
    const where: any = {};
    
    // Filtrar empresas de prueba si se especifica
    if (!includeTest) {
      where.esEmpresaPrueba = false;
    }
    
    if (search) {
      where.OR = [
        { nombre: { contains: search, mode: 'insensitive' } },
        { cif: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { contactoPrincipal: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status && status !== 'all') {
      if (status === 'activo') {
        where.activo = true;
      } else if (status === 'inactivo') {
        where.activo = false;
      } else {
        where.estadoCliente = status;
      }
    }

    // Construir ordenamiento
    let orderBy: any = {};
    if (sortBy === 'users') {
      orderBy = { users: { _count: sortOrder } };
    } else {
      orderBy = { [sortBy]: sortOrder };
    }

    // Ejecutar queries en paralelo para mejor performance
    const [companies, total] = await Promise.all([
      prisma.company.findMany({
        where,
        skip,
        take: limit,
        include: {
          subscriptionPlan: {
            select: {
              id: true,
              nombre: true,
              precioMensual: true,
              tier: true,
            },
          },
          parentCompany: {
            select: {
              id: true,
              nombre: true,
            },
          },
          childCompanies: {
            select: {
              id: true,
              nombre: true,
              estadoCliente: true,
            },
          },
          _count: {
            select: {
              users: true,
              buildings: true,
              tenants: true,
              childCompanies: true,
            },
          },
        },
        orderBy,
      }),
      prisma.company.count({ where }),
    ]);

    // Calcular metadata de paginación
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return NextResponse.json({
      companies,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage,
        hasPrevPage,
      },
    });
  } catch (error) {
    logger.error('Error fetching companies:', error);
    return NextResponse.json(
      { error: 'Error al obtener empresas' },
      { status: 500 }
    );
  }
}

// POST /api/admin/companies - Crea nueva empresa (solo super_admin)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Solo super_admin puede acceder
    if (session.user.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requiere rol super_admin' },
        { status: 403 }
      );
    }

    const data = await request.json();

    // Validaciones
    if (!data.nombre) {
      return NextResponse.json(
        { error: 'El nombre de la empresa es requerido' },
        { status: 400 }
      );
    }

    // Verificar dominio único si se proporciona
    if (data.dominioPersonalizado) {
      const existingDomain = await prisma.company.findUnique({
        where: { dominioPersonalizado: data.dominioPersonalizado },
      });
      
      if (existingDomain) {
        return NextResponse.json(
          { error: 'El dominio personalizado ya está en uso' },
          { status: 400 }
        );
      }
    }

    // Validar empresa matriz si se proporciona
    if (data.parentCompanyId) {
      const parentCompany = await prisma.company.findUnique({
        where: { id: data.parentCompanyId },
      });
      
      if (!parentCompany) {
        return NextResponse.json(
          { error: 'La empresa matriz especificada no existe' },
          { status: 400 }
        );
      }

      // Evitar que una empresa matriz se marque como hija de sí misma
      if (data.parentCompanyId === data.id) {
        return NextResponse.json(
          { error: 'Una empresa no puede ser su propia matriz' },
          { status: 400 }
        );
      }
    }

    // Crear empresa - limpiar campos vacíos
    const companyData: any = {
      nombre: data.nombre,
      cif: data.cif || null,
      direccion: data.direccion || null,
      telefono: data.telefono || null,
      email: data.email || null,
      logoUrl: data.logoUrl || null,
      codigoPostal: data.codigoPostal || null,
      ciudad: data.ciudad || null,
      pais: data.pais || 'España',
      dominioPersonalizado: data.dominioPersonalizado || null,
      estadoCliente: data.estadoCliente || 'activo',
      contactoPrincipal: data.contactoPrincipal || null,
      emailContacto: data.emailContacto || null,
      telefonoContacto: data.telefonoContacto || null,
      notasAdmin: data.notasAdmin || null,
      maxUsuarios: data.maxUsuarios || 5,
      maxPropiedades: data.maxPropiedades || 10,
      maxEdificios: data.maxEdificios || 5,
      activo: data.activo !== undefined ? data.activo : true,
      esEmpresaPrueba: data.esEmpresaPrueba || false,
    };

    // Solo añadir subscriptionPlanId si tiene valor
    if (data.subscriptionPlanId && data.subscriptionPlanId.trim() !== '') {
      companyData.subscriptionPlanId = data.subscriptionPlanId;
    }

    // Solo añadir parentCompanyId si tiene valor válido (no vacío)
    if (data.parentCompanyId && data.parentCompanyId.trim() !== '') {
      companyData.parentCompanyId = data.parentCompanyId;
    }

    const company = await prisma.company.create({
      data: companyData,
      include: {
        subscriptionPlan: true,
        parentCompany: {
          select: {
            id: true,
            nombre: true,
          },
        },
      },
    });

    // Si se proporciona un plan de suscripción, activar módulos correspondientes
    if (data.subscriptionPlanId) {
      const plan = await prisma.subscriptionPlan.findUnique({
        where: { id: data.subscriptionPlanId },
      });

      if (plan && plan.modulosIncluidos) {
        const modulosCodigos = plan.modulosIncluidos as string[];
        
        // Crear registros CompanyModule para cada módulo incluido
        await prisma.companyModule.createMany({
          data: modulosCodigos.map(codigo => ({
            companyId: company.id,
            moduloCodigo: codigo,
            activo: true,
          })),
          skipDuplicates: true,
        });
      }
    }

    return NextResponse.json(company, { status: 201 });
  } catch (error) {
    logger.error('Error creating company:', error);
    return NextResponse.json(
      { error: 'Error al crear empresa' },
      { status: 500 }
    );
  }
}
