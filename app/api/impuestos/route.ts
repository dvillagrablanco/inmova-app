import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { z } from 'zod';

import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const PROVIDER = 'impuestos';

interface TaxObligation {
  id: string;
  nombre: string;
  tipo: 'iva' | 'irpf' | 'ibi' | 'otros';
  periodo: string;
  vence: string;
  estado: 'pendiente' | 'presentado' | 'pagado' | 'vencido';
  importe: number | null;
  propertyId?: string;
  propertyName?: string;
}

interface TaxProperty {
  id: string;
  nombre: string;
  valorCatastral: number;
  ibi: number;
  ingresos: number;
  gastos: number;
}

const querySchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100),
  status: z.enum(['pendiente', 'presentado', 'pagado', 'all']).optional(),
});

const updateSchema = z.object({
  obligationId: z.string().min(1),
  action: z.enum(['present', 'pay', 'reset']),
  documentUrl: z.string().url().optional(),
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
  updatedAt: z.string().optional(),
});

type StoredObligation = z.infer<typeof storedObligationSchema>;

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
    .filter((result): result is z.SafeParseSuccess<StoredObligation> => result.success)
    .map((result) => result.data);
};

const getCompanyContext = async (
  userId: string,
  role?: string | null,
  companyId?: string | null
) => {
  if (companyId) {
    return { role, companyId };
  }

  const { getPrismaClient } = await import('@/lib/db');
  const prisma = getPrismaClient();
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, companyId: true },
  });

  return {
    role: role ?? user?.role ?? null,
    companyId: companyId ?? user?.companyId ?? null,
  };
};

const mapTipo = (obligacion: StoredObligation): TaxObligation['tipo'] => {
  const candidate = `${obligacion.modelo} ${obligacion.nombre}`.toLowerCase();
  if (candidate.includes('ibi')) return 'ibi';
  if (candidate.includes('iva') || candidate.includes('303') || candidate.includes('390')) {
    return 'iva';
  }
  if (candidate.includes('irpf') || candidate.includes('115') || candidate.includes('100')) {
    return 'irpf';
  }
  return 'otros';
};

