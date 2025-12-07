/**
 * Servicio de Pricing Dinámico con IA
 * Análisis de mercado, optimización de precios y recomendaciones
 */

import { prisma } from './db';
import { subMonths, format } from 'date-fns';

/**
 * Analiza el mercado y genera una recomendación de precio
 */
export async function analizarPrecioOptimo(
  companyId: string,
  unitId: string,
  estrategia: 'aggressive' | 'moderate' | 'conservative' = 'moderate'
) {
  // Obtener datos de la unidad
  const unit = await prisma.unit.findUnique({
    where: { id: unitId },
    include: {
      building: true,
      contracts: {
        where: { estado: 'activo' },
        orderBy: { fechaInicio: 'desc' },
        take: 1
      }
    }
  });

  if (!unit) {
    throw new Error('Unidad no encontrada');
  }

  const precioActual = unit.rentaMensual || unit.contracts[0]?.rentaMensual || 0;

  // Buscar datos de mercado similares (usar dirección del edificio)
  const zona = unit.building.direccion || 'Madrid';
  const habitaciones = 2; // Valor por defecto ya que no existe unit.habitaciones
  const metrosCuadrados = 80; // Valor por defecto ya que no existe unit.metrosCuadrados
  
  const marketData = await prisma.marketData.findFirst({
    where: {
      companyId,
      zona: { contains: zona },
      numHabitaciones: habitaciones
    },
    orderBy: { createdAt: 'desc' }
  });

  const precioMercado = marketData?.precioPromedio || precioActual;

  // Factores de ajuste
  const factores: any = {
    ubicacion: 1.0,
    estado: 1.0,
    amenities: 1.0,
    demanda: 1.0,
    estacionalidad: 1.0
  };

  // Ajuste por estado de la unidad (usar estado general)
  if (unit.estado === 'disponible') factores.estado = 1.05;
  else if (unit.estado === 'ocupada') factores.estado = 1.0;
  else factores.estado = 0.95;

  // Ajuste por amenities (valores por defecto)
  const amenitiesCount = 3; // Valor estimado
  factores.amenities = 1 + (amenitiesCount * 0.03);

  // Ajuste por demanda (basado en estado)
  const diasVacante = unit.estado === 'disponible' ? 30 : 0; // Simulación
  if (diasVacante > 60) factores.demanda = 0.90;
  else if (diasVacante > 30) factores.demanda = 0.95;
  else factores.demanda = 1.05;

  // Ajuste por estacionalidad
  const mesActual = new Date().getMonth();
  if ([5, 6, 7].includes(mesActual)) factores.estacionalidad = 1.08; // Verano
  else if ([0, 1, 11].includes(mesActual)) factores.estacionalidad = 0.95; // Invierno

  // Calcular factor total
  const factorTotal = Object.values(factores).reduce((a, b) => a * b, 1);
  let precioSugerido = precioMercado * factorTotal;

  // Aplicar estrategia
  if (estrategia === 'aggressive') {
    precioSugerido *= 1.10; // +10%
  } else if (estrategia === 'conservative') {
    precioSugerido *= 0.95; // -5%
  }

  // Rangos de precio
  const precioMinimo = precioSugerido * 0.85;
  const precioMaximo = precioSugerido * 1.15;

  // Probabilidad de alquiler (modelo simple)
  let probabilidadAlquiler = 70;
  if (precioSugerido > precioMercado * 1.1) probabilidadAlquiler = 50;
  else if (precioSugerido < precioMercado * 0.9) probabilidadAlquiler = 90;

  // Días estimados hasta alquiler
  const diasHastaAlquiler = Math.round(30 / (probabilidadAlquiler / 100));

  // Recomendación
  let recomendacion = '';
  if (precioActual > precioSugerido * 1.1) {
    recomendacion = 'REDUCIR PRECIO: El precio actual está significativamente por encima del mercado. Recomendamos reducir para aumentar competitividad.';
  } else if (precioActual < precioSugerido * 0.9) {
    recomendacion = 'INCREMENTAR PRECIO: Hay margen para incrementar el precio y optimizar ingresos sin afectar la demanda.';
  } else {
    recomendacion = 'MANTENER PRECIO: El precio actual está dentro del rango óptimo del mercado.';
  }

  return {
    precioActual,
    precioSugerido: Math.round(precioSugerido),
    precioMinimo: Math.round(precioMinimo),
    precioMaximo: Math.round(precioMaximo),
    precioMercado,
    factores,
    probabilidadAlquiler,
    diasHastaAlquiler,
    demandaEstimada: probabilidadAlquiler > 70 ? 'alta' : probabilidadAlquiler > 50 ? 'media' : 'baja',
    estrategia,
    recomendacion,
    competidores: [],
    validoHasta: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 días
  };
}

