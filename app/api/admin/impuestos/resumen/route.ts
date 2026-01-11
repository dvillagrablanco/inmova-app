/**
 * API: Resumen de Impuestos
 * 
 * Obtiene el resumen fiscal de la empresa/usuario
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Tipos de modelos fiscales
const MODELOS_FISCALES = {
  // Personas Físicas
  IRPF: { modelo: '100', nombre: 'IRPF - Declaración Anual', periodicidad: 'anual', tipoPersona: 'fisica' },
  RETENCIONES_ALQUILER: { modelo: '115', nombre: 'Retenciones Alquileres', periodicidad: 'trimestral', tipoPersona: 'ambos' },
  RESUMEN_RETENCIONES: { modelo: '180', nombre: 'Resumen Anual Retenciones', periodicidad: 'anual', tipoPersona: 'ambos' },
  // Personas Jurídicas
  IS: { modelo: '200', nombre: 'Impuesto de Sociedades', periodicidad: 'anual', tipoPersona: 'juridica' },
  IS_FRACCIONADO: { modelo: '202', nombre: 'Pago Fraccionado Sociedades', periodicidad: 'trimestral', tipoPersona: 'juridica' },
  // IVA
  IVA_TRIMESTRAL: { modelo: '303', nombre: 'IVA Trimestral', periodicidad: 'trimestral', tipoPersona: 'ambos' },
  IVA_RESUMEN: { modelo: '390', nombre: 'Resumen Anual IVA', periodicidad: 'anual', tipoPersona: 'ambos' },
  // Otros
  OPERACIONES_TERCEROS: { modelo: '347', nombre: 'Operaciones con Terceros', periodicidad: 'anual', tipoPersona: 'ambos' },
};

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Verificar rol (administrador o super_admin)
    const userRole = (session.user as any)?.role;
    if (!['administrador', 'super_admin'].includes(userRole)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    // Parámetros de consulta
    const { searchParams } = new URL(request.url);
    const ejercicio = parseInt(searchParams.get('ejercicio') || new Date().getFullYear().toString());
    const tipoPersona = searchParams.get('tipoPersona') || 'fisica';
    const companyId = searchParams.get('companyId');

    // En una implementación real, esto vendría de la base de datos
    // Por ahora, retornamos datos simulados basados en los parámetros

    // Fechas de vencimiento para el ejercicio
    const proximosVencimientos = [
      {
        id: 'mod-303-q1',
        modelo: '303',
        nombre: 'IVA Trimestral Q1',
        fechaVencimiento: new Date(ejercicio, 3, 20), // 20 Abril
        estado: 'pendiente',
        importeEstimado: 2850,
      },
      {
        id: 'mod-115-q1',
        modelo: '115',
        nombre: 'Retenciones Alquileres Q1',
        fechaVencimiento: new Date(ejercicio, 3, 20),
        estado: 'pendiente',
        importeEstimado: 1350,
      },
    ];

    // Resumen fiscal
    const resumenFiscal = {
      ejercicio,
      tipoPersona,
      ingresosBrutos: 85000,
      gastosDeducibles: 23500,
      baseImponible: 61500,
      impuestoEstimado: tipoPersona === 'fisica' ? 12300 : 15375, // IRPF vs IS
      retencionesYPagosACuenta: 8500,
      resultadoLiquidacion: tipoPersona === 'fisica' ? 3800 : 6875,
    };

    // Inmuebles con IBI
    const inmuebles = [
      {
        id: '1',
        direccion: 'Calle Mayor 15, 3ºA - Madrid',
        tipo: 'vivienda',
        valorCatastral: 185000,
        ibi: {
          importe: 892.45,
          estado: 'pendiente',
          fechaVencimiento: new Date(ejercicio, 9, 15),
        },
      },
    ];

    // Estadísticas
    const estadisticas = {
      totalImpuestosPendientes: proximosVencimientos.filter(v => v.estado === 'pendiente').length,
      importeTotalPendiente: proximosVencimientos
        .filter(v => v.estado === 'pendiente')
        .reduce((sum, v) => sum + (v.importeEstimado || 0), 0),
      totalIBIPendiente: inmuebles
        .filter(i => i.ibi.estado === 'pendiente')
        .reduce((sum, i) => sum + i.ibi.importe, 0),
      proximoVencimiento: proximosVencimientos
        .filter(v => v.estado === 'pendiente')
        .sort((a, b) => a.fechaVencimiento.getTime() - b.fechaVencimiento.getTime())[0],
    };

    return NextResponse.json({
      success: true,
      ejercicio,
      tipoPersona,
      resumenFiscal,
      proximosVencimientos,
      inmuebles,
      estadisticas,
      modelosFiscales: Object.values(MODELOS_FISCALES).filter(
        m => m.tipoPersona === 'ambos' || m.tipoPersona === tipoPersona
      ),
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('[Impuestos Resumen] Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}

/**
 * POST: Registrar nueva obligación fiscal
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const userRole = (session.user as any)?.role;
    if (!['administrador', 'super_admin'].includes(userRole)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const body = await request.json();
    const { modelo, periodo, importeEstimado, observaciones } = body;

    if (!modelo || !periodo) {
      return NextResponse.json({
        error: 'Se requiere modelo y periodo',
      }, { status: 400 });
    }

    // En una implementación real, guardaríamos en la base de datos
    const nuevaObligacion = {
      id: `obl-${Date.now()}`,
      modelo,
      periodo,
      importeEstimado: importeEstimado || 0,
      observaciones: observaciones || '',
      estado: 'pendiente',
      fechaCreacion: new Date().toISOString(),
      creadoPor: session.user?.email,
    };

    return NextResponse.json({
      success: true,
      obligacion: nuevaObligacion,
      message: 'Obligación fiscal registrada correctamente',
    }, { status: 201 });

  } catch (error: any) {
    console.error('[Impuestos POST] Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}
