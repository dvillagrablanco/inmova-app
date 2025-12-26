/**
 * Servicio de ESG y Sostenibilidad
 * Gestión de huella de carbono, planes de descarbonización, certificaciones y reportes ESG
 */

import { prisma } from './db';
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';

/**
 * Calcula la huella de carbono para un edificio o toda la compañía
 */
export async function calcularHuellaCarbono(
  companyId: string,
  buildingId: string | null,
  fechaInicio: Date,
  fechaFin: Date
) {
  // Obtener datos de energía consumida
  const energyReadings = await prisma.ioTReading.findMany({
    where: {
      device: {
        companyId,
        buildingId: buildingId || undefined,
        tipo: 'energy_meter',
      },
      metrica: 'power',
      timestamp: {
        gte: fechaInicio,
        lte: fechaFin,
      },
    },
  });

  // Factores de emisión (kg CO2e por kWh)
  const factorEmisionElectricidad = 0.25; // España ~0.25 kg CO2/kWh
  const factorEmisionGas = 0.2;

  // Scope 1: Emisiones directas (gas natural, calderas)
  const scope1 =
    energyReadings
      .filter((r) => r.unidad === 'kWh_gas')
      .reduce((sum, r) => sum + r.valor * factorEmisionGas, 0) / 1000; // Toneladas

  // Scope 2: Emisiones indirectas por electricidad
  const scope2 =
    energyReadings
      .filter((r) => r.unidad === 'kWh')
      .reduce((sum, r) => sum + r.valor * factorEmisionElectricidad, 0) / 1000;

  // Scope 3: Otras emisiones (estimación basada en gastos)
  const whereExpense: any = {
    fecha: {
      gte: fechaInicio,
      lte: fechaFin,
    },
  };
  if (buildingId) {
    whereExpense.buildingId = buildingId;
  }
  const expenses = await prisma.expense.findMany({
    where: whereExpense,
  });

  const scope3 = expenses.reduce((sum, e) => sum + e.monto * 0.001, 0); // Estimación: 1kg CO2/€

  const total = scope1 + scope2 + scope3;

  // Calcular intensidad (estimación: 100m2 por unidad promedio)
  const building = buildingId
    ? await prisma.building.findUnique({ where: { id: buildingId } })
    : null;
  const metrosCuadrados = building ? building.numeroUnidades * 100 : 1000;
  const intensidadPorM2 = (total / metrosCuadrados) * 1000; // kgCO2e/m2

  // Desglose detallado
  const desglose = {
    electricidad: scope2,
    gas: scope1,
    residuos: scope3 * 0.3,
    transporte: scope3 * 0.4,
    otros: scope3 * 0.3,
  };

  return {
    scope1,
    scope2,
    scope3,
    total,
    intensidadPorM2,
    desglose,
    metodologia: 'GHG Protocol',
  };
}

/**
 * Genera un plan de descarbonización
 */
export async function generarPlanDescarbonizacion(
  companyId: string,
  buildingId: string | null,
  emisionesActuales: number,
  objetivoReduccion: number, // Porcentaje
  añoObjetivo: number
) {
  const emisionesObjetivo = emisionesActuales * (1 - objetivoReduccion / 100);
  const reduccionNecesaria = emisionesActuales - emisionesObjetivo;

  // Actuaciones propuestas
  const actuaciones = [
    {
      nombre: 'Instalación de Paneles Solares',
      reduccionCO2: reduccionNecesaria * 0.35,
      coste: 50000,
      ahorro: 8000,
      prioridad: 'alta',
    },
    {
      nombre: 'Mejora de Aislamiento Térmico',
      reduccionCO2: reduccionNecesaria * 0.25,
      coste: 30000,
      ahorro: 5000,
      prioridad: 'alta',
    },
    {
      nombre: 'Sustitución Calderas por Aerotermia',
      reduccionCO2: reduccionNecesaria * 0.2,
      coste: 40000,
      ahorro: 6000,
      prioridad: 'media',
    },
    {
      nombre: 'Iluminación LED',
      reduccionCO2: reduccionNecesaria * 0.1,
      coste: 10000,
      ahorro: 2000,
      prioridad: 'alta',
    },
    {
      nombre: 'Sistema de Gestión Energética IoT',
      reduccionCO2: reduccionNecesaria * 0.1,
      coste: 15000,
      ahorro: 3000,
      prioridad: 'media',
    },
  ];

  const presupuestoTotal = actuaciones.reduce((sum, a) => sum + a.coste, 0);
  const ahorroAnualEstimado = actuaciones.reduce((sum, a) => sum + a.ahorro, 0);
  const periodoRetorno = Math.round(presupuestoTotal / ahorroAnualEstimado);

  // Subvenciones disponibles (estimación)
  const subvencionesDisponibles = [
    { nombre: 'Plan MOVES III', monto: 20000 },
    { nombre: 'Programa PREE', monto: 15000 },
    { nombre: 'Ayudas Autonómicas', monto: 10000 },
  ];

  return {
    emisionesActuales,
    objetivoReduccion,
    emisionesObjetivo,
    añoObjetivo,
    actuaciones,
    presupuestoTotal,
    ahorroAnualEstimado,
    periodoRetorno,
    subvencionesDisponibles,
  };
}

