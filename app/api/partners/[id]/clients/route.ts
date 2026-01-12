import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Obtener partner
    const partner = await prisma.partner.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        email: true,
        nombre: true,
        comisionPorcentaje: true,
      },
    });

    if (!partner) {
      return NextResponse.json({ error: 'Partner no encontrado' }, { status: 404 });
    }

    // Verificar acceso (solo super_admin o el partner mismo)
    if (session.user.role !== 'super_admin' && partner.email !== session.user.email) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    // Obtener clientes del partner
    const partnerClients = await prisma.partnerClient.findMany({
      where: { partnerId: partner.id },
      include: {
        company: {
          select: {
            id: true,
            nombre: true,
            email: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Calcular comisión estimada por cliente (valor mensual base: 149€)
    const clientsWithCommissions = partnerClients.map((partnerClient) => {
      const monthlyValue = 149; // Valor base plan Professional
      const commission = monthlyValue * (partner.comisionPorcentaje / 100);

      return {
        id: partnerClient.id,
        nombre: partnerClient.company.nombre,
        email: partnerClient.company.email,
        estado: partnerClient.estado,
        fechaActivacion: partnerClient.fechaActivacion,
        fechaCancelacion: partnerClient.fechaCancelacion,
        totalComisionGenerada: partnerClient.totalComisionGenerada,
        comisionEstimadaMensual: Math.round(commission * 100) / 100,
        codigoReferido: partnerClient.codigoReferido,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        partner: {
          id: partner.id,
          nombre: partner.nombre,
          comisionPorcentaje: partner.comisionPorcentaje,
        },
        clientes: clientsWithCommissions,
        totalClientes: clientsWithCommissions.length,
        clientesActivos: clientsWithCommissions.filter((c) => c.estado === 'activo').length,
      },
    });
  } catch (error: any) {
    console.error('[Partner Clients Error]:', error);
    return NextResponse.json({ error: 'Error obteniendo clientes' }, { status: 500 });
  }
}
