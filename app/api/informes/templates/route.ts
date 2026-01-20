import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export const dynamic = 'force-dynamic';

// Templates de informes predefinidos
const REPORT_TEMPLATES = [
  {
    id: 't1',
    nombre: 'Informe Mensual',
    descripcion: 'Resumen mensual de ingresos, gastos y ocupación',
    categoria: 'financiero',
    icono: 'file-text',
    campos: ['ingresos', 'gastos', 'ocupacion', 'morosidad'],
    frecuenciaRecomendada: 'mensual',
    formatos: ['pdf', 'excel'],
  },
  {
    id: 't2',
    nombre: 'Estado de Ocupación',
    descripcion: 'Análisis detallado de ocupación por propiedad',
    categoria: 'operacional',
    icono: 'building',
    campos: ['ocupacion', 'vacantes', 'rotacion'],
    frecuenciaRecomendada: 'semanal',
    formatos: ['pdf', 'excel'],
  },
  {
    id: 't3',
    nombre: 'Análisis de Morosidad',
    descripcion: 'Detalle de pagos pendientes y morosos',
    categoria: 'financiero',
    icono: 'alert-circle',
    campos: ['morosidad', 'antiguedad', 'gestiones'],
    frecuenciaRecomendada: 'semanal',
    formatos: ['pdf', 'excel'],
  },
  {
    id: 't4',
    nombre: 'Contratos por Vencer',
    descripcion: 'Lista de contratos próximos a vencer',
    categoria: 'operacional',
    icono: 'calendar',
    campos: ['contratos', 'vencimientos', 'renovaciones'],
    frecuenciaRecomendada: 'mensual',
    formatos: ['pdf', 'excel'],
  },
  {
    id: 't5',
    nombre: 'Informe de Mantenimiento',
    descripcion: 'Resumen de incidencias y mantenimientos',
    categoria: 'operacional',
    icono: 'wrench',
    campos: ['incidencias', 'costos', 'tiempos'],
    frecuenciaRecomendada: 'mensual',
    formatos: ['pdf'],
  },
];

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const categoria = searchParams.get('categoria');

    let templates = REPORT_TEMPLATES;
    
    if (categoria && categoria !== 'all') {
      templates = templates.filter(t => t.categoria === categoria);
    }

    return NextResponse.json(templates);
  } catch (error: any) {
    console.error('[API Templates] Error:', error);
    return NextResponse.json({ error: 'Error al obtener templates' }, { status: 500 });
  }
}
