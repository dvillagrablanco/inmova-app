export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * API: Gestión de Dispositivos IoT
 * GET: Obtener dispositivos
 * POST: Crear nuevo dispositivo
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import logger from '@/lib/logger';
import { z } from 'zod';

// Schema de validación
const createDeviceSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  type: z.enum(['thermostat', 'lock', 'light', 'sensor', 'meter', 'camera', 'other']),
  brand: z.string().optional(),
  model: z.string().optional(),
  serialNumber: z.string().optional(),
  buildingId: z.string().optional(),
  unitId: z.string().optional(),
  location: z.string().optional(),
  ipAddress: z.string().optional(),
  macAddress: z.string().optional(),
  firmwareVersion: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const buildingId = searchParams.get('buildingId');
    const status = searchParams.get('status');

    const where: {
      companyId: string;
      tipo?: string;
      buildingId?: string;
      estado?: string;
    } = {
      companyId: session.user.companyId,
    };

    if (type) where.tipo = type;
    if (buildingId) where.buildingId = buildingId;
    if (status) where.estado = status;

    const devices = await prisma.ioTDevice.findMany({
      where,
      include: {
        building: {
          select: { id: true, nombre: true },
        },
        unit: {
          select: { id: true, numero: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    const deviceIds = devices.map((device) => device.id);
    const readings = deviceIds.length
      ? await prisma.ioTReading.findMany({
          where: { deviceId: { in: deviceIds } },
          orderBy: { timestamp: 'desc' },
        })
      : [];

    const readingMap = new Map<string, { valor: number; unidad: string; timestamp: Date }>();
    readings.forEach((reading) => {
      if (!readingMap.has(reading.deviceId)) {
        readingMap.set(reading.deviceId, {
          valor: reading.valor,
          unidad: reading.unidad,
          timestamp: reading.timestamp,
        });
      }
    });

    // Transformar al formato esperado por el frontend
    const formattedDevices = devices.map((device) => {
      const reading = readingMap.get(device.id);
      const statusValue = device.conectado
        ? device.estado === 'warning' || device.estado === 'alerta'
          ? 'warning'
          : 'online'
        : 'offline';

      return {
        id: device.id,
        name: device.nombre,
        type: device.tipo,
        status: statusValue,
        location: device.ubicacion || '',
        buildingId: device.buildingId,
        buildingName: device.building?.nombre || '',
        unitId: device.unitId,
        unitName: device.unit?.numero ? `Unidad ${device.unit.numero}` : undefined,
        battery: device.bateria ?? undefined,
        lastUpdate: (reading?.timestamp || device.updatedAt).toISOString(),
        currentValue: reading?.valor,
        unit: reading?.unidad,
        brand: device.marca,
        model: device.modelo,
        serialNumber: device.numeroSerie,
      };
    });

    // Calcular estadísticas
    const stats = {
      total: formattedDevices.length,
      online: formattedDevices.filter((d) => d.status === 'online').length,
      offline: formattedDevices.filter((d) => d.status === 'offline').length,
      warning: formattedDevices.filter((d) => d.status === 'warning').length,
    };

    return NextResponse.json({
      devices: formattedDevices,
      stats,
    });
  } catch (error) {
    logger.error('Error fetching IoT devices:', error);
    return NextResponse.json({ error: 'Error al obtener dispositivos' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createDeviceSchema.parse(body);

    const device = await prisma.ioTDevice.create({
      data: {
        companyId: session.user.companyId,
        nombre: validatedData.name,
        tipo: validatedData.type,
        marca: validatedData.brand || null,
        modelo: validatedData.model || null,
        numeroSerie: validatedData.serialNumber || null,
        buildingId: validatedData.buildingId || null,
        unitId: validatedData.unitId || null,
        ubicacion: validatedData.location || null,
        configuracion: validatedData.metadata || {},
        estado: 'activo',
        conectado: true,
      },
      include: {
        building: {
          select: { id: true, nombre: true },
        },
        unit: {
          select: { id: true, numero: true },
        },
      },
    });

    logger.info('IoT device created:', { deviceId: device.id, userId: session.user.id });

    return NextResponse.json(device, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }

    logger.error('Error creating IoT device:', error);
    return NextResponse.json({ error: 'Error al crear dispositivo' }, { status: 500 });
  }
}
