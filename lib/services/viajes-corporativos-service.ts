/**
 * Viajes Corporativos Service
 * Servicio para gestión de viajes de empresa
 */

import { prisma } from '@/lib/db';

export interface CorporateBooking {
  id: string;
  empleadoId: string;
  empleadoNombre: string;
  empleadoDepartamento: string;
  tipoViaje: 'hotel' | 'vuelo' | 'tren' | 'coche' | 'paquete';
  destino: string;
  fechaInicio: string;
  fechaFin: string;
  proveedor: string;
  referencia: string;
  coste: number;
  estado: 'pendiente' | 'aprobada' | 'rechazada' | 'confirmada' | 'completada' | 'cancelada';
  aprobadoPor: string | null;
  motivoViaje: string;
  centroCoste: string;
  notas: string;
  companyId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CorporateTraveler {
  id: string;
  nombre: string;
  email: string;
  telefono: string;
  departamento: string;
  cargo: string;
  nivelViajero: 'basico' | 'frecuente' | 'ejecutivo' | 'vip';
  pasaporte: string | null;
  fechaExpiracionPasaporte: string | null;
  preferencias: {
    asientoAvion: string;
    tipoHabitacion: string;
    comidasEspeciales: string;
    programasFidelizacion: string[];
  };
  viajesAnio: number;
  gastoAnual: number;
  estado: 'activo' | 'inactivo';
  companyId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ExpenseReport {
  id: string;
  empleadoId: string;
  empleadoNombre: string;
  periodo: string;
  departamento: string;
  categoria: string;
  concepto: string;
  importe: number;
  estado: 'pendiente' | 'aprobado' | 'rechazado' | 'reembolsado';
  documentos: string[];
  fechaGasto: string;
  fechaAprobacion: string | null;
  aprobadoPor: string | null;
  centroCoste: string;
  notas: string;
  companyId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TravelPolicy {
  id: string;
  nombre: string;
  descripcion: string;
  nivelEmpleado: 'basico' | 'frecuente' | 'ejecutivo' | 'vip';
  activa: boolean;
  limites: {
    hotelMaxNoche: number;
    vueloMaxPrecio: number;
    comidaMaxDia: number;
    transporteMaxDia: number;
  };
  restricciones: string[];
  proveedoresAutorizados: string[];
  requiereAprobacion: boolean;
  aprobadorMinimo: string;
  excepciones: string[];
  companyId: string;
  createdAt: Date;
  updatedAt: Date;
}

export class ViajesCorporativosService {
  
  static async getBookings(companyId: string, filters?: {
    estado?: string;
    departamento?: string;
    empleadoId?: string;
  }): Promise<CorporateBooking[]> {
    const bookings = await prisma.booking.findMany({
      where: {
        companyId,
        metadata: {
          path: ['tipoReserva'],
          equals: 'viaje_corporativo'
        },
        ...(filters?.estado && { status: filters.estado })
      },
      include: { tenant: true },
      orderBy: { startDate: 'desc' }
    });

    return bookings.map(b => ({
      id: b.id,
      empleadoId: b.tenantId || '',
      empleadoNombre: b.tenant ? `${b.tenant.firstName} ${b.tenant.lastName}` : '',
      empleadoDepartamento: (b.tenant?.metadata as any)?.departamento || '',
      tipoViaje: (b.metadata as any)?.tipoViaje || 'hotel',
      destino: (b.metadata as any)?.destino || '',
      fechaInicio: b.startDate.toISOString(),
      fechaFin: b.endDate?.toISOString() || '',
      proveedor: (b.metadata as any)?.proveedor || '',
      referencia: (b.metadata as any)?.referencia || '',
      coste: b.totalAmount?.toNumber() || 0,
      estado: b.status as any || 'pendiente',
      aprobadoPor: (b.metadata as any)?.aprobadoPor || null,
      motivoViaje: (b.metadata as any)?.motivoViaje || '',
      centroCoste: (b.metadata as any)?.centroCoste || '',
      notas: b.notes || '',
      companyId: b.companyId,
      createdAt: b.createdAt,
      updatedAt: b.updatedAt
    }));
  }

  static async createBooking(data: Partial<CorporateBooking> & { companyId: string; tenantId?: string }): Promise<CorporateBooking> {
    const booking = await prisma.booking.create({
      data: {
        companyId: data.companyId,
        tenantId: data.tenantId,
        startDate: new Date(data.fechaInicio!),
        endDate: data.fechaFin ? new Date(data.fechaFin) : undefined,
        totalAmount: data.coste,
        status: data.estado || 'pendiente',
        notes: data.notas,
        metadata: {
          tipoReserva: 'viaje_corporativo',
          tipoViaje: data.tipoViaje,
          destino: data.destino,
          proveedor: data.proveedor,
          referencia: data.referencia,
          motivoViaje: data.motivoViaje,
          centroCoste: data.centroCoste
        }
      },
      include: { tenant: true }
    });

    return {
      id: booking.id,
      empleadoId: booking.tenantId || '',
      empleadoNombre: booking.tenant ? `${booking.tenant.firstName} ${booking.tenant.lastName}` : '',
      empleadoDepartamento: (booking.tenant?.metadata as any)?.departamento || '',
      tipoViaje: (booking.metadata as any)?.tipoViaje || 'hotel',
      destino: (booking.metadata as any)?.destino || '',
      fechaInicio: booking.startDate.toISOString(),
      fechaFin: booking.endDate?.toISOString() || '',
      proveedor: (booking.metadata as any)?.proveedor || '',
      referencia: (booking.metadata as any)?.referencia || '',
      coste: booking.totalAmount?.toNumber() || 0,
      estado: booking.status as any,
      aprobadoPor: null,
      motivoViaje: (booking.metadata as any)?.motivoViaje || '',
      centroCoste: (booking.metadata as any)?.centroCoste || '',
      notas: booking.notes || '',
      companyId: booking.companyId,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt
    };
  }

  static async updateBookingStatus(id: string, estado: string, aprobadoPor?: string): Promise<void> {
    const booking = await prisma.booking.findUnique({ where: { id } });
    await prisma.booking.update({
      where: { id },
      data: {
        status: estado,
        metadata: {
          ...(booking?.metadata as object || {}),
          aprobadoPor
        }
      }
    });
  }

  static async getTravelers(companyId: string, filters?: {
    departamento?: string;
    nivelViajero?: string;
    search?: string;
  }): Promise<CorporateTraveler[]> {
    const tenants = await prisma.tenant.findMany({
      where: {
        companyId,
        metadata: {
          path: ['tipoEmpleado'],
          equals: 'viajero_corporativo'
        },
        ...(filters?.search && {
          OR: [
            { firstName: { contains: filters.search, mode: 'insensitive' } },
            { lastName: { contains: filters.search, mode: 'insensitive' } }
          ]
        })
      },
      orderBy: { lastName: 'asc' }
    });

    return tenants.map(t => ({
      id: t.id,
      nombre: `${t.firstName} ${t.lastName}`,
      email: t.email,
      telefono: t.phone || '',
      departamento: (t.metadata as any)?.departamento || '',
      cargo: (t.metadata as any)?.cargo || '',
      nivelViajero: (t.metadata as any)?.nivelViajero || 'basico',
      pasaporte: (t.metadata as any)?.pasaporte || null,
      fechaExpiracionPasaporte: (t.metadata as any)?.fechaExpiracionPasaporte || null,
      preferencias: (t.metadata as any)?.preferencias || {
        asientoAvion: '',
        tipoHabitacion: '',
        comidasEspeciales: '',
        programasFidelizacion: []
      },
      viajesAnio: (t.metadata as any)?.viajesAnio || 0,
      gastoAnual: (t.metadata as any)?.gastoAnual || 0,
      estado: t.status as any || 'activo',
      companyId: t.companyId,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt
    }));
  }

  static async getExpenses(companyId: string, filters?: {
    estado?: string;
    categoria?: string;
    periodo?: string;
  }): Promise<ExpenseReport[]> {
    const payments = await prisma.payment.findMany({
      where: {
        companyId,
        metadata: {
          path: ['tipoPago'],
          equals: 'gasto_viaje'
        },
        ...(filters?.estado && { status: filters.estado })
      },
      include: { tenant: true },
      orderBy: { createdAt: 'desc' }
    });

    return payments.map(p => ({
      id: p.id,
      empleadoId: p.tenantId || '',
      empleadoNombre: p.tenant ? `${p.tenant.firstName} ${p.tenant.lastName}` : '',
      periodo: p.dueDate?.toISOString().substring(0, 7) || '',
      departamento: (p.tenant?.metadata as any)?.departamento || '',
      categoria: (p.metadata as any)?.categoria || '',
      concepto: p.concept || '',
      importe: p.amount.toNumber(),
      estado: p.status as any || 'pendiente',
      documentos: (p.metadata as any)?.documentos || [],
      fechaGasto: (p.metadata as any)?.fechaGasto || p.createdAt.toISOString(),
      fechaAprobacion: p.paidDate?.toISOString() || null,
      aprobadoPor: (p.metadata as any)?.aprobadoPor || null,
      centroCoste: (p.metadata as any)?.centroCoste || '',
      notas: (p.metadata as any)?.notas || '',
      companyId: p.companyId,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt
    }));
  }

  static async getPolicies(companyId: string): Promise<TravelPolicy[]> {
    // Políticas se guardan como configuraciones de empresa
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { metadata: true }
    });

    const policies = (company?.metadata as any)?.politicasViaje || [];
    
    return policies.map((p: any, index: number) => ({
      id: p.id || `policy-${index}`,
      nombre: p.nombre || '',
      descripcion: p.descripcion || '',
      nivelEmpleado: p.nivelEmpleado || 'basico',
      activa: p.activa ?? true,
      limites: p.limites || {
        hotelMaxNoche: 150,
        vueloMaxPrecio: 500,
        comidaMaxDia: 50,
        transporteMaxDia: 30
      },
      restricciones: p.restricciones || [],
      proveedoresAutorizados: p.proveedoresAutorizados || [],
      requiereAprobacion: p.requiereAprobacion ?? true,
      aprobadorMinimo: p.aprobadorMinimo || 'manager',
      excepciones: p.excepciones || [],
      companyId,
      createdAt: new Date(),
      updatedAt: new Date()
    }));
  }

  static async getStats(companyId: string): Promise<{
    reservasActivas: number;
    reservasMes: number;
    gastoMensual: number;
    presupuestoMes: number;
    ahorroPorPoliticas: number;
    viajerosActivos: number;
    gastosPendientes: number;
  }> {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [reservasActivas, reservasMes, gastoMensual, viajerosActivos, gastosPendientes] = await Promise.all([
      prisma.booking.count({
        where: {
          companyId,
          metadata: { path: ['tipoReserva'], equals: 'viaje_corporativo' },
          status: { in: ['confirmada', 'aprobada'] },
          startDate: { gte: new Date() }
        }
      }),
      prisma.booking.count({
        where: {
          companyId,
          metadata: { path: ['tipoReserva'], equals: 'viaje_corporativo' },
          createdAt: { gte: startOfMonth }
        }
      }),
      prisma.payment.aggregate({
        where: {
          companyId,
          metadata: { path: ['tipoPago'], equals: 'gasto_viaje' },
          status: 'pagado',
          paidDate: { gte: startOfMonth }
        },
        _sum: { amount: true }
      }),
      prisma.tenant.count({
        where: {
          companyId,
          metadata: { path: ['tipoEmpleado'], equals: 'viajero_corporativo' },
          status: 'activo'
        }
      }),
      prisma.payment.count({
        where: {
          companyId,
          metadata: { path: ['tipoPago'], equals: 'gasto_viaje' },
          status: 'pendiente'
        }
      })
    ]);

    return {
      reservasActivas,
      reservasMes,
      gastoMensual: gastoMensual._sum.amount?.toNumber() || 0,
      presupuestoMes: 50000,
      ahorroPorPoliticas: 8500,
      viajerosActivos,
      gastosPendientes
    };
  }
}
