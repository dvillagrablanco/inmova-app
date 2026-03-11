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
    const stringValue = (value: unknown): string => (typeof value === 'string' ? value : '');
    const stringArrayValue = (value: unknown): string[] =>
      Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
    const numberValue = (value: unknown): number | null => {
      if (typeof value === 'number' && Number.isFinite(value)) return value;
      if (typeof value === 'string' && value.trim()) {
        const parsedNumber = Number(value);
        return Number.isFinite(parsedNumber) ? parsedNumber : null;
      }
      return null;
    };

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
      hasEmail: !!body.email,
      hasTelefono: !!(body.telefono || body.phone),
      hasEmpresa: !!(body.empresa || body.company),
      hasCargo: !!body.cargo,
      hasCiudad: !!body.ciudad,
      hasPresupuesto: numberValue(body.presupuestoMensual) !== null,
      contactosRealizados: 0,
      urgencia: stringValue(body.urgencia) || 'media',
    };

    const puntuacionInicial = calculateLeadScoring(leadData);
    const probabilidadInicial = calculateProbabilidadCierre(puntuacionInicial, 'nuevo');
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
          nombre: stringValue(body.nombre) || stringValue(body.name) || existingLead.nombre,
          apellidos: stringValue(body.apellidos) || existingLead.apellidos,
          telefono: stringValue(body.telefono) || stringValue(body.phone) || existingLead.telefono,
          empresa: stringValue(body.empresa) || stringValue(body.company) || existingLead.empresa,
          cargo: stringValue(body.cargo) || existingLead.cargo,
          paginaOrigen: stringValue(body.paginaOrigen) || existingLead.paginaOrigen,
          verticalesInteres: stringArrayValue(body.verticalesInteres).length
            ? stringArrayValue(body.verticalesInteres)
            : existingLead.verticalesInteres,
          presupuestoMensual: numberValue(body.presupuestoMensual) ?? existingLead.presupuestoMensual,
          numeroUnidades:
            (numberValue(body.numeroUnidades) !== null
              ? Math.trunc(numberValue(body.numeroUnidades) as number)
              : existingLead.numeroUnidades),
          conversacionId: stringValue(body.conversacionId) || existingLead.conversacionId,
          mensajeInicial:
            stringValue(body.mensajeInicial) || stringValue(body.mensaje) || existingLead.mensajeInicial,
          preguntasFrecuentes: stringArrayValue(body.preguntasFrecuentes).length
            ? stringArrayValue(body.preguntasFrecuentes)
            : existingLead.preguntasFrecuentes,
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
        nombre: stringValue(body.nombre) || stringValue(body.name) || '',
        apellidos: stringValue(body.apellidos) || '',
        email: body.email,
        telefono: stringValue(body.telefono) || stringValue(body.phone) || '',
        empresa: stringValue(body.empresa) || stringValue(body.company) || '',
        cargo: stringValue(body.cargo) || '',
        direccion: stringValue(body.direccion) || '',
        ciudad: stringValue(body.ciudad) || '',
        codigoPostal: stringValue(body.codigoPostal) || '',
        pais: stringValue(body.pais) || 'España',
        fuente: stringValue(body.fuente) || (stringValue(body.conversacionId) ? 'chatbot' : 'landing'),
        origenDetalle: stringValue(body.origenDetalle) || '',
        paginaOrigen: stringValue(body.paginaOrigen) || req.headers.get('referer') || '',
        estado: 'nuevo',
        etapa: 'contacto_inicial',
        puntuacion: puntuacionInicial,
        temperatura: temperaturaInicial,
        tipoNegocio: stringValue(body.tipoNegocio) || '',
        verticalesInteres: stringArrayValue(body.verticalesInteres),
        numeroUnidades:
          numberValue(body.numeroUnidades) !== null
            ? Math.trunc(numberValue(body.numeroUnidades) as number)
            : null,
        presupuestoMensual: numberValue(body.presupuestoMensual),
        urgencia: stringValue(body.urgencia) || 'media',
        notas: stringValue(body.notas) || stringValue(body.mensaje) || '',
        probabilidadCierre: probabilidadInicial,
        conversacionId: stringValue(body.conversacionId) || '',
        mensajeInicial: stringValue(body.mensajeInicial) || stringValue(body.mensaje) || '',
        preguntasFrecuentes: stringArrayValue(body.preguntasFrecuentes),
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
