import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { z } from 'zod';
import crypto from 'crypto';

import logger from '@/lib/logger';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const PROVIDER = 'impuestos';

const querySchema = z.object({
  ejercicio: z.coerce.number().int().min(2000).max(2100),
  tipoPersona: z.enum(['fisica', 'juridica']),
});

const createObligationSchema = z.object({
  modelo: z.string().min(1),
  fechaLimite: z.string().min(1),
  importe: z.coerce.number().optional().nullable(),
  observaciones: z.string().optional().nullable(),
  ejercicio: z.coerce.number().int().optional(),
  tipoPersona: z.enum(['fisica', 'juridica', 'ambos']).optional(),
  nombre: z.string().optional(),
  periodicidad: z.string().optional(),
});

const storedObligationSchema = z.object({
  id: z.string(),
  modelo: z.string(),
  nombre: z.string(),
  periodicidad: z.string(),
  fechaLimite: z.string(),
  estado: z.enum(['pendiente', 'presentado', 'pagado', 'vencido']),
  importe: z.number().nullable(),
  observaciones: z.string().optional(),
  ejercicio: z.number().int().optional(),
  tipoPersona: z.enum(['fisica', 'juridica', 'ambos']).optional(),
  createdAt: z.string().optional(),
  createdBy: z.string().optional(),
  documentUrl: z.string().optional(),
});

type StoredObligation = z.infer<typeof storedObligationSchema>;

const MODEL_METADATA: Record<
  string,
  { nombre: string; periodicidad: string; tipoPersona: 'fisica' | 'juridica' | 'ambos' }
> = {
  '100': {
    nombre: 'IRPF - Declaración anual',
    periodicidad: 'Anual',
    tipoPersona: 'fisica',
  },
  '115': {
    nombre: 'Retenciones alquiler',
    periodicidad: 'Trimestral',
    tipoPersona: 'juridica',
  },
  '200': {
    nombre: 'Impuesto de Sociedades',
    periodicidad: 'Anual',
    tipoPersona: 'juridica',
  },
  '303': {
    nombre: 'IVA - Autoliquidación',
    periodicidad: 'Trimestral',
    tipoPersona: 'ambos',
  },
  '347': {
    nombre: 'Operaciones con terceros',
    periodicidad: 'Anual',
    tipoPersona: 'ambos',
  },
  '390': {
    nombre: 'IVA - Resumen anual',
    periodicidad: 'Anual',
    tipoPersona: 'ambos',
  },
};

const toObjectRecord = (value: unknown): Record<string, unknown> => {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
};

const extractObligations = (settings: unknown): StoredObligation[] => {
  const settingsObject = toObjectRecord(settings);
  const obligacionesValue = settingsObject.obligaciones;

  if (!Array.isArray(obligacionesValue)) {
    return [];
  }

  return obligacionesValue
    .map((item) => storedObligationSchema.safeParse(item))
    .filter(
      (result): result is { success: true; data: StoredObligation } => result.success
    )
    .map((result) => result.data);
};

const getCompanyContext = async (
  userId: string,
  role?: string | null,
  companyId?: string | null
) => {
  const prisma = await getPrisma();
  if (role && companyId) {
    return { role, companyId };
  }
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, companyId: true },
  });

  return {
    role: role ?? user?.role ?? null,
    companyId: companyId ?? user?.companyId ?? null,
  };
};

const getModelMetadata = (modelo: string) => MODEL_METADATA[modelo];

