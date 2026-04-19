/**
 * Servicio de auto-relleno de dimensiones de unidades.
 *
 * Fuentes de datos por orden de prioridad:
 *   1) Escritura procesada previamente (Document tipo 'escritura' con datos
 *      extraídos por IA) — máxima fiabilidad: dato escriturado
 *   2) Catastro público (referencia catastral de la unidad → consulta DNPRC)
 *      — alta fiabilidad: dato oficial actualizado
 *   3) Catastro a partir de la dirección del edificio + matching por
 *      planta/puerta/tipo
 *
 * Devuelve los campos que ha podido determinar y la fuente.
 */

import logger from '@/lib/logger';

export interface AutoFillCandidate {
  superficie?: number;
  superficieUtil?: number;
  habitaciones?: number;
  banos?: number;
  planta?: number;
  orientacion?: string;
  referenciaCatastral?: string;
  uso?: string;
  anoConstruccion?: number;
}

export interface AutoFillResult {
  source: 'escritura' | 'catastro_unidad' | 'catastro_edificio_matching' | 'none';
  confidence: 'high' | 'medium' | 'low';
  fields: AutoFillCandidate;
  documentId?: string;
  fincaCatastral?: any;
  rawNote?: string;
}

const norm = (s: string) =>
  String(s || '')
    .replace(/[ºª°\s]/g, '')
    .toUpperCase();

/**
 * Extrae los datos relevantes de una escritura ya procesada.
 * La escritura debe estar guardada como Document con datos en 'extractedData' o
 * en 'descripcion'/'tags'. Buscamos también si el Document tiene un JSON
 * en cloudStoragePath o equivalente.
 */
async function findFromEscritura(unit: {
  id: string;
  numero: string;
  planta: number | null;
  tipo: string;
  superficie: number;
  buildingId: string;
  referenciaCatastral: string | null;
}): Promise<AutoFillResult | null> {
  const { getPrismaClient } = await import('@/lib/db');
  const prisma = getPrismaClient();

  // Buscar documentos tipo escritura del edificio
  const documents = await prisma.document.findMany({
    where: {
      buildingId: unit.buildingId,
      OR: [
        { tags: { has: 'escritura' } },
        { nombre: { contains: 'escritura', mode: 'insensitive' } },
        { nombre: { contains: 'compraventa', mode: 'insensitive' } },
        { tipo: 'escritura' as any },
      ],
    },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });

  if (documents.length === 0) return null;

  // Buscar bloque <!--EXTRACTED_DATA_JSON--> en descripcion (lo escribe
  // /api/ai/process-escritura tras procesar el PDF con Claude/Tesseract).
  for (const doc of documents) {
    let meta: any = null;
    const desc = doc.descripcion || '';
    const jsonMatch = desc.match(/<!--EXTRACTED_DATA_JSON-->\s*([\s\S]*?)\s*<!--\/EXTRACTED_DATA_JSON-->/);
    if (jsonMatch) {
      try {
        meta = JSON.parse(jsonMatch[1]);
      } catch {
        meta = null;
      }
    }
    if (!meta) {
      // Fallback: intentar metadata o datosExtraidos si los modelos tienen ese campo
      meta = (doc as any).metadata || (doc as any).datosExtraidos;
    }
    if (!meta || typeof meta !== 'object') continue;

    const fincas = meta.fincas || meta.units || [];
    if (!Array.isArray(fincas) || fincas.length === 0) continue;

    const matchedFinca = matchFincaToUnit(unit, fincas);
    if (matchedFinca) {
      const fields: AutoFillCandidate = {};
      if (matchedFinca.superficie_construida && matchedFinca.superficie_construida > 0) {
        fields.superficie = matchedFinca.superficie_construida;
      }
      if (matchedFinca.superficie_util && matchedFinca.superficie_util > 0) {
        fields.superficieUtil = matchedFinca.superficie_util;
      }
      if (matchedFinca.referencia_catastral) {
        fields.referenciaCatastral = matchedFinca.referencia_catastral;
      }
      // Planta numérica
      if (matchedFinca.planta) {
        const p = parsePlanta(matchedFinca.planta);
        if (p !== null) fields.planta = p;
      }
      // Habitaciones / baños desde descripción
      if (matchedFinca.descripcion) {
        const habs = matchedFinca.descripcion.match(/(\d+)\s*(?:habitaci|hab|dormit)/i);
        if (habs) fields.habitaciones = parseInt(habs[1], 10);
        const banos = matchedFinca.descripcion.match(/(\d+)\s*ba[ñn]o/i);
        if (banos) fields.banos = parseInt(banos[1], 10);
      }

      if (Object.keys(fields).length > 0) {
        return {
          source: 'escritura',
          confidence: 'high',
          fields,
          documentId: doc.id,
          rawNote: `Escritura: ${doc.nombre}`,
        };
      }
    }
  }

  return null;
}

