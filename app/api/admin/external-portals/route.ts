import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger from '@/lib/logger';
import { Users, Home, Wrench } from 'lucide-react';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Por ahora devolvemos datos de ejemplo
    // En una implementación real, esto vendría de la base de datos
    const portals = [
      {
        id: '1',
        name: 'Portal Inquilinos',
        type: 'inquilino',
        icon: 'Users',
        url: '/portal-inquilino',
        config: {
          enabled: true,
          title: 'Portal del Inquilino',
          description: 'Acceso para inquilinos a pagos, documentos y solicitudes',
          features: {
            payments: true,
            documents: true,
            maintenance: true,
            communications: true,
            reports: true,
          },
          notifications: {
            email: true,
            push: true,
            sms: false,
          },
          branding: {
            primaryColor: '#6366f1',
          },
        },
        stats: {
          totalUsers: 0,
          activeUsers: 0,
          pendingApprovals: 0,
          lastActivity: new Date().toISOString(),
        },
      },
      {
        id: '2',
        name: 'Portal Propietarios',
        type: 'propietario',
        icon: 'Home',
        url: '/portal-propietario',
        config: {
          enabled: true,
          title: 'Portal del Propietario',
          description: 'Acceso para propietarios a reportes financieros y gestión',
          features: {
            payments: true,
            documents: true,
            maintenance: true,
            communications: true,
            reports: true,
          },
          notifications: {
            email: true,
            push: true,
            sms: false,
          },
          branding: {
            primaryColor: '#6366f1',
          },
        },
        stats: {
          totalUsers: 0,
          activeUsers: 0,
          pendingApprovals: 0,
          lastActivity: new Date().toISOString(),
        },
      },
      {
        id: '3',
        name: 'Portal Proveedores',
        type: 'proveedor',
        icon: 'Wrench',
        url: '/portal-proveedor',
        config: {
          enabled: true,
          title: 'Portal del Proveedor',
          description: 'Acceso para proveedores a órdenes de trabajo y facturación',
          features: {
            payments: true,
            documents: true,
            maintenance: true,
            communications: true,
            reports: true,
          },
          notifications: {
            email: true,
            push: false,
            sms: false,
          },
          branding: {
            primaryColor: '#6366f1',
          },
        },
        stats: {
          totalUsers: 0,
          activeUsers: 0,
          pendingApprovals: 0,
          lastActivity: new Date().toISOString(),
        },
      },
    ];

    return NextResponse.json(portals);
  } catch (error) {
    logger.error('Error al obtener portales externos:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
