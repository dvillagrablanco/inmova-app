import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-options';
import salesTeamService from '@/lib/services/sales-team-service';
import type { SalesRepStatus } from '@prisma/client';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  // Solo admin y super_admin pueden acceder
  if (session.user.role !== 'super_admin' && session.user.role !== 'administrador') {
    return res.status(403).json({ error: 'No tienes permisos para acceder a esta funcionalidad' });
  }

  try {
    switch (req.method) {
      case 'GET': {
        const { estado, activo, search } = req.query;
        
        const filters: any = {};
        if (estado) filters.estado = estado as SalesRepStatus;
        if (activo !== undefined) filters.activo = activo === 'true';
        if (search) filters.search = search as string;

        const representatives = await salesTeamService.getSalesRepresentatives(filters);
        return res.status(200).json(representatives);
      }

      case 'POST': {
        const data = req.body;
        
        if (!data.nombre || !data.apellidos || !data.dni || !data.email || !data.telefono || !data.password) {
          return res.status(400).json({ error: 'Datos incompletos' });
        }

        const representative = await salesTeamService.createSalesRepresentative(data);
        return res.status(201).json(representative);
      }

      default:
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).json({ error: `Método ${req.method} no permitido` });
    }
  } catch (error: any) {
    console.error('Error en /api/sales-team/representatives:', error);
    return res.status(500).json({ error: error.message || 'Error interno del servidor' });
  }
}
