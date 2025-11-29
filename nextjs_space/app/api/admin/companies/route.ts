import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

// GET /api/admin/companies - Lista todas las empresas (solo super_admin)
export async function GET(request: NextRequest) {
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

    const companies = await prisma.company.findMany({
      include: {
        subscriptionPlan: true,
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        buildings: {
          select: { id: true },
        },
        tenants: {
          select: { id: true },
        },
        _count: {
          select: {
            users: true,
            buildings: true,
            tenants: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(companies);
  } catch (error) {
    console.error('Error fetching companies:', error);
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

    // Crear empresa
    const company = await prisma.company.create({
      data: {
        nombre: data.nombre,
        cif: data.cif,
        direccion: data.direccion,
        telefono: data.telefono,
        email: data.email,
        logoUrl: data.logoUrl,
        codigoPostal: data.codigoPostal,
        ciudad: data.ciudad,
        pais: data.pais || 'España',
        dominioPersonalizado: data.dominioPersonalizado,
        estadoCliente: data.estadoCliente || 'activo',
        contactoPrincipal: data.contactoPrincipal,
        emailContacto: data.emailContacto,
        telefonoContacto: data.telefonoContacto,
        notasAdmin: data.notasAdmin,
        maxUsuarios: data.maxUsuarios || 5,
        maxPropiedades: data.maxPropiedades || 10,
        maxEdificios: data.maxEdificios || 5,
        subscriptionPlanId: data.subscriptionPlanId,
        activo: data.activo !== undefined ? data.activo : true,
      },
      include: {
        subscriptionPlan: true,
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
    console.error('Error creating company:', error);
    return NextResponse.json(
      { error: 'Error al crear empresa' },
      { status: 500 }
    );
  }
}