export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

interface BankDossierInput {
  inversor: {
    nombre: string;
    dni: string;
    situacionLaboral: 'asalariado' | 'autonomo' | 'empresario' | 'mixto';
    ingresosMensualesNetos: number;
    antiguedadLaboral: number;
    otrosIngresos: number;
  };
  patrimonioActual: {
    inmuebles: {
      direccion: string;
      valorEstimado: number;
      hipotecaPendiente: number;
      rentaMensual: number;
    }[];
    ahorros: number;
    otrosActivos: number;
  };
  deudasActuales: {
    concepto: string;
    cuotaMensual: number;
    pendiente: number;
  }[];
  operacionPropuesta: {
    direccion: string;
    precioCompra: number;
    gastosCompra: number;
    reformaEstimada: number;
    financiacionSolicitada: number;
    plazoAnos: number;
    tipoInteres: number;
    destinoInversion: 'alquiler_tradicional' | 'alquiler_habitaciones' | 'alquiler_turistico' | 'flipping' | 'vivienda_habitual';
    rentaEstimadaMensual: number;
  };
}

function calculateMortgagePayment(principal: number, rate: number, years: number): number {
  const monthlyRate = rate / 100 / 12;
  const n = years * 12;
  if (monthlyRate <= 0) return principal / n;
  return principal * (monthlyRate * Math.pow(1 + monthlyRate, n)) / (Math.pow(1 + monthlyRate, n) - 1);
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const input: BankDossierInput = await req.json();
    const { inversor, patrimonioActual, deudasActuales, operacionPropuesta } = input;

    const totalIngresosAnuales = (inversor.ingresosMensualesNetos + inversor.otrosIngresos) * 12;
    const rentasActualesAnuales = patrimonioActual.inmuebles.reduce((s, i) => s + i.rentaMensual * 12, 0);
    const totalIngresosConRentas = totalIngresosAnuales + rentasActualesAnuales;

    const valorTotalInmuebles = patrimonioActual.inmuebles.reduce((s, i) => s + i.valorEstimado, 0);
    const hipotecasTotalPendiente = patrimonioActual.inmuebles.reduce((s, i) => s + i.hipotecaPendiente, 0);
    const patrimonioInmobiliarioNeto = valorTotalInmuebles - hipotecasTotalPendiente;
    const patrimonioTotal = patrimonioInmobiliarioNeto + patrimonioActual.ahorros + patrimonioActual.otrosActivos;

    const cuotasDeudasMensuales = deudasActuales.reduce((s, d) => s + d.cuotaMensual, 0);
    const hipotecasActualesMensuales = patrimonioActual.inmuebles.reduce((s, i) => {
      if (i.hipotecaPendiente > 0) {
        return s + calculateMortgagePayment(i.hipotecaPendiente, 3.5, 20);
      }
      return s;
    }, 0);

    const nuevaCuotaHipoteca = calculateMortgagePayment(
      operacionPropuesta.financiacionSolicitada,
      operacionPropuesta.tipoInteres,
      operacionPropuesta.plazoAnos
    );

    const totalCuotasMensualesActuales = cuotasDeudasMensuales + hipotecasActualesMensuales;
    const totalCuotasMensualesPostCompra = totalCuotasMensualesActuales + nuevaCuotaHipoteca;

    const ingresosMensualesTotal = inversor.ingresosMensualesNetos + inversor.otrosIngresos
      + patrimonioActual.inmuebles.reduce((s, i) => s + i.rentaMensual, 0);

    const ratioEndeudamientoActual = ingresosMensualesTotal > 0
      ? (totalCuotasMensualesActuales / ingresosMensualesTotal) * 100 : 0;

    const ingresosMensualesPostCompra = ingresosMensualesTotal + operacionPropuesta.rentaEstimadaMensual;
    const ratioEndeudamientoPost = ingresosMensualesPostCompra > 0
      ? (totalCuotasMensualesPostCompra / ingresosMensualesPostCompra) * 100 : 0;

    const ltvSolicitado = operacionPropuesta.precioCompra > 0
      ? (operacionPropuesta.financiacionSolicitada / operacionPropuesta.precioCompra) * 100 : 0;

    const cashFlowMensualNuevoInmueble = operacionPropuesta.rentaEstimadaMensual - nuevaCuotaHipoteca;
    const rentabilidadBruta = operacionPropuesta.precioCompra > 0
      ? (operacionPropuesta.rentaEstimadaMensual * 12 / operacionPropuesta.precioCompra) * 100 : 0;

    const aportacionNecesaria = operacionPropuesta.precioCompra + operacionPropuesta.gastosCompra
      + operacionPropuesta.reformaEstimada - operacionPropuesta.financiacionSolicitada;

    const fmt = (n: number) => new Intl.NumberFormat('es-ES', { maximumFractionDigits: 0 }).format(n);

    const dossier = {
      generadoEl: new Date().toISOString(),
      inversor: {
        ...inversor,
        ingresosBrutosMensuales: inversor.ingresosMensualesNetos,
        ingresosAnuales: totalIngresosAnuales,
        totalIngresosConRentas: totalIngresosConRentas,
      },
      resumenPatrimonial: {
        numInmuebles: patrimonioActual.inmuebles.length,
        valorTotalInmuebles,
        hipotecasTotalPendiente,
        patrimonioInmobiliarioNeto,
        ahorrosDisponibles: patrimonioActual.ahorros,
        otrosActivos: patrimonioActual.otrosActivos,
        patrimonioNetoTotal: patrimonioTotal,
        rentasAlquilerMensuales: patrimonioActual.inmuebles.reduce((s, i) => s + i.rentaMensual, 0),
      },
      analisisEndeudamiento: {
        cuotasMensualesActuales: Math.round(totalCuotasMensualesActuales),
        cuotaMensualesPostCompra: Math.round(totalCuotasMensualesPostCompra),
        nuevaCuotaHipoteca: Math.round(nuevaCuotaHipoteca),
        ratioEndeudamientoActual: parseFloat(ratioEndeudamientoActual.toFixed(1)),
        ratioEndeudamientoPost: parseFloat(ratioEndeudamientoPost.toFixed(1)),
        limiteRecomendado: 35,
        estado: ratioEndeudamientoPost <= 35 ? 'viable' : ratioEndeudamientoPost <= 40 ? 'ajustado' : 'excesivo',
      },
      operacion: {
        ...operacionPropuesta,
        inversionTotal: operacionPropuesta.precioCompra + operacionPropuesta.gastosCompra + operacionPropuesta.reformaEstimada,
        aportacionNecesaria: Math.round(aportacionNecesaria),
        ltv: parseFloat(ltvSolicitado.toFixed(1)),
        cuotaMensualEstimada: Math.round(nuevaCuotaHipoteca),
        cashFlowMensualEstimado: Math.round(cashFlowMensualNuevoInmueble),
        cashFlowAnualEstimado: Math.round(cashFlowMensualNuevoInmueble * 12),
        rentabilidadBruta: parseFloat(rentabilidadBruta.toFixed(2)),
      },
      viabilidad: {
        ratioDeudaOk: ratioEndeudamientoPost <= 35,
        ltvOk: ltvSolicitado <= 80,
        cashFlowPositivo: cashFlowMensualNuevoInmueble > 0,
        ahorrosSuficientes: patrimonioActual.ahorros >= aportacionNecesaria,
        veredicto: ratioEndeudamientoPost <= 35 && ltvSolicitado <= 80 && cashFlowMensualNuevoInmueble > 0
          ? 'VIABLE' : ratioEndeudamientoPost <= 40 ? 'VIABLE CON AJUSTES' : 'DIFÍCIL',
      },
    };

    return NextResponse.json({ success: true, dossier });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error desconocido';
    console.error('[bank-dossier] Error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
