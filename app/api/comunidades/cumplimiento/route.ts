import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { z } from 'zod';

import logger from '@/lib/logger';
export const dynamic = 'force-dynamic';

const createDocumentoSchema = z.object({
  buildingId: z.string().min(1),
  tipo: z.enum(['cee', 'ite', 'cedula_habitabilidad', 'seguro', 'licencia', 'modelo_fiscal', 'otro']),
  nombre: z.string().min(1),
  fechaEmision: z.string().datetime().optional(),
  fechaVencimiento: z.string().datetime().optional(),
  estado: z.enum(['vigente', 'por_vencer', 'vencido', 'en_tramite']).default('vigente'),
  documentoUrl: z.string().optional(),
  notas: z.string().optional(),
});

// GET - Listar documentos de cumplimiento
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const buildingId = searchParams.get('buildingId');
    const comunidadId = searchParams.get('comunidadId');
    const tipo = searchParams.get('tipo');

    const companyId = (session.user as any).companyId;

    // Obtener buildingId si se proporciona comunidadId
    let targetBuildingId = buildingId;
    if (comunidadId && !buildingId) {
      const comunidad = await prisma.communityManagement.findFirst({
        where: { id: comunidadId, companyId },
        select: { buildingId: true },
      });
      targetBuildingId = comunidad?.buildingId || null;
    }

    // Obtener edificios para el cumplimiento
    const buildings = await prisma.building.findMany({
      where: {
        companyId,
        ...(targetBuildingId && { id: targetBuildingId }),
      },
      select: {
        id: true,
        name: true,
        address: true,
        yearBuilt: true,
        totalUnits: true,
      },
    });

    const buildingIds = buildings.map((building) => building.id);
    const now = new Date();
    const warningMs = 30 * 24 * 60 * 60 * 1000;

    const insurances = buildingIds.length
      ? await prisma.insurance.findMany({
          where: {
            companyId,
            OR: [
              { buildingId: { in: buildingIds } },
              { unit: { buildingId: { in: buildingIds } } },
            ],
          },
          select: {
            id: true,
            buildingId: true,
            fechaVencimiento: true,
            estado: true,
            unit: { select: { buildingId: true } },
          },
        })
      : [];

    const insuranceByBuilding = new Map<
      string,
      Array<{ estado: string; fechaVencimiento: string | null }>
    >();

    const getInsuranceComplianceStatus = (insurance: {
      fechaVencimiento: Date;
      estado: string;
    }) => {
      const expiry = insurance.fechaVencimiento ? new Date(insurance.fechaVencimiento) : null;
      const expiryMs = expiry ? expiry.getTime() : null;
      const isExpired = expiryMs !== null && expiryMs < now.getTime();
      const isExpiringSoon =
        expiryMs !== null &&
        expiryMs >= now.getTime() &&
        expiryMs - now.getTime() <= warningMs;

      if (insurance.estado === 'cancelada') {
        return { estado: 'vencido', fechaVencimiento: expiry?.toISOString() || null };
      }

      if (insurance.estado === 'vencida') {
        return { estado: 'vencido', fechaVencimiento: expiry?.toISOString() || null };
      }

      if (insurance.estado === 'pendiente_renovacion') {
        return {
          estado: isExpired ? 'vencido' : 'por_vencer',
          fechaVencimiento: expiry?.toISOString() || null,
        };
      }

      if (isExpired) {
        return { estado: 'vencido', fechaVencimiento: expiry?.toISOString() || null };
      }

      if (isExpiringSoon) {
        return { estado: 'por_vencer', fechaVencimiento: expiry?.toISOString() || null };
      }

      return { estado: 'vigente', fechaVencimiento: expiry?.toISOString() || null };
    };

    for (const insurance of insurances) {
      const resolvedBuildingId = insurance.buildingId || insurance.unit?.buildingId;
      if (!resolvedBuildingId) continue;
      const normalized = getInsuranceComplianceStatus(insurance);
      const list = insuranceByBuilding.get(resolvedBuildingId) || [];
      list.push(normalized);
      insuranceByBuilding.set(resolvedBuildingId, list);
    }

    const pickBestInsuranceStatus = (
      entries: Array<{ estado: string; fechaVencimiento: string | null }>
    ) => {
      const priority = ['vigente', 'por_vencer', 'vencido', 'pendiente'];
      const bestStatus = priority.find((status) => entries.some((e) => e.estado === status)) || 'pendiente';
      const relevant = entries.filter((entry) => entry.estado === bestStatus);
      const nearest = relevant.reduce<string | null>((acc, entry) => {
        if (!entry.fechaVencimiento) return acc;
        if (!acc) return entry.fechaVencimiento;
        return new Date(entry.fechaVencimiento) < new Date(acc) ? entry.fechaVencimiento : acc;
      }, null);
      return { estado: bestStatus, fechaVencimiento: nearest };
    };

    // Calcular estado de cumplimiento por edificio
    const cumplimiento = buildings.map((building) => {
      const añoConstruccion = building.yearBuilt || 2000;
      const antiguedad = new Date().getFullYear() - añoConstruccion;
      
      // ITE obligatoria para edificios >50 años
      const requiereITE = antiguedad >= 50;
      // CEE obligatoria para alquiler/venta
      const requiereCEE = true;
      // Seguro obligatorio
      const requiereSeguro = true;
      const buildingInsurances = insuranceByBuilding.get(building.id) || [];
      const seguroStatus = buildingInsurances.length
        ? pickBestInsuranceStatus(buildingInsurances)
        : { estado: 'pendiente', fechaVencimiento: null };

      return {
        ...building,
        antiguedad,
        documentos: {
          ite: {
            requerido: requiereITE,
            estado: requiereITE ? 'pendiente' : 'no_aplica',
            fechaVencimiento: null,
          },
          cee: {
            requerido: requiereCEE,
            estado: 'pendiente',
            fechaVencimiento: null,
          },
          seguro: {
            requerido: requiereSeguro,
            estado: requiereSeguro ? seguroStatus.estado : 'no_aplica',
            fechaVencimiento: seguroStatus.fechaVencimiento,
          },
          cedulaHabitabilidad: {
            requerido: true,
            estado: 'pendiente',
            fechaVencimiento: null,
          },
        },
      };
    });

    // Estadísticas generales
    const stats = cumplimiento.reduce(
      (acc, building) => {
        acc.totalEdificios += 1;
        if (building.documentos.ite.requerido) acc.requierenITE += 1;

        const documentos = Object.values(building.documentos);
        documentos.forEach((doc) => {
          if (doc.requerido && ['pendiente', 'vencido', 'por_vencer', 'en_tramite'].includes(doc.estado)) {
            acc.documentosPendientes += 1;
          }

          if (doc.fechaVencimiento) {
            const date = new Date(doc.fechaVencimiento);
            if (date.getTime() >= now.getTime() && date.getTime() - now.getTime() <= warningMs) {
              acc.proximosVencimientos += 1;
            }
          }
        });

        return acc;
      },
      {
        totalEdificios: 0,
        requierenITE: 0,
        documentosPendientes: 0,
        proximosVencimientos: 0,
      }
    );

    return NextResponse.json({
      cumplimiento,
      stats,
    });
  } catch (error: any) {
    logger.error('[Cumplimiento GET Error]:', error);
    return NextResponse.json(
      { error: 'Error obteniendo cumplimiento', details: error.message },
      { status: 500 }
    );
  }
}

// POST - Registrar documento de cumplimiento
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const companyId = (session.user as any).companyId;
    const body = await request.json();
    const validated = createDocumentoSchema.parse(body);

    // Verificar que el edificio existe
    const building = await prisma.building.findFirst({
      where: { id: validated.buildingId, companyId },
    });

    if (!building) {
      return NextResponse.json({ error: 'Edificio no encontrado' }, { status: 404 });
    }

    // Por ahora retornamos éxito (el modelo específico de documentos de cumplimiento
    // se puede crear cuando sea necesario)
    return NextResponse.json({
      message: 'Documento registrado correctamente',
      documento: {
        id: `doc_${Date.now()}`,
        ...validated,
        buildingName: building.name,
      },
    }, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }
    logger.error('[Cumplimiento POST Error]:', error);
    return NextResponse.json(
      { error: 'Error registrando documento', details: error.message },
      { status: 500 }
    );
  }
}
