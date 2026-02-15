/**
 * API: Automation Templates
 * GET /api/automation-templates - Lista plantillas de automatización
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export const dynamic = 'force-dynamic';

const TEMPLATES = [
  {
    id: 'template-1',
    nombre: 'Recordatorio de Pago',
    descripcion: 'Envía recordatorios automáticos 5 días antes del vencimiento del pago',
    categoria: 'pagos',
    icono: 'DollarSign',
    popular: true,
  },
  {
    id: 'template-2',
    nombre: 'Bienvenida a Inquilino',
    descripcion: 'Envía email de bienvenida automático cuando se firma un contrato',
    categoria: 'comunicacion',
    icono: 'Mail',
    popular: true,
  },
  {
    id: 'template-3',
    nombre: 'Renovación de Contrato',
    descripcion: 'Notifica 60 días antes del vencimiento del contrato',
    categoria: 'contratos',
    icono: 'FileText',
    popular: true,
  },
  {
    id: 'template-4',
    nombre: 'Seguimiento de Incidencias',
    descripcion: 'Notifica si una incidencia lleva más de 48h sin resolver',
    categoria: 'mantenimiento',
    icono: 'Wrench',
    popular: false,
  },
  {
    id: 'template-5',
    nombre: 'Informe Mensual',
    descripcion: 'Genera y envía informe de cartera el primer día de cada mes',
    categoria: 'reportes',
    icono: 'BarChart',
    popular: false,
  },
  {
    id: 'template-6',
    nombre: 'Actualización de Renta',
    descripcion: 'Calcula y notifica actualización de IPC anual',
    categoria: 'pagos',
    icono: 'TrendingUp',
    popular: false,
  },
  {
    id: 'template-7',
    nombre: 'Revisión de Fianza',
    descripcion: 'Recordatorio para revisar fianzas antes de fin de contrato',
    categoria: 'contratos',
    icono: 'Shield',
    popular: false,
  },
  {
    id: 'template-8',
    nombre: 'Lead Nurturing',
    descripcion: 'Secuencia de emails para leads interesados en propiedades',
    categoria: 'marketing',
    icono: 'Users',
    popular: true,
  },
];

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const categoria = searchParams.get('categoria');
    const popular = searchParams.get('popular');

    let templates = [...TEMPLATES];

    if (categoria) {
      templates = templates.filter(t => t.categoria === categoria);
    }

    if (popular === 'true') {
      templates = templates.filter(t => t.popular);
    }

    return NextResponse.json(templates);
  } catch (error: any) {
    logger.error('[Automation Templates Error]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
