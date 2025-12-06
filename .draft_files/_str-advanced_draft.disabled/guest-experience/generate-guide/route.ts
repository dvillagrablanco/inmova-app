/**
 * API para generar guidebook digital
 * POST /api/str-advanced/guest-experience/generate-guide
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { generateGuestGuide } from '@/lib/str-advanced-service';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.companyId) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { listingId, customSections } = body;

    if (!listingId) {
      return NextResponse.json(
        { error: 'listingId es requerido' },
        { status: 400 }
      );
    }

    const guideContent = await generateGuestGuide(listingId, customSections);

    return NextResponse.json({ content: guideContent });
  } catch (error: any) {
    console.error('Error generando guía:', error);
    return NextResponse.json(
      { error: error.message || 'Error generando guía' },
      { status: 500 }
    );
  }
}
