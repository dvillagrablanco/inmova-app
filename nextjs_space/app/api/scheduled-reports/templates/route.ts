import { NextRequest, NextResponse } from 'next/server';
export const dynamic = "force-dynamic";
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger from '@/lib/logger';

interface ReportTemplate {
  id: string;
  nombre: string;
  descripcion: string;
  tipo: 'morosidad' | 'ocupacion' | 'ingresos' | 'gastos' | 'mantenimiento' | 'general';
  frecuenciaSugerida: 'diario' | 'semanal' | 'quincenal' | 'mensual' | 'trimestral' | 'anual';
  incluirPdf: boolean;
  incluirCsv: boolean;
  filtros?: string;
  campos: string[];
}

const TEMPLATES: ReportTemplate[] = [
  {
    id: 'morosidad-semanal',
    nombre: 'Reporte Semanal de Morosidad',
    descripcion: 'Análisis completo de pagos pendientes y atrasados, con detalle por inquilino y unidad',
    tipo: 'morosidad',
    frecuenciaSugerida: 'semanal',
    incluirPdf: true,
    incluirCsv: true,
    campos: ['inquilino', 'unidad', 'monto_adeudado', 'dias_retraso', 'ultimo_pago'],
  },
  {
    id: 'morosidad-mensual',
    nombre: 'Resumen Mensual de Morosidad',
    descripcion: 'Resumen mensual de la morosidad con gráficas de evolución y comparativas',
    tipo: 'morosidad',
    frecuenciaSugerida: 'mensual',
    incluirPdf: true,
    incluirCsv: true,
    campos: ['total_adeudado', 'num_inquilinos_morosos', 'tasa_morosidad', 'evolucion_mensual'],
  },
  {
    id: 'ocupacion-mensual',
    nombre: 'Reporte de Ocupación Mensual',
    descripcion: 'Estado de ocupación de todas las unidades con tasas de vacancia y renovaciones',
    tipo: 'ocupacion',
    frecuenciaSugerida: 'mensual',
    incluirPdf: true,
    incluirCsv: true,
    campos: ['unidades_ocupadas', 'unidades_vacias', 'tasa_ocupacion', 'contratos_proximos_vencer'],
  },
  {
    id: 'ingresos-mensual',
    nombre: 'Reporte Mensual de Ingresos',
    descripcion: 'Detalle de todos los ingresos del mes con comparativas y proyecciones',
    tipo: 'ingresos',
    frecuenciaSugerida: 'mensual',
    incluirPdf: true,
    incluirCsv: true,
    campos: ['ingresos_alquiler', 'ingresos_otros', 'total_ingresos', 'comparativa_mes_anterior'],
  },
  {
    id: 'ingresos-trimestral',
    nombre: 'Análisis Trimestral de Ingresos',
    descripcion: 'Resumen ejecutivo de ingresos trimestrales con tendencias y proyecciones',
    tipo: 'ingresos',
    frecuenciaSugerida: 'trimestral',
    incluirPdf: true,
    incluirCsv: false,
    campos: ['ingresos_totales', 'tendencias', 'proyecciones', 'roi'],
  },
  {
    id: 'gastos-mensual',
    nombre: 'Reporte Mensual de Gastos',
    descripcion: 'Detalle completo de gastos operativos y de mantenimiento',
    tipo: 'gastos',
    frecuenciaSugerida: 'mensual',
    incluirPdf: true,
    incluirCsv: true,
    campos: ['gastos_mantenimiento', 'gastos_administracion', 'gastos_servicios', 'total_gastos'],
  },
  {
    id: 'gastos-anual',
    nombre: 'Resumen Anual de Gastos',
    descripcion: 'Análisis anual de gastos con gráficas de distribución y comparativas',
    tipo: 'gastos',
    frecuenciaSugerida: 'anual',
    incluirPdf: true,
    incluirCsv: true,
    campos: ['gastos_totales', 'distribucion_categorias', 'evolucion_anual', 'optimizaciones'],
  },
  {
    id: 'mantenimiento-semanal',
    nombre: 'Reporte Semanal de Mantenimiento',
    descripcion: 'Estado de órdenes de trabajo y tareas de mantenimiento pendientes',
    tipo: 'mantenimiento',
    frecuenciaSugerida: 'semanal',
    incluirPdf: true,
    incluirCsv: true,
    campos: ['ordenes_abiertas', 'ordenes_completadas', 'mantenimientos_preventivos', 'costos'],
  },
  {
    id: 'mantenimiento-mensual',
    nombre: 'Resumen Mensual de Mantenimiento',
    descripcion: 'Análisis mensual de mantenimiento preventivo y correctivo',
    tipo: 'mantenimiento',
    frecuenciaSugerida: 'mensual',
    incluirPdf: true,
    incluirCsv: true,
    campos: ['mantenimientos_realizados', 'costos_totales', 'tiempo_respuesta', 'satisfaccion'],
  },
  {
    id: 'ejecutivo-mensual',
    nombre: 'Reporte Ejecutivo Mensual',
    descripcion: 'Dashboard ejecutivo con KPIs principales y tendencias del mes',
    tipo: 'general',
    frecuenciaSugerida: 'mensual',
    incluirPdf: true,
    incluirCsv: false,
    campos: ['ocupacion', 'ingresos', 'gastos', 'morosidad', 'rentabilidad'],
  },
  {
    id: 'ejecutivo-trimestral',
    nombre: 'Reporte Ejecutivo Trimestral',
    descripcion: 'Resumen ejecutivo trimestral con análisis de performance y proyecciones',
    tipo: 'general',
    frecuenciaSugerida: 'trimestral',
    incluirPdf: true,
    incluirCsv: false,
    campos: ['kpis_principales', 'tendencias', 'comparativas', 'recomendaciones'],
  },
  {
    id: 'compliance-mensual',
    nombre: 'Reporte de Compliance Mensual',
    descripcion: 'Estado de cumplimiento normativo y documentación legal',
    tipo: 'general',
    frecuenciaSugerida: 'mensual',
    incluirPdf: true,
    incluirCsv: true,
    campos: ['contratos_vigentes', 'certificados', 'seguros', 'inspecciones', 'cumplimiento'],
  },
];

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const tipo = searchParams.get('tipo');

    let templates = TEMPLATES;

    // Filtrar por tipo si se especifica
    if (tipo) {
      templates = templates.filter(t => t.tipo === tipo);
    }

    return NextResponse.json(templates);
  } catch (error) {
    logger.error('Error al obtener plantillas:', error);
    return NextResponse.json(
      { error: 'Error al obtener plantillas' },
      { status: 500 }
    );
  }
}
