/**
 * API: Calculadora de Impuestos Inmobiliarios
 * 
 * Calcula estimaciones de impuestos para rendimientos de alquiler
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Schema de validación
const calculoSchema = z.object({
  tipoPersona: z.enum(['fisica', 'juridica']),
  tipoInmueble: z.enum(['vivienda', 'local', 'oficina', 'garaje', 'trastero']),
  ingresosAnuales: z.number().min(0),
  gastosDeducibles: z.number().min(0).optional().default(0),
  valorCatastral: z.number().min(0).optional(),
  comunidadAutonoma: z.string().optional().default('madrid'),
});

// Tipos impositivos IRPF 2024/2025 (estatal)
const TRAMOS_IRPF = [
  { hasta: 12450, tipo: 0.19 },
  { hasta: 20200, tipo: 0.24 },
  { hasta: 35200, tipo: 0.30 },
  { hasta: 60000, tipo: 0.37 },
  { hasta: 300000, tipo: 0.45 },
  { hasta: Infinity, tipo: 0.47 },
];

// Tipos IBI por tipo de inmueble (aproximados)
const TIPOS_IBI = {
  vivienda: { urbano: 0.006, rustico: 0.003 },
  local: { urbano: 0.008, rustico: 0.004 },
  oficina: { urbano: 0.008, rustico: 0.004 },
  garaje: { urbano: 0.006, rustico: 0.003 },
  trastero: { urbano: 0.006, rustico: 0.003 },
};

// Reducción por alquiler de vivienda habitual
const REDUCCION_VIVIENDA_HABITUAL = 0.60; // 60%

// Tipo Impuesto de Sociedades
const TIPO_IS_GENERAL = 0.25;
const TIPO_IS_EMPRENDEDORES = 0.15; // Primeros 2 años con beneficios

/**
 * Calcula IRPF por tramos
 */
function calcularIRPF(baseImponible: number): { cuota: number; tipoMedio: number; desglose: any[] } {
  let cuota = 0;
  let baseRestante = baseImponible;
  const desglose: any[] = [];

  let baseAnterior = 0;
  for (const tramo of TRAMOS_IRPF) {
    if (baseRestante <= 0) break;
    
    const amplitudTramo = tramo.hasta - baseAnterior;
    const baseEnTramo = Math.min(baseRestante, amplitudTramo);
    const cuotaTramo = baseEnTramo * tramo.tipo;
    
    if (baseEnTramo > 0) {
      desglose.push({
        desde: baseAnterior,
        hasta: Math.min(tramo.hasta, baseImponible),
        base: baseEnTramo,
        tipo: tramo.tipo * 100,
        cuota: cuotaTramo,
      });
    }
    
    cuota += cuotaTramo;
    baseRestante -= baseEnTramo;
    baseAnterior = tramo.hasta;
  }

  const tipoMedio = baseImponible > 0 ? (cuota / baseImponible) * 100 : 0;

  return { cuota, tipoMedio, desglose };
}

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const userRole = (session.user as any)?.role;
    if (!['administrador', 'super_admin'].includes(userRole)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    // Validar datos de entrada
    const body = await request.json();
    const datos = calculoSchema.parse(body);

    let resultado: any = {
      tipoPersona: datos.tipoPersona,
      tipoInmueble: datos.tipoInmueble,
      ingresosAnuales: datos.ingresosAnuales,
      gastosDeducibles: datos.gastosDeducibles,
    };

    // Calcular rendimiento neto
    const rendimientoNeto = datos.ingresosAnuales - datos.gastosDeducibles;
    resultado.rendimientoNeto = rendimientoNeto;

    if (datos.tipoPersona === 'fisica') {
      // IRPF para rendimientos de capital inmobiliario
      
      // Aplicar reducción del 60% si es vivienda destinada a alquiler
      let baseImponible = rendimientoNeto;
      let reduccionAplicada = 0;
      
      if (datos.tipoInmueble === 'vivienda' && rendimientoNeto > 0) {
        reduccionAplicada = rendimientoNeto * REDUCCION_VIVIENDA_HABITUAL;
        baseImponible = rendimientoNeto - reduccionAplicada;
      }
      
      resultado.reduccionVivienda = {
        aplicable: datos.tipoInmueble === 'vivienda',
        porcentaje: REDUCCION_VIVIENDA_HABITUAL * 100,
        importe: reduccionAplicada,
      };
      
      resultado.baseImponible = baseImponible;
      
      // Calcular cuota IRPF
      const irpf = calcularIRPF(baseImponible);
      resultado.cuotaIRPF = irpf.cuota;
      resultado.tipoMedioIRPF = irpf.tipoMedio;
      resultado.desgloseIRPF = irpf.desglose;
      
      // Retenciones (19% sobre rendimiento bruto si inquilino es empresa/autónomo)
      resultado.retencionesEstimadas = {
        porcentaje: 19,
        importe: datos.ingresosAnuales * 0.19,
        nota: 'Aplicable si el arrendatario es empresa o profesional',
      };
      
      // Resultado a pagar/devolver
      resultado.resultadoLiquidacion = irpf.cuota;
      
    } else {
      // Impuesto de Sociedades
      
      resultado.baseImponible = rendimientoNeto;
      
      // Tipo general IS (25%)
      resultado.tipoIS = TIPO_IS_GENERAL * 100;
      resultado.cuotaIS = rendimientoNeto > 0 ? rendimientoNeto * TIPO_IS_GENERAL : 0;
      
      // Información sobre tipo reducido para emprendedores
      resultado.tipoReducido = {
        disponible: true,
        tipo: TIPO_IS_EMPRENDEDORES * 100,
        cuotaReducida: rendimientoNeto > 0 ? rendimientoNeto * TIPO_IS_EMPRENDEDORES : 0,
        condiciones: 'Aplicable durante los 2 primeros ejercicios con base imponible positiva',
      };
      
      resultado.resultadoLiquidacion = resultado.cuotaIS;
    }

    // Calcular IBI si se proporciona valor catastral
    if (datos.valorCatastral && datos.valorCatastral > 0) {
      const tipoIBI = TIPOS_IBI[datos.tipoInmueble]?.urbano || 0.006;
      resultado.ibiEstimado = {
        valorCatastral: datos.valorCatastral,
        tipoAplicado: tipoIBI * 100,
        cuotaEstimada: datos.valorCatastral * tipoIBI,
        nota: 'El tipo exacto varía según el municipio',
      };
    }

    // Resumen
    resultado.resumen = {
      rendimientoBruto: datos.ingresosAnuales,
      gastosDeducidos: datos.gastosDeducibles,
      rendimientoNeto: rendimientoNeto,
      baseImponible: resultado.baseImponible,
      impuestoEstimado: resultado.resultadoLiquidacion,
      tipoEfectivo: resultado.baseImponible > 0 
        ? ((resultado.resultadoLiquidacion / resultado.baseImponible) * 100).toFixed(2) + '%'
        : '0%',
    };

    // Disclaimer
    resultado.disclaimer = 'Este cálculo es orientativo y no constituye asesoramiento fiscal. ' +
      'Los tipos impositivos y deducciones pueden variar según tu situación personal, ' +
      'comunidad autónoma y legislación vigente. Consulta con un asesor fiscal.';

    return NextResponse.json({
      success: true,
      calculo: resultado,
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Datos de entrada inválidos',
        details: error.errors,
      }, { status: 400 });
    }

    console.error('[Impuestos Calcular] Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}
