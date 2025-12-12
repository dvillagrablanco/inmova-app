/**
 * SERVICIO DE PUBLICACIONES MULTI-PLATAFORMA
 * 
 * Gestiona la creación y optimización de anuncios para múltiples portales
 * inmobiliarios (Idealista, Fotocasa, Habitaclia, etc.)
 * 
 * Sin integración con APIs externas - genera contenido optimizado
 * que el usuario puede copiar/pegar manualmente
 */

import { prisma } from './db';
import type { PublicacionEstado } from '@prisma/client';

interface DatosPublicacion {
  unitId: string;
  portales: string[]; // ['idealista', 'fotocasa', 'habitaclia']
  precioVenta?: number;
  precioAlquiler?: number;
  destacada?: boolean;
  urgente?: boolean;
}

interface AnuncioGenerado {
  portal: string;
  titulo: string;
  descripcion: string;
  descripcionCorta: string;
  caracteristicas: string[];
  palabrasClave: string[];
  urlFormato: string;
}

/**
 * GENERA ANUNCIOS OPTIMIZADOS PARA MÚLTIPLES PORTALES
 * 
 * Adapta el contenido según las características de cada portal:
 * - Idealista: Título 50 chars, descripción 1000 chars
 * - Fotocasa: Título 60 chars, descripción 2000 chars
 * - Habitaclia: Título 70 chars, descripción 1500 chars
 */
export async function generarAnunciosMultiplataforma(
  unitId: string
): Promise<AnuncioGenerado[]> {
  
  // 1. Obtener datos de la unidad
  const unit = await prisma.unit.findUnique({
    where: { id: unitId },
    include: {
      building: true,
      tenant: true
    }
  });
  
  if (!unit) {
    throw new Error('Unidad no encontrada');
  }
  
  // 2. Generar anuncios para cada portal
  const portales = ['idealista', 'fotocasa', 'habitaclia'];
  const anuncios: AnuncioGenerado[] = [];
  
  for (const portal of portales) {
    const anuncio = await generarAnuncioParaPortal(unit, portal);
    anuncios.push(anuncio);
  }
  
  return anuncios;
}

/**
 * Genera un anuncio optimizado para un portal específico
 */
async function generarAnuncioParaPortal(
  unit: any,
  portal: string
): Promise<AnuncioGenerado> {
  
  const building = unit.building;
  
  // Características destacadas
  const caracteristicas: string[] = [];
  
  if (unit.habitaciones) caracteristicas.push(`${unit.habitaciones} habitaciones`);
  if (unit.banos) caracteristicas.push(`${unit.banos} baños`);
  if (unit.superficie) caracteristicas.push(`${unit.superficie}m²`);
  if (unit.planta) caracteristicas.push(`Planta ${unit.planta}`);
  if (unit.ascensor) caracteristicas.push('Ascensor');
  if (unit.aireAcondicionado) caracteristicas.push('Aire acondicionado');
  if (unit.calefaccion) caracteristicas.push('Calefacción');
  if (unit.terraza) caracteristicas.push('Terraza');
  if (unit.balcon) caracteristicas.push('Balcón');
  if (unit.amueblado) caracteristicas.push('Amueblado');
  if (building?.ascensor) caracteristicas.push('Edificio con ascensor');
  if (building?.garaje) caracteristicas.push('Parking disponible');
  if (building?.piscina) caracteristicas.push('Piscina comunitaria');
  if (building?.jardin) caracteristicas.push('Zonas verdes');
  
  // Adaptar según portal
  const limites = getLimitesPortal(portal);
  
  // Título optimizado
  const titulo = generarTitulo(unit, building, limites.maxTitulo);
  
  // Descripción completa
  const descripcion = generarDescripcion(unit, building, caracteristicas, limites.maxDescripcion);
  
  // Descripción corta (para previews)
  const descripcionCorta = generarDescripcionCorta(unit, building);
  
  // Palabras clave para SEO
  const palabrasClave = generarPalabrasClave(unit, building);
  
  // URL sugerida para el anuncio
  const urlFormato = generarURLFormato(unit, building, portal);
  
  return {
    portal,
    titulo,
    descripcion,
    descripcionCorta,
    caracteristicas,
    palabrasClave,
    urlFormato
  };
}

/**
 * Obtiene los límites de caracteres de cada portal
 */
function getLimitesPortal(portal: string): { maxTitulo: number; maxDescripcion: number } {
  const limites: { [key: string]: { maxTitulo: number; maxDescripcion: number } } = {
    'idealista': { maxTitulo: 50, maxDescripcion: 1000 },
    'fotocasa': { maxTitulo: 60, maxDescripcion: 2000 },
    'habitaclia': { maxTitulo: 70, maxDescripcion: 1500 },
    'pisos_com': { maxTitulo: 60, maxDescripcion: 1200 },
    'yaencontre': { maxTitulo: 55, maxDescripcion: 1000 }
  };
  
  return limites[portal] || { maxTitulo: 60, maxDescripcion: 1500 };
}

