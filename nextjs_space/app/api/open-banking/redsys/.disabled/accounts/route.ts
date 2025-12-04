/**
 * API Endpoint: Obtener Cuentas Bancarias via Redsys PSD2
 * 
 * Este endpoint obtiene la lista de cuentas bancarias del usuario
 * a través de la API de Redsys PSD2.
 * 
 * Método: GET
 * Query params: aspsp, connectionId
 * 
 * @author INMOVA Development Team
 */

import { NextRequest, NextResponse } from 'next/server';

import { getAccounts, getBalances } from '@/lib/redsys-psd2-service';

import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth-options';

import { prisma } from '@/lib/db';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';


export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const aspsp = searchParams.get('aspsp');
    const connectionId = searchParams.get('connectionId');

    if (!aspsp || !connectionId) {
      return NextResponse.json(
        { error: 'Parámetros aspsp y connectionId son requeridos' },
        { status: 400 }
      );
    }

    // Obtener la conexión bancaria y el consentimiento activo
    const connection = await prisma.bankConnection.findFirst({
      where: {
        id: connectionId,
        userId: session.user.id,
        status: 'active',
      },
      include: {
        consents: {
          where: {
            status: 'valid',
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
        },
      },
    });

    if (!connection) {
      return NextResponse.json(
        { error: 'Conexión bancaria no encontrada o inactiva' },
        { status: 404 }
      );
    }

    if (!connection.consents || connection.consents.length === 0) {
      return NextResponse.json(
        { error: 'No hay consentimiento válido. Por favor, cree uno primero.' },
        { status: 400 }
      );
    }

    const consent = connection.consents[0];

    // Obtener cuentas bancarias
    const accounts = await getAccounts(
      aspsp,
      consent.consentId,
      connection.accessToken
    );

    // Obtener saldos para cada cuenta
    const accountsWithBalances = await Promise.all(
      accounts.map(async (account) => {
        try {
          const balances = await getBalances(
            aspsp,
            account.id,
            consent.consentId,
            connection.accessToken
          );
          return { ...account, balances };
        } catch (error) {
          console.error(`Error obteniendo saldos para cuenta ${account.id}:`, error);
          return account;
        }
      })
    );

    return NextResponse.json({
      success: true,
      accounts: accountsWithBalances,
    });
  } catch (error: any) {
    console.error('Error obteniendo cuentas:', error);
    return NextResponse.json(
      { error: error.message || 'Error al obtener cuentas' },
      { status: 500 }
    );
  }
}
