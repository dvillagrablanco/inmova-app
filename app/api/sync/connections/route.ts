import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger from '@/lib/logger';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const createConnectionSchema = z.object({
  nombre: z.string().min(1),
  plataforma: z.string().min(1),
  tipo: z.string().optional(),
  frecuencia: z.string().optional(),
  direccion: z.string().optional(),
  entidadesSincronizadas: z.array(z.string()).optional(),
  configuracion: z.record(z.unknown()).optional(),
  notas: z.string().optional(),
});
export const runtime = 'nodejs';

// Nota: En producción, estos datos deberían almacenarse en la base de datos
// Actualmente no existe un modelo SyncConnection en Prisma
// Las conexiones se almacenan en memoria durante la sesión del servidor

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

// Almacenamiento en memoria (se resetea cuando el servidor reinicia)
const syncConnections: SyncConnection[] = [];
const ALLOW_IN_MEMORY = process.env.NODE_ENV !== 'production';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }
    if (!ALLOW_IN_MEMORY) {
      return NextResponse.json(
        { error: 'Sincronizaciones no disponibles en producción' },
        { status: 501 }
      );
    }

    const companyId = (session.user as any).companyId;

    // Filtrar conexiones por empresa
    const companyConnections = syncConnections.filter(
      (conn) => conn.companyId === companyId
    );

    return NextResponse.json({ data: companyConnections });
  } catch (error) {
    logger.error('[Sync Connections GET Error]:', error);
    return NextResponse.json({ error: 'Error al obtener conexiones' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }
    if (!ALLOW_IN_MEMORY) {
      return NextResponse.json(
        { error: 'Sincronizaciones no disponibles en producción' },
        { status: 501 }
      );
    }

    const companyId = (session.user as any).companyId;
    if (!companyId) {
      return NextResponse.json({ error: 'Usuario sin empresa asignada' }, { status: 400 });
    }

    const body = await request.json();
    const parsed = createConnectionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const data = parsed.data;

    const newConnection: SyncConnection = {
      id: `conn-${Date.now()}`,
      companyId,
      nombre: data.nombre,
      tipo: data.tipo || 'API_EXTERNA',
      plataforma: data.plataforma,
      estado: 'ACTIVO',
      frecuencia: data.frecuencia || 'DIARIO',
      registrosSincronizados: 0,
      erroresUltimaSinc: 0,
      direccion: data.direccion || 'BIDIRECCIONAL',
      entidadesSincronizadas: data.entidadesSincronizadas || [],
      configuracion: data.configuracion || {},
      notas: data.notas || '',
      createdAt: new Date().toISOString(),
    };

    syncConnections.push(newConnection);

    return NextResponse.json({ data: newConnection }, { status: 201 });
  } catch (error) {
    logger.error('[Sync Connections POST Error]:', error);
    return NextResponse.json({ error: 'Error al crear conexión' }, { status: 500 });
  }
}
