/**
 * Endpoints API para Proveedores
 * 
 * Implementa operaciones CRUD con validación Zod, manejo de errores
 * y códigos de estado HTTP correctos.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requirePermission, forbiddenResponse } from '@/lib/permissions';
import logger from '@/lib/logger';
import { providerCreateSchema } from '@/lib/validations';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Lazy Prisma (auditoria V2)
async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

/**
 * GET /api/providers
 * Obtiene todos los proveedores con filtros opcionales
 */
export async function GET(req: NextRequest) {
  const prisma = await getPrisma();
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(req.url);
    
    const tipo = searchParams.get('tipo');
    const search = searchParams.get('search');

    const where: any = { companyId: user.companyId };
    
    if (tipo) {
      where.tipo = tipo;
    }
    
    if (search) {
      where.OR = [
        { nombre: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { telefono: { contains: search } },
      ];
    }

    const providers = await prisma.provider.findMany({
      where,
      include: {
        _count: {
          select: {
            maintenanceRequests: true,
            expenses: true,
          },
        },
      },
      orderBy: { nombre: 'asc' },
    });

    logger.info(`Proveedores obtenidos: ${providers.length}`, { userId: user.id });
    return NextResponse.json(providers, { status: 200 });
    
  } catch (error: any) {
    const errorMessage = error?.message || 'Error desconocido';
    const errorStack = error?.stack || '';
    logger.error('Error fetching providers:', { message: errorMessage, stack: errorStack.slice(0, 500) });
    
    if (errorMessage === 'No autenticado') {
      return NextResponse.json(
        { error: 'No autenticado', message: 'Debe iniciar sesión' },
        { status: 401 }
      );
    }
    if (errorMessage === 'Usuario inactivo') {
      return NextResponse.json(
        { error: 'Usuario inactivo', message: 'Su cuenta está inactiva' },
        { status: 403 }
      );
    }
    
    return NextResponse.json(
      { error: 'Error interno del servidor', message: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * POST /api/providers
 * Crea un nuevo proveedor con validación Zod
 */
export async function POST(req: NextRequest) {
  const prisma = await getPrisma();
  try {
    const user = await requirePermission('create');
    const body = await req.json();

    // Validación con Zod
    const validatedData = providerCreateSchema.parse(body);

    // Verificar si ya existe un proveedor con el mismo email
    if (validatedData.email) {
      const existingEmail = await prisma.provider.findFirst({
        where: {
          companyId: user.companyId,
          email: validatedData.email,
        },
      });
      
      if (existingEmail) {
        return NextResponse.json(
          { error: 'Proveedor duplicado', message: 'Ya existe un proveedor con este email' },
          { status: 409 }
        );
      }
    }

    // Hash password if provided (for provider portal access)
    let hashedPassword: string | undefined;
    if (body.portalPassword) {
      const bcrypt = await import('bcryptjs');
      hashedPassword = await bcrypt.hash(body.portalPassword, 10);
    }

    const provider = await prisma.provider.create({
      data: {
        companyId: user.companyId,
        nombre: validatedData.nombre,
        email: validatedData.email,
        telefono: validatedData.telefono,
        direccion: validatedData.direccion,
        tipo: validatedData.tipo,
        notas: validatedData.notas,
        rating: validatedData.rating,
        ...(hashedPassword && { password: hashedPassword }),
      } as any,
    });

    // Send welcome email with portal credentials if password was set
    if (hashedPassword && validatedData.email) {
      try {
        const nodemailer = await import('nodemailer');
        const transporter = nodemailer.default.createTransport({
          host: process.env.SMTP_HOST || 'smtp.gmail.com',
          port: parseInt(process.env.SMTP_PORT || '587'),
          secure: process.env.SMTP_SECURE === 'true',
          auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
        });

        const company = await prisma.company.findUnique({
          where: { id: user.companyId },
          select: { nombre: true },
        });

        await transporter.sendMail({
          from: process.env.SMTP_FROM || process.env.SMTP_USER,
          to: validatedData.email,
          subject: `${company?.nombre || 'Inmova'} - Acceso a tu Portal de Proveedor`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #059669, #10B981); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 24px;">🔧 Portal del Proveedor</h1>
                <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0;">Tu acceso está listo</p>
              </div>
              <div style="background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
                <p style="color: #334155; font-size: 16px;">Hola <strong>${validatedData.nombre}</strong>,</p>
                <p style="color: #475569;">Se ha creado tu acceso al Portal de Proveedores de <strong>${company?.nombre || 'Inmova'}</strong>. Desde aquí podrás gestionar órdenes de trabajo, presupuestos, facturas y comunicarte directamente con tu administrador.</p>
                
                <div style="background: white; border: 2px solid #059669; border-radius: 8px; padding: 20px; margin: 20px 0;">
                  <h3 style="color: #059669; margin: 0 0 12px;">Tus credenciales de acceso:</h3>
                  <p style="margin: 4px 0; color: #334155;">📧 <strong>Email:</strong> ${validatedData.email}</p>
                  <p style="margin: 4px 0; color: #334155;">🔑 <strong>Contraseña:</strong> ${body.portalPassword}</p>
                  <p style="margin: 12px 0 0; font-size: 13px; color: #64748b;">⚠️ Te recomendamos cambiar tu contraseña después del primer acceso.</p>
                </div>
                
                <div style="text-align: center; margin: 24px 0;">
                  <a href="https://inmovaapp.com/portal-proveedor/login" 
                     style="background: #059669; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">
                    Acceder al Portal
                  </a>
                </div>
                
                <p style="color: #94a3b8; font-size: 12px; text-align: center; margin-top: 24px;">
                  Este email fue enviado por ${company?.nombre || 'Inmova'}.
                </p>
              </div>
            </div>
          `,
        });
        logger.info('Welcome email sent to provider', { email: validatedData.email, providerId: provider.id });
      } catch (emailError: any) {
        logger.error('Failed to send provider welcome email:', { error: emailError.message });
      }
    }

    logger.info(`Proveedor creado: ${provider.id}`, { userId: user.id, providerId: provider.id });
    return NextResponse.json({ ...provider, portalAccessEnabled: !!hashedPassword, welcomeEmailSent: !!hashedPassword }, { status: 201 });
    
  } catch (error: any) {
    logger.error('Error creating provider:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Validación fallida',
          message: 'Los datos proporcionados no son válidos',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    if (error.message?.includes('permiso')) {
      return NextResponse.json(
        { error: 'Prohibido', message: error.message },
        { status: 403 }
      );
    }
    
    if (error.message === 'No autenticado') {
      return NextResponse.json(
        { error: 'No autenticado', message: 'Debe iniciar sesión' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Error interno del servidor', message: 'Error al crear proveedor' },
      { status: 500 }
    );
  }
}
