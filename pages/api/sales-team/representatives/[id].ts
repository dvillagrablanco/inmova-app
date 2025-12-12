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

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'ID inválido' });
  }

  try {
    switch (req.method) {
      case 'GET': {
        const representative = await salesTeamService.getSalesRepresentativeById(id);
        
        if (!representative) {
          return res.status(404).json({ error: 'Comercial no encontrado' });
        }

        return res.status(200).json(representative);
      }

      case 'PUT': {
        // Solo admin puede actualizar
        if (session.user.role !== 'super_admin' && session.user.role !== 'administrador') {
          return res.status(403).json({ error: 'No tienes permisos' });
        }

        const data = req.body;
        const representative = await salesTeamService.updateSalesRepresentative(id, data);
        return res.status(200).json(representative);
      }

      case 'DELETE': {
        // Solo super_admin puede eliminar
        if (session.user.role !== 'super_admin') {
          return res.status(403).json({ error: 'No tienes permisos' });
        }

        const { motivoBaja } = req.body;
        const representative = await salesTeamService.updateSalesRepStatus(id, 'CANCELADO' as SalesRepStatus, motivoBaja);
        return res.status(200).json(representative);
      }

      default:
        res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
        return res.status(405).json({ error: `Método ${req.method} no permitido` });
    }
  } catch (error: any) {
    console.error(`Error en /api/sales-team/representatives/${id}:`, error);
    return res.status(500).json({ error: error.message || 'Error interno del servidor' });
  }
}