/**
 * Genera un título atractivo y optimizado
 */
function generarTitulo(unit: any, building: any, maxLength: number): string {
  const partes: string[] = [];
  
  // Tipo de propiedad
  if (unit.tipo === 'vivienda') {
    if (unit.habitaciones === 1) partes.push('Ático');
    else if (unit.habitaciones === 2) partes.push('Piso 2 hab');
    else if (unit.habitaciones >= 3) partes.push('Piso amplio');
    else partes.push('Estudio');
  } else if (unit.tipo === 'local') {
    partes.push('Local comercial');
  } else if (unit.tipo === 'garaje') {
    partes.push('Plaza de garaje');
  }
  
  // Característica destacada
  if (unit.terraza) partes.push('con terraza');
  else if (building?.piscina) partes.push('con piscina');
  else if (unit.amueblado) partes.push('amueblado');
  
  // Zona (extraer primera parte de la dirección)
  if (building?.direccion) {
    const zona = building.direccion.split(',')[0];
    partes.push(`en ${zona}`);
  }
  
  let titulo = partes.join(' ');
  
  // Truncar si excede el límite
  if (titulo.length > maxLength) {
    titulo = titulo.substring(0, maxLength - 3) + '...';
  }
  
  return titulo;
}

/**
 * Genera descripción completa y persuasiva
 */
function generarDescripcion(
  unit: any,
  building: any,
  caracteristicas: string[],
  maxLength: number
): string {
  
  const parrafos: string[] = [];
  
  // Párrafo 1: Descripción general
  let intro = `Descubre este `;
  
  if (unit.tipo === 'vivienda') {
    if (unit.habitaciones >= 3) intro += 'espacioso piso';
    else if (unit.habitaciones === 2) intro += 'acogedor piso';
    else intro += 'práctico estudio';
  } else if (unit.tipo === 'local') {
    intro += 'estratégico local comercial';
  }
  
  intro += ` de ${unit.superficie}m²`;
  
  if (building?.direccion) {
    intro += ` ubicado en ${building.direccion}`;
  }
  
  intro += '. ';
  
  if (unit.estado === 'disponible') {
    intro += 'Disponible para entrar a vivir inmediatamente.';
  }
  
  parrafos.push(intro);
  
  // Párrafo 2: Características principales
  if (caracteristicas.length > 0) {
    let caracText = 'La propiedad cuenta con: ';
    caracText += caracteristicas.slice(0, 8).join(', ');
    caracText += '.';
    parrafos.push(caracText);
  }
  
  // Párrafo 3: Ventajas del edificio/ubicación
  const ventajas: string[] = [];
  
  if (building?.ascensor) ventajas.push('edificio con ascensor');
  if (building?.garaje) ventajas.push('parking disponible');
  if (building?.piscina) ventajas.push('piscina comunitaria');
  if (building?.jardin) ventajas.push('zonas verdes');
  
  if (ventajas.length > 0) {
    parrafos.push(`El edificio dispone de ${ventajas.join(', ')}.`);
  }
  
  // Párrafo 4: Llamada a la acción
  parrafos.push(
    '¡No dejes pasar esta oportunidad! Contáctanos para programar una visita y conocer todos los detalles.'
  );
  
  let descripcion = parrafos.join(' \n\n');
  
  // Truncar si excede el límite
  if (descripcion.length > maxLength) {
    descripcion = descripcion.substring(0, maxLength - 3) + '...';
  }
  
  return descripcion;
}

/**
 * Genera descripción corta para previews
 */
function generarDescripcionCorta(unit: any, building: any): string {
  const partes: string[] = [];
  
  if (unit.habitaciones) partes.push(`${unit.habitaciones} hab`);
  if (unit.banos) partes.push(`${unit.banos} baños`);
  if (unit.superficie) partes.push(`${unit.superficie}m²`);
  
  let descripcion = partes.join(' • ');
  
  if (building?.direccion) {
    const zona = building.direccion.split(',')[0];
    descripcion += ` • ${zona}`;
  }
  
  return descripcion;
}

/**
 * Genera palabras clave para SEO
 */
function generarPalabrasClave(unit: any, building: any): string[] {
  const keywords: string[] = [];
  
  // Tipo
  if (unit.tipo === 'vivienda') {
    keywords.push('piso', 'apartamento', 'vivienda');
    if (unit.habitaciones === 1) keywords.push('estudio');
  } else if (unit.tipo === 'local') {
    keywords.push('local comercial', 'negocio');
  }
  
  // Zona
  if (building?.direccion) {
    const zona = building.direccion.split(',')[0];
    keywords.push(zona.toLowerCase());
  }
  
  // Características
  if (unit.terraza) keywords.push('terraza');
  if (unit.amueblado) keywords.push('amueblado');
  if (unit.ascensor) keywords.push('ascensor');
  if (building?.piscina) keywords.push('piscina');
  if (building?.garaje) keywords.push('parking', 'garaje');
  
  // Estado
  if (unit.estado === 'disponible') {
    keywords.push('disponible', 'libre');
  }
  
  return keywords;
}

