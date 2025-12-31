import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Using global prisma instance

    // Obtener partner
    const partner = await prisma.partner.findUnique({
      where: { id: params.id },
    });

    if (!partner) {
      return NextResponse.json({ error: 'Partner no encontrado' }, { status: 404 });
    }

    // Verificar acceso
    if (session.user.role !== 'super_admin' && partner.userId !== session.user.id) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    // Obtener clientes referidos
    const referrals = await prisma.referral.findMany({
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

    // Calcular comisión por cliente
    const clientsWithCommissions = referrals.map((referral) => {
      const monthlyValue = referral.monthlyValue || 149; // Default Professional
      const commission = monthlyValue * (partner.commissionRate / 100);

      return {
        id: referral.id,
        name: referral.company.nombre,
        plan: referral.plan || 'Professional',
        status: referral.status,
        monthlyValue,
        commission: Math.round(commission * 100) / 100,
        signupDate: referral.signedUpAt || referral.createdAt,
        activatedDate: referral.activatedAt,
      };
    });

    return NextResponse.json({
      success: true,
      data: clientsWithCommissions,
    });
  } catch (error: any) {
    console.error('[Partner Clients Error]:', error);
    return NextResponse.json({ error: 'Error obteniendo clientes' }, { status: 500 });
  }
}
