/**
 * MEDIUM-TERM RENTAL SERVICE
 * Servicio completo para gestión de alquileres a media estancia (1-11 meses)
 * 
 * Características:
 * - Validaciones legales (LAU Art. 3.2)
 * - Cálculo de prorrateo de días
 * - Gestión de inventario digital
 * - Servicios incluidos
 * - Generación de contratos específicos
 */

import { prisma } from './db';
import {
  TipoArrendamiento,
  MotivoTemporalidad,
  EstadoInventario,
  ContractStatus,
} from '@prisma/client';
import {
  differenceInDays,
  differenceInMonths,
  format,
  startOfMonth,
  endOfMonth,
  getDaysInMonth,
  addMonths,
  isBefore,
  isAfter,
} from 'date-fns';
import { es } from 'date-fns/locale';

// ==========================================
// TIPOS E INTERFACES
// ==========================================

export interface MediaEstanciaConfig {
  // Límites legales según LAU
  duracionMinimaMediaEstancia: number; // 1 mes
  duracionMaximaMediaEstancia: number; // 11 meses
  mesesFianzaMediaEstancia: number; // 2 meses obligatorios
  mesesFianzaViviendaHabitual: number; // 1 mes
}

export const CONFIG_MEDIA_ESTANCIA: MediaEstanciaConfig = {
  duracionMinimaMediaEstancia: 1,
  duracionMaximaMediaEstancia: 11,
  mesesFianzaMediaEstancia: 2,
  mesesFianzaViviendaHabitual: 1,
};

export interface ProrrateoResult {
  diasPrimerMes: number;
  diasUltimoMes: number;
  mesesCompletos: number;
  importePrimerMes: number;
  importeUltimoMes: number;
  importeMesesCompletos: number;
  importeTotal: number;
  desglose: ProrrateoDesglose[];
}

export interface ProrrateoDesglose {
  mes: string;
  fechaInicio: Date;
  fechaFin: Date;
  dias: number;
  diasTotalesMes: number;
  importe: number;
  esProrrateo: boolean;
}

export interface ServiciosIncluidos {
  wifi: boolean;
  agua: boolean;
  luz: boolean;
  gas: boolean;
  calefaccion: boolean;
  limpieza: boolean;
  limpiezaFrecuencia?: 'semanal' | 'quincenal' | 'mensual';
  comunidad: boolean;
  seguro: boolean;
  parking: boolean;
  trastero: boolean;
  otros?: string[];
}

export interface ItemInventario {
  id: string;
  categoria: 'mobiliario' | 'electrodomestico' | 'decoracion' | 'estructura' | 'otros';
  nombre: string;
  ubicacion: string;
  cantidad: number;
  estado: 'nuevo' | 'bueno' | 'aceptable' | 'deteriorado' | 'dañado';
  observaciones?: string;
  fotos: string[]; // URLs de fotos
  valor?: number; // Valor estimado para reclamaciones
}

export interface InventarioCompleto {
  items: ItemInventario[];
  fechaRealizacion: Date;
  realizadoPor: string;
  firmaInquilino?: string;
  firmaPropietario?: string;
  observacionesGenerales?: string;
  lecturaContadores?: {
    luz?: number;
    agua?: number;
    gas?: number;
  };
}

export interface ComparacionInventario {
  itemsConDiferencias: Array<{
    item: ItemInventario;
    estadoEntrada: string;
    estadoSalida: string;
    diferencia: string;
    importeEstimado?: number;
  }>;
  importeTotalDaños: number;
  resumen: string;
}

export interface ValidacionMediaEstancia {
  esValido: boolean;
  errores: string[];
  advertencias: string[];
  tipoArrendamientoRecomendado: TipoArrendamiento;
  fianzaRequerida: number;
}

export interface ContratoMediaEstanciaInput {
  unitId: string;
  tenantId: string;
  fechaInicio: Date;
  fechaFin: Date;
  rentaMensual: number;
  tipoArrendamiento: TipoArrendamiento;
  motivoTemporalidad?: MotivoTemporalidad;
  descripcionMotivo?: string;
  serviciosIncluidos?: ServiciosIncluidos;
  depositoSuministros?: number;
  prorrateable?: boolean;
  penalizacionDesistimiento?: number;
  diasPreaviso?: number;
}

// ==========================================
// VALIDACIONES LEGALES
// ==========================================

/**
 * Valida un contrato de media estancia según la LAU
 */