function matchFincaToUnit(
  unit: { numero: string; planta: number | null; tipo: string; superficie: number },
  fincas: Array<{
    numero_finca?: string;
    descripcion?: string;
    planta?: string;
    tipo?: string;
    superficie_construida?: number;
    referencia_catastral?: string;
  }>
): any | null {
  let bestScore = 0;
  let bestMatch: any = null;

  for (const finca of fincas) {
    let score = 0;

    // Match planta
    if (finca.planta && unit.planta !== null) {
      const fincaPlanta = parsePlanta(finca.planta);
      if (fincaPlanta !== null && fincaPlanta === unit.planta) score += 4;
    }

    // Match tipo
    if (finca.tipo && unit.tipo) {
      const ft = String(finca.tipo).toLowerCase();
      if (ft === unit.tipo) score += 3;
      else if (
        (unit.tipo === 'vivienda' && (ft.includes('vivienda') || ft.includes('residencial'))) ||
        (unit.tipo === 'local' && (ft.includes('local') || ft.includes('comercial'))) ||
        (unit.tipo === 'garaje' && (ft.includes('garaje') || ft.includes('aparcamiento'))) ||
        (unit.tipo === 'trastero' && (ft.includes('trastero') || ft.includes('almac')))
      ) {
        score += 2;
      }
    }

    // Match superficie ±20%
    if (finca.superficie_construida && unit.superficie > 0) {
      const ratio = unit.superficie / finca.superficie_construida;
      if (ratio > 0.85 && ratio < 1.15) score += 2;
      if (ratio > 0.95 && ratio < 1.05) score += 2;
    }

    // Match descripción / numero
    const numNorm = norm(unit.numero);
    if (finca.descripcion) {
      const descNorm = norm(finca.descripcion);
      if (descNorm.includes(numNorm)) score += 4;
      // Letra de puerta
      const letraMatch = numNorm.match(/[A-Z]+$/);
      if (letraMatch && descNorm.includes(letraMatch[0])) score += 2;
    }

    if (score > bestScore) {
      bestScore = score;
      bestMatch = finca;
    }
  }

  return bestScore >= 5 ? bestMatch : null;
}

function parsePlanta(p: string | number): number | null {
  if (typeof p === 'number') return p;
  const s = String(p).toLowerCase().trim();
  if (s === 'bajo' || s === 'pb' || s === '0') return 0;
  if (s === 'sotano' || s === 'sótano' || s === '-1' || s === 'st') return -1;
  if (s === 'entresuelo' || s === 'entreplanta') return 0;
  if (s === 'principal') return 1;
  if (s === 'atico' || s === 'ático') return 99;
  const num = parseInt(s, 10);
  return isNaN(num) ? null : num;
}

/**
 * Consulta el Catastro para obtener dimensiones por referencia catastral.
 */
async function findFromCatastro(rc: string | null | undefined): Promise<AutoFillResult | null> {
  if (!rc || rc.length < 14) return null;

  try {
    const { consultarEdificioPorRC } = await import('@/lib/catastro-service');

    // RC de unidad concreta (20 chars) — buscar la finca que coincida exactamente
    if (rc.length >= 20) {
      const edificio = await consultarEdificioPorRC(rc.substring(0, 14));
      if (!edificio) return null;

      const finca = edificio.fincas.find(
        (f) => f.referenciaCatastral === rc || f.referenciaCatastral.startsWith(rc.substring(0, 18))
      );
      if (finca && finca.superficie > 0) {
        const fields: AutoFillCandidate = {
          referenciaCatastral: finca.referenciaCatastral,
          superficie: finca.superficieTotal || finca.superficie, // m² construidos totales
          superficieUtil: finca.superficie, // m² útiles del activo (sin comunes)
          uso: finca.uso || undefined,
        };
        const planta = parsePlanta(finca.planta);
        if (planta !== null) fields.planta = planta;
        const anoFinca = finca.anoConstruccion || edificio.anoConstruccion;
        if (anoFinca && anoFinca > 0) fields.anoConstruccion = anoFinca;

        return {
          source: 'catastro_unidad',
          confidence: 'high',
          fields,
          fincaCatastral: finca,
          rawNote: `Catastro: ${finca.uso || 'unidad'} pta=${finca.puerta || '?'} pl=${finca.planta || '?'} sup=${finca.superficie}m² ${finca.superficieTotal ? `(total ${finca.superficieTotal})` : ''}`,
        };
      }
    }

    // RC del edificio (14 chars) — necesita matching contra unidad
    return null;
  } catch (error: any) {
    logger.warn('[Auto-fill] Catastro error:', error.message);
    return null;
  }
}

