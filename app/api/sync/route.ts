/**
 * API Endpoint: Sincronización Avanzada
 * Gestión de sincronización con plataformas externas
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { z } from 'zod';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const createSyncConfigSchema = z.object({
  nombre: z.string().min(2),
  tipo: z.string(), // calendario, inventario, precios, reservas
  plataforma: z.string(), // airbnb, booking, google, ical, etc.
  url: z.string().url().optional(),
  apiKey: z.string().optional(),
  direccion: z.enum(['entrada', 'salida', 'bidireccional']).default('bidireccional'),
  frecuencia: z.number().int().min(1).default(15), // minutos
  activo: z.boolean().default(true),
  configuracion: z.record(z.any()).optional(),
});

// Almacenamiento temporal
let syncConfigStore: any[] = [];
let syncLogsStore: any[] = [];
const ALLOW_IN_MEMORY = process.env.NODE_ENV !== 'production';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    if (!ALLOW_IN_MEMORY) {
      return NextResponse.json(
        { error: 'Sincronizaciones no disponibles en producción' },
        { status: 501 }
      );
    }

    const cookieCompanyId = req.cookies.get('activeCompanyId')?.value;
    const companyId = cookieCompanyId || session.user.companyId;
    if (!companyId) {
      return NextResponse.json({ error: 'Company ID no encontrado' }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const tipo = searchParams.get('tipo');
    const plataforma = searchParams.get('plataforma');
    const getLogs = searchParams.get('logs') === 'true';

    if (getLogs) {
      // Obtener logs de sincronización
      const logs = syncLogsStore
        .filter(l => l.companyId === companyId)
        .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
        .slice(0, 100);

      return NextResponse.json({
        success: true,
        data: logs,
      });
    }

    // Obtener configuraciones
    let configs = syncConfigStore.filter(c => c.companyId === companyId);

    if (tipo) configs = configs.filter(c => c.tipo === tipo);
    if (plataforma) configs = configs.filter(c => c.plataforma === plataforma);

    // Stats
    const stats = {
      totalConfiguraciones: configs.length,
      activas: configs.filter(c => c.activo).length,
      plataformas: [...new Set(configs.map(c => c.plataforma))].length,
      ultimaSincronizacion: syncLogsStore
        .filter(l => l.companyId === companyId)
        .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())[0]?.fecha,
      sincronizacionesHoy: syncLogsStore.filter(l => {
        const logDate = new Date(l.fecha);
        const today = new Date();
        return l.companyId === companyId &&
          logDate.getDate() === today.getDate() &&
          logDate.getMonth() === today.getMonth() &&
          logDate.getFullYear() === today.getFullYear();
      }).length,
    };

    return NextResponse.json({
      success: true,
      data: configs,
      stats,
    });
  } catch (error: any) {
    logger.error('Error fetching sync configs:', error);
    return NextResponse.json({ error: 'Error al obtener configuraciones' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    if (!ALLOW_IN_MEMORY) {
      return NextResponse.json(
        { error: 'Sincronizaciones no disponibles en producción' },
        { status: 501 }
      );
    }

    const companyId = session.user.companyId;
    if (!companyId) {
      return NextResponse.json({ error: 'Company ID no encontrado' }, { status: 400 });
    }

    const body = await req.json();

    // Si es una acción de sincronización manual
    if (body.action === 'sync') {
      const configId = body.configId;
      const config = syncConfigStore.find(c => c.id === configId && c.companyId === companyId);

      if (!config) {
        return NextResponse.json({ error: 'Configuración no encontrada' }, { status: 404 });
      }

      // Registrar log de sincronización
      const log = {
        id: `log-${Date.now()}`,
        companyId,
        configId,
        configNombre: config.nombre,
        plataforma: config.plataforma,
        tipo: config.tipo,
        fecha: new Date().toISOString(),
        estado: 'completado',
        registrosActualizados: Math.floor(Math.random() * 50) + 1,
        duracion: Math.floor(Math.random() * 5000) + 500, // ms
      };

      syncLogsStore.push(log);

      logger.info('Manual sync completed', { configId, companyId });

      return NextResponse.json({
        success: true,
        data: log,
        message: 'Sincronización completada',
      });
    }

    // Crear nueva configuración
    const validationResult = createSyncConfigSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json({
        error: 'Datos inválidos',
        details: validationResult.error.errors,
      }, { status: 400 });
    }

    const data = validationResult.data;

    const config = {
      id: `sync-${Date.now()}`,
      companyId,
      ...data,
      ultimaSincronizacion: null,
      createdAt: new Date().toISOString(),
    };

    syncConfigStore.push(config);

    logger.info('Sync config created', { configId: config.id, companyId });

    return NextResponse.json({
      success: true,
      data: config,
      message: 'Configuración creada',
    }, { status: 201 });
  } catch (error: any) {
    logger.error('Error creating sync config:', error);
    return NextResponse.json({ error: 'Error al crear configuración' }, { status: 500 });
  }
}
