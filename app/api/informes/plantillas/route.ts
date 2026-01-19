import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export const dynamic = 'force-dynamic';

// GET - Listar plantillas de informes
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Plantillas predefinidas
    const plantillas = [
      {
        id: 'tpl_1',
        nombre: 'Reporte de Ocupación Mensual',
        descripcion: 'Análisis de ocupación por propiedad',
        tipo: 'propiedades',
        campos: ['nombre', 'direccion', 'tipo', 'ocupacion', 'precio'],
        preview: '/images/templates/ocupacion.png',
        usada: 0,
      },
      {
        id: 'tpl_2',
        nombre: 'Estado de Cuenta Inquilinos',
        descripcion: 'Resumen financiero por inquilino',
        tipo: 'inquilinos',
        campos: ['nombre', 'propiedad', 'renta', 'saldo_pendiente'],
        preview: '/images/templates/inquilinos.png',
        usada: 0,
      },
      {
        id: 'tpl_3',
        nombre: 'Reporte de Pagos',
        descripcion: 'Historial de pagos recibidos',
        tipo: 'pagos',
        campos: ['fecha', 'inquilino', 'monto', 'estado', 'metodo_pago'],
        preview: '/images/templates/pagos.png',
        usada: 0,
      },
      {
        id: 'tpl_4',
        nombre: 'Reporte de Mantenimiento',
        descripcion: 'Solicitudes de mantenimiento y costos',
        tipo: 'mantenimiento',
        campos: ['fecha_solicitud', 'propiedad', 'categoria', 'estado', 'costo'],
        preview: '/images/templates/mantenimiento.png',
        usada: 0,
      },
    ];

    return NextResponse.json({
      success: true,
      data: plantillas,
    });
  } catch (error: any) {
    console.error('[API Plantillas Error]:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