/**
 * Hace matching usando la RC del edificio (14 chars) cuando la unidad no
 * tiene RC propia. Trae todas las fincas del edificio y elige la mejor.
 */
async function findFromCatastroBuilding(unit: {
  id: string;
  numero: string;
  planta: number | null;
  tipo: string;
  superficie: number;
}, buildingRc: string | null): Promise<AutoFillResult | null> {
  if (!buildingRc || buildingRc.length < 14) return null;

  try {
    const { consultarEdificioPorRC } = await import('@/lib/catastro-service');
    const edificio = await consultarEdificioPorRC(buildingRc.substring(0, 14));
    if (!edificio || edificio.fincas.length === 0) return null;

    // Score cada finca contra la unit
    let bestScore = 0;
    let bestFinca: any = null;
    const usedFincas = new Set<string>();

    for (const finca of edificio.fincas) {
      if (usedFincas.has(finca.referenciaCatastral)) continue;

      let score = 0;
      // Planta
      const fincaPl = parsePlanta(finca.planta);
      if (fincaPl !== null && unit.planta !== null && fincaPl === unit.planta) score += 4;

      // Puerta dentro del numero
      const numNorm = norm(unit.numero);
      const puertaNorm = norm(finca.puerta);
      if (puertaNorm && numNorm.includes(puertaNorm)) score += 5;

      // Tipo / uso
      const usoLow = finca.uso.toLowerCase();
      if (
        (unit.tipo === 'vivienda' && (usoLow.includes('vivienda') || usoLow.includes('residencial'))) ||
        (unit.tipo === 'local' && (usoLow.includes('comercial') || usoLow.includes('local'))) ||
        (unit.tipo === 'garaje' && (usoLow.includes('garaje') || usoLow.includes('aparcamiento'))) ||
        (unit.tipo === 'trastero' && (usoLow.includes('almac') || usoLow.includes('trastero')))
      ) {
        score += 2;
      }

      // Superficie ±20%
      if (unit.superficie > 0 && finca.superficie > 0) {
        const ratio = unit.superficie / finca.superficie;
        if (ratio > 0.8 && ratio < 1.2) score += 2;
        if (ratio > 0.95 && ratio < 1.05) score += 2;
      }

      if (score > bestScore) {
        bestScore = score;
        bestFinca = finca;
      }
    }

    if (bestScore >= 5 && bestFinca) {
      const fields: AutoFillCandidate = {
        referenciaCatastral: bestFinca.referenciaCatastral,
        uso: bestFinca.uso || undefined,
      };
      if (bestFinca.superficie > 0) {
        fields.superficie = bestFinca.superficieTotal || bestFinca.superficie;
        if (bestFinca.superficieTotal && bestFinca.superficie < bestFinca.superficieTotal) {
          fields.superficieUtil = bestFinca.superficie;
        }
      }
      const planta = parsePlanta(bestFinca.planta);
      if (planta !== null) fields.planta = planta;
      const anoFinca = bestFinca.anoConstruccion || edificio.anoConstruccion;
      if (anoFinca && anoFinca > 0) fields.anoConstruccion = anoFinca;

      return {
        source: 'catastro_edificio_matching',
        confidence: bestScore >= 8 ? 'high' : 'medium',
        fields,
        fincaCatastral: bestFinca,
        rawNote: `Catastro (score=${bestScore}): pta=${bestFinca.puerta || '?'} pl=${bestFinca.planta || '?'} sup=${bestFinca.superficie}m²${bestFinca.superficieTotal ? ` (total ${bestFinca.superficieTotal})` : ''}`,
      };
    }

    return null;
  } catch (error: any) {
    logger.warn('[Auto-fill] Catastro building error:', error.message);
    return null;
  }
}

/**
 * Función principal: dada una unidad, intenta determinar sus dimensiones desde
 * todas las fuentes disponibles. Devuelve la primera con confidence >= medium.
 */
