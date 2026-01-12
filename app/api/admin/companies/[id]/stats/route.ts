import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { subMonths, startOfMonth, endOfMonth } from 'date-fns';
import logger, { logError } from '@/lib/logger';

// GET /api/admin/companies/[id]/stats - Estadísticas de uso de una empresa
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Solo super_admin puede acceder
    if (session.user.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requiere rol super_admin' },
        { status: 403 }
      );
    }

    const company = await prisma.company.findUnique({
      where: { id: params.id },
      include: {
        subscriptionPlan: true,
      },
    });

    if (!company) {
      return NextResponse.json(
        { error: 'Empresa no encontrada' },
        { status: 404 }
      );
    }

    // Contar recursos
    const totalUsuarios = await prisma.user.count({
      where: { companyId: params.id },
    });

    const totalEdificios = await prisma.building.count({
      where: { companyId: params.id },
    });

    const totalUnidades = await prisma.unit.count({
      where: { building: { companyId: params.id } },
    });

    const totalInquilinos = await prisma.tenant.count({
      where: { companyId: params.id },
    });

    const totalContratos = await prisma.contract.count({
      where: { tenant: { companyId: params.id } },
    });

    const contratosActivos = await prisma.contract.count({
      where: {
        tenant: { companyId: params.id },
        estado: 'activo',
      },
    });

    // Estadísticas de pagos (último mes)
    const inicioMes = startOfMonth(new Date());
    const finMes = endOfMonth(new Date());

    const pagosDelMes = await prisma.payment.findMany({
      where: {
        contract: {
          tenant: {
            companyId: params.id,
          },
        },
        fechaVencimiento: {
          gte: inicioMes,
          lte: finMes,
        },
      },
    });

    const totalIngresosMes = pagosDelMes
      .filter(p => p.estado === 'pagado')
      .reduce((sum, p) => sum + p.monto, 0);

    const pagosPendientesMes = pagosDelMes.filter(p => p.estado === 'pendiente').length;

    // Estadísticas de ocupación
    const unidadesOcupadas = await prisma.unit.count({
      where: {
        building: { companyId: params.id },
        estado: 'ocupada',
      },
    });

    const tasaOcupacion = totalUnidades > 0
      ? Math.round((unidadesOcupadas / totalUnidades) * 100)
      : 0;

    // Módulos activos
    const modulosActivos = await prisma.companyModule.count({
      where: {
        companyId: params.id,
        activo: true,
      },
    });

    // Último acceso (aproximación basada en últimas actualizaciones)
    const ultimoUsuarioActivo = await prisma.user.findFirst({
      where: { companyId: params.id },
      orderBy: { updatedAt: 'desc' },
      select: { updatedAt: true },
    });

    // Verificar límites
    const limites = {
      usuarios: {
        actual: totalUsuarios,
        maximo: company.maxUsuarios || 0,
        porcentaje: company.maxUsuarios ? Math.round((totalUsuarios / company.maxUsuarios) * 100) : 0,
      },
      propiedades: {
        actual: totalUnidades,
        maximo: company.maxPropiedades || 0,
        porcentaje: company.maxPropiedades ? Math.round((totalUnidades / company.maxPropiedades) * 100) : 0,
      },
      edificios: {
        actual: totalEdificios,
        maximo: company.maxEdificios || 0,
        porcentaje: company.maxEdificios ? Math.round((totalEdificios / company.maxEdificios) * 100) : 0,
      },
    };

    return NextResponse.json({
      empresa: {
        id: company.id,
        nombre: company.nombre,
        estadoCliente: company.estadoCliente,
        planSuscripcion: company.subscriptionPlan?.nombre || 'Sin plan',
      },
      contadores: {
        usuarios: totalUsuarios,
        edificios: totalEdificios,
        unidades: totalUnidades,
        inquilinos: totalInquilinos,
        contratos: totalContratos,
        contratosActivos,
        modulosActivos,
      },
      pagos: {
        ingresosMesActual: totalIngresosMes,
        pagosPendientesMes,
      },
      ocupacion: {
        unidadesOcupadas,
        unidadesDisponibles: totalUnidades - unidadesOcupadas,
        tasaOcupacion,
      },
      limites,
      ultimoAcceso: ultimoUsuarioActivo?.updatedAt,
    });
  } catch (error) {
    logger.error('Error fetching company stats:', error);
    return NextResponse.json(
      { error: 'Error al obtener estadísticas' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
