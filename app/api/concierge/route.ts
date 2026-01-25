/**
 * API Endpoint: Servicios de Concierge
 * Utiliza el modelo ColivingService existente
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { z } from 'zod';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const createServiceSchema = z.object({
  nombre: z.string().min(2),
  descripcion: z.string(),
  categoria: z.string(),
  icono: z.string().optional(),
  precioBase: z.number().min(0),
  unidad: z.string().default('servicio'),
  duracion: z.number().optional(),
  disponible: z.boolean().default(true),
  proveedorExterno: z.string().optional(),
  contactoProveedor: z.string().optional(),
  imagenes: z.array(z.string()).default([]),
  requisitos: z.string().optional(),
});

const createBookingSchema = z.object({
  serviceId: z.string(),
  fechaServicio: z.string(),
  horaInicio: z.string(),
  duracion: z.number().default(60),
  ubicacion: z.string(),
  notas: z.string().optional(),
  instruccionesEspeciales: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const companyId = session.user.companyId;
    if (!companyId) {
      return NextResponse.json({ error: 'Company ID no encontrado' }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const categoria = searchParams.get('categoria');
    const tipo = searchParams.get('tipo'); // 'services' o 'bookings'

    const { prisma } = await import('@/lib/db');

    if (tipo === 'bookings') {
      // Obtener reservas de servicios
      const bookings = await prisma.colivingServiceBooking.findMany({
        where: { companyId },
        include: {
          service: true,
          tenant: {
            select: { nombreCompleto: true, telefono: true },
          },
        },
        orderBy: { fechaServicio: 'desc' },
        take: 100,
      });

      return NextResponse.json({
        success: true,
        data: bookings,
      });
    }

    // Obtener servicios
    const services = await prisma.colivingService.findMany({
      where: {
        companyId,
        ...(categoria && { categoria }),
      },
      include: {
        _count: {
          select: { reservas: true },
        },
      },
      orderBy: [{ categoria: 'asc' }, { nombre: 'asc' }],
    });

    // Categorías únicas
    const categorias = [...new Set(services.map(s => s.categoria))];

    // Stats
    const stats = {
      totalServicios: services.length,
      serviciosActivos: services.filter(s => s.disponible).length,
      categorias: categorias.length,
      reservasTotal: services.reduce((sum, s) => sum + s._count.reservas, 0),
    };

    return NextResponse.json({
      success: true,
      data: services,
      categorias,
      stats,
    });
  } catch (error: any) {
    logger.error('Error fetching concierge services:', error);
    return NextResponse.json({ error: 'Error al obtener servicios' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const companyId = session.user.companyId;
    if (!companyId) {
      return NextResponse.json({ error: 'Company ID no encontrado' }, { status: 400 });
    }

    const body = await req.json();
    const { prisma } = await import('@/lib/db');

    // Determinar si es creación de servicio o reserva
    if (body.serviceId) {
      // Crear reserva
      const validationResult = createBookingSchema.safeParse(body);
      if (!validationResult.success) {
        return NextResponse.json({
          error: 'Datos inválidos',
          details: validationResult.error.errors,
        }, { status: 400 });
      }

      const data = validationResult.data;

      // Verificar que el servicio existe
      const service = await prisma.colivingService.findFirst({
        where: { id: data.serviceId, companyId },
      });

      if (!service) {
        return NextResponse.json({ error: 'Servicio no encontrado' }, { status: 404 });
      }

      // Obtener tenant del usuario actual
      const tenant = await prisma.tenant.findFirst({
        where: { companyId, email: session.user.email },
      });

      if (!tenant) {
        return NextResponse.json({ error: 'Tenant no encontrado' }, { status: 404 });
      }

      const booking = await prisma.colivingServiceBooking.create({
        data: {
          serviceId: data.serviceId,
          tenantId: tenant.id,
          companyId,
          fechaServicio: new Date(data.fechaServicio),
          horaInicio: data.horaInicio,
          duracion: data.duracion,
          ubicacion: data.ubicacion,
          precioTotal: service.precioBase,
          notas: data.notas,
          instruccionesEspeciales: data.instruccionesEspeciales,
          estado: 'pendiente',
        },
        include: { service: true },
      });

      return NextResponse.json({
        success: true,
        data: booking,
        message: 'Reserva creada exitosamente',
      }, { status: 201 });
    } else {
      // Crear servicio
      const validationResult = createServiceSchema.safeParse(body);
      if (!validationResult.success) {
        return NextResponse.json({
          error: 'Datos inválidos',
          details: validationResult.error.errors,
        }, { status: 400 });
      }

      const data = validationResult.data;

      const service = await prisma.colivingService.create({
        data: {
          companyId,
          ...data,
        },
      });

      logger.info('Concierge service created', { serviceId: service.id, companyId });

      return NextResponse.json({
        success: true,
        data: service,
        message: 'Servicio creado exitosamente',
      }, { status: 201 });
    }
  } catch (error: any) {
    logger.error('Error creating concierge service/booking:', error);
    return NextResponse.json({ error: 'Error al crear' }, { status: 500 });
  }
}
