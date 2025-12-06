/**
 * API para solicitar reseña
 * POST /api/str-advanced/guest-experience/request-review
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { sendReviewRequest } from '@/lib/str-advanced-service';

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
    const { bookingId, daysAfterCheckout } = body;

    if (!bookingId) {
      return NextResponse.json(
        { error: 'bookingId es requerido' },
        { status: 400 }
      );
    }

    const result = await sendReviewRequest(bookingId, daysAfterCheckout);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error solicitando reseña:', error);
    return NextResponse.json(
      { error: error.message || 'Error solicitando reseña' },
      { status: 500 }
    );
  }
}
