import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import bcrypt from 'bcryptjs';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Lazy Prisma (auditoria V2)
async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

// GET /api/owners - Listar propietarios de la empresa
export async function GET(req: NextRequest) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const owners = await prisma.owner.findMany({
      where: {
        companyId: session?.user?.companyId,
      },
      include: {
        ownerBuildings: {
          include: {
            building: {
              select: {
                id: true,
                nombre: true,
                direccion: true,
                tipo: true,
              },
            },
          },
        },
        _count: {
          select: {
            ownerNotifications: true,
            ownerAlerts: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // No exponer las contraseñas
    const ownersWithoutPassword = owners.map(owner => {
      const { password, resetToken, resetTokenExpiry, ...ownerData } = owner;
      return ownerData;
    });

    return NextResponse.json(ownersWithoutPassword);
  } catch (error) {
    logger.error('Error al obtener propietarios:', error);
    return NextResponse.json(
      { error: 'Error al obtener propietarios' },
      { status: 500 }
    );
  }
}

// POST /api/owners - Crear nuevo propietario
export async function POST(req: NextRequest) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    // Verificar que el usuario tenga permisos de administrador
    if (!['super_admin', 'administrador', 'gestor'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'No tienes permisos para crear propietarios' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      nombreCompleto,
      email,
      telefono,
      dni,
      direccion,
      password,
      notificarPagos = true,
      notificarOcupacion = true,
      notificarMantenimiento = true,
      notificarVencimientos = true,
      buildingAssignments = [],
    } = body;

    // Validaciones básicas
    if (!nombreCompleto || !email || !password) {
      return NextResponse.json(
        { error: 'Nombre completo, email y contraseña son requeridos' },
        { status: 400 }
      );
    }

    // Verificar que el email no esté en uso
    const existingOwner = await prisma.owner.findUnique({
      where: { email },
    });

    if (existingOwner) {
      return NextResponse.json(
        { error: 'El email ya está en uso' },
        { status: 400 }
      );
    }

    // Si hay DNI, verificar que no esté en uso
    if (dni) {
      const existingDni = await prisma.owner.findUnique({
        where: { dni },
      });

      if (existingDni) {
        return NextResponse.json(
          { error: 'El DNI ya está en uso' },
          { status: 400 }
        );
      }
    }

    // Hashear contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear propietario
    const owner = await prisma.owner.create({
      data: {
        companyId: session?.user?.companyId,
        nombreCompleto,
        email,
        telefono,
        dni,
        direccion,
        password: hashedPassword,
        notificarPagos,
        notificarOcupacion,
        notificarMantenimiento,
        notificarVencimientos,
        createdBy: session?.user?.id
      },
    });

    // Asignar edificios si se proporcionaron
    if (buildingAssignments && buildingAssignments.length > 0) {
      const assignments = buildingAssignments.map((assignment: any) => ({
        ownerId: owner.id,
        buildingId: assignment.buildingId,
        companyId: session?.user?.companyId,
        porcentajePropiedad: assignment.porcentajePropiedad || 100,
        verIngresos: assignment.verIngresos ?? true,
        verGastos: assignment.verGastos ?? true,
        verOcupacion: assignment.verOcupacion ?? true,
        verMantenimiento: assignment.verMantenimiento ?? true,
        verDocumentos: assignment.verDocumentos ?? false,
        asignadoPor: session?.user?.id
      }));

      await prisma.ownerBuilding.createMany({
        data: assignments,
      });
    }

    // Obtener propietario con relaciones
    const ownerWithBuildings = await prisma.owner.findUnique({
      where: { id: owner.id },
      include: {
        ownerBuildings: {
          include: {
            building: {
              select: {
                id: true,
                nombre: true,
                direccion: true,
                tipo: true,
              },
            },
          },
        },
      },
    });

    // No exponer la contraseña
    const { password: _, resetToken, resetTokenExpiry, ...ownerData } = ownerWithBuildings!;

    logger.info(`Propietario creado: ${owner.id} por usuario: ${session?.user?.id}`);

    return NextResponse.json({
      success: true,
      owner: ownerData,
      message: 'Propietario creado exitosamente',
    });
  } catch (error) {
    logger.error('Error al crear propietario:', error);
    return NextResponse.json(
      { error: 'Error al crear propietario' },
      { status: 500 }
    );
  }
}
