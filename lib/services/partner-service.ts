/**
 * Servicio de Partners
 * Gestiona partners, branding personalizado y red comercial externa
 */

import { prisma } from '@/lib/db';
import type { Partner, PartnerType, PartnerStatus } from '@prisma/client';

export interface PartnerBranding {
  nombre: string;
  logo?: string;
  logoHeader?: string;
  logoFooter?: string;
  coloresPrimarios?: {
    primary?: string;
    secondary?: string;
    accent?: string;
  };
  mensajeBienvenida?: string;
  dominioPersonalizado?: string;
}

export interface CreatePartnerData {
  nombre: string;
  razonSocial: string;
  cif: string;
  email: string;
  password: string;
  codigo?: string;
  tipo?: PartnerType;
  contactoNombre: string;
  contactoEmail: string;
  contactoTelefono?: string;
  sitioWeb?: string;
}

export class PartnerService {
  static async getPartnerByCode(codigo: string): Promise<Partner | null> {
    try {
      const partner = await prisma.partner.findUnique({
        where: { codigo },
      });
      return partner;
    } catch (error) {
      console.error('Error al obtener partner por código:', error);
      return null;
    }
  }

  static async getPartnerById(id: string): Promise<Partner | null> {
    try {
      const partner = await prisma.partner.findUnique({
        where: { id },
        include: {
          salesReps: true,
          leads: true,
        },
      });
      return partner;
    } catch (error) {
      console.error('Error al obtener partner por ID:', error);
      return null;
    }
  }

  static async getPartnerBranding(codigo: string): Promise<PartnerBranding | null> {
    try {
      const partner = await this.getPartnerByCode(codigo);
      
      if (!partner || !partner.activo) {
        return null;
      }

      return {
        nombre: partner.nombre,
        logo: partner.logo || undefined,
        logoHeader: partner.logoHeader || undefined,
        logoFooter: partner.logoFooter || undefined,
        coloresPrimarios: partner.coloresPrimarios as any,
        mensajeBienvenida: partner.mensajeBienvenida || undefined,
        dominioPersonalizado: partner.dominioPersonalizado || undefined,
      };
    } catch (error) {
      console.error('Error al obtener branding del partner:', error);
      return null;
    }
  }

  static async listActivePartners(): Promise<Partner[]> {
    try {
      const partners = await prisma.partner.findMany({
        where: {
          activo: true,
          estado: 'ACTIVE',
        },
        orderBy: {
          nombre: 'asc',
        },
      });
      return partners;
    } catch (error) {
      console.error('Error al listar partners activos:', error);
      return [];
    }
  }

  static async createPartner(data: CreatePartnerData): Promise<Partner> {
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(data.password, 10);

    const partner = await prisma.partner.create({
      data: {
        nombre: data.nombre,
        razonSocial: data.razonSocial,
        cif: data.cif,
        email: data.email,
        password: hashedPassword,
        codigo: data.codigo || this.generatePartnerCode(data.nombre),
        tipo: data.tipo || 'BANCO',
        contactoNombre: data.contactoNombre,
        contactoEmail: data.contactoEmail,
        contactoTelefono: data.contactoTelefono,
        sitioWeb: data.sitioWeb,
        estado: 'PENDING',
      },
    });

    return partner;
  }

  static async updatePartnerBranding(
    partnerId: string,
    branding: Partial<PartnerBranding>
  ): Promise<Partner> {
    const partner = await prisma.partner.update({
      where: { id: partnerId },
      data: {
        logo: branding.logo,
        logoHeader: branding.logoHeader,
        logoFooter: branding.logoFooter,
        coloresPrimarios: branding.coloresPrimarios as any,
        mensajeBienvenida: branding.mensajeBienvenida,
        dominioPersonalizado: branding.dominioPersonalizado,
      },
    });

    return partner;
  }

  static async trackPartnerLead(partnerId: string, leadId: string): Promise<void> {
    try {
      await prisma.salesLead.update({
        where: { id: leadId },
        data: { partnerId },
      });

      await prisma.partner.update({
        where: { id: partnerId },
        data: {
          totalLeads: { increment: 1 },
        },
      });
    } catch (error) {
      console.error('Error al registrar lead de partner:', error);
      throw error;
    }
  }

  static async trackPartnerConversion(partnerId: string): Promise<void> {
    try {
      await prisma.partner.update({
        where: { id: partnerId },
        data: {
          totalConversiones: { increment: 1 },
        },
      });
    } catch (error) {
      console.error('Error al registrar conversión de partner:', error);
      throw error;
    }
  }

  private static generatePartnerCode(nombre: string): string {
    const normalized = nombre
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    const timestamp = Date.now().toString(36).slice(-4);
    return `${normalized}-${timestamp}`;
  }

  static async validatePartnerCredentials(
    email: string,
    password: string
  ): Promise<Partner | null> {
    try {
      const partner = await prisma.partner.findUnique({
        where: { email },
      });

      if (!partner || !partner.activo) {
        return null;
      }

      const bcrypt = require('bcryptjs');
      const isValid = await bcrypt.compare(password, partner.password);

      return isValid ? partner : null;
    } catch (error) {
      console.error('Error al validar credenciales de partner:', error);
      return null;
    }
  }
}
