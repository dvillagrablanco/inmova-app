import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// Tipos de preferencias para matching
interface PerfilInquilino {
  id: string;
  nombre: string;
  email: string;
  telefono?: string;
  avatar?: string;
  edad: number;
  genero: 'masculino' | 'femenino' | 'otro' | 'sin_preferencia';
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
    limpieza: 1 | 2 | 3 | 4 | 5;
    ruido: 1 | 2 | 3 | 4 | 5;
    social: 1 | 2 | 3 | 4 | 5;
    visitantes: 'nunca' | 'ocasional' | 'frecuente';
    cocinaTipo: 'individual' | 'compartida' | 'indiferente';
    baño: 'privado' | 'compartido' | 'indiferente';
    zonas: string[];
    idiomas: string[];
    intereses: string[];
  };
  verificado: boolean;
  puntuacion?: number;
  createdAt: string;
}

interface Habitacion {
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
  perfilIdeal?: Partial<PerfilInquilino['preferencias']>;
}

interface MatchResult {
  habitacion: Habitacion;
  puntuacion: number;
  detalles: {
    presupuesto: number;
    preferencias: number;
    ubicacion: number;
    disponibilidad: number;
    compatibilidadCompañeros: number;
  };
  compañeros: Array<{
    nombre: string;
    edad: number;
    ocupacion: string;
    compatibilidad: number;
  }>;
}

// Datos de ejemplo para desarrollo
const habitacionesDemo: Habitacion[] = [
  {
    id: 'hab-001',
    propiedadId: 'prop-001',
    propiedadNombre: 'Coliving Malasaña',
    direccion: 'Calle Fuencarral 45, Madrid',
    zona: 'Malasaña',
    numero: 'A1',
    superficie: 14,
    precio: 550,
    disponible: true,
    fechaDisponible: '2026-02-01',
    caracteristicas: {
      bañoPrivado: false,
      amueblada: true,
      balcon: false,
      aireAcondicionado: true,
      calefaccion: true,
      armarioEmpotrado: true,
    },
    reglas: {
      fumadores: false,
      mascotas: false,
      parejas: false,
      visitasNocturnas: true,
    },
    fotos: ['/placeholder-room.jpg'],
    inquilinosActuales: 3,
    capacidadTotal: 5,
  },
  {
    id: 'hab-002',
    propiedadId: 'prop-001',
    propiedadNombre: 'Coliving Malasaña',
    direccion: 'Calle Fuencarral 45, Madrid',
    zona: 'Malasaña',
    numero: 'B2',
    superficie: 18,
    precio: 680,
    disponible: true,
    fechaDisponible: '2026-01-25',
    caracteristicas: {
      bañoPrivado: true,
      amueblada: true,
      balcon: true,
      aireAcondicionado: true,
      calefaccion: true,
      armarioEmpotrado: true,
    },
    reglas: {
      fumadores: false,
      mascotas: true,
      parejas: false,
      visitasNocturnas: true,
    },
    fotos: ['/placeholder-room.jpg'],
    inquilinosActuales: 3,
    capacidadTotal: 5,
  },
  {
    id: 'hab-003',
    propiedadId: 'prop-002',
    propiedadNombre: 'Student House Moncloa',
    direccion: 'Avenida Complutense 12, Madrid',
    zona: 'Moncloa',
    numero: '201',
    superficie: 12,
    precio: 450,
    disponible: true,
    fechaDisponible: '2026-01-20',
    caracteristicas: {
      bañoPrivado: false,
      amueblada: true,
      balcon: false,
      aireAcondicionado: false,
      calefaccion: true,
      armarioEmpotrado: true,
    },
    reglas: {
      fumadores: false,
      mascotas: false,
      parejas: false,
      visitasNocturnas: false,
    },
    fotos: ['/placeholder-room.jpg'],
    inquilinosActuales: 7,
    capacidadTotal: 8,
  },
  {
    id: 'hab-004',
    propiedadId: 'prop-003',
    propiedadNombre: 'Professional Living Chamberí',
    direccion: 'Calle Almagro 28, Madrid',
    zona: 'Chamberí',
    numero: '3A',
    superficie: 16,
    precio: 750,
    disponible: true,
    fechaDisponible: '2026-02-15',
    caracteristicas: {
      bañoPrivado: true,
      amueblada: true,
      balcon: true,
      aireAcondicionado: true,
      calefaccion: true,
      armarioEmpotrado: true,
    },
    reglas: {
      fumadores: false,
      mascotas: true,
      parejas: true,
      visitasNocturnas: true,
    },
    fotos: ['/placeholder-room.jpg'],
    inquilinosActuales: 2,
    capacidadTotal: 4,
  },
];

