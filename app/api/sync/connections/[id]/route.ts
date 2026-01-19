import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export const dynamic = 'force-dynamic';

// Shared in-memory storage reference
// Note: In production, use database
interface SyncConnection {
  id: string;
  companyId: string;
  nombre: string;
  tipo: string;
  plataforma: string;
  estado: string;
  frecuencia: string;
  ultimaSincronizacion?: string;
  proximaSincronizacion?: string;
  registrosSincronizados: number;
  erroresUltimaSinc: number;
  direccion: string;
  entidadesSincronizadas: string[];
  configuracion?: {
    apiKey?: string;
    apiUrl?: string;
    webhookUrl?: string;
  };
  notas?: string;
  createdAt: string;
}

// This should be imported from a shared module in production
const syncConnections: SyncConnection[] = [];

// Initialize with demo data if empty
if (syncConnections.length === 0) {
  syncConnections.push(
    {
      id: 'conn-1',
      companyId: 'demo-company',
      nombre: 'Sincronización Idealista',
      tipo: 'PORTAL_INMOBILIARIO',
      plataforma: 'idealista',
      estado: 'ACTIVO',
      frecuencia: 'DIARIO',
      ultimaSincronizacion: new Date(Date.now() - 3600000).toISOString(),
      proximaSincronizacion: new Date(Date.now() + 82800000).toISOString(),
      registrosSincronizados: 45,
      erroresUltimaSinc: 0,
      direccion: 'BIDIRECCIONAL',
      entidadesSincronizadas: ['PROPIEDADES'],
      configuracion: {
        apiKey: '***hidden***',
        apiUrl: 'https://api.idealista.com/v1',
      },
      notas: 'Conexión principal para publicación de propiedades',
      createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
    },
    {
      id: 'conn-2',
      companyId: 'demo-company',
      nombre: 'Sincronización Fotocasa',
      tipo: 'PORTAL_INMOBILIARIO',
      plataforma: 'fotocasa',
      estado: 'ACTIVO',
      frecuencia: 'CADA_6_HORAS',
      ultimaSincronizacion: new Date(Date.now() - 7200000).toISOString(),
      proximaSincronizacion: new Date(Date.now() + 14400000).toISOString(),
      registrosSincronizados: 32,
      erroresUltimaSinc: 2,
      direccion: 'SOLO_EXPORTAR',
      entidadesSincronizadas: ['PROPIEDADES'],
      configuracion: {
        apiKey: '***hidden***',
      },
      notas: '',
      createdAt: new Date(Date.now() - 86400000 * 15).toISOString(),
    },
    {
      id: 'conn-3',
      companyId: 'demo-company',
      nombre: 'CRM HubSpot',
      tipo: 'CRM',
      plataforma: 'hubspot',
      estado: 'INACTIVO',
      frecuencia: 'CADA_HORA',
      ultimaSincronizacion: new Date(Date.now() - 86400000 * 5).toISOString(),
      registrosSincronizados: 128,
      erroresUltimaSinc: 0,
      direccion: 'BIDIRECCIONAL',
      entidadesSincronizadas: ['INQUILINOS', 'CONTRATOS'],
      configuracion: {
        apiKey: '***hidden***',
        apiUrl: 'https://api.hubspot.com/crm/v3',
      },
      notas: 'Desactivado temporalmente',
      createdAt: new Date(Date.now() - 86400000 * 60).toISOString(),
    }
  );
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { id } = await params;
    const connection = syncConnections.find((conn) => conn.id === id);

    if (!connection) {
      return NextResponse.json({ error: 'Conexión no encontrada' }, { status: 404 });
    }

    return NextResponse.json({ data: connection });
  } catch (error) {
    console.error('[Sync Connection GET Error]:', error);
    return NextResponse.json({ error: 'Error al obtener conexión' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const connectionIndex = syncConnections.findIndex((conn) => conn.id === id);

    if (connectionIndex === -1) {
      return NextResponse.json({ error: 'Conexión no encontrada' }, { status: 404 });
    }

    // Update connection
    const updatedConnection = {
      ...syncConnections[connectionIndex],
      ...body,
      configuracion: body.configuracion || syncConnections[connectionIndex].configuracion,
    };

    syncConnections[connectionIndex] = updatedConnection;

    return NextResponse.json({ data: updatedConnection });
  } catch (error) {
    console.error('[Sync Connection PUT Error]:', error);
    return NextResponse.json({ error: 'Error al actualizar conexión' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { id } = await params;
    const connectionIndex = syncConnections.findIndex((conn) => conn.id === id);

    if (connectionIndex === -1) {
      return NextResponse.json({ error: 'Conexión no encontrada' }, { status: 404 });
    }

    syncConnections.splice(connectionIndex, 1);

    return NextResponse.json({ message: 'Conexión eliminada exitosamente' });
  } catch (error) {
    console.error('[Sync Connection DELETE Error]:', error);
    return NextResponse.json({ error: 'Error al eliminar conexión' }, { status: 500 });
  }
}
