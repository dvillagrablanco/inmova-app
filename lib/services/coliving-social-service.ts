import { prisma } from '@/lib/db';
import { Prisma } from '@/types/prisma-types';

import logger from '@/lib/logger';
export interface ColivingProfileInput {
  tenantId: string;
  companyId: string;
  bio?: string;
  intereses: string[];
  profesion?: string;
  idiomas: string[];
  redesSociales?: Record<string, string>;
  buscoCompañeros?: boolean;
  interesCompartir?: string[];
  disponibilidad?: Record<string, string[]>;
  perfilPublico?: boolean;
  mostrarContacto?: boolean;
}

export interface ActivityPostInput {
  companyId: string;
  buildingId?: string;
  profileId: string;
  tipo: 'post' | 'evento' | 'pregunta' | 'logro';
  contenido: string;
  imagenes?: string[];
  hashtags?: string[];
  visibilidad?: 'comunidad' | 'edificio' | 'publico';
}

export interface EventInput {
  companyId: string;
  buildingId?: string;
  groupId?: string;
  titulo: string;
  descripcion: string;
  tipo: string;
  fecha: Date;
  duracion: number;
  ubicacion: string;
  capacidad?: number;
  requiereInscripcion?: boolean;
  costo?: number;
  organizador: string;
  imagen?: string;
  etiquetas?: string[];
}

export interface GroupInput {
  companyId: string;
  buildingId?: string;
  nombre: string;
  descripcion: string;
  categoria: string;
  icono?: string;
  imagen?: string;
  esPublico?: boolean;
  maxMiembros?: number;
  reglas?: string;
  adminId: string;
}

// =====================
// GESTIÓN DE PERFILES
// =====================

export async function createColivingProfile(input: ColivingProfileInput) {
  try {
    const profile = await prisma.colivingProfile.create({
      data: {
        tenantId: input.tenantId,
        companyId: input.companyId,
        bio: input.bio,
        intereses: input.intereses,
        profesion: input.profesion,
        idiomas: input.idiomas,
        redesSociales: input.redesSociales || {},
        buscoCompañeros: input.buscoCompañeros ?? true,
        interesCompartir: input.interesCompartir || [],
        disponibilidad: input.disponibilidad || {},
        perfilPublico: input.perfilPublico ?? true,
        mostrarContacto: input.mostrarContacto ?? false,
      },
      include: {
        tenant: {
          select: {
            nombreCompleto: true,
            email: true,
          },
        },
      },
    });
    return { success: true, profile };
  } catch (error) {
    logger.error('Error creando perfil de coliving:', error);
    return { success: false, error: 'Error al crear perfil' };
  }
}

export async function updateColivingProfile(
  profileId: string,
  updates: Partial<ColivingProfileInput>
) {
  try {
    const profile = await prisma.colivingProfile.update({
      where: { id: profileId },
      data: {
        ...updates,
      },
    });
    return { success: true, profile };
  } catch (error) {
    logger.error('Error actualizando perfil:', error);
    return { success: false, error: 'Error al actualizar perfil' };
  }
}

export async function getColivingProfile(tenantId: string) {
  try {
    const profile = await prisma.colivingProfile.findUnique({
      where: { tenantId },
      include: {
        tenant: {
          select: {
            nombreCompleto: true,
            email: true,
          },
        },
        gruposParticipa: {
          include: {
            group: true,
          },
        },
        eventosAsiste: {
          include: {
            event: true,
          },
          where: {
            estado: 'confirmado',
          },
        },
      },
    });
    return { success: true, profile };
  } catch (error) {
    logger.error('Error obteniendo perfil:', error);
    return { success: false, error: 'Error al obtener perfil' };
  }
}

export async function addReputationPoints(
  profileId: string,
  points: number,
  reason: string
) {
  try {
    const profile = await prisma.colivingProfile.findUnique({
      where: { id: profileId },
    });

    if (!profile) {
      return { success: false, error: 'Perfil no encontrado' };
    }

    const newPoints = profile.puntosReputacion + points;
    let newNivel = profile.nivel;

    // Determinar nivel según puntos
    if (newPoints >= 1000) newNivel = 'platino';
    else if (newPoints >= 500) newNivel = 'oro';
    else if (newPoints >= 200) newNivel = 'plata';
    else newNivel = 'bronce';

    const updatedProfile = await prisma.colivingProfile.update({
      where: { id: profileId },
      data: {
        puntosReputacion: newPoints,
        nivel: newNivel,
      },
    });

    return { success: true, profile: updatedProfile };
  } catch (error) {
    logger.error('Error añadiendo puntos de reputación:', error);
    return { success: false, error: 'Error al añadir puntos' };
  }
}