// GET - Obtener obligaciones fiscales
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const sessionUser = session?.user as
      | { id?: string; role?: string | null; companyId?: string | null }
      | undefined;

    if (!sessionUser?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { companyId } = await getCompanyContext(
      sessionUser.id,
      sessionUser.role,
      sessionUser.companyId
    );

    if (!companyId) {
      return NextResponse.json({ error: 'CompanyId no disponible' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const parsedQuery = querySchema.parse({
      year: searchParams.get('year') ?? `${new Date().getFullYear()}`,
      status: searchParams.get('status') ?? 'all',
    });

    const { getPrismaClient } = await import('@/lib/db');
    const prisma = getPrismaClient();

    const integration = await prisma.integrationConfig.findUnique({
      where: { companyId_provider: { companyId, provider: PROVIDER } },
      select: { settings: true },
    });

    const storedObligations = extractObligations(integration?.settings);
    let obligations = storedObligations.filter((obligacion) => {
      const matchesYear = obligacion.ejercicio
        ? obligacion.ejercicio === parsedQuery.year
        : true;
      return matchesYear;
    });

    if (parsedQuery.status && parsedQuery.status !== 'all') {
      obligations = obligations.filter(
        (obligacion) => obligacion.estado === parsedQuery.status
      );
    }

    const startDate = new Date(parsedQuery.year, 0, 1);
    const endDate = new Date(parsedQuery.year + 1, 0, 1);

    const [payments, expenses, buildings] = await Promise.all([
      prisma.payment.findMany({
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
        select: {
          monto: true,
          contract: {
            select: {
              unit: {
                select: {
                  buildingId: true,
                },
              },
            },
          },
        },
      }),
      prisma.expense.findMany({
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
        select: {
          monto: true,
          categoria: true,
          buildingId: true,
          unit: { select: { buildingId: true } },
        },
      }),
      prisma.building.findMany({
        where: {
          companyId,
          isDemo: false,
        },
        select: {
          id: true,
          nombre: true,
          direccion: true,
          ibiAnual: true,
        },
      }),
    ]);

    const ingresosTotales = payments.reduce((sum, payment) => sum + payment.monto, 0);
    const gastosTotales = expenses.reduce((sum, expense) => sum + expense.monto, 0);

    const ingresosByBuilding = new Map<string, number>();
    payments.forEach((payment) => {
      const buildingId = payment.contract?.unit?.buildingId;
      if (!buildingId) {
        return;
      }
      ingresosByBuilding.set(
        buildingId,
        (ingresosByBuilding.get(buildingId) ?? 0) + payment.monto
      );
    });

    const gastosByBuilding = new Map<string, number>();
    const taxByBuilding = new Map<string, number>();
    expenses.forEach((expense) => {
      const buildingId = expense.buildingId ?? expense.unit?.buildingId;
      if (!buildingId) {
        return;
      }
      gastosByBuilding.set(
        buildingId,
        (gastosByBuilding.get(buildingId) ?? 0) + expense.monto
      );
      if (expense.categoria === 'impuestos') {
        taxByBuilding.set(
          buildingId,
          (taxByBuilding.get(buildingId) ?? 0) + expense.monto
        );
      }
    });

    const impuestoEstimado = obligations.reduce(
      (sum, obligation) => sum + (obligation.importe ?? 0),
      0
    );
    const retencionesAplicadas = 0;
    const resumenAnual = {
      ingresosBrutos: ingresosTotales,
      gastosDeducibles: gastosTotales,
      baseImponible: ingresosTotales - gastosTotales,
      impuestoEstimado,
      retencionesAplicadas,
      aPagar: impuestoEstimado - retencionesAplicadas,
    };

    const properties: TaxProperty[] = buildings.map((building) => ({
      id: building.id,
      nombre: building.nombre || building.direccion,
      valorCatastral: 0,
      ibi: building.ibiAnual ?? (taxByBuilding.get(building.id) ?? 0),
      ingresos: ingresosByBuilding.get(building.id) ?? 0,
      gastos: gastosByBuilding.get(building.id) ?? 0,
    }));

    const obligationsResponse: TaxObligation[] = obligations.map((obligacion) => ({
      id: obligacion.id,
      nombre: obligacion.nombre,
      tipo: mapTipo(obligacion),
      periodo: obligacion.periodicidad || `${obligacion.ejercicio ?? parsedQuery.year}`,
      vence: obligacion.fechaLimite,
      estado: obligacion.estado,
      importe: obligacion.importe ?? null,
    }));

    const stats = {
      total: obligationsResponse.length,
      pendientes: obligationsResponse.filter((o) => o.estado === 'pendiente').length,
      presentados: obligationsResponse.filter((o) => o.estado === 'presentado').length,
      pagados: obligationsResponse.filter((o) => o.estado === 'pagado').length,
      importePendiente: obligationsResponse
        .filter((o) => o.estado === 'pendiente')
        .reduce((sum, o) => sum + (o.importe ?? 0), 0),
    };

    return NextResponse.json({
      success: true,
      data: {
        obligations: obligationsResponse,
        properties,
        resumenAnual,
      },
      stats,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    logger.error('[API Impuestos] Error:', { message });
    return NextResponse.json(
      { error: 'Error al obtener datos fiscales' },
      { status: 500 }
    );
  }
}

// POST - Registrar presentación/pago de obligación
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const sessionUser = session?.user as
      | { id?: string; role?: string | null; companyId?: string | null }
      | undefined;

    if (!sessionUser?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { companyId } = await getCompanyContext(
      sessionUser.id,
      sessionUser.role,
      sessionUser.companyId
    );

    if (!companyId) {
      return NextResponse.json({ error: 'CompanyId no disponible' }, { status: 400 });
    }

    const body = updateSchema.parse(await request.json());
    const newStatus =
      body.action === 'present'
        ? 'presentado'
        : body.action === 'pay'
          ? 'pagado'
          : 'pendiente';

    const { getPrismaClient } = await import('@/lib/db');
    const prisma = getPrismaClient();
    const integration = await prisma.integrationConfig.findUnique({
      where: { companyId_provider: { companyId, provider: PROVIDER } },
      select: { credentials: true, settings: true },
    });

    const existingObligations = extractObligations(integration?.settings);
    const targetIndex = existingObligations.findIndex(
      (obligacion) => obligacion.id === body.obligationId
    );

    if (targetIndex === -1) {
      return NextResponse.json(
        { error: 'Obligación no encontrada' },
        { status: 404 }
      );
    }

    const now = new Date();
    const updatedObligations = existingObligations.map((obligacion) =>
      obligacion.id === body.obligationId
        ? {
            ...obligacion,
            estado: newStatus,
            documentUrl: body.documentUrl ?? obligacion.documentUrl,
            updatedAt: now.toISOString(),
          }
        : obligacion
    );

    const baseSettings = toObjectRecord(integration?.settings);
    const nextSettings = { ...baseSettings, obligaciones: updatedObligations };

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
        lastSyncAt: now,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: body.obligationId,
        status: newStatus,
        updatedAt: now.toISOString(),
      },
      message:
        body.action === 'present'
          ? 'Obligación presentada correctamente'
          : body.action === 'pay'
            ? 'Obligación pagada correctamente'
            : 'Obligación actualizada correctamente',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    logger.error('[API Impuestos] Error POST:', { message });
    return NextResponse.json(
      { error: 'Error al actualizar obligación' },
      { status: 500 }
    );
  }
}
