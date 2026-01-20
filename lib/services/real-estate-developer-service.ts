/**
 * Real Estate Developer Service
 * Servicio para gestión de promociones inmobiliarias
 */

import { prisma } from '@/lib/db';

export interface DevelopmentProject {
  id: string;
  nombre: string;
  ubicacion: string;
  tipoProyecto: 'residencial' | 'comercial' | 'mixto';
  estado: 'planificacion' | 'en_construccion' | 'comercializacion' | 'entregado';
  totalUnidades: number;
  unidadesVendidas: number;
  unidadesReservadas: number;
  precioDesde: number;
  precioHasta: number;
  fechaInicio: string;
  fechaEntregaEstimada: string;
  avanceObra: number;
  presupuesto: number;
  gastoActual: number;
  descripcion: string;
  imagenes: string[];
  companyId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectSale {
  id: string;
  proyectoId: string;
  proyectoNombre: string;
  unidad: string;
  compradorNombre: string;
  compradorEmail: string;
  compradorTelefono: string;
  precio: number;
  entrada: number;
  estadoPago: 'reserva' | 'senalizada' | 'contrato' | 'escriturada' | 'entregada' | 'cancelada';
  fechaReserva: string;
  fechaContrato: string | null;
  fechaEntrega: string | null;
  comercialAsignado: string;
  notas: string;
  companyId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MarketingCampaign {
  id: string;
  nombre: string;
  proyectoId: string;
  proyectoNombre: string;
  tipo: 'digital' | 'offline' | 'evento' | 'prensa';
  estado: 'planificada' | 'activa' | 'pausada' | 'finalizada';
  presupuesto: number;
  gastoActual: number;
  fechaInicio: string;
  fechaFin: string;
  visitas: number;
  leads: number;
  conversiones: number;
  roi: number;
  canales: string[];
  descripcion: string;
  companyId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CommercialAgent {
  id: string;
  nombre: string;
  email: string;
  telefono: string;
  proyectosAsignados: string[];
  ventasMes: number;
  objetivoMes: number;
  comisionAcumulada: number;
  estado: 'activo' | 'inactivo';
  proximasCitas: number;
  companyId: string;
  createdAt: Date;
  updatedAt: Date;
}

export class RealEstateDeveloperService {
  
  static async getProjects(companyId: string, filters?: {
    estado?: string;
    tipoProyecto?: string;
  }): Promise<DevelopmentProject[]> {
    // Usar Building con tipo desarrollo
    const buildings = await prisma.building.findMany({
      where: {
        companyId,
        ...(filters?.estado && { 
          metadata: { path: ['estadoProyecto'], equals: filters.estado }
        })
      },
      include: {
        units: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return buildings.map(b => {
      const unidades = b.units || [];
      const vendidas = unidades.filter(u => (u.metadata as any)?.estadoVenta === 'vendida').length;
      const reservadas = unidades.filter(u => (u.metadata as any)?.estadoVenta === 'reservada').length;
      
      return {
        id: b.id,
        nombre: b.name,
        ubicacion: b.address || '',
        tipoProyecto: (b.metadata as any)?.tipoProyecto || 'residencial',
        estado: (b.metadata as any)?.estadoProyecto || 'planificacion',
        totalUnidades: unidades.length,
        unidadesVendidas: vendidas,
        unidadesReservadas: reservadas,
        precioDesde: Math.min(...unidades.map(u => u.rentAmount?.toNumber() || 0)) || 0,
        precioHasta: Math.max(...unidades.map(u => u.rentAmount?.toNumber() || 0)) || 0,
        fechaInicio: (b.metadata as any)?.fechaInicio || b.createdAt.toISOString(),
        fechaEntregaEstimada: (b.metadata as any)?.fechaEntrega || '',
        avanceObra: (b.metadata as any)?.avanceObra || 0,
        presupuesto: (b.metadata as any)?.presupuesto || 0,
        gastoActual: (b.metadata as any)?.gastoActual || 0,
        descripcion: b.description || '',
        imagenes: (b.metadata as any)?.imagenes || [],
        companyId: b.companyId,
        createdAt: b.createdAt,
        updatedAt: b.updatedAt
      };
    });
  }

  static async createProject(data: Partial<DevelopmentProject> & { companyId: string }): Promise<DevelopmentProject> {
    const building = await prisma.building.create({
      data: {
        companyId: data.companyId,
        name: data.nombre || '',
        address: data.ubicacion,
        description: data.descripcion,
        metadata: {
          tipoProyecto: data.tipoProyecto,
          estadoProyecto: data.estado || 'planificacion',
          fechaInicio: data.fechaInicio,
          fechaEntrega: data.fechaEntregaEstimada,
          avanceObra: 0,
          presupuesto: data.presupuesto,
          gastoActual: 0,
          imagenes: data.imagenes
        }
      }
    });

    return {
      id: building.id,
      nombre: building.name,
      ubicacion: building.address || '',
      tipoProyecto: (building.metadata as any)?.tipoProyecto || 'residencial',
      estado: (building.metadata as any)?.estadoProyecto || 'planificacion',
      totalUnidades: 0,
      unidadesVendidas: 0,
      unidadesReservadas: 0,
      precioDesde: 0,
      precioHasta: 0,
      fechaInicio: (building.metadata as any)?.fechaInicio || '',
      fechaEntregaEstimada: (building.metadata as any)?.fechaEntrega || '',
      avanceObra: 0,
      presupuesto: (building.metadata as any)?.presupuesto || 0,
      gastoActual: 0,
      descripcion: building.description || '',
      imagenes: (building.metadata as any)?.imagenes || [],
      companyId: building.companyId,
      createdAt: building.createdAt,
      updatedAt: building.updatedAt
    };
  }

  static async getSales(companyId: string, filters?: {
    proyectoId?: string;
    estadoPago?: string;
  }): Promise<ProjectSale[]> {
    const contracts = await prisma.contract.findMany({
      where: {
        companyId,
        metadata: {
          path: ['tipoContrato'],
          equals: 'venta_promocion'
        },
        ...(filters?.estadoPago && { status: filters.estadoPago })
      },
      include: {
        tenant: true,
        unit: { include: { building: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return contracts.map(c => ({
      id: c.id,
      proyectoId: c.unit?.buildingId || '',
      proyectoNombre: c.unit?.building?.name || '',
      unidad: c.unit?.name || '',
      compradorNombre: c.tenant ? `${c.tenant.firstName} ${c.tenant.lastName}` : '',
      compradorEmail: c.tenant?.email || '',
      compradorTelefono: c.tenant?.phone || '',
      precio: (c.metadata as any)?.precioVenta || c.rent?.toNumber() || 0,
      entrada: (c.metadata as any)?.entrada || 0,
      estadoPago: c.status as any || 'reserva',
      fechaReserva: c.createdAt.toISOString(),
      fechaContrato: c.startDate?.toISOString() || null,
      fechaEntrega: c.endDate?.toISOString() || null,
      comercialAsignado: (c.metadata as any)?.comercialAsignado || '',
      notas: (c.metadata as any)?.notas || '',
      companyId: c.companyId,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt
    }));
  }

  static async getCampaigns(companyId: string, filters?: {
    proyectoId?: string;
    estado?: string;
  }): Promise<MarketingCampaign[]> {
    const events = await prisma.event.findMany({
      where: {
        companyId,
        metadata: {
          path: ['tipo'],
          equals: 'marketing_campaign'
        },
        ...(filters?.estado && { status: filters.estado })
      },
      orderBy: { createdAt: 'desc' }
    });

    return events.map(e => ({
      id: e.id,
      nombre: e.title,
      proyectoId: (e.metadata as any)?.proyectoId || '',
      proyectoNombre: (e.metadata as any)?.proyectoNombre || '',
      tipo: (e.metadata as any)?.tipoCampana || 'digital',
      estado: e.status as any || 'planificada',
      presupuesto: (e.metadata as any)?.presupuesto || 0,
      gastoActual: (e.metadata as any)?.gastoActual || 0,
      fechaInicio: e.startDate.toISOString(),
      fechaFin: e.endDate?.toISOString() || '',
      visitas: (e.metadata as any)?.visitas || 0,
      leads: (e.metadata as any)?.leads || 0,
      conversiones: (e.metadata as any)?.conversiones || 0,
      roi: (e.metadata as any)?.roi || 0,
      canales: (e.metadata as any)?.canales || [],
      descripcion: e.description || '',
      companyId: e.companyId,
      createdAt: e.createdAt,
      updatedAt: e.updatedAt
    }));
  }

  static async getCommercialTeam(companyId: string): Promise<CommercialAgent[]> {
    const users = await prisma.user.findMany({
      where: {
        companyId,
        role: { in: ['comercial', 'gestor'] }
      },
      orderBy: { name: 'asc' }
    });

    return users.map(u => ({
      id: u.id,
      nombre: u.name,
      email: u.email,
      telefono: (u.metadata as any)?.telefono || '',
      proyectosAsignados: (u.metadata as any)?.proyectosAsignados || [],
      ventasMes: (u.metadata as any)?.ventasMes || 0,
      objetivoMes: (u.metadata as any)?.objetivoMes || 5,
      comisionAcumulada: (u.metadata as any)?.comisionAcumulada || 0,
      estado: u.activo ? 'activo' : 'inactivo',
      proximasCitas: (u.metadata as any)?.proximasCitas || 0,
      companyId: u.companyId,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt
    }));
  }

  static async getStats(companyId: string): Promise<{
    proyectosActivos: number;
    totalVentas: number;
    unidadesVendidas: number;
    margenPromedio: number;
    leadsActivos: number;
    conversionRate: number;
  }> {
    const [proyectosActivos, totalVentas, leadsActivos] = await Promise.all([
      prisma.building.count({
        where: {
          companyId,
          metadata: {
            path: ['estadoProyecto'],
            string_contains: 'construccion'
          }
        }
      }),
      prisma.contract.count({
        where: {
          companyId,
          metadata: { path: ['tipoContrato'], equals: 'venta_promocion' },
          status: { in: ['escriturada', 'entregada'] }
        }
      }),
      prisma.lead.count({
        where: { companyId, status: { in: ['nuevo', 'contactado', 'calificado'] } }
      })
    ]);

    return {
      proyectosActivos,
      totalVentas,
      unidadesVendidas: totalVentas,
      margenPromedio: 18,
      leadsActivos,
      conversionRate: leadsActivos > 0 ? Math.round((totalVentas / leadsActivos) * 100) : 0
    };
  }
}
