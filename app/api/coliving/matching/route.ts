import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Tipos para matching
interface PerfilBusqueda {
  nombre: string;
  email: string;
  edad: number;
  ocupacion: string;
  presupuestoMin: number;
  presupuestoMax: number;
  fechaEntrada: string;
  duracionMeses: number;
  preferencias: {
    fumador: boolean;
    mascotas: boolean;
    estudiante: boolean;
    trabajador: boolean;
    horarios: 'diurno' | 'nocturno' | 'flexible';
    limpieza: number;
    ruido: number;
    social: number;
    visitantes: 'nunca' | 'ocasional' | 'frecuente';
    cocinaTipo: 'individual' | 'compartida' | 'indiferente';
    baño: 'privado' | 'compartido' | 'indiferente';
    zonas: string[];
    idiomas: string[];
    intereses: string[];
  };
}

interface HabitacionMatch {
  id: string;
  propiedadId: string;
  propiedadNombre: string;
  direccion: string;
  zona: string;
  numero: string;
  superficie: number;
  precio: number;
  disponible: boolean;
  fechaDisponible: string;
  caracteristicas: {
    bañoPrivado: boolean;
    amueblada: boolean;
    balcon: boolean;
    aireAcondicionado: boolean;
    calefaccion: boolean;
    armarioEmpotrado: boolean;
  };
  reglas: {
    fumadores: boolean;
    mascotas: boolean;
    parejas: boolean;
    visitasNocturnas: boolean;
  };
  fotos: string[];
  inquilinosActuales: number;
  capacidadTotal: number;
}

interface CompañeroInfo {
  nombre: string;
  edad: number;
  ocupacion: string;
  compatibilidad: number;
}

interface MatchResult {
  habitacion: HabitacionMatch;
  puntuacion: number;
  detalles: {
    presupuesto: number;
    preferencias: number;
    ubicacion: number;
    disponibilidad: number;
    compatibilidadCompañeros: number;
  };
  compañeros: CompañeroInfo[];
}

