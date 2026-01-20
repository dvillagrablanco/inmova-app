/**
 * Workspace/Coworking Service
 * Servicio para gestión de espacios de trabajo compartido
 */

import { prisma } from '@/lib/db';

// Tipos
export interface CoworkingSpace {
  id: string;
  nombre: string;
  tipo: 'hot_desk' | 'dedicated_desk' | 'private_office' | 'meeting_room';
  capacidad: number;
  precio: number;
  precioUnidad: 'hora' | 'dia' | 'mes';
  estado: 'disponible' | 'ocupado' | 'mantenimiento' | 'reservado';
  amenities: string[];
  ubicacion: string;
  planta: number;
  superficie: number;
  descripcion: string;
  companyId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CoworkingBooking {
  id: string;
  espacioId: string;
  espacioNombre: string;
  miembroId: string;
  miembroNombre: string;
  miembroEmpresa: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  duracion: number;
  precio: number;
  estado: 'pendiente' | 'confirmada' | 'cancelada' | 'completada';
  notas: string;
  companyId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CoworkingMember {
  id: string;
  nombre: string;
  email: string;
  telefono: string;
  empresa: string;
  cargo: string;
  plan: 'hot_desk' | 'dedicated' | 'private_office' | 'enterprise';
  estado: 'activo' | 'inactivo' | 'pendiente' | 'suspendido';
  fechaInicio: string;
  fechaFin: string | null;
  creditosDisponibles: number;
  pagosAlDia: boolean;
  foto: string | null;
  companyId: string;
  createdAt: Date;
  updatedAt: Date;
}

export class WorkspaceService {
  
  // ==================== SPACES ====================
  
  static async getSpaces(companyId: string, filters?: {
    tipo?: string;
    estado?: string;
  }): Promise<CoworkingSpace[]> {
    const units = await prisma.unit.findMany({
      where: {
        companyId,
        type: { in: ['coworking_space', 'oficina'] },
        ...(filters?.estado && { status: filters.estado })
      },
      include: { building: true },
      orderBy: { name: 'asc' }
    });

    return units.map(u => ({
      id: u.id,
      nombre: u.name,
      tipo: (u.metadata as any)?.tipoEspacio || 'hot_desk',
      capacidad: (u.metadata as any)?.capacidad || 1,
      precio: u.rentAmount?.toNumber() || 0,
      precioUnidad: (u.metadata as any)?.precioUnidad || 'dia',
      estado: u.status === 'ocupada' ? 'ocupado' : u.status === 'en_mantenimiento' ? 'mantenimiento' : 'disponible',
      amenities: (u.metadata as any)?.amenities || [],
      ubicacion: u.building?.address || '',
      planta: (u.metadata as any)?.planta || 1,
      superficie: u.size || 0,
      descripcion: u.description || '',
      companyId: u.companyId,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt
    }));
  }

  static async createSpace(data: Partial<CoworkingSpace> & { companyId: string; buildingId?: string }): Promise<CoworkingSpace> {
    const unit = await prisma.unit.create({
      data: {
        companyId: data.companyId,
        buildingId: data.buildingId,
        name: data.nombre || '',
        type: 'coworking_space',
        status: data.estado || 'disponible',
        rentAmount: data.precio,
        size: data.superficie,
        description: data.descripcion,
        metadata: {
          tipoEspacio: data.tipo,
          capacidad: data.capacidad,
          precioUnidad: data.precioUnidad,
          amenities: data.amenities,
          planta: data.planta
        }
      },
      include: { building: true }
    });

    return {
      id: unit.id,
      nombre: unit.name,
      tipo: (unit.metadata as any)?.tipoEspacio || 'hot_desk',
      capacidad: (unit.metadata as any)?.capacidad || 1,
      precio: unit.rentAmount?.toNumber() || 0,
      precioUnidad: (unit.metadata as any)?.precioUnidad || 'dia',
      estado: unit.status as any || 'disponible',
      amenities: (unit.metadata as any)?.amenities || [],
      ubicacion: unit.building?.address || '',
      planta: (unit.metadata as any)?.planta || 1,
      superficie: unit.size || 0,
      descripcion: unit.description || '',
      companyId: unit.companyId,
      createdAt: unit.createdAt,
      updatedAt: unit.updatedAt
    };
  }

  static async updateSpaceStatus(id: string, estado: string): Promise<void> {
    await prisma.unit.update({
      where: { id },
      data: { status: estado as any }
    });
  }

  // ==================== BOOKINGS ====================

  static async getBookings(companyId: string, filters?: {
    estado?: string;
    fecha?: string;
    espacioId?: string;
  }): Promise<CoworkingBooking[]> {
    const bookings = await prisma.booking.findMany({
      where: {
        companyId,
        ...(filters?.estado && { status: filters.estado }),
        ...(filters?.espacioId && { unitId: filters.espacioId }),
        ...(filters?.fecha && {
          startDate: {
            gte: new Date(filters.fecha),
            lt: new Date(new Date(filters.fecha).getTime() + 24 * 60 * 60 * 1000)
          }
        })
      },
      include: {
        unit: true,
        tenant: true
      },
      orderBy: { startDate: 'desc' }
    });

    return bookings.map(b => ({
      id: b.id,
      espacioId: b.unitId || '',
      espacioNombre: b.unit?.name || '',
      miembroId: b.tenantId || '',
      miembroNombre: b.tenant ? `${b.tenant.firstName} ${b.tenant.lastName}` : '',
      miembroEmpresa: (b.tenant?.metadata as any)?.empresa || '',
      fecha: b.startDate.toISOString().split('T')[0],
      horaInicio: b.startDate.toISOString().split('T')[1]?.substring(0, 5) || '',
      horaFin: b.endDate?.toISOString().split('T')[1]?.substring(0, 5) || '',
      duracion: b.endDate ? Math.round((b.endDate.getTime() - b.startDate.getTime()) / (1000 * 60 * 60)) : 0,
      precio: b.totalAmount?.toNumber() || 0,
      estado: b.status as any || 'pendiente',
      notas: b.notes || '',
      companyId: b.companyId,
      createdAt: b.createdAt,
      updatedAt: b.updatedAt
    }));
  }

  static async createBooking(data: Partial<CoworkingBooking> & { 
    companyId: string;
    unitId: string;
    tenantId?: string;
  }): Promise<CoworkingBooking> {
    const startDate = new Date(`${data.fecha}T${data.horaInicio || '09:00'}:00`);
    const endDate = data.horaFin ? new Date(`${data.fecha}T${data.horaFin}:00`) : new Date(startDate.getTime() + data.duracion! * 60 * 60 * 1000);

    const booking = await prisma.booking.create({
      data: {
        companyId: data.companyId,
        unitId: data.unitId,
        tenantId: data.tenantId,
        startDate,
        endDate,
        totalAmount: data.precio,
        status: data.estado || 'pendiente',
        notes: data.notas
      },
      include: {
        unit: true,
        tenant: true
      }
    });

    return {
      id: booking.id,
      espacioId: booking.unitId || '',
      espacioNombre: booking.unit?.name || '',
      miembroId: booking.tenantId || '',
      miembroNombre: booking.tenant ? `${booking.tenant.firstName} ${booking.tenant.lastName}` : '',
      miembroEmpresa: (booking.tenant?.metadata as any)?.empresa || '',
      fecha: booking.startDate.toISOString().split('T')[0],
      horaInicio: booking.startDate.toISOString().split('T')[1]?.substring(0, 5) || '',
      horaFin: booking.endDate?.toISOString().split('T')[1]?.substring(0, 5) || '',
      duracion: booking.endDate ? Math.round((booking.endDate.getTime() - booking.startDate.getTime()) / (1000 * 60 * 60)) : 0,
      precio: booking.totalAmount?.toNumber() || 0,
      estado: booking.status as any,
      notas: booking.notes || '',
      companyId: booking.companyId,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt
    };
  }

  static async updateBookingStatus(id: string, estado: string): Promise<void> {
    await prisma.booking.update({
      where: { id },
      data: { status: estado }
    });
  }

  // ==================== MEMBERS ====================

  static async getMembers(companyId: string, filters?: {
    plan?: string;
    estado?: string;
    search?: string;
  }): Promise<CoworkingMember[]> {
    const tenants = await prisma.tenant.findMany({
      where: {
        companyId,
        metadata: {
          path: ['tipoMiembro'],
          equals: 'coworking'
        },
        ...(filters?.estado && { status: filters.estado }),
        ...(filters?.search && {
          OR: [
            { firstName: { contains: filters.search, mode: 'insensitive' } },
            { lastName: { contains: filters.search, mode: 'insensitive' } },
            { email: { contains: filters.search, mode: 'insensitive' } }
          ]
        })
      },
      include: {
        contracts: {
          where: { status: 'activo' },
          take: 1
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return tenants.map(t => ({
      id: t.id,
      nombre: `${t.firstName} ${t.lastName}`,
      email: t.email,
      telefono: t.phone || '',
      empresa: (t.metadata as any)?.empresa || '',
      cargo: (t.metadata as any)?.cargo || '',
      plan: (t.metadata as any)?.plan || 'hot_desk',
      estado: t.status as any || 'activo',
      fechaInicio: t.contracts[0]?.startDate?.toISOString() || t.createdAt.toISOString(),
      fechaFin: t.contracts[0]?.endDate?.toISOString() || null,
      creditosDisponibles: (t.metadata as any)?.creditos || 0,
      pagosAlDia: (t.metadata as any)?.pagosAlDia ?? true,
      foto: (t.metadata as any)?.foto || null,
      companyId: t.companyId,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt
    }));
  }

  static async createMember(data: Partial<CoworkingMember> & { companyId: string }): Promise<CoworkingMember> {
    const [firstName, ...lastNameParts] = (data.nombre || '').split(' ');
    const lastName = lastNameParts.join(' ') || '';

    const tenant = await prisma.tenant.create({
      data: {
        companyId: data.companyId,
        firstName,
        lastName,
        email: data.email || '',
        phone: data.telefono,
        status: data.estado || 'activo',
        metadata: {
          tipoMiembro: 'coworking',
          empresa: data.empresa,
          cargo: data.cargo,
          plan: data.plan,
          creditos: data.creditosDisponibles || 0,
          pagosAlDia: true
        }
      }
    });

    return {
      id: tenant.id,
      nombre: `${tenant.firstName} ${tenant.lastName}`,
      email: tenant.email,
      telefono: tenant.phone || '',
      empresa: (tenant.metadata as any)?.empresa || '',
      cargo: (tenant.metadata as any)?.cargo || '',
      plan: (tenant.metadata as any)?.plan || 'hot_desk',
      estado: tenant.status as any,
      fechaInicio: tenant.createdAt.toISOString(),
      fechaFin: null,
      creditosDisponibles: (tenant.metadata as any)?.creditos || 0,
      pagosAlDia: true,
      foto: null,
      companyId: tenant.companyId,
      createdAt: tenant.createdAt,
      updatedAt: tenant.updatedAt
    };
  }

  static async updateMemberStatus(id: string, estado: string): Promise<void> {
    await prisma.tenant.update({
      where: { id },
      data: { status: estado }
    });
  }

  // ==================== STATS ====================

  static async getStats(companyId: string): Promise<{
    totalEspacios: number;
    espaciosOcupados: number;
    ocupacion: number;
    miembrosActivos: number;
    reservasHoy: number;
    ingresosMes: number;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [
      totalEspacios,
      espaciosOcupados,
      miembrosActivos,
      reservasHoy,
      ingresosMes
    ] = await Promise.all([
      prisma.unit.count({ 
        where: { companyId, type: { in: ['coworking_space', 'oficina'] } } 
      }),
      prisma.unit.count({ 
        where: { companyId, type: { in: ['coworking_space', 'oficina'] }, status: 'ocupada' } 
      }),
      prisma.tenant.count({ 
        where: { 
          companyId, 
          status: 'activo',
          metadata: { path: ['tipoMiembro'], equals: 'coworking' }
        } 
      }),
      prisma.booking.count({
        where: {
          companyId,
          startDate: { gte: today, lt: tomorrow },
          status: { in: ['confirmada', 'pendiente'] }
        }
      }),
      prisma.payment.aggregate({
        where: {
          companyId,
          status: 'pagado',
          paidDate: { gte: startOfMonth }
        },
        _sum: { amount: true }
      })
    ]);

    return {
      totalEspacios,
      espaciosOcupados,
      ocupacion: totalEspacios > 0 ? Math.round((espaciosOcupados / totalEspacios) * 100) : 0,
      miembrosActivos,
      reservasHoy,
      ingresosMes: ingresosMes._sum.amount?.toNumber() || 0
    };
  }
}
