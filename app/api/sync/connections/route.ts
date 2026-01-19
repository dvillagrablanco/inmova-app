import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export const dynamic = 'force-dynamic';

// In-memory storage for demo purposes
// In production, this would be stored in the database
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

const syncConnections: SyncConnection[] = [
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
  },
];

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const companyId = (session.user as any).companyId || 'demo-company';

    // Filter connections by company
    const companyConnections = syncConnections.filter(
      (conn) => conn.companyId === companyId || conn.companyId === 'demo-company'
    );

    return NextResponse.json({ data: companyConnections });
  } catch (error) {
    console.error('[Sync Connections GET Error]:', error);
    return NextResponse.json({ error: 'Error al obtener conexiones' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const companyId = (session.user as any).companyId || 'demo-company';
    const body = await request.json();

    // Validate required fields
    if (!body.nombre || !body.plataforma) {
      return NextResponse.json(
        { error: 'Nombre y plataforma son requeridos' },
        { status: 400 }
      );
    }

    const newConnection: SyncConnection = {
      id: `conn-${Date.now()}`,
      companyId,
      nombre: body.nombre,
      tipo: body.tipo || 'API_EXTERNA',
      plataforma: body.plataforma,
      estado: 'ACTIVO',
      frecuencia: body.frecuencia || 'DIARIO',
      registrosSincronizados: 0,
      erroresUltimaSinc: 0,
      direccion: body.direccion || 'BIDIRECCIONAL',
      entidadesSincronizadas: body.entidadesSincronizadas || [],
      configuracion: body.configuracion || {},
      notas: body.notas || '',
      createdAt: new Date().toISOString(),
    };

    syncConnections.push(newConnection);

    return NextResponse.json({ data: newConnection }, { status: 201 });
  } catch (error) {
    console.error('[Sync Connections POST Error]:', error);
    return NextResponse.json({ error: 'Error al crear conexión' }, { status: 500 });
  }
}
