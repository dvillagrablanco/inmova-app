import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { enviarSMS, crearPlantilla } from '@/lib/sms-service';
import { SMSTipo, SMSEstado } from '@prisma/client';

/**
 * GET /api/sms
 * Obtiene logs de SMS
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const estado = searchParams.get('estado');
    const tenantId = searchParams.get('tenantId');
    const tipo = searchParams.get('tipo');

    const where: any = {
      companyId: session.user.companyId
    };

    if (estado) where.estado = estado as SMSEstado;
    if (tenantId) where.tenantId = tenantId;
    if (tipo) where.tipo = tipo as SMSTipo;

    const smsLogs = await prisma.sMSLog.findMany({
      where,
      include: {
        tenant: true,
        template: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 100
    });

    return NextResponse.json(smsLogs);
  } catch (error: any) {
    console.error('Error al obtener logs de SMS:', error);
    return NextResponse.json(
      { error: 'Error al obtener logs de SMS' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/sms
 * Envía un nuevo SMS
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const {
      tenantId,
      templateId,
      tipo,
      mensaje,
      fechaProgramada,
      relacionadoCon,
      relacionadoId
    } = body;

    // Validaciones
    if (!tenantId || !tipo || !mensaje) {
      return NextResponse.json(
        { error: 'Faltan datos requeridos: tenantId, tipo, mensaje' },
        { status: 400 }
      );
    }

    // Enviar SMS
    const smsLog = await enviarSMS(
      session.user.companyId,
      {
        tenantId,
        templateId,
        tipo: tipo as SMSTipo,
        mensaje,
        fechaProgramada: fechaProgramada ? new Date(fechaProgramada) : undefined,
        relacionadoCon,
        relacionadoId
      },
      session.user.id
    );

    return NextResponse.json(smsLog, { status: 201 });
    
  } catch (error: any) {
    console.error('Error al enviar SMS:', error);
    return NextResponse.json(
      { error: error.message || 'Error al enviar SMS' },
      { status: 500 }
    );
  }
}