export function validarContratoMediaEstancia(
  fechaInicio: Date,
  fechaFin: Date,
  tipoArrendamiento: TipoArrendamiento,
  motivoTemporalidad?: MotivoTemporalidad,
  rentaMensual?: number
): ValidacionMediaEstancia {
  const errores: string[] = [];
  const advertencias: string[] = [];
  
  // Calcular duración en meses
  const duracionMeses = differenceInMonths(fechaFin, fechaInicio);
  const duracionDias = differenceInDays(fechaFin, fechaInicio);
  
  // Determinar tipo de arrendamiento recomendado
  let tipoRecomendado: TipoArrendamiento = tipoArrendamiento;
  let fianzaRequerida = CONFIG_MEDIA_ESTANCIA.mesesFianzaViviendaHabitual;
  
  // Validación de fechas básicas
  if (isBefore(fechaFin, fechaInicio)) {
    errores.push('La fecha de fin debe ser posterior a la fecha de inicio');
  }
  
  // Determinar tipo según duración
  if (duracionDias < 30) {
    tipoRecomendado = 'vacacional';
    advertencias.push('Contratos menores a 1 mes se consideran vacacionales y requieren licencia turística');
  } else if (duracionMeses >= 1 && duracionMeses <= 11) {
    tipoRecomendado = 'temporada';
    fianzaRequerida = CONFIG_MEDIA_ESTANCIA.mesesFianzaMediaEstancia;
  } else if (duracionMeses > 11) {
    tipoRecomendado = 'vivienda_habitual';
    advertencias.push('Contratos de 12+ meses se rigen por LAU Art. 2 (vivienda habitual) con prórrogas obligatorias hasta 5 años');
  }
  
  // Validaciones específicas por tipo
  if (tipoArrendamiento === 'temporada') {
    // El arrendamiento por temporada REQUIERE motivo justificado
    if (!motivoTemporalidad) {
      errores.push('Los contratos de temporada requieren un motivo de temporalidad justificado (trabajo, estudios, etc.)');
    }
    
    // Fianza obligatoria de 2 meses
    fianzaRequerida = CONFIG_MEDIA_ESTANCIA.mesesFianzaMediaEstancia;
    
    // Advertencia si la duración excede 11 meses
    if (duracionMeses > 11) {
      errores.push(
        `Duración de ${duracionMeses} meses excede el máximo de 11 meses para arrendamiento por temporada. ` +
        'Considere usar tipo "vivienda_habitual".'
      );
    }
    
    // Advertencia sobre renovaciones
    if (duracionMeses >= 10) {
      advertencias.push(
        'Si el contrato se renueva y supera los 11 meses totales, podría reclasificarse como vivienda habitual'
      );
    }
  }
  
  if (tipoArrendamiento === 'vivienda_habitual') {
    advertencias.push('Los contratos de vivienda habitual tienen prórroga obligatoria hasta 5 años (7 si el arrendador es empresa)');
    fianzaRequerida = CONFIG_MEDIA_ESTANCIA.mesesFianzaViviendaHabitual;
  }
  
  if (tipoArrendamiento === 'vacacional') {
    if (duracionDias > 31) {
      errores.push('Los contratos vacacionales no pueden exceder 31 días. Use tipo "temporada".');
    }
    advertencias.push('Verifique que dispone de licencia turística para este inmueble');
  }
  
  // Tipo de arrendamiento no coincide con el recomendado
  if (tipoArrendamiento !== tipoRecomendado) {
    advertencias.push(
      `Según la duración (${duracionMeses} meses), el tipo de arrendamiento recomendado es "${tipoRecomendado}". ` +
      `Ha seleccionado "${tipoArrendamiento}".`
    );
  }
  
  return {
    esValido: errores.length === 0,
    errores,
    advertencias,
    tipoArrendamientoRecomendado: tipoRecomendado,
    fianzaRequerida: rentaMensual ? rentaMensual * fianzaRequerida : fianzaRequerida,
  };
}

/**
 * Valida el motivo de temporalidad
 */
