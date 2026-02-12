import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Lazy Prisma (auditoria V2)
async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

// Schema de validación
const warrantyCreateSchema = z.object({
  contractId: z.string().min(1, 'El contrato es requerido'),
  importeFianza: z.number().positive('El importe debe ser positivo'),
  tipoFianza: z.enum(['legal', 'adicional', 'aval_bancario', 'seguro_caucion', 'aval_personal']),
  entidadDeposito: z.string().optional(),
  numeroDeposito: z.string().optional(),
  fechaDeposito: z.string().optional(),
  notas: z.string().optional(),
});

// GET - Obtener garantías desde DepositManagement
export async function GET(request: NextRequest) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const type = searchParams.get('type');

    const companyId = session.user.companyId;

    // Construir filtros
    const whereClause: any = {
      companyId,
    };

    // Filtrar por estado
    if (status && status !== 'all') {
      if (status === 'active') {
        whereClause.devuelto = false;
      } else if (status === 'pending_return') {
        whereClause.devuelto = false;
        // Contratos vencidos pero no devueltos
      } else if (status === 'returned') {
        whereClause.devuelto = true;
      }
    }

    // Filtrar por tipo
    if (type && type !== 'all') {
      const typeMap: Record<string, string> = {
        'cash': 'legal',
        'bank_guarantee': 'aval_bancario',
        'insurance': 'seguro_caucion',
        'aval_personal': 'aval_personal',
      };
      whereClause.tipoFianza = typeMap[type] || type;
    }

    // Obtener garantías de la base de datos
    const deposits = await prisma.depositManagement.findMany({
      where: whereClause,
      include: {
        contract: {
          include: {
            tenant: {
              select: {
                id: true,
                nombreCompleto: true,
                email: true,
                telefono: true,
              },
            },
            unit: {
              select: {
                id: true,
                numero: true,
                building: {
                  select: {
                    id: true,
                    nombre: true,
                    direccion: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    // Transformar datos para el frontend
    const warranties = deposits.map((deposit) => {
      const contract = deposit.contract;
      const tenant = contract?.tenant;
      const unit = contract?.unit;
      const building = unit?.building;

      // Mapear tipo de fianza a tipo de frontend
      const typeMap: Record<string, string> = {
        'legal': 'cash',
        'adicional': 'cash',
        'aval_bancario': 'bank_guarantee',
        'seguro_caucion': 'insurance',
        'aval_personal': 'aval_personal',
      };

      // Determinar estado
      let warrantyStatus = 'active';
      if (deposit.devuelto) {
        warrantyStatus = deposit.importeDevuelto === deposit.importeFianza ? 'returned' : 'partial_return';
      } else if (contract?.estado === 'vencido' || contract?.estado === 'cancelado') {
        warrantyStatus = 'pending_return';
      } else if (deposit.deducciones > 0) {
        warrantyStatus = 'deducted';
      }

      // Parsear documentos
      let documents: any[] = [];
      try {
        if (deposit.documentos) {
          documents = typeof deposit.documentos === 'string' 
            ? JSON.parse(deposit.documentos) 
            : deposit.documentos;
          if (!Array.isArray(documents)) {
            documents = [];
          }
        }
      } catch {
        documents = [];
      }

      // Crear array de deducciones
      const deductions = deposit.deducciones > 0 ? [{
        id: `ded-${deposit.id}`,
        amount: deposit.deducciones,
        reason: deposit.motivoDeducciones || 'Deducción aplicada',
        date: deposit.fechaDevolucion?.toISOString() || deposit.updatedAt.toISOString(),
        approved: true,
      }] : [];

      return {
        id: deposit.id,
        tenantId: tenant?.id || '',
        tenantName: tenant?.nombreCompleto || 'Sin inquilino',
        tenantEmail: tenant?.email || '',
        tenantPhone: tenant?.telefono || '',
        propertyId: unit?.id || '',
        propertyName: unit ? `${building?.nombre || ''} - ${unit.numero}` : 'Sin propiedad',
        propertyAddress: building?.direccion || '',
        contractId: contract?.id || '',
        amount: deposit.importeFianza,
        type: typeMap[deposit.tipoFianza] || 'cash',
        depositDate: deposit.fechaDeposito?.toISOString().split('T')[0] || deposit.createdAt.toISOString().split('T')[0],
        status: warrantyStatus,
        contractStartDate: contract?.fechaInicio?.toISOString().split('T')[0] || '',
        contractEndDate: contract?.fechaFin?.toISOString().split('T')[0] || '',
        returnDate: deposit.fechaDevolucion?.toISOString().split('T')[0],
        returnedAmount: deposit.importeDevuelto,
        bankName: deposit.tipoFianza === 'aval_bancario' ? deposit.entidadDeposito : undefined,
        insuranceCompany: deposit.tipoFianza === 'seguro_caucion' ? deposit.entidadDeposito : undefined,
        policyNumber: deposit.numeroDeposito,
        depositedOfficially: deposit.depositadoOficialmente,
        depositEntity: deposit.entidadDeposito,
        depositNumber: deposit.numeroDeposito,
        documents,
        deductions,
        notes: deposit.motivoDeducciones,
        createdAt: deposit.createdAt.toISOString(),
        updatedAt: deposit.updatedAt.toISOString(),
      };
    });

    // Calcular estadísticas
    const stats = {
      total: warranties.length,
      totalAmount: warranties.filter(w => w.status === 'active' || w.status === 'pending_return').reduce((sum, w) => sum + w.amount, 0),
      active: warranties.filter(w => w.status === 'active').length,
      pendingReturn: warranties.filter(w => w.status === 'pending_return').length,
      returned: warranties.filter(w => w.status === 'returned' || w.status === 'partial_return').length,
      totalDeductions: warranties.reduce((sum, w) => 
        sum + w.deductions.reduce((s, d) => s + d.amount, 0), 0),
    };

    return NextResponse.json({
      success: true,
      data: warranties,
      stats,
    });
  } catch (error: any) {
    console.error('[API Garantías] Error:', error);
    return NextResponse.json(
      { error: 'Error al obtener garantías', details: error.message },
      { status: 500 }
    );
  }
}

// POST - Crear nueva garantía
export async function POST(request: NextRequest) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    
    // Validar datos
    const validation = warrantyCreateSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { contractId, importeFianza, tipoFianza, entidadDeposito, numeroDeposito, fechaDeposito, notas } = validation.data;

    // Verificar que el contrato existe y pertenece a la empresa
    const contract = await prisma.contract.findFirst({
      where: {
        id: contractId,
        unit: {
          building: {
            companyId: session.user.companyId,
          },
        },
      },
    });

    if (!contract) {
      return NextResponse.json(
        { error: 'Contrato no encontrado o no autorizado' },
        { status: 404 }
      );
    }

    // Verificar si ya existe una garantía para este contrato
    const existingDeposit = await prisma.depositManagement.findUnique({
      where: { contractId },
    });

    if (existingDeposit) {
      return NextResponse.json(
        { error: 'Ya existe una garantía registrada para este contrato' },
        { status: 400 }
      );
    }

    // Crear la garantía
    const newDeposit = await prisma.depositManagement.create({
      data: {
        companyId: session.user.companyId,
        contractId,
        importeFianza,
        tipoFianza,
        entidadDeposito,
        numeroDeposito,
        fechaDeposito: fechaDeposito ? new Date(fechaDeposito) : new Date(),
        depositadoOficialmente: tipoFianza === 'legal',
        devuelto: false,
        deducciones: 0,
      },
      include: {
        contract: {
          include: {
            tenant: {
              select: {
                nombreCompleto: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: newDeposit.id,
        amount: newDeposit.importeFianza,
        type: tipoFianza,
        status: 'active',
        tenant: newDeposit.contract.tenant?.nombreCompleto,
        createdAt: newDeposit.createdAt.toISOString(),
      },
      message: 'Garantía creada correctamente',
    }, { status: 201 });
  } catch (error: any) {
    console.error('[API Garantías] Error POST:', error);
    return NextResponse.json(
      { error: 'Error al crear garantía', details: error.message },
      { status: 500 }
    );
  }
}