const perfilesDemo: Partial<PerfilInquilino>[] = [
  {
    nombre: 'María García',
    edad: 26,
    ocupacion: 'Diseñadora UX',
    preferencias: {
      fumador: false,
      mascotas: false,
      estudiante: false,
      trabajador: true,
      horarios: 'diurno',
      limpieza: 4,
      ruido: 2,
      social: 4,
      visitantes: 'ocasional',
      cocinaTipo: 'compartida',
      baño: 'indiferente',
      zonas: ['Malasaña', 'Chamberí'],
      idiomas: ['Español', 'Inglés'],
      intereses: ['Yoga', 'Diseño', 'Viajes'],
    },
  },
  {
    nombre: 'Carlos Martínez',
    edad: 24,
    ocupacion: 'Desarrollador',
    preferencias: {
      fumador: false,
      mascotas: false,
      estudiante: false,
      trabajador: true,
      horarios: 'nocturno',
      limpieza: 3,
      ruido: 3,
      social: 3,
      visitantes: 'ocasional',
      cocinaTipo: 'compartida',
      baño: 'indiferente',
      zonas: ['Malasaña', 'Lavapiés'],
      idiomas: ['Español', 'Inglés'],
      intereses: ['Gaming', 'Música', 'Tecnología'],
    },
  },
  {
    nombre: 'Ana López',
    edad: 22,
    ocupacion: 'Estudiante Medicina',
    preferencias: {
      fumador: false,
      mascotas: false,
      estudiante: true,
      trabajador: false,
      horarios: 'flexible',
      limpieza: 5,
      ruido: 1,
      social: 2,
      visitantes: 'nunca',
      cocinaTipo: 'individual',
      baño: 'indiferente',
      zonas: ['Moncloa', 'Argüelles'],
      idiomas: ['Español'],
      intereses: ['Lectura', 'Running', 'Cine'],
    },
  },
];

