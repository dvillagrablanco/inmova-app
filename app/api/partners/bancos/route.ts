import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// Bancos disponibles para integración
const BANCOS = [
  {
    id: 'bank-1',
    nombre: 'Santander',
    tipo: 'comercial',
    productos: ['Hipotecas', 'Préstamos', 'Cuentas Empresa'],
    comisionHipoteca: 0.5,
    logo: '/logos/santander.png',
    activo: true,
  },
  {
    id: 'bank-2',
    nombre: 'BBVA',
    tipo: 'comercial',
    productos: ['Hipotecas', 'Financiación', 'Leasing Inmobiliario'],
    comisionHipoteca: 0.4,
    logo: '/logos/bbva.png',
    activo: true,
  },
  {
    id: 'bank-3',
    nombre: 'CaixaBank',
    tipo: 'comercial',
    productos: ['Hipotecas', 'Préstamos Promotor', 'Seguro Hogar'],
    comisionHipoteca: 0.45,
    logo: '/logos/caixabank.png',
    activo: true,
  },
  {
    id: 'bank-4',
    nombre: 'Bankinter',
    tipo: 'banca_privada',
    productos: ['Hipotecas Premium', 'Inversiones Inmobiliarias'],
    comisionHipoteca: 0.6,
    logo: '/logos/bankinter.png',
    activo: true,
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

    let bancos = BANCOS;
    if (tipo && tipo !== 'all') {
      bancos = bancos.filter(b => b.tipo === tipo);
    }

    try {
      const partnerConfig = await prisma.partnerIntegration.findMany({
        where: {
          partnerId: session.user.id,
          tipo: 'banco',
        },
      });

      const bancosConConfig = bancos.map(banco => {
        const config = partnerConfig.find((p: any) => p.externalId === banco.id);
        return {
          ...banco,
          configurado: !!config,
          activo: config?.activo ?? false,
        };
      });

      return NextResponse.json({
        bancos: bancosConConfig,
        totalConfigurados: partnerConfig.filter((p: any) => p.activo).length,
      });
    } catch {
      return NextResponse.json({
        bancos: bancos.map(b => ({ ...b, configurado: false })),
        totalConfigurados: 0,
      });
    }
  } catch (error: any) {
    console.error('[API Bancos] Error:', error);
    return NextResponse.json({ error: 'Error al obtener bancos' }, { status: 500 });
  }
}