/**
 * Genera URL optimizada para el anuncio
 */
function generarURLFormato(unit: any, building: any, portal: string): string {
  const slug = `${unit.tipo}-${unit.habitaciones}hab-${unit.superficie}m2`
    .toLowerCase()
    .replace(/\s+/g, '-');
  
  const zona = building?.direccion?.split(',')[0].toLowerCase().replace(/\s+/g, '-') || 'zona';
  
  return `/${portal}/${zona}/${slug}-${unit.id.substring(0, 8)}`;
}

/**
 * Exporta los datos del anuncio en formato compatible con cada portal
 */
export function exportarAnuncio(anuncio: AnuncioGenerado, formato: 'json' | 'csv' | 'xml'): string {
  
  if (formato === 'json') {
    return JSON.stringify(anuncio, null, 2);
  }
  
  if (formato === 'csv') {
    const header = 'Portal,Titulo,Descripcion,Caracteristicas,Palabras Clave\n';
    const row = [
      anuncio.portal,
      `"${anuncio.titulo}"`,
      `"${anuncio.descripcion}"`,
      `"${anuncio.caracteristicas.join(', ')}"`,
      `"${anuncio.palabrasClave.join(', ')}"`
    ].join(',');
    return header + row;
  }
  
  if (formato === 'xml') {
    return `<?xml version="1.0" encoding="UTF-8"?>
<anuncio>
  <portal>${anuncio.portal}</portal>
  <titulo>${anuncio.titulo}</titulo>
  <descripcion>${anuncio.descripcion}</descripcion>
  <caracteristicas>
    ${anuncio.caracteristicas.map(c => `<item>${c}</item>`).join('\n    ')}
  </caracteristicas>
</anuncio>`;
  }
  
  return '';
}

/**
 * Guarda la publicación en la base de datos
 */
export async function guardarPublicacion(
  companyId: string,
  unitId: string,
  anuncios: AnuncioGenerado[],
  creadoPor: string,
  datosAdicionales?: {
    precioVenta?: number;
    precioAlquiler?: number;
    destacada?: boolean;
    urgente?: boolean;
  }
) {
  
  const unit = await prisma.unit.findUnique({
    where: { id: unitId },
    include: { building: true }
  });
  
  if (!unit) {
    throw new Error('Unidad no encontrada');
  }
  
  // Usar el primer anuncio como base (todos tienen contenido similar adaptado)
  const anuncioBase = anuncios[0];
  
  // Construir array de portales con sus datos
  const portalesData = anuncios.map(a => ({
    nombre: a.portal,
    activo: true,
    idExterno: null,
    url: a.urlFormato
  }));
  
  return await prisma.publicacionPortal.create({
    data: {
      companyId,
      unitId,
      buildingId: unit.buildingId,
      titulo: anuncioBase.titulo,
      descripcion: anuncioBase.descripcion,
      descripcionCorta: anuncioBase.descripcionCorta,
      portales: portalesData,
      fotosUrls: unit.imagenes || [],
      videoUrl: null,
      tourVirtualUrl: unit.tourVirtual,
      precioVenta: datosAdicionales?.precioVenta,
      precioAlquiler: datosAdicionales?.precioAlquiler || unit.rentaMensual,
      gastosIncluidos: false,
      fianza: datosAdicionales?.precioAlquiler ? datosAdicionales.precioAlquiler * 2 : unit.rentaMensual * 2,
      caracteristicas: anuncioBase.caracteristicas,
      palabrasClave: anuncioBase.palabrasClave,
      destacada: datosAdicionales?.destacada || false,
      urgente: datosAdicionales?.urgente || false,
      estado: 'borrador',
      vistas: 0,
      contactos: 0,
      favoritos: 0,
      creadoPor
    }
  });
}

/**
 * Actualiza estadísticas de la publicación (simuladas)
 */
export async function simularEstadisticas(publicacionId: string) {
  // Generar estadísticas aleatorias realistas
  const diasDesdePublicacion = Math.floor(Math.random() * 30) + 1;
  const vistas = Math.floor(Math.random() * 50) * diasDesdePublicacion;
  const contactos = Math.floor(vistas * 0.05); // 5% de conversión
  const favoritos = Math.floor(vistas * 0.02); // 2% de favoritos
  
  return await prisma.publicacionPortal.update({
    where: { id: publicacionId },
    data: {
      vistas,
      contactos,
      favoritos
    }
  });
}
