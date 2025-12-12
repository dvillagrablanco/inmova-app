import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import {
  getConnectedAccounts,
  connectSocialMediaAccount,
  disconnectSocialMediaAccount,
} from '@/lib/social-media-service';
import type { SocialMediaPlatform } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const accounts = await getConnectedAccounts(session.user.companyId);
    return NextResponse.json({ success: true, accounts });
  } catch (error) {
    return NextResponse.json(
      { error: 'Error al obtener cuentas' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { platform, accountName, accountId, accessToken, config } = body;

    const account = await connectSocialMediaAccount(
      session.user.companyId,
      platform as SocialMediaPlatform,
      accountName,
      accountId,
      accessToken,
      config
    );

    return NextResponse.json({ success: true, account });
  } catch (error) {
    return NextResponse.json(
      { error: 'Error al conectar cuenta' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('accountId');

    if (!accountId) {
      return NextResponse.json(
        { error: 'accountId requerido' },
        { status: 400 }
      );
    }

    await disconnectSocialMediaAccount(accountId);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Error al desconectar cuenta' },
      { status: 500 }
    );
  }
}
