import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger from '@/lib/logger';

interface PortalIntegration {
  id: string;
  name: string;
  logo?: string;
  status: 'connected' | 'disconnected' | 'error' | 'pending';
  lastSync?: string;
  propertiesPublished?: number;
  pendingSync?: number;
  autoSync: boolean;
  error?: string;
  features: string[];
}

// Portales inmobiliarios disponibles
const AVAILABLE_PORTALS: PortalIntegration[] = [
  {
    id: 'idealista',
    name: 'Idealista',
    logo: '/images/portals/idealista.png',
    status: 'disconnected',
    autoSync: false,
    features: ['Publicación automática', 'Sincronización de leads', 'Estadísticas'],
  },
  {
    id: 'fotocasa',
    name: 'Fotocasa',
    logo: '/images/portals/fotocasa.png',
    status: 'disconnected',
    autoSync: false,
    features: ['Publicación automática', 'Sincronización de leads'],
  },
  {
    id: 'habitaclia',
    name: 'Habitaclia',
    logo: '/images/portals/habitaclia.png',
    status: 'disconnected',
    autoSync: false,
    features: ['Publicación automática', 'Sincronización de contactos'],
  },
  {
    id: 'pisos',
    name: 'Pisos.com',
    logo: '/images/portals/pisos.png',
    status: 'disconnected',
    autoSync: false,
    features: ['Publicación automática'],
  },
  {
    id: 'yaencontre',
    name: 'Yaencontre',
    logo: '/images/portals/yaencontre.png',
    status: 'disconnected',
    autoSync: false,
    features: ['Publicación automática', 'Estadísticas básicas'],
  },
  {
    id: 'enalquiler',
    name: 'Enalquiler',
    logo: '/images/portals/enalquiler.png',
    status: 'disconnected',
    autoSync: false,
    features: ['Publicación automática'],
  },
];

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // En una implementación real, esto consultaría la configuración guardada en la base de datos
    // Por ahora, devolvemos los portales con estado desconectado por defecto
    const portals = AVAILABLE_PORTALS.map(portal => ({
      ...portal,
      // Simular que algunos portales podrían estar conectados basándose en variables de entorno
      status: process.env[`${portal.id.toUpperCase()}_API_KEY`] ? 'connected' : 'disconnected',
      propertiesPublished: process.env[`${portal.id.toUpperCase()}_API_KEY`] ? 0 : undefined,
      pendingSync: 0,
    }));

    return NextResponse.json({
      portals,
      summary: {
        total: portals.length,
        connected: portals.filter(p => p.status === 'connected').length,
        disconnected: portals.filter(p => p.status === 'disconnected').length,
        errors: portals.filter(p => p.status === 'error').length,
      },
    });
  } catch (error) {
    logger.error('Error al obtener estado de portales:', error);
    return NextResponse.json(
      { error: 'Error al obtener estado de portales' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { portalId, action, config } = body;

    if (!portalId) {
      return NextResponse.json(
        { error: 'ID de portal requerido' },
        { status: 400 }
      );
    }

    const portal = AVAILABLE_PORTALS.find(p => p.id === portalId);
    if (!portal) {
      return NextResponse.json(
        { error: 'Portal no encontrado' },
        { status: 404 }
      );
    }

    switch (action) {
      case 'connect':
        // Simular conexión
        return NextResponse.json({
          success: true,
          message: `Conectado a ${portal.name} correctamente`,
          portal: {
            ...portal,
            status: 'connected',
            lastSync: new Date().toISOString(),
          },
        });

      case 'disconnect':
        return NextResponse.json({
          success: true,
          message: `Desconectado de ${portal.name}`,
          portal: {
            ...portal,
            status: 'disconnected',
          },
        });

      case 'sync':
        return NextResponse.json({
          success: true,
          message: `Sincronización con ${portal.name} iniciada`,
          syncId: `sync-${Date.now()}`,
        });

      case 'toggle-auto-sync':
        return NextResponse.json({
          success: true,
          message: `Auto-sincronización ${config?.enabled ? 'activada' : 'desactivada'} para ${portal.name}`,
        });

      case 'update-config':
        return NextResponse.json({
          success: true,
          message: `Configuración de ${portal.name} actualizada`,
        });

      default:
        return NextResponse.json(
          { error: 'Acción no válida' },
          { status: 400 }
        );
    }
  } catch (error) {
    logger.error('Error en operación de portal:', error);
    return NextResponse.json(
      { error: 'Error en la operación' },
      { status: 500 }
    );
  }
}
