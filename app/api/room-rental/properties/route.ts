import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requirePermission } from '@/lib/permissions';
import logger from '@/lib/logger';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const roomSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  size: z.number().min(0),
  basePrice: z.number().min(0),
});

const utilitySchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  amount: z.number().min(0),
  prorate: z.boolean().optional(),
  method: z.enum(['equal', 'byPerson', 'bySize', 'custom']).optional(),
});

const payloadSchema = z.object({
  propertyName: z.string().min(1).trim(),
  address: z.string().min(1).trim(),
  totalRooms: z.number().int().min(0).optional(),
  rooms: z.array(roomSchema).min(1),
  utilities: z.array(utilitySchema).optional(),
  commonAreas: z.array(z.string().min(1)).optional(),
  quietHours: z.string().optional(),
  cleaningSchedule: z.enum(['daily', 'weekly', 'biweekly']).optional(),
  petsAllowed: z.boolean().optional(),
  smokingAllowed: z.boolean().optional(),
});

type Payload = z.infer<typeof payloadSchema>;

const normalizeText = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const mapCommonAreaType = (area: string) => {
  const key = normalizeText(area);
  const mapping: Record<string, string> = {
    cocina: 'cocina',
    salon: 'salon',
    bano: 'bano',
    'bano compartido': 'bano',
    terraza: 'terraza',
    jardin: 'jardin',
    lavanderia: 'lavanderia',
    gimnasio: 'gimnasio',
    'zona de estudio': 'estudio',
  };

  return mapping[key] || 'otro';
};

export async function POST(req: NextRequest) {
  try {
    const user = await requirePermission('create');
    const companyId = user.companyId;

    if (!companyId) {
      return NextResponse.json({ error: 'Company ID no encontrado' }, { status: 400 });
    }

    const body = (await req.json()) as Payload;
    const validationResult = payloadSchema.safeParse(body);

    if (!validationResult.success) {
      const errors = validationResult.error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      return NextResponse.json(
        { error: 'Datos invalidos', details: errors },
        { status: 400 }
      );
    }

    const data = validationResult.data;
    const rooms = data.rooms.map((room, index) => ({
      ...room,
      name: room.name?.trim() || `Habitacion ${index + 1}`,
    }));

    const totalRooms = data.totalRooms && data.totalRooms > 0 ? data.totalRooms : rooms.length;
    const totalSurface = rooms.reduce((sum, room) => sum + (room.size || 0), 0);
    const totalRent = rooms.reduce((sum, room) => sum + (room.basePrice || 0), 0);

    const result = await prisma.$transaction(async (tx) => {
      const building = await tx.building.create({
        data: {
          companyId,
          nombre: data.propertyName,
          direccion: data.address,
          tipo: 'residencial',
          anoConstructor: new Date().getFullYear(),
          numeroUnidades: 1,
        },
      });

      const unit = await tx.unit.create({
        data: {
          buildingId: building.id,
          numero: 'COLIVING-1',
          tipo: 'vivienda',
          estado: 'disponible',
          superficie: totalSurface || 0,
          rentaMensual: totalRent || 0,
          habitaciones: totalRooms || 0,
        },
      });

      const createdRooms = await Promise.all(
        rooms.map((room, index) =>
          tx.room.create({
            data: {
              companyId,
              unitId: unit.id,
              numero: `${index + 1}`,
              nombre: room.name,
              superficie: room.size || 0,
              rentaMensual: room.basePrice || 0,
              tipoHabitacion: 'individual',
              banoPrivado: false,
              amueblada: true,
              estado: 'disponible',
            },
            select: { id: true, numero: true },
          })
        )
      );

      const commonAreas = (data.commonAreas || []).map((area) => area.trim()).filter(Boolean);
      if (commonAreas.length > 0) {
        await tx.roomSharedSpace.createMany({
          data: commonAreas.map((area) => ({
            companyId,
            unitId: unit.id,
            nombre: area,
            tipo: mapCommonAreaType(area),
          })),
        });
      }

      const propertyConfig = await tx.roomRentalProperty.create({
        data: {
          companyId,
          buildingId: building.id,
          unitId: unit.id,
          nombre: data.propertyName,
          direccion: data.address,
          totalRooms,
          utilities: data.utilities || [],
          commonAreas: commonAreas,
          quietHours: data.quietHours || null,
          cleaningSchedule: data.cleaningSchedule || null,
          petsAllowed: data.petsAllowed ?? false,
          smokingAllowed: data.smokingAllowed ?? false,
        },
        select: { id: true },
      });

      return {
        building,
        unit,
        rooms: createdRooms,
        propertyConfig,
      };
    });

    return NextResponse.json(
      {
        propertyId: result.unit.id,
        unitId: result.unit.id,
        buildingId: result.building.id,
        roomIds: result.rooms.map((room) => room.id),
        configId: result.propertyConfig.id,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    logger.error('[RoomRental] Error creando propiedad', error);
    if (error instanceof Error && error.message?.includes('permiso')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    if (error instanceof Error && error.message === 'No autenticado') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: 'Error al crear propiedad' }, { status: 500 });
  }
}
