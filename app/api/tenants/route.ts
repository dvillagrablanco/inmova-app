import { NextRequest, NextResponse } from 'next/server';

import {
  requireAuth,
  requirePermission,
  forbiddenResponse,
  badRequestResponse,
} from '@/lib/permissions';
import logger, { logError } from '@/lib/logger';
import { tenantCreateSchema } from '@/lib/validations';
import { resolveCompanyScope } from '@/lib/company-scope';
import * as Sentry from '@sentry/nextjs';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Lazy Prisma loading (auditoria 2026-02-11)
async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

export async function GET(req: NextRequest) {
  const prisma = await getPrisma();
  try {
    const user = await requireAuth();
    const scope = await resolveCompanyScope({
      userId: user.id,
      role: user.role as any,
      primaryCompanyId: user.companyId,
      request: req,
    });

    // Obtener parámetros de paginación
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;
    if (!scope.activeCompanyId) {
      return NextResponse.json([]);
    }

    const whereClause = { companyId: { in: scope.scopeCompanyIds } };

    // Si no hay paginación solicitada, devolver todos (compatibilidad)
    const usePagination = searchParams.has('page') || searchParams.has('limit');

    if (!usePagination) {
      const tenants = await prisma.tenant.findMany({
        where: whereClause,
        include: {
          units: {
            include: {
              building: true,
            },
          },
          contracts: {
            where: { estado: 'activo' },
          },
          company: {
            select: { id: true, nombre: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: scope.scopeCompanyIds.length > 1 ? 5000 : undefined,
      });
      return NextResponse.json(tenants);
    }

    // Paginación activada
    const [tenants, total] = await Promise.all([
      prisma.tenant.findMany({
        where: whereClause,
        include: {
          units: {
            include: {
              building: true,
            },
          },
          contracts: {
            where: { estado: 'activo' },
          },
          company: {
            select: { id: true, nombre: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.tenant.count({
        where: whereClause,
      }),
    ]);

    return NextResponse.json({
      data: tenants,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + limit < total,
      },
    });
  } catch (error: any) {
    if (error?.name === 'AuthError' || error?.statusCode === 401 || error?.statusCode === 403) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode || 401 });
    }
    const errorMessage = error?.message || 'Error desconocido';
    const errorStack = error?.stack || '';
    logger.error('Error fetching tenants:', {
      message: errorMessage,
      stack: errorStack.slice(0, 500),
    });
    Sentry.captureException(error);

    if (errorMessage === 'No autenticado') {
      return NextResponse.json({ error: errorMessage }, { status: 401 });
    }
    if (errorMessage === 'Usuario inactivo') {
      return NextResponse.json({ error: errorMessage }, { status: 403 });
    }
    return NextResponse.json(
      { error: 'Error al obtener inquilinos', details: errorMessage },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const prisma = await getPrisma();
  try {
    const user = await requirePermission('create');
    const scope = await resolveCompanyScope({
      userId: user.id,
      role: user.role as any,
      primaryCompanyId: user.companyId,
      request: req,
    });

    if (!scope.activeCompanyId) {
      return NextResponse.json({ error: 'Empresa no definida' }, { status: 400 });
    }

    const body = await req.json();

    let dataToValidate = { ...body };

    if (body.documentoIdentidad && !body.dni) {
      dataToValidate.dni = body.documentoIdentidad;
    }

    const nombreCompleto = body.nombreCompleto || body.nombre;
    if (nombreCompleto && !body.apellidos) {
      const partes = nombreCompleto.trim().split(' ');
      if (partes.length >= 2) {
        // Si hay 2 o más palabras, la primera es nombre y el resto apellidos
        dataToValidate.nombre = partes[0];
        dataToValidate.apellidos = partes.slice(1).join(' ');
      } else {
        // Si solo hay una palabra, usarla para ambos
        dataToValidate.nombre = nombreCompleto;
        dataToValidate.apellidos = nombreCompleto;
      }
    }

    // Validación con Zod
    const validationResult = tenantCreateSchema.safeParse(dataToValidate);

    if (!validationResult.success) {
      const errors = validationResult.error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      logger.warn('Validation error creating tenant:', { errors });
      return NextResponse.json({ error: 'Datos inv\u00e1lidos', details: errors }, { status: 400 });
    }

    const validatedData = validationResult.data;

    // Combinar nombre y apellidos de vuelta a nombreCompleto para la BD
    const nombreCompletoFinal = `${validatedData.nombre} ${validatedData.apellidos}`.trim();

    // Hash password if provided (for tenant portal access)
    let hashedPassword: string | undefined;
    if (body.portalPassword) {
      const bcrypt = await import('bcryptjs');
      hashedPassword = await bcrypt.hash(body.portalPassword, 10);
    }

    const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const emailFinal = validatedData.email && validatedData.email.trim()
      ? validatedData.email.trim()
      : `tenant-${uniqueSuffix}@pendiente.local`;
    const dniFinal = validatedData.dni && validatedData.dni.trim()
      ? validatedData.dni.trim()
      : `PEND-${uniqueSuffix}`;

    const tenantData = {
      companyId: scope.activeCompanyId,
      nombreCompleto: nombreCompletoFinal,
      dni: dniFinal,
      email: emailFinal,
      telefono: validatedData.telefono || '',
      fechaNacimiento: validatedData.fechaNacimiento
        ? new Date(validatedData.fechaNacimiento)
        : new Date(),
      notas: validatedData.notasInternas || '',
      iban: validatedData.iban,
      bic: validatedData.bic,
      metodoPago: validatedData.metodoPago,
      personaContacto: validatedData.personaContacto,
      ciudad: validatedData.ciudad,
      codigoPostal: validatedData.codigoPostal,
      provincia: validatedData.provincia,
      pais: validatedData.pais,
      ...(hashedPassword && { password: hashedPassword }),
    };

    let tenant;
    let wasUpdated = false;
    try {
      tenant = await prisma.tenant.create({ data: tenantData });
    } catch (createError: any) {
      if (createError?.code === 'P2002') {
        const target = createError?.meta?.target;
        const conflictField = Array.isArray(target) ? target[0] : target;
        logger.info('Tenant unique conflict, attempting upsert', { conflictField, dni: dniFinal, email: emailFinal });

        let existing = null;
        if (conflictField === 'dni' || conflictField === 'email') {
          existing = await prisma.tenant.findFirst({
            where: conflictField === 'dni' ? { dni: dniFinal } : { email: emailFinal },
          });
        }
        if (!existing && dniFinal && !dniFinal.startsWith('PEND-')) {
          existing = await prisma.tenant.findFirst({ where: { dni: dniFinal } });
        }
        if (!existing && emailFinal && !emailFinal.includes('@pendiente.local')) {
          existing = await prisma.tenant.findFirst({ where: { email: emailFinal } });
        }

        if (existing) {
          const { companyId: _c, email: _e, dni: _d, ...updateFields } = tenantData;
          // Si el tenant existente pertenece a una empresa accesible por el usuario,
          // reasignarlo a la empresa activa (resuelve el caso "no aparece en lista
          // tras importar de contabilidad" cuando el grupo tiene varias empresas)
          const reassignCompany =
            existing.companyId &&
            scope.scopeCompanyIds.includes(existing.companyId) &&
            existing.companyId !== scope.activeCompanyId;
          tenant = await prisma.tenant.update({
            where: { id: existing.id },
            data: {
              ...updateFields,
              ...(reassignCompany ? { companyId: scope.activeCompanyId } : {}),
              ...(emailFinal && !emailFinal.includes('@pendiente.local') && { email: emailFinal }),
              ...(dniFinal && !dniFinal.startsWith('PEND-') && { dni: dniFinal }),
            },
          });
          wasUpdated = true;
        } else {
          const fallbackData = {
            ...tenantData,
            email: `tenant-${uniqueSuffix}@pendiente.local`,
            dni: `PEND-${uniqueSuffix}`,
          };
          tenant = await prisma.tenant.create({ data: fallbackData });
        }
      } else {
        throw createError;
      }
    }

    // Send welcome email with portal credentials if password was set
    if (hashedPassword && validatedData.email) {
      try {
        const nodemailer = await import('nodemailer');
        const transporter = nodemailer.default.createTransport({
          host: process.env.SMTP_HOST || 'smtp.gmail.com',
          port: parseInt(process.env.SMTP_PORT || '587'),
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD,
          },
        });

        const company = await prisma.company.findUnique({
          where: { id: scope.activeCompanyId },
          select: { nombre: true },
        });

        await transporter.sendMail({
          from: process.env.SMTP_FROM || process.env.SMTP_USER,
          to: validatedData.email,
          subject: `Bienvenido a ${company?.nombre || 'Inmova'} - Acceso a tu Portal de Inquilino`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #4F46E5, #7C3AED); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 24px;">🏠 Portal del Inquilino</h1>
                <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0;">Tu acceso está listo</p>
              </div>
              <div style="background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
                <p style="color: #334155; font-size: 16px;">Hola <strong>${nombreCompletoFinal}</strong>,</p>
                <p style="color: #475569;">Se ha creado tu acceso al Portal del Inquilino de <strong>${company?.nombre || 'Inmova'}</strong>. Aquí podrás consultar tus pagos, contrato, comunicarte con tu administrador y mucho más.</p>
                
                <div style="background: white; border: 2px solid #4F46E5; border-radius: 8px; padding: 20px; margin: 20px 0;">
                  <h3 style="color: #4F46E5; margin: 0 0 12px;">Tus credenciales de acceso:</h3>
                  <p style="margin: 4px 0; color: #334155;">📧 <strong>Email:</strong> ${validatedData.email}</p>
                  <p style="margin: 4px 0; color: #334155;">🔑 <strong>Contraseña:</strong> ${body.portalPassword}</p>
                  <p style="margin: 12px 0 0; font-size: 13px; color: #64748b;">⚠️ Te recomendamos cambiar tu contraseña después del primer acceso.</p>
                </div>
                
                <div style="text-align: center; margin: 24px 0;">
                  <a href="https://inmovaapp.com/portal-inquilino/login" 
                     style="background: #4F46E5; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">
                    Acceder al Portal
                  </a>
                </div>
                
                <p style="color: #94a3b8; font-size: 12px; text-align: center; margin-top: 24px;">
                  Este email fue enviado por ${company?.nombre || 'Inmova'}. Si no esperabas este mensaje, puedes ignorarlo.
                </p>
              </div>
            </div>
          `,
        });
        logger.info('Welcome email sent to tenant', {
          email: validatedData.email,
          tenantId: tenant.id,
        });
      } catch (emailError: any) {
        // Don't fail tenant creation if email fails
        logger.error('Failed to send welcome email:', {
          error: emailError.message,
          email: validatedData.email,
        });
      }
    }

    return NextResponse.json(
      {
        ...tenant,
        portalAccessEnabled: !!hashedPassword,
        welcomeEmailSent: !!hashedPassword,
        wasUpdated,
      },
      { status: wasUpdated ? 200 : 201 }
    );
  } catch (error: any) {
    if (error?.name === 'AuthError' || error?.statusCode === 401 || error?.statusCode === 403) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode || 401 });
    }
    logger.error('Error creating tenant:', { message: error?.message, code: error?.code, meta: error?.meta });
    Sentry.captureException(error);
    if (error?.code === 'P2002') {
      const field = Array.isArray(error?.meta?.target) ? error.meta.target[0] : 'desconocido';
      return NextResponse.json(
        { error: `Ya existe un inquilino con este ${field === 'email' ? 'correo electrónico' : field === 'dni' ? 'DNI/NIF' : 'dato'}. Se han actualizado sus datos.` },
        { status: 409 }
      );
    }
    if (error.message?.includes('permiso')) {
      return forbiddenResponse(error.message);
    }
    if (error.message === 'No autenticado') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: 'Error al crear inquilino' }, { status: 500 });
  }
}
