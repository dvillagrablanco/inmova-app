import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// Aseguradoras disponibles
const ASEGURADORAS = [
  {
    id: 'as-1',
    nombre: 'MAPFRE Seguros',
    tipo: 'hogar',
    comision: 15,
    logo: '/logos/mapfre.png',
    productos: ['Seguro de Hogar', 'Impago de Alquiler', 'RC Propietario'],
    activa: true,
  },
  {
    id: 'as-2',
    nombre: 'AXA Seguros',
    tipo: 'hogar',
    comision: 12,
    logo: '/logos/axa.png',
    productos: ['Seguro de Hogar', 'Asistencia 24h', 'Defensa Jurídica'],
    activa: true,
  },
  {
    id: 'as-3',
    nombre: 'Allianz',
    tipo: 'multirriesgo',
    comision: 18,
    logo: '/logos/allianz.png',
    productos: ['Multirriesgo Hogar', 'Seguro Comunidad', 'RC'],
    activa: true,
  },
  {
    id: 'as-4',
    nombre: 'Línea Directa',
    tipo: 'impago',
    comision: 20,
    logo: '/logos/lineadirecta.png',
    productos: ['Seguro Impago Alquiler', 'Protección Jurídica'],
    activa: true,
  },
];

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tipo = searchParams.get('tipo');

    let aseguradoras = ASEGURADORAS;
    if (tipo && tipo !== 'all') {
      aseguradoras = aseguradoras.filter(a => a.tipo === tipo);
    }

    // Intentar obtener aseguradoras configuradas para el partner
    try {
      const partnerConfig = await prisma.partnerIntegration.findMany({
        where: {
          partnerId: session.user.id,
          tipo: 'aseguradora',
        },
      });

      const aseguradorasConConfig = aseguradoras.map(aseg => {
        const config = partnerConfig.find((p: any) => p.externalId === aseg.id);
        return {
          ...aseg,
          configurada: !!config,
          apiKey: config?.apiKey ? '****' + config.apiKey.slice(-4) : null,
        };
      });

      return NextResponse.json({
        aseguradoras: aseguradorasConConfig,
        totalConfiguradas: partnerConfig.length,
      });
    } catch {
      return NextResponse.json({
        aseguradoras: aseguradoras.map(a => ({ ...a, configurada: false })),
        totalConfiguradas: 0,
      });
    }
  } catch (error: any) {
    console.error('[API Aseguradoras] Error:', error);
    return NextResponse.json({ error: 'Error al obtener aseguradoras' }, { status: 500 });
  }
}
