import { prisma } from './db';
import { addDays } from 'date-fns';

interface LeadScoringFactors {
  presupuestoAdecuado: number;
  fechaMudanzaCercana: number;
  fuenteConfiable: number;
  interaccionesRecientes: number;
  tiempoRespuesta: number;
}

export async function calculateLeadScoring(leadId: string): Promise<number> {
  const lead = await prisma.crmLead.findUnique({
    where: { id: leadId },
    include: {
      activities: {
        orderBy: { fecha: 'desc' },
      },
    },
  });

  if (!lead) return 0;

  let score = 0;
  const factors: LeadScoringFactors = {
    presupuestoAdecuado: 0,
    fechaMudanzaCercana: 0,
    fuenteConfiable: 0,
    interaccionesRecientes: 0,
    tiempoRespuesta: 0,
  };

  // Factor 1: Presupuesto (25 puntos)
  if (lead.unitId) {
    const unit = await prisma.unit.findUnique({
      where: { id: lead.unitId },
    });

    if (unit && lead.presupuesto) {
      const ratio = lead.presupuesto / unit.rentaMensual;
      if (ratio >= 1.2) factors.presupuestoAdecuado = 25;
      else if (ratio >= 1.0) factors.presupuestoAdecuado = 20;
      else if (ratio >= 0.8) factors.presupuestoAdecuado = 10;
    }
  }

  // Factor 2: Fecha de mudanza cercana (20 puntos)
  if (lead.fechaMudanza) {
    const diasHastaMudanza = Math.ceil(
      (lead.fechaMudanza.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
    if (diasHastaMudanza <= 30) factors.fechaMudanzaCercana = 20;
    else if (diasHastaMudanza <= 60) factors.fechaMudanzaCercana = 15;
    else if (diasHastaMudanza <= 90) factors.fechaMudanzaCercana = 10;
  }

  // Factor 3: Fuente confiable (15 puntos)
  if (lead.fuente === 'referido') factors.fuenteConfiable = 15;
  else if (lead.fuente === 'web') factors.fuenteConfiable = 10;
  else if (lead.fuente === 'llamada') factors.fuenteConfiable = 8;

  // Factor 4: Interacciones recientes (25 puntos)
  const recentActivities = lead.activities.filter((a) => {
    const daysSince = Math.ceil(
      (new Date().getTime() - a.fecha.getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysSince <= 7;
  });

  if (recentActivities.length >= 3) factors.interaccionesRecientes = 25;
  else if (recentActivities.length >= 2) factors.interaccionesRecientes = 18;
  else if (recentActivities.length >= 1) factors.interaccionesRecientes = 10;

  // Factor 5: Tiempo de respuesta (15 puntos)
  if (lead.ultimoContacto) {
    const diasDesdeContacto = Math.ceil(
      (new Date().getTime() - lead.ultimoContacto.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (diasDesdeContacto <= 1) factors.tiempoRespuesta = 15;
    else if (diasDesdeContacto <= 3) factors.tiempoRespuesta = 10;
    else if (diasDesdeContacto <= 7) factors.tiempoRespuesta = 5;
  }

  score =
    factors.presupuestoAdecuado +
    factors.fechaMudanzaCercana +
    factors.fuenteConfiable +
    factors.interaccionesRecientes +
    factors.tiempoRespuesta;

  // Actualizar scoring en la base de datos
  await prisma.crmLead.update({
    where: { id: leadId },
    data: { scoring: score },
  });

  return score;
}

export async function calculateProbabilidadCierre(leadId: string): Promise<number> {
  const lead = await prisma.crmLead.findUnique({
    where: { id: leadId },
    include: {
      activities: true,
    },
  });

  if (!lead) return 0;

  let probabilidad = 0;

  // Probabilidad base según estado
  switch (lead.estado) {
    case 'nuevo':
      probabilidad = 10;
      break;
    case 'contactado':
      probabilidad = 20;
      break;
    case 'calificado':
      probabilidad = 40;
      break;
    case 'visitado':
      probabilidad = 60;
      break;
    case 'propuesta_enviada':
      probabilidad = 75;
      break;
    case 'negociacion':
      probabilidad = 85;
      break;
    case 'ganado':
      probabilidad = 100;
      break;
    case 'perdido':
      probabilidad = 0;
      break;
  }

  // Ajustar por scoring
  const scoringBonus = (lead.scoring / 100) * 15;
  probabilidad = Math.min(100, probabilidad + scoringBonus);

  // Ajustar por actividades
  const actividadesCompletadas = lead.activities.filter((a) => a.completada).length;
  if (actividadesCompletadas >= 5) probabilidad = Math.min(100, probabilidad + 5);

  // Actualizar en la base de datos
  await prisma.crmLead.update({
    where: { id: leadId },
    data: { probabilidadCierre: probabilidad },
  });

  return probabilidad;
}

export async function suggestNextAction(leadId: string): Promise<string> {
  const lead = await prisma.crmLead.findUnique({
    where: { id: leadId },
    include: {
      activities: {
        orderBy: { fecha: 'desc' },
        take: 1,
      },
    },
  });

  if (!lead) return 'Revisar información del lead';

  const lastActivity = lead.activities[0];

  // Si no hay actividades recientes
  if (!lastActivity) {
    return 'Realizar primer contacto telefónico';
  }

  // Sugerencias según el estado
  switch (lead.estado) {
    case 'nuevo':
      return 'Contactar al lead por teléfono o email';
    case 'contactado':
      return 'Calificar necesidades y presupuesto del lead';
    case 'calificado':
      return 'Programar visita a la propiedad';
    case 'visitado':
      return 'Enviar propuesta formal y condiciones';
    case 'propuesta_enviada':
      return 'Hacer seguimiento de la propuesta';
    case 'negociacion':
      return 'Cerrar negociación y preparar contrato';
    default:
      return 'Hacer seguimiento general';
  }
}

export async function getPipelineStats(companyId: string) {
  const leads = await prisma.crmLead.findMany({
    where: { companyId },
    include: {
      activities: true,
    },
  });

  const stats = {
    total: leads.length,
    nuevo: 0,
    contactado: 0,
    calificado: 0,
    visitado: 0,
    propuesta_enviada: 0,
    negociacion: 0,
    ganado: 0,
    perdido: 0,
    tasaConversion: 0,
    valorTotalPipeline: 0,
    tiempoPromedioCierre: 0,
  };

  leads.forEach((lead) => {
    stats[lead.estado]++;
    if (lead.valorEstimado) {
      stats.valorTotalPipeline += lead.valorEstimado;
    }
  });

  const totalActivos = stats.total - stats.ganado - stats.perdido;
  stats.tasaConversion = stats.total > 0 ? (stats.ganado / stats.total) * 100 : 0;

  return stats;
}

export async function autoProgressLeadStage(leadId: string): Promise<boolean> {
  const lead = await prisma.crmLead.findUnique({
    where: { id: leadId },
    include: {
      activities: {
        where: { completada: true },
        orderBy: { fecha: 'desc' },
      },
    },
  });

  if (!lead) return false;

  let newEstado = lead.estado;

  // Lógica de progresión automática
  if (lead.estado === 'nuevo' && lead.activities.length > 0) {
    newEstado = 'contactado';
  } else if (lead.estado === 'contactado' && lead.presupuesto && lead.presupuesto > 0) {
    newEstado = 'calificado';
  } else if (lead.estado === 'calificado') {
    const visitaActivity = lead.activities.find((a) => a.tipo === 'visita');
    if (visitaActivity) {
      newEstado = 'visitado';
    }
  }

  if (newEstado !== lead.estado) {
    await prisma.crmLead.update({
      where: { id: leadId },
      data: { estado: newEstado },
    });
    return true;
  }

  return false;
}
