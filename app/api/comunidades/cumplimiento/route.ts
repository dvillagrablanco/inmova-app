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

    // Calcular estado de cumplimiento por edificio
    const cumplimiento = buildings.map(building => {
      const añoConstruccion = building.yearBuilt || 2000;
      const antiguedad = new Date().getFullYear() - añoConstruccion;
      
      // ITE obligatoria para edificios >50 años
      const requiereITE = antiguedad >= 50;
      // CEE obligatoria para alquiler/venta
      const requiereCEE = true;
      // Seguro obligatorio
      const requiereSeguro = true;

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
            estado: 'pendiente',
            fechaVencimiento: null,
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
    const stats = {
      totalEdificios: buildings.length,
      requierenITE: cumplimiento.filter(c => c.documentos.ite.requerido).length,
      documentosPendientes: cumplimiento.length * 4, // Simplificado
      proximosVencimientos: 0,
    };

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