export function validarMotivoTemporalidad(
  motivo: MotivoTemporalidad,
  duracionMeses: number
): { valido: boolean; advertencia?: string } {
  const motivosDuracion: Record<MotivoTemporalidad, { min: number; max: number; descripcion: string }> = {
    trabajo: { min: 1, max: 11, descripcion: 'desplazamiento laboral' },
    estudios: { min: 1, max: 11, descripcion: 'curso académico' },
    tratamiento_medico: { min: 1, max: 11, descripcion: 'tratamiento médico' },
    proyecto_profesional: { min: 1, max: 11, descripcion: 'proyecto profesional' },
    transicion: { min: 1, max: 6, descripcion: 'transición entre viviendas' },
    turismo_extendido: { min: 1, max: 3, descripcion: 'turismo extendido' },
    otro: { min: 1, max: 11, descripcion: 'otros motivos' },
  };
  
  const config = motivosDuracion[motivo];
  
  if (duracionMeses < config.min || duracionMeses > config.max) {
    return {
      valido: false,
      advertencia: `La duración de ${duracionMeses} meses no es típica para ${config.descripcion}. ` +
        `Rango habitual: ${config.min}-${config.max} meses.`,
    };
  }
  
  return { valido: true };
}

// ==========================================
// CÁLCULO DE PRORRATEO
// ==========================================

/**
 * Calcula el prorrateo de días para un contrato
 */
export function calcularProrrateo(
  fechaInicio: Date,
  fechaFin: Date,
  rentaMensual: number
): ProrrateoResult {
  const desglose: ProrrateoDesglose[] = [];
  
  let fechaActual = new Date(fechaInicio);
  let importeTotal = 0;
  let mesesCompletos = 0;
  let diasPrimerMes = 0;
  let diasUltimoMes = 0;
  let importePrimerMes = 0;
  let importeUltimoMes = 0;
  let importeMesesCompletos = 0;
  
  let esPrimerMes = true;
  
  while (isBefore(fechaActual, fechaFin) || fechaActual.getTime() === fechaFin.getTime()) {
    const inicioMes = startOfMonth(fechaActual);
    const finMes = endOfMonth(fechaActual);
    const diasTotalesMes = getDaysInMonth(fechaActual);
    
    // Determinar fechas efectivas del período
    const fechaInicioEfectiva = isBefore(fechaActual, fechaInicio) 
      ? fechaInicio 
      : (esPrimerMes ? fechaInicio : inicioMes);
    
    const fechaFinEfectiva = isAfter(finMes, fechaFin) ? fechaFin : finMes;
    
    // Calcular días en este período
    const diasEnPeriodo = differenceInDays(fechaFinEfectiva, fechaInicioEfectiva) + 1;
    
    // Es prorrateo si no cubre todo el mes
    const esProrrateo = diasEnPeriodo < diasTotalesMes;
    
    // Calcular importe
    const precioPorDia = rentaMensual / diasTotalesMes;
    const importe = esProrrateo 
      ? Math.round(precioPorDia * diasEnPeriodo * 100) / 100
      : rentaMensual;
    
    desglose.push({
      mes: format(fechaActual, 'MMMM yyyy', { locale: es }),
      fechaInicio: fechaInicioEfectiva,
      fechaFin: fechaFinEfectiva,
      dias: diasEnPeriodo,
      diasTotalesMes,
      importe,
      esProrrateo,
    });
    
    // Acumular totales
    importeTotal += importe;
    
    if (esPrimerMes && esProrrateo) {
      diasPrimerMes = diasEnPeriodo;
      importePrimerMes = importe;
    } else if (isAfter(finMes, fechaFin) || finMes.getTime() === fechaFin.getTime()) {
      // Es el último mes
      if (esProrrateo) {
        diasUltimoMes = diasEnPeriodo;
        importeUltimoMes = importe;
      } else {
        mesesCompletos++;
        importeMesesCompletos += importe;
      }
    } else {
      mesesCompletos++;
      importeMesesCompletos += importe;
    }
    
    // Avanzar al siguiente mes
    fechaActual = addMonths(inicioMes, 1);
    esPrimerMes = false;
  }
  
  return {
    diasPrimerMes,
    diasUltimoMes,
    mesesCompletos,
    importePrimerMes,
    importeUltimoMes,
    importeMesesCompletos,
    importeTotal: Math.round(importeTotal * 100) / 100,
    desglose,
  };
}

/**
 * Genera texto explicativo del prorrateo
 */