// Función de cálculo de matching
function calcularMatching(
  perfil: PerfilBusqueda,
  habitacion: HabitacionMatch,
  compañerosPerfiles: any[]
): MatchResult {
  let puntuacionTotal = 0;
  const detalles = {
    presupuesto: 0,
    preferencias: 0,
    ubicacion: 0,
    disponibilidad: 0,
    compatibilidadCompañeros: 0,
  };

  // 1. Puntuación de presupuesto (25%)
  if (habitacion.precio >= perfil.presupuestoMin && habitacion.precio <= perfil.presupuestoMax) {
    detalles.presupuesto = 25;
    const precioIdeal = (perfil.presupuestoMin + perfil.presupuestoMax) / 2;
    const diferencia = Math.abs(habitacion.precio - precioIdeal);
    const rangoTotal = perfil.presupuestoMax - perfil.presupuestoMin;
    if (rangoTotal > 0) {
      detalles.presupuesto += (1 - diferencia / rangoTotal) * 5;
    }
  } else if (habitacion.precio < perfil.presupuestoMin) {
    detalles.presupuesto = 20;
  } else {
    const exceso = (habitacion.precio - perfil.presupuestoMax) / perfil.presupuestoMax;
    detalles.presupuesto = Math.max(0, 15 - exceso * 30);
  }

  // 2. Puntuación de preferencias (30%)
  let prefScore = 0;
  const prefs = perfil.preferencias;
  const reglas = habitacion.reglas;
  const caract = habitacion.caracteristicas;

  if (prefs.fumador && !reglas.fumadores) prefScore -= 30;
  if (prefs.mascotas && !reglas.mascotas) prefScore -= 20;

  if (prefs.baño === 'privado' && caract.bañoPrivado) prefScore += 10;
  if (prefs.baño === 'privado' && !caract.bañoPrivado) prefScore -= 5;

  if (caract.amueblada) prefScore += 5;
  if (caract.balcon) prefScore += 3;
  if (caract.aireAcondicionado) prefScore += 3;

  detalles.preferencias = Math.max(0, Math.min(30, 20 + prefScore));

  // 3. Puntuación de ubicación (20%)
  if (prefs.zonas && prefs.zonas.length > 0 && prefs.zonas.includes(habitacion.zona)) {
    detalles.ubicacion = 20;
  } else if (prefs.zonas && prefs.zonas.length === 0) {
    detalles.ubicacion = 15; // Sin preferencia de zona
  } else {
    detalles.ubicacion = 10;
  }

  // 4. Disponibilidad (10%)
  const fechaEntrada = new Date(perfil.fechaEntrada);
  const fechaDisponible = new Date(habitacion.fechaDisponible);
  const diasDiferencia = Math.abs(
    (fechaEntrada.getTime() - fechaDisponible.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (diasDiferencia <= 7) {
    detalles.disponibilidad = 10;
  } else if (diasDiferencia <= 14) {
    detalles.disponibilidad = 8;
  } else if (diasDiferencia <= 30) {
    detalles.disponibilidad = 5;
  } else {
    detalles.disponibilidad = 2;
  }

  // 5. Compatibilidad con compañeros (15%)
  const compañerosInfo: CompañeroInfo[] = compañerosPerfiles.map((comp) => {
    let compat = 50;

    if (comp.profile) {
      if (comp.profile.horariosActividad) {
        const horariosComp = comp.profile.horariosActividad.toLowerCase();
        if (
          (prefs.horarios === 'diurno' && horariosComp.includes('diurno')) ||
          (prefs.horarios === 'nocturno' && horariosComp.includes('nocturno')) ||
          prefs.horarios === 'flexible'
        ) {
          compat += 15;
        }
      }

      const difLimpieza = Math.abs((comp.profile.preferenciaLimpieza || 5) - prefs.limpieza);
      compat += (5 - difLimpieza) * 3;

      const difSocial = Math.abs((comp.profile.nivelSociabilidad || 5) - prefs.social);
      compat += (5 - difSocial) * 3;

      if (comp.profile.idiomas && prefs.idiomas) {
        const idiomasComunes = comp.profile.idiomas.filter((i: string) =>
          prefs.idiomas.includes(i)
        );
        compat += idiomasComunes.length * 5;
      }
    }

    return {
      nombre: comp.nombre || comp.user?.name || 'Inquilino',
      edad: comp.profile?.edad || 0,
      ocupacion: comp.profile?.ocupacion || 'N/A',
      compatibilidad: Math.min(100, Math.max(0, compat)),
    };
  });

  const avgCompatibilidad =
    compañerosInfo.length > 0
      ? compañerosInfo.reduce((sum, c) => sum + c.compatibilidad, 0) / compañerosInfo.length
      : 70; // Sin compañeros = buena compatibilidad base

  detalles.compatibilidadCompañeros = Math.round((avgCompatibilidad / 100) * 15);

  puntuacionTotal =
    detalles.presupuesto +
    detalles.preferencias +
    detalles.ubicacion +
    detalles.disponibilidad +
    detalles.compatibilidadCompañeros;

  return {
    habitacion,
    puntuacion: Math.round(puntuacionTotal),
    detalles: {
      presupuesto: Math.round(detalles.presupuesto),
      preferencias: Math.round(detalles.preferencias),
      ubicacion: Math.round(detalles.ubicacion),
      disponibilidad: Math.round(detalles.disponibilidad),
      compatibilidadCompañeros: Math.round(detalles.compatibilidadCompañeros),
    },
    compañeros: compañerosInfo,
  };
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const zona = searchParams.get('zona');
    const precioMax = searchParams.get('precioMax');

    // Obtener habitaciones reales de la BD
    let habitaciones: HabitacionMatch[] = [];
    let zonas: string[] = [];

    try {
      // Buscar habitaciones disponibles (modelo Room)
      const rooms = await prisma.room.findMany({
        where: {
          companyId: session.user.companyId,
          estado: 'disponible',
          ...(zona && { zona: { contains: zona, mode: 'insensitive' } }),
          ...(precioMax && { precioMensual: { lte: parseFloat(precioMax) } }),
        },
        include: {
          unit: {
            include: {
              building: true,
            },
          },
          contracts: {
            where: {
              estado: 'activo',
            },
            include: {
              tenant: {
                include: {
                  user: true,
                  profile: true,
                },
              },
            },
          },
        },
      });

      habitaciones = rooms.map((room: any) => ({
        id: room.id,
        propiedadId: room.unitId,
        propiedadNombre: room.unit?.building?.name || room.unit?.numero || 'Propiedad',
        direccion: room.unit?.building?.address || '',
        zona: room.zona || room.unit?.building?.zona || 'Centro',
        numero: room.numero,
        superficie: room.superficie,
        precio: room.precioMensual,
        disponible: room.estado === 'disponible',
        fechaDisponible: room.fechaDisponible?.toISOString() || new Date().toISOString(),
        caracteristicas: {
          bañoPrivado: room.banoPrivado,
          amueblada: room.amueblada,
          balcon: room.tieneBalcon,
          aireAcondicionado: room.aireAcondicionado,
          calefaccion: room.calefaccion,
          armarioEmpotrado: room.armarioEmpotrado,
        },
        reglas: {
          fumadores: room.permiteFumar || false,
          mascotas: room.permiteMascotas || false,
          parejas: room.permitePareja || false,
          visitasNocturnas: true,
        },
        fotos: room.imagenes || [],
        inquilinosActuales: room.contracts?.length || 0,
        capacidadTotal: room.capacidad || 1,
      }));

      // Obtener zonas únicas
      const zonasSet = new Set(habitaciones.map((h) => h.zona).filter(Boolean));
      zonas = Array.from(zonasSet);
    } catch (dbError) {
      console.warn('[Matching API] Error de BD Room, intentando con Unit:', dbError);

      // Fallback: usar Units tipo HABITACION
      try {
        const units = await prisma.unit.findMany({
          where: {
            building: {
              companyId: session.user.companyId,
            },
            tipo: { in: ['habitacion', 'coliving'] },
            estado: 'disponible',
            ...(precioMax && { rentaMensual: { lte: parseFloat(precioMax) } }),
          },
          include: {
            building: true,
            tenant: {
              include: {
                user: true,
                profile: true,
              },
            },
          },
        });

        habitaciones = units.map((unit: any) => ({
          id: unit.id,
          propiedadId: unit.buildingId,
          propiedadNombre: unit.building?.name || 'Propiedad',
          direccion: unit.building?.address || '',
          zona: unit.building?.zona || 'Centro',
          numero: unit.numero,
          superficie: unit.superficie,
          precio: unit.rentaMensual,
          disponible: unit.estado === 'disponible',
          fechaDisponible: new Date().toISOString(),
          caracteristicas: {
            bañoPrivado: unit.banos >= 1,
            amueblada: unit.amueblado,
            balcon: unit.balcon,
            aireAcondicionado: unit.aireAcondicionado,
            calefaccion: unit.calefaccion,
            armarioEmpotrado: true,
          },
          reglas: {
            fumadores: false,
            mascotas: false,
            parejas: true,
            visitasNocturnas: true,
          },
          fotos: unit.imagenes || [],
          inquilinosActuales: unit.tenant ? 1 : 0,
          capacidadTotal: unit.habitaciones || 1,
        }));

        const zonasSet = new Set(habitaciones.map((h) => h.zona).filter(Boolean));
        zonas = Array.from(zonasSet);
      } catch (unitError) {
        console.warn('[Matching API] Error de BD Unit:', unitError);
      }
    }

    // Si no hay zonas, devolver lista por defecto
    if (zonas.length === 0) {
      zonas = ['Centro', 'Norte', 'Sur', 'Este', 'Oeste'];
    }

    return NextResponse.json({
      habitaciones: habitaciones.filter((h) => h.disponible),
      total: habitaciones.length,
      zonas,
    });
  } catch (error: any) {
    console.error('[Matching API] Error:', error);
    return NextResponse.json({ error: 'Error al obtener datos de matching' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const { perfil } = body as { perfil: PerfilBusqueda };

    if (!perfil) {
      return NextResponse.json({ error: 'Perfil de inquilino requerido' }, { status: 400 });
    }

    // Obtener habitaciones disponibles
    let habitaciones: HabitacionMatch[] = [];
    let tenantsActuales: any[] = [];

    try {
      const rooms = await prisma.room.findMany({
        where: {
          companyId: session.user.companyId,
          estado: 'disponible',
          precioMensual: {
            gte: perfil.presupuestoMin * 0.8,
            lte: perfil.presupuestoMax * 1.2,
          },
        },
        include: {
          unit: {
            include: {
              building: true,
            },
          },
          contracts: {
            where: {
              estado: 'activo',
            },
            include: {
              tenant: {
                include: {
                  user: true,
                  profile: true,
                },
              },
            },
          },
        },
      });

      habitaciones = rooms.map((room: any) => {
        tenantsActuales = room.contracts?.map((c: any) => c.tenant) || [];

        return {
          id: room.id,
          propiedadId: room.unitId,
          propiedadNombre: room.unit?.building?.name || room.unit?.numero || 'Propiedad',
          direccion: room.unit?.building?.address || '',
          zona: room.zona || room.unit?.building?.zona || 'Centro',
          numero: room.numero,
          superficie: room.superficie,
          precio: room.precioMensual,
          disponible: true,
          fechaDisponible: room.fechaDisponible?.toISOString() || new Date().toISOString(),
          caracteristicas: {
            bañoPrivado: room.banoPrivado,
            amueblada: room.amueblada,
            balcon: room.tieneBalcon,
            aireAcondicionado: room.aireAcondicionado,
            calefaccion: room.calefaccion,
            armarioEmpotrado: room.armarioEmpotrado,
          },
          reglas: {
            fumadores: room.permiteFumar || false,
            mascotas: room.permiteMascotas || false,
            parejas: room.permitePareja || false,
            visitasNocturnas: true,
          },
          fotos: room.imagenes || [],
          inquilinosActuales: room.contracts?.length || 0,
          capacidadTotal: room.capacidad || 1,
        };
      });
    } catch (dbError) {
      console.warn('[Matching API POST] Error Room, intentando Unit:', dbError);

      try {
        const units = await prisma.unit.findMany({
          where: {
            building: {
              companyId: session.user.companyId,
            },
            tipo: { in: ['habitacion', 'coliving'] },
            estado: 'disponible',
            rentaMensual: {
              gte: perfil.presupuestoMin * 0.8,
              lte: perfil.presupuestoMax * 1.2,
            },
          },
          include: {
            building: true,
            tenant: {
              include: {
                user: true,
                profile: true,
              },
            },
          },
        });

        habitaciones = units.map((unit: any) => ({
          id: unit.id,
          propiedadId: unit.buildingId,
          propiedadNombre: unit.building?.name || 'Propiedad',
          direccion: unit.building?.address || '',
          zona: unit.building?.zona || 'Centro',
          numero: unit.numero,
          superficie: unit.superficie,
          precio: unit.rentaMensual,
          disponible: true,
          fechaDisponible: new Date().toISOString(),
          caracteristicas: {
            bañoPrivado: unit.banos >= 1,
            amueblada: unit.amueblado,
            balcon: unit.balcon,
            aireAcondicionado: unit.aireAcondicionado,
            calefaccion: unit.calefaccion,
            armarioEmpotrado: true,
          },
          reglas: {
            fumadores: false,
            mascotas: false,
            parejas: true,
            visitasNocturnas: true,
          },
          fotos: unit.imagenes || [],
          inquilinosActuales: unit.tenant ? 1 : 0,
          capacidadTotal: unit.habitaciones || 1,
        }));
      } catch (unitError) {
        console.warn('[Matching API POST] Error Unit:', unitError);
      }
    }

    // Si no hay habitaciones, retornar vacío
    if (habitaciones.length === 0) {
      return NextResponse.json({
        resultados: [],
        total: 0,
        mejorMatch: null,
        mensaje: 'No se encontraron habitaciones que coincidan con tu presupuesto',
      });
    }

    // Calcular matching para cada habitación
    const resultados: MatchResult[] = habitaciones.map((habitacion) => {
      return calcularMatching(perfil, habitacion, tenantsActuales);
    });

    // Ordenar por puntuación
    resultados.sort((a, b) => b.puntuacion - a.puntuacion);

    return NextResponse.json({
      resultados,
      total: resultados.length,
      mejorMatch: resultados[0] || null,
    });
  } catch (error: any) {
    console.error('[Matching API POST] Error:', error);
    return NextResponse.json({ error: 'Error al calcular matching' }, { status: 500 });
  }
}