/**
 * Simula datos de mercado para análisis
 */
export async function simularDatosMercado(
  companyId: string,
  zona: string,
  numHabitaciones: number,
  metrosCuadrados: number
) {
  // Precios base por zona (ejemplo Madrid)
  const preciosBase: Record<string, number> = {
    'Centro': 1500,
    'Salamanca': 1800,
    'Chamberí': 1600,
    'Retiro': 1400,
    'Chamartín': 1500,
    'default': 1200
  };

  const precioBase = preciosBase[zona] || preciosBase.default;

  // Ajustes
  const ajusteHabitaciones = numHabitaciones * 200;
  const ajusteMetros = (metrosCuadrados / 10) * 15;

  const precioPromedio = precioBase + ajusteHabitaciones + ajusteMetros;
  const precioMin = precioPromedio * 0.8;
  const precioMax = precioPromedio * 1.3;

  const periodo = format(new Date(), 'MM-yyyy');

  // Crear dato de mercado (sin upsert por problema de índice único)
  const existing = await prisma.marketData.findFirst({
    where: { companyId, zona, periodo }
  });
  
  let marketData;
  if (existing) {
    marketData = await prisma.marketData.update({
      where: { id: existing.id },
      data: {
        precioPromedio,
        precioMin,
        precioMax,
        muestras: (existing.muestras || 0) + 1
      }
    });
  } else {
    marketData = await prisma.marketData.create({
      data: {
        companyId,
        zona,
        codigoPostal: '28001',
        precioPromedio,
        precioMin,
        precioMax,
        diasPromedioAlquiler: 25,
        tasaOcupacion: 92.5,
        demanda: 'alta',
        tipoPropiedad: 'piso',
        numHabitaciones,
        metrosCuadrados,
        fuente: 'simulacion',
        periodo
      }
    });
  }

  return marketData;
}

/**
 * Aplica una estrategia de pricing a una unidad
 */
export async function aplicarEstrategiaPricing(
  strategyId: string,
  unitId: string
) {
  const strategy = await prisma.pricingStrategy.findUnique({
    where: { id: strategyId }
  });

  if (!strategy || !strategy.activa) {
    throw new Error('Estrategia no válida o inactiva');
  }

  const unit = await prisma.unit.findUnique({ where: { id: unitId } });
  if (!unit) {
    throw new Error('Unidad no encontrada');
  }

  // Analizar precio óptimo
  const analisis = await analizarPrecioOptimo(
    strategy.companyId,
    unitId,
    strategy.tipo as any
  );

  // Verificar límite de ajuste
  const cambioPortcentaje = Math.abs(
    ((analisis.precioSugerido - unit.rentaMensual) / unit.rentaMensual) * 100
  );

  let precioFinal = analisis.precioSugerido;
  
  if (strategy.ajusteAutomatico && cambioPortcentaje <= strategy.limitePorcentaje) {
    // Aplicar cambio automático
    await prisma.unit.update({
      where: { id: unitId },
      data: { rentaMensual: precioFinal }
    });

    // Actualizar estrategia
    await prisma.pricingStrategy.update({
      where: { id: strategyId },
      data: {
        ultimaEjecucion: new Date(),
        vecesAplicada: { increment: 1 }
      }
    });

    return {
      aplicado: true,
      precioAnterior: unit.rentaMensual,
      precioNuevo: precioFinal,
      cambioPortcentaje
    };
  }

  return {
    aplicado: false,
    motivo: 'Cambio excede el límite configurado',
    precioSugerido: precioFinal,
    precioActual: unit.rentaMensual,
    cambioPortcentaje
  };
}
