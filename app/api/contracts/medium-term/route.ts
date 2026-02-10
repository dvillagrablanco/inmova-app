/**
 * API: CONTRATOS DE MEDIA ESTANCIA
 * 
 * Endpoints específicos para gestión de alquileres a media estancia (1-11 meses)
 * Cumple con LAU Art. 3.2 (arrendamiento por temporada)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import {
  contratoMediaEstanciaSchema,
  calcularFianzaRequerida,
  validarDuracionPorTipo,
  validarMotivoYDuracion,
  CONFIG_MEDIA_ESTANCIA,
} from '@/lib/validations/medium-term-rental';
import {
  crearContratoMediaEstancia,
  calcularProrrateo,
  generarResumenProrrateo,
  validarContratoMediaEstancia,
  getEstadisticasMediaEstancia,
} from '@/lib/medium-term-rental-service';
import { differenceInMonths } from 'date-fns';
import { z } from 'zod';

import logger from '@/lib/logger';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET: Listar contratos de media estancia
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Resolver companyId con soporte multi-empresa (cookie > JWT)
    const cookieCompanyId = request.cookies.get('activeCompanyId')?.value;
    const __resolvedCompanyId = cookieCompanyId || session.user.companyId;
    if (!__resolvedCompanyId) {
      return NextResponse.json({ error: 'Empresa no definida' }, { status: 400 });
    }
    // Inyectar companyId resuelto en session para compatibilidad
    (session.user as any).companyId = __resolvedCompanyId;, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const estado = searchParams.get('estado');
    const motivo = searchParams.get('motivo');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Construir filtros
    const where: any = {
      unit: { building: { companyId: session.user.companyId } },
      tipoArrendamiento: 'temporada',
    };

    if (estado) {
      where.estado = estado;
    }

    if (motivo) {
      where.motivoTemporalidad = motivo;
    }

    // Obtener contratos
    const [contratos, total] = await Promise.all([
      prisma.contract.findMany({
        where,
        include: {
          unit: {
            include: { building: true },
          },
          tenant: {
            select: {
              id: true,
              nombreCompleto: true,
              email: true,
              telefono: true,
            },
          },
        },
        orderBy: { fechaInicio: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.contract.count({ where }),
    ]);

    // Obtener estadísticas
    const estadisticas = await getEstadisticasMediaEstancia(session.user.companyId);

    const formattedContratos = contratos.map((contrato) => ({
      ...contrato,
      tenant: contrato.tenant
        ? {
            ...contrato.tenant,
            nombre: contrato.tenant.nombreCompleto,
          }
        : null,
    }));

    return NextResponse.json({
      success: true,
      data: formattedContratos,
      estadisticas,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    logger.error('[API Error] GET /api/contracts/medium-term:', error);
    return NextResponse.json(
      { error: 'Error obteniendo contratos de media estancia' },
      { status: 500 }
    );
  }
}

/**
 * POST: Crear contrato de media estancia
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json();

    // Validar con Zod
    const validatedData = contratoMediaEstanciaSchema.parse(body);

    // Verificar que la unidad pertenece a la empresa
    const unit = await prisma.unit.findFirst({
      where: {
        id: validatedData.unitId,
        building: { companyId: session.user.companyId },
      },
      include: { building: true },
    });

    if (!unit) {
      return NextResponse.json(
        { error: 'Unidad no encontrada o no pertenece a su empresa' },
        { status: 404 }
      );
    }

    // Verificar que el inquilino existe y pertenece a la empresa
    const tenant = await prisma.tenant.findFirst({
      where: {
        id: validatedData.tenantId,
        companyId: session.user.companyId,
      },
    });

    if (!tenant) {
      return NextResponse.json(
        { error: 'Inquilino no encontrado o no pertenece a su empresa' },
        { status: 404 }
      );
    }

    // Verificar que la unidad no tiene contratos activos que se solapen
    const contratosExistentes = await prisma.contract.findMany({
      where: {
        unitId: validatedData.unitId,
        estado: 'activo',
        OR: [
          {
            fechaInicio: { lte: validatedData.fechaFin },
            fechaFin: { gte: validatedData.fechaInicio },
          },
        ],
      },
    });

    if (contratosExistentes.length > 0) {
      return NextResponse.json(
        { 
          error: 'La unidad tiene contratos activos que se solapan con las fechas seleccionadas',
          contratosExistentes: contratosExistentes.map(c => ({
            id: c.id,
            fechaInicio: c.fechaInicio,
            fechaFin: c.fechaFin,
          })),
        },
        { status: 409 }
      );
    }

    // Crear el contrato usando el servicio
    const resultado = await crearContratoMediaEstancia(session.user.companyId, {
      unitId: validatedData.unitId,
      tenantId: validatedData.tenantId,
      fechaInicio: validatedData.fechaInicio,
      fechaFin: validatedData.fechaFin,
      rentaMensual: validatedData.rentaMensual,
      tipoArrendamiento: validatedData.tipoArrendamiento,
      motivoTemporalidad: validatedData.motivoTemporalidad,
      descripcionMotivo: validatedData.descripcionMotivo,
      serviciosIncluidos: validatedData.serviciosIncluidos,
      depositoSuministros: validatedData.depositoSuministros,
      prorrateable: validatedData.prorrateable,
      penalizacionDesistimiento: validatedData.penalizacionDesistimiento,
      diasPreaviso: validatedData.diasPreaviso,
    });

    return NextResponse.json({
      success: true,
      data: resultado.contrato,
      validacion: resultado.validacion,
      prorrateo: {
        ...resultado.prorrateo,
        resumen: generarResumenProrrateo(resultado.prorrateo),
      },
      message: 'Contrato de media estancia creado correctamente',
    }, { status: 201 });

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Datos de contrato inválidos',
          detalles: error.errors.map(e => ({
            campo: e.path.join('.'),
            mensaje: e.message,
          })),
        },
        { status: 400 }
      );
    }

    logger.error('[API Error] POST /api/contracts/medium-term:', error);
    return NextResponse.json(
      { error: error.message || 'Error creando contrato de media estancia' },
      { status: 500 }
    );
  }
}