export function generarResumenProrrateo(prorrateo: ProrrateoResult): string {
  const lineas: string[] = ['📅 DESGLOSE DE PAGOS\n'];
  
  prorrateo.desglose.forEach((item, index) => {
    const emoji = item.esProrrateo ? '📊' : '📆';
    const tipo = item.esProrrateo ? '(prorrateo)' : '(mes completo)';
    lineas.push(
      `${emoji} ${item.mes}: ${item.dias}/${item.diasTotalesMes} días ${tipo} = €${item.importe.toFixed(2)}`
    );
  });
  
  lineas.push('\n💰 RESUMEN:');
  if (prorrateo.diasPrimerMes > 0) {
    lineas.push(`  • Prorrateo inicial: €${prorrateo.importePrimerMes.toFixed(2)} (${prorrateo.diasPrimerMes} días)`);
  }
  lineas.push(`  • Meses completos: €${prorrateo.importeMesesCompletos.toFixed(2)} (${prorrateo.mesesCompletos} meses)`);
  if (prorrateo.diasUltimoMes > 0) {
    lineas.push(`  • Prorrateo final: €${prorrateo.importeUltimoMes.toFixed(2)} (${prorrateo.diasUltimoMes} días)`);
  }
  lineas.push(`\n🏷️ TOTAL CONTRATO: €${prorrateo.importeTotal.toFixed(2)}`);
  
  return lineas.join('\n');
}

// ==========================================
// GESTIÓN DE INVENTARIO
// ==========================================

/**
 * Plantilla de inventario estándar para media estancia
 */
export function generarPlantillaInventario(): ItemInventario[] {
  return [
    // Mobiliario dormitorio
    { id: 'cama', categoria: 'mobiliario', nombre: 'Cama', ubicacion: 'Dormitorio', cantidad: 1, estado: 'bueno', fotos: [] },
    { id: 'colchon', categoria: 'mobiliario', nombre: 'Colchón', ubicacion: 'Dormitorio', cantidad: 1, estado: 'bueno', fotos: [] },
    { id: 'armario', categoria: 'mobiliario', nombre: 'Armario/Closet', ubicacion: 'Dormitorio', cantidad: 1, estado: 'bueno', fotos: [] },
    { id: 'mesilla', categoria: 'mobiliario', nombre: 'Mesilla de noche', ubicacion: 'Dormitorio', cantidad: 1, estado: 'bueno', fotos: [] },
    { id: 'escritorio', categoria: 'mobiliario', nombre: 'Escritorio', ubicacion: 'Dormitorio', cantidad: 1, estado: 'bueno', fotos: [] },
    { id: 'silla_escritorio', categoria: 'mobiliario', nombre: 'Silla escritorio', ubicacion: 'Dormitorio', cantidad: 1, estado: 'bueno', fotos: [] },
    
    // Mobiliario salón
    { id: 'sofa', categoria: 'mobiliario', nombre: 'Sofá', ubicacion: 'Salón', cantidad: 1, estado: 'bueno', fotos: [] },
    { id: 'mesa_salon', categoria: 'mobiliario', nombre: 'Mesa de centro', ubicacion: 'Salón', cantidad: 1, estado: 'bueno', fotos: [] },
    { id: 'mueble_tv', categoria: 'mobiliario', nombre: 'Mueble TV', ubicacion: 'Salón', cantidad: 1, estado: 'bueno', fotos: [] },
    
    // Mobiliario cocina
    { id: 'mesa_cocina', categoria: 'mobiliario', nombre: 'Mesa comedor/cocina', ubicacion: 'Cocina', cantidad: 1, estado: 'bueno', fotos: [] },
    { id: 'sillas_cocina', categoria: 'mobiliario', nombre: 'Sillas', ubicacion: 'Cocina', cantidad: 4, estado: 'bueno', fotos: [] },
    
    // Electrodomésticos
    { id: 'frigorifico', categoria: 'electrodomestico', nombre: 'Frigorífico', ubicacion: 'Cocina', cantidad: 1, estado: 'bueno', fotos: [] },
    { id: 'lavadora', categoria: 'electrodomestico', nombre: 'Lavadora', ubicacion: 'Cocina/Lavadero', cantidad: 1, estado: 'bueno', fotos: [] },
    { id: 'horno', categoria: 'electrodomestico', nombre: 'Horno', ubicacion: 'Cocina', cantidad: 1, estado: 'bueno', fotos: [] },
    { id: 'microondas', categoria: 'electrodomestico', nombre: 'Microondas', ubicacion: 'Cocina', cantidad: 1, estado: 'bueno', fotos: [] },
    { id: 'vitroceramica', categoria: 'electrodomestico', nombre: 'Vitrocerámica/Placa', ubicacion: 'Cocina', cantidad: 1, estado: 'bueno', fotos: [] },
    { id: 'campana', categoria: 'electrodomestico', nombre: 'Campana extractora', ubicacion: 'Cocina', cantidad: 1, estado: 'bueno', fotos: [] },
    { id: 'calentador', categoria: 'electrodomestico', nombre: 'Calentador/Caldera', ubicacion: 'Cocina/Baño', cantidad: 1, estado: 'bueno', fotos: [] },
    { id: 'aire_acondicionado', categoria: 'electrodomestico', nombre: 'Aire acondicionado', ubicacion: 'Salón/Dormitorio', cantidad: 1, estado: 'bueno', fotos: [] },
    { id: 'television', categoria: 'electrodomestico', nombre: 'Televisión', ubicacion: 'Salón', cantidad: 1, estado: 'bueno', fotos: [] },
    
    // Estructura
    { id: 'puertas', categoria: 'estructura', nombre: 'Puertas interiores', ubicacion: 'General', cantidad: 5, estado: 'bueno', fotos: [] },
    { id: 'ventanas', categoria: 'estructura', nombre: 'Ventanas', ubicacion: 'General', cantidad: 4, estado: 'bueno', fotos: [] },
    { id: 'persianas', categoria: 'estructura', nombre: 'Persianas', ubicacion: 'General', cantidad: 4, estado: 'bueno', fotos: [] },
    { id: 'suelo', categoria: 'estructura', nombre: 'Suelo', ubicacion: 'General', cantidad: 1, estado: 'bueno', fotos: [] },
    { id: 'paredes', categoria: 'estructura', nombre: 'Paredes/Pintura', ubicacion: 'General', cantidad: 1, estado: 'bueno', fotos: [] },
    
    // Baño
    { id: 'sanitarios', categoria: 'estructura', nombre: 'Sanitarios (WC, lavabo, ducha/bañera)', ubicacion: 'Baño', cantidad: 1, estado: 'bueno', fotos: [] },
    { id: 'griferia', categoria: 'estructura', nombre: 'Grifería', ubicacion: 'Baño/Cocina', cantidad: 1, estado: 'bueno', fotos: [] },
    
    // Otros
    { id: 'llaves', categoria: 'otros', nombre: 'Juego de llaves', ubicacion: 'Entrada', cantidad: 2, estado: 'bueno', fotos: [] },
    { id: 'mando_garaje', categoria: 'otros', nombre: 'Mando garaje/portal', ubicacion: 'Entrada', cantidad: 1, estado: 'bueno', fotos: [] },
  ];
}

