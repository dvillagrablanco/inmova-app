import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    try {
      const partner = await prisma.partner.findUnique({
        where: { userId: session.user.id },
        include: {
          branding: true,
          integraciones: true,
        },
      });

      if (!partner) {
        return NextResponse.json({
          settings: {
            notificaciones: { email: true, sms: false, push: true },
            facturacion: { metodo: 'transferencia', iban: '' },
            integraciones: [],
          },
        });
      }

      return NextResponse.json({
        settings: {
          notificaciones: partner.notificaciones || { email: true, sms: false, push: true },
          facturacion: partner.facturacion || { metodo: 'transferencia', iban: '' },
          branding: partner.branding,
          integraciones: partner.integraciones,
        },
      });
    } catch {
      return NextResponse.json({
        settings: {
          notificaciones: { email: true, sms: false, push: true },
          facturacion: { metodo: 'transferencia', iban: '' },
          integraciones: [],
        },
      });
    }
  } catch (error: any) {
    console.error('[API Partner Settings] Error:', error);
    return NextResponse.json({ error: 'Error al obtener configuración' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json();

    try {
      const partner = await prisma.partner.update({
        where: { userId: session.user.id },
        data: {
          notificaciones: body.notificaciones,
          facturacion: body.facturacion,
        },
      });

      return NextResponse.json({ success: true, partner });
    } catch {
      return NextResponse.json({ error: 'Error al guardar configuración' }, { status: 503 });
    }
  } catch (error: any) {
    console.error('[API Partner Settings] Error:', error);
    return NextResponse.json({ error: 'Error al actualizar configuración' }, { status: 500 });
  }
}
