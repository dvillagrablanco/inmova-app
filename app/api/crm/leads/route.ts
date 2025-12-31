export const dynamic = 'force-dynamic';

/**
 * API: /api/crm/leads
 *
 * GET:  Listar leads con filtros
 * POST: Crear nuevo lead
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { CRMService } from '@/lib/crm-service';
import type {
  CRMLeadStatus,
  CRMLeadSource,
  CRMLeadPriority,
  CompanySize,
} from '@/types/prisma-types';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session.user.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);

    // Filtros
    const filters: any = {};

    // Status (múltiple)
    const statusParam = searchParams.get('status');
    if (statusParam) {
      filters.status = statusParam.split(',') as CRMLeadStatus[];
    }

    // Source (múltiple)
    const sourceParam = searchParams.get('source');
    if (sourceParam) {
      filters.source = sourceParam.split(',') as CRMLeadSource[];
    }

    // Priority (múltiple)
    const priorityParam = searchParams.get('priority');
    if (priorityParam) {
      filters.priority = priorityParam.split(',') as CRMLeadPriority[];
    }

    // Owner
    const ownerId = searchParams.get('ownerId');
    if (ownerId) {
      filters.ownerId = ownerId;
    }

    // Tags
    const tagsParam = searchParams.get('tags');
    if (tagsParam) {
      filters.tags = tagsParam.split(',');
    }

    // Score range
    const minScore = searchParams.get('minScore');
    if (minScore) {
      filters.minScore = parseInt(minScore);
    }

    const maxScore = searchParams.get('maxScore');
    if (maxScore) {
      filters.maxScore = parseInt(maxScore);
    }

    // City (múltiple)
    const cityParam = searchParams.get('city');
    if (cityParam) {
      filters.city = cityParam.split(',');
    }

    // Industry (múltiple)
    const industryParam = searchParams.get('industry');
    if (industryParam) {
      filters.industry = industryParam.split(',');
    }

    // Company size (múltiple)
    const companySizeParam = searchParams.get('companySize');
    if (companySizeParam) {
      filters.companySize = companySizeParam.split(',') as CompanySize[];
    }

    // Paginación
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const result = await CRMService.listLeads(session.user.companyId, filters, page, limit);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error listing leads:', error);
    return NextResponse.json(
      { error: 'Error al listar leads', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session.user.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json();

    // Validación básica
    if (!body.firstName || !body.lastName || !body.companyName) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: firstName, lastName, companyName' },
        { status: 400 }
      );
    }

    if (!body.email && !body.linkedInUrl) {
      return NextResponse.json(
        { error: 'Se requiere al menos email o linkedInUrl' },
        { status: 400 }
      );
    }

    const lead = await CRMService.createLead({
      companyId: session.user.companyId,
      ...body,
    });

    // Log activity
    await CRMService.logActivity(
      session.user.companyId,
      lead.id,
      null,
      'note',
      'Lead creado',
      `Lead creado manualmente por ${session.user.nombre || session.user.email}`,
      undefined,
      undefined,
      session.user.id
    );

    return NextResponse.json(lead, { status: 201 });
  } catch (error: any) {
    console.error('Error creating lead:', error);
    return NextResponse.json(
      { error: 'Error al crear lead', details: error.message },
      { status: 500 }
    );
  }
}