export async function autoFillUnitDimensions(unitId: string): Promise<AutoFillResult> {
  const { getPrismaClient } = await import('@/lib/db');
  const prisma = getPrismaClient();

  const unit = await prisma.unit.findUnique({
    where: { id: unitId },
    include: {
      building: {
        select: {
          id: true,
          referenciaCatastral: true,
          direccion: true,
        },
      },
    },
  });

  if (!unit) {
    return { source: 'none', confidence: 'low', fields: {}, rawNote: 'Unidad no encontrada' };
  }

  const unitInput = {
    id: unit.id,
    numero: unit.numero,
    planta: unit.planta,
    tipo: unit.tipo,
    superficie: unit.superficie,
    buildingId: unit.buildingId,
    referenciaCatastral: unit.referenciaCatastral,
  };

  // 1) Escritura
  const fromEscritura = await findFromEscritura(unitInput).catch(() => null);
  if (fromEscritura && fromEscritura.confidence === 'high') {
    return fromEscritura;
  }

  // 2) Catastro por RC de unidad
  const fromCatastroUnit = await findFromCatastro(unit.referenciaCatastral).catch(() => null);
  if (fromCatastroUnit) {
    // Combinar con escritura si existe (escritura prevalece)
    if (fromEscritura) {
      return {
        ...fromEscritura,
        fields: { ...fromCatastroUnit.fields, ...fromEscritura.fields },
        rawNote: [fromEscritura.rawNote, fromCatastroUnit.rawNote].filter(Boolean).join(' | '),
      };
    }
    return fromCatastroUnit;
  }

  // 3) Catastro por RC del edificio + matching
  const fromCatastroBld = await findFromCatastroBuilding(
    unitInput,
    unit.building?.referenciaCatastral || null
  ).catch(() => null);
  if (fromCatastroBld) {
    if (fromEscritura) {
      return {
        ...fromEscritura,
        fields: { ...fromCatastroBld.fields, ...fromEscritura.fields },
        rawNote: [fromEscritura.rawNote, fromCatastroBld.rawNote].filter(Boolean).join(' | '),
      };
    }
    return fromCatastroBld;
  }

  // Sólo escritura aunque sea low confidence
  if (fromEscritura) return fromEscritura;

  return { source: 'none', confidence: 'low', fields: {}, rawNote: 'Sin datos disponibles' };
}

/**
 * Aplica el resultado del autofill a la BD. Solo actualiza campos que estén
 * vacíos en la unidad (no machaca datos existentes salvo `force`).
 */
export async function applyAutoFillResult(
  unitId: string,
  result: AutoFillResult,
  options: { force?: boolean; updateBuilding?: boolean } = {}
): Promise<{ updatedUnit: number; updatedBuilding: number }> {
  if (!result || result.source === 'none' || Object.keys(result.fields).length === 0) {
    return { updatedUnit: 0, updatedBuilding: 0 };
  }

  const { getPrismaClient } = await import('@/lib/db');
  const prisma = getPrismaClient();

  const current = await prisma.unit.findUnique({
    where: { id: unitId },
    include: { building: { select: { id: true, anoConstructor: true } } },
  });
  if (!current) return { updatedUnit: 0, updatedBuilding: 0 };

  const dataToUpdate: Record<string, any> = {};
  const f = result.fields;

  // Política: si force, machaca; si no, solo rellena valores vacíos / 0
  const isEmptyNum = (v: any) => v === null || v === undefined || v === 0;
  const isEmptyStr = (v: any) => v === null || v === undefined || v === '';

  if (f.superficie && (options.force || isEmptyNum(current.superficie))) {
    dataToUpdate.superficie = f.superficie;
  }
  if (f.superficieUtil && (options.force || isEmptyNum(current.superficieUtil))) {
    dataToUpdate.superficieUtil = f.superficieUtil;
  }
  if (f.habitaciones && (options.force || isEmptyNum(current.habitaciones))) {
    dataToUpdate.habitaciones = f.habitaciones;
  }
  if (f.banos && (options.force || isEmptyNum(current.banos))) {
    dataToUpdate.banos = f.banos;
  }
  if (f.planta !== undefined && (options.force || isEmptyNum(current.planta))) {
    dataToUpdate.planta = f.planta;
  }
  if (f.orientacion && (options.force || isEmptyStr(current.orientacion))) {
    dataToUpdate.orientacion = f.orientacion;
  }
  if (f.referenciaCatastral && (options.force || isEmptyStr(current.referenciaCatastral))) {
    dataToUpdate.referenciaCatastral = f.referenciaCatastral;
  }

  let updatedUnit = 0;
  if (Object.keys(dataToUpdate).length > 0) {
    await prisma.unit.update({ where: { id: unitId }, data: dataToUpdate });
    updatedUnit = Object.keys(dataToUpdate).length;
  }

  // Año de construcción → al edificio
  let updatedBuilding = 0;
  if (
    options.updateBuilding &&
    f.anoConstruccion &&
    current.building &&
    (options.force || !current.building.anoConstructor)
  ) {
    await prisma.building.update({
      where: { id: current.buildingId },
      data: { anoConstructor: f.anoConstruccion },
    });
    updatedBuilding = 1;
  }

  return { updatedUnit, updatedBuilding };
}