/**
 * Compara inventario de entrada y salida
 */
export function compararInventarios(
  inventarioEntrada: InventarioCompleto,
  inventarioSalida: InventarioCompleto
): ComparacionInventario {
  const diferencias: ComparacionInventario['itemsConDiferencias'] = [];
  let importeTotalDaños = 0;
  
  const itemsSalida = new Map(inventarioSalida.items.map(i => [i.id, i]));
  
  for (const itemEntrada of inventarioEntrada.items) {
    const itemSalida = itemsSalida.get(itemEntrada.id);
    
    if (!itemSalida) {
      // Item falta en salida
      diferencias.push({
        item: itemEntrada,
        estadoEntrada: itemEntrada.estado,
        estadoSalida: 'FALTA',
        diferencia: 'El item no está presente en el inventario de salida',
        importeEstimado: itemEntrada.valor || 0,
      });
      importeTotalDaños += itemEntrada.valor || 0;
    } else if (itemEntrada.estado !== itemSalida.estado) {
      // Estado diferente
      const estadosOrden = ['nuevo', 'bueno', 'aceptable', 'deteriorado', 'dañado'];
      const indiceEntrada = estadosOrden.indexOf(itemEntrada.estado);
      const indiceSalida = estadosOrden.indexOf(itemSalida.estado);
      
      if (indiceSalida > indiceEntrada) {
        // El estado ha empeorado
        const importeEstimado = estimarDaño(itemEntrada, itemSalida);
        diferencias.push({
          item: itemEntrada,
          estadoEntrada: itemEntrada.estado,
          estadoSalida: itemSalida.estado,
          diferencia: `Estado empeorado: ${itemEntrada.estado} → ${itemSalida.estado}`,
          importeEstimado,
        });
        importeTotalDaños += importeEstimado;
      }
    }
    
    // Verificar cantidad
    if (itemSalida && itemEntrada.cantidad !== itemSalida.cantidad) {
      const diferenciaCantidad = itemEntrada.cantidad - itemSalida.cantidad;
      if (diferenciaCantidad > 0) {
        diferencias.push({
          item: itemEntrada,
          estadoEntrada: `${itemEntrada.cantidad} unidades`,
          estadoSalida: `${itemSalida.cantidad} unidades`,
          diferencia: `Faltan ${diferenciaCantidad} unidades`,
          importeEstimado: (itemEntrada.valor || 0) * diferenciaCantidad / itemEntrada.cantidad,
        });
      }
    }
  }
  
  // Generar resumen
  let resumen = '';
  if (diferencias.length === 0) {
    resumen = '✅ No se han detectado diferencias significativas entre el inventario de entrada y salida.';
  } else {
    resumen = `⚠️ Se han detectado ${diferencias.length} diferencia(s) con un importe estimado de €${importeTotalDaños.toFixed(2)}`;
  }
  
  return {
    itemsConDiferencias: diferencias,
    importeTotalDaños: Math.round(importeTotalDaños * 100) / 100,
    resumen,
  };
}