export async function addBadge(
  profileId: string,
  badge: { id: string; nombre: string; icono: string; fecha: Date }
) {
  try {
    const profile = await prisma.colivingProfile.findUnique({
      where: { id: profileId },
    });

    if (!profile) {
      return { success: false, error: 'Perfil no encontrado' };
    }

    const badges = (profile.badges as any[]) || [];
    badges.push(badge);

    const updatedProfile = await prisma.colivingProfile.update({
      where: { id: profileId },
      data: {
        badges: badges,
      },
    });

    return { success: true, profile: updatedProfile };
  } catch (error) {
    logger.error('Error añadiendo badge:', error);
    return { success: false, error: 'Error al añadir badge' };
  }
}

// =====================
// SISTEMA DE MATCHING
// =====================

export async function calculateCompatibilityScore(
  profile1: any,
  profile2: any
): Promise<number> {
  let score = 0;

  // Comparar intereses (40%)
  const intereses1 = new Set(profile1.intereses as string[]);
  const intereses2 = new Set(profile2.intereses as string[]);
  const interesesComunes = [...intereses1].filter((x) => intereses2.has(x));
  score += (interesesComunes.length / Math.max(intereses1.size, 1)) * 40;

  // Comparar idiomas (20%)
  const idiomas1 = new Set(profile1.idiomas as string[]);
  const idiomas2 = new Set(profile2.idiomas as string[]);
  const idiomasComunes = [...idiomas1].filter((x) => idiomas2.has(x));
  score += (idiomasComunes.length / Math.max(idiomas1.size, 1)) * 20;

  // Intereses en compartir (40%)
  const compartir1 = new Set(profile1.interesCompartir as string[]);
  const compartir2 = new Set(profile2.interesCompartir as string[]);
  const compartirComun = [...compartir1].filter((x) => compartir2.has(x));
  score += (compartirComun.length / Math.max(compartir1.size, 1)) * 40;

  return Math.round(score);
}

export async function findMatches(profileId: string) {
  try {
    const profile = await prisma.colivingProfile.findUnique({
      where: { id: profileId },
    });

    if (!profile || !profile.buscoCompañeros) {
      return { success: false, error: 'Perfil no encontrado o no busca compañeros' };
    }

    // Buscar otros perfiles en la misma compañía
    const otherProfiles = await prisma.colivingProfile.findMany({
      where: {
        companyId: profile.companyId,
        id: { not: profileId },
        buscoCompañeros: true,
        perfilPublico: true,
      },
      include: {
        tenant: {
          select: {
            nombreCompleto: true,
          },
        },
      },
    });

    // Calcular score de compatibilidad para cada perfil
    const matches = await Promise.all(
      otherProfiles.map(async (otherProfile: any) => {
        const score = await calculateCompatibilityScore(profile, otherProfile);
        const intereses1 = new Set(profile.intereses as string[]);
        const intereses2 = new Set(otherProfile.intereses as string[]);
        const interesesComunes = [...intereses1].filter((x) => intereses2.has(x));

        return {
          profile: otherProfile,
          score,
          interesesComunes,
        };
      })
    );

    // Filtrar solo matches con score >= 30 y ordenar por score
    const goodMatches = matches
      .filter((m: any) => m.score >= 30)
      .sort((a: any, b: any) => b.score - a.score);

    return { success: true, matches: goodMatches };
  } catch (error) {
    logger.error('Error buscando matches:', error);
    return { success: false, error: 'Error al buscar matches' };
  }
}

