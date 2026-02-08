import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

import logger from '@/lib/logger';
export const dynamic = 'force-dynamic';

const createPropietarioSchema = z.object({
  buildingId: z.string().min(1),
  unitId: z.string().optional(),
  nombre: z.string().min(1),
  apellidos: z.string().min(1),
  dni: z.string().optional(),
  email: z.string().email(),
  telefono: z.string().optional(),
  direccionCorrespondencia: z.string().optional(),
  coeficienteParticipacion: z.number().min(0).max(100).default(0),
  esPresidente: z.boolean().default(false),
  esVicepresidente: z.boolean().default(false),
  esSecretario: z.boolean().default(false),
  esTesorero: z.boolean().default(false),
  notas: z.string().optional(),
});

// GET - Listar propietarios de una comunidad/edificio
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const buildingId = searchParams.get('buildingId');
    const comunidadId = searchParams.get('comunidadId');

    const sessionUser = session.user as { companyId?: string | null };
    const userId = sessionUser.id;
    const companyId = sessionUser.companyId;
    if (!companyId) {
      return NextResponse.json({ error: 'Company ID no encontrado' }, { status: 400 });
    }
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Si se proporciona comunidadId, obtener el buildingId
    let targetBuildingId = buildingId;
    if (comunidadId && !buildingId) {
      const comunidad = await prisma.communityManagement.findFirst({
        where: { id: comunidadId, companyId },
        select: { buildingId: true },
      });
      if (comunidad) {
        targetBuildingId = comunidad.buildingId;
      }
    }

    if (!targetBuildingId) {
      return NextResponse.json(
        { error: 'Se requiere buildingId o comunidadId' },
        { status: 400 }
      );
    }

    // Obtener unidades con propietarios (usando el modelo de Owner)
    const unidades = await prisma.unit.findMany({
      where: {
        buildingId: targetBuildingId,
        building: { companyId },
      },
      include: {
        building: {
          select: { id: true, nombre: true },
        },
        contracts: {
          where: { estado: 'activo' },
          include: {
            tenant: true,
          },
        },
      },
      orderBy: { numero: 'asc' },
    });

    // También buscar en la tabla Owner si existe
    const owners = await prisma.owner.findMany({
      where: {
        companyId,
        ownerBuildings: {
          some: { buildingId: targetBuildingId },
        },
      },
      include: {
        ownerBuildings: {
          where: { buildingId: targetBuildingId },
          include: {
            building: {
              select: { id: true, nombre: true },
            },
          },
        },
      },
    });

    // Formatear respuesta combinando datos
    const propietarios = owners.map((owner) => {
      const [nombre, ...apellidosParts] = owner.nombreCompleto.split(' ');
      const apellidos = apellidosParts.join(' ').trim();
      return {
      id: owner.id,
      nombre: nombre || owner.nombreCompleto,
      apellidos,
      nombreCompleto: owner.nombreCompleto,
      dni: owner.dni,
      email: owner.email,
      telefono: owner.telefono,
      direccion: owner.direccion,
      tipo: 'propietario',
      activo: owner.activo,
      createdAt: owner.createdAt,
      };
    });

    // Calcular estadísticas
    const stats = {
      totalPropietarios: propietarios.length,
      totalUnidades: unidades.length,
      unidadesOcupadas: unidades.filter(u => u.contracts?.length > 0).length,
      unidadesDisponibles: unidades.filter(u => !u.contracts?.length).length,
    };

    return NextResponse.json({
      propietarios,
      unidades: unidades.map((u) => ({
        id: u.id,
        unitNumber: u.numero,
        type: u.tipo,
        status: u.estado,
        squareMeters: u.superficie,
        tieneInquilino: u.contracts && u.contracts.length > 0,
        inquilino: u.contracts?.[0]?.tenant || null,
      })),
      stats,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    logger.error('[Propietarios GET Error]:', { message });
    return NextResponse.json(
      { error: 'Error obteniendo propietarios', details: message },
      { status: 500 }
    );
  }
}

// POST - Crear/Registrar propietario
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const sessionUser = session.user as { companyId?: string | null; id?: string | null };
    const companyId = sessionUser.companyId;
    const userId = sessionUser.id;
    if (!companyId) {
      return NextResponse.json({ error: 'Company ID no encontrado' }, { status: 400 });
    }
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const validated = createPropietarioSchema.parse(body);

    // Verificar que el edificio existe y pertenece a la empresa
    const building = await prisma.building.findFirst({
      where: { id: validated.buildingId, companyId },
    });

    if (!building) {
      return NextResponse.json({ error: 'Edificio no encontrado' }, { status: 404 });
    }

    const existingOwner = await prisma.owner.findUnique({
      where: { email: validated.email },
    });
    if (existingOwner) {
      return NextResponse.json({ error: 'El email ya está en uso' }, { status: 400 });
    }

    if (validated.dni) {
      const existingDni = await prisma.owner.findUnique({
        where: { dni: validated.dni },
      });
      if (existingDni) {
        return NextResponse.json({ error: 'El DNI ya está en uso' }, { status: 400 });
      }
    }

    const nombreCompleto = `${validated.nombre} ${validated.apellidos}`.trim();
    const tempPassword = crypto.randomBytes(16).toString('hex');
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    const propietario = await prisma.owner.create({
      data: {
        companyId,
        nombreCompleto,
        dni: validated.dni,
        email: validated.email,
        telefono: validated.telefono,
        direccion: validated.direccionCorrespondencia,
        password: hashedPassword,
        activo: true,
        createdBy: userId,
      },
    });

    await prisma.ownerBuilding.create({
      data: {
        ownerId: propietario.id,
        buildingId: validated.buildingId,
        companyId,
        porcentajePropiedad: validated.coeficienteParticipacion,
        asignadoPor: userId,
      },
    });

    return NextResponse.json({ propietario }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }
    const message = error instanceof Error ? error.message : 'Error desconocido';
    logger.error('[Propietarios POST Error]:', { message });
    return NextResponse.json(
      { error: 'Error creando propietario', details: message },
      { status: 500 }
    );
  }
}
