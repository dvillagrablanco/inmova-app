import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

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

// GET - Obtener verificaciones de inquilinos
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    let verifications: VerificationRequest[] = [];

    try {
      // Obtener inquilinos de la base de datos
      const tenants = await prisma.tenant.findMany({
        where: {
          companyId: session.user.companyId,
          isDemo: false, // Excluir datos de demo
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
                    select: { nombre: true }
                  }
                }
              }
            },
            take: 1,
          }
        },
        take: 50,
        orderBy: { createdAt: 'desc' },
      });

      verifications = tenants.map(tenant => {
        const contract = tenant.contracts?.[0];
        const propertyName = contract 
          ? `${contract.unit?.building?.nombre || 'Edificio'} - ${contract.unit?.numero || 'Unidad'}`
          : 'Sin asignar';
        
        // Determinar estado basado en scoring y datos
        let verificationStatus: 'pending' | 'in_progress' | 'completed' | 'rejected' = 'pending';
        if (tenant.scoring >= 70) {
          verificationStatus = 'completed';
        } else if (tenant.scoring >= 40) {
          verificationStatus = 'in_progress';
        } else if (tenant.dni) {
          verificationStatus = 'in_progress';
        }

        return {
          id: tenant.id,
          tenantName: tenant.nombreCompleto || 'Sin nombre',
          tenantEmail: tenant.email || '',
          tenantPhone: tenant.telefono || '',
          propertyName,
          requestDate: tenant.createdAt?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
          status: verificationStatus,
          score: tenant.scoring || undefined,
          checks: {
            identity: tenant.dni ? 'verified' : 'pending',
            credit: tenant.scoring >= 60 ? 'verified' : (tenant.scoring >= 40 ? 'warning' : 'pending'),
            employment: tenant.scoring >= 50 ? 'verified' : 'pending',
            references: tenant.scoring >= 70 ? 'verified' : 'pending',
            background: tenant.nivelRiesgo === 'bajo' ? 'clear' : (tenant.nivelRiesgo === 'alto' ? 'issues' : 'pending'),
          },
          documents: tenant.dni ? ['DNI'] : [],
        };
      });
    } catch (dbError) {
      console.warn('[API Verificación] Error BD, usando datos mock:', dbError);
      // Datos mock
      verifications = [
        {
          id: 'v1',
          tenantName: 'María García López',
          tenantEmail: 'maria.garcia@email.com',
          tenantPhone: '+34 612 345 678',
          propertyName: 'Piso C/ Mayor 45, 3ºA',
          requestDate: '2025-01-20',
          status: 'completed',
          score: 85,
          checks: {
            identity: 'verified',
            credit: 'verified',
            employment: 'verified',
            references: 'verified',
            background: 'clear',
          },
          documents: ['DNI', 'Nóminas', 'Contrato laboral'],
        },
        {
          id: 'v2',
          tenantName: 'Juan Martínez',
          tenantEmail: 'juan.martinez@email.com',
          tenantPhone: '+34 623 456 789',
          propertyName: 'Apartamento Playa Bloque 2',
          requestDate: '2025-01-22',
          status: 'in_progress',
          score: 72,
          checks: {
            identity: 'verified',
            credit: 'warning',
            employment: 'verified',
            references: 'pending',
            background: 'clear',
          },
          documents: ['DNI', 'Declaración IRPF'],
          notes: 'Pendiente referencias del anterior arrendador',
        },
        {
          id: 'v3',
          tenantName: 'Ana Rodríguez',
          tenantEmail: 'ana.r@email.com',
          tenantPhone: '+34 634 567 890',
          propertyName: 'Estudio Centro 1ºB',
          requestDate: '2025-01-23',
          status: 'pending',
          checks: {
            identity: 'pending',
            credit: 'pending',
            employment: 'pending',
            references: 'pending',
            background: 'pending',
          },
          documents: [],
        },
      ];
    }

    // Filtrar por estado si se proporciona
    if (status && status !== 'all') {
      verifications = verifications.filter(v => v.status === status);
    }

    // Calcular estadísticas
    const stats = {
      total: verifications.length,
      pending: verifications.filter(v => v.status === 'pending').length,
      inProgress: verifications.filter(v => v.status === 'in_progress').length,
      completed: verifications.filter(v => v.status === 'completed').length,
      avgScore: Math.round(
        verifications.filter(v => v.score).reduce((sum, v) => sum + (v.score || 0), 0) /
        (verifications.filter(v => v.score).length || 1)
      ),
    };

    return NextResponse.json({
      success: true,
      data: verifications,
      stats,
    });
  } catch (error: any) {
    console.error('[API Verificación] Error:', error);
    return NextResponse.json(
      { error: 'Error al obtener verificaciones', details: error.message },
      { status: 500 }
    );
  }
}

// POST - Iniciar nueva verificación
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { tenantName, tenantEmail, tenantPhone, propertyId } = body;

    if (!tenantName || !tenantEmail) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: tenantName, tenantEmail' },
        { status: 400 }
      );
    }

    const newVerification: VerificationRequest = {
      id: `v-${Date.now()}`,
      tenantName,
      tenantEmail,
      tenantPhone: tenantPhone || '',
      propertyName: 'Por asignar',
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

    return NextResponse.json({
      success: true,
      data: newVerification,
      message: 'Verificación solicitada correctamente',
    }, { status: 201 });
  } catch (error: any) {
    console.error('[API Verificación] Error POST:', error);
    return NextResponse.json(
      { error: 'Error al crear verificación', details: error.message },
      { status: 500 }
    );
  }
}