export async function createMatch(
  profile1Id: string,
  profile2Id: string,
  companyId: string
) {
  try {
    const profile1 = await prisma.colivingProfile.findUnique({
      where: { id: profile1Id },
    });
    const profile2 = await prisma.colivingProfile.findUnique({
      where: { id: profile2Id },
    });

    if (!profile1 || !profile2) {
      return { success: false, error: 'Perfiles no encontrados' };
    }

    const score = await calculateCompatibilityScore(profile1, profile2);
    const intereses1 = new Set(profile1.intereses as string[]);
    const intereses2 = new Set(profile2.intereses as string[]);
    const interesesComunes = [...intereses1].filter((x) => intereses2.has(x));

    const match = await prisma.colivingMatch.create({
      data: {
        profile1Id,
        profile2Id,
        companyId,
        scoreCompatibilidad: score,
        interesesComunes: interesesComunes,
      },
    });

    return { success: true, match };
  } catch (error) {
    logger.error('Error creando match:', error);
    return { success: false, error: 'Error al crear match' };
  }
}

export async function acceptMatch(matchId: string) {
  try {
    const match = await prisma.colivingMatch.update({
      where: { id: matchId },
      data: {
        estado: 'aceptado',
        fechaAceptacion: new Date(),
      },
    });
    return { success: true, match };
  } catch (error) {
    logger.error('Error aceptando match:', error);
    return { success: false, error: 'Error al aceptar match' };
  }
}

// =====================
// GRUPOS DE INTERÉS
// =====================

export async function createGroup(input: GroupInput) {
  try {
    const group = await prisma.colivingGroup.create({
      data: {
        companyId: input.companyId,
        buildingId: input.buildingId,
        nombre: input.nombre,
        descripcion: input.descripcion,
        categoria: input.categoria,
        icono: input.icono,
        imagen: input.imagen,
        esPublico: input.esPublico ?? true,
        maxMiembros: input.maxMiembros,
        reglas: input.reglas,
        adminId: input.adminId,
      },
    });
    return { success: true, group };
  } catch (error) {
    logger.error('Error creando grupo:', error);
    return { success: false, error: 'Error al crear grupo' };
  }
}

export async function joinGroup(groupId: string, profileId: string) {
  try {
    // Verificar si el grupo tiene límite de miembros
    const group = await prisma.colivingGroup.findUnique({
      where: { id: groupId },
      include: {
        miembros: true,
      },
    });

    if (!group) {
      return { success: false, error: 'Grupo no encontrado' };
    }

    if (group.maxMiembros && group.miembros.length >= group.maxMiembros) {
      return { success: false, error: 'Grupo lleno' };
    }

    const member = await prisma.colivingGroupMember.create({
      data: {
        groupId,
        profileId,
        rol: 'miembro',
      },
    });

    return { success: true, member };
  } catch (error) {
    logger.error('Error uniéndose al grupo:', error);
    return { success: false, error: 'Error al unirse al grupo' };
  }
}

export async function getGroupsByCompany(companyId: string) {
  try {
    const groups = await prisma.colivingGroup.findMany({
      where: {
        companyId,
        esPublico: true,
      },
      include: {
        miembros: {
          include: {
            profile: {
              include: {
                tenant: {
                  select: {
                    nombreCompleto: true,
                  },
                },
              },
            },
          },
        },
        _count: {
          select: {
            miembros: true,
            eventos: true,
          },
        },
      },
    });
    return { success: true, groups };
  } catch (error) {
    logger.error('Error obteniendo grupos:', error);
    return { success: false, error: 'Error al obtener grupos' };
  }
}

// =====================
// FEED DE ACTIVIDADES
// =====================

export async function createActivityPost(input: ActivityPostInput) {
  try {
    const post = await prisma.colivingActivityPost.create({
      data: {
        companyId: input.companyId,
        buildingId: input.buildingId,
        profileId: input.profileId,
        tipo: input.tipo,
        contenido: input.contenido,
        imagenes: input.imagenes || [],
        hashtags: input.hashtags || [],
        visibilidad: input.visibilidad || 'comunidad',
      },
      include: {
        profile: {
          include: {
            tenant: {
              select: {
                nombreCompleto: true,
              },
            },
          },
        },
      },
    });
    return { success: true, post };
  } catch (error) {
    logger.error('Error creando publicación:', error);
    return { success: false, error: 'Error al crear publicación' };
  }
}