// Función de cálculo de matching
function calcularMatching(
  perfil: PerfilInquilino,
  habitacion: Habitacion,
  compañeros: Partial<PerfilInquilino>[]
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
    // Bonus si está cerca del precio ideal (mitad del rango)
    const precioIdeal = (perfil.presupuestoMin + perfil.presupuestoMax) / 2;
    const diferencia = Math.abs(habitacion.precio - precioIdeal);
    const rangoTotal = perfil.presupuestoMax - perfil.presupuestoMin;
    if (rangoTotal > 0) {
      detalles.presupuesto += (1 - diferencia / rangoTotal) * 5;
    }
  } else if (habitacion.precio < perfil.presupuestoMin) {
    detalles.presupuesto = 20; // Más barato de lo esperado
  } else {
    const exceso = (habitacion.precio - perfil.presupuestoMax) / perfil.presupuestoMax;
    detalles.presupuesto = Math.max(0, 15 - exceso * 30);
  }

  // 2. Puntuación de preferencias (30%)
  let prefScore = 0;
  const prefs = perfil.preferencias;
  const reglas = habitacion.reglas;
  const caract = habitacion.caracteristicas;

  // Reglas críticas
  if (prefs.fumador && !reglas.fumadores) prefScore -= 30;
  if (prefs.mascotas && !reglas.mascotas) prefScore -= 20;

  // Baño privado
  if (prefs.baño === 'privado' && caract.bañoPrivado) prefScore += 10;
  if (prefs.baño === 'privado' && !caract.bañoPrivado) prefScore -= 5;

  // Amueblada (siempre positivo)
  if (caract.amueblada) prefScore += 5;

  // Extras
  if (caract.balcon) prefScore += 3;
  if (caract.aireAcondicionado) prefScore += 3;

  detalles.preferencias = Math.max(0, Math.min(30, 20 + prefScore));

  // 3. Puntuación de ubicación (20%)
  if (prefs.zonas && prefs.zonas.includes(habitacion.zona)) {
    detalles.ubicacion = 20;
  } else {
    detalles.ubicacion = 10; // Zona no preferida pero aceptable
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
  const compatibilidadCompañeros = compañeros.map((comp) => {
    let compat = 50; // Base

    if (comp.preferencias) {
      // Horarios similares
      if (comp.preferencias.horarios === prefs.horarios) compat += 15;

      // Nivel de limpieza similar
      const difLimpieza = Math.abs((comp.preferencias.limpieza || 3) - prefs.limpieza);
      compat += (5 - difLimpieza) * 3;

      // Nivel social similar
      const difSocial = Math.abs((comp.preferencias.social || 3) - prefs.social);
      compat += (5 - difSocial) * 3;

      // Intereses comunes
      const interesesComunes =
        comp.preferencias.intereses?.filter((i) => prefs.intereses?.includes(i)) || [];
      compat += interesesComunes.length * 5;

      // Idiomas comunes
      const idiomasComunes =
        comp.preferencias.idiomas?.filter((i) => prefs.idiomas?.includes(i)) || [];
      compat += idiomasComunes.length * 3;
    }

    return {
      nombre: comp.nombre || 'Inquilino',
      edad: comp.edad || 0,
      ocupacion: comp.ocupacion || 'N/A',
      compatibilidad: Math.min(100, Math.max(0, compat)),
    };
  });

  const avgCompatibilidad =
    compatibilidadCompañeros.length > 0
      ? compatibilidadCompañeros.reduce((sum, c) => sum + c.compatibilidad, 0) /
        compatibilidadCompañeros.length
      : 50;

  detalles.compatibilidadCompañeros = Math.round((avgCompatibilidad / 100) * 15);

  // Total
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
    compañeros: compatibilidadCompañeros,
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

    let habitaciones = habitacionesDemo;

    // Aplicar filtros
    if (zona) {
      habitaciones = habitaciones.filter((h) => h.zona.toLowerCase().includes(zona.toLowerCase()));
    }
    if (precioMax) {
      habitaciones = habitaciones.filter((h) => h.precio <= parseInt(precioMax));
    }

    // Intentar obtener habitaciones reales de la BD
    try {
      const habitacionesDB = await prisma.property.findMany({
        where: {
          companyId: session.user.companyId,
          tipo: { in: ['HABITACION', 'COLIVING'] },
          estado: 'DISPONIBLE',
        },
        include: {
          building: true,
        },
      });

      if (habitacionesDB.length > 0) {
        habitaciones = habitacionesDB.map((h: any) => ({
          id: h.id,
          propiedadId: h.buildingId || h.id,
          propiedadNombre: h.building?.name || h.nombre || 'Propiedad',
          direccion: h.direccion || h.building?.address || '',
          zona: h.zona || 'Centro',
          numero: h.numero || '1',
          superficie: h.superficie || 12,
          precio: h.precioAlquiler || h.precio || 500,
          disponible: h.estado === 'DISPONIBLE',
          fechaDisponible: h.fechaDisponible?.toISOString() || new Date().toISOString(),
          caracteristicas: h.caracteristicas || {
            bañoPrivado: false,
            amueblada: true,
            balcon: false,
            aireAcondicionado: false,
            calefaccion: true,
            armarioEmpotrado: true,
          },
          reglas: h.reglas || {
            fumadores: false,
            mascotas: false,
            parejas: false,
            visitasNocturnas: true,
          },
          fotos: h.fotos || [],
          inquilinosActuales: 0,
          capacidadTotal: h.capacidad || 1,
        }));
      }
    } catch (dbError) {
      console.warn('[Matching API] Usando datos demo:', dbError);
    }

    return NextResponse.json({
      habitaciones: habitaciones.filter((h) => h.disponible),
      perfiles: perfilesDemo,
      zonas: ['Malasaña', 'Chamberí', 'Moncloa', 'Lavapiés', 'Argüelles', 'Salamanca'],
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
    const { perfil } = body as { perfil: PerfilInquilino };

    if (!perfil) {
      return NextResponse.json({ error: 'Perfil de inquilino requerido' }, { status: 400 });
    }

    // Obtener habitaciones disponibles
    let habitaciones = habitacionesDemo.filter((h) => h.disponible);

    // Calcular matching para cada habitación
    const resultados: MatchResult[] = habitaciones.map((habitacion) => {
      // Obtener compañeros actuales (demo)
      const compañeros = perfilesDemo.slice(0, habitacion.inquilinosActuales);
      return calcularMatching(perfil, habitacion, compañeros);
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
