/**
 * API: Add-ons comprados por la empresa
 */
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Por ahora devolver array vacío - se conectará con BD cuando exista el modelo
    // En producción: consultar tabla de add-ons comprados por la empresa
    const addOns: Array<{ codigo: string; fechaCompra: string }> = [];

    return NextResponse.json({ addOns });
  } catch (error: any) {
    console.error('[API Error] /api/addons/purchased:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