/**
 * Estima el importe del daño basado en el cambio de estado
 */
function estimarDaño(itemEntrada: ItemInventario, itemSalida: ItemInventario): number {
  const valorBase = itemEntrada.valor || 100; // Valor por defecto si no se especifica
  
  const porcentajeDaño: Record<string, Record<string, number>> = {
    nuevo: { bueno: 0.1, aceptable: 0.25, deteriorado: 0.5, dañado: 1.0 },
    bueno: { aceptable: 0.15, deteriorado: 0.4, dañado: 0.9 },
    aceptable: { deteriorado: 0.3, dañado: 0.7 },
    deteriorado: { dañado: 0.5 },
  };
  
  const porcentaje = porcentajeDaño[itemEntrada.estado]?.[itemSalida.estado] || 0;
  return Math.round(valorBase * porcentaje * 100) / 100;
}

// ==========================================
// GESTIÓN DE SERVICIOS INCLUIDOS
// ==========================================

/**
 * Calcula el coste estimado de servicios incluidos
 */
export function calcularCosteServicios(
  servicios: ServiciosIncluidos,
  ciudad: string = 'Madrid'
): { desglose: Record<string, number>; total: number } {
  // Costes medios por ciudad (simplificado)
  const costesBase: Record<string, number> = {
    wifi: 35,
    agua: 25,
    luz: 60,
    gas: 40,
    calefaccion: 50,
    comunidad: 80,
    seguro: 20,
    parking: 100,
    trastero: 50,
    limpieza: 0, // Se calcula aparte
  };
  
  // Coste de limpieza según frecuencia
  const costeLimpieza: Record<string, number> = {
    semanal: 200,
    quincenal: 120,
    mensual: 60,
  };
  
  const desglose: Record<string, number> = {};
  let total = 0;
  
  if (servicios.wifi) { desglose.wifi = costesBase.wifi; total += costesBase.wifi; }
  if (servicios.agua) { desglose.agua = costesBase.agua; total += costesBase.agua; }
  if (servicios.luz) { desglose.luz = costesBase.luz; total += costesBase.luz; }
  if (servicios.gas) { desglose.gas = costesBase.gas; total += costesBase.gas; }
  if (servicios.calefaccion) { desglose.calefaccion = costesBase.calefaccion; total += costesBase.calefaccion; }
  if (servicios.comunidad) { desglose.comunidad = costesBase.comunidad; total += costesBase.comunidad; }
  if (servicios.seguro) { desglose.seguro = costesBase.seguro; total += costesBase.seguro; }
  if (servicios.parking) { desglose.parking = costesBase.parking; total += costesBase.parking; }
  if (servicios.trastero) { desglose.trastero = costesBase.trastero; total += costesBase.trastero; }
  
  if (servicios.limpieza && servicios.limpiezaFrecuencia) {
    desglose.limpieza = costeLimpieza[servicios.limpiezaFrecuencia];
    total += costeLimpieza[servicios.limpiezaFrecuencia];
  }
  
  return { desglose, total };
}

/**
 * Genera cláusula de servicios incluidos para el contrato
 */
