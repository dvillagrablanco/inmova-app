/**
 * API: /api/crm/leads/[leadId]
 * 
 * GET:    Obtener lead por ID
 * PATCH:  Actualizar lead
 * DELETE: Eliminar lead
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { CRMService } from '@/lib/crm-service';

export async function GET(
  request: Request,
  { params }: { params: { leadId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session.user.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const lead = await CRMService.getLead(params.leadId, session.user.companyId);

    return NextResponse.json(lead);
  } catch (error: any) {
    console.error('Error getting lead:', error);
    
    if (error.message === 'Lead no encontrado') {
      return NextResponse.json({ error: 'Lead no encontrado' }, { status: 404 });
    }

    return NextResponse.json(
      { error: 'Error al obtener lead', details: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { leadId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session.user.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json();

    const lead = await CRMService.updateLead(
      params.leadId,
      session.user.companyId,
      body
    );

    // Log activity
    await CRMService.logActivity(
      session.user.companyId,
      lead.id,
      null,
      'note',
      'Lead actualizado',
      `Lead actualizado por ${session.user.nombre || session.user.email}`,
      undefined,
      undefined,
      session.user.id
    );

    return NextResponse.json(lead);
  } catch (error: any) {
    console.error('Error updating lead:', error);
    
    if (error.message === 'Lead no encontrado') {
      return NextResponse.json({ error: 'Lead no encontrado' }, { status: 404 });
    }

    return NextResponse.json(
      { error: 'Error al actualizar lead', details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { leadId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session.user.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    await CRMService.deleteLead(params.leadId, session.user.companyId);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting lead:', error);
    
    if (error.message === 'Lead no encontrado') {
      return NextResponse.json({ error: 'Lead no encontrado' }, { status: 404 });
    }

    return NextResponse.json(
      { error: 'Error al eliminar lead', details: error.message },
      { status: 500 }
    );
  }
}
