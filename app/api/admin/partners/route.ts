import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { z } from 'zod';
import type { Prisma } from '@/types/prisma-types';

import logger from '@/lib/logger';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/admin/partners
 * Lista todos los partners
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !['super_admin', 'administrador'].includes(session.user.role)) {
      // Retornar datos vacíos en lugar de error para mejor UX
      return NextResponse.json({
        success: true,
        partners: [],
        stats: { total: 0, pending: 0, active: 0, totalClients: 0, totalEarned: 0 },
        _authRequired: true,
      });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const tipo = searchParams.get('tipo');

    const { getPrismaClient } = await import('@/lib/db');
    const prisma = getPrismaClient();

    const where: Prisma.PartnerWhereInput = {};
    if (status && status !== 'all') {
      where.estado = status;
    }
    if (tipo && tipo !== 'all') {
      where.tipo = tipo;
    }

    const partners = await prisma.partner.findMany({
      where,
      include: {
        _count: {
          select: {
            clientes: true,
            comisiones: true,
          },
        },
        comisiones: {
          where: { estado: 'PAID' },
          select: { montoComision: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Formatear respuesta
    const formattedPartners = partners.map((partner) => ({
      id: partner.id,
      name: partner.nombre,
      email: partner.email,
      phone: partner.contactoTelefono,
      company: partner.razonSocial,
      website: partner.dominioPersonalizado,
      type: partner.tipo,
      status: partner.estado,
      referralCode: partner.slug || partner.id.substring(0, 8).toUpperCase(),
      totalClients: partner._count.clientes,
      totalEarned: partner.comisiones.reduce((sum, c) => sum + c.montoComision, 0),
      commissionRate: partner.comisionPorcentaje,
      level: getPartnerLevel(partner._count.clientes),
      createdAt: partner.createdAt.toISOString(),
      activo: partner.activo,
    }));

    // Estadísticas
    const stats = {
      total: partners.length,
      pending: partners.filter((p) => p.estado === 'PENDING').length,
      active: partners.filter((p) => p.estado === 'ACTIVE').length,
      totalClients: partners.reduce((sum, p) => sum + p._count.clientes, 0),
      totalEarned: partners.reduce(
        (sum, p) => sum + p.comisiones.reduce((s, c) => s + c.montoComision, 0),
        0
      ),
    };

    return NextResponse.json({
      success: true,
      partners: formattedPartners,
      stats,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    logger.error('[Partners API Error]:', { message });
    // Retornar lista vacía en lugar de error para mejor UX
    return NextResponse.json({
      success: true,
      partners: [],
      stats: { total: 0, pending: 0, active: 0, totalClients: 0, totalEarned: 0 },
      _error: 'Error al cargar partners',
    });
  }
}

/**
 * POST /api/admin/partners
 * Crear nuevo partner
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !['super_admin', 'administrador'].includes(session.user.role)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();

    const schema = z.object({
      nombre: z.string().min(2).max(100),
      razonSocial: z.string().min(2).max(200),
      cif: z.string().min(9).max(15),
      tipo: z.enum(['BANCO', 'MULTIFAMILY_OFFICE', 'PLATAFORMA_MEMBRESIA', 'ASOCIACION', 'CONSULTORA', 'INMOBILIARIA', 'OTRO']),
      contactoNombre: z.string().min(2).max(100),
      contactoEmail: z.string().email(),
      contactoTelefono: z.string().optional(),
      email: z.string().email(),
      comisionPorcentaje: z.number().min(0).max(100).default(20),
      dominioPersonalizado: z.string().optional(),
      slug: z.string().optional(),
      notas: z.string().optional(),
    });

    const validated = schema.parse(body);

    const { getPrismaClient } = await import('@/lib/db');
    const prisma = getPrismaClient();

    // Verificar que no existe un partner con el mismo CIF o email
    const existing = await prisma.partner.findFirst({
      where: {
        OR: [
          { cif: validated.cif },
          { email: validated.email },
          { contactoEmail: validated.contactoEmail },
        ],
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Ya existe un partner con ese CIF o email' },
        { status: 400 }
      );
    }

    // Generar slug si no se proporciona
    const slug = validated.slug || generateSlug(validated.nombre);

    // Generar password temporal
    const bcrypt = await import('bcryptjs');
    const tempPassword = generateTempPassword();
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    const partner = await prisma.partner.create({
      data: {
        nombre: validated.nombre,
        razonSocial: validated.razonSocial,
        cif: validated.cif,
        tipo: validated.tipo,
        contactoNombre: validated.contactoNombre,
        contactoEmail: validated.contactoEmail,
        contactoTelefono: validated.contactoTelefono,
        email: validated.email,
        password: hashedPassword,
        comisionPorcentaje: validated.comisionPorcentaje,
        dominioPersonalizado: validated.dominioPersonalizado,
        slug,
        notas: validated.notas,
        estado: 'PENDING',
        activo: true,
      },
    });

    return NextResponse.json({
      success: true,
      partner: {
        id: partner.id,
        name: partner.nombre,
        email: partner.email,
        status: partner.estado,
        referralCode: partner.slug || partner.id.substring(0, 8).toUpperCase(),
      },
      tempPassword, // Solo en creación - para enviar al partner
    }, { status: 201 });
  } catch (error: any) {
    logger.error('[Partners POST Error]:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Datos inválidos',
        details: error.errors,
      }, { status: 400 });
    }

    return NextResponse.json(
      { error: 'Error al crear partner', message: error.message },
      { status: 500 }
    );
  }
}

// Helper functions
function getPartnerLevel(clientCount: number): string {
  if (clientCount >= 50) return 'PLATINUM';
  if (clientCount >= 25) return 'GOLD';
  if (clientCount >= 10) return 'SILVER';
  return 'BRONZE';
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 30);
}

function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}