export function generarClausulaServicios(servicios: ServiciosIncluidos): string {
  const lineas: string[] = ['SERVICIOS INCLUIDOS EN LA RENTA:\n'];
  
  const serviciosActivos: string[] = [];
  if (servicios.wifi) serviciosActivos.push('✓ Internet WiFi de alta velocidad');
  if (servicios.agua) serviciosActivos.push('✓ Suministro de agua');
  if (servicios.luz) serviciosActivos.push('✓ Suministro eléctrico');
  if (servicios.gas) serviciosActivos.push('✓ Suministro de gas');
  if (servicios.calefaccion) serviciosActivos.push('✓ Calefacción central');
  if (servicios.comunidad) serviciosActivos.push('✓ Gastos de comunidad');
  if (servicios.seguro) serviciosActivos.push('✓ Seguro del hogar');
  if (servicios.parking) serviciosActivos.push('✓ Plaza de parking');
  if (servicios.trastero) serviciosActivos.push('✓ Trastero');
  if (servicios.limpieza) {
    const frecuencia = servicios.limpiezaFrecuencia || 'semanal';
    serviciosActivos.push(`✓ Servicio de limpieza ${frecuencia}`);
  }
  
  if (serviciosActivos.length === 0) {
    return 'La renta NO incluye ningún servicio adicional. Todos los suministros y gastos corren por cuenta del arrendatario.';
  }
  
  lineas.push(...serviciosActivos);
  
  if (servicios.otros && servicios.otros.length > 0) {
    lineas.push('\nServicios adicionales:');
    servicios.otros.forEach(s => lineas.push(`✓ ${s}`));
  }
  
  return lineas.join('\n');
}

// ==========================================
// CREACIÓN DE CONTRATOS
// ==========================================

/**
 * Crea un contrato de media estancia con todas las validaciones
 */
export async function crearContratoMediaEstancia(
  companyId: string,
  input: ContratoMediaEstanciaInput
): Promise<{ contrato: any; validacion: ValidacionMediaEstancia; prorrateo: ProrrateoResult }> {
  // 1. Validar el contrato
  const validacion = validarContratoMediaEstancia(
    input.fechaInicio,
    input.fechaFin,
    input.tipoArrendamiento,
    input.motivoTemporalidad,
    input.rentaMensual
  );
  
  if (!validacion.esValido) {
    throw new Error(`Contrato inválido: ${validacion.errores.join(', ')}`);
  }
  
  // 2. Calcular prorrateo
  const prorrateo = calcularProrrateo(
    input.fechaInicio,
    input.fechaFin,
    input.rentaMensual
  );
  
  // 3. Calcular duración en meses
  const duracionMeses = differenceInMonths(input.fechaFin, input.fechaInicio);
  
  // 4. Determinar fianza según tipo
  const mesesFianza = input.tipoArrendamiento === 'temporada' 
    ? CONFIG_MEDIA_ESTANCIA.mesesFianzaMediaEstancia 
    : CONFIG_MEDIA_ESTANCIA.mesesFianzaViviendaHabitual;
  
  // 5. Crear el contrato
  const contrato = await prisma.contract.create({
    data: {
      unitId: input.unitId,
      tenantId: input.tenantId,
      fechaInicio: input.fechaInicio,
      fechaFin: input.fechaFin,
      rentaMensual: input.rentaMensual,
      deposito: input.rentaMensual * mesesFianza,
      mesesFianza,
      tipo: input.tipoArrendamiento === 'vivienda_habitual' ? 'residencial' : 'temporal',
      estado: 'activo',
      renovacionAutomatica: false,
      
      // Campos de media estancia
      tipoArrendamiento: input.tipoArrendamiento,
      motivoTemporalidad: input.motivoTemporalidad,
      descripcionMotivo: input.descripcionMotivo,
      duracionMesesPrevista: duracionMeses,
      prorrateable: input.prorrateable ?? true,
      diasProrrateoInicio: prorrateo.diasPrimerMes > 0 ? prorrateo.diasPrimerMes : null,
      diasProrrateoFin: prorrateo.diasUltimoMes > 0 ? prorrateo.diasUltimoMes : null,
      importeProrrateoInicio: prorrateo.importePrimerMes > 0 ? prorrateo.importePrimerMes : null,
      importeProrrateoFin: prorrateo.importeUltimoMes > 0 ? prorrateo.importeUltimoMes : null,
      serviciosIncluidos: input.serviciosIncluidos as any,
      depositoSuministros: input.depositoSuministros,
      penalizacionDesistimiento: input.penalizacionDesistimiento ?? 50, // 50% por defecto
      diasPreaviso: input.diasPreaviso ?? 30,
      estadoInventario: 'pendiente',
    },
    include: {
      unit: {
        include: { building: true },
      },
      tenant: true,
    },
  });
  
  return { contrato, validacion, prorrateo };
}

