/**
 * Student Housing Service
 * Servicio para gestión de residencias estudiantiles
 * 
 * Este servicio maneja la lógica de negocio para:
 * - Residentes (estudiantes)
 * - Habitaciones y camas
 * - Aplicaciones/Solicitudes
 * - Actividades y eventos
 * - Pagos de residencia
 * - Mantenimiento
 */

import { prisma } from '@/lib/db';

// Tipos para Student Housing
export interface StudentResident {
  id: string;
  nombre: string;
  apellidos: string;
  email: string;
  telefono: string;
  dni: string;
  fechaNacimiento: string;
  universidad: string;
  carrera: string;
  curso: number;
  habitacionId: string;
  habitacion: string;
  edificio: string;
  fechaIngreso: string;
  fechaFinContrato: string;
  estado: 'activo' | 'inactivo' | 'pendiente' | 'reserva';
  becado: boolean;
  contactoEmergencia: {
    nombre: string;
    telefono: string;
    relacion: string;
  };
  pagosAlDia: boolean;
  companyId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface StudentRoom {
  id: string;
  numero: string;
  edificio: string;
  planta: number;
  tipo: 'individual' | 'doble' | 'triple' | 'suite';
  capacidad: number;
  ocupacion: number;
  precio: number;
  estado: 'disponible' | 'ocupada' | 'mantenimiento' | 'reservada';
  amenities: string[];
  superficie: number;
  banoPrivado: boolean;
  companyId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface StudentApplication {
  id: string;
  solicitanteNombre: string;
  solicitanteEmail: string;
  solicitanteTelefono: string;
  universidad: string;
  carrera: string;
  curso: number;
  tipoHabitacion: string;
  fechaDeseada: string;
  estado: 'pendiente' | 'revision' | 'aprobada' | 'rechazada' | 'lista_espera';
  prioridad: number;
  documentos: string[];
  notas: string;
  companyId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface StudentActivity {
  id: string;
  titulo: string;
  descripcion: string;
  categoria: 'social' | 'academico' | 'deportivo' | 'cultural' | 'otro';
  fecha: string;
  horaInicio: string;
  horaFin: string;
  ubicacion: string;
  capacidad: number;
  inscritos: number;
  estado: 'programada' | 'en_curso' | 'completada' | 'cancelada';
  organizador: string;
  precio: number;
  requiereInscripcion: boolean;
  companyId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface StudentPayment {
  id: string;
  residenteId: string;
  residenteNombre: string;
  habitacion: string;
  concepto: string;
  mes: string;
  importe: number;
  fechaVencimiento: string;
  fechaPago: string | null;
  estado: 'pendiente' | 'pagado' | 'vencido' | 'parcial';
  metodoPago: string | null;
  companyId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface StudentMaintenanceRequest {
  id: string;
  titulo: string;
  descripcion: string;
  categoria: 'electricidad' | 'fontaneria' | 'climatizacion' | 'mobiliario' | 'limpieza' | 'otro';
  habitacion: string;
  edificio: string;
  reportadoPor: string;
  prioridad: 'baja' | 'media' | 'alta' | 'urgente';
  estado: 'pendiente' | 'asignada' | 'en_progreso' | 'completada' | 'cancelada';
  asignadoA: string | null;
  fechaReporte: string;
  fechaResolucion: string | null;
  comentarios: { autor: string; texto: string; fecha: string }[];
  companyId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Clase del servicio
export class StudentHousingService {
  
  // ==================== RESIDENTS ====================
  
  static async getResidents(companyId: string, filters?: {
    estado?: string;
    edificio?: string;
    search?: string;
  }): Promise<StudentResident[]> {
    // Usar tabla Tenant existente con filtro de tipo "student"
    const tenants = await prisma.tenant.findMany({
      where: {
        companyId,
        ...(filters?.estado && { status: filters.estado }),
        ...(filters?.search && {
          OR: [
            { firstName: { contains: filters.search, mode: 'insensitive' } },
            { lastName: { contains: filters.search, mode: 'insensitive' } },
            { email: { contains: filters.search, mode: 'insensitive' } },
          ]
        })
      },
      include: {
        contracts: {
          where: { status: 'activo' },
          include: { unit: { include: { building: true } } },
          take: 1
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return tenants.map(t => ({
      id: t.id,
      nombre: t.firstName,
      apellidos: t.lastName,
      email: t.email,
      telefono: t.phone || '',
      dni: t.dni || '',
      fechaNacimiento: '',
      universidad: (t.metadata as any)?.universidad || '',
      carrera: (t.metadata as any)?.carrera || '',
      curso: (t.metadata as any)?.curso || 1,
      habitacionId: t.contracts[0]?.unit?.id || '',
      habitacion: t.contracts[0]?.unit?.name || '',
      edificio: t.contracts[0]?.unit?.building?.name || '',
      fechaIngreso: t.contracts[0]?.startDate?.toISOString() || '',
      fechaFinContrato: t.contracts[0]?.endDate?.toISOString() || '',
      estado: t.status as any || 'activo',
      becado: (t.metadata as any)?.becado || false,
      contactoEmergencia: {
        nombre: (t.metadata as any)?.contactoEmergencia?.nombre || '',
        telefono: (t.metadata as any)?.contactoEmergencia?.telefono || '',
        relacion: (t.metadata as any)?.contactoEmergencia?.relacion || ''
      },
      pagosAlDia: true,
      companyId: t.companyId,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt
    }));
  }

  static async createResident(data: Partial<StudentResident> & { companyId: string }): Promise<StudentResident> {
    const tenant = await prisma.tenant.create({
      data: {
        companyId: data.companyId,
        firstName: data.nombre || '',
        lastName: data.apellidos || '',
        email: data.email || '',
        phone: data.telefono,
        dni: data.dni,
        status: data.estado || 'activo',
        metadata: {
          universidad: data.universidad,
          carrera: data.carrera,
          curso: data.curso,
          becado: data.becado,
          contactoEmergencia: data.contactoEmergencia,
          tipoResidente: 'estudiante'
        }
      }
    });

    return {
      id: tenant.id,
      nombre: tenant.firstName,
      apellidos: tenant.lastName,
      email: tenant.email,
      telefono: tenant.phone || '',
      dni: tenant.dni || '',
      fechaNacimiento: '',
      universidad: (tenant.metadata as any)?.universidad || '',
      carrera: (tenant.metadata as any)?.carrera || '',
      curso: (tenant.metadata as any)?.curso || 1,
      habitacionId: '',
      habitacion: '',
      edificio: '',
      fechaIngreso: '',
      fechaFinContrato: '',
      estado: tenant.status as any,
      becado: (tenant.metadata as any)?.becado || false,
      contactoEmergencia: (tenant.metadata as any)?.contactoEmergencia || {},
      pagosAlDia: true,
      companyId: tenant.companyId,
      createdAt: tenant.createdAt,
      updatedAt: tenant.updatedAt
    };
  }

  // ==================== ROOMS ====================

  static async getRooms(companyId: string, filters?: {
    estado?: string;
    edificio?: string;
    tipo?: string;
  }): Promise<StudentRoom[]> {
    const units = await prisma.unit.findMany({
      where: {
        companyId,
        ...(filters?.estado && { status: filters.estado }),
        building: filters?.edificio ? { name: filters.edificio } : undefined
      },
      include: {
        building: true,
        contracts: {
          where: { status: 'activo' }
        }
      },
      orderBy: { name: 'asc' }
    });

    return units.map(u => ({
      id: u.id,
      numero: u.name,
      edificio: u.building?.name || '',
      planta: (u.metadata as any)?.planta || 1,
      tipo: (u.metadata as any)?.tipoHabitacion || 'individual',
      capacidad: (u.metadata as any)?.capacidad || 1,
      ocupacion: u.contracts.length,
      precio: u.rentAmount?.toNumber() || 0,
      estado: u.status === 'ocupada' ? 'ocupada' : u.status === 'en_mantenimiento' ? 'mantenimiento' : 'disponible',
      amenities: (u.metadata as any)?.amenities || [],
      superficie: u.size || 0,
      banoPrivado: (u.metadata as any)?.banoPrivado || false,
      companyId: u.companyId,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt
    }));
  }

  static async updateRoomStatus(roomId: string, status: string): Promise<void> {
    await prisma.unit.update({
      where: { id: roomId },
      data: { status: status as any }
    });
  }

  // ==================== APPLICATIONS ====================

  static async getApplications(companyId: string, filters?: {
    estado?: string;
  }): Promise<StudentApplication[]> {
    // Usar tabla Lead o crear una vista específica
    const leads = await prisma.lead.findMany({
      where: {
        companyId,
        source: 'student_application',
        ...(filters?.estado && { status: filters.estado })
      },
      orderBy: { createdAt: 'desc' }
    });

    return leads.map(l => ({
      id: l.id,
      solicitanteNombre: l.name,
      solicitanteEmail: l.email,
      solicitanteTelefono: l.phone || '',
      universidad: (l.metadata as any)?.universidad || '',
      carrera: (l.metadata as any)?.carrera || '',
      curso: (l.metadata as any)?.curso || 1,
      tipoHabitacion: (l.metadata as any)?.tipoHabitacion || '',
      fechaDeseada: (l.metadata as any)?.fechaDeseada || '',
      estado: l.status as any || 'pendiente',
      prioridad: (l.metadata as any)?.prioridad || 1,
      documentos: (l.metadata as any)?.documentos || [],
      notas: l.notes || '',
      companyId: l.companyId,
      createdAt: l.createdAt,
      updatedAt: l.updatedAt
    }));
  }

  static async createApplication(data: Partial<StudentApplication> & { companyId: string }): Promise<StudentApplication> {
    const lead = await prisma.lead.create({
      data: {
        companyId: data.companyId,
        name: data.solicitanteNombre || '',
        email: data.solicitanteEmail || '',
        phone: data.solicitanteTelefono,
        source: 'student_application',
        status: data.estado || 'pendiente',
        notes: data.notas,
        metadata: {
          universidad: data.universidad,
          carrera: data.carrera,
          curso: data.curso,
          tipoHabitacion: data.tipoHabitacion,
          fechaDeseada: data.fechaDeseada,
          prioridad: data.prioridad,
          documentos: data.documentos
        }
      }
    });

    return {
      id: lead.id,
      solicitanteNombre: lead.name,
      solicitanteEmail: lead.email,
      solicitanteTelefono: lead.phone || '',
      universidad: (lead.metadata as any)?.universidad || '',
      carrera: (lead.metadata as any)?.carrera || '',
      curso: (lead.metadata as any)?.curso || 1,
      tipoHabitacion: (lead.metadata as any)?.tipoHabitacion || '',
      fechaDeseada: (lead.metadata as any)?.fechaDeseada || '',
      estado: lead.status as any,
      prioridad: (lead.metadata as any)?.prioridad || 1,
      documentos: (lead.metadata as any)?.documentos || [],
      notas: lead.notes || '',
      companyId: lead.companyId,
      createdAt: lead.createdAt,
      updatedAt: lead.updatedAt
    };
  }

  static async updateApplicationStatus(id: string, estado: string): Promise<void> {
    await prisma.lead.update({
      where: { id },
      data: { status: estado }
    });
  }

  // ==================== ACTIVITIES ====================

  static async getActivities(companyId: string, filters?: {
    categoria?: string;
    estado?: string;
  }): Promise<StudentActivity[]> {
    const events = await prisma.event.findMany({
      where: {
        companyId,
        ...(filters?.categoria && {
          metadata: {
            path: ['categoria'],
            equals: filters.categoria
          }
        }),
        ...(filters?.estado && { status: filters.estado })
      },
      orderBy: { startDate: 'desc' }
    });

    return events.map(e => ({
      id: e.id,
      titulo: e.title,
      descripcion: e.description || '',
      categoria: (e.metadata as any)?.categoria || 'otro',
      fecha: e.startDate.toISOString().split('T')[0],
      horaInicio: e.startDate.toISOString().split('T')[1]?.substring(0, 5) || '',
      horaFin: e.endDate?.toISOString().split('T')[1]?.substring(0, 5) || '',
      ubicacion: e.location || '',
      capacidad: (e.metadata as any)?.capacidad || 0,
      inscritos: (e.metadata as any)?.inscritos || 0,
      estado: e.status as any || 'programada',
      organizador: (e.metadata as any)?.organizador || '',
      precio: (e.metadata as any)?.precio || 0,
      requiereInscripcion: (e.metadata as any)?.requiereInscripcion || false,
      companyId: e.companyId,
      createdAt: e.createdAt,
      updatedAt: e.updatedAt
    }));
  }

  static async createActivity(data: Partial<StudentActivity> & { companyId: string }): Promise<StudentActivity> {
    const startDate = new Date(`${data.fecha}T${data.horaInicio || '00:00'}:00`);
    const endDate = data.horaFin ? new Date(`${data.fecha}T${data.horaFin}:00`) : startDate;

    const event = await prisma.event.create({
      data: {
        companyId: data.companyId,
        title: data.titulo || '',
        description: data.descripcion,
        location: data.ubicacion,
        startDate,
        endDate,
        status: data.estado || 'programada',
        metadata: {
          categoria: data.categoria,
          capacidad: data.capacidad,
          inscritos: 0,
          organizador: data.organizador,
          precio: data.precio,
          requiereInscripcion: data.requiereInscripcion,
          tipo: 'student_activity'
        }
      }
    });

    return {
      id: event.id,
      titulo: event.title,
      descripcion: event.description || '',
      categoria: (event.metadata as any)?.categoria || 'otro',
      fecha: event.startDate.toISOString().split('T')[0],
      horaInicio: event.startDate.toISOString().split('T')[1]?.substring(0, 5) || '',
      horaFin: event.endDate?.toISOString().split('T')[1]?.substring(0, 5) || '',
      ubicacion: event.location || '',
      capacidad: (event.metadata as any)?.capacidad || 0,
      inscritos: (event.metadata as any)?.inscritos || 0,
      estado: event.status as any,
      organizador: (event.metadata as any)?.organizador || '',
      precio: (event.metadata as any)?.precio || 0,
      requiereInscripcion: (event.metadata as any)?.requiereInscripcion || false,
      companyId: event.companyId,
      createdAt: event.createdAt,
      updatedAt: event.updatedAt
    };
  }

  // ==================== PAYMENTS ====================

  static async getPayments(companyId: string, filters?: {
    estado?: string;
    mes?: string;
  }): Promise<StudentPayment[]> {
    const payments = await prisma.payment.findMany({
      where: {
        companyId,
        ...(filters?.estado && { status: filters.estado })
      },
      include: {
        tenant: true,
        contract: {
          include: {
            unit: true
          }
        }
      },
      orderBy: { dueDate: 'desc' }
    });

    return payments.map(p => ({
      id: p.id,
      residenteId: p.tenantId || '',
      residenteNombre: p.tenant ? `${p.tenant.firstName} ${p.tenant.lastName}` : '',
      habitacion: p.contract?.unit?.name || '',
      concepto: p.concept || 'Mensualidad',
      mes: p.dueDate?.toISOString().substring(0, 7) || '',
      importe: p.amount.toNumber(),
      fechaVencimiento: p.dueDate?.toISOString() || '',
      fechaPago: p.paidDate?.toISOString() || null,
      estado: p.status as any || 'pendiente',
      metodoPago: p.paymentMethod,
      companyId: p.companyId,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt
    }));
  }

  static async updatePaymentStatus(id: string, estado: string, metodoPago?: string): Promise<void> {
    await prisma.payment.update({
      where: { id },
      data: {
        status: estado,
        paymentMethod: metodoPago,
        paidDate: estado === 'pagado' ? new Date() : null
      }
    });
  }

  // ==================== MAINTENANCE ====================

  static async getMaintenanceRequests(companyId: string, filters?: {
    estado?: string;
    prioridad?: string;
  }): Promise<StudentMaintenanceRequest[]> {
    const requests = await prisma.maintenanceRequest.findMany({
      where: {
        companyId,
        ...(filters?.estado && { status: filters.estado }),
        ...(filters?.prioridad && { priority: filters.prioridad })
      },
      include: {
        unit: {
          include: { building: true }
        },
        reporter: true,
        assignedTo: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return requests.map(r => ({
      id: r.id,
      titulo: r.title,
      descripcion: r.description || '',
      categoria: (r.metadata as any)?.categoria || 'otro',
      habitacion: r.unit?.name || '',
      edificio: r.unit?.building?.name || '',
      reportadoPor: r.reporter ? `${r.reporter.name}` : '',
      prioridad: r.priority as any || 'media',
      estado: r.status as any || 'pendiente',
      asignadoA: r.assignedTo?.name || null,
      fechaReporte: r.createdAt.toISOString(),
      fechaResolucion: r.resolvedAt?.toISOString() || null,
      comentarios: (r.metadata as any)?.comentarios || [],
      companyId: r.companyId,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt
    }));
  }

  static async createMaintenanceRequest(data: Partial<StudentMaintenanceRequest> & { 
    companyId: string;
    unitId?: string;
    reporterId?: string;
  }): Promise<StudentMaintenanceRequest> {
    const request = await prisma.maintenanceRequest.create({
      data: {
        companyId: data.companyId,
        title: data.titulo || '',
        description: data.descripcion,
        priority: data.prioridad || 'media',
        status: data.estado || 'pendiente',
        unitId: data.unitId,
        reporterId: data.reporterId,
        metadata: {
          categoria: data.categoria,
          comentarios: []
        }
      },
      include: {
        unit: { include: { building: true } },
        reporter: true
      }
    });

    return {
      id: request.id,
      titulo: request.title,
      descripcion: request.description || '',
      categoria: (request.metadata as any)?.categoria || 'otro',
      habitacion: request.unit?.name || '',
      edificio: request.unit?.building?.name || '',
      reportadoPor: request.reporter?.name || '',
      prioridad: request.priority as any,
      estado: request.status as any,
      asignadoA: null,
      fechaReporte: request.createdAt.toISOString(),
      fechaResolucion: null,
      comentarios: [],
      companyId: request.companyId,
      createdAt: request.createdAt,
      updatedAt: request.updatedAt
    };
  }

  static async updateMaintenanceStatus(id: string, estado: string, asignadoA?: string): Promise<void> {
    await prisma.maintenanceRequest.update({
      where: { id },
      data: {
        status: estado,
        assignedToId: asignadoA,
        resolvedAt: estado === 'completada' ? new Date() : null
      }
    });
  }

  // ==================== STATS ====================

  static async getStats(companyId: string): Promise<{
    totalResidentes: number;
    residenciaOcupacion: number;
    totalHabitaciones: number;
    habitacionesDisponibles: number;
    aplicacionesPendientes: number;
    actividadesProximas: number;
    pagosPendientes: number;
    incidenciasAbiertas: number;
  }> {
    const [
      totalResidentes,
      totalHabitaciones,
      habitacionesOcupadas,
      aplicacionesPendientes,
      actividadesProximas,
      pagosPendientes,
      incidenciasAbiertas
    ] = await Promise.all([
      prisma.tenant.count({ where: { companyId, status: 'activo' } }),
      prisma.unit.count({ where: { companyId } }),
      prisma.unit.count({ where: { companyId, status: 'ocupada' } }),
      prisma.lead.count({ where: { companyId, source: 'student_application', status: 'pendiente' } }),
      prisma.event.count({ 
        where: { 
          companyId, 
          startDate: { gte: new Date() },
          metadata: { path: ['tipo'], equals: 'student_activity' }
        } 
      }),
      prisma.payment.count({ where: { companyId, status: 'pendiente' } }),
      prisma.maintenanceRequest.count({ 
        where: { 
          companyId, 
          status: { in: ['pendiente', 'asignada', 'en_progreso'] } 
        } 
      })
    ]);

    return {
      totalResidentes,
      residenciaOcupacion: totalHabitaciones > 0 ? Math.round((habitacionesOcupadas / totalHabitaciones) * 100) : 0,
      totalHabitaciones,
      habitacionesDisponibles: totalHabitaciones - habitacionesOcupadas,
      aplicacionesPendientes,
      actividadesProximas,
      pagosPendientes,
      incidenciasAbiertas
    };
  }
}