/**
 * GET /api/admin/impuestos/resumen
 * Obtiene el resumen fiscal y obligaciones tributarias
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const sessionUser = session?.user as
      | { id?: string; role?: string | null; companyId?: string | null }
      | undefined;

    if (!sessionUser?.id) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { role, companyId } = await getCompanyContext(
      sessionUser.id,
      sessionUser.role,
      sessionUser.companyId
    );

    if (!role || !['super_admin', 'administrador'].includes(role)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    if (!companyId) {
      return NextResponse.json({ error: 'CompanyId no disponible' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const parsedQuery = querySchema.parse({
      ejercicio: searchParams.get('ejercicio') ?? `${new Date().getFullYear()}`,
      tipoPersona: searchParams.get('tipoPersona') ?? 'fisica',
    });

    const integration = await prisma.integrationConfig.findUnique({
      where: { companyId_provider: { companyId, provider: PROVIDER } },
      select: { settings: true },
    });

    const storedObligations = extractObligations(integration?.settings);
    const obligaciones = storedObligations.filter((obligacion) => {
      const matchesEjercicio = obligacion.ejercicio
        ? obligacion.ejercicio === parsedQuery.ejercicio
        : true;
      const tipo = obligacion.tipoPersona ?? 'ambos';
      const matchesTipo = tipo === 'ambos' || tipo === parsedQuery.tipoPersona;
      return matchesEjercicio && matchesTipo;
    });

    const startDate = new Date(parsedQuery.ejercicio, 0, 1);
    const endDate = new Date(parsedQuery.ejercicio + 1, 0, 1);

    const [paymentsAggregate, expensesAggregate, buildings, taxExpenses] =
      await Promise.all([
        prisma.payment.aggregate({
          _sum: { monto: true },
          where: {
            estado: 'pagado',
            isDemo: false,
            contract: {
              isDemo: false,
              unit: {
                building: {
                  companyId,
                  isDemo: false,
                },
              },
            },
            OR: [
              {
                fechaPago: {
                  gte: startDate,
                  lt: endDate,
                },
              },
              {
                fechaPago: null,
                fechaVencimiento: {
                  gte: startDate,
                  lt: endDate,
                },
              },
            ],
          },
        }),
        prisma.expense.aggregate({
          _sum: { monto: true },
          where: {
            fecha: {
              gte: startDate,
              lt: endDate,
            },
            isDemo: false,
            OR: [
              {
                building: {
                  companyId,
                  isDemo: false,
                },
              },
              {
                unit: {
                  building: {
                    companyId,
                    isDemo: false,
                  },
                },
              },
            ],
          },
        }),
        prisma.building.findMany({
          where: {
            companyId,
            isDemo: false,
          },
          select: {
            id: true,
            direccion: true,
            ibiAnual: true,
          },
        }),
        prisma.expense.findMany({
          where: {
            categoria: 'impuestos',
            fecha: {
              gte: startDate,
              lt: endDate,
            },
            isDemo: false,
            OR: [
              {
                building: {
                  companyId,
                  isDemo: false,
                },
              },
              {
                unit: {
                  building: {
                    companyId,
                    isDemo: false,
                  },
                },
              },
            ],
          },
          select: {
            buildingId: true,
            fecha: true,
            monto: true,
            unit: {
              select: { buildingId: true },
            },
          },
        }),
      ]);

    const ingresosTotales = paymentsAggregate._sum.monto ?? 0;
    const gastosTotales = expensesAggregate._sum.monto ?? 0;
    const baseImponible = ingresosTotales - gastosTotales;

    const impuestoEstimado = obligaciones.reduce(
      (sum, obligacion) => sum + (obligacion.importe ?? 0),
      0
    );
    const pagosCuenta = obligaciones
      .filter((obligacion) => obligacion.estado === 'pagado')
      .reduce((sum, obligacion) => sum + (obligacion.importe ?? 0), 0);
    const pendientePago = Math.max(impuestoEstimado - pagosCuenta, 0);

    const proximaObligacion = obligaciones
      .filter((obligacion) => obligacion.estado !== 'pagado')
      .filter((obligacion) => !Number.isNaN(Date.parse(obligacion.fechaLimite)))
      .sort(
        (a, b) =>
          Date.parse(a.fechaLimite) - Date.parse(b.fechaLimite)
      )[0];

    const expensesByBuilding = new Map<
      string,
      { total: number; latest: Date | null }
    >();
    taxExpenses.forEach((expense) => {
      const buildingId = expense.buildingId ?? expense.unit?.buildingId;
      if (!buildingId) {
        return;
      }
      const entry = expensesByBuilding.get(buildingId) ?? {
        total: 0,
        latest: null,
      };
      const latest =
        !entry.latest || expense.fecha > entry.latest ? expense.fecha : entry.latest;
      expensesByBuilding.set(buildingId, {
        total: entry.total + expense.monto,
        latest,
      });
    });

    const propiedadesIBI = buildings.flatMap((building) => {
      const entry = expensesByBuilding.get(building.id);
      if (!entry?.latest) {
        return [];
      }
      const ibiAnual = building.ibiAnual ?? entry.total;
      return [
        {
          id: building.id,
          direccion: building.direccion,
          referenciaCatastral: building.id,
          valorCatastral: 0,
          ibiAnual,
          fechaPago: entry.latest.toISOString(),
          estado: 'pagado' as const,
        },
      ];
    });

    const hasData =
      ingresosTotales > 0 ||
      gastosTotales > 0 ||
      obligaciones.length > 0 ||
      propiedadesIBI.length > 0;

    const resumenFiscal = hasData
      ? {
          ejercicio: parsedQuery.ejercicio,
          tipoPersona: parsedQuery.tipoPersona,
          ingresosTotales,
          gastosTotales,
          baseImponible,
          impuestoEstimado,
          pagosCuenta,
          pendientePago,
          proximaFecha: proximaObligacion?.fechaLimite ?? null,
          proximoModelo: proximaObligacion?.modelo ?? null,
        }
      : null;

    return NextResponse.json({
      success: true,
      ejercicio: parsedQuery.ejercicio,
      tipoPersona: parsedQuery.tipoPersona,
      resumenFiscal,
      obligaciones,
      propiedadesIBI,
      message: hasData
        ? undefined
        : 'No hay datos fiscales registrados para este ejercicio. Añade tus obligaciones tributarias.',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    logger.error('[Impuestos Resumen Error]:', { message });
    return NextResponse.json(
      { error: 'Error al obtener resumen fiscal' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/impuestos/resumen
 * Registrar una nueva obligación fiscal
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const sessionUser = session?.user as
      | { id?: string; role?: string | null; companyId?: string | null }
      | undefined;

    if (!sessionUser?.id) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { role, companyId } = await getCompanyContext(
      sessionUser.id,
      sessionUser.role,
      sessionUser.companyId
    );

    if (!role || !['super_admin', 'administrador'].includes(role)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    if (!companyId) {
      return NextResponse.json({ error: 'CompanyId no disponible' }, { status: 400 });
    }

    const body = createObligationSchema.parse(await request.json());
    const metadata = getModelMetadata(body.modelo);
    const now = new Date();

    const nuevaObligacion: StoredObligation = {
      id: crypto.randomUUID(),
      modelo: body.modelo,
      nombre: body.nombre ?? metadata?.nombre ?? `Modelo ${body.modelo}`,
      periodicidad: body.periodicidad ?? metadata?.periodicidad ?? 'Sin especificar',
      fechaLimite: body.fechaLimite,
      estado: 'pendiente',
      importe: body.importe ?? null,
      observaciones: body.observaciones ?? undefined,
      ejercicio: body.ejercicio ?? now.getFullYear(),
      tipoPersona: body.tipoPersona ?? metadata?.tipoPersona ?? 'ambos',
      createdAt: now.toISOString(),
      createdBy: sessionUser.id,
    };
    const integration = await prisma.integrationConfig.findUnique({
      where: { companyId_provider: { companyId, provider: PROVIDER } },
      select: { credentials: true, settings: true },
    });

    const existingObligations = extractObligations(integration?.settings);
    const nextObligations = [...existingObligations, nuevaObligacion];
    const baseSettings = toObjectRecord(integration?.settings);
    const nextSettings = { ...baseSettings, obligaciones: nextObligations };

    await prisma.integrationConfig.upsert({
      where: { companyId_provider: { companyId, provider: PROVIDER } },
      create: {
        companyId,
        provider: PROVIDER,
        name: 'Impuestos',
        category: 'accounting',
        credentials: integration?.credentials ?? {},
        settings: nextSettings,
        enabled: true,
        isConfigured: true,
        createdBy: sessionUser.id,
        lastSyncAt: now,
      },
      update: {
        settings: nextSettings,
        enabled: true,
        isConfigured: true,
        lastSyncAt: now,
      },
    });

    return NextResponse.json(
      {
        success: true,
        obligacion: nuevaObligacion,
        message: 'Obligación fiscal registrada correctamente',
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    logger.error('[Impuestos Create Obligacion Error]:', { message });
    return NextResponse.json(
      { error: 'Error al registrar obligación fiscal' },
      { status: 500 }
    );
  }
}