/**
 * Actualiza el inventario de entrada de un contrato
 */
export async function registrarInventarioEntrada(
  contractId: string,
  inventario: InventarioCompleto
): Promise<any> {
  return prisma.contract.update({
    where: { id: contractId },
    data: {
      inventarioEntrada: inventario as any,
      fechaInventarioEntrada: inventario.fechaRealizacion,
      estadoInventario: 'entrada_completado',
    },
  });
}

/**
 * Actualiza el inventario de salida y compara con entrada
 */
export async function registrarInventarioSalida(
  contractId: string,
  inventario: InventarioCompleto
): Promise<{ contrato: any; comparacion: ComparacionInventario }> {
  // Obtener contrato con inventario de entrada
  const contrato = await prisma.contract.findUnique({
    where: { id: contractId },
  });
  
  if (!contrato || !contrato.inventarioEntrada) {
    throw new Error('No se encontró el contrato o no tiene inventario de entrada');
  }
  
  // Comparar inventarios
  const inventarioEntrada = contrato.inventarioEntrada as unknown as InventarioCompleto;
  const comparacion = compararInventarios(inventarioEntrada, inventario);
  
  // Actualizar contrato
  const contratoActualizado = await prisma.contract.update({
    where: { id: contractId },
    data: {
      inventarioSalida: inventario as any,
      fechaInventarioSalida: inventario.fechaRealizacion,
      estadoInventario: comparacion.itemsConDiferencias.length > 0 ? 'con_incidencias' : 'comparado',
      incidenciasInventario: comparacion.itemsConDiferencias as any,
      importeIncidencias: comparacion.importeTotalDaños,
    },
  });
  
  return { contrato: contratoActualizado, comparacion };
}

// ==========================================
// UTILIDADES
// ==========================================

/**
 * Obtiene estadísticas de contratos de media estancia
 */
export async function getEstadisticasMediaEstancia(companyId: string): Promise<{
  totalContratos: number;
  contratosActivos: number;
  duracionPromedio: number;
  motivosMasComunes: Record<string, number>;
  ingresosMensualesEstimados: number;
}> {
  const contratos = await prisma.contract.findMany({
    where: {
      unit: { building: { companyId } },
      tipoArrendamiento: 'temporada',
    },
    select: {
      estado: true,
      fechaInicio: true,
      fechaFin: true,
      rentaMensual: true,
      motivoTemporalidad: true,
    },
  });
  
  const contratosActivos = contratos.filter(c => c.estado === 'activo');
  
  // Calcular duración promedio
  const duraciones = contratos.map(c => differenceInMonths(c.fechaFin, c.fechaInicio));
  const duracionPromedio = duraciones.length > 0 
    ? duraciones.reduce((a, b) => a + b, 0) / duraciones.length 
    : 0;
  
  // Contar motivos
  const motivosMasComunes: Record<string, number> = {};
  contratos.forEach(c => {
    if (c.motivoTemporalidad) {
      motivosMasComunes[c.motivoTemporalidad] = (motivosMasComunes[c.motivoTemporalidad] || 0) + 1;
    }
  });
  
  // Ingresos mensuales
  const ingresosMensualesEstimados = contratosActivos.reduce((sum, c) => sum + c.rentaMensual, 0);
  
  return {
    totalContratos: contratos.length,
    contratosActivos: contratosActivos.length,
    duracionPromedio: Math.round(duracionPromedio * 10) / 10,
    motivosMasComunes,
    ingresosMensualesEstimados,
  };
}

export default {
  // Validaciones
  validarContratoMediaEstancia,
  validarMotivoTemporalidad,
  CONFIG_MEDIA_ESTANCIA,
  
  // Prorrateo
  calcularProrrateo,
  generarResumenProrrateo,
  
  // Inventario
  generarPlantillaInventario,
  compararInventarios,
  registrarInventarioEntrada,
  registrarInventarioSalida,
  
  // Servicios
  calcularCosteServicios,
  generarClausulaServicios,
  
  // Contratos
  crearContratoMediaEstancia,
  getEstadisticasMediaEstancia,
};
