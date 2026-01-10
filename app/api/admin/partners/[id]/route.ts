import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/admin/partners/[id]
 * Obtener un partner específico
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !['SUPERADMIN', 'ADMIN', 'super_admin'].includes(session.user.role)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { getPrismaClient } = await import('@/lib/db');
    const prisma = getPrismaClient();

    const partner = await prisma.partner.findUnique({
      where: { id: params.id },
      include: {
        clients: {
          include: {
            company: {
              select: { id: true, nombre: true, email: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        commissions: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        brandingConfig: true,
        landingContent: true,
      },
    });

    if (!partner) {
      return NextResponse.json({ error: 'Partner no encontrado' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      partner: {
        id: partner.id,
        name: partner.nombre,
        email: partner.email,
        phone: partner.contactoTelefono,
        company: partner.razonSocial,
        cif: partner.cif,
        type: partner.tipo,
        status: partner.estado,
        commissionRate: partner.comisionPorcentaje,
        slug: partner.slug,
        dominioPersonalizado: partner.dominioPersonalizado,
        activo: partner.activo,
        fechaActivacion: partner.fechaActivacion,
        createdAt: partner.createdAt,
        clients: partner.clients.map((c) => ({
          id: c.id,
          companyId: c.companyId,
          companyName: c.company.nombre,
          estado: c.estado,
          fechaActivacion: c.fechaActivacion,
          totalComisionGenerada: c.totalComisionGenerada,
        })),
        commissions: partner.commissions.map((c) => ({
          id: c.id,
          periodo: c.periodo,
          montoBruto: c.montoBruto,
          porcentaje: c.porcentaje,
          montoComision: c.montoComision,
          estado: c.estado,
          createdAt: c.createdAt,
        })),
        branding: partner.brandingConfig,
        landing: partner.landingContent,
      },
    });
  } catch (error: any) {
    console.error('[Partner GET Error]:', error);
    return NextResponse.json(
      { error: 'Error al obtener partner', message: error.message },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/partners/[id]
 * Actualizar un partner
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !['SUPERADMIN', 'ADMIN', 'super_admin'].includes(session.user.role)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();

    const schema = z.object({
      nombre: z.string().min(2).max(100).optional(),
      razonSocial: z.string().min(2).max(200).optional(),
      tipo: z.enum(['BANCO', 'MULTIFAMILY_OFFICE', 'PLATAFORMA_MEMBRESIA', 'ASOCIACION', 'CONSULTORA', 'INMOBILIARIA', 'OTRO']).optional(),
      contactoNombre: z.string().min(2).max(100).optional(),
      contactoEmail: z.string().email().optional(),
      contactoTelefono: z.string().optional(),
      comisionPorcentaje: z.number().min(0).max(100).optional(),
      estado: z.enum(['PENDING', 'ACTIVE', 'SUSPENDED']).optional(),
      activo: z.boolean().optional(),
      dominioPersonalizado: z.string().optional(),
      slug: z.string().optional(),
      notas: z.string().optional(),
    });

    const validated = schema.parse(body);

    const { getPrismaClient } = await import('@/lib/db');
    const prisma = getPrismaClient();

    // Verificar que existe
    const existing = await prisma.partner.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Partner no encontrado' }, { status: 404 });
    }

    // Actualizar
    const updateData: any = { ...validated };
    
    // Si se está activando, registrar fecha
    if (validated.estado === 'ACTIVE' && existing.estado !== 'ACTIVE') {
      updateData.fechaActivacion = new Date();
    }

    const partner = await prisma.partner.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      partner: {
        id: partner.id,
        name: partner.nombre,
        status: partner.estado,
      },
      message: 'Partner actualizado correctamente',
    });
  } catch (error: any) {
    console.error('[Partner PUT Error]:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Datos inválidos',
        details: error.errors,
      }, { status: 400 });
    }

    return NextResponse.json(
      { error: 'Error al actualizar partner', message: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/partners/[id]
 * Eliminar un partner
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !['SUPERADMIN', 'super_admin'].includes(session.user.role)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { getPrismaClient } = await import('@/lib/db');
    const prisma = getPrismaClient();

    // Verificar que existe
    const existing = await prisma.partner.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: { clients: true, commissions: true },
        },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Partner no encontrado' }, { status: 404 });
    }

    // Si tiene clientes o comisiones, hacer soft delete
    if (existing._count.clients > 0 || existing._count.commissions > 0) {
      await prisma.partner.update({
        where: { id: params.id },
        data: {
          activo: false,
          estado: 'SUSPENDED',
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Partner desactivado (tiene historial asociado)',
        softDelete: true,
      });
    }

    // Si no tiene historial, eliminar
    await prisma.partner.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      success: true,
      message: 'Partner eliminado correctamente',
    });
  } catch (error: any) {
    console.error('[Partner DELETE Error]:', error);
    return NextResponse.json(
      { error: 'Error al eliminar partner', message: error.message },
      { status: 500 }
    );
  }
}
