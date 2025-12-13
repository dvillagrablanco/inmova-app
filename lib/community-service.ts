import { prisma } from './db';
import { addMonths } from 'date-fns';

// ==========================================
// MÓDULO: COMUNIDAD SOCIAL
// ==========================================

/**
 * Crea un post en la red social
 */
export async function createSocialPost(data: {
  companyId: string;
  authorId?: string;
  buildingId?: string;
  tipo?: string;
  contenido: string;
  multimedia?: string[];
  hashtags?: string[];
  visibilidad?: string;
}) {
  const post = await prisma.socialPost.create({
    data: {
      companyId: data.companyId,
      authorId: data.authorId,
      buildingId: data.buildingId,
      tipo: data.tipo || 'post',
      contenido: data.contenido,
      multimedia: data.multimedia || [],
      hashtags: data.hashtags || [],
      visibilidad: data.visibilidad || 'building',
      likes: 0,
      likedBy: [],
    },
  });

  return post;
}

/**
 * Agrega un like a un post
 */
export async function likePost(postId: string, tenantId: string) {
  const post = await prisma.socialPost.findUnique({
    where: { id: postId },
  });

  if (!post) {
    throw new Error('Post no encontrado');
  }

  const likedBy = post.likedBy || [];

  if (likedBy.includes(tenantId)) {
    // Unlike
    const updatedPost = await prisma.socialPost.update({
      where: { id: postId },
      data: {
        likes: Math.max(0, post.likes - 1),
        likedBy: likedBy.filter((id) => id !== tenantId),
      },
    });
    return { post: updatedPost, action: 'unliked' };
  } else {
    // Like
    const updatedPost = await prisma.socialPost.update({
      where: { id: postId },
      data: {
        likes: post.likes + 1,
        likedBy: [...likedBy, tenantId],
      },
    });
    return { post: updatedPost, action: 'liked' };
  }
}

/**
 * Agrega un comentario a un post
 */
export async function addComment(data: {
  postId: string;
  authorId?: string;
  contenido: string;
}) {
  const comment = await prisma.socialComment.create({
    data: {
      postId: data.postId,
      authorId: data.authorId,
      contenido: data.contenido,
      likes: 0,
    },
  });

  return comment;
}

/**
 * Inicializa la reputación de un inquilino
 */
export async function initializeTenantReputation(tenantId: string) {
  const existing = await prisma.tenantReputation.findUnique({
    where: { tenantId },
  });

  if (existing) {
    return existing;
  }

  const reputation = await prisma.tenantReputation.create({
    data: {
      tenantId,
      puntos: 0,
      nivel: 'novato',
    },
  });

  return reputation;
}

/**
 * Actualiza la reputación de un inquilino
 */
export async function updateTenantReputation(tenantId: string, puntosGanados: number) {
  const reputation = await prisma.tenantReputation.findUnique({
    where: { tenantId },
  });

  if (!reputation) {
    throw new Error('Reputación no inicializada');
  }

  const nuevosPuntos = reputation.puntos + puntosGanados;
  const nuevoNivel = determineLevel(nuevosPuntos);

  const updated = await prisma.tenantReputation.update({
    where: { tenantId },
    data: {
      puntos: nuevosPuntos,
      nivel: nuevoNivel,
    },
  });

  // Otorgar badges si corresponde
  await checkAndAwardBadges(tenantId, nuevoNivel, nuevosPuntos);

  return updated;
}

/**
 * Determina el nivel basado en puntos
 */
function determineLevel(puntos: number): string {
  if (puntos >= 1000) return 'leyenda';
  if (puntos >= 500) return 'experto';
  if (puntos >= 100) return 'vecino';
  return 'novato';
}

/**
 * Verifica y otorga badges
 */
async function checkAndAwardBadges(tenantId: string, nivel: string, puntos: number) {
  const reputation = await prisma.tenantReputation.findUnique({
    where: { tenantId },
    include: { badges: true },
  });

  if (!reputation) return;

  const badgesCodigos = reputation.badges.map((b) => b.codigo);

  // Badge por nivel
  if (nivel === 'leyenda' && !badgesCodigos.includes('leyenda')) {
    await prisma.badge.create({
      data: {
        reputationId: reputation.id,
        codigo: 'leyenda',
        nombre: 'Vecino Leyenda',
        descripcion: 'Alcanzaste el nivel máximo de reputación',
        icono: '🏆',
      },
    });
  }

  // Badge por puntos
  if (puntos >= 1000 && !badgesCodigos.includes('millonario')) {
    await prisma.badge.create({
      data: {
        reputationId: reputation.id,
        codigo: 'millonario',
        nombre: 'Millonario de Puntos',
        descripcion: 'Acumulaste 1000 puntos',
        icono: '💰',
      },
    });
  }
}