export async function getFeed(companyId: string, buildingId?: string) {
  try {
    const posts = await prisma.colivingActivityPost.findMany({
      where: {
        companyId,
        ...(buildingId ? { buildingId } : {}),
      },
      include: {
        profile: {
          include: {
            tenant: {
              select: {
                nombreCompleto: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50,
    });
    return { success: true, posts };
  } catch (error) {
    logger.error('Error obteniendo feed:', error);
    return { success: false, error: 'Error al obtener feed' };
  }
}

export async function likePost(postId: string, tenantId: string) {
  try {
    const post = await prisma.colivingActivityPost.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return { success: false, error: 'Publicación no encontrada' };
    }

    const likes = (post.likes as string[]) || [];
    
    if (likes.includes(tenantId)) {
      // Ya le dio like, quitar like
      const newLikes = likes.filter((id) => id !== tenantId);
      await prisma.colivingActivityPost.update({
        where: { id: postId },
        data: { likes: newLikes },
      });
      return { success: true, liked: false };
    } else {
      // Añadir like
      likes.push(tenantId);
      await prisma.colivingActivityPost.update({
        where: { id: postId },
        data: { likes: likes },
      });
      return { success: true, liked: true };
    }
  } catch (error) {
    logger.error('Error dando like:', error);
    return { success: false, error: 'Error al dar like' };
  }
}

export async function addComment(
  postId: string,
  tenantId: string,
  comentario: string
) {
  try {
    const post = await prisma.colivingActivityPost.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return { success: false, error: 'Publicación no encontrada' };
    }

    const comentarios = (post.comentarios as any[]) || [];
    comentarios.push({
      tenantId,
      texto: comentario,
      fecha: new Date().toISOString(),
    });

    const updatedPost = await prisma.colivingActivityPost.update({
      where: { id: postId },
      data: { comentarios: comentarios },
    });

    return { success: true, post: updatedPost };
  } catch (error) {
    logger.error('Error añadiendo comentario:', error);
    return { success: false, error: 'Error al añadir comentario' };
  }
}

// =====================
// EVENTOS COMUNITARIOS
// =====================

export async function createEvent(input: EventInput) {
  try {
    const event = await prisma.colivingEvent.create({
      data: {
        companyId: input.companyId,
        buildingId: input.buildingId,
        groupId: input.groupId,
        titulo: input.titulo,
        descripcion: input.descripcion,
        tipo: input.tipo,
        fecha: input.fecha,
        duracion: input.duracion,
        ubicacion: input.ubicacion,
        capacidad: input.capacidad,
        requiereInscripcion: input.requiereInscripcion ?? false,
        costo: input.costo ?? 0,
        organizador: input.organizador,
        imagen: input.imagen,
        etiquetas: input.etiquetas || [],
      },
    });
    return { success: true, event };
  } catch (error) {
    logger.error('Error creando evento:', error);
    return { success: false, error: 'Error al crear evento' };
  }
}

export async function attendEvent(eventId: string, profileId: string) {
  try {
    // Verificar capacidad
    const event = await prisma.colivingEvent.findUnique({
      where: { id: eventId },
      include: {
        asistentes: true,
      },
    });

    if (!event) {
      return { success: false, error: 'Evento no encontrado' };
    }

    if (event.capacidad && event.asistentes.length >= event.capacidad) {
      return { success: false, error: 'Evento lleno' };
    }

    const attendance = await prisma.colivingEventAttendance.create({
      data: {
        eventId,
        profileId,
        estado: 'confirmado',
      },
    });

    return { success: true, attendance };
  } catch (error) {
    logger.error('Error asistiendo a evento:', error);
    return { success: false, error: 'Error al asistir al evento' };
  }
}

export async function getUpcomingEvents(companyId: string) {
  try {
    const events = await prisma.colivingEvent.findMany({
      where: {
        companyId,
        fecha: {
          gte: new Date(),
        },
      },
      include: {
        asistentes: {
          include: {
            profile: {
              include: {
                tenant: {
                  select: {
                    nombreCompleto: true,
                  },
                },
              },
            },
          },
        },
        _count: {
          select: {
            asistentes: true,
          },
        },
      },
      orderBy: {
        fecha: 'asc',
      },
    });
    return { success: true, events };
  } catch (error) {
    logger.error('Error obteniendo eventos:', error);
    return { success: false, error: 'Error al obtener eventos' };
  }
}
