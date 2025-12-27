import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // En producción, aquí generarías un archivo Excel/CSV con los datos de BI
    // Por ahora, solo retornamos un mensaje de éxito
    const csvContent = 'data:text/csv;charset=utf-8,Categoria,Valor\nIngresos,10000\nGastos,5000';
    
    return NextResponse.json({ 
      success: true,
      message: 'Exportación preparada',
      data: csvContent
    });
  } catch (error: any) {
    logger.error('Error al exportar datos de BI:', error);
    return NextResponse.json(
      { error: 'Error al exportar datos' },
      { status: 500 }
    );
  }
}
