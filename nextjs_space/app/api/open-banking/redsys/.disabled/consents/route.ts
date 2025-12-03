/**
 * API Endpoint: Gestionar Consentimientos Redsys PSD2
 * 
 * Este endpoint permite crear y consultar consentimientos para acceder
 * a información de cuentas bancarias.
 * 
 * Métodos: POST (crear), GET (listar)
 * 
 * @author INMOVA Development Team
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  createAISConsent,
  getConsentStatus,
  getConsentExpirationDate,
  type ConsentRequest,
} from '@/lib/redsys-psd2-service';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const { aspsp, connectionId } = body;

    if (!aspsp || !connectionId) {
      return NextResponse.json(
        { error: 'Parámetros aspsp y connectionId son requeridos' },
        { status: 400 }
      );
    }

    // Obtener la conexión bancaria
    const connection = await prisma.bankConnection.findFirst({
      where: {
        id: connectionId,
        userId: session.user.id,
        status: 'active',
      },
    });

    if (!connection) {
      return NextResponse.json(
        { error: 'Conexión bancaria no encontrada o inactiva' },
        { status: 404 }
      );
    }

    // Crear consentimiento para acceso a cuentas
    const consentRequest: ConsentRequest = {
      access: {
        accounts: [],
        balances: [],
        transactions: [],
      },
      recurringIndicator: true,
      validUntil: getConsentExpirationDate(90),
      frequencyPerDay: 4,
    };

    const consentResponse = await createAISConsent(
      aspsp,
      connection.accessToken,
      consentRequest
    );

    // Guardar el consentimiento en la base de datos
    const consent = await prisma.bankConsent.create({
      data: {
        connectionId: connection.id,
        consentId: consentResponse.consentId,
        status: consentResponse.consentStatus,
        scaRedirectUrl: consentResponse._links.scaRedirect?.href || '',
        validUntil: consentRequest.validUntil,
      },
    });

    return NextResponse.json({
      success: true,
      consent: {
        id: consent.id,
        consentId: consent.consentId,
        status: consent.status,
        scaRedirectUrl: consent.scaRedirectUrl,
        validUntil: consent.validUntil,
      },
    });
  } catch (error: any) {
    console.error('Error creando consentimiento:', error);
    return NextResponse.json(
      { error: error.message || 'Error al crear consentimiento' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Obtener todos los consentimientos del usuario
    const consents = await prisma.bankConsent.findMany({
      where: {
        connection: {
          userId: session.user.id,
        },
      },
      include: {
        connection: {
          select: {
            provider: true,
            status: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      consents,
    });
  } catch (error: any) {
    console.error('Error obteniendo consentimientos:', error);
    return NextResponse.json(
      { error: error.message || 'Error al obtener consentimientos' },
      { status: 500 }
    );
  }
}