/**
 * Crea un servicio P2P
 */
export async function createP2PService(data: {
  companyId: string;
  providerId: string;
  titulo: string;
  descripcion: string;
  categoria: string;
  precio: number;
  duracion?: number;
  fotos?: string[];
  disponibilidad?: any;
}) {
  const service = await prisma.p2PService.create({
    data: {
      ...data,
      activo: true,
      moneda: 'EUR',
    },
  });

  // Actualizar reputación del proveedor
  await updateTenantReputation(data.providerId, 10);

  const reputation = await prisma.tenantReputation.findUnique({
    where: { tenantId: data.providerId },
  });

  if (reputation) {
    await prisma.tenantReputation.update({
      where: { tenantId: data.providerId },
      data: {
        serviciosOfrecidos: reputation.serviciosOfrecidos + 1,
      },
    });
  }

  return service;
}

/**
 * Crea una reserva P2P
 */
export async function createP2PBooking(data: {
  serviceId: string;
  clientId: string;
  fechaReserva: Date;
  horaInicio?: string;
  horaFin?: string;
}) {
  const service = await prisma.p2PService.findUnique({
    where: { id: data.serviceId },
  });

  if (!service) {
    throw new Error('Servicio no encontrado');
  }

  const comision = service.precio * 0.05; // 5% de comisión
  const total = service.precio + comision;

  const booking = await prisma.p2PBooking.create({
    data: {
      serviceId: data.serviceId,
      clientId: data.clientId,
      fechaReserva: data.fechaReserva,
      horaInicio: data.horaInicio,
      horaFin: data.horaFin,
      precio: service.precio,
      comision,
      total,
      estado: 'pendiente',
    },
  });

  return booking;
}

/**
 * Crea un evento comunitario
 */
export async function createCommunityEvent(data: {
  companyId: string;
  buildingId?: string;
  titulo: string;
  descripcion?: string;
  categoria: string;
  fecha: Date;
  horaInicio: string;
  horaFin?: string;
  ubicacion: string;
  capacidadMaxima?: number;
  precio?: number;
  fotos?: string[];
  organizadoPor?: string;
}) {
  const event = await prisma.communityEvent.create({
    data: {
      ...data,
      requierePago: (data.precio || 0) > 0,
      asistentesConfirmados: [],
      asistentesLista: 0,
      estado: 'programado',
    },
  });

  return event;
}

/**
 * Confirma asistencia a un evento
 */
export async function confirmAttendance(eventId: string, tenantId: string) {
  const event = await prisma.communityEvent.findUnique({
    where: { id: eventId },
  });

  if (!event) {
    throw new Error('Evento no encontrado');
  }

  const asistentes = event.asistentesConfirmados || [];

  if (asistentes.includes(tenantId)) {
    throw new Error('Ya confirmaste tu asistencia');
  }

  if (
    event.capacidadMaxima &&
    event.asistentesLista >= event.capacidadMaxima
  ) {
    throw new Error('Evento lleno');
  }

  const updated = await prisma.communityEvent.update({
    where: { id: eventId },
    data: {
      asistentesConfirmados: [...asistentes, tenantId],
      asistentesLista: event.asistentesLista + 1,
    },
  });

  return updated;
}

/**
 * Crea un embajador
 */
export async function createAmbassador(data: {
  companyId: string;
  tenantId: string;
  buildingId?: string;
  comisionPorReferido?: number;
}) {
  const ambassador = await prisma.ambassador.create({
    data: {
      companyId: data.companyId,
      tenantId: data.tenantId,
      buildingId: data.buildingId,
      comisionPorReferido: data.comisionPorReferido || 50,
      estado: 'activo',
    },
  });

  return ambassador;
}

/**
 * Registra un referido
 */
export async function registerReferral(ambassadorId: string, newTenantId: string) {
  const ambassador = await prisma.ambassador.findUnique({
    where: { id: ambassadorId },
  });

  if (!ambassador) {
    throw new Error('Embajador no encontrado');
  }

  const updated = await prisma.ambassador.update({
    where: { id: ambassadorId },
    data: {
      referidos: ambassador.referidos + 1,
      referidosActivos: ambassador.referidosActivos + 1,
      comisionGanada: ambassador.comisionGanada + ambassador.comisionPorReferido,
    },
  });

  return updated;
}
