/**
 * Servicio de AR/VR Tours Virtuales
 * Gestión de tours 360°, visualizaciones AR y análisis de engagement
 */

import { prisma } from './db';

/**
 * Registra una vista de un tour virtual
 */
export async function registrarVistaTour(tourId: string, duracionSegundos: number) {
  const tour = await prisma.virtualTour.findUnique({
    where: { id: tourId },
  });

  if (!tour) {
    throw new Error('Tour no encontrado');
  }

  // Actualizar estadísticas
  const nuevasVistas = tour.vistas + 1;
  const nuevoTiempoPromedio = tour.tiempoPromedio
    ? Math.round((tour.tiempoPromedio * tour.vistas + duracionSegundos) / nuevasVistas)
    : duracionSegundos;

  await prisma.virtualTour.update({
    where: { id: tourId },
    data: {
      vistas: nuevasVistas,
      tiempoPromedio: nuevoTiempoPromedio,
    },
  });

  return {
    vistas: nuevasVistas,
    tiempoPromedio: nuevoTiempoPromedio,
  };
}

/**
 * Genera un tour virtual básico a partir de fotos
 */
export async function generarTourDesdeGaleria(companyId: string, unitId: string, titulo: string) {
  // Buscar galería existente
  const galeria = await prisma.propertyGallery.findFirst({
    where: { unitId },
    include: {
      items: {
        where: { tipo: 'foto' },
        orderBy: { orden: 'asc' },
      },
      unit: {
        include: { building: true },
      },
    },
  });

  if (!galeria || galeria.items.length === 0) {
    throw new Error('No hay fotos disponibles para generar el tour');
  }

  // Agrupar fotos por habitación
  const escenasPorHabitacion: Record<string, any[]> = {};

  galeria.items.forEach((item) => {
    const habitacion = item.habitacion || 'General';
    if (!escenasPorHabitacion[habitacion]) {
      escenasPorHabitacion[habitacion] = [];
    }
    escenasPorHabitacion[habitacion].push({
      id: item.id,
      url: item.url,
      titulo: item.titulo,
      descripcion: item.descripcion,
    });
  });

  // Crear escenas del tour
  const escenas = Object.entries(escenasPorHabitacion).map(([habitacion, fotos], index) => ({
    id: `escena_${index}`,
    nombre: habitacion,
    imagenPrincipal: fotos[0].url,
    imagenes: fotos.map((f) => f.url),
    descripcion: `Recorrido por ${habitacion}`,
    orden: index,
  }));

  // Crear hotspots (puntos de interés)
  const hotspots = escenas.map((escena, index) => {
    const siguiente = index < escenas.length - 1 ? escenas[index + 1] : escenas[0];
    return {
      escenaId: escena.id,
      tipo: 'navigation',
      destino: siguiente.id,
      posicion: { x: 0.5, y: 0.5 },
      icono: 'arrow-right',
      tooltip: `Ir a ${siguiente.nombre}`,
    };
  });

  // Crear el tour
  const tour = await prisma.virtualTour.create({
    data: {
      companyId,
      unitId,
      buildingId: galeria.unit.buildingId,
      titulo,
      descripcion: `Tour virtual de ${galeria.unit.numero} en ${galeria.unit.building.nombre}`,
      tipo: '360_photo',
      urlPrincipal: escenas[0].imagenPrincipal,
      urlThumbnail: galeria.portada || escenas[0].imagenPrincipal,
      escenas,
      hotspots,
      estado: 'activo',
      publico: false,
    },
  });

  return tour;
}

/**
 * Calcula el costo estimado de una visualización AR de reforma
 */
export function calcularCostoReforma(elementos: any[]): {
  costoTotal: number;
  tiempoEstimado: number;
  desglose: any[];
} {
  const costoPorTipo: Record<string, number> = {
    pintura: 15, // €/m2
    suelo: 50,
    cocina: 8000,
    baño: 6000,
    ventanas: 400,
    puertas: 300,
    mobiliario: 500,
  };

  const tiempoPorTipo: Record<string, number> = {
    pintura: 3, // días
    suelo: 5,
    cocina: 15,
    baño: 10,
    ventanas: 2,
    puertas: 1,
    mobiliario: 1,
  };

  let costoTotal = 0;
  let tiempoTotal = 0;
  const desglose: any[] = [];

  elementos.forEach((elemento) => {
    const tipo = elemento.tipo;
    const cantidad = elemento.cantidad || 1;
    const costoPorUnidad = costoPorTipo[tipo] || 100;
    const tiempoPorUnidad = tiempoPorTipo[tipo] || 1;

    const costoElemento = costoPorUnidad * cantidad;
    const tiempoElemento = tiempoPorUnidad * cantidad;

    costoTotal += costoElemento;
    tiempoTotal += tiempoElemento;

    desglose.push({
      tipo,
      descripcion: elemento.descripcion || tipo,
      cantidad,
      costoPorUnidad,
      costoTotal: costoElemento,
      tiempoEstimado: tiempoElemento,
    });
  });

  return {
    costoTotal: Math.round(costoTotal),
    tiempoEstimado: Math.round(tiempoTotal),
    desglose,
  };
}

/**
 * Obtiene métricas de engagement de tours virtuales
 */
export async function obtenerMetricasTours(
  companyId: string,
  fechaDesde?: Date,
  fechaHasta?: Date
) {
  const where: any = {
    companyId,
    estado: 'activo',
  };

  if (fechaDesde || fechaHasta) {
    where.createdAt = {};
    if (fechaDesde) where.createdAt.gte = fechaDesde;
    if (fechaHasta) where.createdAt.lte = fechaHasta;
  }

  const tours = await prisma.virtualTour.findMany({
    where,
    include: {
      unit: {
        include: { building: true },
      },
    },
  });

  const totalVistas = tours.reduce((sum, t) => sum + t.vistas, 0);
  const totalCompartido = tours.reduce((sum, t) => sum + t.compartido, 0);
  const tiempoPromedioGlobal = Math.round(
    tours.reduce((sum, t) => sum + (t.tiempoPromedio || 0), 0) / tours.length
  );

  const porTipo = tours.reduce((acc: any, t) => {
    if (!acc[t.tipo]) {
      acc[t.tipo] = { count: 0, vistas: 0 };
    }
    acc[t.tipo].count++;
    acc[t.tipo].vistas += t.vistas;
    return acc;
  }, {});

  return {
    totalTours: tours.length,
    totalVistas,
    totalCompartido,
    tiempoPromedioGlobal,
    porTipo,
    toursMasVistos: tours
      .sort((a, b) => b.vistas - a.vistas)
      .slice(0, 5)
      .map((t) => ({
        id: t.id,
        titulo: t.titulo,
        vistas: t.vistas,
        unidad: t.unit?.numero,
        edificio: t.unit?.building.nombre,
      })),
  };
}
