import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { randomUUID } from 'crypto';
import { z } from 'zod';
import { authOptions } from '@/lib/auth-options';
import { getPrismaClient } from '@/lib/db';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface VerificationRequest {
  id: string;
  tenantName: string;
  tenantEmail: string;
  tenantPhone: string;
  propertyName: string;
  requestDate: string;
  status: 'pending' | 'in_progress' | 'completed' | 'rejected';
  score?: number;
  checks: {
    identity: 'pending' | 'verified' | 'failed';
    credit: 'pending' | 'verified' | 'warning' | 'failed';
    employment: 'pending' | 'verified' | 'failed';
    references: 'pending' | 'verified' | 'failed';
    background: 'pending' | 'clear' | 'issues';
  };
  documents: string[];
  notes?: string;
}

const PROVIDER = 'verificacion_inquilinos';

const storedRequestSchema = z.object({
  id: z.string(),
  tenantName: z.string(),
  tenantEmail: z.string(),
  tenantPhone: z.string(),
  propertyName: z.string(),
  requestDate: z.string(),
  status: z.enum(['pending', 'in_progress', 'completed', 'rejected']),
  score: z.number().optional(),
  checks: z.object({
    identity: z.enum(['pending', 'verified', 'failed']),
    credit: z.enum(['pending', 'verified', 'warning', 'failed']),
    employment: z.enum(['pending', 'verified', 'failed']),
    references: z.enum(['pending', 'verified', 'failed']),
    background: z.enum(['pending', 'clear', 'issues']),
  }),
  documents: z.array(z.string()),
  notes: z.string().optional(),
});

const createSchema = z.object({
  tenantName: z.string().min(1),
  tenantEmail: z.string().email(),
  tenantPhone: z.string().optional(),
  propertyId: z.string().optional(),
});

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Error desconocido';
}

// GET - Obtener verificaciones de inquilinos
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
    const status = searchParams.get('status');

    const prisma = getPrismaClient();
    const companyId = session.user.companyId;

    const config = await prisma.integrationConfig.findUnique({
      where: {
        companyId_provider: { companyId, provider: PROVIDER },
      },
      select: { settings: true },
    });

    const storedRequestsResult = z.array(storedRequestSchema).safeParse(config?.settings?.requests ?? []);
    const storedRequests = storedRequestsResult.success ? storedRequestsResult.data : [];

    const tenants = await prisma.tenant.findMany({
      where: {
        companyId,
        isDemo: false,
      },
      select: {
        id: true,
        nombreCompleto: true,
        email: true,
        telefono: true,
        dni: true,
        scoring: true,
        nivelRiesgo: true,
        createdAt: true,
        contracts: {
          select: {
            unit: {
              select: {
                numero: true,
                building: {
                  select: { nombre: true },
                },
              },
            },
          },
          take: 1,
        },
      },
      take: 50,
      orderBy: { createdAt: 'desc' },
    });

    const tenantRequests: VerificationRequest[] = tenants.map((tenant) => {
      const contract = tenant.contracts?.[0];
      const propertyName = contract
        ? `${contract.unit?.building?.nombre || 'Edificio'} - ${contract.unit?.numero || 'Unidad'}`
        : 'Sin asignar';

      let verificationStatus: VerificationRequest['status'] = 'pending';
      if (tenant.scoring >= 70) {
        verificationStatus = 'completed';
      } else if (tenant.scoring >= 40 || tenant.dni) {
        verificationStatus = 'in_progress';
      }

      return {
        id: tenant.id,
        tenantName: tenant.nombreCompleto || 'Sin nombre',
        tenantEmail: tenant.email || '',
        tenantPhone: tenant.telefono || '',
        propertyName,
        requestDate: tenant.createdAt.toISOString().split('T')[0],
        status: verificationStatus,
        score: tenant.scoring || undefined,
        checks: {
          identity: tenant.dni ? 'verified' : 'pending',
          credit: tenant.scoring >= 60 ? 'verified' : tenant.scoring >= 40 ? 'warning' : 'pending',
          employment: tenant.scoring >= 50 ? 'verified' : 'pending',
          references: tenant.scoring >= 70 ? 'verified' : 'pending',
          background:
            tenant.nivelRiesgo === 'bajo'
              ? 'clear'
              : tenant.nivelRiesgo === 'alto' || tenant.nivelRiesgo === 'critico'
                ? 'issues'
                : 'pending',
        },
        documents: tenant.dni ? ['DNI'] : [],
      };
    });

    let verifications: VerificationRequest[] = [...storedRequests, ...tenantRequests];

    // Filtrar por estado si se proporciona
    if (status && status !== 'all') {
      verifications = verifications.filter((verification) => verification.status === status);
    }

    // Calcular estadísticas
    const stats = {
      total: verifications.length,
      pending: verifications.filter((verification) => verification.status === 'pending').length,
      inProgress: verifications.filter((verification) => verification.status === 'in_progress').length,
      completed: verifications.filter((verification) => verification.status === 'completed').length,
      avgScore: Math.round(
        verifications.filter((verification) => verification.score).reduce((sum, verification) => sum + (verification.score || 0), 0) /
        (verifications.filter((verification) => verification.score).length || 1)
      ),
    };

    return NextResponse.json({
      success: true,
      data: verifications,
      stats,
    });
  } catch (error: unknown) {
    logger.error('[API Verificación] Error:', error);
    return NextResponse.json(
      { error: 'Error al obtener verificaciones', details: getErrorMessage(error) },
      { status: 500 }
    );
  }
}

// POST - Iniciar nueva verificación
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const prisma = getPrismaClient();
    const data = createSchema.parse(await request.json());

    let propertyName = 'Por asignar';
    if (data.propertyId) {
      const building = await prisma.building.findFirst({
        where: { id: data.propertyId, companyId: session.user.companyId },
        select: { nombre: true, direccion: true },
      });
      if (building) {
        propertyName = building.nombre || building.direccion || propertyName;
      }
    }

    const newVerification: VerificationRequest = {
      id: randomUUID(),
      tenantName: data.tenantName,
      tenantEmail: data.tenantEmail,
      tenantPhone: data.tenantPhone || '',
      propertyName,
      requestDate: new Date().toISOString().split('T')[0],
      status: 'pending',
      checks: {
        identity: 'pending',
        credit: 'pending',
        employment: 'pending',
        references: 'pending',
        background: 'pending',
      },
      documents: [],
    };

    const config = await prisma.integrationConfig.findUnique({
      where: {
        companyId_provider: { companyId: session.user.companyId, provider: PROVIDER },
      },
      select: { id: true, settings: true },
    });

    const storedRequestsResult = z.array(storedRequestSchema).safeParse(config?.settings?.requests ?? []);
    const storedRequests = storedRequestsResult.success ? storedRequestsResult.data : [];
    const updatedRequests = [...storedRequests, newVerification];

    await prisma.integrationConfig.upsert({
      where: {
        companyId_provider: { companyId: session.user.companyId, provider: PROVIDER },
      },
      create: {
        companyId: session.user.companyId,
        provider: PROVIDER,
        name: 'Verificación de inquilinos',
        category: 'screening',
        credentials: {},
        settings: { requests: updatedRequests },
        isConfigured: true,
      },
      update: {
        settings: { requests: updatedRequests },
        isConfigured: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: newVerification,
        message: 'Verificación solicitada correctamente',
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    logger.error('[API Verificación] Error POST:', error);
    return NextResponse.json(
      { error: 'Error al crear verificación', details: getErrorMessage(error) },
      { status: 500 }
    );
  }
}