/**
 * Calcula el progreso hacia certificación ESG
 */
export async function calcularProgresoESG(
  companyId: string,
  tipo: string // 'LEED', 'BREEAM', 'VERDE', etc.
) {
  const requisitos: any = {
    LEED: [
      { categoria: 'Energía', peso: 35, completado: 60 },
      { categoria: 'Agua', peso: 15, completado: 80 },
      { categoria: 'Materiales', peso: 15, completado: 40 },
      { categoria: 'Calidad Ambiental Interior', peso: 20, completado: 70 },
      { categoria: 'Innovación', peso: 15, completado: 50 },
    ],
    BREEAM: [
      { categoria: 'Energía', peso: 30, completado: 55 },
      { categoria: 'Gestión', peso: 20, completado: 75 },
      { categoria: 'Salud y Bienestar', peso: 20, completado: 65 },
      { categoria: 'Transporte', peso: 10, completado: 50 },
      { categoria: 'Residuos', peso: 10, completado: 80 },
      { categoria: 'Agua', peso: 10, completado: 70 },
    ],
  };

  const requisitosEspecificos = requisitos[tipo] || requisitos.LEED;
  const progresoTotal =
    requisitosEspecificos.reduce((sum: number, r: any) => sum + (r.completado * r.peso) / 100, 0) /
    requisitosEspecificos.reduce((sum: number, r: any) => sum + r.peso, 0);

  return {
    tipo,
    progreso: Math.round(progresoTotal),
    requisitos: requisitosEspecificos,
    proximosPasos: requisitosEspecificos
      .filter((r: any) => r.completado < 70)
      .sort((a: any, b: any) => b.peso - a.peso)
      .slice(0, 3),
  };
}

/**
 * Genera reporte ESG completo
 */
export async function generarReporteESG(
  companyId: string,
  periodo: string,
  formato: string = 'GRI'
) {
  const [trimestre, año] = periodo.includes('Q')
    ? periodo.split('-')
    : [null, periodo.split('-')[0]];
  const añoFiscal = parseInt(año);

  // Datos ambientales
  const huellaActual = await prisma.carbonFootprint.findFirst({
    where: {
      companyId,
      periodo: {
        contains: año,
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const datosAmbientales = {
    emisionesGEI: huellaActual?.total || 0,
    consumoEnergia: 0, // Se calcularía de IoTReadings
    consumoAgua: 0,
    residuos: 0,
    reciclaje: 0,
  };

  // Datos sociales (placeholder)
  const datosSociales = {
    empleados: 0,
    diversidad: 0,
    capacitacion: 0,
    seguridad: 0,
  };

  // Datos de gobernanza (placeholder)
  const datosGobernanza = {
    cumplimiento: true,
    etica: true,
    transparencia: true,
  };

  return {
    periodo,
    añoFiscal,
    trimestre: trimestre ? parseInt(trimestre.substring(1)) : null,
    formato,
    datosAmbientales,
    datosSociales,
    datosGobernanza,
    emisionesTotales: datosAmbientales.emisionesGEI,
    consumoEnergia: datosAmbientales.consumoEnergia,
    energiaRenovable: 0,
    aguaConsumida: datosAmbientales.consumoAgua,
    residuosGenerados: datosAmbientales.residuos,
    residuosReciclados: datosAmbientales.reciclaje,
  };
}
