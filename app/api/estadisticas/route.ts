/**
 * API de Estadísticas
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const monthlyData = [
      { mes: 'Jul', ingresos: 98500, ocupacion: 89 },
      { mes: 'Ago', ingresos: 105200, ocupacion: 91 },
      { mes: 'Sep', ingresos: 112800, ocupacion: 93 },
      { mes: 'Oct', ingresos: 118400, ocupacion: 94 },
      { mes: 'Nov', ingresos: 115600, ocupacion: 92 },
      { mes: 'Dic', ingresos: 124500, ocupacion: 92 },
    ];

    const propertyTypes = [
      { tipo: 'Apartamentos', count: 85, ocupacion: 94, ingresos: 68500 },
      { tipo: 'Estudios', count: 42, ocupacion: 91, ingresos: 28200 },
      { tipo: 'Locales', count: 18, ocupacion: 78, ingresos: 18500 },
      { tipo: 'Oficinas', count: 11, ocupacion: 82, ingresos: 9300 },
    ];

    const topProperties = [
      { nombre: 'Torre Marina', unidades: 24, ocupacion: 100, ingresos: 28800 },
      { nombre: 'Residencial Sol', unidades: 18, ocupacion: 94, ingresos: 21600 },
      { nombre: 'Centro Empresarial', unidades: 12, ocupacion: 92, ingresos: 15200 },
      { nombre: 'Parque Residencial', unidades: 15, ocupacion: 87, ingresos: 13500 },
    ];

    return NextResponse.json({
      success: true,
      data: {
        monthlyData,
        propertyTypes,
        topProperties,
      },
    });
  } catch (error) {
    console.error('[API Error] Estadísticas:', error);
    return NextResponse.json({ error: 'Error obteniendo estadísticas' }, { status: 500 });
  }
}
