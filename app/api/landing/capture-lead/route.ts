import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { calculateLeadScoring, calculateProbabilidadCierre, determinarTemperatura } from '@/lib/crm-service';
import logger from '@/lib/logger';
import { withRateLimit, RATE_LIMITS } from '@/lib/rate-limiting';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Lazy Prisma (auditoria V2)
async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

const captureLeadSchema = z.object({
  email: z.string().email('Email invalido').max(255),
  nombre: z.string().max(200).optional(),
  telefono: z.string().max(30).optional(),
  empresa: z.string().max(200).optional(),
  mensaje: z.string().max(2000).optional(),
  origen: z.string().max(100).optional(),
  vertical: z.string().max(100).optional(),
  plan: z.string().max(100).optional(),
}).passthrough();

// Endpoint publico para capturar leads desde la landing page y chatbot
export async function POST(req: NextRequest) {
  return withRateLimit(req, async () => {
    return handleCaptureLead(req);
  }, RATE_LIMITS.auth);
}

async function handleCaptureLead(req: NextRequest) {
  const prisma = await getPrisma();
  try {
    const rawBody = await req.json();
    const parsed = captureLeadSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos invalidos', details: parsed.error.errors },
        { status: 400 }
      );
    }
    const body = parsed.data;

    // Buscar o crear compañía demo para leads públicos
    let demoCompany = await prisma.company.findFirst({
      where: {
        nombre: 'Leads Landing Page',
      },
    });

    if (!demoCompany) {
      // Crear compañía demo si no existe
      demoCompany = await prisma.company.create({
        data: {
          nombre: 'Leads Landing Page',
          cif: 'DEMO-LEADS',
          email: 'leads@inmova.app',
          telefono: '+34900000000',
          direccion: 'Oficina Virtual',
        },
      });
    }

    // Calcular scoring y probabilidad inicial
    const leadData = {
      ...body,
      nombre: body.nombre || body.name || '',
      fuente: body.fuente || (body.conversacionId ? 'chatbot' : 'landing'),
      urgencia: body.urgencia || 'media',
    };

    const puntuacionInicial = calculateLeadScoring(leadData);
    const probabilidadInicial = calculateProbabilidadCierre(leadData);
    const temperaturaInicial = determinarTemperatura(puntuacionInicial);

    // Verificar si el lead ya existe
    const existingLead = await prisma.lead.findFirst({
      where: {
        email: body.email,
        companyId: demoCompany.id,
      },
    });

    if (existingLead) {
      // Actualizar lead existente
      const updatedLead = await prisma.lead.update({
        where: { id: existingLead.id },
        data: {
          nombre: body.nombre || existingLead.nombre,
          apellidos: body.apellidos || existingLead.apellidos,
          telefono: body.telefono || existingLead.telefono,
          empresa: body.empresa || existingLead.empresa,
          cargo: body.cargo || existingLead.cargo,
          paginaOrigen: body.paginaOrigen || existingLead.paginaOrigen,
          verticalesInteres: body.verticalesInteres || existingLead.verticalesInteres,
          presupuestoMensual: body.presupuestoMensual ? parseFloat(body.presupuestoMensual) : existingLead.presupuestoMensual,
          numeroUnidades: body.numeroUnidades ? parseInt(body.numeroUnidades) : existingLead.numeroUnidades,
          conversacionId: body.conversacionId || existingLead.conversacionId,
          mensajeInicial: body.mensajeInicial || existingLead.mensajeInicial,
          preguntasFrecuentes: body.preguntasFrecuentes || existingLead.preguntasFrecuentes,
          puntuacion: puntuacionInicial,
          probabilidadCierre: probabilidadInicial,
          temperatura: temperaturaInicial,
          ultimoContacto: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        lead: updatedLead,
        message: 'Lead actualizado correctamente',
      });
    }

    // Crear nuevo lead
    const lead = await prisma.lead.create({
      data: {
        companyId: demoCompany.id,
        nombre: body.nombre || body.name || '',
        apellidos: body.apellidos || '',
        email: body.email,
        telefono: body.telefono || body.phone || '',
        empresa: body.empresa || body.company || '',
        cargo: body.cargo || '',
        direccion: body.direccion || '',
        ciudad: body.ciudad || '',
        codigoPostal: body.codigoPostal || '',
        pais: body.pais || 'España',
        fuente: body.fuente || (body.conversacionId ? 'chatbot' : 'landing'),
        origenDetalle: body.origenDetalle || '',
        paginaOrigen: body.paginaOrigen || req.headers.get('referer') || '',
        estado: 'nuevo',
        etapa: 'contacto_inicial',
        puntuacion: puntuacionInicial,
        temperatura: temperaturaInicial,
        tipoNegocio: body.tipoNegocio || '',
        verticalesInteres: body.verticalesInteres || [],
        numeroUnidades: body.numeroUnidades ? parseInt(body.numeroUnidades) : null,
        presupuestoMensual: body.presupuestoMensual ? parseFloat(body.presupuestoMensual) : null,
        urgencia: body.urgencia || 'media',
        notas: body.notas || body.mensaje || '',
        probabilidadCierre: probabilidadInicial,
        conversacionId: body.conversacionId || '',
        mensajeInicial: body.mensajeInicial || body.mensaje || '',
        preguntasFrecuentes: body.preguntasFrecuentes || [],
        ultimoContacto: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      lead,
      message: 'Lead capturado correctamente',
    }, { status: 201 });
  } catch (error) {
    logger.error('Error capturing lead:', error);
    return NextResponse.json(
      { error: 'Error al capturar lead', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} // handleCaptureLead
