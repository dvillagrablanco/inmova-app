export const dynamic = 'force-dynamic';

/**
 * API: /api/crm/leads
 *
 * GET:  Listar leads con filtros
 * POST: Crear nuevo lead
 * 
 * CORREGIDO: Mapea campos del frontend (inglés) a campos del modelo Lead (español)
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { CRMService } from '@/lib/crm-service';

import logger from '@/lib/logger';
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session.user.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);

    // Filtros - mapear a campos del modelo Lead
    const filters: any = {};

    // Estado (status en inglés → estado en español)
    const statusParam = searchParams.get('status') || searchParams.get('estado');
    if (statusParam) {
      filters.estado = statusParam.split(',');
    }

    // Fuente (source en inglés → fuente en español)
    const sourceParam = searchParams.get('source') || searchParams.get('fuente');
    if (sourceParam) {
      filters.fuente = sourceParam.split(',');
    }

    // Urgencia (priority en inglés → urgencia en español)
    const priorityParam = searchParams.get('priority') || searchParams.get('urgencia');
    if (priorityParam) {
      filters.urgencia = priorityParam.split(',');
    }

    // Asignado (ownerId en inglés → asignadoA en español)
    const ownerId = searchParams.get('ownerId') || searchParams.get('asignadoA');
    if (ownerId) {
      filters.asignadoA = ownerId;
    }

    // Puntuación (score en inglés → puntuacion en español)
    const minScore = searchParams.get('minScore') || searchParams.get('minPuntuacion');
    if (minScore) {
      filters.minPuntuacion = parseInt(minScore);
    }

    const maxScore = searchParams.get('maxScore') || searchParams.get('maxPuntuacion');
    if (maxScore) {
      filters.maxPuntuacion = parseInt(maxScore);
    }

    // Ciudad
    const cityParam = searchParams.get('city') || searchParams.get('ciudad');
    if (cityParam) {
      filters.ciudad = cityParam.split(',');
    }

    // Temperatura
    const temperaturaParam = searchParams.get('temperatura');
    if (temperaturaParam) {
      filters.temperatura = temperaturaParam.split(',');
    }

    // Paginación
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const result = await CRMService.listLeads(session.user.companyId, filters, page, limit);

    // Mapear respuesta a formato esperado por el frontend
    const mappedLeads = result.leads.map((lead: any) => ({
      id: lead.id,
      // Campos en inglés para el frontend
      firstName: lead.nombre,
      lastName: lead.apellidos || '',
      name: `${lead.nombre} ${lead.apellidos || ''}`.trim(),
      email: lead.email,
      phone: lead.telefono,
      companyName: lead.empresa,
      jobTitle: lead.cargo,
      city: lead.ciudad,
      country: lead.pais,
      source: lead.fuente,
      status: lead.estado,
      priority: lead.urgencia,
      score: lead.puntuacion,
      temperature: lead.temperatura,
      budget: lead.presupuestoMensual,
      notes: lead.notas,
      ownerId: lead.asignadoA,
      owner: lead.asignadoUsuario,
      lastContactDate: lead.ultimoContacto,
      nextFollowUpDate: lead.proximoSeguimiento,
      createdAt: lead.createdAt,
      updatedAt: lead.updatedAt,
    }));

    return NextResponse.json({
      leads: mappedLeads,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    });
  } catch (error: any) {
    logger.error('Error listing leads:', error);
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

    // Mapear campos del frontend (inglés) a campos del modelo (español)
    const nombre = body.nombre || body.firstName || body.name?.split(' ')[0];
    const apellidos = body.apellidos || body.lastName || body.name?.split(' ').slice(1).join(' ');

    // Validación básica
    if (!nombre) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: nombre o firstName' },
        { status: 400 }
      );
    }

    const email = body.email;
    if (!email) {
      return NextResponse.json(
        { error: 'Se requiere email' },
        { status: 400 }
      );
    }

    const lead = await CRMService.createLead({
      companyId: session.user.companyId,
      nombre,
      apellidos,
      email,
      telefono: body.telefono || body.phone,
      empresa: body.empresa || body.companyName,
      cargo: body.cargo || body.jobTitle,
      ciudad: body.ciudad || body.city,
      pais: body.pais || body.country,
      fuente: body.fuente || body.source || 'web',
      asignadoA: body.asignadoA || body.ownerId,
      notas: body.notas || body.notes,
      urgencia: body.urgencia || body.priority,
      presupuestoMensual: body.presupuestoMensual || body.budget,
    });

    // Log activity
    if (session.user.id) {
      await CRMService.logActivity(
        session.user.companyId,
        lead.id,
        null,
        'nota',
        'Lead creado',
        `Lead creado manualmente por ${session.user.nombre || session.user.email}`,
        undefined,
        undefined,
        session.user.id
      );
    }

    // Mapear respuesta a formato del frontend
    const mappedLead = {
      id: lead.id,
      firstName: lead.nombre,
      lastName: lead.apellidos || '',
      name: `${lead.nombre} ${lead.apellidos || ''}`.trim(),
      email: lead.email,
      phone: lead.telefono,
      companyName: lead.empresa,
      jobTitle: lead.cargo,
      city: lead.ciudad,
      country: lead.pais,
      source: lead.fuente,
      status: lead.estado,
      priority: lead.urgencia,
      score: lead.puntuacion,
      temperature: lead.temperatura,
      budget: lead.presupuestoMensual,
      notes: lead.notas,
      ownerId: lead.asignadoA,
      owner: lead.asignadoUsuario,
      createdAt: lead.createdAt,
      updatedAt: lead.updatedAt,
    };

    return NextResponse.json(mappedLead, { status: 201 });
  } catch (error: any) {
    logger.error('Error creating lead:', error);
    return NextResponse.json(
      { error: 'Error al crear lead', details: error.message },
      { status: 500 }
    );
  }
}
