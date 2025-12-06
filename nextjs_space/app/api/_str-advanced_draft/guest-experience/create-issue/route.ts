/**
 * API para crear incidencia de huésped
 * POST /api/str-advanced/guest-experience/create-issue
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { createGuestIssue } from '@/lib/str-advanced-service';

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
    const { bookingId, category, description, urgency } = body;

    if (!bookingId || !category || !description || !urgency) {
      return NextResponse.json(
        { error: 'Todos los campos son requeridos' },
        { status: 400 }
      );
    }

    const issue = await createGuestIssue(bookingId, category, description, urgency);

    return NextResponse.json(issue);
  } catch (error: any) {
    console.error('Error creando incidencia:', error);
    return NextResponse.json(
      { error: error.message || 'Error creando incidencia' },
      { status: 500 }
    );
  }
}
