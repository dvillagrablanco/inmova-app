import { prisma } from './db';
import { addDays } from 'date-fns';

interface LeadScoringFactors {
  presupuestoAdecuado: number;
  urgencia: number;
  fuenteConfiable: number;
  verticalesInteres: number;
  completitudDatos: number;
}

// Función para calcular scoring inicial basado en datos del body
export function calculateLeadScoring(leadData: any): number {
  let score = 0;
  const factors: LeadScoringFactors = {
    presupuestoAdecuado: 0,
    urgencia: 0,
    fuenteConfiable: 0,
    verticalesInteres: 0,
    completitudDatos: 0,
  };

  // Factor 1: Presupuesto (25 puntos)
  if (leadData.presupuestoMensual) {
    const presupuesto = parseFloat(leadData.presupuestoMensual);
    if (presupuesto >= 500) factors.presupuestoAdecuado = 25;
    else if (presupuesto >= 300) factors.presupuestoAdecuado = 20;
    else if (presupuesto >= 149) factors.presupuestoAdecuado = 15;
    else factors.presupuestoAdecuado = 5;
  }

  // Factor 2: Urgencia (20 puntos)
  if (leadData.urgencia === 'alta') factors.urgencia = 20;
  else if (leadData.urgencia === 'media') factors.urgencia = 12;
  else if (leadData.urgencia === 'baja') factors.urgencia = 5;

  // Factor 3: Fuente confiable (15 puntos)
  if (leadData.fuente === 'referido') factors.fuenteConfiable = 15;
  else if (leadData.fuente === 'chatbot' || leadData.fuente === 'landing') factors.fuenteConfiable = 12;
  else if (leadData.fuente === 'formulario_contacto') factors.fuenteConfiable = 10;
  else if (leadData.fuente === 'social_media') factors.fuenteConfiable = 8;
  else factors.fuenteConfiable = 5;

  // Factor 4: Verticales de interés (20 puntos)
  const numVerticales = leadData.verticalesInteres?.length || 0;
  if (numVerticales >= 3) factors.verticalesInteres = 20;
  else if (numVerticales >= 2) factors.verticalesInteres = 15;
  else if (numVerticales >= 1) factors.verticalesInteres = 10;

  // Factor 5: Completitud de datos (20 puntos)
  let completitud = 0;
  if (leadData.email) completitud += 4;
  if (leadData.telefono) completitud += 4;
  if (leadData.empresa) completitud += 3;
  if (leadData.cargo) completitud += 3;
  if (leadData.numeroUnidades) completitud += 3;
  if (leadData.ciudad) completitud += 3;
  factors.completitudDatos = completitud;

  // Sumar todos los factores
  score = Object.values(factors).reduce((acc, val) => acc + val, 0);

  return Math.min(100, Math.max(0, score));
}

// Función para calcular la probabilidad de cierre
export function calculateProbabilidadCierre(leadData: any): number {
  let probabilidad = 50; // Base del 50%

  // Ajustar según presupuesto
  if (leadData.presupuestoMensual) {
    const presupuesto = parseFloat(leadData.presupuestoMensual);
    if (presupuesto >= 500) probabilidad += 15;
    else if (presupuesto >= 300) probabilidad += 10;
    else if (presupuesto >= 149) probabilidad += 5;
  } else {
    probabilidad -= 10;
  }

  // Ajustar según urgencia
  if (leadData.urgencia === 'alta') probabilidad += 15;
  else if (leadData.urgencia === 'baja') probabilidad -= 10;

  // Ajustar según fuente
  if (leadData.fuente === 'referido') probabilidad += 10;
  else if (leadData.fuente === 'chatbot' || leadData.fuente === 'landing') probabilidad += 5;

  // Ajustar según número de unidades
  if (leadData.numeroUnidades) {
    const num = parseInt(leadData.numeroUnidades);
    if (num >= 50) probabilidad += 15;
    else if (num >= 20) probabilidad += 10;
    else if (num >= 5) probabilidad += 5;
  }

  // Ajustar según completitud de datos
  let camposCompletos = 0;
  if (leadData.email) camposCompletos++;
  if (leadData.telefono) camposCompletos++;
  if (leadData.empresa) camposCompletos++;
  if (leadData.cargo) camposCompletos++;
  if (leadData.ciudad) camposCompletos++;
  
  probabilidad += (camposCompletos / 5) * 10;

  return Math.min(100, Math.max(0, probabilidad));
}

// Función para actualizar temperatura del lead según puntuación
export function determinarTemperatura(puntuacion: number): string {
  if (puntuacion >= 75) return 'caliente';
  if (puntuacion >= 50) return 'tibio';
  return 'frio';
}

// Función para determinar etapa sugerida según datos
export function determinarEtapaSugerida(leadData: any): string {
  if (leadData.estado === 'ganado') return 'cerrado_ganado';
  if (leadData.estado === 'perdido') return 'cerrado_perdido';
  
  if (leadData.urgencia === 'alta' && leadData.presupuestoMensual >= 300) {
    return 'propuesta';
  }
  
  if (leadData.verticalesInteres?.length >= 2) {
    return 'calificacion';
  }
  
  return 'contacto_inicial';
}

// Función para obtener estadísticas del CRM
export async function getCRMStats(companyId: string) {
  const leads = await prisma.lead.findMany({
    where: { companyId },
    include: {
      actividades: true,
    },
  });

  const totalLeads = leads.length;
  const leadsPorEstado = leads.reduce((acc: any, lead) => {
    acc[lead.estado] = (acc[lead.estado] || 0) + 1;
    return acc;
  }, {});

  const leadsPorFuente = leads.reduce((acc: any, lead) => {
    acc[lead.fuente] = (acc[lead.fuente] || 0) + 1;
    return acc;
  }, {});

  const leadsPorTemperatura = leads.reduce((acc: any, lead) => {
    acc[lead.temperatura] = (acc[lead.temperatura] || 0) + 1;
    return acc;
  }, {});

  const tasaConversion = totalLeads > 0 
    ? ((leadsPorEstado['ganado'] || 0) / totalLeads) * 100 
    : 0;

  const valorPotencialTotal = leads.reduce((sum, lead) => {
    return sum + (lead.presupuestoMensual || 0) * 12; // Anualizado
  }, 0);

  const leadsCalientes = leads.filter(l => l.temperatura === 'caliente').length;\n  const leadsTibios = leads.filter(l => l.temperatura === 'tibio').length;\n\n  const promedioActividades = totalLeads > 0\n    ? leads.reduce((sum, lead) => sum + lead.numeroContactos, 0) / totalLeads\n    : 0;\n\n  return {\n    totalLeads,\n    leadsPorEstado,\n    leadsPorFuente,\n    leadsPorTemperatura,\n    tasaConversion: Math.round(tasaConversion * 100) / 100,\n    valorPotencialTotal: Math.round(valorPotencialTotal),\n    leadsCalientes,\n    leadsTibios,\n    promedioActividades: Math.round(promedioActividades * 10) / 10,\n    leadsMesActual: leads.filter(l => {\n      const mesActual = new Date().getMonth();\n      return new Date(l.createdAt).getMonth() === mesActual;\n    }).length,\n  };\n}\n